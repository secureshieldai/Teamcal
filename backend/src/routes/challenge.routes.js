const express = require("express");
const { protect } = require("../middleware/auth");
const {
  getChallenges, getFeatured, getChallenge,
  createChallenge, joinChallenge, leaveChallenge, updateProgress,
} = require("../controllers/challenge.controller");

const router = express.Router();

router.use(protect);

router.get("/", getChallenges);
router.get("/featured", getFeatured);
router.get("/:id", getChallenge);
router.post("/", createChallenge);
router.post("/:id/join", joinChallenge);
router.delete("/:id/join", leaveChallenge);
router.patch("/:id/progress", updateProgress);

module.exports = router;
