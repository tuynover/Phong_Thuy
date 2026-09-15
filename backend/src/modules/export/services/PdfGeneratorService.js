const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const puppeteer = require('puppeteer');
const { redisClient, isRedisConnected, withTimeout } = require('../../../core/config/redis');
const logger = require('../../../core/services/LoggerService');

// Thư mục đệm tạm thời trên ổ đĩa cho tệp PDF (Zero Redis RAM footprint)
const PDF_CACHE_DIR = path.join(__dirname, '../../../../scratch/pdf_cache');
if (!fs.existsSync(PDF_CACHE_DIR)) {
  try {
    fs.mkdirSync(PDF_CACHE_DIR, { recursive: true });
  } catch (e) {
    // Ignore error if already created
  }
}

/**
 * Hàng đợi Semaphore FIFO Promise kiểm soát số worker đồng thời và độ dài hàng đợi
 */
class PdfSemaphoreQueue {
  constructor(maxConcurrent = 2, maxQueueSize = 20, timeoutMs = 30000) {
    this.maxConcurrent = maxConcurrent;
    this.maxQueueSize = maxQueueSize;
    this.timeoutMs = timeoutMs;
    this.activeWorkers = 0;
    this.queue = [];
  }

  async acquire() {
    if (this.activeWorkers < this.maxConcurrent) {
      this.activeWorkers++;
      return () => this.release();
    }

    if (this.queue.length >= this.maxQueueSize) {
      const err = new Error('Hệ thống tạo bản in PDF đang quá tải (hàng đợi đầy). Vui lòng thử lại sau giây lát.');
      err.status = 503;
      throw err;
    }

    return new Promise((resolve, reject) => {
      let timer = null;
      const item = {
        resolve: () => {
          if (timer) clearTimeout(timer);
          this.activeWorkers++;
          resolve(() => this.release());
        },
        reject: (err) => {
          if (timer) clearTimeout(timer);
          reject(err);
        }
      };

      timer = setTimeout(() => {
        const idx = this.queue.indexOf(item);
        if (idx !== -1) {
          this.queue.splice(idx, 1);
          const timeoutErr = new Error('Thời gian chờ xuất PDF quá hạn (timeout). Vui lòng thử lại sau.');
          timeoutErr.status = 504;
          reject(timeoutErr);
        }
      }, this.timeoutMs);
      if (timer.unref) timer.unref();

      this.queue.push(item);
    });
  }

  release() {
    this.activeWorkers = Math.max(0, this.activeWorkers - 1);
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      next.resolve();
    }
  }

  get stats() {
    return {
      activeWorkers: this.activeWorkers,
      queueLength: this.queue.length,
      maxConcurrent: this.maxConcurrent,
      maxQueueSize: this.maxQueueSize
    };
  }
}

class PdfGeneratorService {
  constructor() {
    this.browser = null;
    const maxConcurrent = parseInt(process.env.PDF_MAX_CONCURRENT, 10) || 2;
    const maxQueueSize = parseInt(process.env.PDF_MAX_QUEUE, 10) || 20;
    const queueTimeoutMs = parseInt(process.env.PDF_QUEUE_TIMEOUT_MS, 10) || 30000;

    this.semaphore = new PdfSemaphoreQueue(maxConcurrent, maxQueueSize, queueTimeoutMs);
    this.idleTimer = null;
  }

  get activeWorkers() {
    return this.semaphore.activeWorkers;
  }

  get maxConcurrent() {
    return this.semaphore.maxConcurrent;
  }

  getCacheFilePath(cacheKey) {
    const hash = crypto.createHash('sha256').update(cacheKey).digest('hex');
    return path.join(PDF_CACHE_DIR, `${hash}.pdf`);
  }

  /**
   * Khởi động hoặc tái sử dụng Chromium singleton worker
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

    let executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    if (!executablePath && process.platform === 'linux') {
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
        '--no-zygote',
        '--disable-extensions',
        '--disable-background-networking',
        '--disable-default-apps',
        '--disable-sync',
        '--mute-audio',
        '--no-default-browser-check'
      ]
    });

    this.browser.on('disconnected', () => {
      this.browser = null;
    });

    return this.browser;
  }

  /**
   * Đặt lịch tắt browser nếu không có tác vụ nào sau 15 phút để giải phóng RAM
   */
  scheduleIdleClose() {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(async () => {
      if (this.semaphore.activeWorkers === 0 && this.browser) {
        try {
          logger.info('[PdfGeneratorService] Tự động giải phóng Chromium browser do không hoạt động (idle).');
          await this.browser.close();
          this.browser = null;
        } catch (e) {
          // Ignore
        }
      }
    }, 15 * 60 * 1000); // 15 phút
    if (this.idleTimer.unref) this.idleTimer.unref();
  }

