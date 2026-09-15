const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getUserProfileCache, setUserProfileCache } = require('../config/redis');

module.exports = async (req, res, next) => {
  try {
    let token = null;
    const authHeader = req.header('Authorization');
    if (authHeader) {
      token = authHeader.replace('Bearer ', '');
    }

    if (!token) {
      return res.status(401).json({ 
        error: 'Vui lòng đăng nhập để sử dụng tính năng trò chuyện AI.' 
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.' });
    }

    const userId = decoded.user?.id || decoded.user?._id || decoded.id;
    const tokenVersion = decoded.user?.tokenVersion;
    if (!userId) {
      return res.status(401).json({ error: 'Token không hợp lệ.' });
    }

    // 1. Check Redis cache first to bypass MongoDB query
    let user = await getUserProfileCache(userId);

    // 2. Fallback to MongoDB if cache miss
    if (!user) {
      const mongoUser = await User.findById(userId);
      if (mongoUser) {
        user = mongoUser.toObject ? mongoUser.toObject() : mongoUser;
        await setUserProfileCache(userId, user);
      }
    }

    // 3. Self-Healing: Re-verify with MongoDB if cached tokenVersion mismatches
    const payloadTokenVersion = tokenVersion !== undefined ? tokenVersion : 0;
    if (user && (user.tokenVersion || 0) !== payloadTokenVersion) {
      const freshMongoUser = await User.findById(userId);
      if (freshMongoUser) {
        user = freshMongoUser.toObject ? freshMongoUser.toObject() : freshMongoUser;
        await setUserProfileCache(userId, user);
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

    const currentTokenVersion = user.tokenVersion || 0;
    if (payloadTokenVersion !== currentTokenVersion) {
      return res.status(401).json({ error: 'Phiên đăng nhập đã hết hạn hoặc đã đăng xuất.' });
    }

    user.id = user.id || user._id;
    user._id = user._id || user.id;

    req.creditDecremented = false;
    req.refundChatCredit = async () => {
      if (req.creditDecremented && req.dbUser && (req.dbUser._id || req.dbUser.id)) {
        try {
          const refundId = req.dbUser._id || req.dbUser.id;
          const refundedUser = await User.findByIdAndUpdate(
            refundId,
            { $inc: { credits: 50 } },
            { new: true }
          );
          if (refundedUser) {
            await setUserProfileCache(refundId, refundedUser);
          }
          req.creditDecremented = false;
        } catch (e) {
          console.error('[chatCreditCheck] Refund chat credit error:', e);
        }
      }
    };

    // Bypass check for admins and co-admins
    if (user.role === 'admin' || user.role === 'co-admin') {
      req.user = user;
      req.dbUser = user;
      return next();
    }

    // Atomic check: require at least 50 points
    const updatedUser = await User.findOneAndUpdate(
      { _id: userId, credits: { $gte: 50 } },
      { $inc: { credits: -50 } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(402).json({ 
        error: 'Số point của bạn không đủ để tiếp tục trò chuyện (cần tối thiểu 50 points). Vui lòng quay lại vào hôm sau hoặc nạp thêm point.' 
      });
    }

    req.creditDecremented = true;

    // Response Interceptor: Auto-refund on error HTTP status >= 400
    res.on('finish', async () => {
      if (res.statusCode >= 400 && req.creditDecremented) {
        await req.refundChatCredit();
      }
    });

    await setUserProfileCache(userId, updatedUser);

    updatedUser.id = updatedUser.id || updatedUser._id;
    updatedUser._id = updatedUser._id || updatedUser.id;
    req.user = updatedUser;
    req.dbUser = updatedUser;
    next();
  } catch (error) {
    console.error('[chatCreditCheck] Error:', error);
    return res.status(500).json({ error: 'Lỗi kiểm tra lượt sử dụng chat.' });
  }
};
