const mongoose = require('mongoose');
const logger = require('../services/LoggerService');
const { seedBlogPosts } = require('../services/BlogSeedService');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    
    // Seed default professional Feng Shui articles
    await seedBlogPosts();
  } catch (error) {
    logger.error(`MongoDB Connection Error: ${error.message}`, error);
    process.exit(1);
  }
};

module.exports = connectDB;
