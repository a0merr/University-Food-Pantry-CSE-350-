// Pickup (student-facing) and staff routes: every endpoint, success and access rules.
import test from 'node:test';
import assert from 'node:assert/strict';

import { openDatabase } from '../../src/db.js';
import { pickupRoutes } from '../../src/routes/pickups.js';
import { staffRoutes } from '../../src/routes/staff.js';
import { addItem, addSlot, addUserSession, appWith, start, call } from '../helpers.js';

let slotCounter = 0;
function nextSlotTime() {
  slotCounter += 1;
  return `2099-01-${String(slotCounter).padStart(2, '0')}T10:00:00`;
}

async function withApp(fn) {
  const db = openDatabase();
  const { server, url } = await start(appWith([
    ['/api', pickupRoutes(db)],
    ['/api', staffRoutes(db)]
  ]));
  try {
    await fn({ db, url });
  } finally {
    server.close();
    db.close();
  }
}

function book(url, cookie, slotId, itemId, quantity = 1) {
  return call(url, '/api/pickups', {
    method: 'POST',
    cookie,
    body: { slot_id: slotId, items: [{ item_id: itemId, quantity }] }
  });
}

// ---- pickup routes ----

test('pickup-slots requires sign-in and lists only future slots', async () => {
  await withApp(async ({ db, url }) => {
    const student = addUserSession(db, { role: 'student' });
    addSlot(db, '2000-01-01T10:00:00');
    const future = addSlot(db, nextSlotTime(), 3);

    const anon = await call(url, '/api/pickup-slots');
    const res = await call(url, '/api/pickup-slots', { cookie: student.cookie });

    assert.equal(anon.status, 401);
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.slots.map(slot => slot.id), [future]);
    assert.equal(res.body.slots[0].available, 3);
  });
});

test('booking a pickup notifies the student and emails them', async () => {
  await withApp(async ({ db, url }) => {
    const student = addUserSession(db, { role: 'student' });
    const itemId = addItem(db, { quantity: 10 });
    const slotId = addSlot(db, nextSlotTime());

    const res = await book(url, student.cookie, slotId, itemId, 2);

    assert.equal(res.status, 201);
    assert.equal(res.body.pickup.status, 'scheduled');
    assert.equal(res.body.pickup.items[0].quantity, 2);
    assert.equal(db.prepare('SELECT reserved FROM items WHERE id = ?').get(itemId).reserved, 2);
    const notes = db.prepare('SELECT type FROM notifications WHERE user_id = ?').all(student.userId);
    assert.deepEqual(notes.map(n => n.type), ['scheduled']);
    assert.equal(db.prepare('SELECT subject FROM email_outbox WHERE user_id = ?').get(student.userId).subject, 'Pickup scheduled');
  });
});

test('booking a pickup that drops stock below threshold opens a low-stock alert', async () => {
  await withApp(async ({ db, url }) => {
    const student = addUserSession(db, { role: 'student' });
    const itemId = addItem(db, { quantity: 5, threshold: 4 });
    const slotId = addSlot(db, nextSlotTime());

    await book(url, student.cookie, slotId, itemId, 2);

    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM low_stock_alerts WHERE resolved_at IS NULL').get().n, 1);
  });
});

test('staff cannot book pickups and anonymous users are rejected', async () => {
  await withApp(async ({ db, url }) => {
    const staff = addUserSession(db, { role: 'staff' });
    const itemId = addItem(db);
    const slotId = addSlot(db, nextSlotTime());

    assert.equal((await book(url, staff.cookie, slotId, itemId)).status, 403);
    assert.equal((await book(url, undefined, slotId, itemId)).status, 401);
  });
});

test('booking surfaces service validation errors', async () => {
  await withApp(async ({ db, url }) => {
    const student = addUserSession(db, { role: 'student' });
    const itemId = addItem(db, { quantity: 1 });
    const slotId = addSlot(db, nextSlotTime());

    const tooMany = await book(url, student.cookie, slotId, itemId, 5);
    const noSlot = await book(url, student.cookie, 99999, itemId, 1);
    const noBody = await call(url, '/api/pickups', { method: 'POST', cookie: student.cookie });

    assert.equal(tooMany.status, 409);
    assert.equal(noSlot.status, 404);
    assert.equal(noBody.status, 400);
  });
});

