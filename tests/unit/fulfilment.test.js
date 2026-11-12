const {test}=require('node:test'),assert=require('node:assert/strict'),{fixture}=require('../helpers');
const inv=require('../../src/services/inventory'),req=require('../../src/services/requests'),slots=require('../../src/services/slots');

function scheduled(f,quantity=2){
  const item=inv.create(f.db,{name:'Rice',category:'Food',quantity:5,per_visit_limit:3,threshold:1},f.clock);
  const slot=slots.create(f.db,{starts_at:'2030-01-02T10:00',capacity:2},f.clock);
  const r=req.create(f.db,2,[{item_id:item.id,quantity}],f.clock);
  req.schedule(f.db,r.id,2,slot.id,f.clock);
  return {item,r};
}

test('FR8: prepare then pickup moves stock from reserved to gone',()=>{
  const f=fixture();
  try{
    const {item,r}=scheduled(f,2);
    assert.equal(req.markPrepared(f.db,r.id,f.clock).status,'prepared');
    const done=req.markPickedUp(f.db,r.id,f.clock);
    assert.equal(done.status,'picked_up');
    const row=f.db.prepare('SELECT quantity,reserved FROM items WHERE id=?').get(item.id);
    assert.deepEqual({...row},{quantity:3,reserved:0});
  }finally{f.close()}
});

test('FR8: states cannot be skipped',()=>{
  const f=fixture();
  try{
    const {r}=scheduled(f);
    assert.throws(()=>req.markPickedUp(f.db,r.id,f.clock),(e)=>e.status===409);
    req.markPrepared(f.db,r.id,f.clock);
    assert.throws(()=>req.markPrepared(f.db,r.id,f.clock),(e)=>e.status===409);
  }finally{f.close()}
});

test('FR8: pickup is refused when stock was removed after preparing',()=>{
  const f=fixture();
  try{
    const {item,r}=scheduled(f,2);
    req.markPrepared(f.db,r.id,f.clock);
    f.db.prepare('UPDATE items SET quantity=1,reserved=1 WHERE id=?').run(item.id);
    assert.throws(()=>req.markPickedUp(f.db,r.id,f.clock),(e)=>e.status===409&&e.code==='stock_changed');
    assert.equal(f.db.prepare('SELECT status FROM requests WHERE id=?').get(r.id).status,'prepared');
  }finally{f.close()}
});

test('FR9: alert opens at the threshold and resolves when stock returns',()=>{
  const f=fixture();
  try{
    const item=inv.create(f.db,{name:'Beans',category:'Canned',quantity:3,threshold:2},f.clock);
    assert.equal(inv.openAlerts(f.db).length,0);
    const r=req.create(f.db,2,[{item_id:item.id,quantity:2}],f.clock);
    const open=inv.openAlerts(f.db);
    assert.equal(open.length,1);
    assert.equal(open[0].available,1);
    req.cancel(f.db,r.id,{id:2,role:'student'},f.clock);
    assert.equal(inv.openAlerts(f.db).length,0,'cancelling releases stock and closes the alert');
    assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM low_stock_alerts WHERE resolved_at IS NOT NULL').get().n,1);
  }finally{f.close()}
});
