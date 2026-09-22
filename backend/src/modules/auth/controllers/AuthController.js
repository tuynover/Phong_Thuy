const User = require('../../../core/models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const logger = require('../../../core/services/LoggerService');
const { OAuth2Client } = require('google-auth-library');
const BanAppeal = require('../../admin/models/BanAppeal');
const AdminNotification = require('../../admin/models/AdminNotification');
const EmailService = require('../services/EmailService');
const RedisQueueService = require('../../../core/services/RedisQueueService');
const sseService = require('../../../core/services/SseService');
const { 
  setOtpRedis, 
  getOtpRedis, 
  deleteOtpRedis, 
  clearUserProfileCache, 
  setUserProfileCache,
  acquireRedisLock,
  releaseRedisLock
} = require('../../../core/config/redis');

const BASE_CHECKIN_REWARDS = [10, 15, 20, 25, 30, 40, 100]; // Phần thưởng gốc Tuần 1

/**
 * Tính danh sách phần thưởng 7 ngày cho tuần thứ `week` (week >= 1)
 * Tuần 1: [10, 15, 20, 25, 30, 40, 100]
 * Tuần 2: Mỗi mốc tăng +10, ngày thứ 7 tăng +20 -> [20, 25, 30, 35, 40, 50, 120]
 * Tuần 3: Mỗi mốc tăng tiếp +10, ngày 7 tăng +20 -> [30, 35, 40, 45, 50, 60, 140]
 * Cứ tiếp tục như vậy cho các tuần tiếp theo.
 */
const getWeekRewards = (week = 1) => {
  const safeWeek = Math.max(1, parseInt(week, 10) || 1);
  const offset = safeWeek - 1;
  return BASE_CHECKIN_REWARDS.map((base, idx) => {
    if (idx === 6) {
      // Ngày thứ 7: mỗi tuần tăng thêm 20
      return base + offset * 20;
    }
    // Ngày 1 đến 6: mỗi tuần tăng thêm 10
    return base + offset * 10;
  });
};

/**
 * Tính điểm thưởng cho ngày điểm danh thứ `streak` (streak >= 1)
 */
const calculateRewardForStreak = (streak = 1) => {
  const safeStreak = Math.max(1, parseInt(streak, 10) || 1);
  const week = Math.floor((safeStreak - 1) / 7) + 1;
  const dayIndex = (safeStreak - 1) % 7; // 0 to 6
  const weekRewards = getWeekRewards(week);
  return {
    week,
    dayInWeek: dayIndex + 1,
    reward: weekRewards[dayIndex],
    weekRewards
  };
};

const getVietnamDateStr = (date = new Date()) => {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(date);
};

const getCalendarDayDifference = (dateStr1, dateStr2) => {
  const [y1, m1, d1] = dateStr1.split('-').map(Number);
  const [y2, m2, d2] = dateStr2.split('-').map(Number);
  const utc1 = Date.UTC(y1, m1 - 1, d1);
  const utc2 = Date.UTC(y2, m2 - 1, d2);
  return Math.round((utc1 - utc2) / (1000 * 60 * 60 * 24));
};

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const formatUserResponse = (user) => {
  const defaultTags = [{ _id: 'default', name: 'Chung', isDefault: true }];
  const userTags = (user.tags && user.tags.length > 0) ? user.tags : defaultTags;
  return {
    id: user.id || user._id,
    _id: user._id || user.id,
    email: user.email,
    name: user.name,
    baziInfo: user.baziInfo,
    gender: user.gender,
    phone: user.phone || "",
    role: user.role,
    credits: user.credits,
    status: user.status,
    isEmailVerified: user.isEmailVerified || false,
    dailyCheckin: user.dailyCheckin || { streak: 0, lastCheckinDate: null, totalCheckins: 0 },
    stats: user.stats || {},
    tags: userTags
  };
};

const register = async (req, res) => {
  const { email, password, name, day, month, year, hour, minute, gender } = req.body;
  try {
    // Check if user exists
    let user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      if (user.isDeleted) {
        logger.warn(`Đăng ký bị từ chối: Tài khoản [${email}] đã bị xóa trước đó. Yêu cầu khôi phục mật khẩu hoặc liên hệ hỗ trợ.`, { user: email, action: 'Đăng ký tài khoản' });
        return res.status(400).json({ message: 'Tài khoản này đã từng bị xóa hoặc vô hiệu hóa. Vui lòng sử dụng tính năng khôi phục mật khẩu để lấy lại tài khoản hoặc liên hệ quản trị viên.' });
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
      credits: 200,
      status: 'active'
    });

    await user.save();
    logger.info(`Đăng ký tài khoản mới thành công cho email [${user.email}] (Tên: ${user.name}).`, { user: user.email, action: 'Đăng ký tài khoản' });
    sseService.sendToAdmins('new_user', { userId: user.id, email: user.email, name: user.name });

    // Đồng bộ tức thời hồ sơ và tokenVersion vào L1 RAM & L2 Redis
    await setUserProfileCache(user.id, user);

    // Create token
    const payload = {
      user: {
        id: user.id,
        tokenVersion: user.tokenVersion || 0
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: formatUserResponse(user) });
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
      return res.status(400).json({ message: 'Tài khoản hoặc mật khẩu không đúng' });
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
      return res.status(400).json({ message: 'Tài khoản hoặc mật khẩu không đúng' });
    }

    logger.info(`Đăng nhập thành công cho tài khoản [${user.email}] (Tên: ${user.name}).`, { user: user.email, action: 'Đăng nhập' });

    // Đồng bộ tức thời hồ sơ và tokenVersion vào L1 RAM & L2 Redis trước khi trả token
    await setUserProfileCache(user.id, user);

    // Create token
    const payload = {
      user: {
        id: user.id,
        tokenVersion: user.tokenVersion || 0
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: formatUserResponse(user) });
      }
    );
  } catch (err) {
    logger.error(`Đăng nhập gặp lỗi hệ thống cho email [${email}].`, err, { user: email, action: 'Đăng nhập' });
    res.status(500).send('Server error');
  }
};

