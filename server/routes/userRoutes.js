const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, getAllUsers, deleteUser } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.get('/', protect, getAllUsers);
router.delete('/:id', protect, deleteUser);
module.exports = router;
