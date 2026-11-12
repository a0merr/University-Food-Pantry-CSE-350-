// The page scripts in public/js, run in jsdom against a fake API.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

import { installDom, fakeServer, importPage, flush } from '../helpers.js';

const pickup = (overrides = {}) => ({
  id: 1,
  status: 'scheduled',
  starts_at: '2099-05-01T10:00:00',
  student_name: 'Ada',
  student_email: 'ada@example.edu',
  items: [{ name: 'Rice', quantity: 2 }, { name: 'Beans', quantity: 1 }],
  ...overrides
});

const report = {
  pickups: {
    status_counts: [{ status: 'picked_up', count: 3 }, { status: 'weird', count: 1 }],
    daily_pickups: [],
    top_items: [{ item_id: 1, name: 'Rice', quantity: 9 }]
  },
  inventory: {
    summary: { active_items: 4, total_quantity: 20, total_reserved: 2, total_available: 18, low_stock_items: 1 },
    categories: [{ category: 'Grains', item_count: 2, available: 12 }]
  }
};

function staffRoutes(overrides = {}) {
  return {
    'GET /api/staff/pickups': { pickups: [pickup(), pickup({ id: 2, status: 'prepared', starts_at: null })] },
    'GET /api/staff/slots': { slots: [{ id: 7, starts_at: '2099-05-01T10:00:00', capacity: 4, booked: 1, available: 3 }] },
    'GET /api/staff/alerts': { alerts: [{ id: 1, item_name: 'Soup', category: 'Canned', available: 2, threshold: 5 }] },
    'GET /api/staff/reports?from=&to=': { report },
    ...overrides
  };
}

async function loadStaffPage(routes, script = 'staff-pickups.js') {
  const env = installDom('staff.html', fakeServer(routes));
  await importPage(script);
  await flush();
  return env;
}

// Visible text with a space between separate text nodes (cells, labels, values).
function text(node) {
  const parts = [];
  const walk = (n) => {
    if (n.nodeType === 3) parts.push(n.nodeValue);
    else for (const child of n.childNodes) walk(child);
  };
  walk(node);
  return parts.map(p => p.trim()).filter(Boolean).join(' ');
}

// ---- staff-pickups.js ----

test('staff page renders the queue, slots and alerts on load', async () => {
  const env = await loadStaffPage(staffRoutes());
  try {
    const { document } = env;
    const rows = document.querySelectorAll('#pickup-queue tbody tr');
    assert.equal(rows.length, 2);
    assert.match(text(rows[0]), /Ada \(ada@example\.edu\)/);
    assert.match(text(rows[0]), /2 x Rice, 1 x Beans/);
    assert.match(text(rows[0]), /Scheduled/);
    assert.match(text(rows[1]), /Unscheduled/);
    assert.match(text(rows[1]), /Ready for pickup/);

    const buttons = (row) => [...row.querySelectorAll('button')].map(b => b.textContent);
    assert.deepEqual(buttons(rows[0]), ['Prepare', 'Cancel']);
    assert.deepEqual(buttons(rows[1]), ['Complete', 'Cancel']);

    assert.match(text(document.querySelector('#slot-list')), /1\/4/);
    assert.match(text(document.querySelector('#alert-list')), /Soup Canned 2 5/);
  } finally {
    env.restore();
  }
});

test('staff page shows an empty state when there is nothing to show', async () => {
  const env = await loadStaffPage(staffRoutes({
    'GET /api/staff/pickups': { pickups: [] },
    'GET /api/staff/slots': { slots: [] },
    'GET /api/staff/alerts': { alerts: [] }
  }));
  try {
    for (const id of ['#pickup-queue', '#slot-list', '#alert-list']) {
      assert.equal(text(env.document.querySelector(id)), 'Nothing to show.');
    }
  } finally {
    env.restore();
  }
});

test('Prepare and Complete call the staff endpoints and confirm', async () => {
  const env = await loadStaffPage(staffRoutes({
    'POST /api/staff/pickups/1/prepare': { pickup: pickup({ status: 'prepared' }) },
    'POST /api/staff/pickups/2/complete': { pickup: pickup({ id: 2, status: 'picked_up' }) }
  }));
  try {
    const { document, calls } = env;
    document.querySelectorAll('#pickup-queue tbody tr')[0].querySelector('button').click();
    await flush();
    assert.ok(calls.some(c => c.method === 'POST' && c.path === '/api/staff/pickups/1/prepare'));
    assert.equal(text(document.querySelector('#queue-message')), 'Pickup marked ready.');

    document.querySelectorAll('#pickup-queue tbody tr')[1].querySelector('button').click();
    await flush();
    assert.ok(calls.some(c => c.path === '/api/staff/pickups/2/complete'));
    assert.equal(text(document.querySelector('#queue-message')), 'Pickup completed.');
  } finally {
    env.restore();
  }
});

