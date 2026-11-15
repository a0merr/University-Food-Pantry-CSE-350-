// FR7 item details: low-stock threshold, per-visit limit, dietary tags, editing and retiring
// items (defects D-17 to D-19), at the service and the route level.
// AI-generated (Claude Code) - see docs/AI_USAGE.md
import test from 'node:test';
import assert from 'node:assert/strict';

import { openDatabase } from '../../src/db.js';
import { createItem, updateItem, listItems, normalizeTags } from '../../src/services/inventory.js';
import { schedule } from '../../src/services/pickups.js';
import { inventoryRoutes } from '../../src/routes/inventory.js';
import { addItem, addSlot, addUser, addUserSession, appWith, start, call } from '../helpers.js';

function withDb(fn) {
  const db = openDatabase();
  try {
    return fn(db);
  } finally {
    db.close();
  }
}

test('normalizeTags lower-cases, trims and removes duplicates from a string or a list', () => {
  assert.equal(normalizeTags(' Vegan, gluten-free ,vegan,, '), 'vegan, gluten-free');
  assert.equal(normalizeTags(['Halal', 'halal', ' Kosher ']), 'halal, kosher');
  assert.equal(normalizeTags(''), '');
  assert.equal(normalizeTags(undefined), '');
  assert.equal(normalizeTags(null), '');
});

test('normalizeTags rejects too many, too long or non-text tags', () => {
  assert.throws(() => normalizeTags(Array.from({ length: 11 }, (_, i) => `tag${i}`)), { status: 400 });
  assert.throws(() => normalizeTags('x'.repeat(31)), { status: 400 });
  assert.throws(() => normalizeTags(42), { status: 400 });
});

test('createItem stores the threshold, per-visit limit and dietary tags', () => withDb((db) => {
  const item = createItem({ db }, {
    name: 'Lentils', category: 'Protein', quantity: 8,
    low_stock_threshold: 3, per_visit_limit: 2, dietary_tags: ['Vegan', 'gluten-free']
  });
  assert.equal(item.low_stock_threshold, 3);
  assert.equal(item.per_visit_limit, 2);
  assert.equal(item.dietary_tags, 'vegan, gluten-free');
  assert.equal(item.active, 1);
}));

test('createItem defaults: threshold 0, no limit, no tags; a blank limit means no limit', () => withDb((db) => {
  const plain = createItem({ db }, { name: 'Tea', category: 'Drinks' });
  assert.equal(plain.low_stock_threshold, 0);
  assert.equal(plain.per_visit_limit, null);
  assert.equal(plain.dietary_tags, '');
  assert.equal(createItem({ db }, { name: 'Jam', category: 'Spreads', per_visit_limit: '' }).per_visit_limit, null);
}));

test('createItem validates the threshold, limit and name length', () => withDb((db) => {
  const base = { name: 'Rice', category: 'Grains', quantity: 1 };
  assert.throws(() => createItem({ db }, { ...base, low_stock_threshold: -1 }), { status: 400 });
  assert.throws(() => createItem({ db }, { ...base, low_stock_threshold: 'lots' }), { status: 400 });
  assert.throws(() => createItem({ db }, { ...base, per_visit_limit: 0 }), { status: 400 });
  assert.throws(() => createItem({ db }, { ...base, per_visit_limit: 101 }), { status: 400 });
  assert.throws(() => createItem({ db }, { ...base, name: 'x'.repeat(101) }), { status: 400 });
  assert.throws(() => createItem({ db }, { ...base, name: 42 }), { message: 'Name and category are required.' });
}));

test('updateItem changes only the fields that are sent', () => withDb((db) => {
  const id = addItem(db, { name: 'Rice', quantity: 10, threshold: 2, perVisitLimit: 4 });
  const updated = updateItem({ db }, id, { low_stock_threshold: 6 });
  assert.equal(updated.low_stock_threshold, 6);
  assert.equal(updated.quantity, 10);
  assert.equal(updated.per_visit_limit, 4);

  assert.equal(updateItem({ db }, id, { per_visit_limit: null }).per_visit_limit, null);
  assert.equal(updateItem({ db }, id, { dietary_tags: 'Vegan' }).dietary_tags, 'vegan');
  const renamed = updateItem({ db }, id, { name: ' Brown Rice ', category: ' Grains ' });
  assert.equal(renamed.name, 'Brown Rice');
  assert.equal(renamed.category, 'Grains');
}));

