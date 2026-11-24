const express = require('express');
const router = express.Router();
const { getMyCommunity, getAllCommunities, getRecommendedCommunities, joinCommunity, createCommunity } = require('../controllers/communityController');
const { createCommunityRules, joinCommunityRules } = require('../middleware/validators');
const { protect } = require('../middleware/authMiddleware');

router.get('/',          protect, getMyCommunity);
router.get('/all',       protect, getAllCommunities);
router.get('/recommend', protect, getRecommendedCommunities);
router.put('/join',      protect, joinCommunityRules, joinCommunity);
router.post('/create',   protect, createCommunityRules, createCommunity);            // NEW: create community

module.exports = router;
