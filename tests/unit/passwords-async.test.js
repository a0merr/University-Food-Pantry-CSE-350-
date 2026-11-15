// D-20: login hashes passwords with async crypto.scrypt so a burst of sign-ins does not
// block other requests. The async helpers must stay compatible with the sync ones.
// AI-generated (Claude Code) - see docs/AI_USAGE.md
import test from 'node:test';
import assert from 'node:assert/strict';

import { hashPassword, verifyPassword, hashPasswordAsync, verifyPasswordAsync, DUMMY_HASH } from '../../src/auth/passwords.js';

test('hashPasswordAsync makes a salted scrypt hash the sync helper can check', async () => {
  const a = await hashPasswordAsync('correct horse');
  const b = await hashPasswordAsync('correct horse');
  assert.match(a, /^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$/);
  assert.notEqual(a, b, 'a new salt every time');
  assert.equal(verifyPassword('correct horse', a), true);
});

test('verifyPasswordAsync accepts hashes from either helper and rejects wrong passwords', async () => {
  const sync = hashPassword('pantry-pass');
  assert.equal(await verifyPasswordAsync('pantry-pass', sync), true);
  assert.equal(await verifyPasswordAsync('wrong', sync), false);
  assert.equal(await verifyPasswordAsync('anything', DUMMY_HASH), false);
});

test('verifyPasswordAsync returns false for malformed stored hashes', async () => {
  for (const stored of [undefined, null, '', 'plain', 'md5$aa$bb', 'scrypt$$']) {
    assert.equal(await verifyPasswordAsync('x', stored), false, String(stored));
  }
});

test('hashing does not block the event loop', async () => {
  let ticks = 0;
  const timer = setInterval(() => { ticks += 1; }, 1);
  await Promise.all(Array.from({ length: 6 }, () => hashPasswordAsync('busy')));
  clearInterval(timer);
  assert.ok(ticks > 0, 'timers kept running while six hashes were computed');
});

test('two sign-ups for the same email at once: one account, the other gets 409, never a 500', async () => {
  const { openDatabase } = await import('../../src/db.js');
  const { authRoutes } = await import('../../src/auth/routes.js');
  const { appWith, start, call } = await import('../helpers.js');
  const db = openDatabase();
  const { server, url } = await start(appWith([['/api/auth', authRoutes(db)]]));
  try {
    const body = { name: 'Twin', email: 'twin@example.edu', password: 'long-enough-1' };
    // Both pass the first "email taken?" check, then hash at the same time; the re-check after
    // hashing stops the second insert.
    const results = await Promise.all([
      call(url, '/api/auth/register', { method: 'POST', body }),
      call(url, '/api/auth/register', { method: 'POST', body })
    ]);
    assert.deepEqual(results.map(r => r.status).sort(), [201, 409]);
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM users WHERE email = ?').get('twin@example.edu').n, 1);
  } finally {
    server.close();
    db.close();
  }
});