test('Cancel calls the cancel endpoint and refreshes every panel', async () => {
  const env = await loadStaffPage(staffRoutes({
    'POST /api/pickups/1/cancel': { pickup: pickup({ status: 'cancelled' }) }
  }));
  try {
    const { document, calls } = env;
    const before = calls.length;
    const cancel = [...document.querySelectorAll('#pickup-queue tbody tr')[0].querySelectorAll('button')].at(-1);
    cancel.click();
    await flush();
    const after = calls.slice(before).map(c => `${c.method ?? 'GET'} ${c.path}`);
    assert.ok(after.includes('POST /api/pickups/1/cancel'));
    assert.ok(after.includes('GET /api/staff/slots'));
    assert.ok(after.includes('GET /api/staff/alerts'));
    assert.equal(text(document.querySelector('#queue-message')), 'Pickup cancelled. The student was notified.');
  } finally {
    env.restore();
  }
});

test('action errors are shown as alerts', async () => {
  const env = await loadStaffPage(staffRoutes({
    'POST /api/staff/pickups/1/prepare': [409, { error: { message: 'Only scheduled pickup requests can be prepared.' } }]
  }));
  try {
    const { document } = env;
    document.querySelector('#pickup-queue tbody tr button').click();
    await flush();
    const msg = document.querySelector('#queue-message [role="alert"]');
    assert.equal(msg.textContent, 'Only scheduled pickup requests can be prepared.');
  } finally {
    env.restore();
  }
});

test('the status filter reloads the queue with a query string', async () => {
  const env = await loadStaffPage(staffRoutes({ 'GET /api/staff/pickups?status=prepared': { pickups: [] } }));
  try {
    const { document, window, calls } = env;
    const select = document.querySelector('#queue-status');
    select.value = 'prepared';
    select.dispatchEvent(new window.Event('change'));
    await flush();
    assert.equal(calls.at(-1).path, '/api/staff/pickups?status=prepared');
    assert.equal(text(document.querySelector('#pickup-queue')), 'Nothing to show.');

    document.querySelector('#refresh-queue').click();
    await flush();
    assert.equal(calls.at(-1).path, '/api/staff/pickups?status=prepared');
  } finally {
    env.restore();
  }
});

test('the slot form posts a new slot and resets', async () => {
  const env = await loadStaffPage(staffRoutes({ 'POST /api/staff/slots': [201, { slot: { id: 8 } }] }));
  try {
    const { document, window, calls } = env;
    const form = document.querySelector('#slot-form');
    document.querySelector('#slot-starts-at').value = '2099-06-01T09:00';
    document.querySelector('#slot-capacity').value = '6';
    form.dispatchEvent(new window.Event('submit', { cancelable: true }));
    await flush();

    const post = calls.find(c => c.method === 'POST' && c.path === '/api/staff/slots');
    assert.deepEqual(post.body, { starts_at: '2099-06-01T09:00', capacity: 6 });
    assert.equal(text(document.querySelector('#slot-message')), 'Pickup slot added.');
    assert.equal(document.querySelector('#slot-starts-at').value, '', 'form resets after success');
  } finally {
    env.restore();
  }
});

test('slot form errors are shown', async () => {
  const env = await loadStaffPage(staffRoutes({
    'POST /api/staff/slots': [409, { error: { message: 'A pickup slot already exists at that time.' } }]
  }));
  try {
    const { document, window } = env;
    document.querySelector('#slot-form').dispatchEvent(new window.Event('submit', { cancelable: true }));
    await flush();
    assert.equal(text(document.querySelector('#slot-message')), 'A pickup slot already exists at that time.');
  } finally {
    env.restore();
  }
});

test('Delete removes a slot', async () => {
  const env = await loadStaffPage(staffRoutes({ 'DELETE /api/staff/slots/7': [204, undefined] }));
  try {
    const { document, calls } = env;
    document.querySelector('#slot-list tbody button').click();
    await flush();
    assert.ok(calls.some(c => c.method === 'DELETE' && c.path === '/api/staff/slots/7'));
    assert.equal(text(document.querySelector('#slot-message')), 'Pickup slot deleted.');
  } finally {
    env.restore();
  }
});

