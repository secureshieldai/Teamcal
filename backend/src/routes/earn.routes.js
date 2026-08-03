const express = require("express");
const { protect } = require("../middleware/auth");
const {
  getEarnEntries, getReferrals, inviteReferral,
  getPayout, connectPayout, payoutStatus, payoutLoginLink, disconnectPayout, withdraw, dailyCheckin, redeemReward, getRedemptions,
  getSummary, getAssets, createAsset, updateAsset, deleteAsset,
} = require("../controllers/earn.controller");

const router = express.Router();

router.use(protect);

router.get("/entries", getEarnEntries);
router.get("/summary", getSummary);
router.get("/assets", getAssets);
router.post("/assets", createAsset);
router.patch("/assets/:id", updateAsset);
router.delete("/assets/:id", deleteAsset);
router.get("/referrals", getReferrals);
router.post("/referrals", inviteReferral);
router.post("/checkin", dailyCheckin);
router.get("/redemptions", getRedemptions);
router.post("/redeem", redeemReward);
router.get("/payout", getPayout);
router.post("/payout/connect", connectPayout);
router.get("/payout/status", payoutStatus);
router.post("/payout/login-link", payoutLoginLink);
router.post("/payout/disconnect", disconnectPayout);
router.post("/payout/withdraw", withdraw);

module.exports = router;
