const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, getAllUsers } = require('../controllers/userController');
const { updateProfileRules } = require('../middleware/validators');
const { protect } = require('../middleware/authMiddleware');

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfileRules, updateProfile);
router.get('/', protect, getAllUsers);
module.exports = router;
