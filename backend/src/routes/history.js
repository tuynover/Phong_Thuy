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

const optionalAuth = require('../middleware/optionalAuth');
const checkRecordOwnership = require('../middleware/checkRecordOwnership');
const checkHistoryOwnership = require('../middleware/checkHistoryOwnership');
const chatCreditCheck = require('../middleware/chatCreditCheck');

// IChing (Kinh Dịch) endpoints
router.get('/iching/record/:id', optionalAuth, checkRecordOwnership, HistoryController.getHexagramRecord);
router.get('/iching/:userId', optionalAuth, checkHistoryOwnership, HistoryController.getHexagramHistory);
router.put('/iching/:id/rate', optionalAuth, checkRecordOwnership, HistoryController.rateHexagram);
router.put('/iching/:id/link', optionalAuth, checkRecordOwnership, HistoryController.linkHexagram);
router.get('/iching/:id/messages', optionalAuth, checkRecordOwnership, HistoryController.getHexagramChatMessages);

// Legacy Hexagrams endpoints (alias for iching)
router.get('/hexagrams/record/:id', optionalAuth, checkRecordOwnership, HistoryController.getHexagramRecord);
router.get('/hexagrams/:userId', optionalAuth, checkHistoryOwnership, HistoryController.getHexagramHistory);
router.put('/hexagrams/:id/rate', optionalAuth, checkRecordOwnership, HistoryController.rateHexagram);
router.put('/hexagrams/:id/link', optionalAuth, checkRecordOwnership, HistoryController.linkHexagram);
router.get('/hexagrams/:id/messages', optionalAuth, checkRecordOwnership, HistoryController.getHexagramChatMessages);

// Bazi (Bát Tự) endpoints
router.get('/bazi/record/:id', optionalAuth, checkRecordOwnership, HistoryController.getBaziRecord);
router.get('/bazi/:userId', optionalAuth, checkHistoryOwnership, HistoryController.getBaziHistory);
router.put('/bazi/:id/rate', optionalAuth, checkRecordOwnership, HistoryController.rateBazi);
router.put('/bazi/:id/link', optionalAuth, checkRecordOwnership, HistoryController.linkBazi);
router.get('/bazi/:id/messages', optionalAuth, checkRecordOwnership, HistoryController.getBaziChatMessages);

// Ziwei (Tử Vi) endpoints
router.get('/ziwei/record/:id', optionalAuth, checkRecordOwnership, HistoryController.getZiweiRecord);
router.get('/ziwei/:userId', optionalAuth, checkHistoryOwnership, HistoryController.getZiweiHistory);
router.put('/ziwei/:id/rate', optionalAuth, checkRecordOwnership, HistoryController.rateZiwei);
router.put('/ziwei/:id/link', optionalAuth, checkRecordOwnership, HistoryController.linkZiwei);
router.get('/ziwei/:id/messages', optionalAuth, checkRecordOwnership, HistoryController.getZiweiChatMessages);

// Marriage (Kết Hôn) endpoints
router.get('/marriage/record/:id', optionalAuth, checkRecordOwnership, HistoryController.getMarriageRecord);
router.get('/marriage/:userId', optionalAuth, checkHistoryOwnership, HistoryController.getMarriageHistory);
router.put('/marriage/:id/rate', optionalAuth, checkRecordOwnership, HistoryController.rateMarriage);
router.get('/marriage/:id/messages', optionalAuth, checkRecordOwnership, HistoryController.getMarriageChatMessages);

// Backwards compatibility for legacy chat and stream endpoints
router.post('/iching/:id/interpret', optionalAuth, checkRecordOwnership, aiLimiter, creditCheck, AiInterpretationController.interpretHexagram);
router.post('/hexagrams/:id/interpret', optionalAuth, checkRecordOwnership, aiLimiter, creditCheck, AiInterpretationController.interpretHexagram);
router.post('/bazi/:id/interpret', optionalAuth, checkRecordOwnership, aiLimiter, creditCheck, AiInterpretationController.interpretBazi);
router.post('/ziwei/:id/interpret', optionalAuth, checkRecordOwnership, aiLimiter, creditCheck, AiInterpretationController.interpretZiwei);
router.post('/marriage/:id/interpret', optionalAuth, checkRecordOwnership, aiLimiter, creditCheck, AiInterpretationController.interpretMarriage);

router.post('/iching/:id/chat', chatCreditCheck, checkRecordOwnership, aiLimiter, AiInterpretationController.chatHexagram);
router.post('/hexagrams/:id/chat', chatCreditCheck, checkRecordOwnership, aiLimiter, AiInterpretationController.chatHexagram);
router.post('/bazi/:id/chat', chatCreditCheck, checkRecordOwnership, aiLimiter, AiInterpretationController.chatBazi);
router.post('/ziwei/:id/chat', chatCreditCheck, checkRecordOwnership, aiLimiter, AiInterpretationController.chatZiwei);
router.post('/marriage/:id/chat', chatCreditCheck, checkRecordOwnership, aiLimiter, AiInterpretationController.chatMarriage);

const auth = require('../middleware/auth');
router.delete('/calculations/:type/:id', auth, HistoryController.deleteCalculation);
router.put('/calculations/:type/:id/pin', auth, HistoryController.pinCalculation);
router.put('/calculations/:type/:id/public', auth, HistoryController.togglePublicCalculation);

module.exports = router;
