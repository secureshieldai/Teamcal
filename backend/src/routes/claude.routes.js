const express = require('express');
const router = express.Router();
const claudeController = require('../controllers/claude.controller');
const { authenticateToken } = require('../middleware/auth');

// All Claude routes require authentication
router.use(authenticateToken);

router.post('/chat', claudeController.chat);
router.post('/generate', claudeController.generate);
router.post('/workout', claudeController.generateWorkout);
router.post('/meal', claudeController.generateMeal);
router.post('/supplement', claudeController.analyzeSupplement);

module.exports = router;
