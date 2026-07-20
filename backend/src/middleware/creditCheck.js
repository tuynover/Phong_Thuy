const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getUserProfileCache, setUserProfileCache } = require('../config/redis');

const creditCheck = async (req, res, next) => {
  try {
    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ 
        error: 'Vui lòng đăng nhập để sử dụng tính năng luận giải AI.' 
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.' });
    }

    const userId = decoded.user?.id || decoded.id;
    if (!userId) {
      return res.status(401).json({ error: 'Token không hợp lệ.' });
    }

    // 1. Try Redis cache first
    let user = await getUserProfileCache(userId);
    
    // 2. Fallback to Mongo if miss
    if (!user) {
      const mongoUser = await User.findById(userId);
      if (mongoUser) {
        user = mongoUser.toObject ? mongoUser.toObject() : mongoUser;
        setUserProfileCache(userId, user);
      }
    }

    if (!user || user.isDeleted) {
      return res.status(401).json({ error: 'Tài khoản không tồn tại.' });
    }

    if (user.status === 'locked') {
      return res.status(403).json({ 
        error: `Tài khoản của bạn đã bị khóa. Lý do: ${user.lockReason || 'Không có'}` 
      });
    }

    // Attach helper to refund credit if request fails or reads from cache
    req.creditDecremented = false;
    req.refundCredit = async () => {
      if (req.creditDecremented && req.user && req.user._id) {
        try {
          const refundedUser = await User.findByIdAndUpdate(
            req.user._id,
            { $inc: { credits: 1 } },
            { new: true }
          );
          if (refundedUser) {
            setUserProfileCache(req.user._id, refundedUser);
          }
          req.creditDecremented = false;
        } catch (e) {
          console.error('[creditCheck] Refund credit error:', e);
        }
      }
    };

    // Bypass check for admins and co-admins
    if (user.role === 'admin' || user.role === 'co-admin') {
      req.user = user;
      return next();
    }

    // Atomic credit decrement check
    const updatedUser = await User.findOneAndUpdate(
      { _id: userId, credits: { $gt: 0 } },
      { $inc: { credits: -1 } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(402).json({ 
        error: 'Lượt sử dụng của bạn = 0. Hãy chờ qua ngày mới để +1 lượt sử dụng hoặc nạp thêm tiền để có thể sử dụng luận giải ngay nhé.' 
      });
    }

    req.creditDecremented = true;

    // Response Interceptor: Auto-refund on error HTTP status >= 400
    res.on('finish', async () => {
      if (res.statusCode >= 400 && req.creditDecremented) {
        await req.refundCredit();
      }
    });

    // Synchronize updated credits to Redis profile cache
    setUserProfileCache(userId, updatedUser);

    req.user = updatedUser;
    next();
  } catch (error) {
    console.error('[creditCheck] Error:', error);
    return res.status(500).json({ error: 'Lỗi kiểm tra lượt sử dụng.' });
  }
};

module.exports = creditCheck;
