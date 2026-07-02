const express = require('express');
const ZiweiController = require('../controllers/ZiweiController');
const AiInterpretationController = require('../controllers/AiInterpretationController');
const HistoryController = require('../controllers/HistoryController');
const rateLimiter = require('../middleware/rateLimiter');
const creditCheck = require('../middleware/creditCheck');
const router = express.Router();

// Giới hạn 30 lượt lập mệnh bàn Tử Vi trong 15 phút
const calcLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: 'Bạn đã thực hiện quá nhiều lượt lập mệnh bàn Tử Vi. Vui lòng thử lại sau.'
});

// Giới hạn 20 lượt gọi AI luận giải hoặc chat hỏi đáp trong 15 phút
const aiLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: 'Bạn đã gửi quá nhiều yêu cầu luận giải AI. Vui lòng thử lại sau.'
});

// 1. Tạo lá số thô (Deterministic)
router.post('/', calcLimiter, ZiweiController.createChart);

// 2. Yêu cầu giải đoán AI (SSE Stream)
router.post('/:id/interpret', aiLimiter, creditCheck, AiInterpretationController.interpretZiwei);

// 4. Lấy lịch sử lá số của người dùng
router.get('/history/:userId', HistoryController.getZiweiHistory);

// 5. Lấy chi tiết lá số
router.get('/:id', HistoryController.getZiweiRecord);

// 6. Đánh giá lá số
router.put('/:id/rate', HistoryController.rateZiwei);

// 7. Trò chuyện và hỏi đáp (SSE Streaming & paginated scrolling messages)
router.get('/:id/messages', HistoryController.getZiweiChatMessages);
router.post('/:id/chat', aiLimiter, AiInterpretationController.chatZiwei);

module.exports = router;
