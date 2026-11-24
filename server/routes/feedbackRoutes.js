const express = require('express');
const router = express.Router();
const { submitFeedback, getFeedback } = require('../controllers/feedbackController');
const { feedbackRules } = require('../middleware/validators');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, feedbackRules, submitFeedback);
router.get('/', protect, getFeedback);

module.exports = router;
