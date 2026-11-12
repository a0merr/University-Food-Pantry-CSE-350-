// Kept for existing callers (server.js, tests). The reminder logic now lives in
// notifications.js so the message can name the pickup time and link the request.
const notifications = require('./notifications');

function sendDueReminders(db, clock, windowMs = notifications.DEFAULT_LEAD_MINUTES * 60 * 1000) {
  return notifications.sendDueReminders(db, clock, { leadMinutes: windowMs / 60000 });
}

module.exports = { sendDueReminders };
