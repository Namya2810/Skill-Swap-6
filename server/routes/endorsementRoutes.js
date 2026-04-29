const express = require('express');
const router = express.Router();
const { endorseSkill, getEndorsements } = require('../controllers/endorsementController');
const { protect } = require('../middleware/authMiddleware');

router.post('/',           protect, endorseSkill);
router.get('/:userId',     protect, getEndorsements);

module.exports = router;
