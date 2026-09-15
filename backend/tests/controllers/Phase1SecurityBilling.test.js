const chatRateLimiter = require('../../src/core/middleware/chatRateLimiter');
const Conversation = require('../../src/core/models/Conversation');
const Message = require('../../src/core/models/Message');
const ConversationContextService = require('../../src/core/ai/ConversationContextService');
const User = require('../../src/core/models/User');

jest.mock('../../src/core/models/Conversation');
jest.mock('../../src/core/models/Message');
jest.mock('../../src/core/models/User');
jest.mock('../../src/core/config/redis', () => ({
  getUserProfileCache: jest.fn(),
  setUserProfileCache: jest.fn(),
  isRedisConnected: jest.fn(() => false),
  withTimeout: jest.fn((p) => p),
  redisClient: {
    pipeline: jest.fn()
  }
}));

describe('Phase 1 Security & Billing Unit Tests', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      params: { id: 'rec-123' },
      body: {},
      headers: {},
      originalUrl: '/api/v1/iching/rec-123/chat',
      dbUser: { _id: 'user-1', id: 'user-1' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn(),
      on: jest.fn()
    };
    next = jest.fn();
  });

  describe('chatRateLimiter Middleware', () => {
    test('should reject empty or whitespace questions with 400 without deducting credit', async () => {
      req.body.question = '   ';
      await chatRateLimiter(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Câu hỏi không được để trống.' }));
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject off-topic questions with 400 without deducting credit', async () => {
      req.body.question = 'Thời tiết hôm nay thế nào có bão không?';
      jest.spyOn(ConversationContextService, 'isDivinationRelated').mockReturnValue(false);

      await chatRateLimiter(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.stringContaining('Tôi là trợ lý luận giải Kinh Dịch')
      }));
      expect(next).not.toHaveBeenCalled();
    });

    test('should enforce 10s cooldown between messages with 429', async () => {
      req.body.question = 'Quẻ này có tốt cho kinh doanh không?';
      jest.spyOn(ConversationContextService, 'isDivinationRelated').mockReturnValue(true);

      const mockConversation = { _id: 'conv-123' };
      Conversation.findOne.mockResolvedValue(mockConversation);

      // Last message was 3 seconds ago
      Message.findOne.mockReturnValue({
        sort: jest.fn().mockResolvedValue({
          createdAt: new Date(Date.now() - 3000)
        })
      });

      await chatRateLimiter(req, res, next);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Vui lòng chờ 10 giây giữa các câu hỏi.'
      }));
      expect(next).not.toHaveBeenCalled();
    });

    test('should enforce 10 questions per hour limit with 429', async () => {
      req.body.question = 'Hào 3 biến động thế nào?';
      jest.spyOn(ConversationContextService, 'isDivinationRelated').mockReturnValue(true);

      const mockConversation = { _id: 'conv-123' };
      Conversation.findOne.mockResolvedValue(mockConversation);

      // Last message was 20 seconds ago (passes cooldown)
      Message.findOne.mockReturnValue({
        sort: jest.fn().mockResolvedValue({
          createdAt: new Date(Date.now() - 20000)
        })
      });

      // But already 10 messages in the last hour
      Message.countDocuments.mockResolvedValue(10);

      await chatRateLimiter(req, res, next);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.stringContaining('Bạn đã đạt giới hạn 10 câu hỏi/giờ')
      }));
      expect(next).not.toHaveBeenCalled();
    });

    test('should pass validation and call next() if question is valid and within limits', async () => {
      req.body.question = 'Ý nghĩa hào Lục Ngũ trong quẻ này là gì?';
      jest.spyOn(ConversationContextService, 'isDivinationRelated').mockReturnValue(true);

      const mockConversation = { _id: 'conv-123' };
      Conversation.findOne.mockResolvedValue(mockConversation);

      Message.findOne.mockReturnValue({
        sort: jest.fn().mockResolvedValue({
          createdAt: new Date(Date.now() - 30000)
        })
      });
      Message.countDocuments.mockResolvedValue(2);

      await chatRateLimiter(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.conversation).toBe(mockConversation);
    });
  });

  describe('Deleted Account Registration Protection', () => {
    test('register should reject takeover of soft-deleted account', async () => {
      const AuthController = require('../../src/modules/auth/controllers/AuthController');
      req.body = {
        email: 'deleted@example.com',
        password: 'password123',
        name: 'Attacker'
      };

      User.findOne.mockResolvedValue({
        email: 'deleted@example.com',
        isDeleted: true
      });

      await AuthController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('từng bị xóa hoặc vô hiệu hóa')
      }));
    });
  });
});
