const express = require('express');
const router = express.Router();
const { getRecommendations } = require('../controllers/peerController');
const { protect } = require('../middleware/authMiddleware');

router.get('/recommend', protect, getRecommendations);

module.exports = router;