const updateBaziInfo = async (req, res) => {
  const userId = req.dbUser ? (req.dbUser.id || req.dbUser._id.toString()) : req.body.userId;
  const { day, month, year, hour, minute, ownBaziRecordId, ownZiweiRecordId } = req.body;
  try {
    let user = await User.findById(userId);
    if (!user || user.isDeleted) {
      logger.warn(`Cập nhật Giờ Sinh thất bại: Không tìm thấy tài khoản ID [${userId}].`, { user: `id:${userId}`, action: 'Cập nhật Giờ Sinh Bát Tự' });
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.status === 'locked') {
      return res.status(403).json({ error: 'Tài khoản của bạn đang bị khóa.' });
    }

    const isSameBaziInfo = user.baziInfo &&
      user.baziInfo.day === parseInt(day) &&
      user.baziInfo.month === parseInt(month) &&
      user.baziInfo.year === parseInt(year) &&
      user.baziInfo.hour === parseInt(hour) &&
      user.baziInfo.minute === parseInt(minute);

    user.baziInfo = {
      day: parseInt(day),
      month: parseInt(month),
      year: parseInt(year),
      hour: parseInt(hour),
      minute: parseInt(minute),
      ownBaziRecordId: ownBaziRecordId !== undefined ? ownBaziRecordId : (isSameBaziInfo ? user.baziInfo.ownBaziRecordId : null),
      ownZiweiRecordId: ownZiweiRecordId !== undefined ? ownZiweiRecordId : (isSameBaziInfo ? user.baziInfo.ownZiweiRecordId : null)
    };
    await user.save();
    
    // Đồng bộ tức thời hồ sơ vào L1 RAM & L2 Redis
    await setUserProfileCache(user.id, user);

    logger.info(`Cập nhật Giờ Sinh thành công cho tài khoản [${user.email}] (Giờ sinh mới: ${hour}:${minute} ngày ${day}/${month}/${year}).`, { user: user.email, action: 'Cập nhật Giờ Sinh Bát Tự' });

    res.json({ user: formatUserResponse(user) });
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
    const { email, name, email_verified } = payload;

    if (!email_verified) {
      logger.warn(`Đăng nhập Google thất bại: Email [${email}] chưa được xác minh phía Google.`, { user: email, action: 'Đăng nhập Google' });
      return res.status(400).json({ message: 'Tài khoản Google này chưa xác minh địa chỉ email.' });
    }

    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        email,
        password: await bcrypt.hash(uuidv7(), 10), // Random secure password
        name,
        role: 'user',
        credits: 200,
        isEmailVerified: true
      });
      await user.save();
      logger.info(`Đăng ký tài khoản mới thành công qua Google: [${email}]`, { user: email, action: 'Đăng nhập Google' });
      sseService.sendToAdmins('new_user', { userId: user.id, email: user.email, name: user.name });
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

    // Đồng bộ tức thời hồ sơ và tokenVersion vào L1 RAM & L2 Redis
    await setUserProfileCache(user.id, user);

    const tokenPayload = {
      user: {
        id: user.id,
        tokenVersion: user.tokenVersion || 0
      },
    };

    jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: formatUserResponse(user) });
      }
    );
  } catch (err) {
    logger.error(`Đăng nhập Google gặp lỗi hệ thống.`, err, { action: 'Đăng nhập Google' });
    res.status(500).json({ message: 'Google authentication failed' });
  }
};

