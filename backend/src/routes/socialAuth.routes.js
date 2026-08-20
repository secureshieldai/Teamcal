const express = require("express");
const { protect } = require("../middleware/auth");
const { connect, callback, platformStatus } = require("../controllers/socialAuth.controller");

const router = express.Router();

router.get("/platforms", protect, platformStatus);
router.post("/connect/:platform", protect, connect);
router.get("/callback/:platform", callback);

module.exports = router;
