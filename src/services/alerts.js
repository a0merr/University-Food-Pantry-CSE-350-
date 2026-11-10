import { transaction } from '../db.js';
import { toLocalIso, systemClock } from '../lib/time.js';

function nowIso(ctx) {
  return toLocalIso((ctx.clock ?? systemClock).now());
}

export function checkLowStock(ctx) {
  const now = nowIso(ctx);

  return transaction(ctx.db, () => {
    const lowItems = ctx.db.prepare(`
      SELECT
        id,
        quantity - reserved AS available,
        low_stock_threshold AS threshold
      FROM items
      WHERE active = 1
        AND quantity - reserved <= low_stock_threshold
    `).all();

    const opened = [];

    for (const item of lowItems) {
      const existing = ctx.db.prepare(`
        SELECT id
        FROM low_stock_alerts
        WHERE item_id = ?
          AND resolved_at IS NULL
      `).get(item.id);

      if (existing) {
        ctx.db.prepare(`
          UPDATE low_stock_alerts
          SET available = ?, threshold = ?
          WHERE id = ?
        `).run(item.available, item.threshold, existing.id);
        continue;
      }

      const result = ctx.db.prepare(`
        INSERT INTO low_stock_alerts (item_id, available, threshold, created_at)
        VALUES (?, ?, ?, ?)
      `).run(item.id, item.available, item.threshold, now);

      opened.push(Number(result.lastInsertRowid));
    }

    const resolved = ctx.db.prepare(`
      UPDATE low_stock_alerts
      SET resolved_at = ?
      WHERE resolved_at IS NULL
        AND item_id IN (
          SELECT id
          FROM items
          WHERE active = 0
             OR quantity - reserved > low_stock_threshold
        )
    `).run(now);

    return {
      opened: opened.length,
      resolved: resolved.changes
    };
  });
}

export function listOpenAlerts(ctx) {
  return ctx.db.prepare(`
    SELECT
      low_stock_alerts.id,
      low_stock_alerts.item_id,
      items.name AS item_name,
      items.category,
      low_stock_alerts.available,
      low_stock_alerts.threshold,
      low_stock_alerts.created_at
    FROM low_stock_alerts
    JOIN items ON items.id = low_stock_alerts.item_id
    WHERE low_stock_alerts.resolved_at IS NULL
    ORDER BY low_stock_alerts.created_at DESC, low_stock_alerts.id DESC
  `).all();
}
