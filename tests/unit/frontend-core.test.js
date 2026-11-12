// public/js/api.js and public/js/ui.js running against a jsdom document.
import test from 'node:test';
import assert from 'node:assert/strict';

import { installDom, jsonResponse } from '../helpers.js';
import { api, ApiError } from '../../public/js/api.js';
import {
  el,
  showMessage,
  localDate,
  formatDay,
  formatTime,
  formatDateTime,
  STATUS_LABELS,
  statusChip,
  confirmButton
} from '../../public/js/ui.js';

const BLANK = '<!doctype html><html><body><div id="box"></div></body></html>';

function withDom(fetchImpl, fn, html = BLANK) {
  return async () => {
    const env = installDom(html, fetchImpl ?? (async () => jsonResponse(200, {})));
    try {
      await fn(env);
    } finally {
      env.restore();
    }
  };
}

// ---- api.js ----

test('api sends the security header and same-origin credentials on GET', withDom(
  async () => jsonResponse(200, { ok: true }),
  async ({ calls }) => {
    const data = await api('/api/items');
    assert.deepEqual(data, { ok: true });
    assert.equal(calls[0].path, '/api/items');
    assert.equal(calls[0].method, 'GET');
    assert.equal(calls[0].credentials, 'same-origin');
    assert.deepEqual(calls[0].headers, { 'X-Requested-With': 'fetch' });
    assert.equal(calls[0].body, undefined);
  }
));

test('api JSON-encodes a body and sets the content type', withDom(
  async () => jsonResponse(201, { created: 1 }),
  async ({ calls }) => {
    await api('/api/pickups', { method: 'POST', body: { slot_id: 3 } });
    assert.equal(calls[0].method, 'POST');
    assert.equal(calls[0].headers['Content-Type'], 'application/json');
    assert.deepEqual(calls[0].body, { slot_id: 3 });
  }
));

test('api returns null for 204 responses', withDom(
  async () => new Response(null, { status: 204 }),
  async () => {
    assert.equal(await api('/api/auth/logout', { method: 'POST' }), null);
  }
));

test('api redirects to the sign-in page on 401', withDom(
  async () => jsonResponse(401, { error: { message: 'Please sign in.' } }),
  async ({ assigned }) => {
    await assert.rejects(api('/api/staff/pickups'), (err) => err instanceof ApiError && err.status === 401);
    assert.deepEqual(assigned, ['/']);
  }
));

test('api does not redirect when the login itself fails', withDom(
  async () => jsonResponse(401, { error: { message: 'Incorrect email or password.' } }),
  async ({ assigned }) => {
    await assert.rejects(api('/api/auth/login', { method: 'POST', body: {} }), {
      status: 401,
      message: 'Incorrect email or password.'
    });
    assert.deepEqual(assigned, []);
  }
));

test('api throws the server error message on failure', withDom(
  async () => jsonResponse(409, { error: { message: 'Pickup slot is full.' } }),
  async () => {
    await assert.rejects(api('/api/pickups', { method: 'POST', body: {} }), { status: 409, message: 'Pickup slot is full.' });
  }
));

test('api falls back to a generic message when the error body is not JSON', withDom(
  async () => new Response('<html>oops</html>', { status: 500 }),
  async () => {
    await assert.rejects(api('/api/items'), { status: 500, message: 'Something went wrong. Please try again.' });
  }
));

// ---- ui.js ----

test('el builds elements with text, class, attributes and children', withDom(null, async ({ document }) => {
  const clicks = [];
  const node = el('button', {
    class: 'primary',
    text: 'Go',
    type: 'button',
    'aria-pressed': true,
    hidden: false,
    title: null,
    'data-x': undefined,
    onclick: () => clicks.push(1)
  });
  assert.equal(node.tagName, 'BUTTON');
  assert.equal(node.className, 'primary');
  assert.equal(node.textContent, 'Go');
  assert.equal(node.getAttribute('type'), 'button');
  assert.equal(node.getAttribute('aria-pressed'), '');
  assert.equal(node.hasAttribute('hidden'), false);
  assert.equal(node.hasAttribute('title'), false);
  assert.equal(node.hasAttribute('data-x'), false);
  node.click();
  assert.deepEqual(clicks, [1]);

  const list = el('ul', {}, [el('li', { text: 'a' }), null, false], 'tail', 7, undefined);
  assert.equal(list.children.length, 1);
  assert.equal(list.textContent, 'atail7');
  assert.ok(document);
}));

