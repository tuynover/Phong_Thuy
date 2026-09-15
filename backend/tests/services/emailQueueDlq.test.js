const EmailService = require('../../src/modules/auth/services/EmailService');

// Setup in-memory mock for redisClient with mock prefix allowed by Jest Babel
const mockMemoryQueues = new Map();

jest.mock('../../src/modules/auth/services/EmailService', () => ({
  sendEmail: jest.fn()
}));

jest.mock('../../src/core/config/redis', () => ({
  isRedisConnected: jest.fn(() => true),
  redisClient: {
    rpush: jest.fn(async (key, val) => {
      if (!mockMemoryQueues.has(key)) mockMemoryQueues.set(key, []);
      mockMemoryQueues.get(key).push(val);
      return mockMemoryQueues.get(key).length;
    }),
    lpop: jest.fn(async (key) => {
      if (!mockMemoryQueues.has(key)) return null;
      const q = mockMemoryQueues.get(key);
      return q.length > 0 ? q.shift() : null;
    }),
    llen: jest.fn(async (key) => {
      return (mockMemoryQueues.get(key) || []).length;
    }),
    lrange: jest.fn(async (key, start, stop) => {
      const list = mockMemoryQueues.get(key) || [];
      if (stop === -1) return list.slice(start);
      return list.slice(start, stop + 1);
    }),
    lrem: jest.fn(async (key, count, val) => {
      if (!mockMemoryQueues.has(key)) return 0;
      const list = mockMemoryQueues.get(key);
      const idx = list.indexOf(val);
      if (idx !== -1) {
        list.splice(idx, 1);
        return 1;
      }
      return 0;
    }),
    del: jest.fn(async (key) => {
      mockMemoryQueues.delete(key);
      return 1;
    })
  }
}));

const RedisQueueService = require('../../src/core/services/RedisQueueService');

