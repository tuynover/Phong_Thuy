const express = require('express');
const router = express.Router();
const BaziController = require('../controllers/BaziController');
const BaziAiController = require('../controllers/BaziAiController');
const BaziHistoryController = require('../controllers/BaziHistoryController');

const optionalAuth = require('../../../core/middleware/optionalAuth');
const auth = require('../../../core/middleware/auth');
const checkRecordOwnership = require('../../../core/middleware/checkRecordOwnership');
const checkHistoryOwnership = require('../../../core/middleware/checkHistoryOwnership');
const creditCheck = require('../../../core/middleware/creditCheck');
const chatRateLimiter = require('../../../core/middleware/chatRateLimiter');
const chatCreditCheck = require('../../../core/middleware/chatCreditCheck');
const antiSpamLock = require('../../../core/middleware/antiSpamLock');
const rateLimiter = require('../../../core/middleware/rateLimiter');

const calcLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: 'Bạn đã thực hiện quá nhiều lượt lập số lý/quẻ dịch. Vui lòng thử lại sau.'
});

// Calculation
router.post('/analyze', calcLimiter, BaziController.analyze);

// AI Interpretation & Chat
router.post('/:id/interpret', optionalAuth, checkRecordOwnership, antiSpamLock(), creditCheck, BaziAiController.interpretBazi);
router.post('/:id/chat', optionalAuth, checkRecordOwnership, chatRateLimiter, chatCreditCheck, BaziAiController.chatBazi);

// History & Record Management
router.get('/record/:id', optionalAuth, checkRecordOwnership, BaziHistoryController.getBaziRecord);
router.get('/history/:userId', optionalAuth, checkHistoryOwnership, BaziHistoryController.getBaziHistory);
router.get('/:userId', optionalAuth, checkHistoryOwnership, BaziHistoryController.getBaziHistory);
router.put('/:id/rate', optionalAuth, checkRecordOwnership, BaziHistoryController.rateBazi);
router.put('/:id/link', auth, BaziHistoryController.linkBazi);
router.get('/:id/messages', optionalAuth, checkRecordOwnership, BaziHistoryController.getBaziChatMessages);

module.exports = router;
