const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const SystemConfig = require('../../modules/admin/models/SystemConfig');
const { AiRotator } = require('../ai/AiRotator');
const aiConfig = require('../config/ai');
const logger = require('./LoggerService');

const DEFAULT_CONFIG_DEFINITIONS = [
  // 1. AI Configuration
  {
    key: 'GEMINI_MODEL',
    category: 'ai',
    label: 'Mô Hình Google Gemini Chính',
    description: 'Mô hình AI chủ đạo phục vụ sinh luận giải phong thủy (Ưu tiên: gemini-3.5-flash-lite, gemini-3.1-flash-lite)',
    isSecret: false,
    requiresRestart: false,
    defaultValue: 'gemini-3.5-flash-lite'
  },
  {
    key: 'GEMINI_API_KEYS',
    category: 'ai',
    label: 'Danh Sách Khóa Google Gemini API',
    description: 'Danh sách các API Key phân tách bởi dấu phẩy, hỗ trợ Round-Robin xoay tua và Circuit Breaker',
    isSecret: true,
    requiresRestart: false,
    defaultValue: ''
  },
  {
    key: 'OPENROUTER_API_KEY',
    category: 'ai',
    label: 'Khóa OpenRouter API Dự Phòng',
    description: 'Khóa kết nối OpenRouter khi cần điều phối sang mô hình dự phòng sâu',
    isSecret: true,
    requiresRestart: false,
    defaultValue: ''
  },
  {
    key: 'DEEPSEEK_API_KEY',
    category: 'ai',
    label: 'Khóa DeepSeek API Dự Phòng',
    description: 'Khóa kết nối DeepSeek API khi cần fallback',
    isSecret: true,
    requiresRestart: false,
    defaultValue: ''
  },
  {
    key: 'AI_COOLDOWN_SECONDS',
    category: 'ai',
    label: 'Thời Gian Nghỉ Giữa 2 Lần Gọi AI (Giây)',
    description: 'Khoảng thời gian tối thiểu giữa 2 lần yêu cầu luận giải để chống spam',
    isSecret: false,
    requiresRestart: false,
    defaultValue: '10'
  },
  {
    key: 'AI_CHAT_LIMIT_PER_HOUR',
    category: 'ai',
    label: 'Giới Hạn Lượt Chat Mỗi Giờ',
    description: 'Số lượng câu hỏi chat follow-up tối đa người dùng được hỏi trong 1 giờ',
    isSecret: false,
    requiresRestart: false,
    defaultValue: '10'
  },
  {
    key: 'AI_TIMEOUT_MS',
    category: 'ai',
    label: 'Thời Gian Chờ Tối Đa AI (Mili-giây)',
    description: 'Thời gian timeout trước khi ngắt stream kết nối tới Gemini (Mặc định: 25000ms)',
    isSecret: false,
    requiresRestart: false,
    defaultValue: '25000'
  },

  // 2. Security & Auth
  {
    key: 'JWT_SECRET',
    category: 'security',
    label: 'Khóa Bí Mật Ký Token JWT',
    description: 'Khóa giải mã và xác thực phiên đăng nhập người dùng (Cực kỳ nhạy cảm)',
    isSecret: true,
    requiresRestart: true,
    defaultValue: ''
  },
  {
    key: 'GOOGLE_CLIENT_ID',
    category: 'security',
    label: 'Google OAuth2 Client ID',
    description: 'Mã định danh xác thực đăng nhập Google phía Web Client',
    isSecret: false,
    requiresRestart: false,
    defaultValue: ''
  },

  // 3. Database & Caching
  {
    key: 'MONGODB_URI',
    category: 'database',
    label: 'Chuỗi Kết Nối MongoDB',
    description: 'URI kết nối cụm cơ sở dữ liệu MongoDB chính (Có chứa mật khẩu xác thực)',
    isSecret: true,
    requiresRestart: true,
    defaultValue: 'mongodb://localhost:27017/phongthuy'
  },
  {
    key: 'REDIS_HOST',
    category: 'database',
    label: 'Địa Chỉ Máy Chủ Redis',
    description: 'Địa chỉ IPv4 của dịch vụ Redis Cache & Queue (Mặc định: 127.0.0.1)',
    isSecret: false,
    requiresRestart: true,
    defaultValue: '127.0.0.1'
  },
  {
    key: 'REDIS_PORT',
    category: 'database',
    label: 'Cổng Dịch Vụ Redis',
    description: 'Cổng kết nối Redis (Mặc định: 6379)',
    isSecret: false,
    requiresRestart: true,
    defaultValue: '6379'
  },
  {
    key: 'REDIS_PASSWORD',
    category: 'database',
    label: 'Mật Khẩu Xác Thực Redis',
    description: 'Mật khẩu requirepass của Redis (nếu có)',
    isSecret: true,
    requiresRestart: true,
    defaultValue: ''
  },

  // 4. Email SMTP
  {
    key: 'SMTP_HOST',
    category: 'email',
    label: 'Máy Chủ Email SMTP',
    description: 'Địa chỉ máy chủ gửi mail OTP (Ví dụ: smtp.gmail.com)',
    isSecret: false,
    requiresRestart: false,
    defaultValue: 'smtp.gmail.com'
  },
  {
    key: 'SMTP_PORT',
    category: 'email',
    label: 'Cổng SMTP',
    description: 'Cổng gửi mail (587 cho TLS/STARTTLS hoặc 465 cho SSL)',
    isSecret: false,
    requiresRestart: false,
    defaultValue: '587'
  },
  {
    key: 'SMTP_USER',
    category: 'email',
    label: 'Tài Khoản Email Gửi Tin',
    description: 'Địa chỉ email gửi mã OTP khôi phục mật khẩu',
    isSecret: false,
    requiresRestart: false,
    defaultValue: ''
  },
  {
    key: 'SMTP_PASS',
    category: 'email',
    label: 'Mật Khẩu Ứng Dụng SMTP',
    description: 'App Password 16 ký tự của Google Gmail hoặc mật khẩu tài khoản mail',
    isSecret: true,
    requiresRestart: false,
    defaultValue: ''
  },
  {
    key: 'SMTP_FROM',
    category: 'email',
    label: 'Tên & Địa Chỉ Người Gửi',
    description: 'Tiêu đề hiển thị trong hộp thư người nhận (Ví dụ: "Phong Thủy Luận Giải" <no-reply@...>)',
    isSecret: false,
    requiresRestart: false,
    defaultValue: '"Phong Thủy Luận Giải" <no-reply@phongthuy.vn>'
  },

  // 5. System & Network
  {
    key: 'PORT',
    category: 'system',
    label: 'Cổng HTTP Server',
    description: 'Cổng mạng Backend lắng nghe kết nối (Mặc định: 3001)',
    isSecret: false,
    requiresRestart: true,
    defaultValue: '3001'
  },
  {
    key: 'NODE_ENV',
    category: 'system',
    label: 'Môi Trường Thực Thi',
    description: 'Môi trường hệ thống: development hoặc production',
    isSecret: false,
    requiresRestart: true,
    defaultValue: 'development'
  },
  {
    key: 'APP_DOMAIN',
    category: 'system',
    label: 'Tên Miền Công Khai Ứng Dụng',
    description: 'Tên miền chính thức của giao diện người dùng (Ví dụ: https://tuynover.id.vn)',
    isSecret: false,
    requiresRestart: false,
    defaultValue: 'https://tuynover.id.vn'
  },
  {
    key: 'CLIENT_URL',
    category: 'system',
    label: 'Danh Sách CORS Origins Được Phép',
    description: 'Danh sách các nguồn gốc phân tách bởi dấu phẩy được phép gửi request API tới Backend',
    isSecret: false,
    requiresRestart: false,
    defaultValue: 'http://localhost:5173,http://localhost:5174,https://tuynover.id.vn'
  }
];

