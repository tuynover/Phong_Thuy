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

const auth = require('../middleware/auth');

router.post('/register', authLimiter, AuthController.register);
router.post('/login', authLimiter, AuthController.login);
router.post('/google', authLimiter, AuthController.googleLogin);
router.put('/bazi', AuthController.updateBaziInfo);
router.put('/profile', AuthController.updateProfile);
router.post('/appeal', AuthController.submitAppeal);

const sseService = require('../services/SseService');

router.get('/me', auth, (req, res) => {
  res.json({
    id: req.dbUser.id,
    email: req.dbUser.email,
    name: req.dbUser.name,
    baziInfo: req.dbUser.baziInfo,
    gender: req.dbUser.gender,
    phone: req.dbUser.phone || "",
    role: req.dbUser.role,
    credits: req.dbUser.credits,
    status: req.dbUser.status,
    isDeleted: req.dbUser.isDeleted
  });
});

router.get('/events', auth, (req, res) => {
  sseService.addUserClient(req.dbUser.id || req.dbUser._id.toString(), req, res);
});

module.exports = router;
