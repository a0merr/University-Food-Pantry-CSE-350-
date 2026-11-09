// SQLite database (Node's built-in node:sqlite driver, no native build step).
// AI-generated (Claude Code) - see docs/AI_USAGE.md
import { DatabaseSync } from 'node:sqlite';

export const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name          TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('student', 'staff')),
  created_at    TEXT NOT NULL
);

-- Only a SHA-256 hash of each session token is stored (NFR1).
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);

-- quantity = units on the shelf; reserved = units held for open requests.
-- Students see quantity - reserved.
CREATE TABLE IF NOT EXISTS items (
  id                  INTEGER PRIMARY KEY,
  name                TEXT NOT NULL,
  category            TEXT NOT NULL,
  dietary_tags        TEXT NOT NULL DEFAULT '',
  quantity            INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  reserved            INTEGER NOT NULL DEFAULT 0 CHECK (reserved >= 0),
  per_visit_limit     INTEGER CHECK (per_visit_limit IS NULL OR per_visit_limit > 0),
  low_stock_threshold INTEGER NOT NULL DEFAULT 0 CHECK (low_stock_threshold >= 0),
  active              INTEGER NOT NULL DEFAULT 1,
  created_at          TEXT NOT NULL,
  updated_at          TEXT NOT NULL,
  CHECK (reserved <= quantity)
);

CREATE TABLE IF NOT EXISTS donations (
  id          INTEGER PRIMARY KEY,
  item_id     INTEGER NOT NULL REFERENCES items(id),
  quantity    INTEGER NOT NULL CHECK (quantity > 0),
  source      TEXT NOT NULL DEFAULT '',
  logged_by   INTEGER REFERENCES users(id),
  received_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pickup_slots (
  id        INTEGER PRIMARY KEY,
  starts_at TEXT NOT NULL UNIQUE,
  capacity  INTEGER NOT NULL CHECK (capacity > 0)
);

CREATE TABLE IF NOT EXISTS requests (
  id            INTEGER PRIMARY KEY,
  student_id    INTEGER NOT NULL REFERENCES users(id),
  status        TEXT NOT NULL CHECK (status IN ('submitted', 'scheduled', 'prepared', 'picked_up', 'cancelled')),
  slot_id       INTEGER REFERENCES pickup_slots(id),
  reminder_sent INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL,
  prepared_at   TEXT,
  picked_up_at  TEXT,
  cancelled_at  TEXT
);
CREATE INDEX IF NOT EXISTS idx_requests_student ON requests(student_id, status);
CREATE INDEX IF NOT EXISTS idx_requests_slot ON requests(slot_id, status);

CREATE TABLE IF NOT EXISTS request_items (
  request_id INTEGER NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  item_id    INTEGER NOT NULL REFERENCES items(id),
  quantity   INTEGER NOT NULL CHECK (quantity > 0),
  PRIMARY KEY (request_id, item_id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id         INTEGER PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_id INTEGER REFERENCES requests(id),
  type       TEXT NOT NULL CHECK (type IN ('scheduled', 'ready', 'reminder', 'cancelled')),
  message    TEXT NOT NULL,
  created_at TEXT NOT NULL,
  read_at    TEXT
);

-- Development email provider: messages land here instead of an SMTP server.
CREATE TABLE IF NOT EXISTS email_outbox (
  id         INTEGER PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject    TEXT NOT NULL,
  body       TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS low_stock_alerts (
  id          INTEGER PRIMARY KEY,
  item_id     INTEGER NOT NULL REFERENCES items(id),
  available   INTEGER NOT NULL,
  threshold   INTEGER NOT NULL,
  created_at  TEXT NOT NULL,
  resolved_at TEXT
);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
INSERT OR IGNORE INTO settings (key, value) VALUES ('visit_item_limit', '8');
`;

export function openDatabase(file = ':memory:') {
  const db = new DatabaseSync(file);
  db.exec('PRAGMA foreign_keys = ON;');
  if (file !== ':memory:') db.exec('PRAGMA journal_mode = WAL;');
  db.exec(SCHEMA);
  return db;
}

/** Runs fn inside a transaction; rolls back if it throws. */
export function transaction(db, fn) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}
