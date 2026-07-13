const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const logger = require('../services/LoggerService');
const { OAuth2Client } = require('google-auth-library');
const BanAppeal = require('../models/BanAppeal');
const AdminNotification = require('../models/AdminNotification');
const sseService = require('../services/SseService');
const EmailService = require('../services/EmailService');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const register = async (req, res) => {
  const { email, password, name, day, month, year, hour, minute, gender } = req.body;
  try {
    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      if (user.isDeleted) {
        // Nếu tài khoản bị xóa mềm, cho phép kích hoạt lại bằng thông tin đăng ký mới
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user.password = hashedPassword;
        user.name = name;
        user.gender = gender !== undefined ? parseInt(gender) : 1;
        user.baziInfo = (day && month && year && hour && minute) ? {
          day: parseInt(day),
          month: parseInt(month),
          year: parseInt(year),
          hour: parseInt(hour),
          minute: parseInt(minute)
        } : undefined;
        user.isDeleted = false;
        user.status = 'active';
        user.credits = 2;
        user.lockReason = '';
        user.stats = {
          ichingCount: 0,
          baziCount: 0,
          ziweiCount: 0,
          marriageCount: 0,
          ichingTokens: 0,
          baziTokens: 0,
          ziweiTokens: 0,
          marriageTokens: 0,
          totalTokens: 0,
          lastUpdated: null
        };

        await user.save();
        logger.info(`Kích hoạt lại tài khoản đã bị xóa mềm thành công cho email [${user.email}] (Tên: ${user.name}).`, { user: user.email, action: 'Đăng ký tài khoản' });
        sseService.sendToAdmins('new_user', { userId: user.id, email: user.email, name: user.name });

        const payload = {
          user: {
            id: user.id,
            tokenVersion: user.tokenVersion || 0
          },
        };

        return jwt.sign(
          payload,
          process.env.JWT_SECRET || 'secret',
          { expiresIn: '7d' },
          (err, token) => {
            if (err) throw err;
            return res.json({ token, user: { id: user.id, email: user.email, name: user.name, baziInfo: user.baziInfo, gender: user.gender, phone: user.phone || "", role: user.role, credits: user.credits, status: user.status } });
          }
        );
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
      credits: 2,
      status: 'active'
    });

    await user.save();
    logger.info(`Đăng ký tài khoản mới thành công cho email [${user.email}] (Tên: ${user.name}).`, { user: user.email, action: 'Đăng ký tài khoản' });
    sseService.sendToAdmins('new_user', { userId: user.id, email: user.email, name: user.name });

    // Create token
    const payload = {
      user: {
        id: user.id,
        tokenVersion: user.tokenVersion || 0
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

    // Create token
    const payload = {
      user: {
        id: user.id,
        tokenVersion: user.tokenVersion || 0
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
  const { userId, day, month, year, hour, minute, ownBaziRecordId, ownZiweiRecordId } = req.body;
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
        credits: 2,
        status: 'active'
      });
      await user.save();
      logger.info(`Đăng ký tài khoản Google mới thành công: [${email}]`, { user: email, action: 'Đăng ký Google' });
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

    const tokenPayload = {
      user: {
        id: user.id,
        tokenVersion: user.tokenVersion || 0
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
    
    logger.info(`Cập nhật Hồ Sơ thành công cho tài khoản [${user.email}].`, { user: user.email, action: 'Cập nhật Hồ Sơ' });

    res.json({ user: { id: user.id, email: user.email, name: user.name, baziInfo: user.baziInfo, gender: user.gender, phone: user.phone || "", role: user.role, credits: user.credits, status: user.status, isEmailVerified: user.isEmailVerified || false } });
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
    await user.save();

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
      logger.info(`Đăng xuất thành công cho tài khoản [${user.email}] (Vô hiệu hóa token).`, { user: user.email, action: 'Đăng xuất' });
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

    // Sinh mã OTP 6 chữ số
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.emailOtp = otp;
    user.emailOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 phút hiệu lực
    await user.save();

    // Gửi email
    const emailResult = await EmailService.sendEmail({
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
          <p style="color: #666; font-size: 13px;">Mã OTP này có hiệu lực trong vòng <strong>10 phút</strong>. Sau khi xác thực thành công, tài khoản của bạn sẽ được tặng thêm <strong>+2 lượt sử dụng (credits)</strong>.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #999; text-align: center;">Đây là email tự động, vui lòng không phản hồi email này.</p>
        </div>
      `
    });

    if (!emailResult.success) {
      return res.status(500).json({ message: 'Không thể gửi email xác thực. Vui lòng thử lại sau.' });
    }

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
    const user = req.dbUser;
    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email đã được xác thực trước đó.' });
    }

    if (!user.emailOtp || user.emailOtp !== otp || !user.emailOtpExpires || new Date(user.emailOtpExpires) < new Date()) {
      return res.status(400).json({ message: 'Mã OTP không chính xác hoặc đã hết hạn.' });
    }

    // Xác thực thành công
    user.isEmailVerified = true;
    user.emailOtp = null;
    user.emailOtpExpires = null;
    user.credits = (user.credits || 0) + 2;

    await user.save();

    logger.info(`Tài khoản [${user.email}] xác thực email thành công và được cộng 2 credits.`, { user: user.email, action: 'Xác thực Email' });

    res.json({
      message: 'Xác thực email thành công! Bạn đã được tặng +2 lượt sử dụng.',
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

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.emailOtp = otp;
    user.emailOtpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 phút
    await user.save();

    await EmailService.sendEmail({
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

    if (!user.emailOtp || !user.emailOtpExpires || user.emailOtpExpires < new Date()) {
      return res.status(400).json({ message: 'Mã OTP đã hết hạn hoặc không tồn tại. Vui lòng bấm gửi lại mã.' });
    }

    if (user.emailOtp !== otp) {
      return res.status(400).json({ message: 'Mã OTP không chính xác.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.emailOtp = null;
    user.emailOtpExpires = null;
    user.tokenVersion = (user.tokenVersion || 0) + 1; // Hủy các phiên đăng nhập cũ
    await user.save();

    logger.info(`Khôi phục mật khẩu thành công cho tài khoản [${user.email}].`, { user: user.email, action: 'Khôi phục mật khẩu' });
    res.json({ message: 'Khôi phục mật khẩu thành công! Vui lòng đăng nhập lại với mật khẩu mới.' });
  } catch (err) {
    logger.error('Khôi phục mật khẩu gặp lỗi:', err);
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
};
