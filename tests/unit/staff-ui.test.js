import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('staff page exposes pickup, slot, and alert mount points', () => {
  const html = readFileSync('public/staff.html', 'utf8');

  assert.match(html, /id="pickup-queue"/);
  assert.match(html, /id="slot-form"/);
  assert.match(html, /id="alert-list"/);
  assert.match(html, /src="\/js\/staff-pickups.js"/);
});

test('staff pickup script uses staff API endpoints', () => {
  const js = readFileSync('public/js/staff-pickups.js', 'utf8');

  assert.match(js, /\/api\/staff\/pickups/);
  assert.match(js, /\/api\/staff\/slots/);
  assert.match(js, /\/api\/staff\/alerts/);
});