const updateProfile = async (req, res) => {
  const userId = req.dbUser ? (req.dbUser.id || req.dbUser._id.toString()) : req.body.userId;
  const { name, gender, phone, day, month, year, hour, minute } = req.body;
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
    if (phone !== undefined) {
      if (phone !== "" && !/^0[0-9]{9}$/.test(phone)) {
        return res.status(400).json({ message: 'Số điện thoại không hợp lệ. Phải gồm đúng 10 số và bắt đầu bằng số 0.' });
      }
      if (user.phone !== phone) {
        user.phone = phone;
      }
    }

    if (day !== undefined && month !== undefined && year !== undefined && hour !== undefined && minute !== undefined) {
      const isSameBaziInfo = user.baziInfo &&
        user.baziInfo.day === parseInt(day) &&
        user.baziInfo.month === parseInt(month) &&
        user.baziInfo.year === parseInt(year) &&
        user.baziInfo.hour === parseInt(hour) &&
        user.baziInfo.minute === parseInt(minute);

      user.baziInfo = {
        day: parseInt(day),
        month: parseInt(month),
        year: parseInt(year),
        hour: parseInt(hour),
        minute: parseInt(minute),
        ownBaziRecordId: isSameBaziInfo ? user.baziInfo.ownBaziRecordId : null,
        ownZiweiRecordId: isSameBaziInfo ? user.baziInfo.ownZiweiRecordId : null
      };
    } else if (day === null) {
      user.baziInfo = undefined;
    }

    await user.save();
    
    // Đồng bộ Redis Profile Cache
    await setUserProfileCache(user.id, user);

    logger.info(`Cập nhật Hồ Sơ thành công cho tài khoản [${user.email}].`, { user: user.email, action: 'Cập nhật Hồ Sơ' });

    res.json({ user: formatUserResponse(user) });
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

const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.dbUser.id || req.dbUser._id.toString();
  
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Vui lòng cung cấp mật khẩu hiện tại và mật khẩu mới.' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ message: 'Mật khẩu mới phải có độ dài tối thiểu 8 ký tự.' });
  }

  try {
    const user = await User.findById(userId);
    if (!user || user.isDeleted) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản.' });
    }

    if (user.status === 'locked') {
      return res.status(403).json({ error: 'Tài khoản của bạn đang bị khóa.' });
    }

    // So sánh mật khẩu cũ
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      logger.warn(`Đổi mật khẩu thất bại: Mật khẩu hiện tại không chính xác cho tài khoản [${user.email}].`, { user: user.email, action: 'Đổi mật khẩu' });
      return res.status(400).json({ message: 'Mật khẩu hiện tại không chính xác.' });
    }

    // Hash mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    // Clear Redis profile cache
    await clearUserProfileCache(userId);

    logger.info(`Đổi mật khẩu thành công cho tài khoản [${user.email}].`, { user: user.email, action: 'Đổi mật khẩu' });
    res.json({ message: 'Đổi mật khẩu thành công.' });
  } catch (err) {
    logger.error(`Đổi mật khẩu gặp lỗi hệ thống cho tài khoản ID [${userId}].`, err, { user: `id:${userId}`, action: 'Đổi mật khẩu' });
    res.status(500).send('Server error');
  }
};

