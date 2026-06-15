const express = require('express');
const router = express.Router();
const DivinationController = require('../controllers/DivinationController');
const ConceptController = require('../controllers/ConceptController');
const BaziController = require('../controllers/BaziController');
const authRoutes = require('./auth');
const historyRoutes = require('./history');
const aiRoutes = require('./ai');
const tuViRoutes = require('../modules/tu-vi/routes');
const notificationRoutes = require('./notifications');
const adminRoutes = require('./admin');
const rateLimiter = require('../middleware/rateLimiter');

// Giới hạn 30 lượt lập số lý/quẻ dịch trong 15 phút
const calcLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: 'Bạn đã thực hiện quá nhiều lượt lập số lý/quẻ dịch. Vui lòng thử lại sau.'
});

router.use('/auth', authRoutes);
router.use('/history', historyRoutes);
router.use('/ai', aiRoutes);
router.use('/tu-vi', tuViRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);

// Support both unified and legacy namespaces for calculate
router.post('/hexagrams/calculate', calcLimiter, DivinationController.calculate);
router.post('/calculate', calcLimiter, DivinationController.calculate);

router.get('/concept/:term', ConceptController.getConcept);
router.post('/bazi/analyze', calcLimiter, BaziController.analyze);

module.exports = router;
