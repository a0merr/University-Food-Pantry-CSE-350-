import { badRequest, notFound } from '../lib/errors.js';
import { transaction } from '../db.js';
import { toLocalIso, systemClock } from '../lib/time.js';
import { requireInt } from '../lib/validate.js';
export function listItems(ctx) {
  return ctx.db.prepare(`
    SELECT
      id,
      name,
      category,
      dietary_tags,
      quantity,
      reserved,
      quantity - reserved AS available,
      per_visit_limit,
      low_stock_threshold,
      active
    FROM items
    ORDER BY name
  `).all();
}

// FR7 item details (D-17, D-18). Dietary tags are stored lower-case, comma-separated
// ("vegan, gluten-free") and can be sent as a string or an array.
const MAX_TAGS = 10;
const MAX_TAG_LENGTH = 30;

export function normalizeTags(value) {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string' && !Array.isArray(value)) {
    throw badRequest('Dietary tags must be text separated by commas.');
  }
  const list = Array.isArray(value) ? value : value.split(',');
  const tags = [...new Set(list.map(tag => String(tag).trim().toLowerCase()).filter(Boolean))];
  if (tags.length > MAX_TAGS) throw badRequest(`Use ${MAX_TAGS} dietary tags or fewer.`);
  if (tags.some(tag => tag.length > MAX_TAG_LENGTH)) {
    throw badRequest(`Each dietary tag must be ${MAX_TAG_LENGTH} characters or fewer.`);
  }
  return tags.join(', ');
}

function threshold(value) {
  return requireInt(value, 'Low-stock threshold', { min: 0, max: 100000 });
}

/** null or '' means "no per-visit limit". */
function perVisitLimit(value) {
  if (value === null || value === '') return null;
  return requireInt(value, 'Per-visit limit', { min: 1, max: 100 });
}

function itemText(value, label) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (text.length > 100) throw badRequest(`${label} must be 100 characters or fewer.`);
  return text;
}

export function createItem(ctx, data) {
  const name = itemText(data.name, 'Name');
  const category = itemText(data.category, 'Category');
  const quantity = data.quantity ?? 0;

  if (!name || !category) {
    throw badRequest('Name and category are required.');
  }

  if (!Number.isInteger(quantity) || quantity < 0) {
    throw badRequest('Quantity must be a nonnegative integer.');
  }

  const lowStock = data.low_stock_threshold === undefined ? 0 : threshold(data.low_stock_threshold);
  const limit = data.per_visit_limit === undefined ? null : perVisitLimit(data.per_visit_limit);
  const tags = normalizeTags(data.dietary_tags);

const now = toLocalIso((ctx.clock ?? systemClock).now());

  const result = ctx.db.prepare(`
    INSERT INTO items
    (name, category, quantity, low_stock_threshold, per_visit_limit, dietary_tags, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, category, quantity, lowStock, limit, tags, now, now);

  return ctx.db.prepare(
    'SELECT * FROM items WHERE id = ?'
  ).get(result.lastInsertRowid);
}
export function recordDonation(ctx, data) {
  const itemId = data.item_id;
  const quantity = data.quantity;

  if (!Number.isInteger(itemId) || itemId <= 0) {
    throw badRequest('Invalid item ID.');
  }

  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw badRequest('Donation quantity must be positive.');
  }

  return transaction(ctx.db, () => {
    const item = ctx.db.prepare(
      'SELECT * FROM items WHERE id = ?'
    ).get(itemId);

    if (!item) {
      throw notFound('Food item not found.');
    }

const now = toLocalIso((ctx.clock ?? systemClock).now());

    ctx.db.prepare(`
      INSERT INTO donations
      (item_id, quantity, source, logged_by, received_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      itemId,
      quantity,
      data.source ?? '',
      data.logged_by ?? null,
      now
    );

    ctx.db.prepare(`
      UPDATE items
      SET quantity = quantity + ?, updated_at = ?
      WHERE id = ?
    `).run(quantity, now, itemId);

    return ctx.db.prepare(
      'SELECT * FROM items WHERE id = ?'
    ).get(itemId);
  });
}
/**
 * Changes any of an item's details. Only the fields that are sent change.
 * `active: false` retires an item: students no longer see it and it cannot be
 * requested, but open pickups that already include it are unaffected (D-19).
 */
export function updateItem(ctx, itemId, data = {}) {
  const item = ctx.db.prepare(
    'SELECT * FROM items WHERE id = ?'
  ).get(itemId);

  if (!item) {
    throw notFound('Food item not found.');
  }

  const changes = {};

  if (data.name !== undefined) {
    changes.name = itemText(data.name, 'Name');
    if (!changes.name) throw badRequest('Name is required.');
  }

  if (data.category !== undefined) {
    changes.category = itemText(data.category, 'Category');
    if (!changes.category) throw badRequest('Category is required.');
  }

  if (data.quantity !== undefined) {
    const quantity = data.quantity;

    if (!Number.isInteger(quantity) || quantity < 0) {
      throw badRequest('Quantity must be a nonnegative integer.');
    }

    if (quantity < item.reserved) {
      throw badRequest('Quantity cannot be less than reserved inventory.');
    }

    changes.quantity = quantity;
  }

  if (data.low_stock_threshold !== undefined) changes.low_stock_threshold = threshold(data.low_stock_threshold);
  if (data.per_visit_limit !== undefined) changes.per_visit_limit = perVisitLimit(data.per_visit_limit);
  if (data.dietary_tags !== undefined) changes.dietary_tags = normalizeTags(data.dietary_tags);

  if (data.active !== undefined) {
    if (![true, false, 0, 1].includes(data.active)) throw badRequest('Active must be true or false.');
    changes.active = data.active ? 1 : 0;
  }

  const columns = Object.keys(changes);
  if (!columns.length) {
    throw badRequest('Nothing to update.');
  }

const now = toLocalIso((ctx.clock ?? systemClock).now());

  // Column names come from the fixed list above, never from the request.
  ctx.db.prepare(`
    UPDATE items
    SET ${columns.map(column => `${column} = ?`).join(', ')}, updated_at = ?
    WHERE id = ?
  `).run(...columns.map(column => changes[column]), now, itemId);

  return ctx.db.prepare(
    'SELECT * FROM items WHERE id = ?'
  ).get(itemId);
}
