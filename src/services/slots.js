import { badRequest, conflict, notFound } from '../lib/errors.js';
import { parseLocalIso, toLocalIso, systemClock } from '../lib/time.js';
import { requireId, requireInt } from '../lib/validate.js';

function normalizeStartsAt(value) {
  const parsed = parseLocalIso(value);
  if (!parsed) {
    throw badRequest('Start time must be a valid local date and time.');
  }

  return toLocalIso(parsed);
}

function bookedCount(db, slotId) {
  return db.prepare(`
    SELECT COUNT(*) AS count
    FROM requests
    WHERE slot_id = ?
      AND status IN ('scheduled', 'prepared')
  `).get(slotId).count;
}

export function createSlot(ctx, data) {
  const startsAt = normalizeStartsAt(data.starts_at);
  const capacity = requireInt(data.capacity, 'Capacity', { min: 1, max: 100 });
  const now = (ctx.clock ?? systemClock).now();

  if (parseLocalIso(startsAt) <= now) {
    throw badRequest('Pickup slot must be in the future.');
  }

  try {
    const result = ctx.db.prepare(`
      INSERT INTO pickup_slots (starts_at, capacity)
      VALUES (?, ?)
    `).run(startsAt, capacity);

    return getSlot(ctx, Number(result.lastInsertRowid));
  } catch (err) {
    if (err.code === 'ERR_SQLITE_CONSTRAINT_UNIQUE' || err.message?.includes('UNIQUE constraint failed')) {
      throw conflict('A pickup slot already exists at that time.');
    }
    throw err;
  }
}

export function getSlot(ctx, slotId) {
  const id = requireId(slotId, 'Slot ID');
  const slot = ctx.db.prepare(`
    SELECT
      pickup_slots.id,
      pickup_slots.starts_at,
      pickup_slots.capacity,
      COUNT(requests.id) AS booked,
      pickup_slots.capacity - COUNT(requests.id) AS available
    FROM pickup_slots
    LEFT JOIN requests
      ON requests.slot_id = pickup_slots.id
     AND requests.status IN ('scheduled', 'prepared')
    WHERE pickup_slots.id = ?
    GROUP BY pickup_slots.id
  `).get(id);

  if (!slot) {
    throw notFound('Pickup slot not found.');
  }

  return slot;
}

export function listSlots(ctx, filters = {}) {
  const params = [];
  const where = [];

  if (!filters.include_past) {
    where.push('pickup_slots.starts_at >= ?');
    params.push(toLocalIso((ctx.clock ?? systemClock).now()));
  }

  if (filters.from) {
    where.push('pickup_slots.starts_at >= ?');
    params.push(normalizeStartsAt(filters.from));
  }

  if (filters.to) {
    where.push('pickup_slots.starts_at <= ?');
    params.push(normalizeStartsAt(filters.to));
  }

  return ctx.db.prepare(`
    SELECT
      pickup_slots.id,
      pickup_slots.starts_at,
      pickup_slots.capacity,
      COUNT(requests.id) AS booked,
      pickup_slots.capacity - COUNT(requests.id) AS available
    FROM pickup_slots
    LEFT JOIN requests
      ON requests.slot_id = pickup_slots.id
     AND requests.status IN ('scheduled', 'prepared')
    ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
    GROUP BY pickup_slots.id
    ORDER BY pickup_slots.starts_at
  `).all(...params);
}

export function updateSlot(ctx, slotId, data) {
  const id = requireId(slotId, 'Slot ID');
  const slot = getSlot(ctx, id);
  const startsAt = data.starts_at === undefined
    ? slot.starts_at
    : normalizeStartsAt(data.starts_at);
  const capacity = data.capacity === undefined
    ? slot.capacity
    : requireInt(data.capacity, 'Capacity', { min: 1, max: 100 });

  if (capacity < bookedCount(ctx.db, id)) {
    throw conflict('Capacity cannot be less than scheduled pickups.');
  }

  try {
    ctx.db.prepare(`
      UPDATE pickup_slots
      SET starts_at = ?, capacity = ?
      WHERE id = ?
    `).run(startsAt, capacity, id);
  } catch (err) {
    if (err.code === 'ERR_SQLITE_CONSTRAINT_UNIQUE' || err.message?.includes('UNIQUE constraint failed')) {
      throw conflict('A pickup slot already exists at that time.');
    }
    throw err;
  }

  return getSlot(ctx, id);
}

export function deleteSlot(ctx, slotId) {
  const id = requireId(slotId, 'Slot ID');
  getSlot(ctx, id);

  if (bookedCount(ctx.db, id) > 0) {
    throw conflict('Cannot delete a slot with scheduled pickups.');
  }

  // Picked-up and cancelled requests still point at the slot (foreign key),
  // so deleting it would fail. Keep the slot so pickup history stays intact.
  const history = ctx.db.prepare('SELECT COUNT(*) AS count FROM requests WHERE slot_id = ?').get(id).count;
  if (history > 0) {
    throw conflict('Cannot delete a slot that has past or cancelled pickups.');
  }

  ctx.db.prepare('DELETE FROM pickup_slots WHERE id = ?').run(id);
}
