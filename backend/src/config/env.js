const logger = require('../services/LoggerService');

function validateEnv() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim() === '') {
    logger.error('FATAL ERROR: Khởi tạo ứng dụng thất bại. Biến môi trường JWT_SECRET chưa được cấu hình!');
    console.error('FATAL ERROR: JWT_SECRET environment variable is missing. Please define JWT_SECRET in your environment or .env file.');
    process.exit(1);
  }
}

validateEnv();

module.exports = {
  JWT_SECRET: process.env.JWT_SECRET
};
