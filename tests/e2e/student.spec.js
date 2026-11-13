// FR2 browse, FR3 search and filter, FR4 request, FR5 pickup time, FR6 notifications
// on the student page, driven through a real browser.
import { test, expect } from '@playwright/test';

import { STAFF, XRW, signInAs, signInAsNewStudent, inStockItems, queueRow } from './support.js';

const items = (page) => page.locator('#student-item-list .pickup-item');
const itemNames = (page) => items(page).locator('h3').allTextContents();
const slots = (page) => page.locator('#student-slot-list button.slot');
const message = (page) => page.locator('#student-pickup-message');
const submit = (page) => page.getByRole('button', { name: 'Request items and book pickup' });

async function openStudentPage(page, opts) {
  const student = await signInAsNewStudent(page, opts);
  await page.goto('/student.html');
  await expect(items(page).first()).toBeVisible();
  return student;
}

async function setQuantity(page, itemName, quantity) {
  const input = page.getByLabel(`${itemName} quantity`, { exact: true });
  await input.fill(String(quantity));
  await input.dispatchEvent('change');
  return input;
}

test.describe('browsing (FR2)', () => {
  test('lists every in-stock item with its category and stock', async ({ page }) => {
    await openStudentPage(page);
    const expected = await inStockItems(page.request);

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('University Food Pantry — Student Portal');
    await expect(items(page)).toHaveCount(expected.length);
    await expect(page.locator('#student-results-count')).toHaveText(`${expected.length} available items shown`);

    const rice = expected.find(i => i.name === 'Rice');
    await expect(items(page).filter({ hasText: 'Rice' }).first()).toContainText(`Grains | ${rice.available} available`);
    await expect(page.getByLabel('Rice quantity', { exact: true })).toHaveAttribute('max', String(rice.available));
  });

  test('the category menu lists each category once, in order', async ({ page }) => {
    await openStudentPage(page);
    const expected = [...new Set((await inStockItems(page.request)).map(i => i.category))].sort((a, b) => a.localeCompare(b));
    const options = await page.getByLabel('Category').locator('option').allTextContents();
    expect(options).toEqual(['All categories', ...expected]);
  });

  test('items with no stock left are hidden', async ({ page, playwright, baseURL }) => {
    const staffApi = await playwright.request.newContext({ baseURL, extraHTTPHeaders: XRW });
    await staffApi.post('/api/auth/login', { data: STAFF });
    const created = await staffApi.post('/api/items', { data: { name: 'Sold Out Soup', category: 'Canned Goods', quantity: 0 } });
    expect(created.status()).toBe(201);

    await openStudentPage(page);
    expect(await itemNames(page)).not.toContain('Sold Out Soup');
    await staffApi.dispose();
  });
});

test.describe('search and filter (FR3)', () => {
  test('search matches item names without caring about case', async ({ page }) => {
    await openStudentPage(page);
    await page.getByLabel('Search items').fill('rICe');
    await expect(items(page)).toHaveCount(1);
    expect(await itemNames(page)).toEqual(['Rice']);
    await expect(page.locator('#student-results-count')).toHaveText('1 available item shown');
  });

  test('search also matches category names', async ({ page }) => {
    await openStudentPage(page);
    await page.getByLabel('Search items').fill('canned');
    const names = await itemNames(page);
    expect(names).toEqual(expect.arrayContaining(['Canned Beans', 'Canned Soup']));
    expect(names.every(n => n.startsWith('Canned') || n.includes('Soup'))).toBe(true);
  });

  test('a search with no matches shows an empty message', async ({ page }) => {
    await openStudentPage(page);
    await page.getByLabel('Search items').fill('zzz-no-such-food');
    await expect(page.locator('#student-item-list')).toHaveText('No matching pantry items available.');
    await expect(page.locator('#student-results-count')).toHaveText('0 available items shown');

    await page.getByLabel('Search items').fill('');
    await expect(items(page).first()).toBeVisible();
  });

  test('the category filter shows only that category, and combines with search', async ({ page }) => {
    await openStudentPage(page);
    await page.getByLabel('Category').selectOption('Breakfast');
    expect((await itemNames(page)).sort()).toEqual(['Cereal', 'Oatmeal']);

    await page.getByLabel('Search items').fill('oat');
    expect(await itemNames(page)).toEqual(['Oatmeal']);

    await page.getByLabel('Category').selectOption('');
    await page.getByLabel('Search items').fill('');
    await expect(items(page)).toHaveCount((await inStockItems(page.request)).length);
  });

  test('quantities chosen before filtering are kept', async ({ page }) => {
    await openStudentPage(page);
    await setQuantity(page, 'Rice', 2);
    await page.getByLabel('Search items').fill('pasta');
    await expect(page.getByLabel('Rice quantity', { exact: true })).toHaveCount(0);
    await page.getByLabel('Search items').fill('');
    await expect(page.getByLabel('Rice quantity', { exact: true })).toHaveValue('2');
  });
});

