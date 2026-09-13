const fs = require('fs');
const path = require('path');

// Mock dependencies of NotificationScheduler so test runs in isolation
jest.mock('../../src/modules/iching/models/IChingRecord', () => ({ find: jest.fn().mockResolvedValue([]) }));
jest.mock('../../src/core/models/User', () => ({ find: jest.fn().mockResolvedValue([]), findById: jest.fn().mockResolvedValue(null) }));
jest.mock('../../src/modules/notification/models/Notification', () => ({ deleteMany: jest.fn().mockResolvedValue({}) }));
jest.mock('../../src/modules/admin/models/SystemLog', () => ({ countDocuments: jest.fn().mockResolvedValue(0) }));
jest.mock('../../src/modules/admin/models/AdminNotification', () => ({ create: jest.fn().mockResolvedValue({}) }));
jest.mock('../../src/modules/bazi/models/BaziRecord', () => ({ deleteMany: jest.fn().mockResolvedValue({}) }));
jest.mock('../../src/modules/ziwei/models/ZiweiRecord', () => ({ deleteMany: jest.fn().mockResolvedValue({}) }));
jest.mock('../../src/modules/bazi/models/MarriageRecord', () => ({ deleteMany: jest.fn().mockResolvedValue({}) }));
jest.mock('../../src/core/models/Conversation', () => ({ deleteMany: jest.fn().mockResolvedValue({}) }));
jest.mock('../../src/core/models/Message', () => ({ deleteMany: jest.fn().mockResolvedValue({}) }));
jest.mock('../../src/modules/admin/models/BanAppeal', () => ({ deleteMany: jest.fn().mockResolvedValue({}) }));
jest.mock('../../src/modules/auth/services/EmailService', () => ({ sendNotificationEmail: jest.fn().mockResolvedValue(true) }));
jest.mock('../../src/core/services/LoggerService', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

const { purgeExpiredCacheFiles, stopScheduler } = require('../../src/modules/notification/services/NotificationScheduler');

describe('NotificationScheduler Cache Pruning Unit Tests', () => {
  const testPdfDir = path.join(__dirname, '../../scratch/pdf_cache');
  const oldPdfFile = path.join(testPdfDir, 'test_old_file_to_purge.pdf');
  const freshPdfFile = path.join(testPdfDir, 'test_fresh_file_to_keep.pdf');

  beforeAll(() => {
    if (!fs.existsSync(testPdfDir)) {
      fs.mkdirSync(testPdfDir, { recursive: true });
    }
  });

  afterAll(() => {
    stopScheduler();
    if (fs.existsSync(oldPdfFile)) {
      try { fs.unlinkSync(oldPdfFile); } catch (e) {}
    }
    if (fs.existsSync(freshPdfFile)) {
      try { fs.unlinkSync(freshPdfFile); } catch (e) {}
    }
  });

  test('should delete cache files older than 24h and preserve fresh files', async () => {
    // 1. Create a fresh file (< 24h)
    fs.writeFileSync(freshPdfFile, '%PDF-1.4 Fresh Content');
    const now = new Date();
    fs.utimesSync(freshPdfFile, now, now);

    // 2. Create an old file (> 25h ago)
    fs.writeFileSync(oldPdfFile, '%PDF-1.4 Old Content');
    const twentyFiveHoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000);
    fs.utimesSync(oldPdfFile, twentyFiveHoursAgo, twentyFiveHoursAgo);

    expect(fs.existsSync(oldPdfFile)).toBe(true);
    expect(fs.existsSync(freshPdfFile)).toBe(true);

    // 3. Execute purge
    await purgeExpiredCacheFiles();

    // 4. Assert old file was purged, fresh file was kept
    expect(fs.existsSync(oldPdfFile)).toBe(false);
    expect(fs.existsSync(freshPdfFile)).toBe(true);
  });
});
