const express = require("express");
const { protect } = require("../middleware/auth");
const {
  getChallenges, getFeatured, getChallenge,
  createChallenge, updateChallenge, joinChallenge, leaveChallenge, updateProgress,
  getChallengeMembers,
} = require("../controllers/challenge.controller");

const router = express.Router();

router.use(protect);

router.get("/", getChallenges);
router.get("/featured", getFeatured);
router.get("/:id", getChallenge);
router.get("/:id/members", getChallengeMembers);
router.post("/", createChallenge);
router.patch("/:id", updateChallenge);
router.post("/:id/join", joinChallenge);
router.delete("/:id/join", leaveChallenge);
router.patch("/:id/progress", updateProgress);

module.exports = router;
