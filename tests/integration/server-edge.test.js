// server.js behaviour that needs the real process: startup jobs, body limits,
// unknown routes and missing pages. Known bugs use { todo } (see edge-and-security.test.js).
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { openDatabase } from '../../src/db.js';
import { toLocalIso } from '../../src/lib/time.js';
import { call, addUser, addItem, addSlot } from '../helpers.js';
import { bootServer, makeWorkdir, removeWorkdir, runSeed } from '../server-harness.js';

const XRW = { 'X-Requested-With': 'fetch' };

const workdir = makeWorkdir();
runSeed(workdir);
const app = await bootServer(workdir);

test.after(async () => {
  await app.stop();
  removeWorkdir(workdir);
});

test('server sends due reminders as soon as it starts', async () => {
  const dir = makeWorkdir();
  try {
    mkdirSync(join(dir, 'data'));
    const db = openDatabase(join(dir, 'data', 'pantry.db'));
    const soon = toLocalIso(new Date(Date.now() + 2 * 60 * 60 * 1000));
    const later = toLocalIso(new Date(Date.now() + 48 * 60 * 60 * 1000));
    const insert = db.prepare("INSERT INTO requests (student_id, status, slot_id, created_at) VALUES (?, 'scheduled', ?, '2026-01-01T00:00:00')");
    const dueId = Number(insert.run(addUser(db), addSlot(db, soon)).lastInsertRowid);
    insert.run(addUser(db), addSlot(db, later));
    addItem(db);
    db.close();

    const server = await bootServer(dir);
    await server.stop();

    const check = openDatabase(join(dir, 'data', 'pantry.db'));
    const reminders = check.prepare("SELECT request_id FROM notifications WHERE type = 'reminder'").all();
    const sentFlags = check.prepare('SELECT id, reminder_sent FROM requests ORDER BY id').all().map(r => r.reminder_sent);
    check.close();

    assert.deepEqual(reminders.map(r => r.request_id), [dueId]);
    assert.deepEqual(sentFlags, [1, 0]);
  } finally {
    removeWorkdir(dir);
  }
});

test('a JSON body just under the 100 KB limit is accepted', async () => {
  const res = await call(app.url, '/api/auth/login', {
    method: 'POST', headers: XRW, body: { email: 'nobody@example.edu', password: 'x', padding: 'p'.repeat(90_000) }
  });
  assert.equal(res.status, 401);
});

test('a JSON body over 100 KB gets 413, not a 500', { todo: 'Known bug: body-parser errors have no `code`, so server.js turns "entity.too.large" into a 500 Internal server error' }, async () => {
  const res = await call(app.url, '/api/auth/register', {
    method: 'POST', headers: XRW, body: { name: 'A', email: 'big@example.edu', password: 'x'.repeat(200_000) }
  });
  assert.equal(res.status, 413);
});

test('unknown API routes answer with a JSON 404', { todo: 'Known gap: Express returns its default HTML 404 page, so api.js shows "Something went wrong"' }, async () => {
  const res = await call(app.url, '/api/does-not-exist');
  assert.equal(res.status, 404);
  assert.equal(typeof res.body, 'object');
  assert.ok(res.body?.error?.message);
});

test('students are sent to a page that exists after sign-in', { todo: 'Known bug: index.html redirects students to /student.html, which is not in public/ (404)' }, async () => {
  const res = await fetch(`${app.url}/student.html`);
  assert.equal(res.status, 200);
});

test('every page the sign-in page links to exists', async () => {
  const res = await fetch(`${app.url}/staff.html`);
  assert.equal(res.status, 200);
});

test('HTML in a registered name is stored and returned as plain text', async () => {
  const name = '<img src=x onerror=alert(1)>';
  const res = await call(app.url, '/api/auth/register', {
    method: 'POST', headers: XRW, body: { name, email: 'xss@example.edu', password: 'longenough' }
  });
  assert.equal(res.status, 201);
  assert.equal(res.body.user.name, name);
  assert.match(res.headers.get('content-type'), /application\/json/);
});

test('static files cannot be read outside public/', async () => {
  for (const path of ['/../server.js', '/..%2fserver.js', '/%2e%2e/package.json', '/data/pantry.db']) {
    const res = await fetch(`${app.url}${path}`);
    assert.notEqual(res.status, 200, path);
  }
});
