import express from 'express';
import { openDatabase } from './src/db.js';
import { authRoutes } from './src/auth/routes.js';
import { inventoryRoutes } from './src/routes/inventory.js';

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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
