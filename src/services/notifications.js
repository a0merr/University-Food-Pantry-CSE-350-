import { forbidden, notFound } from '../lib/errors.js';
import { transaction } from '../db.js';
import { formatSlot, toLocalIso, systemClock } from '../lib/time.js';
import { requireId } from '../lib/validate.js';

function nowIso(ctx) {
  return toLocalIso((ctx.clock ?? systemClock).now());
}

function insertOutbox(ctx, { user_id, subject, body }) {
  ctx.db.prepare(`
    INSERT INTO email_outbox (user_id, subject, body, created_at)
    VALUES (?, ?, ?, ?)
  `).run(user_id, subject, body, nowIso(ctx));
}

export function createNotification(ctx, data) {
  const userId = requireId(data.user_id, 'User ID');
  const requestId = data.request_id == null ? null : requireId(data.request_id, 'Pickup request ID');
  const type = String(data.type ?? '');
  const message = String(data.message ?? '').trim();

  if (!['scheduled', 'ready', 'reminder', 'cancelled'].includes(type)) {
    throw new Error('Unsupported notification type.');
  }

  if (!message) {
    throw new Error('Notification message is required.');
  }

  return transaction(ctx.db, () => {
    const result = ctx.db.prepare(`
      INSERT INTO notifications (user_id, request_id, type, message, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, requestId, type, message, nowIso(ctx));

    if (data.subject || data.email_body) {
      insertOutbox(ctx, {
        user_id: userId,
        subject: data.subject ?? 'Campus Food Pantry update',
        body: data.email_body ?? message
      });
    }

    return ctx.db.prepare('SELECT * FROM notifications WHERE id = ?')
      .get(Number(result.lastInsertRowid));
  });
}

export function listNotifications(ctx, userId, filters = {}) {
  const cleanUserId = requireId(userId, 'User ID');
  const where = ['user_id = ?'];
  const params = [cleanUserId];

  if (filters.unread_only) {
    where.push('read_at IS NULL');
  }

  return ctx.db.prepare(`
    SELECT *
    FROM notifications
    WHERE ${where.join(' AND ')}
    ORDER BY created_at DESC, id DESC
  `).all(...params);
}

export function markRead(ctx, userId, notificationId) {
  const cleanUserId = requireId(userId, 'User ID');
  const cleanNotificationId = requireId(notificationId, 'Notification ID');
  const notification = ctx.db.prepare(`
    SELECT *
    FROM notifications
    WHERE id = ?
  `).get(cleanNotificationId);

  if (!notification) {
    throw notFound('Notification not found.');
  }

  if (notification.user_id !== cleanUserId) {
    throw forbidden('You cannot update this notification.');
  }

  ctx.db.prepare(`
    UPDATE notifications
    SET read_at = COALESCE(read_at, ?)
    WHERE id = ?
  `).run(nowIso(ctx), cleanNotificationId);

  return ctx.db.prepare('SELECT * FROM notifications WHERE id = ?')
    .get(cleanNotificationId);
}

export function notifyScheduled(ctx, pickup) {
  return createNotification(ctx, {
    user_id: pickup.student_id,
    request_id: pickup.id,
    type: 'scheduled',
    message: `Your pantry pickup is scheduled for ${formatSlot(pickup.starts_at)}.`,
    subject: 'Pickup scheduled',
    email_body: `Your pantry pickup is scheduled for ${formatSlot(pickup.starts_at)}.`
  });
}

export function notifyReady(ctx, pickup) {
  return createNotification(ctx, {
    user_id: pickup.student_id,
    request_id: pickup.id,
    type: 'ready',
    message: 'Your pantry pickup is ready.',
    subject: 'Pickup ready',
    email_body: 'Your pantry pickup is ready.'
  });
}

export function notifyCancelled(ctx, pickup) {
  return createNotification(ctx, {
    user_id: pickup.student_id,
    request_id: pickup.id,
    type: 'cancelled',
    message: 'Your pantry pickup was cancelled.',
    subject: 'Pickup cancelled',
    email_body: 'Your pantry pickup was cancelled.'
  });
}
