const express = require('express');
const channelPostController = require('../controllers/channel-post.controller');
const { protect } = require('../middleware/auth');
const { channelPermission } = require('../middleware/channel-permissions');

const router = express.Router();

router.use(protect);

// Posts
router.post('/:channelId/posts', channelPostController.createPost); // Temporarily removed permission check
router.get('/posts/:postId', channelPostController.getPost);
router.put('/posts/:postId', channelPermission('can_edit'), channelPostController.updatePost);
router.delete('/posts/:postId', channelPermission('can_delete'), channelPostController.deletePost);
router.post('/posts/:postId/pin', channelPermission('can_pin'), channelPostController.pinPost);
router.delete('/posts/:postId/pin', channelPermission('can_pin'), channelPostController.unpinPost);

// Reactions
router.post('/posts/:postId/reactions', channelPostController.addReaction);
router.delete('/posts/:postId/reactions', channelPostController.removeReaction);

// Comments
router.get('/posts/:postId/comments', channelPostController.getComments);
router.post('/posts/:postId/comments', channelPostController.addComment);
router.put('/posts/comments/:commentId', channelPostController.updateComment);
router.delete('/posts/comments/:commentId', channelPostController.deleteComment);

// Reports
router.post('/:channelId/report', channelPostController.reportChannel);
router.post('/posts/:postId/report', channelPostController.reportPost);

module.exports = router;
