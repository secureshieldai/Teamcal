const express = require("express");
const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload");
const {
  getProfile, updateProfile, uploadAvatar, updateGoals, getGoals,
  updateNotifPrefs, registerPushToken, getProfileSummary,
} = require("../controllers/user.controller");

const router = express.Router();

router.use(protect);

router.get("/profile", getProfile);
router.get("/profile-summary", getProfileSummary);
router.patch("/profile", updateProfile);
router.post("/avatar", upload.single("avatar"), uploadAvatar);
router.get("/goals", getGoals);
router.patch("/goals", updateGoals);
router.patch("/notifications", updateNotifPrefs);
router.post("/push-token", registerPushToken);

module.exports = router;
