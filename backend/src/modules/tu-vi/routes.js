const express = require('express');
const TuViController = require('./controller');
const router = express.Router();

// 1. Tạo lá số thô (Deterministic)
router.post('/', TuViController.createChart);

// 2. Yêu cầu giải đoán AI (Async via Queue)
router.post('/:id/interpret', TuViController.interpret);

// 3. Kiểm tra tiến trình ngầm (Job Status)
router.get('/jobs/:jobId', TuViController.checkJobStatus);

// 4. Lấy lịch sử lá số của người dùng
router.get('/history/:userId', TuViController.getHistory);

// 5. Lấy chi tiết lá số
router.get('/:id', TuViController.getRecordDetail);

// 6. Đánh giá lá số
router.put('/:id/rate', TuViController.rateRecord);

// 7. Trò chuyện và hỏi đáp (SSE Streaming & paginated scrolling messages)
router.get('/:id/messages', TuViController.getChatMessages);
router.post('/:id/chat', TuViController.chatFollowUp);

module.exports = router;
