import { badRequest, notFound } from '../lib/errors.js';
import { transaction } from '../db.js';
import { toLocalIso, systemClock } from '../lib/time.js';
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
export function createItem(ctx, data) {
  const name = data.name?.trim();
  const category = data.category?.trim();
  const quantity = data.quantity ?? 0;

  if (!name || !category) {
    throw badRequest('Name and category are required.');
  }

  if (!Number.isInteger(quantity) || quantity < 0) {
    throw badRequest('Quantity must be a nonnegative integer.');
  }

const now = toLocalIso((ctx.clock ?? systemClock).now());

  const result = ctx.db.prepare(`
    INSERT INTO items (name, category, quantity, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(name, category, quantity, now, now);

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
export function updateItem(ctx, itemId, data) {
  const item = ctx.db.prepare(
    'SELECT * FROM items WHERE id = ?'
  ).get(itemId);

  if (!item) {
    throw notFound('Food item not found.');
  }

  const quantity = data.quantity;

  if (!Number.isInteger(quantity) || quantity < 0) {
    throw badRequest('Quantity must be a nonnegative integer.');
  }

  if (quantity < item.reserved) {
    throw badRequest('Quantity cannot be less than reserved inventory.');
  }

const now = toLocalIso((ctx.clock ?? systemClock).now());

  ctx.db.prepare(`
    UPDATE items
    SET quantity = ?, updated_at = ?
    WHERE id = ?
  `).run(quantity, now, itemId);

  return ctx.db.prepare(
    'SELECT * FROM items WHERE id = ?'
  ).get(itemId);
}
