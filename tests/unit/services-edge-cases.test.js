// Branches in the service layer not covered by the per-feature tests.
import test from 'node:test';
import assert from 'node:assert/strict';

import { openDatabase } from '../../src/db.js';
import { createItem, updateItem, recordDonation, listItems } from '../../src/services/inventory.js';
import { schedule, cancel, queue, prepare, complete, getPickup } from '../../src/services/pickups.js';
import { createSlot, getSlot, listSlots, updateSlot, deleteSlot } from '../../src/services/slots.js';
import {
  createNotification,
  listNotifications,
  markRead,
  notifyScheduled,
  notifyReady,
  notifyCancelled
} from '../../src/services/notifications.js';
import { checkLowStock, listOpenAlerts } from '../../src/services/alerts.js';
import { sendDueReminders } from '../../src/services/reminders.js';
import { pickupReport, inventoryReport } from '../../src/services/reports.js';
import { addItem, addSlot, addUser, fixedClock, FUTURE } from '../helpers.js';

// node:sqlite rows have a null prototype; copy them so deepEqual compares values only.
const plain = (value) => JSON.parse(JSON.stringify(value));

function withDb(fn) {
  const db = openDatabase();
  try {
    return fn(db);
  } finally {
    db.close();
  }
}

// ---- inventory ----

test('createItem validates name, category and quantity', () => withDb((db) => {
  const ctx = { db };
  assert.throws(() => createItem(ctx, { category: 'Grains' }), { status: 400, message: 'Name and category are required.' });
  assert.throws(() => createItem(ctx, { name: '  ', category: 'Grains' }), { status: 400 });
  assert.throws(() => createItem(ctx, { name: 'Rice', category: '' }), { status: 400 });
  assert.throws(() => createItem(ctx, { name: 'Rice', category: 'Grains', quantity: 1.5 }), { message: 'Quantity must be a nonnegative integer.' });
  assert.throws(() => createItem(ctx, { name: 'Rice', category: 'Grains', quantity: '5' }), { status: 400 });
}));

test('createItem defaults quantity to 0 and uses the injected clock', () => withDb((db) => {
  const item = createItem({ db, clock: fixedClock('2026-03-04T05:06:07') }, { name: 'Rice', category: 'Grains' });
  assert.equal(item.quantity, 0);
  assert.equal(item.created_at, '2026-03-04T05:06:07');
  assert.equal(item.active, 1);
  assert.equal(listItems({ db })[0].available, 0);
}));

test('recordDonation validates input and rolls back on unknown items', () => withDb((db) => {
  const ctx = { db };
  const id = addItem(db, { quantity: 1 });
  assert.throws(() => recordDonation(ctx, { item_id: 'x', quantity: 1 }), { message: 'Invalid item ID.' });
  assert.throws(() => recordDonation(ctx, { item_id: 0, quantity: 1 }), { message: 'Invalid item ID.' });
  assert.throws(() => recordDonation(ctx, { item_id: id, quantity: 0 }), { message: 'Donation quantity must be positive.' });
  assert.throws(() => recordDonation(ctx, { item_id: id, quantity: -4 }), { status: 400 });
  assert.throws(() => recordDonation(ctx, { item_id: 999, quantity: 1 }), { status: 404 });
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM donations').get().n, 0);

  recordDonation(ctx, { item_id: id, quantity: 2 });
  const donation = db.prepare('SELECT * FROM donations').get();
  assert.equal(donation.source, '');
  assert.equal(donation.logged_by, null);
}));

test('updateItem rejects unknown items, bad quantities and going below reserved', () => withDb((db) => {
  const ctx = { db };
  const id = addItem(db, { quantity: 5, reserved: 3 });
  assert.throws(() => updateItem(ctx, 999, { quantity: 1 }), { status: 404 });
  assert.throws(() => updateItem(ctx, id, {}), { status: 400 });
  assert.throws(() => updateItem(ctx, id, { quantity: -1 }), { status: 400 });
  assert.throws(() => updateItem(ctx, id, { quantity: 2 }), { message: 'Quantity cannot be less than reserved inventory.' });
  assert.equal(updateItem(ctx, id, { quantity: 3 }).quantity, 3);
}));

