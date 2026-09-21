const express = require('express');
const router = express.Router();
const DateController = require('../controllers/DateController');
const rateLimiter = require('../../../core/middleware/rateLimiter');

const calcLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: 'Bạn đã thực hiện quá nhiều lượt tra cứu ngày. Vui lòng thử lại sau.'
});

const optionalAuth = async (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader) return next();
    try {
        const token = authHeader.replace('Bearer ', '');
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.user?.id || decoded.user?._id || decoded.id;
        if (userId) {
            req.user = { id: userId, _id: userId };
            const { getUserProfileCache } = require('../../../core/config/redis');
            const User = require('../../../core/models/User');
            let dbUser = await getUserProfileCache(userId);
            if (!dbUser) {
                dbUser = await User.findById(userId);
            }
            if (dbUser) req.dbUser = dbUser;
        }
    } catch (e) {
        // ignore invalid token for optional auth
    }
    next();
};

const auth = require('../../../core/middleware/auth');

router.post('/check', calcLimiter, DateController.check);
router.post('/consult', calcLimiter, DateController.consult);
router.post('/almanac/month-calendar', optionalAuth, DateController.getPersonalizedMonthCalendar);
router.post('/almanac/day-detail', optionalAuth, DateController.getPersonalizedDayDetail);

module.exports = router;
