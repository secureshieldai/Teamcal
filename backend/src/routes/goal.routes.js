const express = require("express");
const { protect } = require("../middleware/auth");
const { getGoals, updateGoals } = require("../controllers/goal.controller");

const router = express.Router();

router.use(protect);

router.get("/", getGoals);
router.patch("/", updateGoals);

module.exports = router;