// ---- pickups ----

function setupStudent(db) {
  return addUser(db, { role: 'student' });
}

test('schedule rejects bad student and slot IDs', () => withDb((db) => {
  const ctx = { db };
  const itemId = addItem(db);
  const slotId = addSlot(db);
  const staffId = addUser(db, { role: 'staff' });
  const items = [{ item_id: itemId, quantity: 1 }];

  assert.throws(() => schedule(ctx, 'x', { slot_id: slotId, items }), { status: 400 });
  assert.throws(() => schedule(ctx, 1, {}), { status: 400 });
  assert.throws(() => schedule(ctx, 9999, { slot_id: slotId, items }), { status: 404, message: 'Student not found.' });
  assert.throws(() => schedule(ctx, staffId, { slot_id: slotId, items }), { message: 'Student not found.' });
}));

test('schedule allows only one open request per student', () => withDb((db) => {
  const ctx = { db };
  const studentId = setupStudent(db);
  const itemId = addItem(db);
  schedule(ctx, studentId, { slot_id: addSlot(db, '2099-01-01T10:00:00'), items: [{ item_id: itemId, quantity: 1 }] });

  assert.throws(
    () => schedule(ctx, studentId, { slot_id: addSlot(db, '2099-01-02T10:00:00'), items: [{ item_id: itemId, quantity: 1 }] }),
    { status: 409, message: 'You already have an open pickup request.' }
  );
}));

test('schedule rejects past slots', () => withDb((db) => {
  const ctx = { db, clock: fixedClock('2026-11-10T12:00:00') };
  const studentId = setupStudent(db);
  const slotId = addSlot(db, '2026-11-10T11:59:00');
  assert.throws(
    () => schedule(ctx, studentId, { slot_id: slotId, items: [{ item_id: addItem(db), quantity: 1 }] }),
    { status: 400, message: 'Pickup slot must be in the future.' }
  );
}));

test('schedule validates the item list', () => withDb((db) => {
  const ctx = { db };
  const studentId = setupStudent(db);
  const slotId = addSlot(db);
  const itemId = addItem(db, { quantity: 50 });
  const inactive = addItem(db, { name: 'Old', active: 0 });
  const limited = addItem(db, { name: 'Milk', perVisitLimit: 2 });
  const attempt = (items) => () => schedule(ctx, studentId, { slot_id: slotId, items });

  assert.throws(attempt(undefined), { message: 'Choose at least one pantry item.' });
  assert.throws(attempt([]), { message: 'Choose at least one pantry item.' });
  assert.throws(attempt('rice'), { status: 400 });
  assert.throws(attempt([{ item_id: itemId, quantity: 0 }]), { message: 'Quantity must be between 1 and 100.' });
  assert.throws(attempt([{ item_id: itemId, quantity: 101 }]), { status: 400 });
  assert.throws(attempt([{ item_id: 'abc', quantity: 1 }]), { status: 400 });
  assert.throws(attempt([{ item_id: itemId, quantity: 1 }, { item_id: itemId, quantity: 2 }]), {
    message: 'Each item can only appear once in a pickup.'
  });
  assert.throws(attempt([{ item_id: 9999, quantity: 1 }]), { status: 404, message: 'Pantry item not found.' });
  assert.throws(attempt([{ item_id: inactive, quantity: 1 }]), { status: 404 });
  assert.throws(attempt([{ item_id: limited, quantity: 3 }]), { message: 'Milk is limited to 2 per visit.' });

  // Nothing was reserved by the failed attempts.
  assert.equal(db.prepare('SELECT SUM(reserved) AS n FROM items').get().n, 0);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM requests').get().n, 0);
}));

