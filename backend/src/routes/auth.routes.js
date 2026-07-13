const express = require('express');
const { register, login, googleLogin, logout, getMe, requestPasswordReset, verifyResetCode, resetPassword } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.get('/me', authenticate, getMe);
router.post('/logout', logout)

router.post('/request', requestPasswordReset);
router.post('/verify', verifyResetCode);
router.post('/reset', resetPassword)

module.exports = router;