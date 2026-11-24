const express = require('express');
const router = express.Router();
const { sendRequest, respondToRequest, getRequests } = require('../controllers/mentorshipController');
const { mentorshipRequestRules, mentorshipRespondRules } = require('../middleware/validators');
const { protect } = require('../middleware/authMiddleware');

router.post('/request', protect, mentorshipRequestRules, sendRequest);
router.put('/respond', protect, mentorshipRespondRules, respondToRequest);
router.get('/', protect, getRequests);

module.exports = router;
