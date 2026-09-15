const express = require('express');
const router = express.Router();
const ZiweiController = require('../controllers/ZiweiController');
const ZiweiAiController = require('../controllers/ZiweiAiController');
const ZiweiHistoryController = require('../controllers/ZiweiHistoryController');

const optionalAuth = require('../../../core/middleware/optionalAuth');
const auth = require('../../../core/middleware/auth');
const checkRecordOwnership = require('../../../core/middleware/checkRecordOwnership');
const checkHistoryOwnership = require('../../../core/middleware/checkHistoryOwnership');
const creditCheck = require('../../../core/middleware/creditCheck');
const chatRateLimiter = require('../../../core/middleware/chatRateLimiter');
const chatCreditCheck = require('../../../core/middleware/chatCreditCheck');
const rateLimiter = require('../../../core/middleware/rateLimiter');

// Rate limiters
const calcLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: 'Bạn đã thực hiện quá nhiều lượt tạo lá số. Vui lòng thử lại sau.'
});

const aiLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: 'Bạn đã gửi quá nhiều yêu cầu luận giải AI. Vui lòng thử lại sau.'
});

// 1. Tạo lá số thô (Deterministic)
router.post('/', calcLimiter, ZiweiController.createChart);
router.post('/calculate', calcLimiter, ZiweiController.createChart);

// 2. Yêu cầu giải đoán AI (SSE Stream)
router.post('/:id/interpret', optionalAuth, checkRecordOwnership, aiLimiter, creditCheck, ZiweiAiController.interpretZiwei);

// 3. Lấy lịch sử lá số của người dùng
router.get('/history/:userId', optionalAuth, checkHistoryOwnership, ZiweiHistoryController.getZiweiHistory);
router.get('/:userId', optionalAuth, checkHistoryOwnership, ZiweiHistoryController.getZiweiHistory);

// 4. Lấy chi tiết lá số & Liên kết
router.get('/record/:id', optionalAuth, checkRecordOwnership, ZiweiHistoryController.getZiweiRecord);
router.get('/:id', optionalAuth, checkRecordOwnership, ZiweiHistoryController.getZiweiRecord);
router.put('/:id/link', auth, ZiweiHistoryController.linkZiwei);

// 5. Đánh giá lá số
router.put('/:id/rate', optionalAuth, checkRecordOwnership, ZiweiHistoryController.rateZiwei);

// 6. Trò chuyện và hỏi đáp (SSE Streaming & paginated scrolling messages)
router.get('/:id/messages', optionalAuth, checkRecordOwnership, ZiweiHistoryController.getZiweiChatMessages);
router.post('/:id/chat', optionalAuth, checkRecordOwnership, chatRateLimiter, chatCreditCheck, aiLimiter, ZiweiAiController.chatZiwei);

module.exports = router;
