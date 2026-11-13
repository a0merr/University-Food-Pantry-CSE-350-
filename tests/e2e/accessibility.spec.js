// NFR2 accessibility: axe-core scans (WCAG 2.1 A and AA, the target in the
// report draft) in every state the pages can be in, plus keyboard-only use.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

import { STAFF, signInAs, signInWithForm, signInAsNewStudent, newStudent, bookPickup, queueRow } from './support.js';

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

async function expectNoViolations(page, label) {
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  const summary = violations.map(v => `${v.id} (${v.impact}): ${v.help} — ${v.nodes.map(n => n.target.join(' ')).join(', ')}`);
  expect(summary, `${label}: axe violations`).toEqual([]);
}

test.describe('axe scans', () => {
  test('sign-in page', async ({ page }) => {
    await page.goto('/');
    await expectNoViolations(page, 'sign-in');
  });

  test('sign-in page showing an error', async ({ page }) => {
    await signInWithForm(page, { email: STAFF.email, password: 'wrong-password' });
    await expect(page.locator('#login-message')).not.toBeEmpty();
    await expectNoViolations(page, 'sign-in error');
  });

  test('staff page with queue, slots, alerts and report loaded', async ({ page, playwright, baseURL }) => {
    const student = await newStudent(playwright, baseURL);
    await bookPickup(student.api);
    await signInAs(page, STAFF);
    await page.goto('/staff.html');
    await expect(queueRow(page, student.email)).toBeVisible();
    await page.getByRole('button', { name: 'Check Stock' }).click();
    await expect(page.locator('#alert-message')).not.toBeEmpty();
    await expectNoViolations(page, 'staff (loaded)');
  });

  test('staff page with empty states and an error message', async ({ page }) => {
    await signInAs(page, STAFF);
    await page.goto('/staff.html');
    await page.getByLabel('Status').selectOption('prepared');
    await page.getByRole('button', { name: 'Add Slot' }).click(); // blocked by required field
    await page.getByLabel('From', { exact: true }).fill('2000-01-01');
    await page.getByLabel('To', { exact: true }).fill('2000-01-02');
    await page.getByRole('button', { name: 'Run Report' }).click();
    await expect(page.locator('#reports-top-items')).toHaveText('No report data for this range.');
    await expectNoViolations(page, 'staff (empty)');
  });
});

test.describe('axe scans: student page', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsNewStudent(page);
    await page.goto('/student.html');
    await expect(page.locator('#student-item-list .pickup-item').first()).toBeVisible();
  });

  test('student page with items, times and notifications loaded', async ({ page }) => {
    await expectNoViolations(page, 'student (loaded)');
  });

  test('student page with no search results', async ({ page }) => {
    await page.getByLabel('Search items').fill('zzz-no-such-food');
    await expect(page.locator('#student-item-list')).toHaveText('No matching pantry items available.');
    await expectNoViolations(page, 'student (no results)');
  });

  test('student page showing a validation error', async ({ page }) => {
    await page.getByRole('button', { name: 'Request items and book pickup' }).click();
    await expect(page.locator('#student-pickup-message [role="alert"]')).toBeVisible();
    await expectNoViolations(page, 'student (error)');
  });

  test('student page after booking, with a selected time and a notification', async ({ page }) => {
    const input = page.getByLabel('Pasta quantity', { exact: true });
    await input.fill('1');
    await input.dispatchEvent('change');
    await page.locator('#student-slot-list button.slot').first().click();
    await page.getByRole('button', { name: 'Request items and book pickup' }).click();
    await expect(page.locator('#student-notifications')).toContainText('scheduled for');
    await expectNoViolations(page, 'student (booked)');
  });
});

