jest.mock('../../src/core/services/LoggerService', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

const limiterInstance = require('../../src/modules/bazi/services/deep-interpretation/AiConcurrencyLimiter');
const { AiConcurrencyLimiter } = limiterInstance;

describe('AiConcurrencyLimiter Unit Tests', () => {
  test('should execute tasks immediately when activeTasks < maxConcurrent', async () => {
    const limiter = new AiConcurrencyLimiter(2, 5, 2000);
    expect(limiter.activeTasks).toBe(0);

    const task1 = jest.fn().mockResolvedValue('result_1');
    const task2 = jest.fn().mockResolvedValue('result_2');

    const res1 = await limiter.runWithLimit(task1);
    const res2 = await limiter.runWithLimit(task2);

    expect(res1).toBe('result_1');
    expect(res2).toBe('result_2');
    expect(limiter.activeTasks).toBe(0);
    expect(limiter.stats.queueLength).toBe(0);
  });

  test('should queue tasks and dispatch SSE status: queued with queue position', async () => {
    const limiter = new AiConcurrencyLimiter(1, 5, 5000);
    const progressEvents = [];
    const onProgress = (evt) => progressEvents.push(evt);

    let resolveTask1;
    const task1Promise = new Promise(resolve => {
      resolveTask1 = resolve;
    });
    const task1 = () => task1Promise;

    // Start task 1 (takes the slot)
    const run1 = limiter.runWithLimit(task1);
    expect(limiter.activeTasks).toBe(1);

    // Task 2 gets queued
    const task2 = jest.fn().mockResolvedValue('result_2');
    const run2 = limiter.runWithLimit(task2, onProgress);

    expect(limiter.activeTasks).toBe(1);
    expect(limiter.stats.queueLength).toBe(1);
    expect(progressEvents).toContainEqual(expect.objectContaining({
      stage: 'queued',
      position: 1
    }));

    // Resolve task 1 -> task 2 executes
    resolveTask1('result_1');
    const [res1, res2] = await Promise.all([run1, run2]);

    expect(res1).toBe('result_1');
    expect(res2).toBe('result_2');
    expect(limiter.activeTasks).toBe(0);
    expect(limiter.stats.queueLength).toBe(0);
  });

  test('should throw 503 error when VIP queue exceeds maxQueueLength', async () => {
    const limiter = new AiConcurrencyLimiter(1, 2, 5000);

    let resolveSlot;
    const slotPromise = new Promise(r => { resolveSlot = r; });
    const slotTask = () => slotPromise;

    // Task in progress
    const p0 = limiter.runWithLimit(slotTask);

    // Queue 2 items (reaches capacity)
    const p1 = limiter.runWithLimit(() => Promise.resolve(1));
    const p2 = limiter.runWithLimit(() => Promise.resolve(2));
    expect(limiter.stats.queueLength).toBe(2);

    // 3rd queued item exceeds limit -> 503
    let err503 = null;
    try {
      await limiter.runWithLimit(() => Promise.resolve(3));
    } catch (e) {
      err503 = e;
    }
    expect(err503).not.toBeNull();
    expect(err503.status).toBe(503);
    expect(err503.message).toContain('lượng truy cập cao');

    resolveSlot();
    await Promise.all([p0, p1, p2]);
  });

  test('should throw 504 error when queued VIP item times out', async () => {
    const limiter = new AiConcurrencyLimiter(1, 5, 50); // 50ms timeout

    let resolveSlot;
    const slotPromise = new Promise(r => { resolveSlot = r; });
    const p0 = limiter.runWithLimit(() => slotPromise);

    let err504 = null;
    try {
      await limiter.runWithLimit(() => Promise.resolve('never'));
    } catch (e) {
      err504 = e;
    }

    expect(err504).not.toBeNull();
    expect(err504.status).toBe(504);
    expect(err504.message).toContain('quá hạn');

    resolveSlot();
    await p0;
    expect(limiter.activeTasks).toBe(0);
  });
});
