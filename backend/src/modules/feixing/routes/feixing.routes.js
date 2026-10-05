const express = require('express');
const router = express.Router();
const FeiXingController = require('../controllers/FeiXingController');
const optionalAuth = require('../../../core/middleware/optionalAuth');
const auth = require('../../../core/middleware/auth');
const checkRecordOwnership = require('../../../core/middleware/checkRecordOwnership');
const rateLimiter = require('../../../core/middleware/rateLimiter');

const calcLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Bạn đã thực hiện quá nhiều lượt lập tinh bàn Huyền Không. Vui lòng thử lại sau.'
});

// Lập tinh bàn Huyền Không Phi Tinh
router.post('/calculate', calcLimiter, optionalAuth, FeiXingController.calculate);

// Lấy chi tiết bản ghi
router.get('/record/:id', optionalAuth, checkRecordOwnership, FeiXingController.getRecord);

// Lấy danh sách lịch sử theo User ID
router.get('/history/:userId', optionalAuth, FeiXingController.getHistory);

// Đánh giá bản ghi
router.post('/record/:id/rate', optionalAuth, checkRecordOwnership, FeiXingController.rateRecord);

// Bật/tắt công khai
router.post('/record/:id/toggle-public', auth, FeiXingController.togglePublic);

// Xóa mềm bản ghi
router.delete('/record/:id', auth, FeiXingController.deleteRecord);

module.exports = router;
