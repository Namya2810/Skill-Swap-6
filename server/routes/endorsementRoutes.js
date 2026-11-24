const express = require('express');
const router = express.Router();
const { endorseSkill, getEndorsements } = require('../controllers/endorsementController');
const { endorseRules, idParam } = require('../middleware/validators');
const { protect } = require('../middleware/authMiddleware');

router.post('/',           protect, endorseRules, endorseSkill);
router.get('/:userId',     protect, idParam('userId'), getEndorsements);

module.exports = router;
