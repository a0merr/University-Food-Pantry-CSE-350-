// Security rules, boundary times, odd input, concurrency and known bugs.
// Tests marked { todo: 'Known bug: ...' } describe the behaviour the site
// SHOULD have. They report as TODO without failing the run; when the bug is
// fixed they start passing and the todo option can be removed.
import test from 'node:test';

// The DST tests below use US Eastern dates, so pin the time zone (this file runs in its own process).
process.env.TZ = 'America/New_York';
import assert from 'node:assert/strict';
import express from 'express';

import { openDatabase } from '../../src/db.js';
import { authRoutes } from '../../src/auth/routes.js';
import { hashPassword } from '../../src/auth/passwords.js';
import { pickupRoutes } from '../../src/routes/pickups.js';
import { staffRoutes } from '../../src/routes/staff.js';
import { inventoryRoutes } from '../../src/routes/inventory.js';
import { createItem, updateItem } from '../../src/services/inventory.js';
import { schedule, queue } from '../../src/services/pickups.js';
import { createSlot } from '../../src/services/slots.js';
import { sendDueReminders } from '../../src/services/reminders.js';
import { pickupReport } from '../../src/services/reports.js';
import { parseLocalIso, toLocalIso } from '../../src/lib/time.js';
import { addItem, addSlot, addUser, addUserSession, appWith, start, call, fixedClock } from '../helpers.js';

// The pantry runs in US Eastern time; pin it so DST tests mean the same thing everywhere.
process.env.TZ = 'America/New_York';

async function withServer(mounts, fn, { trustProxy = false } = {}) {
  const db = openDatabase();
  const app = express();
  if (trustProxy) app.set('trust proxy', 1);
  const inner = appWith(mounts(db));
  app.use(inner);
  const { server, url } = await start(app);
  try {
    await fn({ db, url });
  } finally {
    server.close();
    db.close();
  }
}

// ---- login rate limit ----

test('login lockout lifts after the 15-minute window', async (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: Date.parse('2026-11-12T10:00:00Z') });
  await withServer((db) => [['/api/auth', authRoutes(db)]], async ({ db, url }) => {
    addUser(db, { email: 'window@example.edu', passwordHash: hashPassword('RightPass1') });
    const attempt = (password) => call(url, '/api/auth/login', {
      method: 'POST', headers: { 'X-Forwarded-For': '203.0.113.10' }, body: { email: 'window@example.edu', password }
    });
    for (let i = 0; i < 5; i += 1) assert.equal((await attempt('wrong')).status, 401);
    assert.equal((await attempt('RightPass1')).status, 429);

    t.mock.timers.setTime(Date.parse('2026-11-12T10:14:59Z'));
    assert.equal((await attempt('RightPass1')).status, 429, 'still locked just before 15 minutes');

    t.mock.timers.setTime(Date.parse('2026-11-12T10:15:01Z'));
    assert.equal((await attempt('RightPass1')).status, 200, 'unlocked after 15 minutes');
  }, { trustProxy: true });
});

test('one locked-out IP does not block other IPs', async () => {
  await withServer((db) => [['/api/auth', authRoutes(db)]], async ({ db, url }) => {
    addUser(db, { email: 'ip@example.edu', passwordHash: hashPassword('RightPass1') });
    const attempt = (ip, password) => call(url, '/api/auth/login', {
      method: 'POST', headers: { 'X-Forwarded-For': ip }, body: { email: 'ip@example.edu', password }
    });
    for (let i = 0; i < 5; i += 1) await attempt('198.51.100.1', 'wrong');
    assert.equal((await attempt('198.51.100.1', 'RightPass1')).status, 429);
    assert.equal((await attempt('198.51.100.2', 'RightPass1')).status, 200);
  }, { trustProxy: true });
});

// ---- session cookie ----

