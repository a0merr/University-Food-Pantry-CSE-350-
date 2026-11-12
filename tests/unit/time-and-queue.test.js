import test from 'node:test';
import assert from 'node:assert/strict';

import { openDatabase } from '../../src/db.js';
import { parseLocalIso, toLocalIso } from '../../src/lib/time.js';
import { createSlot } from '../../src/services/slots.js';
import { queue, schedule } from '../../src/services/pickups.js';

// Each test file runs in its own process, so this only affects these tests.
process.env.TZ = 'America/New_York';

const clock = { now: () => new Date(2099, 0, 1, 9, 0, 0) };

test('queue date filter includes a pickup at the last second of the day', () => {
  const db = openDatabase();

  try {
    const student = Number(db.prepare(`
      INSERT INTO users (email, name, password_hash, role, created_at)
      VALUES ('student@example.edu', 'Student', 'hash', 'student', '2099-01-01T09:00:00')
    `).run().lastInsertRowid);
    const item = Number(db.prepare(`
      INSERT INTO items (name, category, quantity, created_at, updated_at)
      VALUES ('Rice', 'Grains', 5, '2099-01-01T09:00:00', '2099-01-01T09:00:00')
    `).run().lastInsertRowid);
    const slot = createSlot({ db, clock }, { starts_at: '2099-05-01T23:59:59', capacity: 2 });

    schedule({ db, clock }, student, { slot_id: slot.id, items: [{ item_id: item, quantity: 1 }] });

    assert.equal(queue({ db }, { date: '2099-05-01' }).length, 1);
    assert.equal(queue({ db }, { date: '2099-05-02' }).length, 0);
  } finally {
    db.close();
  }
});

test('a time skipped by daylight saving is rejected, a repeated one is kept', () => {
  assert.equal(parseLocalIso('2026-03-08T02:30'), null);
  assert.equal(toLocalIso(parseLocalIso('2026-03-08T03:30')), '2026-03-08T03:30:00');
  assert.equal(toLocalIso(parseLocalIso('2026-11-01T01:30')), '2026-11-01T01:30:00');

  const db = openDatabase();
  try {
    assert.throws(
      () => createSlot({ db, clock: { now: () => new Date(2026, 0, 1) } }, { starts_at: '2026-03-08T02:30', capacity: 1 }),
      (err) => err.status === 400
    );
  } finally {
    db.close();
  }
});