test('el never interprets text as HTML', withDom(null, async () => {
  const node = el('p', { text: '<img src=x onerror=alert(1)>' }, '<b>bold</b>');
  assert.equal(node.querySelector('img'), null);
  assert.equal(node.querySelector('b'), null);
  assert.equal(node.textContent, '<img src=x onerror=alert(1)><b>bold</b>');
}));

test('showMessage writes a status or alert region and clears it', withDom(null, async ({ document }) => {
  const box = document.querySelector('#box');
  showMessage(box, 'Saved.');
  assert.equal(box.querySelector('.message.ok').getAttribute('role'), 'status');
  assert.equal(box.textContent, 'Saved.');

  showMessage('#box', 'Failed.', 'error');
  assert.equal(box.children.length, 1);
  assert.equal(box.querySelector('.message.error').getAttribute('role'), 'alert');

  showMessage(box, '');
  assert.equal(box.children.length, 0);
}));

test('date helpers format local dates and times', withDom(null, async () => {
  assert.equal(localDate(new Date(2026, 0, 5)), '2026-01-05');
  assert.match(localDate(), /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(formatDay('2026-09-25T13:30:00'), 'Friday, Sep 25');
  assert.equal(formatTime('2026-09-25T13:30:00'), '1:30 PM');
  assert.equal(formatTime('2026-09-25'), '12:00 AM');
  assert.equal(formatDateTime('2026-09-25T09:05'), 'Fri, Sep 25 at 9:05 AM');
}));

test('statusChip labels every pickup status', withDom(null, async () => {
  for (const [status, label] of Object.entries(STATUS_LABELS)) {
    const chip = statusChip(status);
    assert.equal(chip.className, `chip ${status}`);
    assert.equal(chip.textContent, label);
  }
  assert.equal(statusChip('mystery').textContent, 'mystery');
}));

test('confirmButton needs two clicks and resets after a timeout', withDom(null, async ({ document }) => {
  const box = document.querySelector('#box');
  const button = el('button', { id: 'del', text: 'Delete' });
  const hint = el('span', { id: 'del-prompt' });
  box.append(button, hint);
  let confirmed = 0;
  confirmButton(button, { prompt: 'Are you sure?', confirmLabel: 'Confirm delete', onConfirm: async () => { confirmed += 1; } });

  button.click();
  assert.equal(button.textContent, 'Confirm delete');
  assert.equal(hint.textContent, 'Are you sure?');
  assert.equal(button.getAttribute('aria-describedby'), 'del-prompt');
  assert.equal(confirmed, 0);

  button.click();
  await Promise.resolve();
  assert.equal(confirmed, 1);
  assert.equal(button.textContent, 'Delete');
  assert.equal(hint.textContent, '');
}));

test('confirmButton disarms itself after 6 seconds', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const env = installDom(BLANK, async () => jsonResponse(200, {}));
  try {
    const button = el('button', { id: 'go', text: 'Go' });
    env.document.body.append(button);
    let confirmed = 0;
    confirmButton(button, { prompt: 'Sure?', confirmLabel: 'Really?', onConfirm: () => { confirmed += 1; } });

    button.click();
    assert.equal(button.textContent, 'Really?');
    t.mock.timers.tick(6000);
    assert.equal(button.textContent, 'Go');
    button.click();
    assert.equal(confirmed, 0, 'first click after reset only re-arms');
  } finally {
    env.restore();
  }
});
