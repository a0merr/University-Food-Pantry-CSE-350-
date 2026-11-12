// Compatibility helpers owned by this patch (existing error/time/validation modules remain untouched).
class AppError extends Error { constructor(status,code,message){super(message);this.status=status;this.code=code;} }
const fail=(status,code,message)=>{throw new AppError(status,code,message)};
const ms=(clock)=>typeof clock?.now==='function'?new Date(clock.now()).getTime():Date.now();
const iso=(s)=>{if(typeof s!=='string'|| !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(s))fail(400,'invalid_time','Use local ISO format YYYY-MM-DDTHH:mm');const t=Date.parse(s);if(!Number.isFinite(t))fail(400,'invalid_time','Invalid time');return t;};
const id=(v)=>{const n=Number(v);if(!Number.isSafeInteger(n)||n<=0)fail(400,'invalid_id','Positive integer required');return n};
const positive=(v)=>id(v);
module.exports={AppError,fail,ms,iso,id,positive};