test('schedule enforces the visit item limit from settings', () => withDb((db) => {
  const ctx = { db };
  const studentId = setupStudent(db);
  const slotId = addSlot(db);
  db.prepare("UPDATE settings SET value = '2' WHERE key = 'visit_item_limit'").run();
  const items = [1, 2, 3].map(n => ({ item_id: addItem(db, { name: `Item ${n}` }), quantity: 1 }));

  assert.throws(() => schedule(ctx, studentId, { slot_id: slotId, items }), { message: 'Choose 2 items or fewer per visit.' });
  const ok = schedule(ctx, studentId, { slot_id: slotId, items: items.slice(0, 2) });
  assert.equal(ok.items.length, 2);
}));

test('schedule falls back to a limit of 8 when the setting is missing', () => withDb((db) => {
  const ctx = { db };
  db.prepare("DELETE FROM settings WHERE key = 'visit_item_limit'").run();
  const studentId = setupStudent(db);
  const items = Array.from({ length: 9 }, (_, n) => ({ item_id: addItem(db, { name: `I${n}` }), quantity: 1 }));
  assert.throws(() => schedule(ctx, studentId, { slot_id: addSlot(db), items }), { message: 'Choose 8 items or fewer per visit.' });
}));

test('getPickup validates and 404s', () => withDb((db) => {
  assert.throws(() => getPickup({ db }, 0), { status: 400 });
  assert.throws(() => getPickup({ db }, 42), { status: 404, message: 'Pickup request not found.' });
}));

test('cancel enforces ownership and accepts the userId alias', () => withDb((db) => {
  const ctx = { db };
  const studentId = setupStudent(db);
  const pickup = schedule(ctx, studentId, { slot_id: addSlot(db), items: [{ item_id: addItem(db), quantity: 1 }] });

  assert.throws(() => cancel(ctx, pickup.id), { status: 403, message: 'You cannot cancel this pickup.' });
  assert.throws(() => cancel(ctx, pickup.id, { user_id: studentId + 1, role: 'student' }), { status: 403 });
  assert.throws(() => cancel(ctx, 999, { role: 'staff' }), { status: 404 });
  const cancelled = cancel(ctx, pickup.id, { userId: studentId });
  assert.equal(cancelled.status, 'cancelled');
  assert.ok(cancelled.cancelled_at);
}));

test('a cancelled or completed request frees the student to book again', () => withDb((db) => {
  const ctx = { db };
  const studentId = setupStudent(db);
  const itemId = addItem(db, { quantity: 10 });
  const first = schedule(ctx, studentId, { slot_id: addSlot(db, '2099-01-01T10:00:00'), items: [{ item_id: itemId, quantity: 1 }] });
  cancel(ctx, first.id, { role: 'staff' });
  const second = schedule(ctx, studentId, { slot_id: addSlot(db, '2099-01-02T10:00:00'), items: [{ item_id: itemId, quantity: 1 }] });
  prepare(ctx, second.id);
  complete(ctx, second.id);
  assert.throws(() => cancel(ctx, second.id, { role: 'staff' }), { status: 409 });
  const third = schedule(ctx, studentId, { slot_id: addSlot(db, '2099-01-03T10:00:00'), items: [{ item_id: itemId, quantity: 1 }] });
  assert.equal(third.status, 'scheduled');
}));

test('cancelled requests no longer count against slot capacity', () => withDb((db) => {
  const ctx = { db };
  const slotId = addSlot(db, FUTURE, 1);
  const itemId = addItem(db, { quantity: 10 });
  const a = schedule(ctx, setupStudent(db), { slot_id: slotId, items: [{ item_id: itemId, quantity: 1 }] });
  assert.throws(() => schedule(ctx, setupStudent(db), { slot_id: slotId, items: [{ item_id: itemId, quantity: 1 }] }), { message: 'Pickup slot is full.' });
  cancel(ctx, a.id, { role: 'staff' });
  assert.equal(getSlot(ctx, slotId).available, 1);
  assert.equal(schedule(ctx, setupStudent(db), { slot_id: slotId, items: [{ item_id: itemId, quantity: 1 }] }).status, 'scheduled');
}));

