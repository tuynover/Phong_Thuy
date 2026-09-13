const express = require('express');
const router = express.Router();
const DateController = require('../controllers/DateController');
const rateLimiter = require('../../../core/middleware/rateLimiter');

const calcLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: 'Bạn đã thực hiện quá nhiều lượt tra cứu ngày. Vui lòng thử lại sau.'
});

router.post('/check', calcLimiter, DateController.check);
router.post('/consult', calcLimiter, DateController.consult);

module.exports = router;
