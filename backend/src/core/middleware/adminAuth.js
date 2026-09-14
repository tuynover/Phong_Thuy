const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getUserProfileCache, setUserProfileCache } = require('../config/redis');

const adminAuth = async (req, res, next) => {
  try {
    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ error: 'Quyền truy cập bị từ chối. Không tìm thấy token.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.user?.id || decoded.id;
    const tokenVersion = decoded.user?.tokenVersion;
    if (!userId) {
      return res.status(401).json({ error: 'Token không hợp lệ.' });
    }

    // 1. Try Redis cache first
    let user = await getUserProfileCache(userId);

    // 2. Fallback to MongoDB if miss
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
      return res.status(401).json({ error: 'Người dùng không tồn tại.' });
    }

    if (user.status === 'locked') {
      return res.status(403).json({ error: 'Tài khoản của bạn đã bị khóa.' });
    }

    const currentTokenVersion = user.tokenVersion || 0;
    if (payloadTokenVersion !== currentTokenVersion) {
      return res.status(401).json({ error: 'Phiên đăng nhập đã hết hạn hoặc đã đăng xuất.' });
    }

    if (user.role !== 'admin' && user.role !== 'co-admin') {
      return res.status(403).json({ error: 'Quyền truy cập bị từ chối. Bạn không phải quản trị viên.' });
    }

    // Attach user and authority checker helper
    user.id = user.id || user._id;
    user._id = user._id || user.id;
    req.user = user;

    req.hasAuthorityOver = (targetUser) => {
      if (user.role === 'admin') return true;
      if (user.role === 'co-admin') {
        return targetUser.role === 'user' || targetUser.role === 'vip';
      }
      return false;
    };

    next();
  } catch (error) {
    console.error('[adminAuth] Error:', error);
    return res.status(401).json({ error: 'Token hết hạn hoặc không hợp lệ.' });
  }
};

module.exports = adminAuth;