describe('RedisQueueService with Retry & Dead Letter Queue (DLQ)', () => {
  beforeEach(() => {
    mockMemoryQueues.clear();
    jest.clearAllMocks();
  });

  test('should enqueue email job with UUIDv7 ID and initial attempts = 0', async () => {
    const success = await RedisQueueService.enqueueEmail({
      to: 'test@example.com',
      subject: 'Test Subject',
      html: '<p>Hello</p>'
    });

    expect(success).toBe(true);
    const queueItems = mockMemoryQueues.get('queue:emails');
    expect(queueItems).toBeDefined();
    expect(queueItems.length).toBe(1);

    const job = JSON.parse(queueItems[0]);
    expect(job.to).toBe('test@example.com');
    expect(job.subject).toBe('Test Subject');
    expect(job.html).toBe('<p>Hello</p>');
    expect(job.attempts).toBe(0);
    expect(job.maxAttempts).toBe(3);
    expect(typeof job.id).toBe('string');
    expect(job.id.length).toBeGreaterThan(0);
    expect(typeof job.createdAt).toBe('number');
  });

  test('should successfully process job when EmailService succeeds', async () => {
    EmailService.sendEmail.mockResolvedValueOnce(true);

    const job = {
      id: 'job-1',
      to: 'success@example.com',
      subject: 'Hello',
      html: '<p>Ok</p>',
      attempts: 0,
      maxAttempts: 3
    };

    const res = await RedisQueueService.processJob(job);
    expect(res.success).toBe(true);
    expect(EmailService.sendEmail).toHaveBeenCalledWith({
      to: 'success@example.com',
      subject: 'Hello',
      html: '<p>Ok</p>'
    });
  });

  test('should retry job when EmailService throws error and attempts < maxAttempts', async () => {
    EmailService.sendEmail.mockRejectedValueOnce(new Error('SMTP connection timeout'));

    const job = {
      id: 'retry-job-1',
      to: 'retry@example.com',
      subject: 'Retry Mail',
      html: '<p>Retry</p>',
      attempts: 0,
      maxAttempts: 3
    };

    const res = await RedisQueueService.processJob(job);
    expect(res.success).toBe(false);

    // Job should be pushed back to main queue
    const queueItems = mockMemoryQueues.get('queue:emails');
    expect(queueItems.length).toBe(1);

    const requeuedJob = JSON.parse(queueItems[0]);
    expect(requeuedJob.id).toBe('retry-job-1');
    expect(requeuedJob.attempts).toBe(1);
    expect(requeuedJob.lastError).toBe('SMTP connection timeout');

    // DLQ should remain empty
    expect(mockMemoryQueues.has('queue:emails:dlq')).toBe(false);
  });

  test('should move job to DLQ when attempts reach maxAttempts', async () => {
    EmailService.sendEmail.mockRejectedValueOnce(new Error('SMTP authentication failed'));

    const job = {
      id: 'dlq-job-1',
      to: 'failure@example.com',
      subject: 'Fatal Mail',
      html: '<p>Fatal</p>',
      attempts: 2,
      maxAttempts: 3
    };

    const res = await RedisQueueService.processJob(job);
    expect(res.success).toBe(false);

    // Main queue should NOT have this job
    expect(mockMemoryQueues.has('queue:emails')).toBe(false);

    // DLQ should have received the failed job
    const dlqItems = mockMemoryQueues.get('queue:emails:dlq');
    expect(dlqItems).toBeDefined();
    expect(dlqItems.length).toBe(1);

    const dlqJob = JSON.parse(dlqItems[0]);
    expect(dlqJob.id).toBe('dlq-job-1');
    expect(dlqJob.attempts).toBe(3);
    expect(dlqJob.lastError).toBe('SMTP authentication failed');
  });

  test('should report queue status accurately', async () => {
    mockMemoryQueues.set('queue:emails', ['{"id":"1"}', '{"id":"2"}']);
    mockMemoryQueues.set('queue:emails:dlq', ['{"id":"dlq-1"}']);

    const status = await RedisQueueService.getQueueStatus();
    expect(status).toEqual({
      active: 2,
      dlq: 1,
      isConnected: true
    });
  });

  test('should retrieve DLQ jobs as parsed objects', async () => {
    const rawJob = { id: 'dlq-1', to: 'dlq@user.com', attempts: 3, lastError: 'Timeout' };
    mockMemoryQueues.set('queue:emails:dlq', [JSON.stringify(rawJob)]);

    const dlqJobs = await RedisQueueService.getDlqJobs();
    expect(dlqJobs.length).toBe(1);
    expect(dlqJobs[0].id).toBe('dlq-1');
    expect(dlqJobs[0].to).toBe('dlq@user.com');
  });

  test('should retry a DLQ job by moving it back to the active queue', async () => {
    const rawJob = { id: 'retry-me', to: 'retry@user.com', attempts: 3, lastError: 'Fatal error' };
    mockMemoryQueues.set('queue:emails:dlq', [JSON.stringify(rawJob)]);

    const retried = await RedisQueueService.retryDlqJob('retry-me');
    expect(retried).toBe(true);

    // DLQ should now be empty
    expect((mockMemoryQueues.get('queue:emails:dlq') || []).length).toBe(0);

    // Active queue should have the job with attempts reset to 0
    const activeJobs = mockMemoryQueues.get('queue:emails') || [];
    expect(activeJobs.length).toBe(1);
    const queuedJob = JSON.parse(activeJobs[0]);
    expect(queuedJob.id).toBe('retry-me');
    expect(queuedJob.attempts).toBe(0);
    expect(queuedJob.lastError).toBeNull();
  });

  test('should clear all jobs from DLQ', async () => {
    mockMemoryQueues.set('queue:emails:dlq', ['{"id":"1"}', '{"id":"2"}']);
    const cleared = await RedisQueueService.clearDlq();
    expect(cleared).toBe(true);
    expect(mockMemoryQueues.has('queue:emails:dlq')).toBe(false);
  });
});
