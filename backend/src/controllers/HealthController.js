const mongoose = require('mongoose');
const { isRedisConnected } = require('../config/redis');
const sseService = require('../services/SseService');

class HealthController {
  static getHealth(req, res) {
    const isDbReady = mongoose.connection && mongoose.connection.readyState === 1;

    if (!isDbReady) {
      return res.status(503).json({
        status: 'error',
        database: 'disconnected',
        timestamp: new Date().toISOString()
      });
    }

    return res.status(200).send('ok');
  }

  static getDetailedHealth(req, res) {
    const memory = process.memoryUsage();
    const isDbReady = mongoose.connection && mongoose.connection.readyState === 1;
    const statusCode = isDbReady ? 200 : 503;

    return res.status(statusCode).json({
      status: isDbReady ? 'healthy' : 'degraded',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      database: {
        status: isDbReady ? 'connected' : 'disconnected',
        readyState: mongoose.connection ? mongoose.connection.readyState : 0,
        host: mongoose.connection ? mongoose.connection.host : null,
        name: mongoose.connection ? mongoose.connection.name : null
      },
      redis: {
        status: isRedisConnected() ? 'connected' : 'fallback_memory'
      },
      memory: {
        rss: `${Math.round(memory.rss / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memory.heapTotal / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memory.heapUsed / 1024 / 1024)}MB`,
        external: `${Math.round(memory.external / 1024 / 1024)}MB`
      },
      sse: sseService.getClientStats()
    });
  }
}

module.exports = HealthController;
