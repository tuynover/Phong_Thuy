const rateLimitCache = new Map();

// Tự động dọn dẹp bộ nhớ đệm mỗi 15 phút để tránh rò rỉ bộ nhớ
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitCache.entries()) {
        if (now > value.resetTime) {
            rateLimitCache.delete(key);
        }
    }
}, 15 * 60 * 1000);

/**
 * Middleware Rate Limiter nhẹ nhàng dùng bộ nhớ RAM
 * @param {Object} options
 * @param {number} options.windowMs - Khoảng thời gian giới hạn (ms)
 * @param {number} options.max - Số lượng yêu cầu tối đa trong khoảng thời gian
 * @param {string} options.message - Thông báo trả về khi vượt quá giới hạn
 */
const rateLimiter = ({ windowMs = 15 * 60 * 1000, max = 100, message } = {}) => {
    return (req, res, next) => {
        if (process.env.NODE_ENV === 'test') {
            return next();
        }
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        // Kết hợp IP và đường dẫn route cụ thể để giới hạn riêng biệt từng endpoint
        const key = `${req.baseUrl || ''}${req.path}_${ip}`;
        
        const now = Date.now();
        const record = rateLimitCache.get(key) || { count: 0, resetTime: now + windowMs };
        
        if (now > record.resetTime) {
            record.count = 1;
            record.resetTime = now + windowMs;
        } else {
            record.count += 1;
        }
        
        rateLimitCache.set(key, record);
        
        // Thiết lập header giới hạn (Standard RateLimit headers)
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
};

module.exports = rateLimiter;
