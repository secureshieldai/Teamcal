const express = require("express");
const { protect } = require("../middleware/auth");
const { getNotifications, markRead, markAllRead, getPrefs, updatePrefs } = require("../controllers/notification.controller");

const router = express.Router();

router.use(protect);

router.get("/prefs", getPrefs);
router.patch("/prefs", updatePrefs);
router.get("/", getNotifications);
router.patch("/read-all", markAllRead);
router.patch("/:id/read", markRead);

module.exports = router;
