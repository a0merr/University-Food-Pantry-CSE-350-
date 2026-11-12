// Load test (npm run test:perf). Seeds a throwaway copy of the site, then
// hits the main endpoints with autocannon and checks each against a target.
//
// The project has no written performance requirement, so the targets below
// are QA-chosen for a small campus pantry. Tune them with the team:
//   - no connection errors, timeouts or unexpected status codes
//   - p99 latency under 500 ms for reads and staff actions
//   - p99 latency under 2000 ms for sign-in (scrypt hashing is deliberately slow)
//
// Options (environment variables):
//   LOAD_DURATION     seconds per scenario (default 5)
//   LOAD_CONNECTIONS  concurrent users for read scenarios (default 50)
//   LOAD_STRICT=1     also fail on known issues (sign-ins blocking other requests)
import autocannon from 'autocannon';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { ROOT, STAFF, bootServer, makeWorkdir, removeWorkdir, runSeed } from '../server-harness.js';

const DURATION = Number(process.env.LOAD_DURATION ?? 5);
const CONNECTIONS = Number(process.env.LOAD_CONNECTIONS ?? 50);
const XRW = { 'X-Requested-With': 'fetch' };

async function login(url, account) {
  const res = await fetch(`${url}/api/auth/login`, {
    method: 'POST',
    headers: { ...XRW, 'Content-Type': 'application/json' },
    body: JSON.stringify(account)
  });
  if (res.status !== 200) throw new Error(`login failed: ${res.status} ${await res.text()}`);
  return /session=[^;]+/.exec(res.headers.get('set-cookie'))[0];
}

function run(opts) {
  return new Promise((resolve, reject) => {
    autocannon({ duration: DURATION, ...opts }, (err, result) => (err ? reject(err) : resolve(result)));
  });
}

const workdir = makeWorkdir();
const seed = runSeed(workdir);
if (seed.status !== 0) {
  console.error(seed.stderr);
  process.exit(1);
}
const server = await bootServer(workdir);
let failed = false;

try {
  const staffCookie = await login(server.url, STAFF);
  const staffHeaders = { Cookie: staffCookie };

  const scenarios = [
    { name: 'Health check', path: '/api/health', connections: CONNECTIONS, p99: 500 },
    { name: 'Browse items (public)', path: '/api/items', connections: CONNECTIONS, p99: 500 },
    { name: 'Static sign-in page', path: '/', connections: CONNECTIONS, p99: 500 },
    { name: 'Staff pickup queue', path: '/api/staff/pickups', headers: staffHeaders, connections: CONNECTIONS, p99: 500 },
    { name: 'Staff pickup slots', path: '/api/staff/slots', headers: staffHeaders, connections: CONNECTIONS, p99: 500 },
    { name: 'Staff usage report', path: '/api/staff/reports', headers: staffHeaders, connections: CONNECTIONS, p99: 500 },
    {
      name: 'Staff low-stock check (write)',
      path: '/api/staff/alerts/check',
      method: 'POST',
      headers: { ...staffHeaders, ...XRW },
      connections: Math.min(CONNECTIONS, 20),
      p99: 500
    },
    {
      name: 'Sign in (scrypt)',
      path: '/api/auth/login',
      method: 'POST',
      headers: { ...XRW, 'Content-Type': 'application/json' },
      body: JSON.stringify(STAFF),
      connections: 10,
      p99: 2000
    }
  ];

  const rows = [];
  for (const s of scenarios) {
    const result = await run({
      url: `${server.url}${s.path}`,
      method: s.method ?? 'GET',
      headers: s.headers,
      body: s.body,
      connections: s.connections
    });
    const problems = [];
    if (result.errors) problems.push(`${result.errors} errors`);
    if (result.timeouts) problems.push(`${result.timeouts} timeouts`);
    if (result.non2xx) problems.push(`${result.non2xx} non-2xx`);
    if (result.latency.p99 > s.p99) problems.push(`p99 ${result.latency.p99}ms > ${s.p99}ms`);
    if (problems.length) failed = true;
    rows.push({
      scenario: s.name,
      users: s.connections,
      'req/s': Math.round(result.requests.average),
      'p50 ms': result.latency.p50,
      'p99 ms': result.latency.p99,
      'max ms': result.latency.max,
      requests: result.requests.total,
      result: problems.length ? `FAIL: ${problems.join(', ')}` : 'pass'
    });
    console.log(`${problems.length ? 'FAIL' : 'pass'}  ${s.name}`);
  }

  // Mixed: students browse while a burst of people sign in at the same time.
  // scryptSync blocks the event loop, so this shows how much sign-ins slow everyone else.
  {
    const [browse, signIns] = await Promise.all([
      run({ url: `${server.url}/api/items`, connections: CONNECTIONS }),
      run({
        url: `${server.url}/api/auth/login`,
        method: 'POST',
        headers: { ...XRW, 'Content-Type': 'application/json' },
        body: JSON.stringify(STAFF),
        connections: 10
      })
    ]);
    const limit = 500;
    const problems = [];
    if (browse.errors || browse.timeouts || browse.non2xx) problems.push('errors while browsing');
    if (browse.latency.p99 > limit) problems.push(`browse p99 ${browse.latency.p99}ms > ${limit}ms`);
    // Known issue: src/auth/passwords.js uses scryptSync, which blocks every other
    // request while it hashes. Reported, not failed, unless LOAD_STRICT=1.
    const known = problems.length > 0 && !process.env.LOAD_STRICT;
    if (problems.length && !known) failed = true;
    rows.push({
      scenario: 'Browse items during 10 sign-ins at once',
      users: CONNECTIONS + 10,
      'req/s': Math.round(browse.requests.average),
      'p50 ms': browse.latency.p50,
      'p99 ms': browse.latency.p99,
      'max ms': browse.latency.max,
      requests: browse.requests.total + signIns.requests.total,
      result: problems.length ? `${known ? 'KNOWN ISSUE' : 'FAIL'}: ${problems.join(', ')}` : 'pass'
    });
    console.log(`${problems.length ? (known ? 'KNOWN' : 'FAIL') : 'pass'}  Browse items during 10 sign-ins at once`);
  }

  console.log(`\nLoad test: ${DURATION}s per scenario\n`);
  console.table(rows);

  const outDir = join(ROOT, 'test-results');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'load-test.json'), JSON.stringify({
    date: new Date().toISOString(),
    node: process.version,
    duration_seconds: DURATION,
    scenarios: rows
  }, null, 2));
  console.log('Results saved to test-results/load-test.json');
} catch (err) {
  console.error(err);
  failed = true;
} finally {
  await server.stop();
  removeWorkdir(workdir);
}

process.exit(failed ? 1 : 0);
