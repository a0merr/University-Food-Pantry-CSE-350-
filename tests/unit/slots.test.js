import test from 'node:test';
import assert from 'node:assert/strict';

import { openDatabase } from '../../src/db.js';
import {
  createSlot,
  deleteSlot,
  getSlot,
  listSlots,
  updateSlot
} from '../../src/services/slots.js';

const clock = { now: () => new Date(2026, 10, 10, 9, 0, 0) };

test('staff can create and list future pickup slots', () => {
  const db = openDatabase();

  try {
    const slot = createSlot(
      { db, clock },
      { starts_at: '2026-11-10T14:00', capacity: 4 }
    );

    assert.equal(slot.starts_at, '2026-11-10T14:00:00');
    assert.equal(slot.capacity, 4);
    assert.equal(slot.booked, 0);
    assert.equal(slot.available, 4);
    assert.equal(listSlots({ db, clock }).length, 1);
  } finally {
    db.close();
  }
});

test('slots must be unique and in the future', () => {
  const db = openDatabase();

  try {
    createSlot({ db, clock }, { starts_at: '2026-11-10T14:00', capacity: 4 });

    assert.throws(
      () => createSlot({ db, clock }, { starts_at: '2026-11-10T14:00', capacity: 2 }),
      /already exists/
    );
    assert.throws(
      () => createSlot({ db, clock }, { starts_at: '2026-11-10T08:00', capacity: 2 }),
      /future/
    );
  } finally {
    db.close();
  }
});

test('staff cannot lower capacity below booked pickups', () => {
  const db = openDatabase();

  try {
    const slot = createSlot({ db, clock }, { starts_at: '2026-11-10T14:00', capacity: 4 });
    const firstStudent = db.prepare(`
      INSERT INTO users (email, name, password_hash, role, created_at)
      VALUES ('student@example.edu', 'Student', 'hash', 'student', '2026-11-10T09:00:00')
    `).run();
    const secondStudent = db.prepare(`
      INSERT INTO users (email, name, password_hash, role, created_at)
      VALUES ('second@example.edu', 'Second', 'hash', 'student', '2026-11-10T09:00:00')
    `).run();
    db.prepare(`
      INSERT INTO requests (student_id, status, slot_id, created_at)
      VALUES (?, 'scheduled', ?, '2026-11-10T09:05:00')
    `).run(Number(firstStudent.lastInsertRowid), slot.id);
    db.prepare(`
      INSERT INTO requests (student_id, status, slot_id, created_at)
      VALUES (?, 'prepared', ?, '2026-11-10T09:06:00')
    `).run(Number(secondStudent.lastInsertRowid), slot.id);

    assert.throws(
      () => updateSlot({ db, clock }, slot.id, { capacity: 1 }),
      /less than scheduled pickups/
    );
    assert.equal(updateSlot({ db, clock }, slot.id, { capacity: 2 }).capacity, 2);
    assert.throws(
      () => deleteSlot({ db, clock }, slot.id),
      /scheduled pickups/
    );
  } finally {
    db.close();
  }
});

test('slots with picked-up or cancelled pickups cannot be deleted', () => {
  const db = openDatabase();

  try {
    const slot = createSlot({ db, clock }, { starts_at: '2026-11-10T14:00', capacity: 4 });
    const student = db.prepare(`
      INSERT INTO users (email, name, password_hash, role, created_at)
      VALUES ('student@example.edu', 'Student', 'hash', 'student', '2026-11-10T09:00:00')
    `).run();
    db.prepare(`
      INSERT INTO requests (student_id, status, slot_id, created_at)
      VALUES (?, 'cancelled', ?, '2026-11-10T09:05:00')
    `).run(Number(student.lastInsertRowid), slot.id);

    assert.throws(
      () => deleteSlot({ db, clock }, slot.id),
      (err) => err.status === 409 && /past or cancelled/.test(err.message)
    );
    assert.equal(getSlot({ db, clock }, slot.id).id, slot.id);
  } finally {
    db.close();
  }
});

test('staff can delete empty pickup slots', () => {
  const db = openDatabase();

  try {
    const slot = createSlot({ db, clock }, { starts_at: '2026-11-10T14:00', capacity: 4 });
    deleteSlot({ db, clock }, slot.id);

    assert.throws(() => getSlot({ db, clock }, slot.id), /not found/i);
  } finally {
    db.close();
  }
});
