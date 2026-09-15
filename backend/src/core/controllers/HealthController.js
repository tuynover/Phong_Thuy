const mongoose = require('mongoose');
const { redisClient, isRedisConnected, withTimeout } = require('../config/redis');
const sseService = require('../services/SseService');
const RedisQueueService = require('../services/RedisQueueService');

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

  static async getDetailedHealth(req, res) {
    const memory = process.memoryUsage();
    const isDbReady = mongoose.connection && mongoose.connection.readyState === 1;
    const statusCode = isDbReady ? 200 : 503;

    let mongoLatencyMs = null;
    if (isDbReady && mongoose.connection.db) {
      const startMongo = Date.now();
      try {
        await mongoose.connection.db.admin().ping();
        mongoLatencyMs = Date.now() - startMongo;
      } catch (err) {
        mongoLatencyMs = -1;
      }
    }

    let redisLatencyMs = null;
    if (isRedisConnected() && redisClient) {
      const startRedis = Date.now();
      try {
        await withTimeout(redisClient.ping(), 500, null);
        redisLatencyMs = Date.now() - startRedis;
      } catch (err) {
        redisLatencyMs = -1;
      }
    }

    let queueStats = { active: 0, dlq: 0, isConnected: false };
    try {
      queueStats = await RedisQueueService.getQueueStatus();
    } catch (qErr) {
      queueStats.error = qErr.message;
    }

    return res.status(statusCode).json({
      status: isDbReady ? 'healthy' : 'degraded',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      database: {
        status: isDbReady ? 'connected' : 'disconnected',
        readyState: mongoose.connection ? mongoose.connection.readyState : 0,
        host: mongoose.connection ? mongoose.connection.host : null,
        name: mongoose.connection ? mongoose.connection.name : null,
        latencyMs: mongoLatencyMs
      },
      redis: {
        status: isRedisConnected() ? 'connected' : 'fallback_memory',
        latencyMs: redisLatencyMs
      },
      queue: queueStats,
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
