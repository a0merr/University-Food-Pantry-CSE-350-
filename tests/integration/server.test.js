// Boots the real server.js and seed script in a throwaway folder, so the
// project's own data/pantry.db is never touched.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { call } from '../helpers.js';

const ROOT = resolve('.');
const SERVER = join(ROOT, 'server.js');
const SEED = join(ROOT, 'scripts', 'seed.js');
const XRW = { 'X-Requested-With': 'fetch' };

// Demo accounts created by scripts/seed.js.
const STAFF = { email: 'staff@pantry.demo', password: 'StaffDemo123!' };
const STUDENT = { email: 'student1@pantry.demo', password: 'StudentDemo123!' };

function freePort() {
  return new Promise((done, fail) => {
    const probe = createServer();
    probe.once('error', fail);
    probe.listen(0, '127.0.0.1', () => {
      const { port } = probe.address();
      probe.close(() => done(port));
    });
  });
}

async function bootServer(cwd, env = {}) {
  const port = await freePort();
  const child = spawn(process.execPath, ['--no-warnings', SERVER], {
    cwd,
    env: { ...process.env, PORT: String(port), RENDER: '', TRUST_PROXY: '', ...env },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let output = '';
  await new Promise((ready, fail) => {
    const timer = setTimeout(() => fail(new Error(`server did not start:\n${output}`)), 15_000);
    const onData = (chunk) => {
      output += chunk;
      if (output.includes('Server running')) {
        clearTimeout(timer);
        ready();
      }
    };
    child.stdout.on('data', onData);
    child.stderr.on('data', (chunk) => { output += chunk; });
    child.once('exit', (code) => {
      clearTimeout(timer);
      fail(new Error(`server exited with ${code}:\n${output}`));
    });
  });
  return {
    url: `http://127.0.0.1:${port}`,
    stop: () => new Promise((done) => {
      child.removeAllListeners('exit');
      child.once('exit', done);
      child.kill();
    })
  };
}

function makeWorkdir() {
  const dir = mkdtempSync(join(tmpdir(), 'pantry-server-'));
  cpSync(join(ROOT, 'public'), join(dir, 'public'), { recursive: true });
  return dir;
}

function cookieFrom(res) {
  return /session=[^;]+/.exec(res.headers.get('set-cookie') ?? '')?.[0];
}

async function login(url, account) {
  const res = await call(url, '/api/auth/login', { method: 'POST', headers: XRW, body: account });
  assert.equal(res.status, 200, JSON.stringify(res.body));
  return { cookie: cookieFrom(res), user: res.body.user };
}

const workdir = makeWorkdir();
const seed = spawnSync(process.execPath, ['--no-warnings', SEED, '--reset'], { cwd: workdir, encoding: 'utf8' });
const app = await bootServer(workdir);

test.after(async () => {
  await app.stop();
  rmSync(workdir, { recursive: true, force: true });
});

test('seed script runs cleanly and creates the database', () => {
  assert.equal(seed.status, 0, seed.stderr);
  assert.ok(existsSync(join(workdir, 'data', 'pantry.db')));
});

test('health check responds', async () => {
  const res = await call(app.url, '/api/health');
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { status: 'ok' });
});

test('static pages, styles and scripts are served', async () => {
  for (const [path, type] of [
    ['/', /text\/html/],
    ['/staff.html', /text\/html/],
    ['/css/styles.css', /text\/css/],
    ['/js/api.js', /javascript/],
    ['/js/ui.js', /javascript/],
    ['/js/staff-pickups.js', /javascript/],
    ['/js/staff-reports.js', /javascript/],
    ['/js/signout.js', /javascript/],
    ['/js/student-pickup.js', /javascript/]
  ]) {
    const res = await fetch(`${app.url}${path}`);
    assert.equal(res.status, 200, path);
    assert.match(res.headers.get('content-type'), type, path);
  }
  assert.match(await (await fetch(`${app.url}/`)).text(), /University Food Pantry \| Sign In/);
});

test('API writes without the X-Requested-With header are refused (CSRF guard)', async () => {
  const res = await call(app.url, '/api/auth/login', { method: 'POST', body: STAFF });
  assert.equal(res.status, 403);
  assert.equal(res.body.error.message, 'Missing security header.');
});

test('API reads do not need the security header', async () => {
  const res = await call(app.url, '/api/items');
  assert.equal(res.status, 200);
  assert.equal(res.body.items.length, 10);
});

test('cross-origin and malformed Origin headers are refused', async () => {
  const cross = await call(app.url, '/api/auth/login', {
    method: 'POST', body: STAFF, headers: { ...XRW, Origin: 'https://evil.example' }
  });
  assert.equal(cross.status, 403);
  assert.equal(cross.body.error.message, 'Request origin not allowed.');

  const malformed = await call(app.url, '/api/auth/login', {
    method: 'POST', body: STAFF, headers: { ...XRW, Origin: 'not a url' }
  });
  assert.equal(malformed.status, 403);
  assert.equal(malformed.body.error.message, 'Invalid request origin.');

  const same = await call(app.url, '/api/auth/login', {
    method: 'POST', body: STAFF, headers: { ...XRW, Origin: app.url }
  });
  assert.equal(same.status, 200);
});

test('malformed JSON gets a 400 with a clear message', async () => {
  const res = await call(app.url, '/api/auth/login', {
    method: 'POST', headers: XRW, body: '{"email": '
  });
  assert.equal(res.status, 400);
  assert.deepEqual(res.body, { error: { code: 'bad_request', message: 'Request body is not valid JSON.' } });
});

test('application errors are returned as JSON with a code', async () => {
  const anon = await call(app.url, '/api/staff/alerts');
  assert.equal(anon.status, 401);
  assert.deepEqual(anon.body, { error: { code: 'unauthorized', message: 'Please sign in.' } });
});

test('seeded demo accounts can sign in with the right roles', async () => {
  const staff = await login(app.url, STAFF);
  const student = await login(app.url, STUDENT);
  assert.equal(staff.user.role, 'staff');
  assert.equal(student.user.role, 'student');

  const me = await call(app.url, '/api/auth/me', { cookie: student.cookie });
  assert.equal(me.body.user.email, STUDENT.email);
});

test('end to end: student books, staff prepares and completes, report and alerts update', async () => {
  const student = await login(app.url, STUDENT);
  const staff = await login(app.url, STAFF);

  const { body: { slots } } = await call(app.url, '/api/pickup-slots', { cookie: student.cookie });
  assert.equal(slots.length, 5, 'seed creates five upcoming slots');
  const { body: { items } } = await call(app.url, '/api/items');
  const rice = items.find(item => item.name === 'Rice');
  const soup = items.find(item => item.name === 'Canned Soup');

  const booked = await call(app.url, '/api/pickups', {
    method: 'POST',
    cookie: student.cookie,
    headers: XRW,
    body: { slot_id: slots[0].id, items: [{ item_id: rice.id, quantity: 2 }, { item_id: soup.id, quantity: 1 }] }
  });
  assert.equal(booked.status, 201, JSON.stringify(booked.body));
  const pickupId = booked.body.pickup.id;

  const queue = await call(app.url, '/api/staff/pickups', { cookie: staff.cookie });
  assert.ok(queue.body.pickups.some(p => p.id === pickupId));

  const prepared = await call(app.url, `/api/staff/pickups/${pickupId}/prepare`, { method: 'POST', cookie: staff.cookie, headers: XRW });
  assert.equal(prepared.body.pickup.status, 'prepared');
  const completed = await call(app.url, `/api/staff/pickups/${pickupId}/complete`, { method: 'POST', cookie: staff.cookie, headers: XRW });
  assert.equal(completed.body.pickup.status, 'picked_up');

  const notes = await call(app.url, '/api/notifications', { cookie: student.cookie });
  assert.deepEqual(notes.body.notifications.map(n => n.type).sort(), ['ready', 'scheduled']);

  const after = (await call(app.url, '/api/items')).body.items.find(item => item.id === rice.id);
  assert.equal(after.quantity, rice.quantity - 2);
  assert.equal(after.reserved, 0);

  const alerts = await call(app.url, '/api/staff/alerts', { cookie: staff.cookie });
  const lowNames = alerts.body.alerts.map(a => a.item_name);
  assert.ok(lowNames.includes('Canned Soup'), 'seeded low-stock items raise alerts');
  assert.ok(lowNames.includes('Granola Bars'));

  const report = await call(app.url, '/api/staff/reports', { cookie: staff.cookie });
  assert.equal(report.status, 200);
  assert.ok(report.body.report.pickups.status_counts.some(row => row.status === 'picked_up'));
});

test('signing out ends the session', async () => {
  const student = await login(app.url, STUDENT);
  const out = await call(app.url, '/api/auth/logout', { method: 'POST', cookie: student.cookie, headers: XRW });
  assert.equal(out.status, 204);
  assert.equal((await call(app.url, '/api/auth/me', { cookie: student.cookie })).status, 401);
});

test('behind a proxy (TRUST_PROXY=1) the https Origin is accepted', async () => {
  const dir = makeWorkdir();
  const proxied = await bootServer(dir, { TRUST_PROXY: '1' });
  try {
    const host = new URL(proxied.url).host;
    const res = await call(proxied.url, '/api/auth/logout', {
      method: 'POST',
      headers: { ...XRW, Origin: `https://${host}`, 'X-Forwarded-Proto': 'https' }
    });
    assert.equal(res.status, 204);
    assert.ok(existsSync(join(dir, 'data')), 'server creates data/ on first start');
  } finally {
    await proxied.stop();
    rmSync(dir, { recursive: true, force: true });
  }
});
