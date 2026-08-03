const express=require("express");
const {webhook}=require("../controllers/stripe.controller");
const router=express.Router();
router.post("/webhook",express.raw({type:"application/json"}),webhook);
module.exports=router;
