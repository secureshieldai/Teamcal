const express = require("express");
const { protect } = require("../middleware/auth");
const {
  addEntry, getEntries, getToday, getLastN, removeEntry, clearTracker, getStreak,
} = require("../controllers/tracker.controller");

const router = express.Router();

router.use(protect);

router.post("/:tracker", addEntry);
router.get("/:tracker/today", getToday);
router.get("/:tracker/lastn", getLastN);
router.get("/:tracker/streak", getStreak);
router.get("/:tracker", getEntries);
router.delete("/:tracker/:id", removeEntry);
router.delete("/:tracker", clearTracker);

module.exports = router;
