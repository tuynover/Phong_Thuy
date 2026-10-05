const express = require('express');
const router = express.Router();
const NumerologyController = require('../controllers/NumerologyController');
const optionalAuth = require('../../../core/middleware/optionalAuth');
const auth = require('../../../core/middleware/auth');
const checkRecordOwnership = require('../../../core/middleware/checkRecordOwnership');
const rateLimiter = require('../../../core/middleware/rateLimiter');

const calcLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Bạn đã thực hiện quá nhiều lượt phân tích phong thủy số. Vui lòng thử lại sau.'
});

// Tính toán phong thủy số (Sim, Biển số xe, Tài khoản ngân hàng)
router.post('/calculate', calcLimiter, optionalAuth, NumerologyController.calculate);

// Lấy chi tiết bản ghi
router.get('/record/:id', optionalAuth, checkRecordOwnership, NumerologyController.getRecord);

// Lấy danh sách lịch sử theo User ID
router.get('/history/:userId', optionalAuth, NumerologyController.getHistory);

// Đánh giá bản ghi
router.post('/record/:id/rate', optionalAuth, checkRecordOwnership, NumerologyController.rateRecord);

// Bật/tắt công khai
router.post('/record/:id/toggle-public', auth, NumerologyController.togglePublic);

// Xóa mềm bản ghi
router.delete('/record/:id', auth, NumerologyController.deleteRecord);

module.exports = router;
