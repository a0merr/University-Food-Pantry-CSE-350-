// FR5, FR6, FR8, FR9, FR10 on the staff page, driven through a real browser.
import { test, expect } from '@playwright/test';

import { STAFF, signInAs, newStudent, bookPickup, queueRow, futureLocal } from './support.js';

test.beforeEach(async ({ page }) => {
  await signInAs(page, STAFF);
});

test('a new booking appears in the queue with student and items', async ({ page, playwright, baseURL }) => {
  const student = await newStudent(playwright, baseURL, { name: 'Queue Tester' });
  await bookPickup(student.api, { itemName: 'Rice' });

  await page.goto('/staff.html');
  const row = queueRow(page, student.email);
  await expect(row).toContainText(`Queue Tester (${student.email})`);
  await expect(row).toContainText('1 x Rice');
  await expect(row).toContainText('Scheduled');
  await expect(row.getByRole('button', { name: 'Prepare' })).toBeVisible();
  await expect(row.getByRole('button', { name: 'Complete' })).toHaveCount(0);
});

test('staff prepare then complete a pickup; the student is notified', async ({ page, playwright, baseURL }) => {
  const student = await newStudent(playwright, baseURL);
  await bookPickup(student.api);
  await page.goto('/staff.html');
  const row = queueRow(page, student.email);

  await row.getByRole('button', { name: 'Prepare' }).click();
  await expect(page.locator('#queue-message')).toHaveText('Pickup marked ready.');
  await expect(row).toContainText('Ready for pickup');

  await row.getByRole('button', { name: 'Complete' }).click();
  await expect(page.locator('#queue-message')).toHaveText('Pickup completed.');
  await expect(row).toHaveCount(0);

  const { notifications } = await (await student.api.get('/api/notifications')).json();
  expect(notifications.map(n => n.type).sort()).toEqual(['ready', 'scheduled']);
});

test('staff cancel a pickup; stock is released and the student is notified', async ({ page, playwright, baseURL }) => {
  const student = await newStudent(playwright, baseURL);
  const pickup = await bookPickup(student.api);
  const itemId = pickup.items[0].item_id;
  const reservedBefore = (await (await page.request.get('/api/items')).json()).items.find(i => i.id === itemId).reserved;

  await page.goto('/staff.html');
  await queueRow(page, student.email).getByRole('button', { name: 'Cancel' }).click();
  await expect(page.locator('#queue-message')).toHaveText('Pickup cancelled. The student was notified.');
  await expect(queueRow(page, student.email)).toHaveCount(0);

  const reservedAfter = (await (await page.request.get('/api/items')).json()).items.find(i => i.id === itemId).reserved;
  expect(reservedAfter).toBe(reservedBefore - 1);
  const { notifications } = await (await student.api.get('/api/notifications')).json();
  expect(notifications.some(n => n.type === 'cancelled')).toBe(true);
});

test('the status filter narrows the queue', async ({ page, playwright, baseURL }) => {
  const scheduled = await newStudent(playwright, baseURL);
  const prepared = await newStudent(playwright, baseURL);
  await bookPickup(scheduled.api);
  const p = await bookPickup(prepared.api);
  await page.request.post(`/api/staff/pickups/${p.id}/prepare`, { headers: { 'X-Requested-With': 'fetch' } });

  await page.goto('/staff.html');
  await page.getByLabel('Status').selectOption('prepared');
  await expect(queueRow(page, prepared.email)).toBeVisible();
  await expect(queueRow(page, scheduled.email)).toHaveCount(0);

  await page.getByLabel('Status').selectOption('scheduled');
  await expect(queueRow(page, scheduled.email)).toBeVisible();
  await expect(queueRow(page, prepared.email)).toHaveCount(0);
});

test('Refresh picks up bookings made after the page loaded', async ({ page, playwright, baseURL }) => {
  await page.goto('/staff.html');
  const student = await newStudent(playwright, baseURL);
  await bookPickup(student.api);
  await expect(queueRow(page, student.email)).toHaveCount(0);
  await page.getByRole('button', { name: 'Refresh' }).click();
  await expect(queueRow(page, student.email)).toBeVisible();
});

