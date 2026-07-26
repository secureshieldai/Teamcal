const express = require("express");
const { protect } = require("../middleware/auth");
const {
  getWorkouts, getTodayWorkout, getWorkout,
  createWorkout, updateWorkout, deleteWorkout,
  logWorkout, getWorkoutHistory,
} = require("../controllers/workout.controller");

const router = express.Router();

router.use(protect);

// Specific paths before /:id
router.get("/today", getTodayWorkout);
router.get("/history", getWorkoutHistory);
router.post("/log", logWorkout);
router.get("/", getWorkouts);
router.post("/", createWorkout);
router.get("/:id", getWorkout);
router.patch("/:id", updateWorkout);
router.delete("/:id", deleteWorkout);

module.exports = router;
