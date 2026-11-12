import test from 'node:test';
import assert from 'node:assert/strict';

import { openDatabase } from '../../src/db.js';
import { authRoutes } from '../../src/auth/routes.js';
import { hashPassword, sha256 } from '../../src/auth/passwords.js';
import { addUser, appWith, start, call } from '../helpers.js';

// One server for the file. The login rate limiter is module state keyed by IP,
// so the rate-limit test runs last.
const db = openDatabase();
const { server, url } = await start(appWith([['/api/auth', authRoutes(db)]]));
test.after(() => {
  server.close();
  db.close();
});

const staffHash = hashPassword('StaffPass123');
addUser(db, { role: 'staff', email: 'staff@pantry.edu', name: 'Pantry Staff', passwordHash: staffHash });

function sessionCookie(res) {
  const header = res.headers.get('set-cookie') ?? '';
  const match = /session=([^;]*)/.exec(header);
  return match ? match[1] : null;
}

test('register creates a student, hashes the password and starts a session', async () => {
  const res = await call(url, '/api/auth/register', {
    method: 'POST',
    body: { name: '  Ada Student ', email: ' Ada@Example.EDU ', password: 'longenough' }
  });

  assert.equal(res.status, 201);
  assert.deepEqual(Object.keys(res.body.user).sort(), ['email', 'id', 'name', 'role']);
  assert.equal(res.body.user.name, 'Ada Student');
  assert.equal(res.body.user.email, 'ada@example.edu');
  assert.equal(res.body.user.role, 'student');

  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(res.body.user.id);
  assert.match(row.password_hash, /^scrypt\$/);
  assert.notEqual(row.password_hash, 'longenough');

  const header = res.headers.get('set-cookie');
  assert.match(header, /HttpOnly/i);
  assert.match(header, /SameSite=Lax/i);
  const token = sessionCookie(res);
  assert.ok(token && token.length === 64);
  const session = db.prepare('SELECT * FROM sessions WHERE token_hash = ?').get(sha256(token));
  assert.equal(session.user_id, res.body.user.id, 'only the token hash is stored');
});

test('register cannot be used to create a staff account', async () => {
  const res = await call(url, '/api/auth/register', {
    method: 'POST',
    body: { name: 'Sneaky', email: 'sneaky@example.edu', password: 'longenough', role: 'staff' }
  });
  assert.equal(res.status, 201);
  assert.equal(res.body.user.role, 'student');
});

test('register validates required fields and password length', async () => {
  for (const body of [
    {},
    { name: '', email: 'a@b.edu', password: 'longenough' },
    { name: 'A', email: '   ', password: 'longenough' },
    { name: 'A', email: 'a@b.edu', password: 'short' },
    { name: 'A', email: 'a@b.edu', password: 12345678 }
  ]) {
    const res = await call(url, '/api/auth/register', { method: 'POST', body });
    assert.equal(res.status, 400, JSON.stringify(body));
    assert.match(res.body.error.message, /at least 8 characters/);
  }
});

test('register rejects badly formed emails', async () => {
  for (const email of ['no-at-sign', 'a@b', 'a b@c.edu', '@c.edu']) {
    const res = await call(url, '/api/auth/register', {
      method: 'POST',
      body: { name: 'A', email, password: 'longenough' }
    });
    assert.equal(res.status, 400, email);
    assert.equal(res.body.error.message, 'Enter a valid email address.');
  }
});

test('register rejects overly long fields', async () => {
  const cases = [
    { name: 'x'.repeat(201), email: 'long1@example.edu', password: 'longenough' },
    { name: 'A', email: `${'x'.repeat(250)}@example.edu`, password: 'longenough' },
    { name: 'A', email: 'long3@example.edu', password: 'x'.repeat(1025) }
  ];
  for (const body of cases) {
    const res = await call(url, '/api/auth/register', { method: 'POST', body });
    assert.equal(res.status, 400);
    assert.equal(res.body.error.message, 'One or more fields are too long.');
  }
});

test('register rejects a duplicate email regardless of case', async () => {
  const res = await call(url, '/api/auth/register', {
    method: 'POST',
    body: { name: 'Again', email: 'STAFF@pantry.edu', password: 'longenough' }
  });
  assert.equal(res.status, 409);
  assert.match(res.body.error.message, /already exists/);
});

