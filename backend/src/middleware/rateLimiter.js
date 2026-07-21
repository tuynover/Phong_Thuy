const { redisClient, isRedisConnected, withTimeout } = require('../config/redis');
const logger = require('../services/LoggerService');

const rateLimitCache = new Map();

// Tự động dọn dẹp bộ nhớ đệm RAM mỗi 15 phút để tránh rò rỉ bộ nhớ
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitCache.entries()) {
        if (now > value.resetTime) {
            rateLimitCache.delete(key);
        }
    }
}, 15 * 60 * 1000);

/**
 * Fallback rate limiter sử dụng bộ nhớ đệm RAM (JavaScript Map)
 */
const fallbackMemoryRateLimiter = (req, res, next, key, windowMs, max, message) => {
    const now = Date.now();
    const record = rateLimitCache.get(key) || { count: 0, resetTime: now + windowMs };
    
    if (now > record.resetTime) {
        record.count = 1;
        record.resetTime = now + windowMs;
    } else {
        record.count += 1;
    }
    
    rateLimitCache.set(key, record);
    
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));
    
    if (record.count > max) {
        res.setHeader('Retry-After', Math.ceil((record.resetTime - now) / 1000));
        return res.status(429).json({
            error: message || 'Bạn đã gửi quá nhiều yêu cầu lên hệ thống. Vui lòng thử lại sau.'
        });
    }
    
    next();
};

/**
 * Middleware Rate Limiter nhẹ nhàng (Hybrid: Ưu tiên Redis -> Fallback RAM)
 * @param {Object} options
 * @param {number} options.windowMs - Khoảng thời gian giới hạn (ms)
 * @param {number} options.max - Số lượng yêu cầu tối đa trong khoảng thời gian
 * @param {string} options.message - Thông báo trả về khi vượt quá giới hạn
 */
const rateLimiter = ({ windowMs = 15 * 60 * 1000, max = 100, message } = {}) => {
    return async (req, res, next) => {
        if (process.env.NODE_ENV === 'test') {
            return next();
        }

        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        const keyRaw = `${req.baseUrl || ''}${req.path}_${ip}`;
        const redisKey = `ratelimit:${keyRaw}`;

        if (isRedisConnected()) {
            try {
                // Tăng đếm nguyên tử trên Redis với timeout 300ms
                const count = await withTimeout(redisClient.incr(redisKey), 300, null);
                
                if (count === null) {
                    // Redis timed out, fallback to memory
                    return fallbackMemoryRateLimiter(req, res, next, keyRaw, windowMs, max, message);
                }

                if (count === 1) {
                    // Đặt TTL cho key khi mới tạo
                    withTimeout(redisClient.pexpire(redisKey, windowMs), 300, null).catch(() => {});
                }

                let ttlMs = await withTimeout(redisClient.pttl(redisKey), 300, windowMs);
                if (!ttlMs || ttlMs < 0) ttlMs = windowMs;

                const resetTimeSec = Math.ceil((Date.now() + ttlMs) / 1000);
                const retryAfterSec = Math.ceil(ttlMs / 1000);

                res.setHeader('X-RateLimit-Limit', max);
                res.setHeader('X-RateLimit-Remaining', Math.max(0, max - count));
                res.setHeader('X-RateLimit-Reset', resetTimeSec);

                if (count > max) {
                    res.setHeader('Retry-After', retryAfterSec);
                    return res.status(429).json({
                        error: message || 'Bạn đã gửi quá nhiều yêu cầu lên hệ thống. Vui lòng thử lại sau.'
                    });
                }

                return next();
            } catch (err) {
                logger.warn(`[rateLimiter] Redis error: ${err.message}. Falling back to memory rate limiter.`);
                return fallbackMemoryRateLimiter(req, res, next, keyRaw, windowMs, max, message);
            }
        } else {
            return fallbackMemoryRateLimiter(req, res, next, keyRaw, windowMs, max, message);
        }
    };
};

module.exports = rateLimiter;
