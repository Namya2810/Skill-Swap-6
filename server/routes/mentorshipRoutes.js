const express = require('express');
const router = express.Router();
const { sendRequest, respondToRequest, getRequests } = require('../controllers/mentorshipController');
const { protect } = require('../middleware/authMiddleware');

router.post('/request', protect, sendRequest);
router.put('/respond', protect, respondToRequest);
router.get('/', protect, getRequests);

module.exports = router;
