const express = require("express");
const { protect } = require("../middleware/auth");
const { getFeed, searchUsers, getProfile, getLeaderboard, toggleFriend, getFriends, getFriendsProgress, toggleFollow, getCreators } = require("../controllers/social.controller");

const router = express.Router();

router.use(protect);

router.get("/feed", getFeed);
router.get("/users", searchUsers);
router.get("/leaderboard", getLeaderboard);
router.get("/friends", getFriends);
router.get("/friends/progress", getFriendsProgress);
router.get("/creators", getCreators);
router.post("/users/:id/friend", toggleFriend);
router.post("/users/:id/follow", toggleFollow);
router.get("/users/:id", getProfile);

module.exports = router;