test.describe('requesting food and booking a pickup (FR4, FR5)', () => {
  test('a student requests items, books a time, and is notified', async ({ page }) => {
    const student = await openStudentPage(page, { name: 'Full Flow Student' });
    const riceBefore = (await inStockItems(page.request)).find(i => i.name === 'Rice').available;

    await setQuantity(page, 'Rice', 2);
    await setQuantity(page, 'Pasta', 1);
    await slots(page).first().click();
    await expect(slots(page).first()).toHaveAttribute('aria-pressed', 'true');
    await submit(page).click();

    await expect(message(page)).toHaveText('Pickup scheduled. Check your notifications for confirmation.');
    await expect(items(page).filter({ hasText: 'Rice' }).first()).toContainText(`${riceBefore - 2} available`);
    await expect(page.getByLabel('Rice quantity', { exact: true })).toHaveValue('0');
    await expect(page.locator('#student-notifications')).toContainText('Your pantry pickup is scheduled for');

    // Staff see the same request in their queue.
    const staffPage = await page.context().browser().newPage();
    await signInAs(staffPage, STAFF);
    await staffPage.goto('/staff.html');
    const row = queueRow(staffPage, student.email);
    await expect(row).toContainText('2 x Rice');
    await expect(row).toContainText('1 x Pasta');
    await staffPage.close();
  });

  test('choosing a time marks only that time as selected', async ({ page }) => {
    await openStudentPage(page);
    test.skip(await slots(page).count() < 2, 'needs two open slots');
    await slots(page).nth(0).click();
    await slots(page).nth(1).click();
    await expect(slots(page).nth(0)).toHaveAttribute('aria-pressed', 'false');
    await expect(slots(page).nth(1)).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#student-slot-list button.slot.selected')).toHaveCount(1);
  });

  test('a time and at least one item are required', async ({ page }) => {
    let posted = false;
    page.on('request', (req) => { if (req.method() === 'POST' && req.url().endsWith('/api/pickups')) posted = true; });
    await openStudentPage(page);

    await submit(page).click();
    await expect(message(page).getByRole('alert')).toHaveText('Choose a pickup time.');

    await slots(page).first().click();
    await submit(page).click();
    await expect(message(page).getByRole('alert')).toHaveText('Choose at least one item.');
    expect(posted).toBe(false);
  });

  test('a quantity above the stock on hand is reset to 0', async ({ page }) => {
    await openStudentPage(page);
    const input = await setQuantity(page, 'Granola Bars', 999);
    await expect(input).toHaveValue('0');
    await slots(page).first().click();
    await submit(page).click();
    await expect(message(page).getByRole('alert')).toHaveText('Choose at least one item.');
  });

  test('a student with an open request cannot book a second one', async ({ page }) => {
    await openStudentPage(page);
    await setQuantity(page, 'Cereal', 1);
    await slots(page).first().click();
    await submit(page).click();
    await expect(message(page)).toHaveText(/^Pickup scheduled/);

    await setQuantity(page, 'Oatmeal', 1);
    await slots(page).first().click();
    await submit(page).click();
    await expect(message(page).getByRole('alert')).toHaveText('You already have an open pickup request.');
  });

  test('the request button is disabled while the request is sent', async ({ page }) => {
    await openStudentPage(page);
    await setQuantity(page, 'Rice', 1);
    await slots(page).first().click();
    await page.route('**/api/pickups', async (route) => {
      await expect(submit(page)).toBeDisabled();
      await route.continue();
    });
    await submit(page).click();
    await expect(message(page)).toHaveText(/^Pickup scheduled/);
    await expect(submit(page)).toBeEnabled();
  });
});

