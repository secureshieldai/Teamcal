const express = require('express');
const channelPostController = require('../controllers/channel-post.controller');
const { protect } = require('../middleware/auth');
const { channelPermission } = require('../middleware/channel-permissions');

const router = express.Router();

router.use(protect);

// Posts
router.post('/channels/:channelId/posts', channelPermission('can_post'), channelPostController.createPost);
router.get('/channels/posts/:postId', channelPostController.getPost);
router.put('/channels/posts/:postId', channelPermission('can_edit'), channelPostController.updatePost);
router.delete('/channels/posts/:postId', channelPermission('can_delete'), channelPostController.deletePost);
router.post('/channels/posts/:postId/pin', channelPermission('can_pin'), channelPostController.pinPost);
router.delete('/channels/posts/:postId/pin', channelPermission('can_pin'), channelPostController.unpinPost);

// Reactions
router.post('/channels/posts/:postId/reactions', channelPostController.addReaction);
router.delete('/channels/posts/:postId/reactions', channelPostController.removeReaction);

// Comments
router.get('/channels/posts/:postId/comments', channelPostController.getComments);
router.post('/channels/posts/:postId/comments', channelPostController.addComment);
router.put('/channels/posts/comments/:commentId', channelPostController.updateComment);
router.delete('/channels/posts/comments/:commentId', channelPostController.deleteComment);

// Reports
router.post('/channels/:channelId/report', channelPostController.reportChannel);
router.post('/channels/posts/:postId/report', channelPostController.reportPost);

module.exports = router;
