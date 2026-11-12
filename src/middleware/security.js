const {fail}=require('../lib/compat');
function securityHeaders(req,res,next){res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'");next();}
function csrf(req,res,next){if(!['GET','HEAD','OPTIONS'].includes(req.method)&&req.get('X-Requested-With')!=='fetch')fail(403,'csrf','Missing required request header');next();}
function parseCookies(req,res,next){req.cookies=Object.fromEntries((req.headers.cookie||'').split(';').map(x=>x.trim()).filter(x=>x.includes('=')).map(x=>{const i=x.indexOf('=');return [x.slice(0,i),decodeURIComponent(x.slice(i+1))]}));next();}
module.exports={securityHeaders,csrf,parseCookies};
