// Student dietary filter (FR3), "Your pickup" with Cancel (FR6) and the staff inventory
// panel (FR7): the helpers, GET /api/pickups, and the page scripts run in jsdom.
// AI-generated (Claude Code) - see docs/AI_USAGE.md
import test from 'node:test';
import assert from 'node:assert/strict';

import { openDatabase } from '../../src/db.js';
import { listForStudent, schedule, cancel } from '../../src/services/pickups.js';
import { pickupRoutes } from '../../src/routes/pickups.js';
import { dietaryTagsFor, filterItems, tagsOf } from '../../public/js/student-filter.js';
import {
  addItem, addSlot, addUser, addUserSession, appWith, start, call,
  installDom, fakeServer, importPage, flush
} from '../helpers.js';

function text(node) {
  const parts = [];
  const walk = (n) => {
    if (n.nodeType === 3) parts.push(n.nodeValue);
    else for (const child of n.childNodes) walk(child);
  };
  walk(node);
  return parts.map(p => p.trim()).filter(Boolean).join(' ');
}

// ---- student-filter.js: dietary tags (FR3) ----

const shelf = [
  { id: 1, name: 'Rice', category: 'Grains', available: 4, active: 1, dietary_tags: 'vegan, gluten-free' },
  { id: 2, name: 'Cereal', category: 'Breakfast', available: 2, active: 1, dietary_tags: 'Vegetarian' },
  { id: 3, name: 'Soup', category: 'Canned', available: 3, active: 1, dietary_tags: '' },
  { id: 4, name: 'Gone', category: 'Grains', available: 0, active: 1, dietary_tags: 'halal' },
  { id: 5, name: 'Old', category: 'Grains', available: 5, active: 0, dietary_tags: 'kosher' }
];

test('FR3 dietary tags are read case-insensitively and listed only for items students can see', () => {
  assert.deepEqual(tagsOf(shelf[1]), ['vegetarian']);
  assert.deepEqual(tagsOf({}), []);
  assert.deepEqual(dietaryTagsFor(shelf), ['gluten-free', 'vegan', 'vegetarian']);
});

test('FR3 the dietary filter combines with search and category', () => {
  assert.deepEqual(filterItems(shelf, '', '', 'vegan').map(i => i.name), ['Rice']);
  assert.deepEqual(filterItems(shelf, '', '', 'VEGETARIAN').map(i => i.name), ['Cereal']);
  assert.deepEqual(filterItems(shelf, 'rice', 'grains', 'gluten-free').map(i => i.name), ['Rice']);
  assert.deepEqual(filterItems(shelf, '', 'breakfast', 'vegan'), []);
  assert.equal(filterItems(shelf, '', '', '').length, 3, 'no dietary choice keeps every visible item');
});

// ---- listForStudent and GET /api/pickups (FR6) ----

test('listForStudent returns only the student\'s own open pickups, soonest first', () => {
  const db = openDatabase();
  try {
    const item = addItem(db, { quantity: 20 });
    const later = addSlot(db, '2099-12-02T10:00:00', 5);
    const sooner = addSlot(db, '2099-12-01T10:00:00', 5);
    const ada = addUser(db, { role: 'student' });
    const bob = addUser(db, { role: 'student' });
    const first = schedule({ db }, ada, { slot_id: later, items: [{ item_id: item, quantity: 1 }] });
    schedule({ db }, bob, { slot_id: sooner, items: [{ item_id: item, quantity: 2 }] });

    const mine = listForStudent({ db }, ada);
    assert.equal(mine.length, 1);
    assert.equal(mine[0].id, first.id);
    assert.equal(mine[0].starts_at, '2099-12-02T10:00:00');
    assert.deepEqual(mine[0].items.map(i => i.quantity), [1]);

    cancel({ db }, first.id, { role: 'staff' });
    assert.deepEqual(listForStudent({ db }, ada), [], 'cancelled pickups are not listed');
    assert.throws(() => listForStudent({ db }, 'x'), { status: 400 });
  } finally {
    db.close();
  }
});

