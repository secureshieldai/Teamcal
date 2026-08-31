const express = require('express');
const channelController = require('../controllers/channel.controller');
const { authenticateToken } = require('../middleware/auth');
const { channelOwner, channelAdmin, channelPermission } = require('../middleware/channel-permissions');

const router = express.Router();

// Public routes
router.get('/discover', channelController.discoverChannels);
router.get('/trending', channelController.getTrending);
router.get('/search', channelController.searchChannels);
router.get('/category/:category', channelController.getByCategory);
router.get('/:id', channelController.getChannel);
router.get('/:id/posts', channelController.getChannelPosts);

// Protected routes
router.use(authenticateToken);

router.post('/', channelController.createChannel);
router.get('/my/channels', channelController.getMyChannels);
router.get('/my/following', channelController.getFollowingChannels);

router.put('/:id', channelOwner, channelController.updateChannel);
router.delete('/:id', channelOwner, channelController.deleteChannel);

router.post('/:id/follow', channelController.followChannel);
router.delete('/:id/follow', channelController.unfollowChannel);

router.get('/:id/followers', channelController.getFollowers);
router.get('/:id/admins', channelAdmin, channelController.getAdmins);
router.post('/:id/admins', channelOwner, channelController.addAdmin);
router.delete('/:id/admins/:userId', channelOwner, channelController.removeAdmin);
router.put('/:id/admins/:userId/permissions', channelOwner, channelController.updateAdminPermissions);

router.post('/:id/ban/:userId', channelAdmin, channelController.banUser);
router.delete('/:id/ban/:userId', channelAdmin, channelController.unbanUser);

router.put('/:id/settings', channelAdmin, channelController.updateSettings);
router.post('/:id/transfer', channelOwner, channelController.transferOwnership);

module.exports = router;
