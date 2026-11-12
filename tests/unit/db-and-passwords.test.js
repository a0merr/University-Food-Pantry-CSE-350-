import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { openDatabase, transaction } from '../../src/db.js';
import { hashPassword, verifyPassword, sha256, DUMMY_HASH } from '../../src/auth/passwords.js';
import { addUser, addItem } from '../helpers.js';

// ---- db.js ----

test('openDatabase creates every table and the default visit limit', () => {
  const db = openDatabase();
  try {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
      .all().map(row => row.name);
    for (const name of [
      'donations', 'email_outbox', 'items', 'low_stock_alerts', 'notifications',
      'pickup_slots', 'request_items', 'requests', 'sessions', 'settings', 'users'
    ]) {
      assert.ok(tables.includes(name), `missing table ${name}`);
    }
    assert.equal(db.prepare("SELECT value FROM settings WHERE key = 'visit_item_limit'").get().value, '8');
    assert.equal(db.prepare('PRAGMA foreign_keys').get().foreign_keys, 1);
  } finally {
    db.close();
  }
});

test('openDatabase on a file uses WAL mode and can be reopened', () => {
  const dir = mkdtempSync(join(tmpdir(), 'pantry-db-'));
  const file = join(dir, 'test.db');
  try {
    const db = openDatabase(file);
    assert.equal(db.prepare('PRAGMA journal_mode').get().journal_mode, 'wal');
    addUser(db, { email: 'persist@example.edu' });
    db.close();

    const reopened = openDatabase(file);
    assert.equal(reopened.prepare('SELECT COUNT(*) AS n FROM users').get().n, 1);
    // Reopening must not duplicate the default setting.
    assert.equal(reopened.prepare('SELECT COUNT(*) AS n FROM settings').get().n, 1);
    reopened.close();
    assert.ok(existsSync(file));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('schema constraints reject invalid data', () => {
  const db = openDatabase();
  try {
    assert.throws(() => db.prepare(`
      INSERT INTO users (email, name, password_hash, role, created_at)
      VALUES ('a@b.edu', 'A', 'h', 'admin', 'now')
    `).run(), /CHECK constraint/);

    addUser(db, { email: 'Same@Example.edu' });
    assert.throws(() => addUser(db, { email: 'same@example.edu' }), /UNIQUE/, 'emails are case-insensitive');

    assert.throws(() => addItem(db, { quantity: -1 }), /CHECK constraint/);
    assert.throws(() => addItem(db, { quantity: 2, reserved: 3 }), /CHECK constraint/);
    assert.throws(() => db.prepare("INSERT INTO pickup_slots (starts_at, capacity) VALUES ('x', 0)").run(), /CHECK/);
    assert.throws(() => db.prepare(`
      INSERT INTO donations (item_id, quantity, received_at) VALUES (9999, 1, 'now')
    `).run(), /FOREIGN KEY/);
  } finally {
    db.close();
  }
});

test('deleting a user cascades to their sessions', () => {
  const db = openDatabase();
  try {
    const userId = addUser(db);
    db.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ('t', ?, 1)").run(userId);
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM sessions').get().n, 0);
  } finally {
    db.close();
  }
});

test('transaction commits on success and returns the result', () => {
  const db = openDatabase();
  try {
    const result = transaction(db, () => {
      addItem(db, { name: 'Pasta' });
      return 'done';
    });
    assert.equal(result, 'done');
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM items').get().n, 1);
  } finally {
    db.close();
  }
});

test('transaction rolls back and rethrows on failure', () => {
  const db = openDatabase();
  try {
    assert.throws(() => transaction(db, () => {
      addItem(db, { name: 'Pasta' });
      throw new Error('boom');
    }), /boom/);
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM items').get().n, 0);
    // The connection is usable again after a rollback.
    transaction(db, () => addItem(db));
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM items').get().n, 1);
  } finally {
    db.close();
  }
});

// ---- passwords.js ----

test('hashPassword produces a salted scrypt hash', () => {
  const a = hashPassword('correct horse');
  const b = hashPassword('correct horse');
  assert.match(a, /^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$/);
  assert.notEqual(a, b, 'each hash has its own salt');
  assert.ok(!a.includes('correct horse'));
});

test('verifyPassword accepts the right password and rejects others', () => {
  const stored = hashPassword('S3cret-pass');
  assert.equal(verifyPassword('S3cret-pass', stored), true);
  assert.equal(verifyPassword('s3cret-pass', stored), false);
  assert.equal(verifyPassword('', stored), false);
});

test('verifyPassword returns false for malformed stored hashes', () => {
  for (const stored of [undefined, null, '', 'plaintext', 'bcrypt$aa$bb', 'scrypt$$', 'scrypt$abcd']) {
    assert.equal(verifyPassword('anything', stored), false);
  }
});

test('DUMMY_HASH is a valid hash that matches no real password', () => {
  assert.match(DUMMY_HASH, /^scrypt\$/);
  assert.equal(verifyPassword('password', DUMMY_HASH), false);
});

test('sha256 returns a stable hex digest', () => {
  assert.equal(sha256('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  assert.equal(sha256('abc'), sha256('abc'));
});
