import { parseLocalDate } from '../lib/time.js';
import { badRequest } from '../lib/errors.js';

function normalizeDate(value, label) {
  if (!value) return null;
  if (!parseLocalDate(value)) {
    throw badRequest(`${label} must be a valid date.`);
  }
  return String(value);
}

function dateFilters(filters = {}) {
  const from = normalizeDate(filters.from, 'From date');
  const to = normalizeDate(filters.to, 'To date');
  const where = [];
  const params = [];

  if (from) {
    where.push('requests.created_at >= ?');
    params.push(`${from}T00:00:00`);
  }

  if (to) {
    where.push('requests.created_at <= ?');
    params.push(`${to}T23:59:59`);
  }

  return { where, params };
}

export function pickupReport(ctx, filters = {}) {
  const { where, params } = dateFilters(filters);
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const statusCounts = ctx.db.prepare(`
    SELECT status, COUNT(*) AS count
    FROM requests
    ${whereSql}
    GROUP BY status
    ORDER BY status
  `).all(...params);

  const dailyPickups = ctx.db.prepare(`
    SELECT substr(created_at, 1, 10) AS day, COUNT(*) AS count
    FROM requests
    ${whereSql}
    GROUP BY day
    ORDER BY day
  `).all(...params);

  const itemTotals = ctx.db.prepare(`
    SELECT
      items.id AS item_id,
      items.name,
      SUM(request_items.quantity) AS quantity
    FROM request_items
    JOIN requests ON requests.id = request_items.request_id
    JOIN items ON items.id = request_items.item_id
    ${whereSql}
    GROUP BY items.id
    ORDER BY quantity DESC, items.name
    LIMIT 10
  `).all(...params);

  return {
    status_counts: statusCounts,
    daily_pickups: dailyPickups,
    top_items: itemTotals
  };
}

export function inventoryReport(ctx) {
  const summary = ctx.db.prepare(`
    SELECT
      COUNT(*) AS active_items,
      COALESCE(SUM(quantity), 0) AS total_quantity,
      COALESCE(SUM(reserved), 0) AS total_reserved,
      COALESCE(SUM(quantity - reserved), 0) AS total_available,
      SUM(CASE WHEN quantity - reserved <= low_stock_threshold THEN 1 ELSE 0 END) AS low_stock_items
    FROM items
    WHERE active = 1
  `).get();

  const categories = ctx.db.prepare(`
    SELECT
      category,
      COUNT(*) AS item_count,
      COALESCE(SUM(quantity - reserved), 0) AS available
    FROM items
    WHERE active = 1
    GROUP BY category
    ORDER BY category
  `).all();

  return {
    summary,
    categories
  };
}

export function staffReport(ctx, filters = {}) {
  return {
    pickups: pickupReport(ctx, filters),
    inventory: inventoryReport(ctx)
  };
}
