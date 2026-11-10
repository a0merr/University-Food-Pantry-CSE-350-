import { formatSlot, toLocalIso, systemClock } from '../lib/time.js';
import { createNotification } from './notifications.js';

const DEFAULT_LOOKAHEAD_HOURS = 24;

function addHours(date, hours) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

export function sendDueReminders(ctx, options = {}) {
  const now = (ctx.clock ?? systemClock).now();
  const startsBefore = addHours(now, options.lookahead_hours ?? DEFAULT_LOOKAHEAD_HOURS);
  const nowText = toLocalIso(now);
  const beforeText = toLocalIso(startsBefore);

  const pickups = ctx.db.prepare(`
    SELECT
      requests.id,
      requests.student_id,
      pickup_slots.starts_at
    FROM requests
    JOIN pickup_slots ON pickup_slots.id = requests.slot_id
    WHERE requests.status IN ('scheduled', 'prepared')
      AND requests.reminder_sent = 0
      AND pickup_slots.starts_at > ?
      AND pickup_slots.starts_at <= ?
    ORDER BY pickup_slots.starts_at
  `).all(nowText, beforeText);

  for (const pickup of pickups) {
    createNotification(ctx, {
      user_id: pickup.student_id,
      request_id: pickup.id,
      type: 'reminder',
      message: `Reminder: your pantry pickup is ${formatSlot(pickup.starts_at)}.`,
      subject: 'Pickup reminder',
      email_body: `Reminder: your pantry pickup is ${formatSlot(pickup.starts_at)}.`
    });

    ctx.db.prepare(`
      UPDATE requests
      SET reminder_sent = 1
      WHERE id = ?
    `).run(pickup.id);
  }

  return { sent: pickups.length };
}
