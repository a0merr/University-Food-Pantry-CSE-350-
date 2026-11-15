// FR7 staff inventory screen, FR3 dietary filter, FR4 per-visit limits and FR6 student cancel,
// driven through a real browser. Every item a test adds is retired again before it ends, so the
// seeded totals that later specs check (10 active items, the seeded low-stock alerts) are unchanged.
// AI-generated (Claude Code) - see docs/AI_USAGE.md
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

import { STAFF, XRW, signInAs, signInAsNewStudent, inStockItems } from './support.js';

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
const unique = (name) => `${name} ${Date.now().toString(36)}`;
const itemRow = (page, name) => page.locator('#item-list tbody tr', { hasText: name });

async function staffApi(playwright, baseURL) {
  const api = await playwright.request.newContext({ baseURL, extraHTTPHeaders: XRW });
  await api.post('/api/auth/login', { data: STAFF });
  return api;
}

/** Retires a test item (if it still exists and is active) so later specs see the seeded totals. */
async function retireByName(playwright, baseURL, name) {
  const api = await staffApi(playwright, baseURL);
  const { items } = await (await api.get('/api/items')).json();
  for (const item of items.filter(i => i.name === name && i.active === 1)) {
    await api.patch(`/api/items/${item.id}`, { data: { active: false } });
  }
  await api.dispose();
}

async function expectNoViolations(page, label) {
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  expect(violations.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).join(', ')}`), label).toEqual([]);
}

test('staff add an item with tags and a limit; students can filter by diet; retiring hides it', async ({ page, browser, playwright, baseURL }) => {
  const name = unique('Lentils');
  const studentPage = await browser.newPage();
  try {
    await signInAs(page, STAFF);
    await page.goto('/staff.html');
    await page.getByLabel('Name', { exact: true }).fill(name);
    await page.getByLabel('Category', { exact: true }).fill('Protein');
    await page.getByLabel('On shelf').fill('12');
    await page.getByLabel('Low-stock threshold').fill('3');
    await page.getByLabel('Per-visit limit').fill('2');
    await page.getByLabel('Dietary tags').fill('Vegan, Halal');
    await page.getByRole('button', { name: 'Add Item' }).click();
    await expect(page.locator('#item-message')).toHaveText('Item added.');
    await expect(itemRow(page, name)).toContainText('vegan, halal');
    await expect(itemRow(page, name)).toContainText('Active');

    await signInAsNewStudent(studentPage);
    await studentPage.goto('/student.html');
    const card = studentPage.locator('#student-item-list .pickup-item', { hasText: name });
    await expect(card).toContainText('Vegan · Halal · Limit 2 per visit');
    await expect(studentPage.getByLabel(`${name} quantity`, { exact: true })).toHaveAttribute('max', '2');
    await studentPage.getByLabel('Dietary').selectOption('halal');
    await expect(studentPage.locator('#student-item-list .pickup-item h3')).toHaveText([name]);

    await page.getByRole('button', { name: `Retire ${name}` }).click();
    await expect(page.locator('#item-message')).toHaveText(`${name} retired. Students no longer see it.`);
    await expect(itemRow(page, name)).toContainText('Retired');
    await studentPage.reload();
    await expect(studentPage.locator('#student-item-list .pickup-item').first()).toBeVisible();
    await expect(studentPage.locator('#student-item-list')).not.toContainText(name);
  } finally {
    await studentPage.close();
    await retireByName(playwright, baseURL, name);
  }
});

test('staff edit an item and log a donation; restocking clears its low-stock alert', async ({ page, playwright, baseURL }) => {
  const name = unique('Tea');
  const api = await staffApi(playwright, baseURL);
  const created = await api.post('/api/items', { data: { name, category: 'Drinks', quantity: 1, low_stock_threshold: 5 } });
  expect(created.status()).toBe(201);
  const { item } = await created.json();
  try {
    await signInAs(page, STAFF);
    await page.goto('/staff.html');
    await expect(page.locator('#alert-list')).toContainText(name);

    await page.getByRole('button', { name: `Edit ${name}` }).click();
    await expect(page.locator('#item-form-title')).toHaveText(`Edit ${name}`);
    await page.getByLabel('Low-stock threshold').fill('4');
    await page.getByRole('button', { name: 'Save Changes' }).click();
    await expect(page.locator('#item-message')).toHaveText('Item updated.');
    await expect(page.getByRole('button', { name: 'Add Item' })).toBeVisible();

    await page.locator('#donation-item').selectOption(String(item.id));
    await page.getByLabel('Quantity donated').fill('10');
    await page.getByLabel('Source (optional)').fill('Campus food drive');
    await page.getByRole('button', { name: 'Log Donation' }).click();
    await expect(page.locator('#donation-message')).toHaveText('Donation logged. Stock updated.');
    await expect(itemRow(page, name)).toContainText('11');
    await expect(page.locator('#alert-list')).not.toContainText(name);
  } finally {
    await api.patch(`/api/items/${item.id}`, { data: { active: false } });
    await api.dispose();
  }
});

test('a student cancels their own pickup from "Your pickup" and the stock comes back', async ({ page }) => {
  await signInAsNewStudent(page);
  await page.goto('/student.html');
  await expect(page.locator('#my-pickup-list')).toHaveText('You have no pickup booked.');
  const riceBefore = (await inStockItems(page.request)).find(i => i.name === 'Rice').available;

  const rice = page.getByLabel('Rice quantity', { exact: true });
  await rice.fill('1');
  await rice.dispatchEvent('change');
  await page.locator('#student-slot-list button.slot').first().click();
  await page.getByRole('button', { name: 'Request items and book pickup' }).click();
  await expect(page.locator('#student-pickup-message')).toContainText('Pickup scheduled.');
  const card = page.locator('#my-pickup-list .my-pickup');
  await expect(card).toContainText('1 x Rice');
  await expect(card).toContainText('Scheduled');
  await expectNoViolations(page, 'student page with an open pickup');

  await card.getByRole('button', { name: 'Cancel pickup' }).click();
  await expect(card.getByRole('button', { name: 'Confirm cancel' })).toBeVisible();
  await card.getByRole('button', { name: 'Confirm cancel' }).click();
  await expect(page.locator('#my-pickup-message')).toHaveText('Pickup cancelled. The items were returned to the pantry.');
  await expect(page.locator('#my-pickup-list')).toHaveText('You have no pickup booked.');
  await expect(page.locator('#student-item-list .pickup-item', { hasText: 'Rice' }).first())
    .toContainText(`${riceBefore} available`);
  await expect(page.locator('#student-notifications')).toContainText('Your pantry pickup was cancelled.');
});

test('the inventory panel passes axe while an item is being edited', async ({ page }) => {
  await signInAs(page, STAFF);
  await page.goto('/staff.html');
  await expect(page.locator('#item-list tbody tr').first()).toBeVisible();
  await page.getByRole('button', { name: 'Edit Rice' }).click();
  await expect(page.getByRole('button', { name: 'Cancel Edit' })).toBeVisible();
  await expectNoViolations(page, 'staff page editing an item');
  await page.getByRole('button', { name: 'Cancel Edit' }).click();
});
