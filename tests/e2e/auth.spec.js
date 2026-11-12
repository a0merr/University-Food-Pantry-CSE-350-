// FR1: sign in, roles, sign out, and protected pages.
import { test, expect } from '@playwright/test';

import { STAFF, signInAs, signInWithForm, newStudent } from './support.js';

test.describe('sign-in page', () => {
  test('shows a labelled sign-in form', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('University Food Pantry | Sign In');
    await expect(page.getByRole('heading', { name: 'University Food Pantry' })).toBeVisible();
    await expect(page.getByLabel('Email')).toHaveAttribute('type', 'email');
    await expect(page.getByLabel('Password')).toHaveAttribute('type', 'password');
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });

  test('a wrong password shows an error and stays on the page', async ({ page }) => {
    await signInWithForm(page, { email: STAFF.email, password: 'not-the-password' });
    await expect(page.locator('#login-message')).toHaveText('Incorrect email or password.');
    await expect(page).toHaveURL(/\/$/);
  });

  test('empty fields are blocked by the browser before any request', async ({ page }) => {
    let posted = false;
    page.on('request', (req) => { if (req.url().includes('/api/auth/login')) posted = true; });
    await page.goto('/');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.getByLabel('Email')).toBeFocused();
    expect(posted).toBe(false);
  });

  test('staff sign in and land on the staff page', async ({ page }) => {
    await signInWithForm(page, STAFF);
    await expect(page).toHaveURL(/\/staff\.html$/);
    await expect(page.getByRole('heading', { name: 'Staff Pickup Desk' })).toBeVisible();
  });

  test('email is not case sensitive and spaces are trimmed', async ({ page }) => {
    await signInWithForm(page, { email: '  STAFF@Pantry.Demo ', password: STAFF.password });
    await expect(page).toHaveURL(/\/staff\.html$/);
  });

  test('students sign in and land on a working student page', async ({ page, playwright, baseURL }) => {
    const { email } = await newStudent(playwright, baseURL);
    await signInWithForm(page, { email, password: 'E2ePassword1' });
    await expect(page).toHaveURL(/\/student\.html$/);
    const res = await page.reload();
    expect(res.status()).toBe(200);
  });
});

test.describe('protected pages', () => {
  test('the staff page sends signed-out visitors back to sign in', async ({ page }) => {
    await page.goto('/staff.html');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });

  test('a student who opens the staff page sees access errors, not staff data', async ({ page, playwright, baseURL }) => {
    const { email } = await newStudent(playwright, baseURL);
    await signInAs(page, { email, password: 'E2ePassword1' });
    await page.goto('/staff.html');
    await expect(page.locator('#queue-message')).toHaveText('You do not have access to this feature.');
    await expect(page.locator('#pickup-queue table')).toHaveCount(0);
  });

  test('sign out ends the session', async ({ page }) => {
    await signInAs(page, STAFF);
    await page.goto('/staff.html');
    await page.getByRole('link', { name: 'Sign out' }).click();
    await expect(page).toHaveURL(/\/$/);

    const me = await page.request.get('/api/auth/me');
    expect(me.status()).toBe(401);
    await page.goto('/staff.html');
    await expect(page).toHaveURL(/\/$/);
  });
});
