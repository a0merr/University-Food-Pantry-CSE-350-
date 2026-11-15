// Password hashing with scrypt (salted, memory-hard). Plain-text passwords are never stored (NFR1).
// AI-generated (Claude Code) - see docs/AI_USAGE.md
import { scrypt, scryptSync, randomBytes, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';

const KEY_LENGTH = 64;
const PARAMS = { N: 16384, r: 8, p: 1 };
const scryptAsync = promisify(scrypt);

export function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, KEY_LENGTH, PARAMS);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

export function verifyPassword(password, stored) {
  const [algorithm, saltHex, hashHex] = String(stored ?? '').split('$');
  if (algorithm !== 'scrypt' || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const actual = scryptSync(String(password), Buffer.from(saltHex, 'hex'), expected.length, PARAMS);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

// Async versions for request handlers (D-20). scryptSync blocks the whole server while it
// hashes (about 50 ms), so a burst of sign-ins slowed every other request. crypto.scrypt runs
// on libuv's thread pool instead, so other requests keep being answered. Same format and
// parameters as the sync versions, which the seed script and tests still use.
export async function hashPasswordAsync(password) {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, KEY_LENGTH, PARAMS);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

export async function verifyPasswordAsync(password, stored) {
  const [algorithm, saltHex, hashHex] = String(stored ?? '').split('$');
  if (algorithm !== 'scrypt' || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const actual = await scryptAsync(String(password), Buffer.from(saltHex, 'hex'), expected.length, PARAMS);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function sha256(text) {
  return createHash('sha256').update(text).digest('hex');
}

// Used when an email is unknown so a failed login takes the same time either way.
export const DUMMY_HASH = hashPassword('not-a-real-password');
