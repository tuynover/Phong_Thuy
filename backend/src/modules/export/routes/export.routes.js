const express = require('express');
const router = express.Router();
const exportController = require('../controllers/ExportController');
const optionalAuth = require('../../../core/middleware/optionalAuth');
const rateLimiter = require('../../../core/middleware/rateLimiter');

// Rate limiter riêng cho xuất PDF: 15 lần trong 5 phút trên mỗi IP
const exportPdfLimiter = rateLimiter({
  windowMs: 5 * 60 * 1000,
  max: 15,
  message: 'Bạn đã yêu cầu xuất tệp PDF quá nhiều lần. Vui lòng chờ 5 phút trước khi tiếp tục.'
});

// Hỗ trợ cả GET (kèm query param ?scope=...) và POST (kèm body { scope: [...] })
router.get('/:type/:id/pdf', exportPdfLimiter, optionalAuth, (req, res) => exportController.exportPdf(req, res));
router.post('/:type/:id/pdf', exportPdfLimiter, optionalAuth, (req, res) => exportController.exportPdf(req, res));
router.get('/pdf/:type/:id', exportPdfLimiter, optionalAuth, (req, res) => exportController.exportPdf(req, res));
router.post('/pdf/:type/:id', exportPdfLimiter, optionalAuth, (req, res) => exportController.exportPdf(req, res));

module.exports = router;
