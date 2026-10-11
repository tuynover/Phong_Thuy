const express = require('express');
const router = express.Router();
const TrainingController = require('../controllers/TrainingController');
const adminAuth = require('../../../core/middleware/adminAuth');

// Các endpoint tra cứu và kích hoạt xuất dataset (Chỉ dành cho Admin / Co-Admin)
router.get('/status', adminAuth, TrainingController.getStatus);
router.post('/export/:system?', adminAuth, TrainingController.exportDataset);
router.post('/export-combined', adminAuth, TrainingController.exportCombined);

module.exports = router;
