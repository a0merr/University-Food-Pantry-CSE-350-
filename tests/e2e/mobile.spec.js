// Phone-width layout (runs in the mobile-chromium project, Pixel 7 viewport).
import { test, expect } from '@playwright/test';

import { STAFF, signInAs, newStudent, bookPickup, queueRow } from './support.js';

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
