const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../services/LoggerService');
const { OAuth2Client } = require('google-auth-library');
const BanAppeal = require('../models/BanAppeal');
const AdminNotification = require('../models/AdminNotification');
const sseService = require('../services/SseService');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const register = async (req, res) => {
  const { email, password, name, day, month, year, hour, minute, gender } = req.body;
  try {
    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      if (user.isDeleted) {
        // If soft deleted, we can reactivate or reject. Let's reject.
        return res.status(400).json({ message: 'Tài khoản đã bị xóa.' });
      }
      logger.warn(`Đăng ký thất bại: Tài khoản với email [${email}] đã tồn tại.`, { user: email, action: 'Đăng ký tài khoản' });
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    user = new User({
      email,
      password: hashedPassword,
      name,
      baziInfo: (day && month && year && hour && minute) ? {
        day: parseInt(day),
        month: parseInt(month),
        year: parseInt(year),
        hour: parseInt(hour),
        minute: parseInt(minute)
      } : undefined,
      gender: gender !== undefined ? parseInt(gender) : 1,
      role: 'user',
      credits: 1,
      status: 'active'
    });

    await user.save();
    logger.info(`Đăng ký tài khoản mới thành công cho email [${user.email}] (Tên: ${user.name}).`, { user: user.email, action: 'Đăng ký tài khoản' });

    // Create token
    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: { id: user.id, email: user.email, name: user.name, baziInfo: user.baziInfo, gender: user.gender, phone: user.phone || "", role: user.role, credits: user.credits, status: user.status } });
      }
    );
  } catch (err) {
    logger.error(`Đăng ký tài khoản gặp lỗi hệ thống cho email [${email}].`, err, { user: email, action: 'Đăng ký tài khoản' });
    res.status(500).send('Server error');
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    // Check if user exists
    let user = await User.findOne({ email });
    if (!user) {
      logger.warn(`Đăng nhập thất bại: Không tìm thấy tài khoản với email [${email}].`, { user: email, action: 'Đăng nhập' });
      return res.status(400).json({ message: 'Invalid Credentials' });
    }

    if (user.isDeleted) {
      logger.warn(`Đăng nhập thất bại: Tài khoản [${email}] đã bị xóa.`, { user: email, action: 'Đăng nhập' });
      const pendingAppeal = await BanAppeal.findOne({ userId: user.id, status: 'pending' });
      return res.status(403).json({
        error: 'deleted',
        message: 'Tài khoản của bạn đã bị xóa.',
        reason: 'Tài khoản đã bị xóa bởi Ban Quản Trị.',
        userId: user.id,
        email: user.email,
        hasPendingAppeal: !!pendingAppeal
      });
    }

    if (user.status === 'locked') {
      logger.warn(`Đăng nhập thất bại: Tài khoản [${email}] đang bị khóa.`, { user: email, action: 'Đăng nhập' });
      const pendingAppeal = await BanAppeal.findOne({ userId: user.id, status: 'pending' });
      return res.status(403).json({
        error: 'suspended',
        message: 'Tài khoản của bạn đã bị đình chỉ.',
        reason: user.lockReason || 'Vi phạm điều khoản dịch vụ.',
        userId: user.id,
        email: user.email,
        hasPendingAppeal: !!pendingAppeal
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.warn(`Đăng nhập thất bại: Mật khẩu không chính xác cho tài khoản [${email}].`, { user: email, action: 'Đăng nhập' });
      return res.status(400).json({ message: 'Invalid Credentials' });
    }

    logger.info(`Đăng nhập thành công cho tài khoản [${user.email}] (Tên: ${user.name}).`, { user: user.email, action: 'Đăng nhập' });

    // Create token
    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: { id: user.id, email: user.email, name: user.name, baziInfo: user.baziInfo, gender: user.gender, phone: user.phone || "", role: user.role, credits: user.credits, status: user.status } });
      }
    );
  } catch (err) {
    logger.error(`Đăng nhập gặp lỗi hệ thống cho email [${email}].`, err, { user: email, action: 'Đăng nhập' });
    res.status(500).send('Server error');
  }
};

const updateBaziInfo = async (req, res) => {
  const { userId, day, month, year, hour, minute } = req.body;
  try {
    let user = await User.findById(userId);
    if (!user || user.isDeleted) {
      logger.warn(`Cập nhật Giờ Sinh thất bại: Không tìm thấy tài khoản ID [${userId}].`, { user: `id:${userId}`, action: 'Cập nhật Giờ Sinh Bát Tự' });
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.status === 'locked') {
      return res.status(403).json({ error: 'Tài khoản của bạn đang bị khóa.' });
    }

    user.baziInfo = {
      day: parseInt(day),
      month: parseInt(month),
      year: parseInt(year),
      hour: parseInt(hour),
      minute: parseInt(minute)
    };
    await user.save();
    
    logger.info(`Cập nhật Giờ Sinh thành công cho tài khoản [${user.email}] (Giờ sinh mới: ${hour}:${minute} ngày ${day}/${month}/${year}).`, { user: user.email, action: 'Cập nhật Giờ Sinh Bát Tự' });

    res.json({ user: { id: user.id, email: user.email, name: user.name, baziInfo: user.baziInfo, gender: user.gender, phone: user.phone || "", role: user.role, credits: user.credits, status: user.status } });
  } catch (err) {
    logger.error(`Cập nhật Giờ Sinh gặp lỗi hệ thống cho tài khoản ID [${userId}].`, err, { user: `id:${userId}`, action: 'Cập nhật Giờ Sinh Bát Tự' });
    res.status(500).send('Server error');
  }
};

