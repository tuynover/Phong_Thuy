const HealthController = require('../../src/controllers/HealthController');
const mongoose = require('mongoose');
const { isRedisConnected } = require('../../src/config/redis');
const sseService = require('../../src/services/SseService');

jest.mock('mongoose', () => ({
  connection: {
    readyState: 1,
    host: 'mock-mongo-host',
    name: 'phongthuy'
  }
}));

jest.mock('../../src/config/redis', () => ({
  isRedisConnected: jest.fn().mockReturnValue(true)
}));

jest.mock('../../src/services/SseService', () => ({
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
    test('should return 200 "ok" when MongoDB is connected (readyState === 1)', () => {
      mongoose.connection.readyState = 1;

      HealthController.getHealth(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith('ok');
    });

    test('should return 503 Service Unavailable when MongoDB is disconnected (readyState !== 1)', () => {
      mongoose.connection.readyState = 0; // 0 = disconnected

      HealthController.getHealth(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          database: 'disconnected'
        })
      );
    });
  });

  describe('GET /health/detailed (Observability & Metrics)', () => {
    test('should return 200 with complete system metrics when healthy', () => {
      mongoose.connection.readyState = 1;
      isRedisConnected.mockReturnValue(true);

      HealthController.getDetailedHealth(req, res);

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

    test('should return 503 with degraded status when MongoDB is not ready', () => {
      mongoose.connection.readyState = 2; // 2 = connecting

      HealthController.getDetailedHealth(req, res);

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

    test('should report fallback_memory when Redis is not connected', () => {
      mongoose.connection.readyState = 1;
      isRedisConnected.mockReturnValue(false);

      HealthController.getDetailedHealth(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          redis: { status: 'fallback_memory' }
        })
      );
    });
  });
});