test('GET /api/pickups is for signed-in students only and shows their own pickups', async () => {
  const db = openDatabase();
  const { server, url } = await start(appWith([['/api', pickupRoutes(db)]]));
  try {
    const item = addItem(db, { quantity: 9 });
    const slot = addSlot(db);
    const student = addUserSession(db, { role: 'student' });
    const staff = addUserSession(db, { role: 'staff' });
    schedule({ db }, student.userId, { slot_id: slot, items: [{ item_id: item, quantity: 2 }] });

    const own = await call(url, '/api/pickups', { cookie: student.cookie });
    assert.equal(own.status, 200);
    assert.equal(own.body.pickups.length, 1);
    assert.equal(own.body.pickups[0].items[0].quantity, 2);
    assert.equal((await call(url, '/api/pickups', { cookie: staff.cookie })).status, 403);
    assert.equal((await call(url, '/api/pickups')).status, 401);
  } finally {
    server.close();
    db.close();
  }
});

// ---- student-mypickup.js (FR6) ----

const openPickup = {
  id: 5, status: 'scheduled', starts_at: '2099-05-01T14:00:00',
  items: [{ name: 'Rice', quantity: 2 }, { name: 'Pasta', quantity: 1 }]
};

async function loadMyPickup(routes) {
  const env = installDom('student.html', fakeServer(routes));
  await importPage('student-mypickup.js');
  await flush();
  return env;
}

test('"Your pickup" shows the open pickup and cancels it after a second click', async () => {
  let cancelled = false;
  const env = await loadMyPickup({
    'GET /api/pickups': () => ({ pickups: cancelled ? [] : [openPickup] }),
    'POST /api/pickups/5/cancel': () => { cancelled = true; return { pickup: { ...openPickup, status: 'cancelled' } }; }
  });
  try {
    const { document } = env;
    let heard = 0;
    document.addEventListener('pickup-cancelled', () => { heard += 1; });
    const card = document.querySelector('#my-pickup-list .my-pickup');
    assert.match(text(card), /2 x Rice, 1 x Pasta/);
    assert.match(text(card), /Scheduled/);

    const button = document.querySelector('#cancel-pickup-5');
    button.click();
    await flush();
    assert.equal(cancelled, false, 'the first click only asks for confirmation');
    assert.equal(button.textContent, 'Confirm cancel');
    assert.match(document.querySelector('#cancel-pickup-5-prompt').textContent, /return the items to the pantry/);

    button.click();
    await flush();
    assert.equal(cancelled, true);
    assert.equal(text(document.querySelector('#my-pickup-message')), 'Pickup cancelled. The items were returned to the pantry.');
    assert.equal(text(document.querySelector('#my-pickup-list')), 'You have no pickup booked.');
    assert.equal(heard, 1, 'tells the booking form to refresh');
  } finally {
    env.restore();
  }
});

test('"Your pickup" reloads after a booking and shows errors', async () => {
  let booked = false;
  const env = await loadMyPickup({
    'GET /api/pickups': () => ({ pickups: booked ? [openPickup] : [] }),
    'POST /api/pickups/5/cancel': [409, { error: { message: 'Only open pickup requests can be cancelled.' } }]
  });
  try {
    const { document, window } = env;
    assert.equal(text(document.querySelector('#my-pickup-list')), 'You have no pickup booked.');
    booked = true;
    document.dispatchEvent(new window.Event('pickup-booked'));
    await flush();
    const button = document.querySelector('#cancel-pickup-5');
    assert.ok(button, 'the new booking is listed');
    button.click();
    button.click();
    await flush();
    assert.equal(text(document.querySelector('#my-pickup-message')), 'Only open pickup requests can be cancelled.');
  } finally {
    env.restore();
  }
});

// ---- student-pickup.js: dietary menu, tags and limits (FR3, FR4) ----

