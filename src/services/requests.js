const { id, positive, fail } = require("../lib/compat");
const inventory = require("./inventory");
const notifications = require("./notifications");
const slots = require("./slots");
const OPEN = ["submitted", "scheduled", "prepared"];
function one(db, requestId) {
  const r = db.prepare("SELECT * FROM requests WHERE id=?").get(id(requestId));
  if (!r) fail(404, "not_found", "Request not found");
  return r;
}
function detail(db, r) {
  return {
    ...r,
    items: db
      .prepare(
        "SELECT ri.item_id,ri.quantity,i.name FROM request_items ri JOIN items i ON i.id=ri.item_id WHERE request_id=?",
      )
      .all(r.id),
  };
}
function create(db, studentId, items, clock) {
  if (!Array.isArray(items) || items.length === 0)
    fail(400, "invalid_items", "Select at least one item");
  return db.transaction(() => {
    if (
      db
        .prepare(
          "SELECT id FROM requests WHERE student_id=? AND status IN ('submitted','scheduled','prepared')",
        )
        .get(studentId)
    )
      fail(409, "open_request", "Only one open request allowed");
    let total = 0;
    const parsed = [],
      seen = new Set();
    for (const line of items) {
      const itemId = id(line.item_id ?? line.id),
        qty = positive(line.quantity);
      if (seen.has(itemId)) fail(400, "duplicate_item", "Duplicate item");
      seen.add(itemId);
      const item = db.prepare("SELECT * FROM items WHERE id=?").get(itemId);
      if (!item || !item.active) fail(404, "not_found", "Item is unavailable");
      if (qty > item.per_visit_limit)
        fail(400, "item_limit", "Per-item limit exceeded");
      if (qty > item.quantity - item.reserved)
        fail(409, "out_of_stock", "Insufficient available stock");
      total += qty;
      parsed.push({ itemId, qty });
    }
    const max = Number(
      db
        .prepare("SELECT value FROM settings WHERE key='visit_item_limit'")
        .get().value,
    );
    if (total > max) fail(400, "visit_limit", "Visit item limit exceeded");
    const r = db
      .prepare(
        "INSERT INTO requests(student_id,status,created_at) VALUES(?,?,?)",
      )
      .run(studentId, "submitted", clock.now());
    const requestId = Number(r.lastInsertRowid);
    for (const { itemId, qty } of parsed) {
      db.prepare(
        "INSERT INTO request_items(request_id,item_id,quantity) VALUES(?,?,?)",
      ).run(requestId, itemId, qty);
      db.prepare("UPDATE items SET reserved=reserved+? WHERE id=?").run(
        qty,
        itemId,
      );
      inventory.checkLowStock(db, itemId, clock.now());
    }
    return detail(db, one(db, requestId));
  });
}
function mine(db, studentId) {
  return db
    .prepare(
      "SELECT * FROM requests WHERE student_id=? ORDER BY created_at DESC",
    )
    .all(studentId)
    .map((r) => detail(db, r));
}
function staffList(db, date) {
  let rows = db
    .prepare(
      "SELECT r.*,u.email AS student_email FROM requests r JOIN users u ON u.id=r.student_id ORDER BY COALESCE((SELECT starts_at FROM slots WHERE id=r.slot_id),9999999999999),r.created_at",
    )
    .all();
  if (date)
    rows = rows.filter((r) => {
      if (!r.slot_id) return false;
      const s = db
        .prepare("SELECT starts_at FROM slots WHERE id=?")
        .get(r.slot_id);
      return s && new Date(s.starts_at).toISOString().slice(0, 10) === date;
    });
  return rows.map((r) => detail(db, r));
}
function schedule(db, requestId, studentId, slotId, clock) {
  return db.transaction(() => {
    const r = one(db, requestId);
    const slot = slots.book(db, r.id, studentId, slotId, clock);
    notifications.notify(
      db,
      studentId,
      "scheduled",
      `Your pickup is scheduled for ${new Date(slot.starts_at).toLocaleString()}.`,
      clock,
      { requestId: r.id, subject: "Pantry pickup scheduled" },
    );
    return detail(db, one(db, r.id));
  });
}
function markPrepared(db, requestId, clock) {
  return db.transaction(() => {
    const r = one(db, requestId);
    if (r.status !== "scheduled")
      fail(409, "invalid_state", "Request must be scheduled");
    // FR8: the order can only be packed if the stock is still there.
    for (const line of detail(db, r).items) {
      const item = db
        .prepare("SELECT quantity,reserved FROM items WHERE id=?")
        .get(line.item_id);
      if (
        !item ||
        item.quantity < line.quantity ||
        item.reserved < line.quantity
      )
        fail(
          409,
          "out_of_stock",
          `Not enough stock for ${line.name}; cancel or adjust the request`,
        );
    }
    db.prepare("UPDATE requests SET status='prepared' WHERE id=?").run(r.id);
    notifications.notify(
      db,
      r.student_id,
      "ready",
      "Your order is ready for pickup.",
      clock,
      { requestId: r.id, subject: "Pantry order ready" },
    );
    return detail(db, one(db, r.id));
  });
}
function markPickedUp(db, requestId, clock) {
  return db.transaction(() => {
    const r = one(db, requestId);
    if (r.status !== "prepared")
      fail(409, "invalid_state", "Request must be prepared");
    for (const line of detail(db, r).items) {
      const changed = db
        .prepare(
          "UPDATE items SET quantity=quantity-?,reserved=reserved-? WHERE id=? AND quantity>=? AND reserved>=?",
        )
        .run(
          line.quantity,
          line.quantity,
          line.item_id,
          line.quantity,
          line.quantity,
        );
      if (changed.changes === 0)
        fail(
          409,
          "stock_changed",
          "Stock changed since this order was prepared; ask staff to review it",
        );
      inventory.checkLowStock(db, line.item_id, clock.now());
    }
    db.prepare("UPDATE requests SET status='picked_up' WHERE id=?").run(r.id);
    return detail(db, one(db, r.id));
  });
}
function cancel(db, requestId, user, clock) {
  return db.transaction(() => {
    const r = one(db, requestId);
    if (user.role !== "staff" && r.student_id !== user.id)
      fail(403, "forbidden", "Not your request");
    if (!OPEN.includes(r.status))
      fail(409, "invalid_state", "Request is no longer open");
    for (const line of detail(db, r).items) {
      db.prepare("UPDATE items SET reserved=reserved-? WHERE id=?").run(
        line.quantity,
        line.item_id,
      );
      inventory.checkLowStock(db, line.item_id, clock.now());
    }
    db.prepare("UPDATE requests SET status='cancelled' WHERE id=?").run(r.id);
    notifications.notify(
      db,
      r.student_id,
      "cancelled",
      "Your pickup was cancelled.",
      clock,
      { requestId: r.id, subject: "Pantry pickup cancelled" },
    );
    return detail(db, one(db, r.id));
  });
}
module.exports = {
  create,
  mine,
  staffList,
  schedule,
  markPrepared,
  markPickedUp,
  cancel,
};
