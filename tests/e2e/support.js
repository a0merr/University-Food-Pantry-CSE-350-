// Shared helpers for the Playwright specs.
import { expect } from '@playwright/test';

export const STAFF = { email: 'staff@pantry.demo', password: 'StaffDemo123!' };
export const XRW = { 'X-Requested-With': 'fetch' };

let counter = 0;
export function uniqueEmail(prefix = 'student') {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}@e2e.test`;
}

/** Signs the page's browser context in through the API (shares its cookies). */
export async function signInAs(page, account) {
  const res = await page.request.post('/api/auth/login', { data: account, headers: XRW });
  expect(res.status(), await res.text()).toBe(200);
}

/** Signs in through the real form on the sign-in page. */
export async function signInWithForm(page, { email, password }) {
  await page.goto('/');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
}

/**
 * Registers a brand-new student in its own API context (so each test has a
 * student with no open pickup). Returns { api, email, name }.
 */
export async function newStudent(playwright, baseURL, { name = 'E2E Student' } = {}) {
  const api = await playwright.request.newContext({ baseURL, extraHTTPHeaders: XRW });
  const email = uniqueEmail();
  const res = await api.post('/api/auth/register', { data: { name, email, password: 'E2ePassword1' } });
  expect(res.status(), await res.text()).toBe(201);
  return { api, email, name };
}

/** Registers a brand-new student and signs the page's browser context in as them. */
export async function signInAsNewStudent(page, { name = 'E2E Student' } = {}) {
  const email = uniqueEmail();
  const res = await page.request.post('/api/auth/register', {
    data: { name, email, password: 'E2ePassword1' },
    headers: XRW
  });
  expect(res.status(), await res.text()).toBe(201);
  return { email, name };
}

/** Items a student can see right now (active and in stock), as the API reports them. */
export async function inStockItems(request) {
  const { items } = await (await request.get('/api/items')).json();
  return items.filter(i => i.active === 1 && i.available > 0);
}

/** Books the first open slot with one unit of the first item that has stock. */
export async function bookPickup(api, { itemName } = {}) {
  const { slots } = await (await api.get('/api/pickup-slots')).json();
  const { items } = await (await api.get('/api/items')).json();
  const slot = slots.find(s => s.available > 0);
  const item = items.find(i => i.active === 1 && i.available > 0 && (!itemName || i.name === itemName));
  const res = await api.post('/api/pickups', {
    data: { slot_id: slot.id, items: [{ item_id: item.id, quantity: 1 }] }
  });
  expect(res.status(), await res.text()).toBe(201);
  return (await res.json()).pickup;
}

/** The staff queue row for a student, found by their unique email. */
export function queueRow(page, email) {
  return page.locator('#pickup-queue tbody tr', { hasText: email });
}

/** A future local time "YYYY-MM-DDTHH:MM" for <input type="datetime-local">. */
export function futureLocal(daysAhead, hour, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  d.setHours(hour, minute, 0, 0);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
