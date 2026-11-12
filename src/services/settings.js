const {fail}=require('../lib/compat');
function get(db){return {visit_item_limit:Number(db.prepare("SELECT value FROM settings WHERE key='visit_item_limit'").get().value)}}
function set(db,n){n=Number(n);if(!Number.isSafeInteger(n)||n<1||n>100)fail(400,'invalid_limit','Limit must be 1–100');db.prepare("UPDATE settings SET value=? WHERE key='visit_item_limit'").run(String(n));return get(db)}
module.exports={get,set};
