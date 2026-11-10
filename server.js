import express from 'express';
import { openDatabase } from './src/db.js';
import { authRoutes } from './src/auth/routes.js';

const app = express();

app.use(express.json());

const db = openDatabase();

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes(db));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
