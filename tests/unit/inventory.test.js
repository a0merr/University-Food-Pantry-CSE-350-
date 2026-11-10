import test from 'node:test';
import assert from 'node:assert/strict';

import { openDatabase } from '../../src/db.js';
import {
  listItems,
  createItem,
  updateItem,
  recordDonation
} from '../../src/services/inventory.js';

test('staff can add a food item to inventory', () => {
  const db = openDatabase();

  try {
    const item = createItem(
      { db },
      { name: 'Rice', category: 'Grains', quantity: 25 }
    );

    assert.equal(item.name, 'Rice');
    assert.equal(item.quantity, 25);
  } finally {
    db.close();
  }
});

test('donations increase the inventory quantity', () => {
  const db = openDatabase();

  try {
    const item = createItem(
      { db },
      { name: 'Rice', category: 'Grains', quantity: 25 }
    );

    recordDonation(
      { db },
      { item_id: item.id, quantity: 15, source: 'Community Donation' }
    );

    const items = listItems({ db });

    assert.equal(items[0].quantity, 40);
  } finally {
    db.close();
  }
});

test('staff can update inventory quantities', () => {
  const db = openDatabase();

  try {
    const item = createItem(
      { db },
      { name: 'Rice', category: 'Grains', quantity: 25 }
    );

    const updatedItem = updateItem(
      { db },
      item.id,
      { quantity: 30 }
    );

    assert.equal(updatedItem.quantity, 30);
  } finally {
    db.close();
  }
});