test('session cookie is Secure in production and not in development', async () => {
  const saved = process.env.NODE_ENV;
  try {
    await withServer((db) => [['/api/auth', authRoutes(db)]], async ({ url }) => {
      process.env.NODE_ENV = 'production';
      const prod = await call(url, '/api/auth/register', {
        method: 'POST', body: { name: 'P', email: 'prod@example.edu', password: 'longenough' }
      });
      assert.match(prod.headers.get('set-cookie'), /;\s*Secure/i);
      assert.match(prod.headers.get('set-cookie'), /Max-Age=604800/, 'sessions last 7 days');

      process.env.NODE_ENV = 'development';
      const dev = await call(url, '/api/auth/register', {
        method: 'POST', body: { name: 'D', email: 'dev@example.edu', password: 'longenough' }
      });
      assert.doesNotMatch(dev.headers.get('set-cookie'), /;\s*Secure/i);
    });
  } finally {
    if (saved === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = saved;
  }
});

test('a forged or tampered session cookie is rejected', async () => {
  await withServer((db) => [['/api', pickupRoutes(db)]], async ({ db, url }) => {
    const real = addUserSession(db, { role: 'student' });
    for (const cookie of [`${real.cookie}x`, 'session=', `session=${'0'.repeat(64)}`, `Session=${real.token}`]) {
      assert.equal((await call(url, '/api/notifications', { cookie })).status, 401, cookie);
    }
  });
});

// ---- odd input in filters and IDs ----

test('junk query filters return empty results or 400, never a crash', async () => {
  await withServer((db) => [['/api', staffRoutes(db)]], async ({ db, url }) => {
    const staff = addUserSession(db, { role: 'staff' });
    const ok = async (path) => {
      const res = await call(url, path, { cookie: staff.cookie });
      assert.equal(res.status, 200, path);
      return res.body;
    };
    assert.deepEqual((await ok('/api/staff/pickups?status=bogus')).pickups, []);
    assert.deepEqual((await ok("/api/staff/pickups?status=scheduled'%20OR%201=1--")).pickups, []);
    assert.deepEqual((await ok('/api/staff/pickups?status=a&status=b')).pickups, []);
    assert.deepEqual((await ok('/api/staff/pickups?date=not-a-date')).pickups, []);
    assert.equal((await call(url, '/api/staff/slots?from=bad', { cookie: staff.cookie })).status, 400);
    assert.equal((await call(url, '/api/staff/reports?to=2026-02-31', { cookie: staff.cookie })).status, 400);
    // The tables are still intact after the injection-style input.
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM users').get().n, 1);
  });
});

test('IDs that are not positive whole numbers get 400', async () => {
  await withServer((db) => [['/api', pickupRoutes(db)], ['/api', staffRoutes(db)], ['/api', inventoryRoutes(db)]], async ({ db, url }) => {
    const staff = addUserSession(db, { role: 'staff' });
    for (const id of ['1.5', '-1', '0', '1e3x', '9007199254740993', 'NaN']) {
      assert.equal((await call(url, `/api/pickups/${id}`, { cookie: staff.cookie })).status, 400, `pickup ${id}`);
      assert.equal((await call(url, `/api/staff/slots/${id}`, { method: 'DELETE', cookie: staff.cookie })).status, 400, `slot ${id}`);
      assert.equal((await call(url, `/api/items/${id}`, { method: 'PATCH', cookie: staff.cookie, body: { quantity: 1 } })).status, 400, `item ${id}`);
    }
  });
});

test('wrong types in a booking body are rejected', async () => {
  await withServer((db) => [['/api', pickupRoutes(db)]], async ({ db, url }) => {
    const student = addUserSession(db, { role: 'student' });
    const itemId = addItem(db);
    const slotId = addSlot(db);
    for (const body of [
      { slot_id: String(slotId), items: { item_id: itemId, quantity: 1 } },
      { slot_id: slotId, items: [{ item_id: itemId, quantity: '1; DROP TABLE items' }] },
      { slot_id: slotId, items: [{ item_id: itemId, quantity: 1.5 }] },
      { slot_id: null, items: [{ item_id: itemId, quantity: 1 }] },
      [1, 2, 3]
    ]) {
      const res = await call(url, '/api/pickups', { method: 'POST', cookie: student.cookie, body });
      assert.equal(res.status, 400, JSON.stringify(body));
    }
    assert.equal(db.prepare('SELECT reserved FROM items WHERE id = ?').get(itemId).reserved, 0);
  });
});

test('very long text fields are rejected at registration', async () => {
  await withServer((db) => [['/api/auth', authRoutes(db)]], async ({ url }) => {
    const res = await call(url, '/api/auth/register', {
      method: 'POST', body: { name: 'n'.repeat(5000), email: 'long@example.edu', password: 'longenough' }
    });
    assert.equal(res.status, 400);
  });
});

// ---- concurrency ----

test('two students racing for the last spot: exactly one gets it', async () => {
  await withServer((db) => [['/api', pickupRoutes(db)]], async ({ db, url }) => {
    const slotId = addSlot(db, '2099-01-01T10:00:00', 1);
    const itemId = addItem(db, { quantity: 10 });
    const students = Array.from({ length: 5 }, () => addUserSession(db, { role: 'student' }));
    const results = await Promise.all(students.map(s => call(url, '/api/pickups', {
      method: 'POST', cookie: s.cookie, body: { slot_id: slotId, items: [{ item_id: itemId, quantity: 1 }] }
    })));
    const statuses = results.map(r => r.status).sort();
    assert.deepEqual(statuses, [201, 409, 409, 409, 409]);
    assert.equal(db.prepare('SELECT reserved FROM items WHERE id = ?').get(itemId).reserved, 1);
  });
});

test('racing for the last units of an item: stock never goes negative', async () => {
  await withServer((db) => [['/api', pickupRoutes(db)]], async ({ db, url }) => {
    const itemId = addItem(db, { quantity: 3 });
    const students = Array.from({ length: 4 }, () => addUserSession(db, { role: 'student' }));
    const results = await Promise.all(students.map((s, i) => call(url, '/api/pickups', {
      method: 'POST',
      cookie: s.cookie,
      body: { slot_id: addSlot(db, `2099-02-0${i + 1}T10:00:00`, 5), items: [{ item_id: itemId, quantity: 1 }] }
    })));
    assert.equal(results.filter(r => r.status === 201).length, 3);
    const row = db.prepare('SELECT quantity, reserved FROM items WHERE id = ?').get(itemId);
    assert.equal(row.reserved, 3);
    assert.ok(row.reserved <= row.quantity);
  });
});

test('one student double-submitting gets one booking', async () => {
  await withServer((db) => [['/api', pickupRoutes(db)]], async ({ db, url }) => {
    const student = addUserSession(db, { role: 'student' });
    const itemId = addItem(db, { quantity: 10 });
    const slotId = addSlot(db, '2099-01-01T10:00:00', 5);
    const send = () => call(url, '/api/pickups', {
      method: 'POST', cookie: student.cookie, body: { slot_id: slotId, items: [{ item_id: itemId, quantity: 2 }] }
    });
    const statuses = (await Promise.all([send(), send(), send()])).map(r => r.status).sort();
    assert.deepEqual(statuses, [201, 409, 409]);
    assert.equal(db.prepare('SELECT reserved FROM items WHERE id = ?').get(itemId).reserved, 2);
  });
});

// ---- time boundaries ----

test('reminders: exactly 24h ahead is included, exactly now is not', () => {
  const db = openDatabase();
  try {
    const book = (startsAt) => schedule({ db, clock: fixedClock('2099-01-01T00:00:00') }, addUser(db), {
      slot_id: addSlot(db, startsAt), items: [{ item_id: addItem(db, { name: startsAt }), quantity: 1 }]
    });
    const at24h = book('2099-01-02T08:00:00');
    book('2099-01-02T08:00:01');
    book('2099-01-01T08:00:00');
    const ctx = { db, clock: fixedClock('2099-01-01T08:00:00') };
    assert.deepEqual(sendDueReminders(ctx), { sent: 1 });
    assert.equal(db.prepare("SELECT request_id FROM notifications WHERE type = 'reminder'").get().request_id, at24h.id);
  } finally {
    db.close();
  }
});

test('reports: the "to" date includes its whole day and "from" starts at midnight', () => {
  const db = openDatabase();
  try {
    for (const createdAt of ['2026-03-09T23:59:59', '2026-03-10T00:00:00', '2026-03-10T23:59:59', '2026-03-11T00:00:00']) {
      db.prepare("INSERT INTO requests (student_id, status, created_at) VALUES (?, 'submitted', ?)").run(addUser(db), createdAt);
    }
    const report = pickupReport({ db }, { from: '2026-03-10', to: '2026-03-10' });
    assert.equal(report.status_counts[0].count, 2);
  } finally {
    db.close();
  }
});

test('queue date filter includes a pickup at the very last second of the day', () => {
  const db = openDatabase();
  try {
    schedule({ db }, addUser(db), { slot_id: addSlot(db, '2099-05-01T23:59:59'), items: [{ item_id: addItem(db), quantity: 1 }] });
    assert.equal(queue({ db }, { date: '2099-05-01' }).length, 1);
  } finally {
    db.close();
  }
});

test('a pickup slot exactly at "now" is not bookable', () => {
  const db = openDatabase();
  try {
    const ctx = { db, clock: fixedClock('2099-01-01T10:00:00') };
    assert.throws(() => schedule(ctx, addUser(db), { slot_id: addSlot(db, '2099-01-01T10:00:00'), items: [{ item_id: addItem(db), quantity: 1 }] }), {
      message: 'Pickup slot must be in the future.'
    });
    assert.throws(() => createSlot(ctx, { starts_at: '2099-01-01T10:00', capacity: 1 }), { status: 400 });
    assert.equal(createSlot(ctx, { starts_at: '2099-01-01T10:01', capacity: 1 }).starts_at, '2099-01-01T10:01:00');
  } finally {
    db.close();
  }
});

// ---- daylight saving time (US Eastern) ----

test('DST fall-back: the repeated 1:30 AM hour is accepted', () => {
  assert.equal(toLocalIso(parseLocalIso('2026-11-01T01:30')), '2026-11-01T01:30:00');
});

test('DST spring-forward: a slot at a time that does not exist is rejected', () => {
  const db = openDatabase();
  try {
    assert.throws(() => createSlot({ db, clock: fixedClock('2026-01-01T00:00:00') }, { starts_at: '2026-03-08T02:30', capacity: 1 }), { status: 400 });
  } finally {
    db.close();
  }
});

// ---- FR7 / FR9 gaps in the inventory API ----

test('staff can set a low-stock threshold when adding an item (FR9)', { todo: 'Known gap: createItem ignores low_stock_threshold, so API-created items only alert once they hit 0' }, () => {
  const db = openDatabase();
  try {
    assert.equal(createItem({ db }, { name: 'A', category: 'B', quantity: 1, low_stock_threshold: 5 }).low_stock_threshold, 5);
  } finally {
    db.close();
  }
});

test('staff can set a per-visit limit and dietary tags when adding an item (FR7)', { todo: 'Known gap: createItem ignores per_visit_limit and dietary_tags' }, () => {
  const db = openDatabase();
  try {
    const item = createItem({ db }, { name: 'A', category: 'B', quantity: 1, per_visit_limit: 2, dietary_tags: 'vegan' });
    assert.equal(item.per_visit_limit, 2);
    assert.equal(item.dietary_tags, 'vegan');
  } finally {
    db.close();
  }
});

test('staff can retire an item so students no longer see it (FR7)', { todo: 'Known gap: updateItem only changes quantity; there is no way to set active = 0' }, () => {
  const db = openDatabase();
  try {
    const id = addItem(db, { quantity: 4 });
    assert.equal(updateItem({ db }, id, { quantity: 4, active: 0 }).active, 0);
  } finally {
    db.close();
  }
});
