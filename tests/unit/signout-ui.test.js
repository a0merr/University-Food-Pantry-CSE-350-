import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('staff page has a sign-out link that calls the logout endpoint', () => {
  const html = readFileSync('public/staff.html', 'utf8');
  const js = readFileSync('public/js/signout.js', 'utf8');

  assert.match(html, /id="sign-out"/);
  assert.match(html, /src="\/js\/signout.js"/);
  assert.match(js, /\/api\/auth\/logout/);
});

test('staff page re-checks the signed-in account when the tab comes back into view', () => {
  const html = readFileSync('public/staff.html', 'utf8');
  const js = readFileSync('public/js/staff-guard.js', 'utf8');

  assert.match(html, /src="\/js\/staff-guard.js"/);
  assert.match(js, /\/api\/auth\/me/);
  assert.match(js, /visibilitychange/);
  assert.match(js, /role === 'staff'/);
});
