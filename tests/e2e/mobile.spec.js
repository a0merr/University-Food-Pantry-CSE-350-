// Phone-width layout (runs in the mobile-chromium project, Pixel 7 viewport).
import { test, expect } from '@playwright/test';

import { STAFF, signInAs, signInAsNewStudent, newStudent, bookPickup, queueRow } from './support.js';

async function noSideScroll(page) {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth
  }));
  expect(scrollWidth, 'page should not scroll sideways').toBeLessThanOrEqual(clientWidth);
}

test('sign-in page fits a phone screen', async ({ page }) => {
  await page.goto('/');
  await noSideScroll(page);
  const button = await page.getByRole('button', { name: 'Sign In' }).boundingBox();
  expect(button.height, 'tap target at least 24px tall').toBeGreaterThanOrEqual(24);
});

test('staff page fits a phone screen with data loaded', async ({ page, playwright, baseURL }) => {
  const student = await newStudent(playwright, baseURL, { name: 'Mobile Student With A Long Name' });
  await bookPickup(student.api);
  await signInAs(page, STAFF);
  await page.goto('/staff.html');
  await expect(queueRow(page, student.email)).toBeVisible();
  await page.getByRole('button', { name: 'Check Stock' }).click();
  await expect(page.locator('#alert-list tbody tr').first()).toBeVisible();
  await noSideScroll(page);
});

test('queue actions are usable by tap on a phone', async ({ page, playwright, baseURL }) => {
  const student = await newStudent(playwright, baseURL);
  await bookPickup(student.api);
  await signInAs(page, STAFF);
  await page.goto('/staff.html');
  const row = queueRow(page, student.email);
  await row.getByRole('button', { name: 'Prepare' }).tap();
  await expect(page.locator('#queue-message')).toHaveText('Pickup marked ready.');
});

test('student page fits a phone screen', async ({ page }) => {
  await signInAsNewStudent(page);
  await page.goto('/student.html');
  await expect(page.locator('#student-item-list .pickup-item').first()).toBeVisible();
  await noSideScroll(page);

  for (const control of [
    page.getByLabel('Search items'),
    page.getByLabel('Category'),
    page.getByLabel('Rice quantity', { exact: true }),
    page.locator('#student-slot-list button.slot').first(),
    page.getByRole('button', { name: 'Request items and book pickup' })
  ]) {
    const box = await control.boundingBox();
    expect(box.height, 'tap target at least 24px tall').toBeGreaterThanOrEqual(24);
    expect(box.x, 'control starts on screen').toBeGreaterThanOrEqual(0);
  }
});

test('a student can request food and book a time by tap on a phone', async ({ page }) => {
  await signInAsNewStudent(page);
  await page.goto('/student.html');
  await page.getByLabel('Search items').tap();
  await page.getByLabel('Search items').fill('pasta');
  const quantity = page.getByLabel('Pasta quantity', { exact: true });
  await quantity.tap();
  await quantity.fill('1');
  await quantity.dispatchEvent('change');
  await page.locator('#student-slot-list button.slot').first().tap();
  await page.getByRole('button', { name: 'Request items and book pickup' }).tap();
  await expect(page.locator('#student-pickup-message')).toHaveText(/^Pickup scheduled/);
  await noSideScroll(page);
});