test('Check Stock re-runs the alert check', async () => {
  const env = await loadStaffPage(staffRoutes({ 'POST /api/staff/alerts/check': { opened: 0, resolved: 0 } }));
  try {
    const { document, calls } = env;
    document.querySelector('#check-alerts').click();
    await flush();
    assert.ok(calls.some(c => c.method === 'POST' && c.path === '/api/staff/alerts/check'));
    assert.equal(text(document.querySelector('#alert-message')), 'Low stock alerts refreshed.');
  } finally {
    env.restore();
  }
});

test('load failures show an error in each panel', async () => {
  const fail = [500, { error: { message: 'Database is down.' } }];
  const env = await loadStaffPage(staffRoutes({
    'GET /api/staff/pickups': fail,
    'GET /api/staff/slots': fail,
    'GET /api/staff/alerts': fail
  }));
  try {
    for (const id of ['#queue-message', '#slot-message', '#alert-message']) {
      assert.equal(text(env.document.querySelector(id)), 'Database is down.');
    }
  } finally {
    env.restore();
  }
});

// ---- staff-reports.js ----

test('reports panel renders metrics and tables', async () => {
  const env = await loadStaffPage(staffRoutes(), 'staff-reports.js');
  try {
    const { document } = env;
    assert.equal(text(document.querySelector('#reports-summary')),
      'Active items 4 Available units 18 Reserved units 2 Low stock items 1');
    assert.match(text(document.querySelector('#reports-statuses')), /Picked up 3/);
    assert.match(text(document.querySelector('#reports-statuses')), /weird 1/, 'unknown statuses fall back to the raw value');
    assert.match(text(document.querySelector('#reports-top-items')), /Rice 9/);
    assert.match(text(document.querySelector('#reports-categories')), /Grains 2 12/);
  } finally {
    env.restore();
  }
});

test('reports form sends the chosen dates and handles empty data', async () => {
  const empty = {
    ...report,
    pickups: { status_counts: [], daily_pickups: [], top_items: [] },
    inventory: { ...report.inventory, categories: [] }
  };
  const env = await loadStaffPage(staffRoutes({ 'GET /api/staff/reports?from=2026-01-01&to=2026-01-31': { report: empty } }), 'staff-reports.js');
  try {
    const { document, window, calls } = env;
    const form = document.querySelector('#reports-form');
    form.querySelector('[name="from"]').value = '2026-01-01';
    form.querySelector('[name="to"]').value = '2026-01-31';
    form.dispatchEvent(new window.Event('submit', { cancelable: true }));
    await flush();
    assert.equal(calls.at(-1).path, '/api/staff/reports?from=2026-01-01&to=2026-01-31');
    assert.equal(text(document.querySelector('#reports-top-items')), 'No report data for this range.');
  } finally {
    env.restore();
  }
});

test('reports errors are shown', async () => {
  const env = await loadStaffPage(staffRoutes({
    'GET /api/staff/reports?from=&to=': [400, { error: { message: 'From date must be a valid date.' } }]
  }), 'staff-reports.js');
  try {
    assert.equal(text(env.document.querySelector('#reports-message')), 'From date must be a valid date.');
  } finally {
    env.restore();
  }
});

// ---- signout.js ----

test('Sign out logs out and returns to the sign-in page', async () => {
  const env = await loadStaffPage({ 'POST /api/auth/logout': [204, undefined] }, 'signout.js');
  try {
    const { document, window, calls, assigned } = env;
    const event = new window.MouseEvent('click', { cancelable: true, bubbles: true });
    document.querySelector('#sign-out').dispatchEvent(event);
    await flush();
    assert.equal(event.defaultPrevented, true);
    assert.ok(calls.some(c => c.method === 'POST' && c.path === '/api/auth/logout'));
    assert.deepEqual(assigned, ['/']);
  } finally {
    env.restore();
  }
});

test('Sign out still redirects if the logout request fails', async () => {
  const env = await loadStaffPage({ 'POST /api/auth/logout': [500, { error: { message: 'nope' } }] }, 'signout.js');
  try {
    const { document, window, assigned } = env;
    // A failed logout still redirects, and signout.js catches the error so
    // nothing is left as an unhandled rejection.
    const runnerListeners = process.listeners('unhandledRejection');
    process.removeAllListeners('unhandledRejection');
    const leaked = [];
    process.on('unhandledRejection', (reason) => leaked.push(reason));
    try {
      document.querySelector('#sign-out').dispatchEvent(new window.MouseEvent('click', { cancelable: true }));
      await flush();
    } finally {
      process.removeAllListeners('unhandledRejection');
      for (const listener of runnerListeners) process.on('unhandledRejection', listener);
    }
    assert.deepEqual(assigned, ['/']);
    assert.equal(leaked.length, 0);
  } finally {
    env.restore();
  }
});

// ---- student-pickup.js ----