class ConfigService {
  /**
   * Tạo mặt nạ che giấu chuỗi nhạy cảm
   */
  static maskSecret(val) {
    if (!val || typeof val !== 'string') return '';
    const trimmed = val.trim();
    if (trimmed.length === 0) return '';
    if (trimmed.length <= 8) return '••••••••';
    return `${trimmed.slice(0, 4)}...${trimmed.slice(-4)}`;
  }

  /**
   * Kiểm tra xem chuỗi có phải là chuỗi mặt nạ không
   */
  static isMaskedPattern(val) {
    if (!val || typeof val !== 'string') return false;
    return val.includes('...') || val.includes('•••');
  }

  /**
   * Đồng bộ các biến từ process.env vào MongoDB nếu bảng SystemConfig chưa có
   */
  static async syncEnvToDbIfEmpty() {
    try {
      const count = await SystemConfig.countDocuments();
      if (count === 0) {
        logger.info('[ConfigService] Bảng SystemConfig trống. Đang tự động nạp cấu hình ban đầu từ môi trường...');
        const docs = DEFAULT_CONFIG_DEFINITIONS.map(def => {
          let envVal = process.env[def.key];
          if (def.key === 'GEMINI_API_KEYS' && !envVal) {
            envVal = process.env.GEMINI_API_KEY || '';
          }
          return {
            key: def.key,
            value: envVal !== undefined && envVal !== null ? envVal : def.defaultValue,
            category: def.category,
            label: def.label,
            description: def.description,
            isSecret: def.isSecret,
            requiresRestart: def.requiresRestart,
            updatedBy: 'system'
          };
        });
        await SystemConfig.insertMany(docs);
        logger.info(`[ConfigService] Đã đồng bộ thành công ${docs.length} thông số cấu hình vào cơ sở dữ liệu.`);
      }
    } catch (err) {
      logger.error('[ConfigService.syncEnvToDbIfEmpty] Lỗi khi nạp cấu hình ban đầu:', err);
    }
  }

