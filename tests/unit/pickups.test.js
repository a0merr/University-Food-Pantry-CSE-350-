import test from 'node:test';
import assert from 'node:assert/strict';

import { openDatabase } from '../../src/db.js';
import { createSlot } from '../../src/services/slots.js';
import {
  cancel,
  complete,
  prepare,
  queue,
  schedule
} from '../../src/services/pickups.js';

const clock = { now: () => new Date(2026, 10, 10, 9, 0, 0) };

function addStudent(db, email = 'student@example.edu') {
  return Number(db.prepare(`
    INSERT INTO users (email, name, password_hash, role, created_at)
    VALUES (?, 'Student', 'hash', 'student', '2026-11-10T09:00:00')
  `).run(email).lastInsertRowid);
}

function addItem(db, overrides = {}) {
  const values = {
    name: 'Rice',
    category: 'Grains',
    quantity: 10,
    reserved: 0,
    per_visit_limit: null,
    created_at: '2026-11-10T09:00:00',
    updated_at: '2026-11-10T09:00:00',
    ...overrides
  };

  return Number(db.prepare(`
    INSERT INTO items
    (name, category, quantity, reserved, per_visit_limit, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    values.name,
    values.category,
    values.quantity,
    values.reserved,
    values.per_visit_limit,
    values.created_at,
    values.updated_at
  ).lastInsertRowid);
}

function itemRow(db, itemId) {
  const row = db.prepare('SELECT quantity, reserved FROM items WHERE id = ?').get(itemId);
  return { quantity: row.quantity, reserved: row.reserved };
}

test('schedule reserves requested items and places pickup in the queue', () => {
  const db = openDatabase();

  try {
    const studentId = addStudent(db);
    const itemId = addItem(db);
    const slot = createSlot({ db, clock }, { starts_at: '2026-11-10T14:00', capacity: 2 });

    const pickup = schedule(
      { db, clock },
      studentId,
      { slot_id: slot.id, items: [{ item_id: itemId, quantity: 3 }] }
    );

    assert.equal(pickup.status, 'scheduled');
    assert.equal(pickup.items[0].quantity, 3);
    assert.deepEqual(itemRow(db, itemId), { quantity: 10, reserved: 3 });
    assert.equal(queue({ db }).length, 1);
  } finally {
    db.close();
  }
});

test('schedule rejects full slots and unavailable inventory', () => {
  const db = openDatabase();

  try {
    const itemId = addItem(db, { quantity: 2 });
    const slot = createSlot({ db, clock }, { starts_at: '2026-11-10T14:00', capacity: 1 });
    schedule(
      { db, clock },
      addStudent(db, 'first@example.edu'),
      { slot_id: slot.id, items: [{ item_id: itemId, quantity: 1 }] }
    );

    assert.throws(
      () => schedule(
        { db, clock },
        addStudent(db, 'second@example.edu'),
        { slot_id: slot.id, items: [{ item_id: itemId, quantity: 1 }] }
      ),
      /full/
    );
    assert.throws(
      () => schedule(
        { db, clock },
        addStudent(db, 'third@example.edu'),
        { slot_id: slot.id, items: [{ item_id: itemId, quantity: 3 }] }
      ),
      /full|enough available/
    );
  } finally {
    db.close();
  }
});

test('cancel releases reserved inventory', () => {
  const db = openDatabase();

  try {
    const studentId = addStudent(db);
    const itemId = addItem(db);
    const slot = createSlot({ db, clock }, { starts_at: '2026-11-10T14:00', capacity: 2 });
    const pickup = schedule(
      { db, clock },
      studentId,
      { slot_id: slot.id, items: [{ item_id: itemId, quantity: 3 }] }
    );

    const cancelled = cancel({ db, clock }, pickup.id, { user_id: studentId, role: 'student' });

    assert.equal(cancelled.status, 'cancelled');
    assert.deepEqual(itemRow(db, itemId), { quantity: 10, reserved: 0 });
  } finally {
    db.close();
  }
});

test('prepare then complete marks pickup done and removes stock', () => {
  const db = openDatabase();

  try {
    const studentId = addStudent(db);
    const itemId = addItem(db);
    const slot = createSlot({ db, clock }, { starts_at: '2026-11-10T14:00', capacity: 2 });
    const pickup = schedule(
      { db, clock },
      studentId,
      { slot_id: slot.id, items: [{ item_id: itemId, quantity: 3 }] }
    );

    assert.equal(prepare({ db, clock }, pickup.id).status, 'prepared');
    assert.equal(complete({ db, clock }, pickup.id).status, 'picked_up');
    assert.deepEqual(itemRow(db, itemId), { quantity: 7, reserved: 0 });
  } finally {
    db.close();
  }
});
