const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/authController');
const { loginRules, registerRules } = require('../middleware/validators');

router.post('/register', registerRules, registerUser);
router.post('/login', loginRules, loginUser);

module.exports = router;
