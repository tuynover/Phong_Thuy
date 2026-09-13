const express = require('express');
const router = express.Router();
const HistoryController = require('../controllers/HistoryController');
const IChingAiController = require('../../iching/controllers/IChingAiController');
const BaziAiController = require('../../bazi/controllers/BaziAiController');
const ZiweiAiController = require('../../ziwei/controllers/ZiweiAiController');
const MarriageAiController = require('../../bazi/controllers/MarriageAiController');
const rateLimiter = require('../../../core/middleware/rateLimiter');
const creditCheck = require('../../../core/middleware/creditCheck');

// Giới hạn 20 lượt gọi AI luận giải hoặc chat hỏi đáp trong 15 phút
const aiLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: 'Bạn đã gửi quá nhiều yêu cầu luận giải AI. Vui lòng thử lại sau.'
});

const optionalAuth = require('../../../core/middleware/optionalAuth');
const checkRecordOwnership = require('../../../core/middleware/checkRecordOwnership');
const checkHistoryOwnership = require('../../../core/middleware/checkHistoryOwnership');
const chatCreditCheck = require('../../../core/middleware/chatCreditCheck');
const auth = require('../../../core/middleware/auth');

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

// Unified All Systems History endpoint
router.get('/all/:userId', optionalAuth, checkHistoryOwnership, HistoryController.getAllHistory);
router.get('/', auth, (req, res) => {
  req.params.userId = req.dbUser.id || req.dbUser._id;
  return HistoryController.getAllHistory(req, res);
});

// Backwards compatibility for legacy chat and stream endpoints
router.post('/iching/:id/interpret', optionalAuth, checkRecordOwnership, aiLimiter, creditCheck, IChingAiController.interpretHexagram);
router.post('/hexagrams/:id/interpret', optionalAuth, checkRecordOwnership, aiLimiter, creditCheck, IChingAiController.interpretHexagram);
router.post('/bazi/:id/interpret', optionalAuth, checkRecordOwnership, aiLimiter, creditCheck, BaziAiController.interpretBazi);
router.post('/ziwei/:id/interpret', optionalAuth, checkRecordOwnership, aiLimiter, creditCheck, ZiweiAiController.interpretZiwei);
router.post('/marriage/:id/interpret', optionalAuth, checkRecordOwnership, aiLimiter, creditCheck, MarriageAiController.interpretMarriage);

router.post('/iching/:id/chat', chatCreditCheck, checkRecordOwnership, aiLimiter, IChingAiController.chatHexagram);
router.post('/hexagrams/:id/chat', chatCreditCheck, checkRecordOwnership, aiLimiter, IChingAiController.chatHexagram);
router.post('/bazi/:id/chat', chatCreditCheck, checkRecordOwnership, aiLimiter, BaziAiController.chatBazi);
router.post('/ziwei/:id/chat', chatCreditCheck, checkRecordOwnership, aiLimiter, ZiweiAiController.chatZiwei);
router.post('/marriage/:id/chat', chatCreditCheck, checkRecordOwnership, aiLimiter, MarriageAiController.chatMarriage);

router.delete('/calculations/:type/:id', auth, HistoryController.deleteCalculation);
router.delete('/:type/:id', auth, HistoryController.deleteCalculation);
router.put('/calculations/:type/:id/pin', auth, HistoryController.pinCalculation);
router.put('/toggle-pin/:type/:id', auth, HistoryController.pinCalculation);
router.put('/calculations/:type/:id/public', auth, HistoryController.togglePublicCalculation);
router.put('/toggle-public/:type/:id', auth, HistoryController.togglePublicCalculation);

module.exports = router;
