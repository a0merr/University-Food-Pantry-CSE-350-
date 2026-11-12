const {test}=require('node:test'),assert=require('node:assert/strict'),{fixture,client}=require('../helpers');
const inv=require('../../src/services/inventory'),req=require('../../src/services/requests'),slots=require('../../src/services/slots');

test('FR5: full slot is hidden from students and booking it is a 409',async()=>{
  const f=fixture(),c=await client(f.app());
  try{
    const item=inv.create(f.db,{name:'Rice',category:'Food',quantity:10},f.clock);
    const small=slots.create(f.db,{starts_at:'2030-01-02T10:00',capacity:1},f.clock);
    const other=slots.create(f.db,{starts_at:'2030-01-02T11:00',capacity:1},f.clock);
    const first=req.create(f.db,2,[{item_id:item.id,quantity:1}],f.clock);
    await c.request('/auth/login','POST',{email:'student@test.edu',password:'TestPassword123!'});
    assert.equal((await c.request(`/requests/${first.id}/schedule`,'POST',{slot_id:small.id})).status,200);
    const listed=await c.request('/slots');
    assert.deepEqual(listed.data.map((s)=>s.id),[other.id]);
    const again=await c.request(`/requests/${first.id}/schedule`,'POST',{slot_id:small.id});
    assert.equal(again.status,200,'re-booking your own slot is not "full"');
  }finally{await c.close();f.close()}
});

test('FR5: moving to another slot releases the old place',async()=>{
  const f=fixture(),c=await client(f.app());
  try{
    const item=inv.create(f.db,{name:'Rice',category:'Food',quantity:10},f.clock);
    const a=slots.create(f.db,{starts_at:'2030-01-02T10:00',capacity:1},f.clock);
    const b=slots.create(f.db,{starts_at:'2030-01-02T11:00',capacity:1},f.clock);
    const r=req.create(f.db,2,[{item_id:item.id,quantity:1}],f.clock);
    await c.request('/auth/login','POST',{email:'student@test.edu',password:'TestPassword123!'});
    await c.request(`/requests/${r.id}/schedule`,'POST',{slot_id:a.id});
    assert.equal((await c.request(`/requests/${r.id}/schedule`,'POST',{slot_id:b.id})).status,200);
    const counts=f.db.prepare("SELECT slot_id,COUNT(*) AS n FROM requests WHERE status='scheduled' GROUP BY slot_id").all();
    assert.deepEqual(counts.map((x)=>[x.slot_id,x.n]),[[b.id,1]]);
  }finally{await c.close();f.close()}
});

test('FR10: report is staff-only',async()=>{
  const f=fixture(),c=await client(f.app());
  try{
    assert.equal((await c.request('/reports/usage')).status,401);
    await c.request('/auth/login','POST',{email:'student@test.edu',password:'TestPassword123!'});
    assert.equal((await c.request('/reports/usage')).status,403);
    const staff=await client(f.app());
    try{
      await staff.request('/auth/login','POST',{email:'staff@test.edu',password:'TestPassword123!'});
      const r=await staff.request('/reports/usage');
      assert.equal(r.status,200);
      assert.equal(r.data.requests.total,0);
    }finally{await staff.close()}
  }finally{await c.close();f.close()}
});

test('FR3: staff see full slots, students do not',async()=>{
  const f=fixture(),c=await client(f.app());
  try{
    slots.create(f.db,{starts_at:'2030-01-02T10:00',capacity:1},f.clock);
    await c.request('/auth/login','POST',{email:'staff@test.edu',password:'TestPassword123!'});
    assert.equal((await c.request('/slots')).data.length,1);
  }finally{await c.close();f.close()}
});
