import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('sign-in page has the form, the stylesheet and the login script', () => {
  const html = readFileSync('public/index.html', 'utf8');

  assert.match(html, /id="signin-form"/);
  assert.match(html, /type="email"/);
  assert.match(html, /type="password"/);
  assert.match(html, /href="\/css\/styles.css"/);
  assert.match(html, /src="\/js\/login.js"/);
});

test('login script signs in through the API and routes by role', () => {
  const js = readFileSync('public/js/login.js', 'utf8');

  assert.match(js, /\/api\/auth\/login/);
  assert.match(js, /\/api\/auth\/me/);
  assert.match(js, /\/staff\.html/);
  assert.match(js, /\/student\.html/);
});