const googleLogin = async (req, res) => {
  const { credential } = req.body;
  try {
    const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name } = payload;

    let user = await User.findOne({ email });
    if (!user) {
      const crypto = require('crypto');
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(randomPassword, salt);

      user = new User({
        email,
        password: hashedPassword,
        name: name || 'Google User',
        gender: 1,
        role: 'user',
        credits: 1,
        status: 'active'
      });
      await user.save();
      logger.info(`Đăng ký tài khoản Google mới thành công: [${email}]`, { user: email, action: 'Đăng ký Google' });
    } else {
      if (user.isDeleted) {
        logger.warn(`Đăng nhập Google thất bại: Tài khoản [${email}] đã bị xóa.`, { user: email, action: 'Đăng nhập Google' });
        const pendingAppeal = await BanAppeal.findOne({ userId: user.id, status: 'pending' });
        return res.status(403).json({
          error: 'deleted',
          message: 'Tài khoản của bạn đã bị xóa.',
          reason: 'Tài khoản đã bị xóa bởi Ban Quản Trị.',
          userId: user.id,
          email: user.email,
          hasPendingAppeal: !!pendingAppeal
        });
      }

      if (user.status === 'locked') {
        logger.warn(`Đăng nhập Google thất bại: Tài khoản [${email}] đang bị khóa.`, { user: email, action: 'Đăng nhập Google' });
        const pendingAppeal = await BanAppeal.findOne({ userId: user.id, status: 'pending' });
        return res.status(403).json({
          error: 'suspended',
          message: 'Tài khoản của bạn đã bị đình chỉ.',
          reason: user.lockReason || 'Vi phạm điều khoản dịch vụ.',
          userId: user.id,
          email: user.email,
          hasPendingAppeal: !!pendingAppeal
        });
      }

      logger.info(`Đăng nhập thành công với Google: [${email}]`, { user: email, action: 'Đăng nhập Google' });
    }

    const tokenPayload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: { id: user.id, email: user.email, name: user.name, baziInfo: user.baziInfo, gender: user.gender, phone: user.phone || "", role: user.role, credits: user.credits, status: user.status } });
      }
    );
  } catch (err) {
    logger.error(`Đăng nhập Google gặp lỗi hệ thống.`, err, { action: 'Đăng nhập Google' });
    res.status(500).json({ message: 'Google authentication failed' });
  }
};

const updateProfile = async (req, res) => {
  const { userId, name, gender, phone, day, month, year, hour, minute } = req.body;
  try {
    let user = await User.findById(userId);
    if (!user || user.isDeleted) {
      logger.warn(`Cập nhật Hồ Sơ thất bại: Không tìm thấy tài khoản ID [${userId}].`, { user: `id:${userId}`, action: 'Cập nhật Hồ Sơ' });
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.status === 'locked') {
      return res.status(403).json({ error: 'Tài khoản của bạn đang bị khóa.' });
    }

    if (name !== undefined) user.name = name;
    if (gender !== undefined) user.gender = parseInt(gender);
    if (phone !== undefined) user.phone = phone;

    if (day !== undefined && month !== undefined && year !== undefined && hour !== undefined && minute !== undefined) {
      user.baziInfo = {
        day: parseInt(day),
        month: parseInt(month),
        year: parseInt(year),
        hour: parseInt(hour),
        minute: parseInt(minute)
      };
    } else if (day === null) {
      user.baziInfo = undefined;
    }

    await user.save();
    
    logger.info(`Cập nhật Hồ Sơ thành công cho tài khoản [${user.email}].`, { user: user.email, action: 'Cập nhật Hồ Sơ' });

    res.json({ user: { id: user.id, email: user.email, name: user.name, baziInfo: user.baziInfo, gender: user.gender, phone: user.phone || "", role: user.role, credits: user.credits, status: user.status } });
  } catch (err) {
    logger.error(`Cập nhật Hồ Sơ gặp lỗi hệ thống cho tài khoản ID [${userId}].`, err, { user: `id:${userId}`, action: 'Cập nhật Hồ Sơ' });
    res.status(500).send('Server error');
  }
};

const submitAppeal = async (req, res) => {
  const { userId, email, reason, message } = req.body;
  if (!userId || !email || !message) {
    return res.status(400).json({ message: 'Thiếu thông tin yêu cầu.' });
  }

  try {
    const existingAppeal = await BanAppeal.findOne({ userId, status: 'pending' });
    if (existingAppeal) {
      return res.status(400).json({ message: 'Bạn đã gửi đơn khiếu nại và đang chờ duyệt. Vui lòng không gửi thêm.' });
    }

    const appeal = new BanAppeal({
      userId,
      email,
      reason: reason || 'Vi phạm chính sách hệ thống',
      message
    });
    await appeal.save();

    // Create an AdminNotification for co-admin and admin to see
    const notification = await AdminNotification.create({
      type: 'appeal',
      title: `Khiếu nại khóa tài khoản từ ${email}`,
      message: `Tài khoản ${email} khiếu nại quyết định khóa với lý do "${reason}". Lời nhắn: "${message}"`,
      metadata: { userId, appealId: appeal._id, email, reason: reason || 'Vi phạm chính sách hệ thống', message }
    });

    // Send SSE event to all online admins
    sseService.sendToAdmins('new_notification', notification);

    res.json({ message: 'Đơn khiếu nại của bạn đã được gửi tới Ban Quản Trị thành công.' });
  } catch (err) {
    logger.error(`Gửi đơn khiếu nại khóa gặp lỗi hệ thống.`, err, { action: 'Gửi Đơn Khiếu Nại' });
    res.status(500).json({ message: 'Lỗi máy chủ khi gửi đơn khiếu nại.' });
  }
};

module.exports = {
  register,
  login,
  updateBaziInfo,
  googleLogin,
  updateProfile,
  submitAppeal,
};
