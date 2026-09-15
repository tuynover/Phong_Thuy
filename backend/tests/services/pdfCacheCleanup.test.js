const fs = require('fs');
const path = require('path');

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

const PdfGeneratorService = require('../../src/modules/export/services/PdfGeneratorService');

describe('PdfGeneratorService Cache Cleanup', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should delete expired PDF files older than maxAgeMs and keep fresh ones', async () => {
    const now = Date.now();
    const expiredTime = now - (25 * 60 * 60 * 1000); // 25h ago (> 24h)
    const freshTime = now - (2 * 60 * 60 * 1000);    // 2h ago (< 24h)

    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs.promises, 'readdir').mockResolvedValue([
      'expired1.pdf',
      'fresh1.pdf',
      'expired2.pdf',
      'not_a_pdf.txt'
    ]);

    const statMock = jest.spyOn(fs.promises, 'stat').mockImplementation(async (filePath) => {
      if (filePath.includes('expired1.pdf')) return { mtimeMs: expiredTime };
      if (filePath.includes('expired2.pdf')) return { mtimeMs: expiredTime };
      if (filePath.includes('fresh1.pdf')) return { mtimeMs: freshTime };
      return { mtimeMs: freshTime };
    });

    const unlinkMock = jest.spyOn(fs.promises, 'unlink').mockResolvedValue();

    const deletedCount = await PdfGeneratorService.cleanExpiredCache(24 * 60 * 60 * 1000);

    expect(deletedCount).toBe(2);
    expect(unlinkMock).toHaveBeenCalledTimes(2);
    expect(unlinkMock).toHaveBeenCalledWith(expect.stringContaining('expired1.pdf'));
    expect(unlinkMock).toHaveBeenCalledWith(expect.stringContaining('expired2.pdf'));
    expect(unlinkMock).not.toHaveBeenCalledWith(expect.stringContaining('fresh1.pdf'));
    expect(unlinkMock).not.toHaveBeenCalledWith(expect.stringContaining('not_a_pdf.txt'));
  });

  test('should return 0 when PDF_CACHE_DIR does not exist', async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    const deletedCount = await PdfGeneratorService.cleanExpiredCache();
    expect(deletedCount).toBe(0);
  });
});
