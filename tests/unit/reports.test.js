const {test}=require('node:test'),assert=require('node:assert/strict'),{fixture}=require('../helpers');
const inv=require('../../src/services/inventory'),req=require('../../src/services/requests'),slots=require('../../src/services/slots'),reports=require('../../src/services/reports');

test('FR10: usage report counts pickups, units and students without identifying them',()=>{
  const f=fixture();
  try{
    f.db.prepare('INSERT INTO users(email,password_hash,role) VALUES(?,?,?)').run('s2@test.edu','x','student');
    const rice=inv.create(f.db,{name:'Rice',category:'Food',quantity:10},f.clock);
    const soap=inv.create(f.db,{name:'Soap',category:'Hygiene',quantity:10},f.clock);
    const slot=slots.create(f.db,{starts_at:'2030-01-02T10:00',capacity:4},f.clock);
    const a=req.create(f.db,2,[{item_id:rice.id,quantity:2}],f.clock);
    req.schedule(f.db,a.id,2,slot.id,f.clock);req.markPrepared(f.db,a.id,f.clock);req.markPickedUp(f.db,a.id,f.clock);
    const b=req.create(f.db,3,[{item_id:soap.id,quantity:1}],f.clock);
    req.cancel(f.db,b.id,{id:3,role:'student'},f.clock);
    const r=reports.summary(f.db,{},f.clock);
    assert.equal(r.requests.total,2);
    assert.equal(r.requests.pickedUp,1);
    assert.equal(r.requests.cancelled,1);
    assert.equal(r.studentsServed,2);
    assert.equal(r.unitsDistributed,2);
    assert.deepEqual(r.byCategory,[{category:'Food',units:2,students:1}]);
    assert.equal(JSON.stringify(r).includes('@test.edu'),false,'no emails in the report');
  }finally{f.close()}
});

test('FR10: date range filters and reversed ranges are normalised',()=>{
  const f=fixture();
  try{
    const item=inv.create(f.db,{name:'Rice',category:'Food',quantity:10},f.clock);
    const slot=slots.create(f.db,{starts_at:'2030-01-02T10:00',capacity:4},f.clock);
    const r=req.create(f.db,2,[{item_id:item.id,quantity:1}],f.clock);
    req.schedule(f.db,r.id,2,slot.id,f.clock);req.markPrepared(f.db,r.id,f.clock);req.markPickedUp(f.db,r.id,f.clock);
    const later=reports.summary(f.db,{from:'2030-02-01T00:00',to:'2030-03-01T00:00'},f.clock);
    assert.equal(later.requests.total,0);
    const reversed=reports.summary(f.db,{from:'2030-03-01T00:00',to:'2030-02-01T00:00'},f.clock);
    assert.equal(reversed.requests.total,0);
    assert.ok(reversed.from<reversed.to);
  }finally{f.close()}
});
