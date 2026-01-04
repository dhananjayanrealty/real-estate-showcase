const express = require('express');
const router = express.Router();
const { login, logout, checkAuth } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

router.post('/login', login);
router.post('/logout', logout);
router.get('/check', authenticateToken, checkAuth);

module.exports = router;