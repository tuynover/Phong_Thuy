const logger = require('../services/LoggerService');

function validateEnv() {
  const required = ['JWT_SECRET', 'MONGODB_URI'];
  const missingRequired = required.filter(key => !process.env[key] || process.env[key].trim() === '');

  if (missingRequired.length > 0) {
    const errorMsg = `FATAL ERROR: Cấu hình môi trường thiếu các biến bắt buộc: ${missingRequired.join(', ')}`;
    logger.error(errorMsg);
    console.error(errorMsg);
    process.exit(1);
  }

  const optionals = [
    { key: 'REDIS_HOST', name: 'Redis Caching Service' },
    { key: 'GEMINI_API_KEY', name: 'Google Gemini AI Service' },
    { key: 'EMAIL_USER', name: 'SMTP Email Service' }
  ];

  optionals.forEach(({ key, name }) => {
    if (!process.env[key] || process.env[key].trim() === '') {
      logger.warn(`[Config Warning] Biến môi trường [${key}] chưa được cấu hình. Chức năng [${name}] có thể hoạt động ở chế độ fallback hoặc bị hạn chế.`);
    }
  });
}

validateEnv();

module.exports = {
  JWT_SECRET: process.env.JWT_SECRET,
  MONGODB_URI: process.env.MONGODB_URI,
  NODE_ENV: process.env.NODE_ENV || 'development'
};
