import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('student pickup script schedules pickups through public API endpoints', () => {
  const js = readFileSync('public/js/student-pickup.js', 'utf8');

  assert.match(js, /\/api\/items/);
  assert.match(js, /\/api\/pickup-slots/);
  assert.match(js, /\/api\/pickups/);
  assert.match(js, /\/api\/notifications/);
});

test('student pickup script validates slot and item choices before submit', () => {
  const js = readFileSync('public/js/student-pickup.js', 'utf8');

  assert.match(js, /Choose a pickup time/);
  assert.match(js, /Choose at least one item/);
});
