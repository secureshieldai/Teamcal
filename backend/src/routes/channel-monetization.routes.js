const express = require('express');
const channelMonetizationController = require('../controllers/channel-monetization.controller');
const { authenticateToken } = require('../middleware/auth');
const { channelOwner } = require('../middleware/channel-permissions');

const router = express.Router();

router.use(authenticateToken);

router.post('/:channelId/monetization/apply', channelOwner, channelMonetizationController.applyForMonetization);
router.get('/:channelId/monetization/status', channelOwner, channelMonetizationController.getMonetizationStatus);
router.get('/:channelId/earnings', channelOwner, channelMonetizationController.getEarnings);
router.post('/:channelId/earnings/withdraw', channelOwner, channelMonetizationController.requestWithdrawal);

module.exports = router;