test('prepare and complete reject unknown or wrong-state requests', () => withDb((db) => {
  const ctx = { db };
  assert.throws(() => prepare(ctx, 999), { status: 404 });
  assert.throws(() => complete(ctx, 999), { status: 404 });
  assert.throws(() => prepare(ctx, 'x'), { status: 400 });

  const pickup = schedule(ctx, setupStudent(db), { slot_id: addSlot(db), items: [{ item_id: addItem(db), quantity: 1 }] });
  cancel(ctx, pickup.id, { role: 'staff' });
  assert.throws(() => prepare(ctx, pickup.id), { message: 'Only scheduled pickup requests can be prepared.' });
  assert.throws(() => complete(ctx, pickup.id), { message: 'Only prepared pickup requests can be completed.' });
}));

test('queue returns an empty list when nothing is open', () => withDb((db) => {
  assert.deepEqual(queue({ db }), []);
  assert.deepEqual(queue({ db }, { status: 'cancelled', date: '2099-01-01' }), []);
}));

// ---- slots ----

test('createSlot validates time and capacity', () => withDb((db) => {
  const ctx = { db };
  assert.throws(() => createSlot(ctx, { starts_at: '2099-01-01', capacity: 1 }), { message: 'Start time must be a valid local date and time.' });
  assert.throws(() => createSlot(ctx, { starts_at: '2099-01-01T10:00', capacity: 0 }), { status: 400 });
  assert.throws(() => createSlot(ctx, { starts_at: '2099-01-01T10:00', capacity: 101 }), { status: 400 });
  assert.equal(createSlot(ctx, { starts_at: '2099-01-01T10:00', capacity: '3' }).capacity, 3);
}));

test('getSlot and listSlots handle missing slots and invalid filters', () => withDb((db) => {
  const ctx = { db };
  assert.throws(() => getSlot(ctx, 999), { status: 404, message: 'Pickup slot not found.' });
  assert.throws(() => listSlots(ctx, { from: 'bad' }), { status: 400 });
  assert.throws(() => listSlots(ctx, { to: 'bad' }), { status: 400 });
  assert.deepEqual(listSlots(ctx), []);
}));

test('listSlots from/to bound the results', () => withDb((db) => {
  const ctx = { db };
  for (const day of ['01', '02', '03']) addSlot(db, `2099-06-${day}T10:00:00`);
  const slots = listSlots(ctx, { from: '2099-06-02T00:00', to: '2099-06-02T23:59' });
  assert.deepEqual(slots.map(s => s.starts_at), ['2099-06-02T10:00:00']);
}));

test('updateSlot moves a slot, detects duplicates and validates', () => withDb((db) => {
  const ctx = { db };
  const a = addSlot(db, '2099-06-01T10:00:00');
  addSlot(db, '2099-06-02T10:00:00');

  assert.equal(updateSlot(ctx, a, { starts_at: '2099-07-01T08:00' }).starts_at, '2099-07-01T08:00:00');
  assert.throws(() => updateSlot(ctx, a, { starts_at: '2099-06-02T10:00' }), { status: 409, message: 'A pickup slot already exists at that time.' });
  assert.throws(() => updateSlot(ctx, a, { capacity: 0 }), { status: 400 });
  assert.throws(() => updateSlot(ctx, a, { starts_at: 'nope' }), { status: 400 });
  assert.throws(() => updateSlot(ctx, 999, {}), { status: 404 });
  assert.equal(updateSlot(ctx, a, {}).starts_at, '2099-07-01T08:00:00');
}));

test('deleteSlot refuses slots with booked pickups', () => withDb((db) => {
  const ctx = { db };
  const slotId = addSlot(db);
  schedule(ctx, setupStudent(db), { slot_id: slotId, items: [{ item_id: addItem(db), quantity: 1 }] });
  assert.throws(() => deleteSlot(ctx, slotId), { status: 409, message: 'Cannot delete a slot with scheduled pickups.' });
  assert.throws(() => deleteSlot(ctx, 999), { status: 404 });
}));

