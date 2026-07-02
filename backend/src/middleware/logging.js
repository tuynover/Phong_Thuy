const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../services/LoggerService');
const SystemLog = require('../models/SystemLog');
const MemoryCacheService = require('../services/MemoryCacheService');

// Helper to resolve user info from JWT token or params/body
async function resolveUser(req) {
    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }

    let userId = null;
    let email = null;
    let name = null;

    // 1. Try decoding JWT token
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
            const uid = decoded.user?.id || decoded.id;
            if (uid) {
                userId = uid;
            }
        } catch (err) {
            // Token invalid or expired, ignore
        }
    }

    // 2. Fallback to userId in body, query, or params
    if (!userId) {
        userId = req.body?.userId || req.query?.userId || req.params?.userId;
    }

    if (userId) {
        if (userId === 'guest') {
            return { display: 'guest', id: 'guest' };
        }

        // Check cache first
        const cachedUser = MemoryCacheService.get(`user_resolve:${userId}`);
        if (cachedUser) {
            return cachedUser;
        }

        // Check if it's a valid MongoDB ObjectId or UUID before querying
        if (userId.match(/^[0-9a-fA-F]{24}$/) || userId.match(/^[0-9a-fA-F-]{36}$/)) {
            try {
                const user = await User.findById(userId).select('email name').lean();
                if (user) {
                    const userInfo = {
                        display: `${user.email} (${user.name})`,
                        id: userId,
                        email: user.email,
                        name: user.name
                    };
                    MemoryCacheService.set(`user_resolve:${userId}`, userInfo, 300000); // cache for 5 minutes
                    return userInfo;
                }
            } catch (err) {
                // Ignore query error
            }
        }
        return { display: `id:${userId}`, id: userId };
    }

    // 3. Special case for login/registration where user is in req.body.email
    if (req.body && req.body.email) {
        return { display: req.body.email, email: req.body.email };
    }

    return { display: 'anonymous', id: 'anonymous' };
}

// Map request path to beautiful human-readable actions
function getActionName(req) {
    const { method, path } = req;
    
    if (path.includes('/auth/register')) return 'Đăng ký tài khoản';
    if (path.includes('/auth/login')) return 'Đăng nhập';
    if (path.includes('/auth/bazi') && method === 'PUT') return 'Cập nhật Giờ Sinh Bát Tự';
    if (path.includes('/auth/profile') && method === 'PUT') return 'Cập nhật Hồ Sơ Cá Nhân';
    if (path.includes('/auth/appeal') && method === 'POST') return 'Gửi Đơn Khiếu Nại Tài Khoản';
    
    if (path.includes('/calculate')) return 'Gieo Quẻ Kinh Dịch';
    if (path.includes('/bazi/analyze')) return 'Lập Bản Đồ Bát Tự';
    if (path.includes('/tu-vi') && method === 'POST' && !path.includes('/interpret') && !path.includes('/chat')) return 'Lập Bản Đồ Tử Vi';
    
    if (path.includes('/history/hexagrams') && method === 'GET') return 'Xem Lịch Sử Kinh Dịch';
    if (path.includes('/history/bazi') && method === 'GET') return 'Xem Lịch Sử Bát Tự';
    if (path.includes('/tu-vi/history') && method === 'GET') return 'Xem Lịch Sử Tử Vi';
    
    if (path.includes('/history/hexagrams') && path.includes('/rate') && method === 'PUT') return 'Đánh giá Quẻ Dịch';
    if (path.includes('/history/bazi') && path.includes('/rate') && method === 'PUT') return 'Đánh giá Lá Số Bát Tự';
    if (path.includes('/tu-vi') && path.includes('/rate') && method === 'PUT') return 'Đánh giá Lá Số Tử Vi';
    
    if (path.includes('/history/hexagrams') && path.includes('/link') && method === 'PUT') return 'Liên kết Lịch Sử Quẻ';
    if (path.includes('/history/bazi') && path.includes('/link') && method === 'PUT') return 'Liên kết Lịch Sử Bát Tự';
    
    if (path.includes('/history/hexagrams') && path.includes('/interpret') && method === 'POST') return 'Luận Giải Kinh Dịch AI';
    if (path.includes('/history/bazi') && path.includes('/interpret') && method === 'POST') return 'Luận Giải Bát Tự AI';
    if (path.includes('/tu-vi') && path.includes('/interpret') && method === 'POST') return 'Luận Giải Tử Vi AI';
    
    if (path.includes('/history/hexagrams') && path.includes('/chat') && method === 'POST') return 'Trò Chuyện Quẻ Dịch AI';
    if (path.includes('/history/bazi') && path.includes('/chat') && method === 'POST') return 'Trò Chuyện Bát Tự AI';
    if (path.includes('/tu-vi') && path.includes('/chat') && method === 'POST') return 'Trò Chuyện Tử Vi AI';
    
    if (path.includes('/concept/')) return 'Tra Cứu Học Thuật Phong Thủy';

    return `${method} ${path}`;
}

const auditLogger = (req, res, next) => {
    // Skip logging for lightweight health check endpoint to keep logs clean
    if (req.path === '/health' || req.originalUrl === '/health') {
        return next();
    }
    
    // Call next immediately to avoid blocking express request processing
    next();

    const start = Date.now();
    const action = getActionName(req);
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    
    // Create copy of body for async logging
    const bodyCopy = req.body ? { ...req.body } : null;
    if (bodyCopy && bodyCopy.password) bodyCopy.password = '******';
    const requestDetail = bodyCopy && Object.keys(bodyCopy).length > 0 ? ` | Params: ${JSON.stringify(bodyCopy)}` : "";

    // Capture response completion asynchronously
    res.on('finish', async () => {
        let userDetails = { display: 'anonymous' };
        try {
            userDetails = await resolveUser(req);
        } catch (e) {
            // Ignore error
        }

        const context = {
            user: userDetails.display,
            action: action,
            ip: ip
        };

        // Log request entry
        logger.info(`Yêu cầu bắt đầu: ${req.method} ${req.originalUrl}${requestDetail}`, context);

        const duration = Date.now() - start;
        const finalContext = { ...context, duration };
        const status = res.statusCode;

        // Asynchronously save log entry to MongoDB
        SystemLog.create({
            userId: userDetails.id || 'anonymous',
            email: userDetails.email || '',
            name: userDetails.name || '',
            ip: ip,
            action: action,
            method: req.method,
            path: req.originalUrl,
            statusCode: status,
            duration: duration,
            requestParams: bodyCopy && Object.keys(bodyCopy).length > 0 ? bodyCopy : null
        }).catch(err => {
            console.error('[auditLogger] Failed to write SystemLog:', err);
        });

        if (status >= 500) {
            logger.error(`Thất bại: Phản hồi lỗi hệ thống (${status})`, null, finalContext);
        } else if (status >= 400) {
            logger.warn(`Cảnh báo: Yêu cầu không hợp lệ hoặc bị từ chối (${status})`, finalContext);
        } else {
            logger.info(`Hoàn thành: Phản hồi thành công (${status})`, finalContext);
        }
    });
};

module.exports = auditLogger;
