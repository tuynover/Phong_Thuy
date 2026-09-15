const express = require('express');
const router = express.Router();
const IChingController = require('../controllers/IChingController');
const IChingAiController = require('../controllers/IChingAiController');
const IChingHistoryController = require('../controllers/IChingHistoryController');

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
router.post('/calculate', calcLimiter, IChingController.calculate);

// AI Interpretation & Chat
router.post('/:id/interpret', optionalAuth, checkRecordOwnership, antiSpamLock(), creditCheck, IChingAiController.interpretHexagram);
router.post('/:id/chat', optionalAuth, checkRecordOwnership, chatRateLimiter, chatCreditCheck, IChingAiController.chatHexagram);

// History & Record Management
router.get('/record/:id', optionalAuth, checkRecordOwnership, IChingHistoryController.getHexagramRecord);
router.get('/history/:userId', optionalAuth, checkHistoryOwnership, IChingHistoryController.getHexagramHistory);
router.get('/:userId', optionalAuth, checkHistoryOwnership, IChingHistoryController.getHexagramHistory);
router.put('/:id/rate', optionalAuth, checkRecordOwnership, IChingHistoryController.rateHexagram);
router.put('/:id/link', auth, IChingHistoryController.linkHexagram);
router.get('/:id/messages', optionalAuth, checkRecordOwnership, IChingHistoryController.getHexagramChatMessages);

module.exports = router;