test('login with correct credentials returns the user and a session cookie', async () => {
  const res = await call(url, '/api/auth/login', {
    method: 'POST',
    body: { email: ' Staff@Pantry.edu ', password: 'StaffPass123' }
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.user.role, 'staff');
  assert.equal(res.body.user.name, 'Pantry Staff');
  assert.equal(res.body.user.password_hash, undefined, 'hash is never returned');
  assert.ok(sessionCookie(res));
});

test('login rejects a wrong password and an unknown email with the same message', async () => {
  const wrong = await call(url, '/api/auth/login', {
    method: 'POST', body: { email: 'staff@pantry.edu', password: 'nope-nope' }
  });
  const unknown = await call(url, '/api/auth/login', {
    method: 'POST', body: { email: 'ghost@pantry.edu', password: 'nope-nope' }
  });
  assert.equal(wrong.status, 401);
  assert.equal(unknown.status, 401);
  assert.equal(wrong.body.error.message, 'Incorrect email or password.');
  assert.equal(unknown.body.error.message, wrong.body.error.message);

  // A successful login clears the failure count for this IP.
  const ok = await call(url, '/api/auth/login', {
    method: 'POST', body: { email: 'staff@pantry.edu', password: 'StaffPass123' }
  });
  assert.equal(ok.status, 200);
});

test('login validates the body shape', async () => {
  for (const body of [{}, { email: 'a@b.edu' }, { email: 5, password: 'x' }, { email: 'a@b.edu', password: 'x'.repeat(1025) }]) {
    const res = await call(url, '/api/auth/login', { method: 'POST', body });
    assert.equal(res.status, 400);
    assert.equal(res.body.error.message, 'Email and password are required.');
  }
});

test('me returns the signed-in user for a valid session', async () => {
  const login = await call(url, '/api/auth/login', {
    method: 'POST', body: { email: 'staff@pantry.edu', password: 'StaffPass123' }
  });
  const token = sessionCookie(login);
  const me = await call(url, '/api/auth/me', { cookie: `other=1; session=${token}` });
  assert.equal(me.status, 200);
  assert.deepEqual(me.body.user, {
    id: login.body.user.id,
    name: 'Pantry Staff',
    email: 'staff@pantry.edu',
    role: 'staff'
  });
});

test('me rejects missing, unknown and expired sessions', async () => {
  const none = await call(url, '/api/auth/me');
  assert.equal(none.status, 401);
  assert.equal(none.body.error.message, 'Please sign in.');

  const bogus = await call(url, '/api/auth/me', { cookie: 'session=not-a-real-token' });
  assert.equal(bogus.status, 401);
  assert.equal(bogus.body.error.message, 'Session expired or invalid.');

  const userId = addUser(db, { email: 'expired@example.edu' });
  db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)')
    .run(sha256('expired-token'), userId, Date.now() - 1000);
  const expired = await call(url, '/api/auth/me', { cookie: 'session=expired-token' });
  assert.equal(expired.status, 401);
});

test('logout deletes the session and clears the cookie', async () => {
  const login = await call(url, '/api/auth/login', {
    method: 'POST', body: { email: 'staff@pantry.edu', password: 'StaffPass123' }
  });
  const token = sessionCookie(login);

  const out = await call(url, '/api/auth/logout', { method: 'POST', cookie: `session=${token}` });
  assert.equal(out.status, 204);
  assert.match(out.headers.get('set-cookie'), /session=;/);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM sessions WHERE token_hash = ?').get(sha256(token)).n, 0);

  const me = await call(url, '/api/auth/me', { cookie: `session=${token}` });
  assert.equal(me.status, 401);
});

test('logout without a session still succeeds', async () => {
  const out = await call(url, '/api/auth/logout', { method: 'POST' });
  assert.equal(out.status, 204);
});

test('login is rate limited after 5 failed attempts (runs last)', async () => {
  for (let i = 0; i < 5; i += 1) {
    const res = await call(url, '/api/auth/login', {
      method: 'POST', body: { email: 'staff@pantry.edu', password: `wrong-${i}` }
    });
    assert.equal(res.status, 401);
  }

  // Even the right password is refused while the limit is in effect.
  const blocked = await call(url, '/api/auth/login', {
    method: 'POST', body: { email: 'staff@pantry.edu', password: 'StaffPass123' }
  });
  assert.equal(blocked.status, 429);
  assert.match(blocked.body.error.message, /Too many login attempts/);
});
