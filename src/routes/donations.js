const express=require('express'),s=require('../services/donations');
module.exports=({db,clock,a})=>{const r=express.Router();r.get('/donations',a.requireStaff,(req,res)=>res.json(s.list(db)));r.post('/donations',a.requireStaff,(req,res)=>res.status(201).json(s.create(db,req.body,clock)));return r};
