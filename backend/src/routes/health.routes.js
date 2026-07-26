const express = require("express");
const { protect } = require("../middleware/auth");
const { getTeam, invite, updateInvite, removeInvite } = require("../controllers/health.controller");

const router = express.Router();

router.use(protect);

router.get("/", getTeam);
router.post("/", invite);
router.patch("/:id", updateInvite);
router.delete("/:id", removeInvite);

module.exports = router;