// The real student page (FR2–FR4), so the tests also cover the search and category controls.
const STUDENT_HTML = 'student.html';

function studentRoutes(overrides = {}) {
  return {
    'GET /api/items': { items: [
      { id: 1, name: 'Rice', category: 'Grains', available: 5, active: 1 },
      { id: 2, name: 'Empty', category: 'Grains', available: 0, active: 1 },
      { id: 3, name: 'Retired', category: 'Old', available: 9, active: 0 }
    ] },
    'GET /api/pickup-slots': { slots: [
      { id: 10, starts_at: '2099-05-01T10:00:00', available: 2 },
      { id: 11, starts_at: '2099-05-02T10:00:00', available: 0 }
    ] },
    'GET /api/notifications?unread=true': { notifications: [{ id: 50, message: 'Your pantry pickup is ready.' }] },
    ...overrides
  };
}

async function loadStudentPage(routes) {
  const env = installDom(STUDENT_HTML, fakeServer(routes));
  await importPage('student-pickup.js');
  await flush();
  return env;
}

test('student page lists only active, in-stock items and open slots', async () => {
  const env = await loadStudentPage(studentRoutes());
  try {
    const { document } = env;
    const items = document.querySelectorAll('#student-item-list .pickup-item');
    assert.equal(items.length, 1);
    assert.match(text(items[0]), /Rice Grains \| 5 available/);
    const input = items[0].querySelector('input');
    assert.equal(input.getAttribute('max'), '5');
    assert.equal(input.getAttribute('aria-label'), 'Rice quantity');

    const slots = document.querySelectorAll('#student-slot-list button.slot');
    assert.equal(slots.length, 1);
    assert.match(slots[0].textContent, /\(2 open\)/);

    assert.match(text(document.querySelector('#student-notifications')), /Your pantry pickup is ready\. Mark read/);
  } finally {
    env.restore();
  }
});

test('student page shows empty states', async () => {
  const env = await loadStudentPage(studentRoutes({
    'GET /api/items': { items: [] },
    'GET /api/pickup-slots': { slots: [] },
    'GET /api/notifications?unread=true': { notifications: [] }
  }));
  try {
    const { document } = env;
    assert.equal(text(document.querySelector('#student-item-list')), 'No matching pantry items available.');
    assert.equal(text(document.querySelector('#student-slot-list')), 'No pickup slots are open right now.');
    assert.equal(text(document.querySelector('#student-notifications')), 'No unread notifications.');
  } finally {
    env.restore();
  }
});

test('student must choose a slot and an item before submitting', async () => {
  const env = await loadStudentPage(studentRoutes());
  try {
    const { document, window, calls } = env;
    const form = document.querySelector('#student-pickup-form');
    const submit = () => form.dispatchEvent(new window.Event('submit', { cancelable: true }));

    submit();
    await flush();
    assert.equal(text(document.querySelector('#student-pickup-message')), 'Choose a pickup time.');

    document.querySelector('#student-slot-list button.slot').click();
    await flush();
    assert.ok(document.querySelector('#student-slot-list button.slot.selected'));
    submit();
    await flush();
    assert.equal(text(document.querySelector('#student-pickup-message')), 'Choose at least one item.');
    assert.ok(!calls.some(c => c.method === 'POST'));
  } finally {
    env.restore();
  }
});

test('student can schedule a pickup', async () => {
  const env = await loadStudentPage(studentRoutes({ 'POST /api/pickups': [201, { pickup: { id: 1 } }] }));
  try {
    const { document, window, calls } = env;
    document.querySelector('#student-slot-list button.slot').click();
    await flush();
    const input = document.querySelector('#student-item-list input');
    input.value = '2';
    input.dispatchEvent(new window.Event('change'));
    document.querySelector('#student-pickup-form').dispatchEvent(new window.Event('submit', { cancelable: true }));
    await flush();

    const post = calls.find(c => c.method === 'POST' && c.path === '/api/pickups');
    assert.deepEqual(post.body, { slot_id: 10, items: [{ item_id: 1, quantity: 2 }] });
    assert.equal(text(document.querySelector('#student-pickup-message')), 'Pickup scheduled. Check your notifications for confirmation.');
    assert.equal(document.querySelector('#student-slot-list button.slot.selected'), null, 'selection clears');
  } finally {
    env.restore();
  }
});

