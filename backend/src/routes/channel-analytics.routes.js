const express = require('express');
const channelAnalyticsController = require('../controllers/channel-analytics.controller');
const { authenticateToken } = require('../middleware/auth');
const { channelAdmin } = require('../middleware/channel-permissions');

const router = express.Router();

router.use(authenticateToken);

router.get('/:channelId/analytics', channelAdmin, channelAnalyticsController.getAnalytics);
router.get('/:channelId/analytics/posts', channelAdmin, channelAnalyticsController.getTopPosts);
router.get('/:channelId/analytics/audience', channelAdmin, channelAnalyticsController.getAudienceInsights);

module.exports = router;
