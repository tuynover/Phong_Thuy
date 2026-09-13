const express = require('express');
const router = express.Router();
const IChingController = require('../controllers/IChingController');
const ConceptController = require('../controllers/ConceptController');
const BaziController = require('../controllers/BaziController');
const MarriageController = require('../controllers/MarriageController');
const DateController = require('../controllers/DateController');
const TtsController = require('../controllers/TtsController');
const authRoutes = require('./auth');
const historyRoutes = require('./history');
const aiRoutes = require('./ai');
const ziweiRoutes = require('./ziwei');
const notificationRoutes = require('./notifications');
const adminRoutes = require('./admin');
const blogRoutes = require('./blog');
const tagRoutes = require('./tag');
const exportRoutes = require('./export');
const rateLimiter = require('../middleware/rateLimiter');

// Giới hạn 30 lượt lập số lý/quẻ dịch trong 15 phút
const calcLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: 'Bạn đã thực hiện quá nhiều lượt lập số lý/quẻ dịch. Vui lòng thử lại sau.'
});

// Giới hạn 20 yêu cầu TTS trong 1 phút để chống lạm dụng băng thông và tài nguyên CPU/mạng
const ttsLimiter = rateLimiter({
    windowMs: 60 * 1000,
    max: 20,
    message: 'Bạn đang yêu cầu phát giọng đọc quá nhanh. Vui lòng đợi một chút trước khi thử lại.'
});

// Giới hạn 300 yêu cầu trong 5 phút trên toàn bộ API để ngăn chặn bot cào dữ liệu và tấn công DoS
const globalApiLimiter = rateLimiter({
    windowMs: 5 * 60 * 1000,
    max: 300,
    message: 'Hệ thống phát hiện tần suất yêu cầu bất thường từ địa chỉ mạng của bạn. Vui lòng thử lại sau vài phút.'
});

router.use(globalApiLimiter);

router.use('/auth', authRoutes);
router.use('/history', historyRoutes);
router.use('/ai', aiRoutes);
router.use('/ziwei', ziweiRoutes);
router.use('/tu-vi', ziweiRoutes); // legacy alias
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);
router.use('/blog', blogRoutes);
router.use('/tags', tagRoutes);
router.use('/export', exportRoutes);

// Support both unified and legacy namespaces for calculate
router.post('/iching/calculate', calcLimiter, IChingController.calculate);
router.post('/hexagrams/calculate', calcLimiter, IChingController.calculate);
router.post('/calculate', calcLimiter, IChingController.calculate);

router.get('/concept/:term', ConceptController.getConcept);
router.post('/bazi/analyze', calcLimiter, BaziController.analyze);
router.post('/marriage/analyze', calcLimiter, MarriageController.analyze);
router.post('/date/check', calcLimiter, DateController.check);
router.post('/date/consult', calcLimiter, DateController.consult);
router.get('/tts', ttsLimiter, TtsController.synthesize);
router.post('/tts/chapter', ttsLimiter, TtsController.synthesizeChapter);
router.get('/tts/chapter', ttsLimiter, TtsController.synthesizeChapter);
router.post('/tts/ticket', ttsLimiter, TtsController.createStreamTicket);
router.get('/tts/stream/:ticketId', TtsController.streamAudioTicket);

module.exports = router;