test('students can view only their own pickups; staff can view any', async () => {
  await withApp(async ({ db, url }) => {
    const owner = addUserSession(db, { role: 'student' });
    const other = addUserSession(db, { role: 'student' });
    const staff = addUserSession(db, { role: 'staff' });
    const pickup = (await book(url, owner.cookie, addSlot(db, nextSlotTime()), addItem(db))).body.pickup;

    assert.equal((await call(url, `/api/pickups/${pickup.id}`, { cookie: owner.cookie })).status, 200);
    assert.equal((await call(url, `/api/pickups/${pickup.id}`, { cookie: staff.cookie })).status, 200);
    const denied = await call(url, `/api/pickups/${pickup.id}`, { cookie: other.cookie });
    assert.equal(denied.status, 403);
    assert.equal(denied.body.error.message, 'You cannot view this pickup.');
    assert.equal((await call(url, '/api/pickups/99999', { cookie: owner.cookie })).status, 404);
    assert.equal((await call(url, '/api/pickups/abc', { cookie: owner.cookie })).status, 400);
    assert.equal((await call(url, `/api/pickups/${pickup.id}`)).status, 401);
  });
});

test('students can cancel their own pickup, which releases stock and notifies them', async () => {
  await withApp(async ({ db, url }) => {
    const owner = addUserSession(db, { role: 'student' });
    const other = addUserSession(db, { role: 'student' });
    const itemId = addItem(db, { quantity: 4 });
    const pickup = (await book(url, owner.cookie, addSlot(db, nextSlotTime()), itemId, 3)).body.pickup;

    const denied = await call(url, `/api/pickups/${pickup.id}/cancel`, { method: 'POST', cookie: other.cookie });
    assert.equal(denied.status, 403);

    const res = await call(url, `/api/pickups/${pickup.id}/cancel`, { method: 'POST', cookie: owner.cookie });
    assert.equal(res.status, 200);
    assert.equal(res.body.pickup.status, 'cancelled');
    assert.equal(db.prepare('SELECT reserved FROM items WHERE id = ?').get(itemId).reserved, 0);
    const types = db.prepare('SELECT type FROM notifications WHERE user_id = ? ORDER BY id').all(owner.userId).map(n => n.type);
    assert.deepEqual(types, ['scheduled', 'cancelled']);

    const again = await call(url, `/api/pickups/${pickup.id}/cancel`, { method: 'POST', cookie: owner.cookie });
    assert.equal(again.status, 409);
  });
});

test('staff can cancel any open pickup', async () => {
  await withApp(async ({ db, url }) => {
    const owner = addUserSession(db, { role: 'student' });
    const staff = addUserSession(db, { role: 'staff' });
    const pickup = (await book(url, owner.cookie, addSlot(db, nextSlotTime()), addItem(db))).body.pickup;

    const res = await call(url, `/api/pickups/${pickup.id}/cancel`, { method: 'POST', cookie: staff.cookie });
    assert.equal(res.status, 200);
    assert.equal(res.body.pickup.status, 'cancelled');
  });
});

test('notifications list, unread filter and mark-read', async () => {
  await withApp(async ({ db, url }) => {
    const owner = addUserSession(db, { role: 'student' });
    const other = addUserSession(db, { role: 'student' });
    await book(url, owner.cookie, addSlot(db, nextSlotTime()), addItem(db));

    const all = await call(url, '/api/notifications', { cookie: owner.cookie });
    assert.equal(all.status, 200);
    assert.equal(all.body.notifications.length, 1);
    const id = all.body.notifications[0].id;

    assert.equal((await call(url, `/api/notifications/${id}/read`, { method: 'PATCH', cookie: other.cookie })).status, 403);
    const read = await call(url, `/api/notifications/${id}/read`, { method: 'PATCH', cookie: owner.cookie });
    assert.equal(read.status, 200);
    assert.ok(read.body.notification.read_at);

    const unread = await call(url, '/api/notifications?unread=true', { cookie: owner.cookie });
    assert.equal(unread.body.notifications.length, 0);
    const stillAll = await call(url, '/api/notifications', { cookie: owner.cookie });
    assert.equal(stillAll.body.notifications.length, 1);

    assert.equal((await call(url, '/api/notifications/99999/read', { method: 'PATCH', cookie: owner.cookie })).status, 404);
    assert.equal((await call(url, '/api/notifications/x/read', { method: 'PATCH', cookie: owner.cookie })).status, 400);
    assert.equal((await call(url, '/api/notifications', { cookie: other.cookie })).body.notifications.length, 0);
    assert.equal((await call(url, '/api/notifications')).status, 401);
  });
});

