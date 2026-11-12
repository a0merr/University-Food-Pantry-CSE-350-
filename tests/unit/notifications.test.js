const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  { fixture } = require("../helpers");
const inv = require("../../src/services/inventory"),
  req = require("../../src/services/requests"),
  slots = require("../../src/services/slots"),
  notes = require("../../src/services/notifications");

test("reminder names the slot time, links the request and writes the outbox", () => {
  const f = fixture();
  try {
    const item = inv.create(
      f.db,
      { name: "Rice", category: "Food", quantity: 5 },
      f.clock,
    );
    const r = req.create(f.db, 2, [{ item_id: item.id, quantity: 1 }], f.clock);
    const slot = slots.create(
      f.db,
      { starts_at: "2030-01-01T10:30", capacity: 2 },
      f.clock,
    );
    req.schedule(f.db, r.id, 2, slot.id, f.clock);
    f.db.prepare("DELETE FROM notifications").run();
    f.db.prepare("DELETE FROM email_outbox").run();
    assert.equal(notes.sendDueReminders(f.db, f.clock), 1);
    const note = f.db
      .prepare("SELECT * FROM notifications WHERE type='reminder'")
      .get();
    assert.equal(note.request_id, r.id);
    assert.match(note.message, /pickup is at/);
    assert.equal(
      f.db
        .prepare(
          "SELECT COUNT(*) AS n FROM email_outbox WHERE subject='Pantry pickup reminder'",
        )
        .get().n,
      1,
    );
    assert.equal(notes.sendDueReminders(f.db, f.clock), 0);
  } finally {
    f.close();
  }
});

test("markRead only touches your own notifications and markAllRead counts", () => {
  const f = fixture();
  try {
    f.db
      .prepare("INSERT INTO users(email,password_hash,role) VALUES(?,?,?)")
      .run("other@test.edu", "x", "student");
    notes.notify(f.db, 2, "scheduled", "mine", f.clock);
    notes.notify(f.db, 3, "scheduled", "theirs", f.clock);
    const mine = notes.list(f.db, 2).find((n) => n.message === "mine");
    assert.equal(notes.unreadCount(f.db, 2), 1);
    assert.throws(
      () => notes.markRead(f.db, mine.id, 3),
      (e) => e.status === 404,
    );
    notes.markRead(f.db, mine.id, 2);
    assert.equal(notes.list(f.db, 2, { unreadOnly: true }).length, 0);
    assert.equal(notes.markAllRead(f.db, 3).updated, 1);
  } finally {
    f.close();
  }
});
