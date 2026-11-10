import test from 'node:test';
import assert from 'node:assert/strict';

import { openDatabase } from '../../src/db.js';
import { createSlot } from '../../src/services/slots.js';
import { schedule } from '../../src/services/pickups.js';
import { sendDueReminders } from '../../src/services/reminders.js';

const clock = { now: () => new Date(2026, 10, 10, 9, 0, 0) };

function addStudent(db) {
  return Number(db.prepare(`
    INSERT INTO users (email, name, password_hash, role, created_at)
    VALUES ('student@example.edu', 'Student', 'hash', 'student', '2026-11-10T09:00:00')
  `).run().lastInsertRowid);
}

function addItem(db) {
  return Number(db.prepare(`
    INSERT INTO items (name, category, quantity, created_at, updated_at)
    VALUES ('Rice', 'Grains', 10, '2026-11-10T09:00:00', '2026-11-10T09:00:00')
  `).run().lastInsertRowid);
}

test('sendDueReminders sends one reminder for upcoming pickups', () => {
  const db = openDatabase();

  try {
    const studentId = addStudent(db);
    const itemId = addItem(db);
    const slot = createSlot({ db, clock }, { starts_at: '2026-11-10T14:00', capacity: 2 });
    const pickup = schedule(
      { db, clock },
      studentId,
      { slot_id: slot.id, items: [{ item_id: itemId, quantity: 1 }] }
    );

    assert.deepEqual(sendDueReminders({ db, clock }), { sent: 1 });
    assert.deepEqual(sendDueReminders({ db, clock }), { sent: 0 });

    const notification = db.prepare(`
      SELECT *
      FROM notifications
      WHERE request_id = ? AND type = 'reminder'
    `).get(pickup.id);
    const request = db.prepare('SELECT reminder_sent FROM requests WHERE id = ?').get(pickup.id);

    assert.equal(notification.user_id, studentId);
    assert.equal(request.reminder_sent, 1);
  } finally {
    db.close();
  }
});

test('sendDueReminders skips pickups outside the lookahead window', () => {
  const db = openDatabase();

  try {
    const studentId = addStudent(db);
    const itemId = addItem(db);
    const slot = createSlot({ db, clock }, { starts_at: '2026-11-12T14:00', capacity: 2 });
    schedule(
      { db, clock },
      studentId,
      { slot_id: slot.id, items: [{ item_id: itemId, quantity: 1 }] }
    );

    assert.deepEqual(sendDueReminders({ db, clock }), { sent: 0 });
  } finally {
    db.close();
  }
});