test('an expired session is treated as signed out', async () => {
  await withApp(async ({ db, url }) => {
    const stale = addUserSession(db, { role: 'student', expiresAt: Date.now() - 1 });
    assert.equal((await call(url, '/api/notifications', { cookie: stale.cookie })).status, 401);
  });
});

// ---- staff routes ----

test('every staff endpoint rejects anonymous users and students', async () => {
  await withApp(async ({ db, url }) => {
    const student = addUserSession(db, { role: 'student' });
    const endpoints = [
      ['GET', '/api/staff/pickups'],
      ['POST', '/api/staff/pickups/1/prepare'],
      ['POST', '/api/staff/pickups/1/complete'],
      ['GET', '/api/staff/slots'],
      ['POST', '/api/staff/slots'],
      ['PATCH', '/api/staff/slots/1'],
      ['DELETE', '/api/staff/slots/1'],
      ['POST', '/api/staff/alerts/check'],
      ['GET', '/api/staff/alerts'],
      ['GET', '/api/staff/reports']
    ];
    for (const [method, path] of endpoints) {
      assert.equal((await call(url, path, { method })).status, 401, `${method} ${path} anon`);
      assert.equal((await call(url, path, { method, cookie: student.cookie })).status, 403, `${method} ${path} student`);
    }
  });
});

test('staff queue lists open pickups and filters by status and date', async () => {
  await withApp(async ({ db, url }) => {
    const staff = addUserSession(db, { role: 'staff' });
    const a = addUserSession(db, { role: 'student', name: 'Alpha' });
    const b = addUserSession(db, { role: 'student', name: 'Bravo' });
    const itemId = addItem(db, { quantity: 20 });
    const p1 = (await book(url, a.cookie, addSlot(db, '2099-05-01T10:00:00'), itemId)).body.pickup;
    const p2 = (await book(url, b.cookie, addSlot(db, '2099-05-02T10:00:00'), itemId)).body.pickup;
    await call(url, `/api/staff/pickups/${p2.id}/prepare`, { method: 'POST', cookie: staff.cookie });

    const open = await call(url, '/api/staff/pickups', { cookie: staff.cookie });
    assert.deepEqual(open.body.pickups.map(p => p.id), [p1.id, p2.id]);
    assert.equal(open.body.pickups[0].student_name, 'Alpha');
    assert.ok(Array.isArray(open.body.pickups[0].items));

    const prepared = await call(url, '/api/staff/pickups?status=prepared', { cookie: staff.cookie });
    assert.deepEqual(prepared.body.pickups.map(p => p.id), [p2.id]);

    const byDate = await call(url, '/api/staff/pickups?date=2099-05-01', { cookie: staff.cookie });
    assert.deepEqual(byDate.body.pickups.map(p => p.id), [p1.id]);
  });
});

test('prepare sends a ready notification; out-of-order transitions conflict', async () => {
  await withApp(async ({ db, url }) => {
    const staff = addUserSession(db, { role: 'staff' });
    const student = addUserSession(db, { role: 'student' });
    const pickup = (await book(url, student.cookie, addSlot(db, nextSlotTime()), addItem(db))).body.pickup;

    const early = await call(url, `/api/staff/pickups/${pickup.id}/complete`, { method: 'POST', cookie: staff.cookie });
    assert.equal(early.status, 409);

    const prep = await call(url, `/api/staff/pickups/${pickup.id}/prepare`, { method: 'POST', cookie: staff.cookie });
    assert.equal(prep.status, 200);
    assert.equal(prep.body.pickup.status, 'prepared');
    const ready = db.prepare("SELECT * FROM notifications WHERE type = 'ready' AND user_id = ?").get(student.userId);
    assert.equal(ready.message, 'Your pantry pickup is ready.');

    const twice = await call(url, `/api/staff/pickups/${pickup.id}/prepare`, { method: 'POST', cookie: staff.cookie });
    assert.equal(twice.status, 409);

    assert.equal((await call(url, '/api/staff/pickups/99999/prepare', { method: 'POST', cookie: staff.cookie })).status, 404);
    assert.equal((await call(url, '/api/staff/pickups/-1/complete', { method: 'POST', cookie: staff.cookie })).status, 400);
  });
});

