const express = require('express');
const router = express.Router();

// Modular Route Handlers
const authRoutes = require('../modules/auth/routes/auth.routes');
const tagRoutes = require('../modules/auth/routes/tag.routes');
const baziRoutes = require('../modules/bazi/routes/bazi.routes');
const marriageRoutes = require('../modules/bazi/routes/marriage.routes');
const ichingRoutes = require('../modules/iching/routes/iching.routes');
const ziweiRoutes = require('../modules/ziwei/routes/ziwei.routes');
const dateRoutes = require('../modules/date/routes/date.routes');
const blogRoutes = require('../modules/blog/routes/blog.routes');
const adminRoutes = require('../modules/admin/routes/admin.routes');
const notificationRoutes = require('../modules/notification/routes/notification.routes');
const ttsRoutes = require('../modules/tts/routes/tts.routes');
const exportRoutes = require('../modules/export/routes/export.routes');
const historyRoutes = require('../modules/history/routes/history.routes');
const aiRoutes = require('./ai');

// Controllers for root routes & aliases
const IChingController = require('../modules/iching/controllers/IChingController');
const ConceptController = require('../modules/blog/controllers/ConceptController');
const BaziController = require('../modules/bazi/controllers/BaziController');
const MarriageController = require('../modules/bazi/controllers/MarriageController');
const DateController = require('../modules/date/controllers/DateController');

const rateLimiter = require('../core/middleware/rateLimiter');

// Rate limiters
const calcLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: 'Bạn đã thực hiện quá nhiều lượt lập số lý/quẻ dịch. Vui lòng thử lại sau.'
});

const globalApiLimiter = rateLimiter({
    windowMs: 5 * 60 * 1000,
    max: 300,
    message: 'Hệ thống phát hiện tần suất yêu cầu bất thường từ địa chỉ mạng của bạn. Vui lòng thử lại sau vài phút.'
});

router.use(globalApiLimiter);

// Module routers
router.use('/auth', authRoutes);
router.use('/tags', tagRoutes);
router.use('/bazi', baziRoutes);
router.use('/marriage', marriageRoutes);
router.use('/iching', ichingRoutes);
router.use('/ziwei', ziweiRoutes);
router.use('/tu-vi', ziweiRoutes); // legacy alias
router.use('/date', dateRoutes);
router.use('/blog', blogRoutes);
router.use('/admin', adminRoutes);
router.use('/notifications', notificationRoutes);
router.use('/tts', ttsRoutes);
router.use('/export', exportRoutes);
router.use('/history', historyRoutes);
router.use('/ai', aiRoutes);

// Root calculation aliases and legacy routes
router.post('/iching/calculate', calcLimiter, IChingController.calculate);
router.post('/hexagrams/calculate', calcLimiter, IChingController.calculate);
router.post('/calculate', calcLimiter, IChingController.calculate);

router.get('/concept/:term', ConceptController.getConcept);
router.post('/bazi/analyze', calcLimiter, BaziController.analyze);
router.post('/marriage/analyze', calcLimiter, MarriageController.analyze);
router.post('/date/check', calcLimiter, DateController.check);
router.post('/date/consult', calcLimiter, DateController.consult);

module.exports = router;
