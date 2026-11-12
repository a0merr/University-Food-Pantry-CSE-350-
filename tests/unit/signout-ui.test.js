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
