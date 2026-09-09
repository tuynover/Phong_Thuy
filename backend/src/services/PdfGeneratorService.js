const puppeteer = require('puppeteer');
const { redisClient, isRedisConnected, withTimeout } = require('../config/redis');
const logger = require('./LoggerService');

class PdfGeneratorService {
  constructor() {
    this.browser = null;
    this.activeWorkers = 0;
    this.maxConcurrent = 2; // Giới hạn tối đa 2 render cùng lúc để bảo vệ RAM server
    this.idleTimer = null;
  }

  /**
   * Khởi động hoặc tái sử dụng browser singleton
   */
  async getBrowser() {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }

    if (this.browser && this.browser.connected) {
      return this.browser;
    }

    logger.info('[PdfGeneratorService] Khởi tạo Chromium singleton worker...');

    // Tự động tìm kiếm đường dẫn executable phù hợp trên Linux / Docker hoặc từ biến môi trường
    let executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    if (!executablePath && process.platform === 'linux') {
      const fs = require('fs');
      const candidatePaths = [
        '/usr/bin/chromium',
        '/usr/bin/chromium-browser',
        '/usr/bin/google-chrome-stable',
        '/usr/bin/google-chrome'
      ];
      for (const p of candidatePaths) {
        if (fs.existsSync(p)) {
          executablePath = p;
          break;
        }
      }
    }

    if (executablePath) {
      logger.info(`[PdfGeneratorService] Sử dụng browser executable tại: ${executablePath}`);
    }

    this.browser = await puppeteer.launch({
      headless: 'new',
      ...(executablePath ? { executablePath } : {}),
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote'
      ]
    });

    this.browser.on('disconnected', () => {
      this.browser = null;
    });

    return this.browser;
  }

  /**
   * Đặt lịch tắt browser nếu không có tác vụ nào sau 5 phút để giải phóng RAM
   */
  scheduleIdleClose() {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(async () => {
      if (this.activeWorkers === 0 && this.browser) {
        try {
          logger.info('[PdfGeneratorService] Tự động giải phóng Chromium browser do không hoạt động (idle).');
          await this.browser.close();
          this.browser = null;
        } catch (e) {
          // Ignore
        }
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Đợi slot trống nếu đã vượt quá số worker đồng thời
   */
  async acquireSlot() {
    while (this.activeWorkers >= this.maxConcurrent) {
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    this.activeWorkers++;
  }

  releaseSlot() {
    this.activeWorkers = Math.max(0, this.activeWorkers - 1);
    if (this.activeWorkers === 0) {
      this.scheduleIdleClose();
    }
  }

  /**
   * Kết xuất HTML sang PDF Buffer có đệm L2 Redis
   * @param {string} htmlContent - Mã HTML đã chuẩn bị
   * @param {string} cacheKey - Khóa đệm Redis (tùy chọn)
   */
  async renderHtmlToPdf(htmlContent, cacheKey = null) {
    // 1. Kiểm tra L2 Redis Cache
    if (cacheKey && isRedisConnected()) {
      try {
        const cachedBase64 = await withTimeout(redisClient.get(cacheKey), 300, null);
        if (cachedBase64) {
          return {
            buffer: Buffer.from(cachedBase64, 'base64'),
            isCacheHit: true
          };
        }
      } catch (err) {
        // Fallback silently if redis times out
      }
    }

    // 2. Chờ slot render an toàn bộ nhớ
    await this.acquireSlot();
    let page = null;

    try {
      const browser = await this.getBrowser();
      page = await browser.newPage();

      // Đặt timeout 25s
      page.setDefaultNavigationTimeout(25000);

      // Nạp nội dung HTML và đợi network ổn định để tải font Google
      await page.setContent(htmlContent, {
        waitUntil: ['load', 'networkidle0'],
        timeout: 25000
      });

      // Tạo PDF Buffer chuẩn A4
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '10mm',
          bottom: '12mm',
          left: '12mm',
          right: '12mm'
        }
      });

      // 3. Lưu vào Redis Cache (TTL: 24h)
      if (cacheKey && isRedisConnected() && pdfBuffer) {
        withTimeout(
          redisClient.setex(cacheKey, 24 * 60 * 60, Buffer.from(pdfBuffer).toString('base64')),
          500,
          null
        ).catch(() => {});
      }

      return {
        buffer: Buffer.from(pdfBuffer),
        isCacheHit: false
      };
    } finally {
      if (page) {
        try {
          await page.close();
        } catch (e) {
          // Ignore
        }
      }
      this.releaseSlot();
    }
  }
}

module.exports = new PdfGeneratorService();
