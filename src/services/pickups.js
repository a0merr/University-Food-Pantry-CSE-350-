import { badRequest, conflict, forbidden, notFound } from '../lib/errors.js';
import { transaction } from '../db.js';
import { parseLocalIso, toLocalIso, systemClock } from '../lib/time.js';
import { requireId, requireInt } from '../lib/validate.js';

const OPEN_STATUSES = ['submitted', 'scheduled', 'prepared'];

function nowIso(ctx) {
  return toLocalIso((ctx.clock ?? systemClock).now());
}

function visitItemLimit(db) {
  const row = db.prepare("SELECT value FROM settings WHERE key = 'visit_item_limit'").get();
  return Number(row?.value ?? 8);
}

function statusParams(statuses) {
  return statuses.map(() => '?').join(', ');
}

function loadRequest(db, requestId) {
  return db.prepare(`
    SELECT
      requests.*,
      users.name AS student_name,
      users.email AS student_email,
      pickup_slots.starts_at,
      pickup_slots.capacity
    FROM requests
    JOIN users ON users.id = requests.student_id
    LEFT JOIN pickup_slots ON pickup_slots.id = requests.slot_id
    WHERE requests.id = ?
  `).get(requestId);
}

function loadRequestItems(db, requestId) {
  return db.prepare(`
    SELECT
      request_items.item_id,
      items.name,
      items.category,
      request_items.quantity
    FROM request_items
    JOIN items ON items.id = request_items.item_id
    WHERE request_items.request_id = ?
    ORDER BY items.name
  `).all(requestId);
}

function hydrateRequest(db, request) {
  return request ? { ...request, items: loadRequestItems(db, request.id) } : null;
}

function assertRequesterCanCancel(request, actor = {}) {
  if (actor.role === 'staff') return;
  if (actor.user_id === request.student_id || actor.userId === request.student_id) return;
  throw forbidden('You cannot cancel this pickup.');
}

function normalizeItems(db, items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw badRequest('Choose at least one pantry item.');
  }

  const limit = visitItemLimit(db);
  if (items.length > limit) {
    throw badRequest(`Choose ${limit} items or fewer per visit.`);
  }

  const normalized = new Map();

  for (const item of items) {
    const itemId = requireId(item.item_id, 'Item ID');
    const quantity = requireInt(item.quantity, 'Quantity', { min: 1, max: 100 });

    if (normalized.has(itemId)) {
      throw badRequest('Each item can only appear once in a pickup.');
    }

    const pantryItem = db.prepare(`
      SELECT
        id,
        name,
        active,
        quantity,
        reserved,
        quantity - reserved AS available,
        per_visit_limit
      FROM items
      WHERE id = ?
    `).get(itemId);

    if (!pantryItem || pantryItem.active !== 1) {
      throw notFound('Pantry item not found.');
    }

    if (pantryItem.per_visit_limit !== null && quantity > pantryItem.per_visit_limit) {
      throw badRequest(`${pantryItem.name} is limited to ${pantryItem.per_visit_limit} per visit.`);
    }

    if (quantity > pantryItem.available) {
      throw conflict(`${pantryItem.name} does not have enough available stock.`);
    }

    normalized.set(itemId, { item_id: itemId, quantity });
  }

  return [...normalized.values()];
}

export function getPickup(ctx, requestId) {
  const id = requireId(requestId, 'Pickup request ID');
  const request = loadRequest(ctx.db, id);

  if (!request) {
    throw notFound('Pickup request not found.');
  }

  return hydrateRequest(ctx.db, request);
}