test('setting a quantity back to 0 removes the item from the request', async () => {
  const env = await loadStudentPage(studentRoutes());
  try {
    const { document, window } = env;
    document.querySelector('#student-slot-list button.slot').click();
    await flush();
    const input = document.querySelector('#student-item-list input');
    input.value = '2';
    input.dispatchEvent(new window.Event('change'));
    input.value = '0';
    input.dispatchEvent(new window.Event('change'));
    document.querySelector('#student-pickup-form').dispatchEvent(new window.Event('submit', { cancelable: true }));
    await flush();
    assert.equal(text(document.querySelector('#student-pickup-message')), 'Choose at least one item.');
  } finally {
    env.restore();
  }
});

test('student sees server errors when scheduling fails', async () => {
  const env = await loadStudentPage(studentRoutes({
    'POST /api/pickups': [409, { error: { message: 'You already have an open pickup request.' } }]
  }));
  try {
    const { document, window } = env;
    document.querySelector('#student-slot-list button.slot').click();
    await flush();
    const input = document.querySelector('#student-item-list input');
    input.value = '1';
    input.dispatchEvent(new window.Event('change'));
    document.querySelector('#student-pickup-form').dispatchEvent(new window.Event('submit', { cancelable: true }));
    await flush();
    assert.equal(text(document.querySelector('#student-pickup-message')), 'You already have an open pickup request.');
  } finally {
    env.restore();
  }
});

test('student can mark a notification read', async () => {
  let read = false;
  const env = await loadStudentPage(studentRoutes({
    'PATCH /api/notifications/50/read': () => { read = true; return { notification: { id: 50 } }; },
    'GET /api/notifications?unread=true': () => ({ notifications: read ? [] : [{ id: 50, message: 'Ready.' }] })
  }));
  try {
    const { document } = env;
    document.querySelector('#student-notifications button').click();
    await flush();
    assert.equal(read, true);
    assert.equal(text(document.querySelector('#student-notifications')), 'No unread notifications.');
  } finally {
    env.restore();
  }
});

test('student page shows a load error', async () => {
  const env = await loadStudentPage(studentRoutes({ 'GET /api/items': [500, { error: { message: 'Could not load items.' } }] }));
  try {
    assert.equal(text(env.document.querySelector('#student-pickup-message')), 'Could not load items.');
  } finally {
    env.restore();
  }
});

// ---- index.html (sign-in page) ----

async function loadSignIn(routes) {
  const html = readFileSync('public/index.html', 'utf8');
  const inline = /<script type="module">([\s\S]*?)<\/script>/.exec(html)[1]
    .replace("'/js/api.js'", `'${pathToFileURL(resolve('public/js/api.js')).href}'`);
  const env = installDom('index.html', fakeServer(routes));
  await import(`data:text/javascript,${encodeURIComponent(`${inline}\n// ${Math.random()}`)}`);
  return env;
}

async function signIn(env, email, password) {
  const { document, window } = env;
  document.getElementById('email').value = email;
  document.getElementById('password').value = password;
  document.getElementById('login-form').dispatchEvent(new window.Event('submit', { cancelable: true }));
  await flush();
}

test('sign-in sends staff to the staff page', async () => {
  const env = await loadSignIn({ 'POST /api/auth/login': { user: { role: 'staff' } } });
  try {
    await signIn(env, '  staff@pantry.demo ', 'pw');
    assert.deepEqual(env.calls[0].body, { email: 'staff@pantry.demo', password: 'pw' });
    assert.deepEqual(env.assigned, ['/staff.html']);
  } finally {
    env.restore();
  }
});

test('sign-in sends students to the student page', async () => {
  const env = await loadSignIn({ 'POST /api/auth/login': { user: { role: 'student' } } });
  try {
    await signIn(env, 'student1@pantry.demo', 'pw');
    assert.deepEqual(env.assigned, ['/student.html']);
  } finally {
    env.restore();
  }
});

test('sign-in shows errors and unknown roles', async () => {
  const bad = await loadSignIn({ 'POST /api/auth/login': [401, { error: { message: 'Incorrect email or password.' } }] });
  try {
    await signIn(bad, 'x@y.edu', 'wrong');
    assert.equal(bad.document.getElementById('login-message').textContent, 'Incorrect email or password.');
    assert.deepEqual(bad.assigned, []);
  } finally {
    bad.restore();
  }

  const odd = await loadSignIn({ 'POST /api/auth/login': { user: { role: 'admin' } } });
  try {
    await signIn(odd, 'x@y.edu', 'pw');
    assert.equal(odd.document.getElementById('login-message').textContent, 'Account role not recognized.');
  } finally {
    odd.restore();
  }
});

test('every page in public/ links the shared stylesheet', () => {
  for (const page of ['index.html', 'staff.html']) {
    assert.match(readFileSync(`public/${page}`, 'utf8'), /<link rel="stylesheet" href="\/css\/styles\.css">/, page);
  }
});