test('student page offers a dietary menu, shows tags and caps quantities at the per-visit limit', async () => {
  const env = installDom('student.html', fakeServer({
    'GET /api/items': { items: [
      { id: 1, name: 'Rice', category: 'Grains', available: 9, active: 1, dietary_tags: 'vegan, gluten-free', per_visit_limit: 2 },
      { id: 2, name: 'Cereal', category: 'Breakfast', available: 4, active: 1, dietary_tags: 'vegetarian', per_visit_limit: null }
    ] },
    'GET /api/pickup-slots': { slots: [{ id: 10, starts_at: '2099-05-01T10:00:00', available: 2 }] },
    'GET /api/notifications?unread=true': { notifications: [] },
    'POST /api/pickups': [201, { pickup: { id: 1 } }]
  }));
  try {
    await importPage('student-pickup.js');
    await flush();
    const { document, window } = env;
    const diet = document.querySelector('#student-diet');
    assert.deepEqual([...diet.options].map(o => o.textContent), ['Any diet', 'Gluten-free', 'Vegan', 'Vegetarian']);

    const rice = document.querySelector('#student-item-list .pickup-item');
    assert.match(text(rice), /Vegan · Gluten-free · Limit 2 per visit/);
    assert.equal(rice.querySelector('input').getAttribute('max'), '2', 'max is the per-visit limit, not the stock');

    diet.value = 'vegetarian';
    diet.dispatchEvent(new window.Event('change'));
    const names = [...document.querySelectorAll('#student-item-list h3')].map(h => h.textContent);
    assert.deepEqual(names, ['Cereal']);

    let booked = 0;
    document.addEventListener('pickup-booked', () => { booked += 1; });
    const input = document.querySelector('#student-item-list input');
    input.value = '1';
    input.dispatchEvent(new window.Event('change'));
    document.querySelector('#student-slot-list button.slot').click();
    document.querySelector('#student-pickup-form').dispatchEvent(new window.Event('submit', { cancelable: true }));
    await flush();
    assert.equal(booked, 1, 'tells "Your pickup" to reload');
  } finally {
    env.restore();
  }
});

// ---- staff-inventory.js (FR7) ----

const stock = [
  { id: 1, name: 'Rice', category: 'Grains', dietary_tags: 'vegan', quantity: 10, reserved: 2, available: 8,
    low_stock_threshold: 5, per_visit_limit: 3, active: 1 },
  { id: 2, name: 'Old Soup', category: 'Canned', dietary_tags: '', quantity: 0, reserved: 0, available: 0,
    low_stock_threshold: 0, per_visit_limit: null, active: 0 }
];

async function loadInventory(routes) {
  const env = installDom('staff.html', fakeServer({ 'GET /api/items': { items: stock }, ...routes }));
  await importPage('staff-inventory.js');
  await flush();
  return env;
}

test('staff inventory lists every item, active and retired, with its details', async () => {
  const env = await loadInventory({});
  try {
    const { document } = env;
    const rows = document.querySelectorAll('#item-list tbody tr');
    assert.equal(rows.length, 2);
    assert.match(text(rows[0]), /Rice Grains vegan 10 2 8 5 3 Active Edit Retire/);
    assert.match(text(rows[1]), /Old Soup Canned — 0 0 0 0 — Retired Edit Restore/);
    assert.deepEqual([...document.querySelectorAll('#donation-item option')].map(o => o.textContent),
      ['Rice', 'Old Soup (retired)']);
  } finally {
    env.restore();
  }
});

test('staff add an item with its threshold, limit and tags', async () => {
  const env = await loadInventory({ 'POST /api/items': [201, { item: { id: 3 } }] });
  try {
    const { document, window, calls } = env;
    let changed = 0;
    document.addEventListener('inventory-changed', () => { changed += 1; });
    document.querySelector('#item-name').value = 'Lentils';
    document.querySelector('#item-category').value = 'Protein';
    document.querySelector('#item-quantity').value = '12';
    document.querySelector('#item-threshold').value = '4';
    document.querySelector('#item-limit').value = '';
    document.querySelector('#item-tags').value = 'vegan, gluten-free';
    document.querySelector('#item-form').dispatchEvent(new window.Event('submit', { cancelable: true }));
    await flush();

    const post = calls.find(c => c.method === 'POST' && c.path === '/api/items');
    assert.deepEqual(post.body, {
      name: 'Lentils', category: 'Protein', quantity: 12, low_stock_threshold: 4,
      per_visit_limit: null, dietary_tags: 'vegan, gluten-free'
    });
    assert.equal(text(document.querySelector('#item-message')), 'Item added.');
    assert.equal(changed, 1, 'tells the alerts panel to refresh');
  } finally {
    env.restore();
  }
});

