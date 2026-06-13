const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const rateLimiter = require('../middleware/rateLimiter');

// Giới hạn 10 lần đăng ký/đăng nhập trong 15 phút để chống brute-force
const authLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Bạn đã thử đăng ký hoặc đăng nhập quá nhiều lần. Vui lòng quay lại sau 15 phút.'
});

router.post('/register', authLimiter, AuthController.register);
router.post('/login', authLimiter, AuthController.login);
router.put('/bazi', AuthController.updateBaziInfo);

module.exports = router;
