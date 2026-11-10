import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';

import { sha256 } from '../../src/auth/passwords.js';
import { openDatabase } from '../../src/db.js';
import { pickupRoutes } from '../../src/routes/pickups.js';
import { staffRoutes } from '../../src/routes/staff.js';

function appFor(db) {
  const app = express();
  app.use(express.json());
  app.use('/api', pickupRoutes(db));
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

function addUserSession(db, { role, email }) {
  const userId = Number(db.prepare(`
    INSERT INTO users (email, name, password_hash, role, created_at)
    VALUES (?, ?, 'hash', ?, '2026-11-10T09:00:00')
  `).run(email, role === 'staff' ? 'Staff User' : 'Student User', role).lastInsertRowid);
  const token = `${role}-flow-token`;

  db.prepare(`
    INSERT INTO sessions (token_hash, user_id, expires_at)
    VALUES (?, ?, ?)
  `).run(sha256(token), userId, Date.now() + 60_000);

  return { userId, token };
}

function addInventoryAndSlot(db) {
  const itemId = Number(db.prepare(`
    INSERT INTO items (name, category, quantity, created_at, updated_at)
    VALUES ('Rice', 'Grains', 10, '2026-11-10T09:00:00', '2026-11-10T09:00:00')
  `).run().lastInsertRowid);
  const slotId = Number(db.prepare(`
    INSERT INTO pickup_slots (starts_at, capacity)
    VALUES ('2099-11-10T14:00:00', 2)
  `).run().lastInsertRowid);

  return { itemId, slotId };
}

test('student books pickup, staff completes it, and report reflects the flow', async () => {
  const db = openDatabase();
  const student = addUserSession(db, { role: 'student', email: 'student@example.edu' });
  const staff = addUserSession(db, { role: 'staff', email: 'staff@example.edu' });
  const { itemId, slotId } = addInventoryAndSlot(db);
  const { server, url } = await start(appFor(db));

  try {
    const bookRes = await fetch(`${url}/api/pickups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `session=${student.token}`
      },
      body: JSON.stringify({
        slot_id: slotId,
        items: [{ item_id: itemId, quantity: 2 }]
      })
    });
    const booked = await bookRes.json();

    assert.equal(bookRes.status, 201);

    const prepareRes = await fetch(`${url}/api/staff/pickups/${booked.pickup.id}/prepare`, {
      method: 'POST',
      headers: { Cookie: `session=${staff.token}` }
    });
    const completeRes = await fetch(`${url}/api/staff/pickups/${booked.pickup.id}/complete`, {
      method: 'POST',
      headers: { Cookie: `session=${staff.token}` }
    });
    const reportRes = await fetch(`${url}/api/staff/reports`, {
      headers: { Cookie: `session=${staff.token}` }
    });
    const { report } = await reportRes.json();

    assert.equal(prepareRes.status, 200);
    assert.equal(completeRes.status, 200);
    assert.equal(reportRes.status, 200);
    assert.equal(report.pickups.status_counts.find(row => row.status === 'picked_up').count, 1);
    assert.equal(report.pickups.top_items[0].name, 'Rice');
    assert.equal(report.pickups.top_items[0].quantity, 2);
    assert.equal(report.inventory.summary.total_available, 8);
  } finally {
    server.close();
    db.close();
  }
});
