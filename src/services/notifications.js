// FR6: notifications. Every message is stored in `notifications` (shown in the app)
// and `email_outbox` (the development email provider). A real SMTP sender can later
// read the outbox without changing any caller.
const { fail } = require('../lib/compat');

const DEFAULT_LEAD_MINUTES = 60;

/** Stores one notification plus its email. Does not open a transaction, so callers can wrap it. */
function notify(db, userId, type, message, clock, { requestId = null, subject = `Pantry: ${type}` } = {}) {
  const now = clock.now();
  db.prepare('INSERT INTO notifications(user_id,request_id,type,message,created_at) VALUES(?,?,?,?,?)').run(userId, requestId, type, message, now);
  const user = db.prepare('SELECT email FROM users WHERE id=?').get(userId);
  if (user) db.prepare('INSERT INTO email_outbox(user_id,email,subject,body,created_at) VALUES(?,?,?,?,?)').run(userId, user.email, subject, message, now);
}

function list(db, userId, { unreadOnly = false, limit = 50 } = {}) {
  const rows = db
    .prepare(
      `SELECT id, request_id, type, message, read, created_at
         FROM notifications
        WHERE user_id = ? ${unreadOnly ? 'AND read = 0' : ''}
        ORDER BY created_at DESC, id DESC
        LIMIT ?`,
    )
    .all(userId, Math.min(Math.max(Number(limit) || 50, 1), 200));
  return rows.map((r) => ({ id: r.id, requestId: r.request_id, type: r.type, message: r.message, read: r.read === 1, createdAt: r.created_at }));
}

function unreadCount(db, userId) {
  return db.prepare('SELECT COUNT(*) AS n FROM notifications WHERE user_id=? AND read=0').get(userId).n;
}

/** Marks one of the user's own notifications as read. Other people's IDs look like "not found". */
function markRead(db, nId, userId) {
  const result = db.prepare('UPDATE notifications SET read=1 WHERE id=? AND user_id=?').run(nId, userId);
  if (result.changes === 0) fail(404, 'not_found', 'Notification not found');
  return { ok: true };
}

function markAllRead(db, userId) {
  return { updated: db.prepare('UPDATE notifications SET read=1 WHERE user_id=? AND read=0').run(userId).changes };
}

/**
 * Sends one reminder to every student whose pickup starts within `leadMinutes`
 * and who has not been reminded yet. Safe to call as often as you like.
 * Returns how many reminders were sent.
 */
function sendDueReminders(db, clock, { leadMinutes = DEFAULT_LEAD_MINUTES } = {}) {
  const now = clock.now();
  const until = now + leadMinutes * 60 * 1000;
  return db.transaction(() => {
    const due = db
      .prepare(
        `SELECT r.id, r.student_id, s.starts_at
           FROM requests r
           JOIN slots s ON s.id = r.slot_id
          WHERE r.status IN ('scheduled', 'prepared')
            AND r.reminder_sent = 0
            AND s.starts_at > ? AND s.starts_at <= ?`,
      )
      .all(now, until);
    let sent = 0;
    for (const row of due) {
      // The flag is flipped first, so two overlapping runs cannot both send.
      const claimed = db.prepare('UPDATE requests SET reminder_sent=1 WHERE id=? AND reminder_sent=0').run(row.id);
      if (claimed.changes === 0) continue;
      notify(db, row.student_id, 'reminder', `Reminder: your pantry pickup is at ${new Date(row.starts_at).toLocaleString()}.`, clock, {
        requestId: row.id,
        subject: 'Pantry pickup reminder',
      });
      sent += 1;
    }
    return sent;
  });
}

module.exports = { notify, list, unreadCount, markRead, markAllRead, sendDueReminders, DEFAULT_LEAD_MINUTES };