test('staff add and delete a pickup slot', async ({ page }) => {
  await page.goto('/staff.html');
  await page.getByLabel('Start time').fill(futureLocal(20, 7, 17));
  await page.getByLabel('Capacity').fill('3');
  await page.getByRole('button', { name: 'Add Slot' }).click();
  await expect(page.locator('#slot-message')).toHaveText('Pickup slot added.');

  const row = page.locator('#slot-list tbody tr', { hasText: '7:17 AM' });
  await expect(row).toContainText('0/3');
  await row.getByRole('button', { name: 'Delete' }).click();
  await expect(page.locator('#slot-message')).toHaveText('Pickup slot deleted.');
  await expect(row).toHaveCount(0);
});

test('adding a slot at a time that is already taken shows an error', async ({ page }) => {
  const time = futureLocal(21, 7, 19);
  await page.goto('/staff.html');
  await page.getByLabel('Start time').fill(time);
  await page.getByRole('button', { name: 'Add Slot' }).click();
  await expect(page.locator('#slot-message')).toHaveText('Pickup slot added.');

  await page.getByLabel('Start time').fill(time);
  await page.getByRole('button', { name: 'Add Slot' }).click();
  await expect(page.locator('#slot-message [role="alert"]')).toHaveText('A pickup slot already exists at that time.');
});

test('a slot with a booking cannot be deleted', async ({ page, playwright, baseURL }) => {
  const student = await newStudent(playwright, baseURL);
  const pickup = await bookPickup(student.api);
  await page.goto('/staff.html');
  const { slots } = await (await page.request.get('/api/staff/slots')).json();
  const index = slots.findIndex(s => s.id === pickup.slot_id);
  await page.locator('#slot-list tbody tr').nth(index).getByRole('button', { name: 'Delete' }).click();
  await expect(page.locator('#slot-message [role="alert"]')).toHaveText('Cannot delete a slot with scheduled pickups.');
});

test('Check Stock lists the seeded low-stock items', async ({ page }) => {
  await page.goto('/staff.html');
  await page.getByRole('button', { name: 'Check Stock' }).click();
  await expect(page.locator('#alert-message')).toHaveText('Low stock alerts refreshed.');
  const alerts = page.locator('#alert-list');
  await expect(alerts).toContainText('Canned Soup');
  await expect(alerts).toContainText('Granola Bars');
  await expect(alerts).not.toContainText('Bottled Water');
});

test('the usage report shows inventory totals and runs for a date range', async ({ page }) => {
  await page.goto('/staff.html');
  const summary = page.locator('#reports-summary');
  await expect(summary).toContainText('Active items');
  await expect(summary.locator('.metric').first()).toContainText('10');

  await page.getByLabel('From', { exact: true }).fill('2000-01-01');
  await page.getByLabel('To', { exact: true }).fill('2000-01-31');
  const response = page.waitForResponse(r => r.url().includes('/api/staff/reports?from=2000-01-01&to=2000-01-31'));
  await page.getByRole('button', { name: 'Run Report' }).click();
  expect((await response).status()).toBe(200);
  await expect(page.locator('#reports-top-items')).toHaveText('No report data for this range.');
});

test('names containing HTML are shown as text, never run as code', async ({ page, playwright, baseURL }) => {
  const evil = '<img src=x onerror="window.__xss=1">';
  const student = await newStudent(playwright, baseURL, { name: evil });
  await bookPickup(student.api);

  let dialog = false;
  page.on('dialog', async (d) => { dialog = true; await d.dismiss(); });
  await page.goto('/staff.html');
  const row = queueRow(page, student.email);
  await expect(row).toContainText(evil);
  await expect(row.locator('img')).toHaveCount(0);
  expect(await page.evaluate(() => window.__xss)).toBeUndefined();
  expect(dialog).toBe(false);
});

test('the staff page loads without console errors', async ({ page }) => {
  const errors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto('/staff.html');
  await expect(page.locator('#reports-summary .metric')).toHaveCount(4);
  expect(errors).toEqual([]);
});
