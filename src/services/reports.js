// FR10: aggregate usage report for staff. Counts only — no student emails or IDs,
// so the report can be shared without exposing who used the pantry.
const { iso } = require("../lib/compat");

const DAY = 24 * 60 * 60 * 1000;

function range(query, clock) {
  const to = query.to ? iso(query.to) : clock.now();
  const from = query.from ? iso(query.from) : to - 30 * DAY;
  if (from > to) return { from: to, to: from };
  return { from, to };
}

function summary(db, query, clock) {
  const { from, to } = range(query, clock);
  const one = (sql) => db.prepare(sql).get(from, to);
  const requests = one(`SELECT COUNT(*) AS total,
      SUM(status='picked_up') AS picked_up,
      SUM(status='cancelled') AS cancelled,
      SUM(status IN ('submitted','scheduled','prepared')) AS open
    FROM requests WHERE created_at BETWEEN ? AND ?`);
  const items = one(`SELECT COALESCE(SUM(ri.quantity),0) AS units
    FROM request_items ri JOIN requests r ON r.id=ri.request_id
    WHERE r.status='picked_up' AND r.created_at BETWEEN ? AND ?`);
  const donations = one(
    `SELECT COUNT(*) AS count, COALESCE(SUM(quantity),0) AS units FROM donations WHERE created_at BETWEEN ? AND ?`,
  );
  const students = one(
    `SELECT COUNT(DISTINCT student_id) AS n FROM requests WHERE created_at BETWEEN ? AND ?`,
  );
  const byCategory = db
    .prepare(
      `SELECT i.category, SUM(ri.quantity) AS units, COUNT(DISTINCT r.student_id) AS students
    FROM request_items ri JOIN requests r ON r.id=ri.request_id JOIN items i ON i.id=ri.item_id
    WHERE r.status='picked_up' AND r.created_at BETWEEN ? AND ?
    GROUP BY i.category ORDER BY units DESC`,
    )
    .all(from, to)
    .map((x) => ({
      category: x.category,
      units: x.units,
      students: x.students,
    }));
  const byItem = db
    .prepare(
      `SELECT i.name, i.category, SUM(ri.quantity) AS units
    FROM request_items ri JOIN requests r ON r.id=ri.request_id JOIN items i ON i.id=ri.item_id
    WHERE r.status='picked_up' AND r.created_at BETWEEN ? AND ?
    GROUP BY i.id ORDER BY units DESC LIMIT 10`,
    )
    .all(from, to)
    .map((x) => ({ name: x.name, category: x.category, units: x.units }));
  return {
    from: new Date(from).toISOString(),
    to: new Date(to).toISOString(),
    requests: {
      total: requests.total || 0,
      pickedUp: requests.picked_up || 0,
      cancelled: requests.cancelled || 0,
      open: requests.open || 0,
    },
    studentsServed: students.n || 0,
    unitsDistributed: items.units || 0,
    donations: { count: donations.count || 0, units: donations.units || 0 },
    byCategory,
    topItems: byItem,
  };
}

module.exports = { summary, range };
