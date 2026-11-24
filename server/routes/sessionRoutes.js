const express = require('express');
const router = express.Router();
const { requestSession, respondToSession, completeSession, getSessions } = require('../controllers/sessionController');
const { idParam, sessionRequestRules, sessionRespondRules } = require('../middleware/validators');
const { protect } = require('../middleware/authMiddleware');

router.post('/request', protect, sessionRequestRules, requestSession);
router.put('/:id/respond', protect, sessionRespondRules, respondToSession);
router.put('/:id/complete', protect, idParam(), completeSession);
router.get('/', protect, getSessions);

module.exports = router;
