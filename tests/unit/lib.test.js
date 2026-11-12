import test from 'node:test';
import assert from 'node:assert/strict';

import {
  AppError,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  tooManyRequests
} from '../../src/lib/errors.js';
import { requireString, requireInt, optionalInt, requireId } from '../../src/lib/validate.js';
import {
  toLocalIso,
  toLocalDate,
  parseLocalIso,
  parseLocalDate,
  formatSlot,
  systemClock
} from '../../src/lib/time.js';

// ---- errors.js ----

test('error factories set HTTP status, code and message', () => {
  const cases = [
    [badRequest('bad'), 400, 'bad_request', 'bad'],
    [unauthorized(), 401, 'unauthorized', 'Please sign in.'],
    [forbidden(), 403, 'forbidden', 'You do not have access to this feature.'],
    [notFound(), 404, 'not_found', 'Not found.'],
    [conflict('taken'), 409, 'conflict', 'taken'],
    [tooManyRequests('slow down'), 429, 'too_many_requests', 'slow down']
  ];

  for (const [err, status, code, message] of cases) {
    assert.ok(err instanceof AppError);
    assert.ok(err instanceof Error);
    assert.equal(err.status, status);
    assert.equal(err.code, code);
    assert.equal(err.message, message);
  }
});

test('error factories accept custom messages', () => {
  assert.equal(unauthorized('Log in first').message, 'Log in first');
  assert.equal(forbidden('Nope').message, 'Nope');
  assert.equal(notFound('Missing').message, 'Missing');
});

// ---- validate.js ----

test('requireString trims and returns the value', () => {
  assert.equal(requireString('  Rice  ', 'Name'), 'Rice');
});

test('requireString rejects missing, blank and non-string values', () => {
  for (const value of [undefined, null, '', '   ', 42, {}]) {
    assert.throws(() => requireString(value, 'Name'), { status: 400, message: 'Name is required.' });
  }
});

test('requireString enforces the max length after trimming', () => {
  assert.equal(requireString(' abc ', 'Name', { max: 3 }), 'abc');
  assert.throws(() => requireString('abcd', 'Name', { max: 3 }), {
    message: 'Name must be 3 characters or fewer.'
  });
});

test('requireInt accepts integers and numeric strings', () => {
  assert.equal(requireInt(5, 'Qty'), 5);
  assert.equal(requireInt('7', 'Qty'), 7);
  assert.equal(requireInt(' 3 ', 'Qty'), 3);
  assert.equal(requireInt(0, 'Qty'), 0);
});

test('requireInt rejects non-integers', () => {
  for (const value of [1.5, '1.5', 'abc', '', '  ', null, undefined, NaN, Infinity, true]) {
    assert.throws(() => requireInt(value, 'Qty'), { status: 400, message: 'Qty must be a whole number.' });
  }
});

test('requireInt enforces min and max', () => {
  assert.throws(() => requireInt(-1, 'Qty'), { message: 'Qty must be between 0 and 100000.' });
  assert.throws(() => requireInt(100001, 'Qty'), { message: 'Qty must be between 0 and 100000.' });
  assert.throws(() => requireInt(0, 'Qty', { min: 1, max: 5 }), { message: 'Qty must be between 1 and 5.' });
  assert.throws(() => requireInt(6, 'Qty', { min: 1, max: 5 }));
  assert.equal(requireInt(5, 'Qty', { min: 1, max: 5 }), 5);
});

test('optionalInt returns null for empty values and validates the rest', () => {
  assert.equal(optionalInt(undefined, 'Limit'), null);
  assert.equal(optionalInt(null, 'Limit'), null);
  assert.equal(optionalInt('', 'Limit'), null);
  assert.equal(optionalInt('4', 'Limit'), 4);
  assert.throws(() => optionalInt('x', 'Limit'), { status: 400 });
});

test('requireId accepts positive integers only', () => {
  assert.equal(requireId(1), 1);
  assert.equal(requireId('42'), 42);
  assert.throws(() => requireId(0), { message: 'ID must be between 1 and 9007199254740991.' });
  assert.throws(() => requireId(-3, 'Slot ID'), /Slot ID/);
  assert.throws(() => requireId('abc', 'Item ID'), { message: 'Item ID must be a whole number.' });
});

// ---- time.js ----

test('toLocalIso and toLocalDate format local time with zero padding', () => {
  const d = new Date(2026, 0, 5, 3, 4, 9);
  assert.equal(toLocalIso(d), '2026-01-05T03:04:09');
  assert.equal(toLocalDate(d), '2026-01-05');
});

test('parseLocalIso parses with and without seconds', () => {
  const withSeconds = parseLocalIso('2026-11-09T13:30:15');
  assert.equal(toLocalIso(withSeconds), '2026-11-09T13:30:15');
  const withoutSeconds = parseLocalIso('2026-11-09T13:30');
  assert.equal(toLocalIso(withoutSeconds), '2026-11-09T13:30:00');
});

test('parseLocalIso rejects malformed and impossible values', () => {
  for (const value of [
    null,
    undefined,
    '',
    'not a date',
    '2026-11-09',
    '2026-11-09 13:30',
    '2026-11-09T24:00',
    '2026-11-09T12:60',
    '2026-11-09T12:00:60',
    '2026-02-30T10:00',
    '2026-13-01T10:00',
    '2026-11-09T13:30Z'
  ]) {
    assert.equal(parseLocalIso(value), null, `expected null for ${value}`);
  }
});

test('parseLocalDate parses dates and rejects invalid ones', () => {
  assert.equal(toLocalDate(parseLocalDate('2024-02-29')), '2024-02-29');
  assert.equal(parseLocalDate('2025-02-29'), null);
  assert.equal(parseLocalDate('11/09/2026'), null);
});

test('formatSlot renders a friendly date and passes through invalid input', () => {
  assert.equal(formatSlot('2026-09-25T13:30:00'), 'Fri, Sep 25 at 1:30 PM');
  assert.equal(formatSlot('garbage'), 'garbage');
});

test('systemClock returns the current time', () => {
  const before = Date.now();
  const now = systemClock.now().getTime();
  assert.ok(now >= before && now <= Date.now());
});
