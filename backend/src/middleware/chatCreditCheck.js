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

    const currentTokenVersion = user.tokenVersion || 0;
    const payloadTokenVersion = tokenVersion !== undefined ? tokenVersion : 0;
    if (payloadTokenVersion !== currentTokenVersion) {
      return res.status(401).json({ error: 'Phiên đăng nhập đã hết hạn hoặc đã đăng xuất.' });
    }

    // Bypass check for admins and co-admins
    if (user.role === 'admin' || user.role === 'co-admin') {
      req.user = decoded.user || user;
      req.dbUser = user;
      return next();
    }

    // Atomic check: require at least 0.5 credits
    const updatedUser = await User.findOneAndUpdate(
      { _id: userId, credits: { $gte: 0.5 } },
      { $inc: { credits: -0.5 } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(402).json({ 
        error: 'Số credit của bạn không đủ để tiếp tục trò chuyện (cần tối thiểu 0.5 credit). Vui lòng quay lại vào hôm sau hoặc nạp thêm credit.' 
      });
    }

    setUserProfileCache(userId, updatedUser);

    req.user = decoded.user || updatedUser;
    req.dbUser = updatedUser;
    next();
  } catch (error) {
    console.error('[chatCreditCheck] Error:', error);
    return res.status(500).json({ error: 'Lỗi kiểm tra lượt sử dụng chat.' });
  }
};
