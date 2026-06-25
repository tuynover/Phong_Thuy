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

// IChing (Kinh Dịch) endpoints
router.get('/iching/record/:id', HistoryController.getHexagramRecord);
router.get('/iching/:userId', HistoryController.getHexagramHistory);
router.put('/iching/:id/rate', HistoryController.rateHexagram);
router.put('/iching/:id/link', HistoryController.linkHexagram);
router.get('/iching/:id/messages', HistoryController.getHexagramChatMessages);

// Legacy Hexagrams endpoints (alias for iching)
router.get('/hexagrams/record/:id', HistoryController.getHexagramRecord);
router.get('/hexagrams/:userId', HistoryController.getHexagramHistory);
router.put('/hexagrams/:id/rate', HistoryController.rateHexagram);
router.put('/hexagrams/:id/link', HistoryController.linkHexagram);
router.get('/hexagrams/:id/messages', HistoryController.getHexagramChatMessages);

// Bazi (Bát Tự) endpoints
router.get('/bazi/record/:id', HistoryController.getBaziRecord);
router.get('/bazi/:userId', HistoryController.getBaziHistory);
router.put('/bazi/:id/rate', HistoryController.rateBazi);
router.put('/bazi/:id/link', HistoryController.linkBazi);
router.get('/bazi/:id/messages', HistoryController.getBaziChatMessages);

// Ziwei (Tử Vi) endpoints
router.get('/ziwei/record/:id', HistoryController.getZiweiRecord);
router.get('/ziwei/:userId', HistoryController.getZiweiHistory);
router.put('/ziwei/:id/rate', HistoryController.rateZiwei);
router.put('/ziwei/:id/link', HistoryController.linkZiwei);
router.get('/ziwei/:id/messages', HistoryController.getZiweiChatMessages);

// Backwards compatibility for legacy chat and stream endpoints
router.post('/iching/:id/interpret', aiLimiter, creditCheck, AiInterpretationController.interpretHexagram);
router.post('/hexagrams/:id/interpret', aiLimiter, creditCheck, AiInterpretationController.interpretHexagram);
router.post('/bazi/:id/interpret', aiLimiter, creditCheck, AiInterpretationController.interpretBazi);
router.post('/ziwei/:id/interpret', aiLimiter, creditCheck, AiInterpretationController.interpretZiwei);

router.post('/iching/:id/chat', aiLimiter, AiInterpretationController.chatHexagram);
router.post('/hexagrams/:id/chat', aiLimiter, AiInterpretationController.chatHexagram);
router.post('/bazi/:id/chat', aiLimiter, AiInterpretationController.chatBazi);
router.post('/ziwei/:id/chat', aiLimiter, AiInterpretationController.chatZiwei);

const auth = require('../middleware/auth');
router.delete('/calculations/:type/:id', auth, HistoryController.deleteCalculation);

module.exports = router;