  /**
   * Kết xuất HTML sang PDF Buffer có đệm tệp SSD (Zero Redis RAM)
   * @param {string} htmlContent - Mã HTML đã chuẩn bị
   * @param {string} cacheKey - Khóa đệm (tùy chọn)
   */
  async renderHtmlToPdf(htmlContent, cacheKey = null) {
    const cacheFilePath = cacheKey ? this.getCacheFilePath(cacheKey) : null;

    // 1. Kiểm tra Cache trên ổ đĩa SSD
    if (cacheFilePath && fs.existsSync(cacheFilePath)) {
      try {
        const stats = await fs.promises.stat(cacheFilePath);
        const ageMs = Date.now() - stats.mtimeMs;
        const maxAgeMs = 24 * 60 * 60 * 1000; // 24 giờ

        if (ageMs <= maxAgeMs) {
          const now = new Date();
          fs.utimes(cacheFilePath, now, now, () => {}); // Cập nhật mtime
          const buffer = await fs.promises.readFile(cacheFilePath);
          return {
            buffer,
            isCacheHit: true
          };
        } else {
          // Tệp cache đã quá hạn 24h
          fs.promises.unlink(cacheFilePath).catch(() => {});
        }
      } catch (err) {
        logger.warn(`[PdfGeneratorService] Lỗi khi đọc file cache: ${err.message}`);
      }
    }

    // 2. Chờ slot render an toàn qua Semaphore FIFO Queue
    const releaseSlot = await this.semaphore.acquire();
    let page = null;

    try {
      const browser = await this.getBrowser();
      page = await browser.newPage();

      // Đặt timeout 25s
      page.setDefaultNavigationTimeout(25000);

      // Chặn tài nguyên media, websocket và chặn SSRF tới các dải IP nội bộ/metadata
      if (typeof page.setRequestInterception === 'function') {
        try {
          await page.setRequestInterception(true);
          page.on('request', req => {
            const resource = req.resourceType();
            if (resource === 'media' || resource === 'websocket') {
              return req.abort();
            }

            try {
              const reqUrl = typeof req.url === 'function' ? req.url() : (req.url || '');
              if (reqUrl) {
                const parsed = new URL(reqUrl);
                const host = parsed.hostname.toLowerCase();
                const isPrivateOrMetadata = 
                  host === 'localhost' ||
                  host === '127.0.0.1' ||
                  host === '::1' ||
                  host === '169.254.169.254' ||
                  /^10\./.test(host) ||
                  /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host) ||
                  /^192\.168\./.test(host);

                if (isPrivateOrMetadata || parsed.protocol === 'file:') {
                  logger.warn(`[PdfGeneratorService] Blocked potential SSRF request to: ${reqUrl}`);
                  return req.abort('accessdenied');
                }
              }
            } catch (urlErr) {
              return req.abort();
            }

            req.continue();
          });
        } catch (e) {
          // Bỏ qua nếu môi trường test không hỗ trợ interception
        }
      }

      // Nạp nội dung HTML - chỉ đợi DOM nạp xong để tránh treo khi tải font ngoại
      await page.setContent(htmlContent, {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      });

      // Khoảng nghỉ tối ưu 30ms để CSS và engine layout ổn định trước khi in
      await new Promise(resolve => setTimeout(resolve, 30));

      // Tạo PDF Buffer chuẩn A4 có preferCSSPageSize
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
        margin: {
          top: '10mm',
          bottom: '12mm',
          left: '12mm',
          right: '12mm'
        }
      });

      const bufferResult = Buffer.from(pdfBuffer);

      // 3. Ghi tệp đệm ra đĩa SSD bất đồng bộ (Zero Redis RAM)
      if (cacheFilePath && bufferResult.length > 0) {
        fs.promises.writeFile(cacheFilePath, bufferResult).catch(writeErr => {
          logger.warn(`[PdfGeneratorService] Không thể ghi file cache PDF: ${writeErr.message}`);
        });

        // Đánh dấu nhẹ vào Redis (1 byte, không lưu base64)
        if (isRedisConnected()) {
          withTimeout(redisClient.setex(cacheKey, 24 * 60 * 60, '1'), 300, null).catch(() => {});
        }
      }

      return {
        buffer: bufferResult,
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
      releaseSlot();
      if (this.semaphore.activeWorkers === 0) {
        this.scheduleIdleClose();
      }
    }
  }

  getStats() {
    return this.semaphore.stats;
  }
}

const instance = new PdfGeneratorService();
instance.PdfSemaphoreQueue = PdfSemaphoreQueue;

module.exports = instance;
