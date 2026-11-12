const express=require('express'),s=require('../services/reports');
module.exports=({db,clock,a})=>{const r=express.Router();r.get('/reports/usage',a.requireStaff,(req,res)=>res.json(s.summary(db,req.query,clock)));return r};