test('staff can create, list, update and delete slots', async () => {
  await withApp(async ({ db, url }) => {
    const staff = addUserSession(db, { role: 'staff' });
    addSlot(db, '2000-01-01T09:00:00');

    const created = await call(url, '/api/staff/slots', {
      method: 'POST', cookie: staff.cookie, body: { starts_at: '2099-03-01T09:30', capacity: 4 }
    });
    assert.equal(created.status, 201);
    assert.equal(created.body.slot.starts_at, '2099-03-01T09:30:00');
    const id = created.body.slot.id;

    const future = await call(url, '/api/staff/slots', { cookie: staff.cookie });
    assert.equal(future.body.slots.length, 1);
    const all = await call(url, '/api/staff/slots?include_past=true', { cookie: staff.cookie });
    assert.equal(all.body.slots.length, 2);
    const ranged = await call(url, '/api/staff/slots?include_past=true&from=2099-01-01T00:00&to=2099-12-31T00:00', { cookie: staff.cookie });
    assert.equal(ranged.body.slots.length, 1);

    const updated = await call(url, `/api/staff/slots/${id}`, { method: 'PATCH', cookie: staff.cookie, body: { capacity: 7 } });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.slot.capacity, 7);
    assert.equal(updated.body.slot.starts_at, '2099-03-01T09:30:00');

    const dup = await call(url, '/api/staff/slots', {
      method: 'POST', cookie: staff.cookie, body: { starts_at: '2099-03-01T09:30', capacity: 1 }
    });
    assert.equal(dup.status, 409);
    const invalid = await call(url, '/api/staff/slots', {
      method: 'POST', cookie: staff.cookie, body: { starts_at: 'tomorrow', capacity: 1 }
    });
    assert.equal(invalid.status, 400);
    assert.equal((await call(url, '/api/staff/slots', { method: 'POST', cookie: staff.cookie })).status, 400);

    const del = await call(url, `/api/staff/slots/${id}`, { method: 'DELETE', cookie: staff.cookie });
    assert.equal(del.status, 204);
    assert.equal((await call(url, `/api/staff/slots/${id}`, { method: 'DELETE', cookie: staff.cookie })).status, 404);
    assert.equal((await call(url, '/api/staff/slots/nope', { method: 'PATCH', cookie: staff.cookie, body: {} })).status, 400);
  });
});

test('staff can check and list low-stock alerts', async () => {
  await withApp(async ({ db, url }) => {
    const staff = addUserSession(db, { role: 'staff' });
    addItem(db, { name: 'Soup', category: 'Canned', quantity: 2, threshold: 5 });
    addItem(db, { name: 'Rice', quantity: 50, threshold: 5 });

    const check = await call(url, '/api/staff/alerts/check', { method: 'POST', cookie: staff.cookie });
    assert.equal(check.status, 200);
    assert.deepEqual(check.body, { opened: 1, resolved: 0 });

    const list = await call(url, '/api/staff/alerts', { cookie: staff.cookie });
    assert.equal(list.body.alerts.length, 1);
    assert.equal(list.body.alerts[0].item_name, 'Soup');
    assert.equal(list.body.alerts[0].category, 'Canned');
  });
});

test('staff reports accept date filters and reject bad ones', async () => {
  await withApp(async ({ db, url }) => {
    const staff = addUserSession(db, { role: 'staff' });
    addItem(db, { quantity: 3 });

    const ok = await call(url, '/api/staff/reports?from=2020-01-01&to=2099-12-31', { cookie: staff.cookie });
    assert.equal(ok.status, 200);
    assert.equal(ok.body.report.inventory.summary.active_items, 1);
    assert.deepEqual(ok.body.report.pickups.status_counts, []);

    const bad = await call(url, '/api/staff/reports?from=2020-13-45', { cookie: staff.cookie });
    assert.equal(bad.status, 400);
    assert.equal(bad.body.error.message, 'From date must be a valid date.');
  });
});
