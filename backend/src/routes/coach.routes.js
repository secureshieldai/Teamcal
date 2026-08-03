const express = require("express");
const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload");
const { chat, scanMeal, lookupBarcode, generateAudience, aiRateLimit } = require("../controllers/coach.controller");

const router = express.Router();

router.use(protect);

router.post("/chat", aiRateLimit, chat);
router.post("/scan-meal", aiRateLimit, upload.single("image"), scanMeal);
router.post("/barcode", aiRateLimit, lookupBarcode);
router.post("/audience/generate",aiRateLimit,generateAudience);

module.exports = router;
