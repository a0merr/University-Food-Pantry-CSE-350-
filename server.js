import express from 'express';
import { openDatabase } from './src/db.js';
import { authRoutes } from './src/auth/routes.js';
import { inventoryRoutes } from './src/routes/inventory.js';
import { pickupRoutes } from './src/routes/pickups.js';
import { staffRoutes } from './src/routes/staff.js';
import { sendDueReminders } from './src/services/reminders.js';

const app = express();

app.use(express.json());

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
app.use((err, req, res, next) => {
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

setInterval(() => {
  try {
    sendDueReminders({ db });
  } catch (err) {
    console.error('Reminder job failed:', err);
  }
}, REMINDER_INTERVAL_MS).unref();

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
