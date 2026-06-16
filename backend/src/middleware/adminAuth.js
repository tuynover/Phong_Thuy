const jwt = require('jsonwebtoken');
const User = require('../models/User');

const adminAuth = async (req, res, next) => {
  try {
    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({ error: 'Quyền truy cập bị từ chối. Không tìm thấy token.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const userId = decoded.user?.id || decoded.id;
    if (!userId) {
      return res.status(401).json({ error: 'Token không hợp lệ.' });
    }

    const user = await User.findById(userId);
    if (!user || user.isDeleted) {
      return res.status(401).json({ error: 'Người dùng không tồn tại.' });
    }

    if (user.status === 'locked') {
      return res.status(403).json({ error: 'Tài khoản của bạn đã bị khóa.' });
    }

    if (user.role !== 'admin' && user.role !== 'co-admin') {
      return res.status(403).json({ error: 'Quyền truy cập bị từ chối. Bạn không phải quản trị viên.' });
    }

    // Attach user and authority checker helper
    req.user = user;
    req.hasAuthorityOver = (targetUser) => {
      if (user.role === 'admin') return true;
      if (user.role === 'co-admin') {
        // co-admin can only manage 'user' and 'vip' roles
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
