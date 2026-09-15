const AdminRecordController = require('../../src/modules/admin/controllers/AdminRecordController');
const RedisQueueService = require('../../src/core/services/RedisQueueService');

jest.mock('../../src/core/services/RedisQueueService');

describe('AdminRecordController Queue Management Endpoints', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = {
      query: {},
      body: {},
      params: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  test('getQueueStatus should return queue status and dlq jobs', async () => {
    RedisQueueService.getQueueStatus.mockResolvedValueOnce({ active: 2, dlq: 1, isConnected: true });
    RedisQueueService.getDlqJobs.mockResolvedValueOnce([{ id: 'job-1', to: 'test@example.com' }]);

    await AdminRecordController.getQueueStatus(mockReq, mockRes);

    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      queue: { active: 2, dlq: 1, isConnected: true },
      dlqJobs: [{ id: 'job-1', to: 'test@example.com' }]
    });
  });

  test('retryDlqJob should return 400 when jobId is missing', async () => {
    mockReq.body = {};
    await AdminRecordController.retryDlqJob(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Thiếu jobId cần thử lại.' })
    );
  });

  test('retryDlqJob should return 404 when job not found or failed', async () => {
    mockReq.body = { jobId: 'job-not-found' };
    RedisQueueService.retryDlqJob.mockResolvedValueOnce(false);

    await AdminRecordController.retryDlqJob(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(404);
  });

  test('retryDlqJob should succeed when job is found and retried', async () => {
    mockReq.body = { jobId: 'job-123' };
    RedisQueueService.retryDlqJob.mockResolvedValueOnce(true);

    await AdminRecordController.retryDlqJob(mockReq, mockRes);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      message: 'Đã đưa job job-123 trở lại hàng đợi chính.'
    });
  });

  test('clearDlq should clear all jobs from DLQ', async () => {
    RedisQueueService.clearDlq.mockResolvedValueOnce(true);

    await AdminRecordController.clearDlq(mockReq, mockRes);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      message: 'Đã dọn dẹp toàn bộ job trong DLQ.'
    });
  });
});
