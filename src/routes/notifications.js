const express = require('express'), s = require('../services/notifications');
module.exports = ({ db, a }) => {
  const r = express.Router();
  r.get('/notifications', a.requireUser, (req, res) =>
    res.json({ items: s.list(db, req.user.id, { unreadOnly: req.query.unread === '1', limit: req.query.limit }), unread: s.unreadCount(db, req.user.id) }),
  );
  r.post('/notifications/read-all', a.requireUser, (req, res) => res.json(s.markAllRead(db, req.user.id)));
  r.post('/notifications/:id/read', a.requireUser, (req, res) => res.json(s.markRead(db, req.params.id, req.user.id)));
  return r;
};