  /**
   * Lấy danh sách toàn bộ cấu hình hệ thống (đã che giấu mặt nạ cho các key bí mật)
   */
  static async getMaskedConfigs() {
    await this.syncEnvToDbIfEmpty();

    const configs = await SystemConfig.find().sort({ category: 1, key: 1 }).lean();
    return configs.map(cfg => {
      const isSecret = Boolean(cfg.isSecret);
      const rawVal = cfg.value || '';
      return {
        _id: cfg._id,
        key: cfg.key,
        value: isSecret ? this.maskSecret(rawVal) : rawVal,
        category: cfg.category,
        label: cfg.label,
        description: cfg.description,
        isSecret,
        isConfigured: rawVal.trim().length > 0,
        requiresRestart: Boolean(cfg.requiresRestart),
        updatedBy: cfg.updatedBy,
        updatedAt: cfg.updatedAt
      };
    });
  }

  /**
   * Cập nhật danh sách cấu hình và kích hoạt Hot-Reload
   */
  static async updateConfigs(configsToUpdate = [], updatedBy = 'admin') {
    if (!Array.isArray(configsToUpdate) || configsToUpdate.length === 0) {
      throw new Error('Danh sách cấu hình cần cập nhật không hợp lệ.');
    }

    const updatedKeys = [];
    let requiresRestartFlag = false;
    let aiChanged = false;

    for (const item of configsToUpdate) {
      const { key, value } = item;
      if (!key) continue;

      const existing = await SystemConfig.findOne({ key: key.toUpperCase() });
      if (!existing) continue;

      // Nếu là trường bí mật và chuỗi gửi lên là chuỗi mặt nạ, bỏ qua không ghi đè
      if (existing.isSecret && this.isMaskedPattern(value)) {
        continue;
      }

      const cleanValue = typeof value === 'string' ? value.trim() : String(value || '');
      existing.value = cleanValue;
      existing.updatedBy = updatedBy;
      await existing.save();

      // Cập nhật RAM process.env
      process.env[existing.key] = cleanValue;
      if (existing.key === 'GEMINI_API_KEYS') {
        process.env.GEMINI_API_KEY = cleanValue.split(',')[0]?.trim() || '';
      }

      if (existing.category === 'ai') {
        aiChanged = true;
      }

      if (existing.requiresRestart) {
        requiresRestartFlag = true;
      }

      updatedKeys.push(existing.key);
    }

    // 1. Hot Reload AI services nếu có thay đổi cấu hình AI
    if (aiChanged) {
      AiRotator.gemini.resetCache();
      if (process.env.GEMINI_MODEL) {
        aiConfig.ACTIVE_MODEL = process.env.GEMINI_MODEL;
      }
      logger.info('[ConfigService] Hot-Reload thành công cấu hình AI (reset key rotator và cache client).');
    }

    // 2. Ghi đồng bộ file .env trên đĩa để lưu vết lâu dài
    await this.syncDiskEnvFile();

    return {
      success: true,
      updatedKeys,
      requiresRestart: requiresRestartFlag,
      message: requiresRestartFlag 
        ? `Đã cập nhật ${updatedKeys.length} thông số. Một số cấu hình hạ tầng yêu cầu khởi động lại máy chủ để có hiệu lực hoàn toàn.`
        : `Đã cập nhật và Hot-Reload thành công ${updatedKeys.length} thông số mà không cần khởi động lại máy chủ.`
    };
  }

