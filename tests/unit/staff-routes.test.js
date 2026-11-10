import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';

import { sha256 } from '../../src/auth/passwords.js';
import { openDatabase } from '../../src/db.js';
import { schedule } from '../../src/services/pickups.js';
import { staffRoutes } from '../../src/routes/staff.js';

function appFor(db) {
  const app = express();
  app.use(express.json());
  app.use('/api', staffRoutes(db));
  app.use((err, req, res, next) => {
    res.status(err.status ?? 500).json({ error: { message: err.message } });
  });
  return app;
}

function start(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, () => {
      resolve({
        server,
        url: `http://127.0.0.1:${server.address().port}`
      });
    });
  });
}

function addUser(db, role, email) {
  return Number(db.prepare(`
    INSERT INTO users (email, name, password_hash, role, created_at)
    VALUES (?, 'User', 'hash', ?, '2026-11-10T09:00:00')
  `).run(email, role).lastInsertRowid);
}

function addStaffSession(db) {
  const userId = addUser(db, 'staff', 'staff@example.edu');
  const token = 'staff-token';
  db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)')
    .run(sha256(token), userId, Date.now() + 60_000);
  return token;
}

function addPickup(db) {
  const studentId = addUser(db, 'student', 'student@example.edu');
  const itemId = Number(db.prepare(`
    INSERT INTO items (name, category, quantity, low_stock_threshold, created_at, updated_at)
    VALUES ('Rice', 'Grains', 10, 8, '2026-11-10T09:00:00', '2026-11-10T09:00:00')
  `).run().lastInsertRowid);
  const slotId = Number(db.prepare(`
    INSERT INTO pickup_slots (starts_at, capacity)
    VALUES ('2099-11-10T14:00:00', 2)
  `).run().lastInsertRowid);
  return schedule(
    { db },
    studentId,
    { slot_id: slotId, items: [{ item_id: itemId, quantity: 2 }] }
  );
}

test('staff can prepare and complete a pickup through routes', async () => {
  const db = openDatabase();
  const token = addStaffSession(db);
  const pickup = addPickup(db);
  const { server, url } = await start(appFor(db));

  try {
    const prepareRes = await fetch(`${url}/api/staff/pickups/${pickup.id}/prepare`, {
      method: 'POST',
      headers: { Cookie: `session=${token}` }
    });
    const completeRes = await fetch(`${url}/api/staff/pickups/${pickup.id}/complete`, {
      method: 'POST',
      headers: { Cookie: `session=${token}` }
    });
    const body = await completeRes.json();

    assert.equal(prepareRes.status, 200);
    assert.equal(completeRes.status, 200);
    assert.equal(body.pickup.status, 'picked_up');
    assert.equal(db.prepare('SELECT COUNT(*) AS count FROM low_stock_alerts WHERE resolved_at IS NULL').get().count, 1);
  } finally {
    server.close();
    db.close();
  }
});