test('updateItem validates every field it is given', () => withDb((db) => {
  const id = addItem(db);
  assert.throws(() => updateItem({ db }, id, { name: '  ' }), { message: 'Name is required.' });
  assert.throws(() => updateItem({ db }, id, { category: '' }), { message: 'Category is required.' });
  assert.throws(() => updateItem({ db }, id, { low_stock_threshold: -2 }), { status: 400 });
  assert.throws(() => updateItem({ db }, id, { per_visit_limit: 0 }), { status: 400 });
  assert.throws(() => updateItem({ db }, id, { active: 'no' }), { message: 'Active must be true or false.' });
  assert.throws(() => updateItem({ db }, id, { unknown: 1 }), { message: 'Nothing to update.' });
}));

test('a retired item is hidden from booking and can be restored', () => withDb((db) => {
  const id = addItem(db, { name: 'Soup', quantity: 5 });
  const student = addUser(db, { role: 'student' });
  const slot = addSlot(db);

  assert.equal(updateItem({ db }, id, { active: false }).active, 0);
  assert.equal(listItems({ db }).find(item => item.id === id).active, 0);
  assert.throws(() => schedule({ db }, student, { slot_id: slot, items: [{ item_id: id, quantity: 1 }] }),
    { message: 'Pantry item not found.' });

  assert.equal(updateItem({ db }, id, { active: true }).active, 1);
  assert.equal(schedule({ db }, student, { slot_id: slot, items: [{ item_id: id, quantity: 1 }] }).status, 'scheduled');
}));

test('the per-visit limit set by staff is enforced when a student books', () => withDb((db) => {
  const id = addItem(db, { name: 'Peanut Butter', quantity: 10 });
  updateItem({ db }, id, { per_visit_limit: 2 });
  const student = addUser(db, { role: 'student' });
  const slot = addSlot(db);
  assert.throws(() => schedule({ db }, student, { slot_id: slot, items: [{ item_id: id, quantity: 3 }] }),
    { message: 'Peanut Butter is limited to 2 per visit.' });
}));

// ---- routes ----

test('staff edits through the API open and close low-stock alerts (FR7, FR9)', async () => {
  const db = openDatabase();
  const { server, url } = await start(appWith([['/api', inventoryRoutes(db)]]));
  try {
    const staff = addUserSession(db, { role: 'staff' });
    const student = addUserSession(db, { role: 'student' });
    const openAlerts = () => db.prepare('SELECT item_id FROM low_stock_alerts WHERE resolved_at IS NULL').all().map(row => row.item_id);

    const created = await call(url, '/api/items', {
      method: 'POST', cookie: staff.cookie,
      body: { name: 'Lentils', category: 'Protein', quantity: 2, low_stock_threshold: 5, dietary_tags: 'vegan' }
    });
    assert.equal(created.status, 201);
    const id = created.body.item.id;
    assert.deepEqual(openAlerts(), [id], 'a new item below its threshold raises an alert');

    const donated = await call(url, '/api/donations', {
      method: 'POST', cookie: staff.cookie, body: { item_id: id, quantity: 10, source: 'Food drive' }
    });
    assert.equal(donated.status, 201);
    assert.deepEqual(openAlerts(), [], 'restocking resolves the alert');

    const raised = await call(url, `/api/items/${id}`, {
      method: 'PATCH', cookie: staff.cookie, body: { low_stock_threshold: 20 }
    });
    assert.equal(raised.status, 200);
    assert.equal(openAlerts().length, 1, 'raising the threshold above the stock raises an alert');

    const retired = await call(url, `/api/items/${id}`, { method: 'PATCH', cookie: staff.cookie, body: { active: false } });
    assert.equal(retired.body.item.active, 0);
    assert.deepEqual(openAlerts(), [], 'retired items have no alerts');

    const refused = await call(url, `/api/items/${id}`, { method: 'PATCH', cookie: student.cookie, body: { active: true } });
    assert.equal(refused.status, 403);
    const bad = await call(url, `/api/items/${id}`, { method: 'PATCH', cookie: staff.cookie, body: { per_visit_limit: -1 } });
    assert.equal(bad.status, 400);
  } finally {
    server.close();
    db.close();
  }
});
