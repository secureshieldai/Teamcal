const express = require("express");
const { protect } = require("../middleware/auth");
const { getFeed, searchUsers, getProfile, getLeaderboard, toggleFriend, getFriends, getFriendsProgress, toggleFollow, getCreators, reportContent, toggleBlockUser, getSocialBlogs, getSocialBlog, getSocialVideos, getStories, articleEngagement, toggleArticleLike, addArticleComment, toggleArticleCommentLike, deleteArticleComment, toggleBlogFollow } = require("../controllers/social.controller");
const { listConversations, listRequests, getMessages, sendMessage, actOnRequest } = require('../controllers/message.controller');

const router = express.Router();

router.use(protect);

router.get("/feed", getFeed);
router.post('/reports',reportContent);
router.get('/content/blogs',getSocialBlogs);
router.get('/content/blogs/:id',getSocialBlog);
router.get('/content/blogs/:id/engagement',articleEngagement);
router.post('/content/blogs/:id/like',toggleArticleLike);
router.post('/content/blogs/:id/comments',addArticleComment);
router.post('/content/blogs/:id/comments/:commentId/like',toggleArticleCommentLike);
router.delete('/content/blogs/:id/comments/:commentId',deleteArticleComment);
router.post('/content/blogs/:blogId/follow',toggleBlogFollow);
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
router.post("/users/:id/block", toggleBlockUser);
router.get("/users/:id", getProfile);

module.exports = router;
