import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('staff reports script loads report data from staff endpoint', () => {
  const js = readFileSync('public/js/staff-reports.js', 'utf8');

  assert.match(js, /\/api\/staff\/reports/);
  assert.match(js, /reports-summary/);
  assert.match(js, /reports-top-items/);
});

test('staff page includes report mount points', () => {
  const html = readFileSync('public/staff.html', 'utf8');

  assert.match(html, /id="reports-form"/);
  assert.match(html, /id="reports-summary"/);
  assert.match(html, /src="\/js\/staff-reports.js"/);
});