test.describe('notifications (FR6)', () => {
  test('a student marks a notification read', async ({ page }) => {
    await openStudentPage(page);
    await expect(page.locator('#student-notifications')).toHaveText('No unread notifications.');

    await setQuantity(page, 'Pasta', 1);
    await slots(page).first().click();
    await submit(page).click();
    const note = page.locator('#student-notifications li', { hasText: 'scheduled for' });
    await expect(note).toBeVisible();

    await note.getByRole('button', { name: 'Mark read' }).click();
    await expect(page.locator('#student-notifications')).toHaveText('No unread notifications.');
  });

  test('a staff cancellation shows up for the student', async ({ page, browser }) => {
    const student = await openStudentPage(page);
    await setQuantity(page, 'Rice', 1);
    await slots(page).first().click();
    await submit(page).click();
    await expect(message(page)).toHaveText(/^Pickup scheduled/);

    const staffPage = await browser.newPage();
    await signInAs(staffPage, STAFF);
    await staffPage.goto('/staff.html');
    await queueRow(staffPage, student.email).getByRole('button', { name: 'Cancel' }).click();
    await expect(staffPage.locator('#queue-message')).toHaveText(/cancelled/);
    await staffPage.close();

    await page.reload();
    await expect(page.locator('#student-notifications')).toContainText('Your pantry pickup was cancelled.');
  });
});

test.describe('access and safety', () => {
  test('signed-out visitors are sent to sign in', async ({ page }) => {
    await page.goto('/student.html');
    await expect(page).toHaveURL(/\/$/);
  });

  test('sign out from the student page ends the session', async ({ page }) => {
    await openStudentPage(page);
    await page.getByRole('link', { name: 'Sign out' }).click();
    await expect(page).toHaveURL(/\/$/);
    expect((await page.request.get('/api/auth/me')).status()).toBe(401);
  });

  test('the in-page links jump to each section', async ({ page }) => {
    await openStudentPage(page);
    for (const [link, id] of [['Browse food', 'browse'], ['Book pickup', 'pickup'], ['Notifications', 'notifications']]) {
      await page.getByRole('link', { name: link, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`#${id}$`));
      await expect(page.locator(`#${id}`)).toBeInViewport();
    }
  });

  test('item names containing HTML are shown as text, never run as code', async ({ page, playwright, baseURL }) => {
    const evil = '<img src=x onerror="window.__xss=1">Beans';
    const staffApi = await playwright.request.newContext({ baseURL, extraHTTPHeaders: XRW });
    await staffApi.post('/api/auth/login', { data: STAFF });
    expect((await staffApi.post('/api/items', { data: { name: evil, category: 'Test <b>Cat</b>', quantity: 5 } })).status()).toBe(201);
    await staffApi.dispose();

    let dialog = false;
    page.on('dialog', async (d) => { dialog = true; await d.dismiss(); });
    await openStudentPage(page);
    await page.getByLabel('Search items').fill('onerror');
    await expect(items(page)).toHaveCount(1);
    await expect(items(page).locator('h3')).toHaveText(evil);
    await expect(page.locator('#student-item-list img')).toHaveCount(0);
    await expect(page.getByLabel('Category').locator('option', { hasText: 'Test <b>Cat</b>' })).toHaveCount(1);
    expect(await page.evaluate(() => window.__xss)).toBeUndefined();
    expect(dialog).toBe(false);
  });

  test('the student page loads without console errors', async ({ page }) => {
    const errors = [];
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
    page.on('pageerror', (err) => errors.push(err.message));
    await openStudentPage(page);
    await expect(page.locator('#student-notifications li').first()).toBeVisible();
    expect(errors).toEqual([]);
  });
});
