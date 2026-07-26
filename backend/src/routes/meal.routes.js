const express = require("express");
const { protect } = require("../middleware/auth");
const { logMeal, todayMeals, logScanResult, mealsForDay, updateMeal, deleteMeal } = require("../controllers/meal.controller");

const router = express.Router();

router.use(protect);

router.post("/log", logMeal);
router.get("/today", todayMeals);
router.get("/day", mealsForDay);
router.post("/scan-log", logScanResult);
router.patch("/:id", updateMeal);
router.delete("/:id", deleteMeal);

module.exports = router;
