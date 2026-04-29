const express = require('express');
const router = express.Router();
const { requestSession, respondToSession, completeSession, getSessions } = require('../controllers/sessionController');
const { protect } = require('../middleware/authMiddleware');

router.post('/request', protect, requestSession);
router.put('/:id/respond', protect, respondToSession);
router.put('/:id/complete', protect, completeSession);
router.get('/', protect, getSessions);

module.exports = router;
