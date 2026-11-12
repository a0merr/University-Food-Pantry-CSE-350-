// FR5: pickup slots. Capacity is enforced inside a transaction, so two students
// booking the last place at the same moment cannot both succeed.
const {id,positive,fail,iso}=require('../lib/compat');

const BOOKED="status IN ('scheduled','prepared')";

function withBooked(db,now){return db.prepare(`SELECT s.*, (SELECT COUNT(*) FROM requests r WHERE r.slot_id=s.id AND r.${BOOKED}) AS booked FROM slots s WHERE s.starts_at>? ORDER BY s.starts_at`).all(now)}

/** Upcoming slots. Students only see slots with a free place; staff see all of them. */
function list(db,clock,{staff=false}={}){const rows=withBooked(db,clock.now());return staff?rows:rows.filter(s=>s.booked<s.capacity)}

function create(db,data,clock){const start=iso(data.starts_at);if(start<=clock.now())fail(400,'invalid_time','Pickup must be in the future');const cap=positive(data.capacity);const r=db.prepare('INSERT INTO slots(starts_at,capacity) VALUES(?,?)').run(start,cap);return {id:Number(r.lastInsertRowid),starts_at:start,capacity:cap}}

function remove(db,slotId){slotId=id(slotId);const n=db.prepare(`SELECT COUNT(*) AS n FROM requests WHERE slot_id=? AND ${BOOKED}`).get(slotId).n;if(n)fail(409,'slot_booked','Cannot remove a booked slot');db.prepare('DELETE FROM slots WHERE id=?').run(slotId);return {ok:true}}

/**
 * Books `requestId` into `slotId` for its owner. Re-booking an already scheduled
 * request moves it (the old place is released because the count is by slot_id).
 * Must be called inside a transaction.
 */
function book(db,requestId,studentId,slotId,clock){
  const r=db.prepare('SELECT * FROM requests WHERE id=?').get(id(requestId));
  if(!r)fail(404,'not_found','Request not found');
  if(r.student_id!==studentId)fail(403,'forbidden','Not your request');
  if(!['submitted','scheduled'].includes(r.status))fail(409,'invalid_state','Request cannot be scheduled');
  const sid=id(slotId);
  const slot=db.prepare('SELECT * FROM slots WHERE id=?').get(sid);
  if(!slot||slot.starts_at<=clock.now())fail(400,'invalid_slot','Slot unavailable');
  const booked=db.prepare(`SELECT COUNT(*) AS n FROM requests WHERE slot_id=? AND ${BOOKED} AND id!=?`).get(sid,r.id).n;
  if(booked>=slot.capacity)fail(409,'slot_full','Slot is full');
  db.prepare("UPDATE requests SET status='scheduled',slot_id=?,reminder_sent=0 WHERE id=?").run(sid,r.id);
  return slot;
}

module.exports={list,create,remove,book,withBooked};