const logout = async (req, res) => {
  try {
    const userId = req.dbUser.id || req.dbUser._id.toString();
    const user = await User.findById(userId);
    if (user) {
      user.tokenVersion = (user.tokenVersion || 0) + 1;
      await user.save();
      await clearUserProfileCache(userId);
      logger.info(`Đăng xuất thành công cho tài khoản [${user.email}] (Vô hiệu hóa token & xóa cache).`, { user: user.email, action: 'Đăng xuất' });
    }
    res.json({ message: 'Đăng xuất thành công.' });
  } catch (err) {
    logger.error(`Đăng xuất gặp lỗi hệ thống cho tài khoản ID [${req.dbUser?.id}].`, err, { action: 'Đăng xuất' });
    res.status(500).send('Server error');
  }
};

const sendVerificationEmail = async (req, res) => {
  try {
    const user = req.dbUser;
    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email đã được xác thực trước đó.' });
    }

    // Sinh mã OTP 6 chữ số ngẫu nhiên cấp mã hóa (CSPRNG) và lưu vào Redis (TTL 600 giây = 10 phút)
    const otp = crypto.randomInt(100000, 1000000).toString();
    await setOtpRedis(`verify_email:${user.id}`, otp, 600);

    // Đẩy task gửi email vào Redis Queue để phản hồi API lập tức (~10ms)
    await RedisQueueService.enqueueEmail({
      to: user.email,
      subject: '[Phong Thủy Luận Giải] Mã xác thực email của bạn',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #8b5a2b; text-align: center;">Xác Thực Email Nhận Lượt Sử Dụng</h2>
          <p>Chào bạn <strong>${user.name || 'đương số'}</strong>,</p>
          <p>Cảm ơn bạn đã sử dụng dịch vụ Phong Thủy & Gieo Quẻ. Dưới đây là mã OTP xác thực email của bạn:</p>
          <div style="background-color: #f9f5f0; padding: 15px; border-radius: 6px; text-align: center; margin: 20px 0;">
            <span style="font-size: 28px; font-weight: bold; letter-spacing: 5px; color: #8b5a2b;">${otp}</span>
          </div>
          <p style="color: #666; font-size: 13px;">Mã OTP này có hiệu lực trong vòng <strong>10 phút</strong>. Sau khi xác thực thành công, tài khoản của bạn sẽ được tặng thêm <strong>+200 points</strong>.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #999; text-align: center;">Đây là email tự động, vui lòng không phản hồi email này.</p>
        </div>
      `
    });

    res.json({ message: 'Mã xác thực OTP đã được gửi đến email của bạn.' });
  } catch (err) {
    logger.error('Gửi email xác thực gặp lỗi:', err);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ.' });
  }
};

const verifyEmail = async (req, res) => {
  const { otp } = req.body;
  if (!otp) {
    return res.status(400).json({ message: 'Vui lòng cung cấp mã OTP.' });
  }

  try {
    const user = await User.findById(req.dbUser.id || req.dbUser._id);
    if (!user || user.isDeleted) {
      return res.status(404).json({ message: 'Tài khoản không tồn tại.' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email đã được xác thực trước đó.' });
    }

    // Đọc OTP từ Redis
    const cachedOtp = await getOtpRedis(`verify_email:${user.id}`);
    if (!cachedOtp || cachedOtp !== otp) {
      return res.status(400).json({ message: 'Mã OTP không chính xác hoặc đã hết hạn.' });
    }

    // Xác thực thành công
    user.isEmailVerified = true;
    user.credits = (user.credits || 0) + 200;

    await user.save();
    
    // Xóa OTP khỏi Redis & cập nhật Profile Cache
    await deleteOtpRedis(`verify_email:${user.id}`);
    await setUserProfileCache(user.id, user);

    logger.info(`Tài khoản [${user.email}] xác thực email thành công và được cộng 200 points.`, { user: user.email, action: 'Xác thực Email' });

    res.json({
      message: 'Xác thực email thành công! Bạn đã được tặng +200 points.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        baziInfo: user.baziInfo,
        gender: user.gender,
        phone: user.phone || "",
        role: user.role,
        credits: user.credits,
        status: user.status,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified || false
      }
    });
  } catch (err) {
    logger.error('Xác thực OTP gặp lỗi:', err);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ.' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Vui lòng cung cấp địa chỉ email.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || user.isDeleted) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản với email này.' });
    }

    if (user.status === 'locked') {
      return res.status(403).json({ message: 'Tài khoản này hiện đang bị khóa.' });
    }

    // Sinh mã OTP 6 chữ số ngẫu nhiên cấp mã hóa (CSPRNG) và lưu vào Redis (TTL 900 giây = 15 phút)
    const otp = crypto.randomInt(100000, 1000000).toString();
    await setOtpRedis(`reset_password:${user.email.toLowerCase()}`, otp, 900);

    // Đẩy task gửi mail vào Redis Queue
    await RedisQueueService.enqueueEmail({
      to: user.email,
      subject: 'Mã OTP khôi phục mật khẩu - Phong Thủy',
      html: `<div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 500px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        <h2 style="color: #78350f; font-family: serif; border-bottom: 2px solid #fef3c7; padding-bottom: 10px;">Khôi phục mật khẩu - Phong Thủy</h2>
        <p>Xin chào <strong>${user.name}</strong>,</p>
        <p>Hệ thống nhận được yêu cầu khôi phục mật khẩu từ tài khoản của bạn.</p>
        <p>Mã OTP xác thực của bạn là:</p>
        <div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px 10px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; border-radius: 8px; margin: 15px 0; color: #78350f;">
          ${otp}
        </div>
        <p style="font-size: 13px; color: #666;">Mã này có hiệu lực trong vòng 15 phút. Vui lòng không chia sẻ mã này cho bất kỳ ai khác.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 11px; color: #999; text-align: center;">Đây là email tự động từ hệ thống Phong Thủy & Gieo Quẻ. Vui lòng không phản hồi email này.</p>
      </div>`
    });

    logger.info(`Đã gửi OTP khôi phục mật khẩu tới email [${user.email}].`, { user: user.email, action: 'Quên mật khẩu' });
    res.json({ message: 'Mã OTP khôi phục mật khẩu đã được gửi đến email của bạn.' });
  } catch (err) {
    logger.error('Quên mật khẩu gặp lỗi:', err);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ.' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ các thông tin yêu cầu.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || user.isDeleted) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản.' });
    }

    // Đọc mã OTP từ Redis
    const cachedOtp = await getOtpRedis(`reset_password:${email.toLowerCase()}`);
    if (!cachedOtp || cachedOtp !== otp) {
      return res.status(400).json({ message: 'Mã OTP không chính xác hoặc đã hết hạn. Vui lòng bấm gửi lại mã.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.tokenVersion = (user.tokenVersion || 0) + 1; // Hủy các phiên đăng nhập cũ
    await user.save();

    // Xóa OTP khỏi Redis & vô hiệu hóa Profile Cache
    await deleteOtpRedis(`reset_password:${email.toLowerCase()}`);
    await clearUserProfileCache(user.id);

    logger.info(`Khôi phục mật khẩu thành công cho tài khoản [${user.email}].`, { user: user.email, action: 'Khôi phục mật khẩu' });
    res.json({ message: 'Khôi phục mật khẩu thành công! Vui lòng đăng nhập lại với mật khẩu mới.' });
  } catch (err) {
    logger.error('Khôi phục mật khẩu gặp lỗi:', err);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ.' });
  }
};

/**
 * Điểm danh hàng ngày nhận Point (Daily Check-in)
 * Bảo vệ chống race condition bằng Redis distributed lock + atomic database checks
 */
const dailyCheckin = async (req, res) => {
  const userId = req.dbUser?.id || req.dbUser?._id;
  if (!userId) {
    return res.status(401).json({ message: 'Bạn chưa đăng nhập.' });
  }

  const lockKey = `inflight:checkin:${userId}`;
  const lockToken = await acquireRedisLock(lockKey, 3000);
  if (!lockToken) {
    return res.status(429).json({
      message: 'Yêu cầu điểm danh của bạn đang được xử lý, vui lòng chờ trong giây lát.'
    });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
    }

    const todayStr = getVietnamDateStr();
    const lastDate = user.dailyCheckin?.lastCheckinDate;
    const currentStreak = user.dailyCheckin?.streak || 0;

    // 1. Kiểm tra đã điểm danh hôm nay chưa
    if (lastDate) {
      const diff = getCalendarDayDifference(todayStr, lastDate);
      if (diff === 0) {
        return res.status(400).json({
          message: 'Hôm nay bạn đã nhận thưởng điểm danh rồi. Hãy quay lại vào ngày mai nhé!',
          alreadyCheckedIn: true,
          currentStreak,
          dailyCheckin: user.dailyCheckin,
          credits: user.credits
        });
      }
    }

    // 2. Tính toán chuỗi ngày streak
    let newStreak = 1;
    if (lastDate) {
      const diff = getCalendarDayDifference(todayStr, lastDate);
      if (diff === 1) {
        // Điểm danh liên tiếp ngày hôm sau: streak tiếp tục tăng lũy tiến qua các tuần
        newStreak = currentStreak + 1;
      } else {
        // Bị ngắt quãng > 1 ngày -> quay lại Tuần 1, Ngày 1
        newStreak = 1;
      }
    } else {
      // Lần đầu điểm danh
      newStreak = 1;
    }

    // 3. Tính điểm thưởng theo tuần và ngày trong tuần
    const { week, dayInWeek, reward, weekRewards } = calculateRewardForStreak(newStreak);

    // 4. Cập nhật User atomic
    user.credits = (user.credits || 0) + reward;
    user.dailyCheckin = {
      streak: newStreak,
      lastCheckinDate: todayStr,
      totalCheckins: (user.dailyCheckin?.totalCheckins || 0) + 1,
      lastCheckinAt: new Date()
    };

    await user.save();
    const formattedUser = formatUserResponse(user);
    await clearUserProfileCache(user.id || user._id);
    await setUserProfileCache(user.id || user._id, formattedUser);

    logger.info(`Tài khoản [${user.email}] điểm danh ngày ${dayInWeek}/7 (Tuần ${week}, Streak: ${newStreak}) thành công (+${reward} points).`, {
      user: user.email,
      action: 'Daily Check-in',
      streak: newStreak,
      week,
      dayInWeek,
      reward,
      totalCredits: user.credits
    });

    res.json({
      success: true,
      message: dayInWeek === 7 
        ? `Chúc mừng bạn đã hoàn thành Tuần ${week} và nhận đại thưởng +${reward} Points!`
        : `Điểm danh Ngày ${dayInWeek}/7 (Tuần ${week}) thành công! Bạn nhận được +${reward} Points.`,
      streak: newStreak,
      currentWeek: week,
      dayInWeek,
      reward,
      rewards: weekRewards,
      credits: user.credits,
      dailyCheckin: user.dailyCheckin,
      user: formatUserResponse(user)
    });
  } catch (err) {
    logger.error('Điểm danh hàng ngày gặp lỗi:', err);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ.' });
  } finally {
    await releaseRedisLock(lockKey, lockToken);
  }
};

/**
 * Lấy trạng thái điểm danh hiện tại của người dùng
 */
const getDailyCheckinStatus = async (req, res) => {
  try {
    const userId = req.dbUser?.id || req.dbUser?._id;
    if (!userId) {
      return res.status(401).json({ message: 'Bạn chưa đăng nhập.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
    }

    const todayStr = getVietnamDateStr();
    const lastDate = user.dailyCheckin?.lastCheckinDate;
    const currentStreak = user.dailyCheckin?.streak || 0;

    let hasCheckedInToday = false;
    let nextStreak = 1;

    if (lastDate) {
      const diff = getCalendarDayDifference(todayStr, lastDate);
      if (diff === 0) {
        hasCheckedInToday = true;
        nextStreak = currentStreak + 1;
      } else if (diff === 1) {
        hasCheckedInToday = false;
        nextStreak = currentStreak + 1;
      } else {
        hasCheckedInToday = false;
        nextStreak = 1;
      }
    } else {
      hasCheckedInToday = false;
      nextStreak = 1;
    }

    // Xác định tuần và ngày trong tuần cần hiển thị:
    // Nếu hôm nay đã điểm danh: hiển thị tuần & bảng thưởng của ngày vừa nhận (currentStreak)
    // Nếu hôm nay chưa điểm danh: hiển thị tuần & bảng thưởng của ngày chuẩn bị nhận (nextStreak)
    const targetStreak = hasCheckedInToday ? currentStreak : nextStreak;
    const currentWeek = Math.floor((Math.max(1, targetStreak) - 1) / 7) + 1;
    const weekRewards = getWeekRewards(currentWeek);
    const dayInWeek = ((Math.max(1, targetStreak) - 1) % 7) + 1;
    const nextRewardData = calculateRewardForStreak(nextStreak);

    res.json({
      hasCheckedInToday,
      currentStreak: hasCheckedInToday ? currentStreak : (lastDate && getCalendarDayDifference(todayStr, lastDate) === 1 ? currentStreak : 0),
      displayStreak: hasCheckedInToday ? currentStreak : (lastDate && getCalendarDayDifference(todayStr, lastDate) === 1 ? currentStreak : 0),
      nextStreak,
      currentWeek,
      dayInWeek,
      todayReward: hasCheckedInToday ? weekRewards[dayInWeek - 1] : nextRewardData.reward,
      rewards: weekRewards,
      dailyCheckin: user.dailyCheckin || { streak: 0, lastCheckinDate: null, totalCheckins: 0 },
      credits: user.credits || 0
    });
  } catch (err) {
    logger.error('Lỗi khi lấy trạng thái điểm danh:', err);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ.' });
  }
};

module.exports = {
  register,
  login,
  updateBaziInfo,
  googleLogin,
  updateProfile,
  submitAppeal,
  changePassword,
  logout,
  sendVerificationEmail,
  verifyEmail,
  forgotPassword,
  resetPassword,
  dailyCheckin,
  getDailyCheckinStatus
};
