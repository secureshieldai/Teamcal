const express = require("express");
const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload");
const { aiRateLimit } = require("../controllers/coach.controller");
const {
  getWorkouts, getTodayWorkout, getWorkout,
  createWorkout, updateWorkout, deleteWorkout,
  logWorkout, getWorkoutHistory, getWeeklyHistory,
  scanCoachGenerate, getRecommendations, uploadProgressPhoto,
} = require("../controllers/workout.controller");

const router = express.Router();

router.use(protect);

// Specific paths before /:id
router.get("/today", getTodayWorkout);
router.get("/history", getWorkoutHistory);
router.get("/history/weekly", getWeeklyHistory);
router.get("/recommendations", getRecommendations);
router.post("/scan-coach/generate", aiRateLimit, upload.single("photo"), scanCoachGenerate);
router.post("/progress/photo", upload.single("photo"), uploadProgressPhoto);
router.post("/log", logWorkout);
router.get("/", getWorkouts);
router.post("/", createWorkout);
router.get("/:id", getWorkout);
router.patch("/:id", updateWorkout);
router.delete("/:id", deleteWorkout);

module.exports = router;
