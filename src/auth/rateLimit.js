const {fail}=require('../lib/compat');
const attempts=new Map();const WINDOW=15*60*1000;
function key(ip,email){return `${ip}|${String(email||'').toLowerCase()}`}
function check(ip,email,now=Date.now()){const k=key(ip,email);const times=(attempts.get(k)||[]).filter(t=>now-t<WINDOW);attempts.set(k,times);if(times.length>=5)fail(429,'too_many_requests','Too many login attempts; try again later');}
function failure(ip,email,now=Date.now()){const k=key(ip,email);attempts.set(k,[...(attempts.get(k)||[]).filter(t=>now-t<WINDOW),now]);}
function success(ip,email){attempts.delete(key(ip,email))}
module.exports={check,failure,success};
