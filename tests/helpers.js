// Shared helpers for unit and integration tests.
import express from 'express';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

import { sha256 } from '../src/auth/passwords.js';

export const FUTURE = '2099-11-10T14:00:00';

/** A clock frozen at the given local ISO time. */
export function fixedClock(iso = '2026-11-10T09:00:00') {
  return { now: () => new Date(iso) };
}

let userCounter = 0;

export function addUser(db, { role = 'student', email, name = 'Test User', passwordHash = 'hash' } = {}) {
  userCounter += 1;
  const address = email ?? `${role}${userCounter}@example.edu`;
  return Number(db.prepare(`
    INSERT INTO users (email, name, password_hash, role, created_at)
    VALUES (?, ?, ?, ?, '2026-11-10T09:00:00')
  `).run(address, name, passwordHash, role).lastInsertRowid);
}

/** Creates a user plus a live session; returns { userId, token, cookie }. */
export function addUserSession(db, opts = {}) {
  const userId = addUser(db, opts);
  const token = `token-${userId}-${Math.random().toString(36).slice(2)}`;
  db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)')
    .run(sha256(token), userId, opts.expiresAt ?? Date.now() + 60_000);
  return { userId, token, cookie: `session=${token}` };
}

export function addItem(db, {
  name = 'Rice',
  category = 'Grains',
  quantity = 10,
  reserved = 0,
  threshold = 0,
  perVisitLimit = null,
  active = 1
} = {}) {
  return Number(db.prepare(`
    INSERT INTO items (name, category, quantity, reserved, low_stock_threshold, per_visit_limit, active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, '2026-11-10T09:00:00', '2026-11-10T09:00:00')
  `).run(name, category, quantity, reserved, threshold, perVisitLimit, active).lastInsertRowid);
}

export function addSlot(db, startsAt = FUTURE, capacity = 2) {
  return Number(db.prepare('INSERT INTO pickup_slots (starts_at, capacity) VALUES (?, ?)')
    .run(startsAt, capacity).lastInsertRowid);
}

/** Express app with the given routers mounted the way server.js mounts them. */
export function appWith(mounts) {
  const app = express();
  app.use(express.json());
  for (const [path, router] of mounts) app.use(path, router);
  app.use((err, req, res, next) => {
    if (err.status && err.code) {
      return res.status(err.status).json({ error: { code: err.code, message: err.message } });
    }
    res.status(500).json({ error: { code: 'internal_error', message: err.message } });
  });
  return app;
}

export function start(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => {
      resolve({ server, url: `http://127.0.0.1:${server.address().port}` });
    });
  });
}

/** fetch wrapper: JSON body in, { status, body, headers } out. */
export async function call(url, path, { method = 'GET', cookie, body, headers = {} } = {}) {
  const res = await fetch(`${url}${path}`, {
    method,
    headers: {
      ...(cookie ? { Cookie: cookie } : {}),
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...headers
    },
    body: body === undefined ? undefined : (typeof body === 'string' ? body : JSON.stringify(body))
  });
  const text = await res.text();
  let parsed = null;
  try { parsed = text ? JSON.parse(text) : null; } catch { parsed = text; }
  return { status: res.status, body: parsed, headers: res.headers };
}

/**
 * Loads an HTML page from public/ into jsdom and installs its window globals so
 * the page modules in public/js can be imported and run in this process.
 * `fetchImpl(path, init)` stands in for the server.
 */
export function installDom(htmlFile, fetchImpl) {
  const source = htmlFile.trimStart().startsWith('<') ? htmlFile : readFileSync(`public/${htmlFile}`, 'utf8');
  const html = source
    // Page scripts are imported by the test, not run by jsdom.
    .replace(/<script[\s\S]*?<\/script>/g, '');
  const dom = new JSDOM(html, { url: 'http://localhost/' });
  const { window } = dom;
  const assigned = [];
  const location = { assign: (to) => assigned.push(to) };
  const fakeWindow = new Proxy(window, {
    get(target, prop) {
      if (prop === 'location') return location;
      const value = Reflect.get(target, prop);
      return typeof value === 'function' ? value.bind(target) : value;
    }
  });

  const calls = [];
  const globals = {
    window: fakeWindow,
    document: window.document,
    Node: window.Node,
    HTMLElement: window.HTMLElement,
    FormData: window.FormData,
    Event: window.Event,
    fetch: async (path, init = {}) => {
      calls.push({ path, ...init, body: init.body ? JSON.parse(init.body) : undefined });
      return fetchImpl(path, init);
    }
  };
  const saved = {};
  for (const [key, value] of Object.entries(globals)) {
    saved[key] = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
  }

  return {
    window,
    document: window.document,
    calls,
    assigned,
    restore() {
      for (const [key, desc] of Object.entries(saved)) {
        if (desc) Object.defineProperty(globalThis, key, desc);
        else delete globalThis[key];
      }
      window.close();
    }
  };
}

/** A Response-like object for fake fetch implementations. */
export function jsonResponse(status, body) {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

/** Lets pending promise callbacks (fetch → render) finish. */
export async function flush(rounds = 5) {
  for (let i = 0; i < rounds; i += 1) {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

/** Builds a fetch stand-in from a { 'METHOD /path': body | (init) => [status, body] } table. */
export function fakeServer(routes) {
  return async (path, init = {}) => {
    const key = `${init.method ?? 'GET'} ${path}`;
    if (!(key in routes)) return jsonResponse(404, { error: { message: `No fake route for ${key}` } });
    const handler = routes[key];
    const result = typeof handler === 'function' ? handler(init) : handler;
    const [status, body] = Array.isArray(result) ? result : [200, result];
    return jsonResponse(status, body);
  };
}

let importCounter = 0;
/** Imports a page script fresh (runs its top-level code again). */
export function importPage(file) {
  importCounter += 1;
  return import(new URL(`../public/js/${file}?run=${importCounter}`, import.meta.url));
}
