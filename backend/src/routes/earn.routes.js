const express = require("express");
const { protect } = require("../middleware/auth");
const {
  getEarnEntries, getReferrals, inviteReferral,
  getPayout, connectPayout, payoutStatus, payoutLoginLink, disconnectPayout, withdraw, dailyCheckin, redeemReward, getRedemptions,
  getSummary, getAssets, createAsset, updateAsset, deleteAsset,
  getAsset, getPublicAsset, recordAssetView, getPublicMembership, getStoreOrders, getStoreCustomers, createStoreProduct, uploadPdfFile, uploadVideoFile,
} = require("../controllers/earn.controller");
const { pdfUpload, videoUpload } = require("../middleware/upload");

const router = express.Router();

router.use(protect);

router.get("/entries", getEarnEntries);
router.get("/summary", getSummary);
router.get("/assets", getAssets);
router.get("/memberships/:id/public", getPublicMembership);
router.get("/assets/:id/public", getPublicAsset);
router.post("/assets/:id/view", recordAssetView);
router.get("/assets/:id", getAsset);
router.get("/stores/:id/orders", getStoreOrders);
router.get("/stores/:id/customers", getStoreCustomers);
router.post("/stores/:id/products", createStoreProduct);
router.post("/assets", createAsset);
router.post("/pdfs/upload", pdfUpload.single("pdf"), uploadPdfFile);
router.post("/videos/upload", videoUpload.single("file"), uploadVideoFile);
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
