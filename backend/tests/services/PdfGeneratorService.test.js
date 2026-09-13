const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Mock puppeteer and redis
jest.mock('puppeteer', () => ({
  launch: jest.fn()
}));
jest.mock('../../src/core/config/redis', () => ({
  redisClient: {
    get: jest.fn().mockResolvedValue(null),
    setex: jest.fn().mockResolvedValue('OK')
  },
  isRedisConnected: jest.fn().mockReturnValue(true),
  withTimeout: jest.fn((p) => p)
}));
jest.mock('../../src/core/services/LoggerService', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

const puppeteer = require('puppeteer');
const pdfService = require('../../src/modules/export/services/PdfGeneratorService');
const { PdfSemaphoreQueue } = pdfService;

describe('PdfSemaphoreQueue Unit Tests', () => {
  test('should allow tasks up to maxConcurrent immediately', async () => {
    const queue = new PdfSemaphoreQueue(2, 5, 1000);
    expect(queue.activeWorkers).toBe(0);

    const release1 = await queue.acquire();
    expect(queue.activeWorkers).toBe(1);

    const release2 = await queue.acquire();
    expect(queue.activeWorkers).toBe(2);

    release1();
    expect(queue.activeWorkers).toBe(1);

    release2();
    expect(queue.activeWorkers).toBe(0);
  });

  test('should queue tasks when activeWorkers reach maxConcurrent and execute in FIFO order', async () => {
    const queue = new PdfSemaphoreQueue(1, 5, 2000);
    const order = [];

    const release1 = await queue.acquire();
    order.push('task1_started');

    // Task 2 gets queued
    const task2Promise = queue.acquire().then(release2 => {
      order.push('task2_started');
      release2();
    });

    expect(queue.activeWorkers).toBe(1);
    expect(queue.stats.queueLength).toBe(1);

    // Release task 1 -> task 2 starts
    release1();
    await task2Promise;

    expect(order).toEqual(['task1_started', 'task2_started']);
    expect(queue.activeWorkers).toBe(0);
    expect(queue.stats.queueLength).toBe(0);
  });

  test('should throw 503 error when queue length reaches maxQueueSize', async () => {
    const queue = new PdfSemaphoreQueue(1, 2, 2000);
    const release1 = await queue.acquire();

    // Fill queue to capacity (2 items)
    const p1 = queue.acquire();
    const p2 = queue.acquire();
    expect(queue.stats.queueLength).toBe(2);

    // 3rd queued item should be rejected immediately
    let err503 = null;
    try {
      await queue.acquire();
    } catch (e) {
      err503 = e;
    }
    expect(err503).not.toBeNull();
    expect(err503.status).toBe(503);
    expect(err503.message).toContain('quá tải');

    release1();
    const r1 = await p1;
    r1();
    const r2 = await p2;
    r2();
  });

  test('should throw 504 error when queued item times out', async () => {
    const queue = new PdfSemaphoreQueue(1, 5, 50); // 50ms timeout
    const release1 = await queue.acquire();

    let err504 = null;
    try {
      await queue.acquire();
    } catch (e) {
      err504 = e;
    }
    expect(err504).not.toBeNull();
    expect(err504.status).toBe(504);
    expect(err504.message).toContain('quá hạn');

    release1();
    expect(queue.activeWorkers).toBe(0);
  });
});

describe('PdfGeneratorService Cache & Render Unit Tests', () => {
  const testCacheKey = 'test_pdf_cache_unit_key_123';
  let cacheFilePath;

  beforeAll(() => {
    cacheFilePath = pdfService.getCacheFilePath(testCacheKey);
  });

  afterEach(async () => {
    if (fs.existsSync(cacheFilePath)) {
      try {
        await fs.promises.unlink(cacheFilePath);
      } catch (e) {}
    }
    jest.clearAllMocks();
  });

  afterAll(() => {
    if (pdfService.idleTimer) {
      clearTimeout(pdfService.idleTimer);
      pdfService.idleTimer = null;
    }
  });

  test('should return cached buffer when valid cache file exists on disk', async () => {
    const mockContent = Buffer.from('%PDF-1.4 Cached Content');
    await fs.promises.writeFile(cacheFilePath, mockContent);

    const result = await pdfService.renderHtmlToPdf('<html>Test</html>', testCacheKey);

    expect(result.isCacheHit).toBe(true);
    expect(result.buffer.toString()).toBe(mockContent.toString());
    expect(puppeteer.launch).not.toHaveBeenCalled();
  });

  test('should render via Chromium and save to disk when cache is a miss', async () => {
    const mockPdfBuffer = Buffer.from('%PDF-1.4 Newly Rendered');
    const mockPage = {
      setDefaultNavigationTimeout: jest.fn(),
      setContent: jest.fn().mockResolvedValue(true),
      pdf: jest.fn().mockResolvedValue(mockPdfBuffer),
      close: jest.fn().mockResolvedValue(true)
    };
    const mockBrowser = {
      connected: true,
      newPage: jest.fn().mockResolvedValue(mockPage),
      on: jest.fn(),
      close: jest.fn().mockResolvedValue(true)
    };
    puppeteer.launch = jest.fn().mockResolvedValue(mockBrowser);

    const result = await pdfService.renderHtmlToPdf('<html><body>Hello</body></html>', testCacheKey);

    expect(result.isCacheHit).toBe(false);
    expect(result.buffer.toString()).toBe(mockPdfBuffer.toString());
    expect(mockPage.setContent).toHaveBeenCalledWith(
      expect.stringContaining('Hello'),
      expect.objectContaining({ waitUntil: 'domcontentloaded' })
    );

    // Give asynchronous disk write a moment to complete
    await new Promise(r => setTimeout(r, 100));
    expect(fs.existsSync(cacheFilePath)).toBe(true);
    const savedOnDisk = await fs.promises.readFile(cacheFilePath);
    expect(savedOnDisk.toString()).toBe(mockPdfBuffer.toString());
  });
});