test('staff edit an item: the form fills in, saves with PATCH, then resets', async () => {
  const env = await loadInventory({ 'PATCH /api/items/1': { item: { id: 1 } } });
  try {
    const { document, window, calls } = env;
    document.querySelector('#item-list button[aria-label="Edit Rice"]').click();
    assert.equal(document.querySelector('#item-name').value, 'Rice');
    assert.equal(document.querySelector('#item-limit').value, '3');
    assert.equal(document.querySelector('#item-quantity').min, '2', 'cannot go below what is reserved');
    assert.equal(document.querySelector('#item-submit').textContent, 'Save Changes');
    assert.equal(document.querySelector('#item-form-title').textContent, 'Edit Rice');
    assert.equal(document.querySelector('#item-cancel-edit').hidden, false);

    document.querySelector('#item-threshold').value = '7';
    document.querySelector('#item-form').dispatchEvent(new window.Event('submit', { cancelable: true }));
    await flush();
    const patch = calls.find(c => c.method === 'PATCH');
    assert.equal(patch.path, '/api/items/1');
    assert.equal(patch.body.low_stock_threshold, 7);
    assert.equal(patch.body.per_visit_limit, 3);
    assert.equal(text(document.querySelector('#item-message')), 'Item updated.');
    assert.equal(document.querySelector('#item-submit').textContent, 'Add Item');

    document.querySelector('#item-list button[aria-label="Edit Rice"]').click();
    document.querySelector('#item-cancel-edit').click();
    assert.equal(document.querySelector('#item-form-title').textContent, 'Add an item');
    assert.equal(document.querySelector('#item-cancel-edit').hidden, true);
  } finally {
    env.restore();
  }
});

test('staff retire and restore items', async () => {
  const env = await loadInventory({
    'PATCH /api/items/1': { item: { id: 1, active: 0 } },
    'PATCH /api/items/2': { item: { id: 2, active: 1 } }
  });
  try {
    const { document, calls } = env;
    document.querySelector('#item-list button[aria-label="Retire Rice"]').click();
    await flush();
    assert.deepEqual(calls.find(c => c.path === '/api/items/1').body, { active: false });
    assert.equal(text(document.querySelector('#item-message')), 'Rice retired. Students no longer see it.');

    document.querySelector('#item-list button[aria-label="Restore Old Soup"]').click();
    await flush();
    assert.deepEqual(calls.find(c => c.path === '/api/items/2').body, { active: true });
    assert.equal(text(document.querySelector('#item-message')), 'Old Soup restored. Students can request it again.');
  } finally {
    env.restore();
  }
});

test('staff log a donation, and server errors are shown', async () => {
  const env = await loadInventory({
    'POST /api/donations': [201, { item: { id: 1 } }],
    'POST /api/items': [400, { error: { message: 'Per-visit limit must be between 1 and 100.' } }]
  });
  try {
    const { document, window, calls } = env;
    document.querySelector('#donation-item').value = '1';
    document.querySelector('#donation-quantity').value = '6';
    document.querySelector('#donation-source').value = ' Food drive ';
    document.querySelector('#donation-form').dispatchEvent(new window.Event('submit', { cancelable: true }));
    await flush();
    assert.deepEqual(calls.find(c => c.path === '/api/donations').body, { item_id: 1, quantity: 6, source: 'Food drive' });
    assert.equal(text(document.querySelector('#donation-message')), 'Donation logged. Stock updated.');

    document.querySelector('#item-name').value = 'X';
    document.querySelector('#item-category').value = 'Y';
    document.querySelector('#item-limit').value = '500';
    document.querySelector('#item-form').dispatchEvent(new window.Event('submit', { cancelable: true }));
    await flush();
    assert.equal(text(document.querySelector('#item-message')), 'Per-visit limit must be between 1 and 100.');
  } finally {
    env.restore();
  }
});

test('the inventory panel shows an empty state and load errors', async () => {
  const empty = await loadInventory({ 'GET /api/items': { items: [] } });
  try {
    assert.equal(text(empty.document.querySelector('#item-list')), 'No items yet. Add the first one above.');
  } finally {
    empty.restore();
  }
  const broken = await loadInventory({ 'GET /api/items': [500, { error: { message: 'Could not load items.' } }] });
  try {
    assert.equal(text(broken.document.querySelector('#item-message')), 'Could not load items.');
  } finally {
    broken.restore();
  }
});
