import test from 'node:test';
import assert from 'node:assert/strict';

import { openDatabase } from '../../src/db.js';
import { schedule, prepare, complete, cancel } from '../../src/services/pickups.js';
import { staffReport } from '../../src/services/reports.js';

function addUser(db, role, email) {
  return Number(db.prepare(`
    INSERT INTO users (email, name, password_hash, role, created_at)
    VALUES (?, 'User', 'hash', ?, '2026-11-10T09:00:00')
  `).run(email, role).lastInsertRowid);
}

function addItem(db) {
  return Number(db.prepare(`
    INSERT INTO items
    (name, category, quantity, low_stock_threshold, created_at, updated_at)
    VALUES ('Rice', 'Grains', 10, 2, '2026-11-10T09:00:00', '2026-11-10T09:00:00')
  `).run().lastInsertRowid);
}

function addSlot(db) {
  return Number(db.prepare(`
    INSERT INTO pickup_slots (starts_at, capacity)
    VALUES ('2099-11-10T14:00:00', 2)
  `).run().lastInsertRowid);
}

test('staffReport summarizes pickup statuses, top items, and inventory', () => {
  const db = openDatabase();

  try {
    const studentId = addUser(db, 'student', 'student@example.edu');
    const itemId = addItem(db);
    const slotId = addSlot(db);
    const pickup = schedule(
      { db },
      studentId,
      { slot_id: slotId, items: [{ item_id: itemId, quantity: 3 }] }
    );
    prepare({ db }, pickup.id);
    complete({ db }, pickup.id);

    const report = staffReport({ db }, { from: '2026-11-10', to: '2099-12-31' });

    assert.equal(report.pickups.status_counts.find(row => row.status === 'picked_up').count, 1);
    assert.equal(report.pickups.top_items[0].name, 'Rice');
    assert.equal(report.pickups.top_items[0].quantity, 3);
    assert.equal(report.inventory.summary.active_items, 1);
    assert.equal(report.inventory.summary.total_available, 7);
  } finally {
    db.close();
  }
});

test('staffReport rejects invalid date filters', () => {
  const db = openDatabase();

  try {
    assert.throws(
      () => staffReport({ db }, { from: '2026-99-10' }),
      /valid date/
    );
  } finally {
    db.close();
  }
});

test('staffReport top items leave out cancelled requests', () => {
  const db = openDatabase();

  try {
    const firstId = addUser(db, 'student', 'first@example.edu');
    const secondId = addUser(db, 'student', 'second@example.edu');
    const itemId = addItem(db);
    const slotId = addSlot(db);
    const kept = schedule(
      { db },
      firstId,
      { slot_id: slotId, items: [{ item_id: itemId, quantity: 2 }] }
    );
    const dropped = schedule(
      { db },
      secondId,
      { slot_id: slotId, items: [{ item_id: itemId, quantity: 1 }] }
    );
    cancel({ db }, dropped.id, { role: 'staff' });
    prepare({ db }, kept.id);
    complete({ db }, kept.id);

    const report = staffReport({ db });

    assert.equal(report.pickups.status_counts.find(row => row.status === 'cancelled').count, 1);
    assert.equal(report.pickups.top_items.length, 1);
    assert.equal(report.pickups.top_items[0].quantity, 2);
  } finally {
    db.close();
  }
});
