const express = require('express');
const router = express.Router();
const MarriageController = require('../controllers/MarriageController');
const MarriageAiController = require('../controllers/MarriageAiController');
const MarriageHistoryController = require('../controllers/MarriageHistoryController');

const optionalAuth = require('../../../core/middleware/optionalAuth');
const checkRecordOwnership = require('../../../core/middleware/checkRecordOwnership');
const checkHistoryOwnership = require('../../../core/middleware/checkHistoryOwnership');
const creditCheck = require('../../../core/middleware/creditCheck');
const chatCreditCheck = require('../../../core/middleware/chatCreditCheck');
const antiSpamLock = require('../../../core/middleware/antiSpamLock');
const rateLimiter = require('../../../core/middleware/rateLimiter');

const calcLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: 'Bạn đã thực hiện quá nhiều lượt lập số lý/quẻ dịch. Vui lòng thử lại sau.'
});

// Calculation
router.post('/analyze', calcLimiter, MarriageController.analyze);

// AI Interpretation & Chat
router.post('/:id/interpret', optionalAuth, checkRecordOwnership, antiSpamLock(), creditCheck, MarriageAiController.interpretMarriage);
router.post('/:id/chat', chatCreditCheck, checkRecordOwnership, MarriageAiController.chatMarriage);

// History & Record Management
router.get('/record/:id', optionalAuth, checkRecordOwnership, MarriageHistoryController.getMarriageRecord);
router.get('/history/:userId', optionalAuth, checkHistoryOwnership, MarriageHistoryController.getMarriageHistory);
router.get('/:userId', optionalAuth, checkHistoryOwnership, MarriageHistoryController.getMarriageHistory);
router.put('/:id/rate', optionalAuth, checkRecordOwnership, MarriageHistoryController.rateMarriage);
router.get('/:id/messages', optionalAuth, checkRecordOwnership, MarriageHistoryController.getMarriageChatMessages);

module.exports = router;
