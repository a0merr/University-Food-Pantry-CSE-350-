const {randomBytes,createHash}=require('node:crypto');
const TTL=7*24*60*60*1000;
const hash=t=>createHash('sha256').update(t).digest('hex');
function create(db,userId,clock){const token=randomBytes(32).toString('hex');const now=clock.now();db.prepare('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)').run(hash(token),userId,now+TTL);return token;}
function get(db,token,clock){if(!token)return null;return db.prepare('SELECT u.id,u.email,u.role FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?').get(hash(token),clock.now())||null;}
function destroy(db,token){if(token)db.prepare('DELETE FROM sessions WHERE token_hash=?').run(hash(token));}
function setCookie(res,token){res.setHeader('Set-Cookie',`sid=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${TTL/1000}`)}
function clearCookie(res){res.setHeader('Set-Cookie','sid=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0')}
module.exports={create,get,destroy,setCookie,clearCookie};
