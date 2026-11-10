import { Router } from 'express';
import { sha256 } from '../auth/passwords.js';
import { badRequest, forbidden, unauthorized } from '../lib/errors.js';
import { checkLowStock, listOpenAlerts } from '../services/alerts.js';
import { complete, prepare, queue } from '../services/pickups.js';
import { createSlot, deleteSlot, listSlots, updateSlot } from '../services/slots.js';
import { notifyReady } from '../services/notifications.js';

function currentUser(db, req) {
  const cookie = req.headers.cookie
    ?.split(';')
    .map(part => part.trim())
    .find(part => part.startsWith('session='));

  if (!cookie) return null;

  const token = cookie.slice('session='.length);

  return db.prepare(`
    SELECT users.id, users.name, users.email, users.role
    FROM sessions
    JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = ?
      AND sessions.expires_at > ?
  `).get(sha256(token), Date.now());
}

function requireStaff(db) {
  return (req, res, next) => {
    const user = currentUser(db, req);
    if (!user) return next(unauthorized());
    if (user.role !== 'staff') return next(forbidden());
    req.user = user;
    next();
  };
}

function parseId(value, label) {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw badRequest(`Invalid ${label}.`);
  }
  return id;
}

export function staffRoutes(db) {
  const router = Router();
  const staffOnly = requireStaff(db);

  router.get('/staff/pickups', staffOnly, (req, res) => {
    res.json({ pickups: queue({ db }, req.query) });
  });

  router.post('/staff/pickups/:id/prepare', staffOnly, (req, res) => {
    const pickup = prepare({ db }, parseId(req.params.id, 'pickup request ID'));
    notifyReady({ db }, pickup);
    res.json({ pickup });
  });

  router.post('/staff/pickups/:id/complete', staffOnly, (req, res) => {
    const pickup = complete({ db }, parseId(req.params.id, 'pickup request ID'));
    res.json({ pickup });
  });

  router.get('/staff/slots', staffOnly, (req, res) => {
    res.json({ slots: listSlots({ db }, { ...req.query, include_past: req.query.include_past === 'true' }) });
  });

  router.post('/staff/slots', staffOnly, (req, res) => {
    const slot = createSlot({ db }, req.body ?? {});
    res.status(201).json({ slot });
  });

  router.patch('/staff/slots/:id', staffOnly, (req, res) => {
    const slot = updateSlot({ db }, parseId(req.params.id, 'slot ID'), req.body ?? {});
    res.json({ slot });
  });

  router.delete('/staff/slots/:id', staffOnly, (req, res) => {
    deleteSlot({ db }, parseId(req.params.id, 'slot ID'));
    res.status(204).end();
  });

  router.post('/staff/alerts/check', staffOnly, (req, res) => {
    res.json(checkLowStock({ db }));
  });

  router.get('/staff/alerts', staffOnly, (req, res) => {
    res.json({ alerts: listOpenAlerts({ db }) });
  });

  return router;
}
