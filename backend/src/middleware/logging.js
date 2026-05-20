const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../services/LoggerService');

// In-memory cache for user ID to email/name to optimize database queries
const userCache = new Map();

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
            if (decoded && decoded.user && decoded.user.id) {
                userId = decoded.user.id;
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
        if (userCache.has(userId)) {
            return userCache.get(userId);
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
                    userCache.set(userId, userInfo);
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
    
    if (path.includes('/calculate')) return 'Gieo Quẻ Kinh Dịch';
    if (path.includes('/bazi/analyze')) return 'Luận Giải Bản Đồ Bát Tự';
    
    if (path.includes('/history/hexagrams') && method === 'GET') return 'Xem Lịch Sử Kinh Dịch';
    if (path.includes('/history/bazi') && method === 'GET') return 'Xem Lịch Sử Bát Tự';
    
    if (path.includes('/history/hexagrams') && path.includes('/rate') && method === 'PUT') return 'Đánh giá Quẻ Dịch';
    if (path.includes('/history/bazi') && path.includes('/rate') && method === 'PUT') return 'Đánh giá Lá Số Bát Tự';
    
    if (path.includes('/history/hexagrams') && path.includes('/link') && method === 'PUT') return 'Liên kết Lịch Sử Quẻ';
    if (path.includes('/history/bazi') && path.includes('/link') && method === 'PUT') return 'Liên kết Lịch Sử Bát Tự';
    
    if (path.includes('/history/hexagrams') && path.includes('/interpret') && method === 'POST') return 'Thầy Dịch Giải Kinh Dịch';
    if (path.includes('/history/bazi') && path.includes('/interpret') && method === 'POST') return 'Thầy Luận Giải Bát Tự';
    
    if (path.includes('/concept/')) return 'Tra Cứu Học Thuật Phong Thủy';

    return `${method} ${path}`;
}

const auditLogger = async (req, res, next) => {
    const start = Date.now();
    const action = getActionName(req);
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    
    // Resolve user details asynchronously (non-blocking)
    let userDetails = { display: 'anonymous' };
    try {
        userDetails = await resolveUser(req);
    } catch (e) {
        // Resolve error
    }

    const context = {
        user: userDetails.display,
        action: action,
        ip: ip
    };

    // Construct a descriptive request detail string (masking passwords)
    let requestDetail = "";
    if (req.body && Object.keys(req.body).length > 0) {
        const bodyCopy = { ...req.body };
        if (bodyCopy.password) bodyCopy.password = '******';
        requestDetail = ` | Params: ${JSON.stringify(bodyCopy)}`;
    }

    // Log request entry
    logger.info(`Yêu cầu bắt đầu: ${req.method} ${req.originalUrl}${requestDetail}`, context);

    // Capture response completion
    res.on('finish', () => {
        const duration = Date.now() - start;
        const finalContext = { ...context, duration };
        const status = res.statusCode;

        if (status >= 500) {
            logger.error(`Thất bại: Phản hồi lỗi hệ thống (${status})`, null, finalContext);
        } else if (status >= 400) {
            logger.warn(`Cảnh báo: Yêu cầu không hợp lệ hoặc bị từ chối (${status})`, finalContext);
        } else {
            logger.info(`Hoàn thành: Phản hồi thành công (${status})`, finalContext);
        }
    });

    next();
};

module.exports = auditLogger;
