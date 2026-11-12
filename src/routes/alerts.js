const express=require('express'),inventory=require('../services/inventory');
module.exports=({db,a})=>{const r=express.Router();r.get('/alerts',a.requireStaff,(req,res)=>res.json(inventory.openAlerts(db)));return r};
