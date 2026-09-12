const mongoose = require('mongoose');
const logger = require('../services/LoggerService');
const { seedBlogPosts } = require('../services/BlogSeedService');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 100, // Tối ưu sẵn sàng phục vụ 100 CCU đồng thời
      minPoolSize: 10,  // Giữ ấm 10 kết nối thường trực, triệt tiêu độ trễ handshake
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    
    // Seed default professional Feng Shui articles
    await seedBlogPosts();
  } catch (error) {
    logger.error(`MongoDB Connection Error: ${error.message}`, error);
    process.exit(1);
  }
};

module.exports = connectDB;
