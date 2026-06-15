const jwt = require('jsonwebtoken');
const User = require('../models/User');

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
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    } catch (err) {
      return res.status(401).json({ error: 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.' });
    }

    const userId = decoded.user?.id || decoded.id;
    if (!userId) {
      return res.status(401).json({ error: 'Token không hợp lệ.' });
    }

    const user = await User.findById(userId);
    if (!user || user.isDeleted) {
      return res.status(401).json({ error: 'Tài khoản không tồn tại.' });
    }

    if (user.status === 'locked') {
      return res.status(403).json({ 
        error: `Tài khoản của bạn đã bị khóa. Lý do: ${user.lockReason || 'Không có'}` 
      });
    }

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

    req.user = updatedUser;
    next();
  } catch (error) {
    console.error('[creditCheck] Error:', error);
    return res.status(500).json({ error: 'Lỗi kiểm tra lượt sử dụng.' });
  }
};

module.exports = creditCheck;
