const { acquireRedisLock, releaseRedisLock } = require('../config/redis');

/**
 * Anti-Spam Mutex Lock Middleware
 * Chống race condition và click đúp trùng lặp cho các endpoint nhạy cảm
 * @param {Object} options 
 * @param {number} options.ttlMs Khoảng thời gian khóa tối đa (ms), mặc định 3000ms
 * @param {string} options.prefix Prefix cho lock key
 */
const antiSpamLock = ({ ttlMs = 3000, prefix = 'antispam' } = {}) => {
    return async (req, res, next) => {
        const userId = req.dbUser?.id || req.user?.id || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'guest';
        const routePath = req.baseUrl + req.path;
        const lockKey = `${prefix}:${routePath}:${userId}`;

        const acquired = await acquireRedisLock(lockKey, ttlMs);
        if (!acquired) {
            return res.status(429).json({
                error: 'Yêu cầu của bạn đang được xử lý. Vui lòng không nhấn liên tục.'
            });
        }

        // Tự động giải phóng lock khi request hoàn tất
        res.on('finish', () => {
            releaseRedisLock(lockKey);
        });

        next();
    };
};

module.exports = antiSpamLock;
