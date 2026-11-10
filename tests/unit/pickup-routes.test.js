import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';

import { sha256 } from '../../src/auth/passwords.js';
import { openDatabase } from '../../src/db.js';
import { pickupRoutes } from '../../src/routes/pickups.js';

function appFor(db) {
  const app = express();
  app.use(express.json());
  app.use('/api', pickupRoutes(db));
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

function addSession(db, role = 'student') {
  const userId = Number(db.prepare(`
    INSERT INTO users (email, name, password_hash, role, created_at)
    VALUES (?, 'User', 'hash', ?, '2026-11-10T09:00:00')
  `).run(`${role}@example.edu`, role).lastInsertRowid);
  const token = `${role}-token`;
  db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)')
    .run(sha256(token), userId, Date.now() + 60_000);
  return { userId, token };
}

function addItemAndSlot(db) {
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

test('student can schedule a pickup through the route', async () => {
  const db = openDatabase();
  const { userId, token } = addSession(db);
  const { itemId, slotId } = addItemAndSlot(db);
  const { server, url } = await start(appFor(db));

  try {
    const res = await fetch(`${url}/api/pickups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `session=${token}`
      },
      body: JSON.stringify({
        slot_id: slotId,
        items: [{ item_id: itemId, quantity: 2 }]
      })
    });
    const body = await res.json();

    assert.equal(res.status, 201);
    assert.equal(body.pickup.student_id, userId);
    assert.equal(body.pickup.status, 'scheduled');
    assert.equal(db.prepare('SELECT COUNT(*) AS count FROM notifications').get().count, 1);
  } finally {
    server.close();
    db.close();
  }
});
