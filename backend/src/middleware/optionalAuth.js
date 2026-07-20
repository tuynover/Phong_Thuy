const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getUserProfileCache, setUserProfileCache } = require('../config/redis');

module.exports = async (req, res, next) => {
  let token = null;
  const authHeader = req.header('Authorization');
  if (authHeader) {
    token = authHeader.replace('Bearer ', '');
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.user?.id || decoded.user?._id || decoded.id;
    const tokenVersion = decoded.user?.tokenVersion;

    if (userId) {
      // 1. Check Redis cache first
      let dbUser = await getUserProfileCache(userId);
      
      // 2. Fallback to MongoDB
      if (!dbUser) {
        const mongoUser = await User.findById(userId);
        if (mongoUser) {
          dbUser = mongoUser.toObject ? mongoUser.toObject() : mongoUser;
          setUserProfileCache(userId, dbUser);
        }
      }

      if (dbUser && !dbUser.isDeleted && dbUser.status !== 'locked') {
        const currentTokenVersion = dbUser.tokenVersion || 0;
        const payloadTokenVersion = tokenVersion !== undefined ? tokenVersion : 0;
        
        if (payloadTokenVersion === currentTokenVersion) {
          dbUser.id = dbUser.id || dbUser._id;
          dbUser._id = dbUser._id || dbUser.id;
          req.user = decoded.user;
          req.dbUser = dbUser;
        }

      }
    }
    next();
  } catch (err) {
    // Optional auth - proceed without setting user if token is expired or invalid
    next();
  }
};

