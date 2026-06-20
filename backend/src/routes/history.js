const express = require('express');
const router = express.Router();
const HistoryController = require('../controllers/HistoryController');
const AiInterpretationController = require('../controllers/AiInterpretationController');
const rateLimiter = require('../middleware/rateLimiter');
const creditCheck = require('../middleware/creditCheck');

// Giới hạn 20 lượt gọi AI luận giải hoặc chat hỏi đáp trong 15 phút
const aiLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: 'Bạn đã gửi quá nhiều yêu cầu luận giải AI. Vui lòng thử lại sau.'
});

// History core endpoints
router.get('/hexagrams/record/:id', HistoryController.getHexagramRecord);
router.get('/hexagrams/:userId', HistoryController.getHexagramHistory);
router.get('/bazi/:userId', HistoryController.getBaziHistory);
router.put('/hexagrams/:id/rate', HistoryController.rateHexagram);
router.put('/bazi/:id/rate', HistoryController.rateBazi);
router.put('/hexagrams/:id/link', HistoryController.linkHexagram);
router.put('/bazi/:id/link', HistoryController.linkBazi);
router.get('/hexagrams/:id/messages', HistoryController.getHexagramChatMessages);
router.get('/bazi/:id/messages', HistoryController.getBaziChatMessages);

// Backwards compatibility for legacy chat and stream endpoints
router.post('/hexagrams/:id/interpret', aiLimiter, creditCheck, AiInterpretationController.interpretHexagram);
router.post('/bazi/:id/interpret', aiLimiter, creditCheck, AiInterpretationController.interpretBazi);
router.post('/hexagrams/:id/chat', aiLimiter, AiInterpretationController.chatHexagram);
router.post('/bazi/:id/chat', aiLimiter, AiInterpretationController.chatBazi);

const auth = require('../middleware/auth');
router.delete('/calculations/:type/:id', auth, HistoryController.deleteCalculation);

module.exports = router;