  /**
   * Sao lưu và ghi đè an toàn file .env trên đĩa
   */
  static async syncDiskEnvFile() {
    try {
      const envPath = path.resolve(__dirname, '../../../.env');
      const allConfigs = await SystemConfig.find().lean();

      // Tạo nội dung .env
      const lines = [
        '# ==========================================================================',
        '# PHONG THUY BACKEND ENVIRONMENT CONFIGURATION (AUTOMATICALLY MANAGED)',
        `# Last Synced: ${new Date().toISOString()}`,
        '# ==========================================================================',
        ''
      ];

      const categories = ['system', 'security', 'database', 'ai', 'email'];
      const catLabels = {
        system: 'System & Server',
        security: 'Security & Authentication',
        database: 'Database & Caching',
        ai: 'Artificial Intelligence (Google Gemini & Rotator)',
        email: 'SMTP Email Service'
      };

      for (const cat of categories) {
        const catConfigs = allConfigs.filter(c => c.category === cat);
        if (catConfigs.length > 0) {
          lines.push(`\n# --- ${catLabels[cat]} ---`);
          for (const cfg of catConfigs) {
            lines.push(`${cfg.key}=${cfg.value}`);
          }
        }
      }

      // Backup file cũ nếu tồn tại
      if (fs.existsSync(envPath)) {
        const backupPath = path.resolve(__dirname, `../../../.env.bak`);
        fs.copyFileSync(envPath, backupPath);
      }

      fs.writeFileSync(envPath, lines.join('\n') + '\n', 'utf8');
      logger.info('[ConfigService] Đồng bộ file backend/.env trên đĩa thành công.');
    } catch (err) {
      logger.error('[ConfigService.syncDiskEnvFile] Lỗi khi ghi file .env:', err);
    }
  }

  /**
   * Thử nghiệm kết nối tới Google Gemini API với key và model chỉ định
   */
  static async testGeminiConnection({ apiKey, model }) {
    const keyToTest = apiKey && !this.isMaskedPattern(apiKey) 
      ? apiKey.trim() 
      : (process.env.GEMINI_API_KEY || (process.env.GEMINI_API_KEYS ? process.env.GEMINI_API_KEYS.split(',')[0].trim() : ''));

    if (!keyToTest) {
      return { success: false, error: 'Chưa có Gemini API Key nào được cấu hình để kiểm tra.' };
    }

    const modelToTest = model || process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
    const startTime = Date.now();

    try {
      const genAI = new GoogleGenerativeAI(keyToTest);
      const client = genAI.getGenerativeModel({ model: modelToTest });
      const result = await client.generateContent('Trả lời đúng một từ: OK');
      const text = result?.response?.text() || '';
      const latencyMs = Date.now() - startTime;

      return {
        success: true,
        latencyMs,
        model: modelToTest,
        responseSample: text.trim(),
        message: `Kết nối Google Gemini AI thành công! Độ trễ phản hồi: ${latencyMs}ms.`
      };
    } catch (err) {
      return {
        success: false,
        latencyMs: Date.now() - startTime,
        model: modelToTest,
        error: err.message || 'Không thể kết nối tới Google Gemini API.'
      };
    }
  }

  /**
   * Thử nghiệm kết nối tới máy chủ SMTP
   */
  static async testSmtpConnection({ host, port, user, pass }) {
    const smtpHost = host || process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = parseInt(port || process.env.SMTP_PORT || '587', 10);
    const smtpUser = user || process.env.SMTP_USER;
    const smtpPass = pass && !this.isMaskedPattern(pass) ? pass : process.env.SMTP_PASS;

    if (!smtpUser || !smtpPass) {
      return { success: false, error: 'Chưa cấu hình tài khoản hoặc mật khẩu SMTP.' };
    }

    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      });

      await transporter.verify();
      return {
        success: true,
        message: `Xác thực máy chủ SMTP (${smtpHost}:${smtpPort}) thành công!`
      };
    } catch (err) {
      return {
        success: false,
        error: err.message || 'Xác thực SMTP thất bại. Vui lòng kiểm tra lại thông tin cấu hình.'
      };
    }
  }
}

module.exports = ConfigService;
