const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  let token = null;
  const authHeader = req.header('Authorization');
  if (authHeader) {
    token = authHeader.replace('Bearer ', '');
  } else if (req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const userId = decoded.user?.id || decoded.user?._id || decoded.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    const dbUser = await User.findById(userId);
    if (!dbUser || dbUser.isDeleted || dbUser.status === 'locked') {
      return res.status(401).json({ message: 'Tài khoản của bạn đã bị khóa hoặc bị xóa.' });
    }

    req.user = decoded.user;
    req.dbUser = dbUser;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};
