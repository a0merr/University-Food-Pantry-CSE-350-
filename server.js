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
