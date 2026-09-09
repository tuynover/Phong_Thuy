const express = require('express');
const router = express.Router();
const ExportController = require('../controllers/ExportController');
const optionalAuth = require('../middleware/optionalAuth');
const rateLimiter = require('../middleware/rateLimiter');

// Giới hạn 5 lượt xuất PDF trong 1 phút để bảo vệ tài nguyên máy chủ
const pdfExportLimiter = rateLimiter({
  windowMs: 60 * 1000,
  max: 5,
  message: 'Bạn đã yêu cầu xuất tệp PDF quá nhanh. Vui lòng đợi trong giây lát rồi thử lại.'
});

// Hỗ trợ cả GET (kèm query param scope) và POST (kèm body scope)
router.get('/pdf/:type/:id', optionalAuth, pdfExportLimiter, ExportController.exportPdf);
router.post('/pdf/:type/:id', optionalAuth, pdfExportLimiter, ExportController.exportPdf);

module.exports = router;
