const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getUserProfileCache, setUserProfileCache } = require('../config/redis');
const logger = require('../services/LoggerService');

module.exports = async (req, res, next) => {
  let token = null;
  const authHeader = req.header('Authorization');
  if (authHeader) {
    token = authHeader.replace('Bearer ', '');
  }

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.user?.id || decoded.user?._id || decoded.id;
    const tokenVersion = decoded.user?.tokenVersion;
    
    if (!userId) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    // 1. Check Redis cache first to bypass MongoDB query
    let dbUser = await getUserProfileCache(userId);
    
    // 2. Fallback to MongoDB if Redis cache miss or offline
    if (!dbUser) {
      const mongoUser = await User.findById(userId);
      if (mongoUser) {
        dbUser = mongoUser.toObject ? mongoUser.toObject() : mongoUser;
        // Populate Redis cache for subsequent requests
        await setUserProfileCache(userId, dbUser);
      }
    }

    // 3. Self-Healing: If cache returned a user whose tokenVersion does NOT match token,
    // the cache might be stale! Re-verify with MongoDB before rejecting!
    const payloadTokenVersion = tokenVersion !== undefined ? tokenVersion : 0;
    if (dbUser && (dbUser.tokenVersion || 0) !== payloadTokenVersion) {
      const freshMongoUser = await User.findById(userId);
      if (freshMongoUser) {
        dbUser = freshMongoUser.toObject ? freshMongoUser.toObject() : freshMongoUser;
        await setUserProfileCache(userId, dbUser);
      }
    }

    if (!dbUser || dbUser.isDeleted || dbUser.status === 'locked') {
      return res.status(401).json({ message: 'Tài khoản của bạn đã bị khóa hoặc bị xóa.' });
    }

    const currentTokenVersion = dbUser.tokenVersion || 0;

    if (payloadTokenVersion !== currentTokenVersion) {
      logger.warn(`[Auth] Token version mismatch for [${userId}]: payload=${payloadTokenVersion}, db=${currentTokenVersion}`);
      return res.status(401).json({ message: 'Phiên đăng nhập đã hết hạn hoặc đã đăng xuất.' });
    }

    dbUser.id = dbUser.id || dbUser._id;
    dbUser._id = dbUser._id || dbUser.id;
    req.user = decoded.user;
    req.dbUser = dbUser;
    next();

  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};
