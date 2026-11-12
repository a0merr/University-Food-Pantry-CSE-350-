const {id,positive,fail}=require('../lib/compat');const inventory=require('./inventory');
function create(db,data,clock){return db.transaction(()=>{const itemId=id(data.item_id),qty=positive(data.quantity);if(!db.prepare('SELECT id FROM items WHERE id=?').get(itemId))fail(404,'not_found','Item not found');const r=db.prepare('INSERT INTO donations(item_id,quantity,created_at) VALUES(?,?,?)').run(itemId,qty,clock.now());db.prepare('UPDATE items SET quantity=quantity+? WHERE id=?').run(qty,itemId);inventory.checkLowStock(db,itemId,clock.now());return {id:Number(r.lastInsertRowid)}})}
function list(db){return db.prepare('SELECT d.*,i.name AS item_name FROM donations d JOIN items i ON i.id=d.item_id ORDER BY d.created_at DESC').all()}
module.exports={create,list};
