import { Router } from 'express';
import { sha256 } from '../auth/passwords.js';
import { unauthorized, forbidden, badRequest } from '../lib/errors.js';
import {
  listItems,
  createItem,
  updateItem,
  recordDonation
} from '../services/inventory.js';

export function inventoryRoutes(db) {
  const router = Router();

  function requireStaff(req, res, next) {
    const cookie = req.headers.cookie
      ?.split(';')
      .map(part => part.trim())
      .find(part => part.startsWith('session='));

    if (!cookie) {
      return next(unauthorized());
    }

    const token = cookie.slice('session='.length);

    const user = db.prepare(`
      SELECT users.id, users.role
      FROM sessions
      JOIN users ON users.id = sessions.user_id
      WHERE sessions.token_hash = ?
        AND sessions.expires_at > ?
    `).get(sha256(token), Date.now());

    if (!user) {
      return next(unauthorized());
    }

    if (user.role !== 'staff') {
      return next(forbidden());
    }

    req.user = user;
    next();
  }

  router.get('/items', (req, res) => {
    res.json({ items: listItems({ db }) });
  });

  router.post('/items', requireStaff, (req, res) => {
    const item = createItem({ db }, req.body ?? {});
    res.status(201).json({ item });
  });

  router.patch('/items/:id', requireStaff, (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      throw badRequest('Invalid item ID.');
    }

    const item = updateItem({ db }, id, req.body ?? {});
    res.json({ item });
  });

  router.post('/donations', requireStaff, (req, res) => {
    const item = recordDonation({ db }, {
      ...req.body,
      logged_by: req.user.id
    });

    res.status(201).json({ item });
  });

  return router;
}
