// Starts the real server.js (and optionally the seed script) in a throwaway
// folder, so tests never touch the project's own data/pantry.db.
// Used by the integration, browser (Playwright) and load tests.
import { spawn, spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, rmSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SERVER = join(ROOT, 'server.js');
const SEED = join(ROOT, 'scripts', 'seed.js');

// Demo accounts created by scripts/seed.js.
export const STAFF = { email: 'staff@pantry.demo', password: 'StaffDemo123!' };
export const STUDENT = { email: 'student1@pantry.demo', password: 'StudentDemo123!' };

export function freePort() {
  return new Promise((done, fail) => {
    const probe = createServer();
    probe.once('error', fail);
    probe.listen(0, '127.0.0.1', () => {
      const { port } = probe.address();
      probe.close(() => done(port));
    });
  });
}

/** A temp folder holding a copy of public/, ready to run server.js in. */
export function makeWorkdir() {
  const dir = mkdtempSync(join(tmpdir(), 'pantry-server-'));
  cpSync(join(ROOT, 'public'), join(dir, 'public'), { recursive: true });
  return dir;
}

export function removeWorkdir(dir) {
  rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}

/** Runs scripts/seed.js --reset in `cwd`. Returns the spawnSync result. */
export function runSeed(cwd) {
  return spawnSync(process.execPath, ['--no-warnings', SEED, '--reset'], { cwd, encoding: 'utf8' });
}

/** Starts server.js in `cwd`. Resolves once it is listening. */
export async function bootServer(cwd, env = {}, port) {
  const listenPort = port ?? await freePort();
  const child = spawn(process.execPath, ['--no-warnings', SERVER], {
    cwd,
    env: { ...process.env, PORT: String(listenPort), RENDER: '', TRUST_PROXY: '', ...env },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let output = '';
  await new Promise((ready, fail) => {
    const timer = setTimeout(() => fail(new Error(`server did not start:\n${output}`)), 15_000);
    child.stdout.on('data', (chunk) => {
      output += chunk;
      if (output.includes('Server running')) {
        clearTimeout(timer);
        ready();
      }
    });
    child.stderr.on('data', (chunk) => { output += chunk; });
    child.once('exit', (code) => {
      clearTimeout(timer);
      fail(new Error(`server exited with ${code}:\n${output}`));
    });
  });
  return {
    port: listenPort,
    url: `http://127.0.0.1:${listenPort}`,
    output: () => output,
    stop: () => new Promise((done) => {
      child.removeAllListeners('exit');
      if (child.exitCode !== null) return done();
      child.once('exit', done);
      child.kill();
    })
  };
}