// ---- notifications ----

test('createNotification validates its input', () => withDb((db) => {
  const ctx = { db };
  const userId = addUser(db);
  assert.throws(() => createNotification(ctx, { user_id: 'x', type: 'ready', message: 'm' }), { status: 400 });
  assert.throws(() => createNotification(ctx, { user_id: userId, type: 'spam', message: 'm' }), /Unsupported notification type/);
  assert.throws(() => createNotification(ctx, { user_id: userId, type: 'ready', message: '   ' }), /message is required/);
  assert.throws(() => createNotification(ctx, { user_id: userId, request_id: 0, type: 'ready', message: 'm' }), { status: 400 });
}));

test('createNotification only writes email when asked, with a default subject', () => withDb((db) => {
  const ctx = { db };
  const userId = addUser(db);
  createNotification(ctx, { user_id: userId, type: 'ready', message: 'in-app only' });
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM email_outbox').get().n, 0);

  createNotification(ctx, { user_id: userId, type: 'ready', message: 'with email', email_body: 'Body' });
  const mail = db.prepare('SELECT * FROM email_outbox').get();
  assert.equal(mail.subject, 'Campus Food Pantry update');
  assert.equal(mail.body, 'Body');

  createNotification(ctx, { user_id: userId, type: 'ready', message: 'subject only', subject: 'Hi' });
  assert.equal(db.prepare("SELECT body FROM email_outbox WHERE subject = 'Hi'").get().body, 'subject only');
}));

test('listNotifications orders newest first and validates the user', () => withDb((db) => {
  const userId = addUser(db);
  createNotification({ db, clock: fixedClock('2026-01-01T10:00:00') }, { user_id: userId, type: 'ready', message: 'old' });
  createNotification({ db, clock: fixedClock('2026-01-02T10:00:00') }, { user_id: userId, type: 'ready', message: 'new' });
  assert.deepEqual(listNotifications({ db }, userId).map(n => n.message), ['new', 'old']);
  assert.throws(() => listNotifications({ db }, 0), { status: 400 });
}));

test('markRead is idempotent and keeps the first read time', () => withDb((db) => {
  const userId = addUser(db);
  const n = createNotification({ db }, { user_id: userId, type: 'ready', message: 'm' });
  const first = markRead({ db, clock: fixedClock('2026-01-01T10:00:00') }, userId, n.id);
  const second = markRead({ db, clock: fixedClock('2026-02-01T10:00:00') }, userId, n.id);
  assert.equal(first.read_at, '2026-01-01T10:00:00');
  assert.equal(second.read_at, '2026-01-01T10:00:00');
  assert.throws(() => markRead({ db }, userId, 999), { status: 404 });
}));

test('notifyScheduled, notifyReady and notifyCancelled write the right messages', () => withDb((db) => {
  const ctx = { db };
  const studentId = addUser(db);
  const pickup = schedule(ctx, studentId, { slot_id: addSlot(db, '2099-09-25T13:30:00'), items: [{ item_id: addItem(db), quantity: 1 }] });

  assert.match(notifyScheduled(ctx, pickup).message, /scheduled for .* at 1:30 PM/);
  assert.equal(notifyReady(ctx, pickup).type, 'ready');
  assert.equal(notifyCancelled(ctx, pickup).message, 'Your pantry pickup was cancelled.');
  const subjects = db.prepare('SELECT subject FROM email_outbox ORDER BY id').all().map(r => r.subject);
  assert.deepEqual(subjects, ['Pickup scheduled', 'Pickup ready', 'Pickup cancelled']);
}));

// ---- alerts, reminders, reports ----

test('checkLowStock ignores inactive items and resolves their alerts', () => withDb((db) => {
  const ctx = { db };
  const id = addItem(db, { quantity: 1, threshold: 5 });
  addItem(db, { name: 'Gone', quantity: 0, threshold: 5, active: 0 });
  assert.deepEqual(checkLowStock(ctx), { opened: 1, resolved: 0 });

  db.prepare('UPDATE items SET active = 0 WHERE id = ?').run(id);
  assert.deepEqual(checkLowStock(ctx), { opened: 0, resolved: 1 });
  assert.deepEqual(listOpenAlerts(ctx), []);
}));

