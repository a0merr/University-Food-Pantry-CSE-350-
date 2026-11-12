const express=require('express'),s=require('../services/settings');
module.exports=({db,a})=>{const r=express.Router();r.get('/settings/visit-limit',a.requireStaff,(req,res)=>res.json(s.get(db)));r.put('/settings/visit-limit',a.requireStaff,(req,res)=>res.json(s.set(db,req.body.visit_item_limit)));return r};
