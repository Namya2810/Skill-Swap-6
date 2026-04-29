const express = require('express');
const router = express.Router();
const { getMyCommunity, getAllCommunities, getRecommendedCommunities, joinCommunity, createCommunity } = require('../controllers/communityController');
const { protect } = require('../middleware/authMiddleware');

router.get('/',          protect, getMyCommunity);
router.get('/all',       protect, getAllCommunities);
router.get('/recommend', protect, getRecommendedCommunities);
router.put('/join',      protect, joinCommunity);
router.post('/create',   protect, createCommunity);            // NEW: create community

module.exports = router;
