// Web server for the Playwright tests. Seeds a fresh database in a throwaway
// folder and runs server.js in this same process, so the project's own
// data/pantry.db is never reset and stopping this process stops the server.
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { ROOT, makeWorkdir, removeWorkdir, runSeed } from '../server-harness.js';

const dir = makeWorkdir();
const seed = runSeed(dir);
if (seed.status !== 0) {
  console.error(seed.stderr);
  process.exit(1);
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => process.exit(0));
}
process.on('exit', () => {
  try { removeWorkdir(dir); } catch { /* the OS cleans temp eventually */ }
});

process.chdir(dir);
await import(pathToFileURL(join(ROOT, 'server.js')).href);
