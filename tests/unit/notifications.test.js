import test from 'node:test';
import assert from 'node:assert/strict';

import { openDatabase } from '../../src/db.js';
import {
  createNotification,
  listNotifications,
  markRead
} from '../../src/services/notifications.js';

const clock = { now: () => new Date(2026, 10, 10, 9, 0, 0) };

function addUser(db, email = 'student@example.edu') {
  return Number(db.prepare(`
    INSERT INTO users (email, name, password_hash, role, created_at)
    VALUES (?, 'Student', 'hash', 'student', '2026-11-10T09:00:00')
  `).run(email).lastInsertRowid);
}

test('createNotification stores an in-app notification and email outbox row', () => {
  const db = openDatabase();

  try {
    const userId = addUser(db);
    const notification = createNotification(
      { db, clock },
      {
        user_id: userId,
        type: 'scheduled',
        message: 'Pickup scheduled.',
        subject: 'Pickup scheduled',
        email_body: 'Pickup scheduled.'
      }
    );

    const outbox = db.prepare('SELECT * FROM email_outbox WHERE user_id = ?').all(userId);

    assert.equal(notification.user_id, userId);
    assert.equal(notification.type, 'scheduled');
    assert.equal(outbox.length, 1);
    assert.equal(outbox[0].subject, 'Pickup scheduled');
  } finally {
    db.close();
  }
});

test('listNotifications can return unread notifications only', () => {
  const db = openDatabase();

  try {
    const userId = addUser(db);
    const notification = createNotification(
      { db, clock },
      { user_id: userId, type: 'ready', message: 'Ready.' }
    );
    markRead({ db, clock }, userId, notification.id);
    createNotification(
      { db, clock },
      { user_id: userId, type: 'reminder', message: 'Reminder.' }
    );

    assert.equal(listNotifications({ db }, userId).length, 2);
    assert.equal(listNotifications({ db }, userId, { unread_only: true }).length, 1);
  } finally {
    db.close();
  }
});

test('markRead rejects notifications owned by another user', () => {
  const db = openDatabase();

  try {
    const ownerId = addUser(db);
    const otherId = addUser(db, 'other@example.edu');
    const notification = createNotification(
      { db, clock },
      { user_id: ownerId, type: 'ready', message: 'Ready.' }
    );

    assert.throws(
      () => markRead({ db, clock }, otherId, notification.id),
      /cannot update/
    );
  } finally {
    db.close();
  }
});
