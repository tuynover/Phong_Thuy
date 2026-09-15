const HealthController = require('../../src/core/controllers/HealthController');
const mongoose = require('mongoose');
const { isRedisConnected } = require('../../src/core/config/redis');
const sseService = require('../../src/core/services/SseService');

jest.mock('mongoose', () => ({
  connection: {
    readyState: 1,
    host: 'mock-mongo-host',
    name: 'phongthuy',
    db: {
      admin: () => ({
        ping: jest.fn().mockResolvedValue(true)
      })
    }
  }
}));

jest.mock('../../src/core/config/redis', () => ({
  isRedisConnected: jest.fn().mockReturnValue(true),
  redisClient: {
    ping: jest.fn().mockResolvedValue('PONG'),
    llen: jest.fn().mockResolvedValue(0)
  },
  withTimeout: jest.fn(async (promise) => promise)
}));

jest.mock('../../src/core/services/SseService', () => ({
  getClientStats: jest.fn().mockReturnValue({
    adminClients: 1,
    uniqueUsers: 2,
    totalUserSessions: 3
  })
}));

describe('HealthController Unit Tests', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('GET /health (Liveness / Readiness Probe)', () => {
    test('should return 200 with ok when database is ready (readyState: 1)', () => {
      mongoose.connection.readyState = 1;

      HealthController.getHealth(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith('ok');
    });

    test('should return 503 when database is disconnected (readyState: 0)', () => {
      mongoose.connection.readyState = 0;

      HealthController.getHealth(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          database: 'disconnected',
          timestamp: expect.any(String)
        })
      );
    });
  });

  describe('GET /health/detailed (Observability & Metrics)', () => {
    test('should return 200 with complete system metrics when healthy', async () => {
      mongoose.connection.readyState = 1;
      isRedisConnected.mockReturnValue(true);

      await HealthController.getDetailedHealth(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'healthy',
          database: expect.objectContaining({
            status: 'connected',
            readyState: 1,
            host: 'mock-mongo-host'
          }),
          redis: expect.objectContaining({
            status: 'connected'
          }),
          memory: expect.objectContaining({
            rss: expect.stringMatching(/\d+MB/),
            heapTotal: expect.stringMatching(/\d+MB/),
            heapUsed: expect.stringMatching(/\d+MB/)
          }),
          sse: expect.objectContaining({
            adminClients: 1,
            uniqueUsers: 2,
            totalUserSessions: 3
          })
        })
      );
    });

    test('should return 503 with degraded status when MongoDB is not ready', async () => {
      mongoose.connection.readyState = 2; // 2 = connecting

      await HealthController.getDetailedHealth(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'degraded',
          database: expect.objectContaining({
            status: 'disconnected',
            readyState: 2
          })
        })
      );
    });

    test('should report fallback_memory when Redis is not connected', async () => {
      mongoose.connection.readyState = 1;
      isRedisConnected.mockReturnValue(false);

      await HealthController.getDetailedHealth(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          redis: expect.objectContaining({ status: 'fallback_memory' })
        })
      );
    });
  });
});
