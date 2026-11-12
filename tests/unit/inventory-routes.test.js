import test from 'node:test';
import assert from 'node:assert/strict';

import { openDatabase } from '../../src/db.js';
import { inventoryRoutes } from '../../src/routes/inventory.js';
import { addItem, addUserSession, appWith, start, call } from '../helpers.js';

const db = openDatabase();
const { server, url } = await start(appWith([['/api', inventoryRoutes(db)]]));
test.after(() => {
  server.close();
  db.close();
});

const staff = addUserSession(db, { role: 'staff' });
const student = addUserSession(db, { role: 'student' });

test('anyone can list items, sorted by name with available stock', async () => {
  db.exec('DELETE FROM items');
  addItem(db, { name: 'Pasta', quantity: 5, reserved: 2 });
  addItem(db, { name: 'Beans', quantity: 3 });

  const res = await call(url, '/api/items');
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.items.map(item => item.name), ['Beans', 'Pasta']);
  assert.equal(res.body.items[1].available, 3);
});

test('staff can create an item', async () => {
  const res = await call(url, '/api/items', {
    method: 'POST',
    cookie: staff.cookie,
    body: { name: ' Oatmeal ', category: ' Breakfast ', quantity: 12 }
  });
  assert.equal(res.status, 201);
  assert.equal(res.body.item.name, 'Oatmeal');
  assert.equal(res.body.item.category, 'Breakfast');
  assert.equal(res.body.item.quantity, 12);
});

test('item creation is refused without a session or for students', async () => {
  const body = { name: 'Rice', category: 'Grains', quantity: 1 };
  const anon = await call(url, '/api/items', { method: 'POST', body });
  const bad = await call(url, '/api/items', { method: 'POST', body, cookie: 'session=bogus' });
  const stu = await call(url, '/api/items', { method: 'POST', body, cookie: student.cookie });

  assert.equal(anon.status, 401);
  assert.equal(bad.status, 401);
  assert.equal(stu.status, 403);
});

test('item creation validates input', async () => {
  const missing = await call(url, '/api/items', { method: 'POST', cookie: staff.cookie, body: { name: 'Rice' } });
  const negative = await call(url, '/api/items', {
    method: 'POST', cookie: staff.cookie, body: { name: 'Rice', category: 'Grains', quantity: -1 }
  });
  assert.equal(missing.status, 400);
  assert.equal(negative.status, 400);
});

test('staff can update an item quantity', async () => {
  const id = addItem(db, { name: 'Soup', quantity: 2 });
  const res = await call(url, `/api/items/${id}`, { method: 'PATCH', cookie: staff.cookie, body: { quantity: 9 } });
  assert.equal(res.status, 200);
  assert.equal(res.body.item.quantity, 9);
});

test('updating rejects bad IDs, unknown items and bad quantities', async () => {
  const id = addItem(db, { name: 'Tuna', quantity: 5, reserved: 3 });

  const badId = await call(url, '/api/items/abc', { method: 'PATCH', cookie: staff.cookie, body: { quantity: 1 } });
  const zeroId = await call(url, '/api/items/0', { method: 'PATCH', cookie: staff.cookie, body: { quantity: 1 } });
  const missing = await call(url, '/api/items/99999', { method: 'PATCH', cookie: staff.cookie, body: { quantity: 1 } });
  const belowReserved = await call(url, `/api/items/${id}`, { method: 'PATCH', cookie: staff.cookie, body: { quantity: 2 } });
  const student403 = await call(url, `/api/items/${id}`, { method: 'PATCH', cookie: student.cookie, body: { quantity: 9 } });

  assert.equal(badId.status, 400);
  assert.equal(badId.body.error.message, 'Invalid item ID.');
  assert.equal(zeroId.status, 400);
  assert.equal(missing.status, 404);
  assert.equal(belowReserved.status, 400);
  assert.equal(student403.status, 403);
});

test('staff can log a donation, recorded against their user', async () => {
  const id = addItem(db, { name: 'Cereal', quantity: 4 });
  const res = await call(url, '/api/donations', {
    method: 'POST',
    cookie: staff.cookie,
    body: { item_id: id, quantity: 6, source: 'Food drive', logged_by: 12345 }
  });
  assert.equal(res.status, 201);
  assert.equal(res.body.item.quantity, 10);

  const donation = db.prepare('SELECT * FROM donations WHERE item_id = ?').get(id);
  assert.equal(donation.source, 'Food drive');
  assert.equal(donation.logged_by, staff.userId, 'logged_by comes from the session, not the body');
});

test('donations validate input and require staff', async () => {
  const id = addItem(db, { name: 'Milk' });
  const zero = await call(url, '/api/donations', { method: 'POST', cookie: staff.cookie, body: { item_id: id, quantity: 0 } });
  const missingItem = await call(url, '/api/donations', { method: 'POST', cookie: staff.cookie, body: { item_id: 99999, quantity: 1 } });
  const stu = await call(url, '/api/donations', { method: 'POST', cookie: student.cookie, body: { item_id: id, quantity: 1 } });

  assert.equal(zero.status, 400);
  assert.equal(missingItem.status, 404);
  assert.equal(stu.status, 403);
});
