const express = require("express");
const { protect } = require("../middleware/auth");
const {
  getActive, startFast, stopFast, extendFast, getHistory, getAnalytics,
} = require("../controllers/fasting.controller");

const router = express.Router();

router.use(protect);

router.get("/active", getActive);
router.post("/start", startFast);
router.post("/stop", stopFast);
router.patch("/extend", extendFast);
router.get("/history", getHistory);
router.get("/analytics", getAnalytics);

module.exports = router;
