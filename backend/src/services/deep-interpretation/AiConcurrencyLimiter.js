/**
 * AiConcurrencyLimiter.js
 * Bộ điều tiết kiểm soát số lượng luồng Luận Giải Chuyên Sâu (VIP Pipeline) chạy đồng thời.
 * Ngăn chặn lỗi HTTP 429 Too Many Requests từ Gemini/OpenRouter khi nhiều người dùng cùng yêu cầu.
 */

const logger = require('../LoggerService');
const { SseStreamHelper } = require('./DeepInterpretationCore');

class AiConcurrencyLimiter {
  constructor(maxConcurrent = 3, maxQueueLength = 15, queueTimeoutMs = 60000) {
    this.maxConcurrent = parseInt(process.env.AI_VIP_MAX_CONCURRENT, 10) || maxConcurrent;
    this.maxQueueLength = parseInt(process.env.AI_VIP_MAX_QUEUE, 10) || maxQueueLength;
    this.queueTimeoutMs = parseInt(process.env.AI_VIP_QUEUE_TIMEOUT_MS, 10) || queueTimeoutMs;
    this.activeTasks = 0;
    this.queue = [];
  }

  /**
   * Đưa tác vụ vào hàng đợi nếu vượt quá giới hạn concurrent
   * @param {Function} taskFn - Hàm thực thi pipeline trả về ReadableStream hoặc Promise
   * @param {Function} onProgress - Hàm callback SSE để gửi tiến trình cho client
   */
  async runWithLimit(taskFn, onProgress = null) {
    if (this.activeTasks < this.maxConcurrent) {
      this.activeTasks++;
      logger.info(`[AiConcurrencyLimiter] Cấp slot chạy ngay (Active: ${this.activeTasks}/${this.maxConcurrent})`);
      try {
        return await taskFn();
      } finally {
        this.release();
      }
    }

    if (this.queue.length >= this.maxQueueLength) {
      logger.warn(`[AiConcurrencyLimiter] Hàng đợi VIP quá tải (${this.queue.length}/${this.maxQueueLength})`);
      const err = new Error('Hệ thống luận giải chuyên sâu đang tiếp nhận lượng truy cập cao. Vui lòng chờ vài phút rồi thử lại.');
      err.status = 503;
      throw err;
    }

    // Xếp hàng chờ slot
    return new Promise((resolve, reject) => {
      let timer = null;
      const queueItem = {
        taskFn,
        onProgress,
        enteredAt: Date.now(),
        resolve: async () => {
          if (timer) clearTimeout(timer);
          this.activeTasks++;
          logger.info(`[AiConcurrencyLimiter] Slot được cấp phát từ hàng đợi (Active: ${this.activeTasks}/${this.maxConcurrent}, Còn chờ: ${this.queue.length})`);
          try {
            const result = await taskFn();
            resolve(result);
          } catch (err) {
            reject(err);
          } finally {
            this.release();
          }
        },
        reject: (err) => {
          if (timer) clearTimeout(timer);
          reject(err);
        }
      };

      timer = setTimeout(() => {
        const idx = this.queue.indexOf(queueItem);
        if (idx !== -1) {
          this.queue.splice(idx, 1);
          logger.warn(`[AiConcurrencyLimiter] Yêu cầu trong hàng đợi bị timeout sau ${this.queueTimeoutMs}ms`);
          const timeoutErr = new Error('Thời gian chờ xếp hàng luận giải chuyên sâu quá hạn. Vui lòng thử lại sau.');
          timeoutErr.status = 504;
          queueItem.reject(timeoutErr);
        }
      }, this.queueTimeoutMs);
      if (timer.unref) timer.unref();

      this.queue.push(queueItem);
      const position = this.queue.length;

      logger.info(`[AiConcurrencyLimiter] Đưa request vào hàng đợi VIP (Vị trí: #${position}, Đang chờ: ${this.queue.length})`);

      if (onProgress) {
        SseStreamHelper.dispatchProgress(onProgress, {
          stage: 'queued',
          position,
          message: `Hệ thống đang phục vụ các lượt phân tích trước. Đang chờ slot (vị trí: #${position})...`
        });
      }
    });
  }

  release() {
    this.activeTasks = Math.max(0, this.activeTasks - 1);
    if (this.queue.length > 0) {
      const nextItem = this.queue.shift();

      // Cập nhật vị trí mới cho các request còn lại trong hàng đợi
      this.queue.forEach((item, index) => {
        if (item.onProgress) {
          SseStreamHelper.dispatchProgress(item.onProgress, {
            stage: 'queued',
            position: index + 1,
            message: `Đang chờ slot phân tích (vị trí: #${index + 1})...`
          });
        }
      });

      nextItem.resolve();
    }
  }

  get stats() {
    return {
      activeTasks: this.activeTasks,
      queueLength: this.queue.length,
      maxConcurrent: this.maxConcurrent,
      maxQueueLength: this.maxQueueLength
    };
  }
}

const limiter = new AiConcurrencyLimiter();
limiter.AiConcurrencyLimiter = AiConcurrencyLimiter;

module.exports = limiter;
