import test from 'node:test';
import assert from 'node:assert/strict';

import { openDatabase } from '../../src/db.js';
import { checkLowStock, listOpenAlerts } from '../../src/services/alerts.js';

function addItem(db, overrides = {}) {
  const values = {
    name: 'Rice',
    category: 'Grains',
    quantity: 3,
    reserved: 0,
    low_stock_threshold: 5,
    created_at: '2026-11-10T09:00:00',
    updated_at: '2026-11-10T09:00:00',
    ...overrides
  };

  const result = db.prepare(`
    INSERT INTO items
    (name, category, quantity, reserved, low_stock_threshold, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    values.name,
    values.category,
    values.quantity,
    values.reserved,
    values.low_stock_threshold,
    values.created_at,
    values.updated_at
  );

  return Number(result.lastInsertRowid);
}

test('checkLowStock opens one alert for an item at or below threshold', () => {
  const db = openDatabase();

  try {
    const itemId = addItem(db);

    const result = checkLowStock({ db });
    const alerts = listOpenAlerts({ db });

    assert.deepEqual(result, { opened: 1, resolved: 0 });
    assert.equal(alerts.length, 1);
    assert.equal(alerts[0].item_id, itemId);
    assert.equal(alerts[0].available, 3);
    assert.equal(alerts[0].threshold, 5);
  } finally {
    db.close();
  }
});

test('checkLowStock does not duplicate an open alert', () => {
  const db = openDatabase();

  try {
    addItem(db);

    checkLowStock({ db });
    const result = checkLowStock({ db });

    assert.deepEqual(result, { opened: 0, resolved: 0 });
    assert.equal(listOpenAlerts({ db }).length, 1);
  } finally {
    db.close();
  }
});

test('checkLowStock resolves alerts when available stock recovers', () => {
  const db = openDatabase();

  try {
    const itemId = addItem(db);
    checkLowStock({ db });

    db.prepare('UPDATE items SET quantity = 10 WHERE id = ?').run(itemId);
    const result = checkLowStock({ db });

    assert.deepEqual(result, { opened: 0, resolved: 1 });
    assert.equal(listOpenAlerts({ db }).length, 0);
  } finally {
    db.close();
  }
});
