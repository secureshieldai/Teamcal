const express = require("express");
const { protect } = require("../middleware/auth");
const {
  getActive, startSleep, stopSleep, getHistory, getAnalytics,
  getAlarmPrefs, updateAlarmPrefs, getInsights,
} = require("../controllers/sleep.controller");

const router = express.Router();

router.use(protect);

router.get("/active", getActive);
router.post("/start", startSleep);
router.post("/stop", stopSleep);
router.get("/history", getHistory);
router.get("/analytics", getAnalytics);
router.get("/alarm", getAlarmPrefs);
router.patch("/alarm", updateAlarmPrefs);
router.get("/insights", getInsights);

module.exports = router;