export function schedule(ctx, studentId, data) {
  const cleanStudentId = requireId(studentId, 'Student ID');
  const slotId = requireId(data.slot_id, 'Pickup slot ID');

  return transaction(ctx.db, () => {
    const student = ctx.db.prepare(`
      SELECT id, role
      FROM users
      WHERE id = ?
    `).get(cleanStudentId);

    if (!student || student.role !== 'student') {
      throw notFound('Student not found.');
    }

    const open = ctx.db.prepare(`
      SELECT id
      FROM requests
      WHERE student_id = ?
        AND status IN (${statusParams(OPEN_STATUSES)})
    `).get(cleanStudentId, ...OPEN_STATUSES);

    if (open) {
      throw conflict('You already have an open pickup request.');
    }

    const slot = ctx.db.prepare(`
      SELECT
        pickup_slots.id,
        pickup_slots.starts_at,
        pickup_slots.capacity,
        COUNT(requests.id) AS booked
      FROM pickup_slots
      LEFT JOIN requests
        ON requests.slot_id = pickup_slots.id
       AND requests.status IN ('scheduled', 'prepared')
      WHERE pickup_slots.id = ?
      GROUP BY pickup_slots.id
    `).get(slotId);

    if (!slot) {
      throw notFound('Pickup slot not found.');
    }

    if (parseLocalIso(slot.starts_at) <= (ctx.clock ?? systemClock).now()) {
      throw badRequest('Pickup slot must be in the future.');
    }

    if (slot.booked >= slot.capacity) {
      throw conflict('Pickup slot is full.');
    }

    const items = normalizeItems(ctx.db, data.items);
    const now = nowIso(ctx);
    const result = ctx.db.prepare(`
      INSERT INTO requests (student_id, status, slot_id, created_at)
      VALUES (?, 'scheduled', ?, ?)
    `).run(cleanStudentId, slotId, now);
    const requestId = Number(result.lastInsertRowid);

    for (const item of items) {
      ctx.db.prepare(`
        INSERT INTO request_items (request_id, item_id, quantity)
        VALUES (?, ?, ?)
      `).run(requestId, item.item_id, item.quantity);

      ctx.db.prepare(`
        UPDATE items
        SET reserved = reserved + ?, updated_at = ?
        WHERE id = ?
      `).run(item.quantity, now, item.item_id);
    }

    return getPickup(ctx, requestId);
  });
}

export function cancel(ctx, requestId, actor = {}) {
  const id = requireId(requestId, 'Pickup request ID');

  return transaction(ctx.db, () => {
    const request = loadRequest(ctx.db, id);
    if (!request) {
      throw notFound('Pickup request not found.');
    }

    assertRequesterCanCancel(request, actor);

    if (!OPEN_STATUSES.includes(request.status)) {
      throw conflict('Only open pickup requests can be cancelled.');
    }

    const now = nowIso(ctx);
    const items = loadRequestItems(ctx.db, id);

    for (const item of items) {
      ctx.db.prepare(`
        UPDATE items
        SET reserved = reserved - ?, updated_at = ?
        WHERE id = ?
      `).run(item.quantity, now, item.item_id);
    }

    ctx.db.prepare(`
      UPDATE requests
      SET status = 'cancelled', cancelled_at = ?
      WHERE id = ?
    `).run(now, id);

    return getPickup(ctx, id);
  });
}

export function queue(ctx, filters = {}) {
  const statuses = filters.status
    ? [String(filters.status)]
    : ['scheduled', 'prepared'];
  const params = [...statuses];
  const where = [`requests.status IN (${statusParams(statuses)})`];

  if (filters.date) {
    where.push('pickup_slots.starts_at >= ? AND pickup_slots.starts_at <= ?');
    params.push(`${filters.date}T00:00:00`, `${filters.date}T23:59:59`);
  }

  const requests = ctx.db.prepare(`
    SELECT
      requests.*,
      users.name AS student_name,
      users.email AS student_email,
      pickup_slots.starts_at
    FROM requests
    JOIN users ON users.id = requests.student_id
    LEFT JOIN pickup_slots ON pickup_slots.id = requests.slot_id
    WHERE ${where.join(' AND ')}
    ORDER BY pickup_slots.starts_at, requests.created_at
  `).all(...params);

  return requests.map((request) => hydrateRequest(ctx.db, request));
}

export function prepare(ctx, requestId) {
  const id = requireId(requestId, 'Pickup request ID');

  return transaction(ctx.db, () => {
    const request = loadRequest(ctx.db, id);
    if (!request) {
      throw notFound('Pickup request not found.');
    }

    if (request.status !== 'scheduled') {
      throw conflict('Only scheduled pickup requests can be prepared.');
    }

    ctx.db.prepare(`
      UPDATE requests
      SET status = 'prepared', prepared_at = ?
      WHERE id = ?
    `).run(nowIso(ctx), id);

    return getPickup(ctx, id);
  });
}

export function complete(ctx, requestId) {
  const id = requireId(requestId, 'Pickup request ID');

  return transaction(ctx.db, () => {
    const request = loadRequest(ctx.db, id);
    if (!request) {
      throw notFound('Pickup request not found.');
    }

    if (request.status !== 'prepared') {
      throw conflict('Only prepared pickup requests can be completed.');
    }

    const now = nowIso(ctx);
    const items = loadRequestItems(ctx.db, id);

    for (const item of items) {
      ctx.db.prepare(`
        UPDATE items
        SET quantity = quantity - ?,
            reserved = reserved - ?,
            updated_at = ?
        WHERE id = ?
      `).run(item.quantity, item.quantity, now, item.item_id);
    }

    ctx.db.prepare(`
      UPDATE requests
      SET status = 'picked_up', picked_up_at = ?
      WHERE id = ?
    `).run(now, id);

    return getPickup(ctx, id);
  });
}
