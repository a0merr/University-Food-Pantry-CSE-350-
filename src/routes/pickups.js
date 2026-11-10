import { Router } from 'express';
import { sha256 } from '../auth/passwords.js';
import { badRequest, forbidden, unauthorized } from '../lib/errors.js';
import { checkLowStock } from '../services/alerts.js';
import { cancel, getPickup, schedule } from '../services/pickups.js';
import { listSlots } from '../services/slots.js';
import { listNotifications, markRead, notifyCancelled, notifyScheduled } from '../services/notifications.js';

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

function requireUser(db) {
  return (req, res, next) => {
    const user = currentUser(db, req);
    if (!user) return next(unauthorized());
    req.user = user;
    next();
  };
}

function requireStudent(req, res, next) {
  if (req.user.role !== 'student') return next(forbidden());
  next();
}

function parseId(value, label) {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw badRequest(`Invalid ${label}.`);
  }
  return id;
}

export function pickupRoutes(db) {
  const router = Router();
  const requireSignedIn = requireUser(db);

  router.get('/pickup-slots', requireSignedIn, (req, res) => {
    res.json({ slots: listSlots({ db }) });
  });

  router.post('/pickups', requireSignedIn, requireStudent, (req, res) => {
    const pickup = schedule({ db }, req.user.id, req.body ?? {});
    notifyScheduled({ db }, pickup);
    checkLowStock({ db });
    res.status(201).json({ pickup });
  });

  router.get('/pickups/:id', requireSignedIn, (req, res) => {
    const pickup = getPickup({ db }, parseId(req.params.id, 'pickup request ID'));
    if (req.user.role !== 'staff' && pickup.student_id !== req.user.id) {
      throw forbidden('You cannot view this pickup.');
    }
    res.json({ pickup });
  });

  router.post('/pickups/:id/cancel', requireSignedIn, (req, res) => {
    const pickup = cancel(
      { db },
      parseId(req.params.id, 'pickup request ID'),
      { user_id: req.user.id, role: req.user.role }
    );
    notifyCancelled({ db }, pickup);
    res.json({ pickup });
  });

  router.get('/notifications', requireSignedIn, (req, res) => {
    res.json({
      notifications: listNotifications(
        { db },
        req.user.id,
        { unread_only: req.query.unread === 'true' }
      )
    });
  });

  router.patch('/notifications/:id/read', requireSignedIn, (req, res) => {
    const notification = markRead(
      { db },
      req.user.id,
      parseId(req.params.id, 'notification ID')
    );
    res.json({ notification });
  });

  return router;
}
