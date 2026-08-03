const express = require("express");
const { protect } = require("../middleware/auth");
const { getFeed, searchUsers, getProfile, getLeaderboard, toggleFriend, getFriends, getFriendsProgress, toggleFollow, getCreators, getSocialBlogs, getSocialBlog, getSocialVideos, getStories } = require("../controllers/social.controller");
const { listConversations, listRequests, getMessages, sendMessage, actOnRequest } = require('../controllers/message.controller');

const router = express.Router();

router.use(protect);

router.get("/feed", getFeed);
router.get('/content/blogs',getSocialBlogs);
router.get('/content/blogs/:id',getSocialBlog);
router.get('/content/videos',getSocialVideos);
router.get('/stories',getStories);
router.get('/messages/conversations',listConversations);
router.get('/messages/requests',listRequests);
router.get('/messages/:userId',getMessages);
router.post('/messages/:userId',sendMessage);
router.post('/messages/requests/:userId',actOnRequest);
router.get("/users", searchUsers);
router.get("/leaderboard", getLeaderboard);
router.get("/friends", getFriends);
router.get("/friends/progress", getFriendsProgress);
router.get("/creators", getCreators);
router.post("/users/:id/friend", toggleFriend);
router.post("/users/:id/follow", toggleFollow);
router.get("/users/:id", getProfile);

module.exports = router;