test.describe('keyboard only', () => {
  test('sign in using only the keyboard', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    await expect(page.getByLabel('Email')).toBeFocused();
    await page.keyboard.type(STAFF.email);
    await page.keyboard.press('Tab');
    await expect(page.getByLabel('Password')).toBeFocused();
    await page.keyboard.type(STAFF.password);
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/staff\.html$/);
  });

  test('prepare a pickup using only the keyboard', async ({ page, playwright, baseURL }) => {
    const student = await newStudent(playwright, baseURL);
    await bookPickup(student.api);
    await signInAs(page, STAFF);
    await page.goto('/staff.html');
    const prepare = queueRow(page, student.email).getByRole('button', { name: 'Prepare' });
    await expect(prepare).toBeVisible();

    // Tab through the page until the Prepare button for this student has focus.
    for (let i = 0; i < 200; i += 1) {
      if (await prepare.evaluate(el => el === document.activeElement)) break;
      await page.keyboard.press('Tab');
    }
    await expect(prepare).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#queue-message')).toHaveText('Pickup marked ready.');
  });

  test('a student searches, requests food and books a time using only the keyboard', async ({ page }) => {
    await signInAsNewStudent(page);
    await page.goto('/student.html');
    await expect(page.locator('#student-item-list .pickup-item').first()).toBeVisible();

    const tabTo = async (locator) => {
      for (let i = 0; i < 300; i += 1) {
        if (await locator.evaluate(el => el === document.activeElement)) return;
        await page.keyboard.press('Tab');
      }
      throw new Error('could not reach the control with Tab');
    };

    await tabTo(page.getByLabel('Search items'));
    await page.keyboard.type('oatmeal');
    await expect(page.locator('#student-item-list .pickup-item')).toHaveCount(1);

    const quantity = page.getByLabel('Oatmeal quantity', { exact: true });
    await tabTo(quantity);
    await page.keyboard.press('ArrowUp');
    await expect(quantity).toHaveValue('1');

    const slot = page.locator('#student-slot-list button.slot').first();
    await tabTo(slot); // leaving the number field fires its change event
    await page.keyboard.press('Space');
    await expect(slot).toHaveAttribute('aria-pressed', 'true');

    await tabTo(page.getByRole('button', { name: 'Request items and book pickup' }));
    await page.keyboard.press('Enter');
    await expect(page.locator('#student-pickup-message')).toHaveText(/^Pickup scheduled/);
  });

  test('focused controls show a visible focus indicator', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    const style = await page.getByLabel('Email').evaluate((el) => {
      const s = getComputedStyle(el);
      return { outline: s.outlineStyle, width: s.outlineWidth, shadow: s.boxShadow };
    });
    const visible = (style.outline !== 'none' && style.width !== '0px') || style.shadow !== 'none';
    expect(visible, JSON.stringify(style)).toBe(true);
  });
});

test.describe('screen reader announcements', () => {
  test('success messages use role="status" and errors use role="alert"', async ({ page, playwright, baseURL }) => {
    const student = await newStudent(playwright, baseURL);
    await bookPickup(student.api);
    await signInAs(page, STAFF);
    await page.goto('/staff.html');

    await queueRow(page, student.email).getByRole('button', { name: 'Prepare' }).click();
    await expect(page.locator('#queue-message [role="status"]')).toHaveText('Pickup marked ready.');

    // A date picker can't produce an invalid date, so switch the field to text to send one.
    await page.evaluate(() => { document.querySelector('[name="from"]').type = 'text'; });
    await page.getByLabel('From', { exact: true }).fill('2026-02-30');
    await page.getByRole('button', { name: 'Run Report' }).click();
    await expect(page.locator('#reports-message [role="alert"]')).toHaveText('From date must be a valid date.');
  });

  test('message areas are live regions', async ({ page }) => {
    await signInAs(page, STAFF);
    await page.goto('/staff.html');
    for (const id of ['queue-message', 'slot-message', 'alert-message', 'reports-message']) {
      await expect(page.locator(`#${id}`)).toHaveAttribute('aria-live', 'polite');
    }
  });

  test('pages have a language, a title and one main landmark', async ({ page }) => {
    for (const path of ['/', '/staff.html', '/student.html']) {
      if (path === '/staff.html') await signInAs(page, STAFF);
      if (path === '/student.html') await signInAsNewStudent(page);
      await page.goto(path);
      await expect(page.locator('html')).toHaveAttribute('lang', 'en');
      expect((await page.title()).length).toBeGreaterThan(0);
      await expect(page.getByRole('main')).toHaveCount(1);
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    }
  });
});
