const express = require('express');
const router = express.Router();
const TtsController = require('../controllers/TtsController');
const rateLimiter = require('../../../core/middleware/rateLimiter');

// Giới hạn 20 yêu cầu TTS trong 1 phút để chống lạm dụng băng thông và tài nguyên CPU/mạng
const ttsLimiter = rateLimiter({
    windowMs: 60 * 1000,
    max: 20,
    message: 'Bạn đang yêu cầu phát giọng đọc quá nhanh. Vui lòng đợi một chút trước khi thử lại.'
});

router.get('/', ttsLimiter, TtsController.synthesize);
router.post('/chapter', ttsLimiter, TtsController.synthesizeChapter);
router.get('/chapter', ttsLimiter, TtsController.synthesizeChapter);
router.post('/ticket', ttsLimiter, TtsController.createStreamTicket);
router.get('/stream/:ticketId', TtsController.streamAudioTicket);

module.exports = router;
