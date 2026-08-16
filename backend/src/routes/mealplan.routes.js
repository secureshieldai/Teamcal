const express = require("express");
const { protect } = require("../middleware/auth");
const { aiRateLimit } = require("../controllers/coach.controller");
const {
  generatePlan,
  getCurrentPlan,
  updatePreferences,
  regenerateDay,
  regenerateMeal,
  updateMeal,
  removeMeal,
  deletePlan,
  groceryList,
} = require("../controllers/mealplan.controller");

const router = express.Router();

router.use(protect);

router.post("/generate", aiRateLimit, generatePlan);
router.get("/current", getCurrentPlan);
router.patch("/:id", aiRateLimit, updatePreferences);
router.delete("/:id", deletePlan);
router.post("/:id/day/:dayIndex/regenerate", aiRateLimit, regenerateDay);
router.post("/:id/day/:dayIndex/meal/:mealId/regenerate", aiRateLimit, regenerateMeal);
router.patch("/:id/day/:dayIndex/meal/:mealId", updateMeal);
router.delete("/:id/day/:dayIndex/meal/:mealId", removeMeal);
router.get("/:id/day/:dayIndex/grocery-list", groceryList);

module.exports = router;