test('checkLowStock refreshes the numbers on an existing open alert', () => withDb((db) => {
  const ctx = { db };
  const id = addItem(db, { quantity: 4, threshold: 5 });
  checkLowStock(ctx);
  db.prepare('UPDATE items SET quantity = 2 WHERE id = ?').run(id);
  checkLowStock(ctx);
  const [alert] = listOpenAlerts(ctx);
  assert.equal(alert.available, 2);
}));

test('sendDueReminders honours a custom lookahead and skips cancelled pickups', () => withDb((db) => {
  const clock = fixedClock('2099-01-01T08:00:00');
  const ctx = { db, clock };
  const itemId = addItem(db, { quantity: 10 });
  const soon = schedule(ctx, addUser(db), { slot_id: addSlot(db, '2099-01-01T09:00:00'), items: [{ item_id: itemId, quantity: 1 }] });
  schedule(ctx, addUser(db), { slot_id: addSlot(db, '2099-01-01T12:00:00'), items: [{ item_id: itemId, quantity: 1 }] });
  const cancelled = schedule(ctx, addUser(db), { slot_id: addSlot(db, '2099-01-01T08:30:00'), items: [{ item_id: itemId, quantity: 1 }] });
  cancel(ctx, cancelled.id, { role: 'staff' });

  assert.deepEqual(sendDueReminders(ctx, { lookahead_hours: 2 }), { sent: 1 });
  const reminder = db.prepare("SELECT * FROM notifications WHERE type = 'reminder'").get();
  assert.equal(reminder.request_id, soon.id);
  assert.match(reminder.message, /^Reminder: your pantry pickup is/);
  assert.deepEqual(sendDueReminders(ctx, { lookahead_hours: 2 }), { sent: 0 });
}));

test('pickupReport filters by date range and counts per day', () => withDb((db) => {
  const studentA = addUser(db);
  const studentB = addUser(db);
  db.prepare("INSERT INTO requests (student_id, status, created_at) VALUES (?, 'submitted', '2026-01-05T10:00:00')").run(studentA);
  db.prepare("INSERT INTO requests (student_id, status, created_at) VALUES (?, 'picked_up', '2026-02-05T10:00:00')").run(studentB);

  const all = pickupReport({ db });
  assert.deepEqual(plain(all.daily_pickups), [{ day: '2026-01-05', count: 1 }, { day: '2026-02-05', count: 1 }]);
  const jan = pickupReport({ db }, { from: '2026-01-01', to: '2026-01-31' });
  assert.deepEqual(plain(jan.status_counts), [{ status: 'submitted', count: 1 }]);
  const feb = pickupReport({ db }, { from: '2026-02-05' });
  assert.equal(feb.status_counts.length, 1);
  assert.throws(() => pickupReport({ db }, { to: '2026-02-30' }), { message: 'To date must be a valid date.' });
}));

test('inventoryReport handles an empty pantry and excludes inactive items', () => withDb((db) => {
  const empty = inventoryReport({ db });
  assert.equal(empty.summary.active_items, 0);
  assert.equal(empty.summary.total_available, 0);
  assert.deepEqual(empty.categories, []);

  addItem(db, { name: 'A', category: 'Grains', quantity: 10, reserved: 2, threshold: 1 });
  addItem(db, { name: 'B', category: 'Grains', quantity: 1, threshold: 5 });
  addItem(db, { name: 'C', category: 'Old', quantity: 100, active: 0 });
  const report = inventoryReport({ db });
  assert.deepEqual(plain(report.summary), {
    active_items: 2,
    total_quantity: 11,
    total_reserved: 2,
    total_available: 9,
    low_stock_items: 1
  });
  assert.deepEqual(plain(report.categories), [{ category: 'Grains', item_count: 2, available: 9 }]);
}));
