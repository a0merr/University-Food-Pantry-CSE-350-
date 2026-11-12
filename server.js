import express from 'express';
import { mkdirSync } from 'node:fs';
import { openDatabase } from './src/db.js';
import { authRoutes } from './src/auth/routes.js';
import { inventoryRoutes } from './src/routes/inventory.js';
import { pickupRoutes } from './src/routes/pickups.js';
import { staffRoutes } from './src/routes/staff.js';
import { sendDueReminders } from './src/services/reminders.js';

// Pickup times are stored as local time, so the server must run in the pantry's
// time zone. Hosts like Render default to UTC, which put "is this pickup in the
// future?", reminders and report dates 5 hours off. Set TZ to override.
process.env.TZ ??= 'America/New_York';

const app = express();

// Render (and most hosts) end HTTPS at a proxy and forward plain HTTP. Trusting
// that one proxy hop makes req.protocol "https" and req.ip the real client, so
// the Origin check below and the login rate limit work in production. Render
// sets RENDER automatically; set TRUST_PROXY=1 on other hosts.
if (process.env.RENDER || process.env.TRUST_PROXY) {
  app.set('trust proxy', 1);
}

app.use(express.json());
app.use(express.static('public'));

// A fresh clone has no data/ folder, and SQLite cannot create it.
mkdirSync('data', { recursive: true });
const db = openDatabase('data/pantry.db');

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const origin = req.get('Origin');

  if (origin) {
    try {
      const expectedOrigin = new URL(
        `${req.protocol}://${req.get('host')}`
      ).origin;

      if (new URL(origin).origin !== expectedOrigin) {
        return res.status(403).json({
          error: { message: 'Request origin not allowed.' }
        });
      }
    } catch {
      return res.status(403).json({
        error: { message: 'Invalid request origin.' }
      });
    }
  }

  if (req.get('X-Requested-With') !== 'fetch') {
    return res.status(403).json({
      error: { message: 'Missing security header.' }
    });
  }

  next();
});

app.use('/api/auth', authRoutes(db));
app.use('/api', inventoryRoutes(db));
app.use('/api', pickupRoutes(db));
app.use('/api', staffRoutes(db));

// Unknown API routes get a JSON error like every other API answer, not Express's HTML page.
app.use('/api', (req, res) => {
  res.status(404).json({ error: { code: 'not_found', message: 'Not found.' } });
});

app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: { code: 'bad_request', message: 'Request body is not valid JSON.' }
    });
  }

  // Other request-body errors (e.g. "entity.too.large" over 100 KB) carry a 4xx status.
  if (err.type && err.status >= 400 && err.status < 500) {
    return res.status(err.status).json({
      error: { code: 'bad_request', message: err.status === 413 ? 'Request body is too large.' : 'Bad request.' }
    });
  }

  if (err.status && err.code) {
    return res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message
      }
    });
  }

  console.error(err);

  res.status(500).json({
    error: {
      code: 'internal_error',
      message: 'Internal server error.'
    }
  });
});
const PORT = process.env.PORT || 3000;
const REMINDER_INTERVAL_MS = 60 * 60 * 1000;

function runReminders() {
  try {
    sendDueReminders({ db });
  } catch (err) {
    console.error('Reminder job failed:', err);
  }
}

// Run once at startup too, so reminders don't wait an hour after a restart.
runReminders();
setInterval(runReminders, REMINDER_INTERVAL_MS).unref();

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
