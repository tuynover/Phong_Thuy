const { v7: uuidv7 } = require('uuid');
const { redisClient, isRedisConnected } = require('../config/redis');
const logger = require('./LoggerService');
const EmailService = require('../../modules/auth/services/EmailService');

class RedisQueueService {
    constructor() {
        this.queueName = 'queue:emails';
        this.dlqName = 'queue:emails:dlq';
        this.isProcessing = false;
        this.maxConcurrency = 3;
        this.activeJobs = 0;
        this.startWorker();
    }

    /**
     * Đẩy tác vụ gửi email vào Redis Queue để xử lý ngầm (async)
     * @param {Object} emailOptions { to, subject, html, id?, maxAttempts? }
     * @returns {Promise<boolean>}
     */
    async enqueueEmail(emailOptions) {
        if (!emailOptions || !emailOptions.to) return false;

        const job = {
            id: emailOptions.id || uuidv7(),
            to: emailOptions.to,
            subject: emailOptions.subject || '',
            html: emailOptions.html || '',
            attempts: Number.isInteger(emailOptions.attempts) ? emailOptions.attempts : 0,
            maxAttempts: emailOptions.maxAttempts || 3,
            createdAt: emailOptions.createdAt || Date.now(),
            lastError: emailOptions.lastError || null
        };

        // If Redis is connected, push to Redis Queue for background processing
        if (isRedisConnected()) {
            try {
                const payload = JSON.stringify(job);
                await redisClient.rpush(this.queueName, payload);
                logger.info(`[RedisQueue] Enqueued email job [${job.id}] to [${job.to}]`);
                return true;
            } catch (err) {
                logger.warn(`[RedisQueue] Enqueue failed: ${err.message}. Sending email directly.`);
            }
        }

        // Fallback: Send email directly if Redis is unavailable
        EmailService.sendEmail({
            to: job.to,
            subject: job.subject,
            html: job.html
        }).catch(err => {
            logger.error(`[RedisQueue] Direct email sending failed: ${err.message}`);
        });
        return true;
    }

    /**
     * Xử lý đơn lẻ 1 email job với cơ chế retry và Dead Letter Queue (DLQ)
     * @param {Object|string} jobData 
     * @returns {Promise<{success: boolean, job: Object, error?: string}>}
     */
    async processJob(jobData) {
        const job = typeof jobData === 'string' ? JSON.parse(jobData) : jobData;
        try {
            logger.info(`[RedisQueue Worker] Processing email job [${job.id}] for [${job.to}]`);
            await EmailService.sendEmail({
                to: job.to,
                subject: job.subject,
                html: job.html
            });
            logger.info(`[RedisQueue Worker] Successfully processed email job [${job.id}] for [${job.to}]`);
            return { success: true, job };
        } catch (err) {
            job.attempts = (job.attempts || 0) + 1;
            job.lastError = err.message || 'Unknown error';

            if (isRedisConnected()) {
                const maxAttempts = job.maxAttempts || 3;
                if (job.attempts < maxAttempts) {
                    logger.warn(`[RedisQueue Worker] Retrying email job [${job.id}] for [${job.to}] (Attempt ${job.attempts}/${maxAttempts}): ${job.lastError}`);
                    await redisClient.rpush(this.queueName, JSON.stringify(job));
                } else {
                    logger.error(`[RedisQueue Worker] Job [${job.id}] for [${job.to}] exceeded maxAttempts (${maxAttempts}). Moved to DLQ: ${job.lastError}`);
                    await redisClient.rpush(this.dlqName, JSON.stringify(job));
                }
            }
            return { success: false, job, error: err.message };
        }
    }

    /**
     * Rút và xử lý 1 job đơn lẻ từ Redis Queue (Non-blocking)
     * @returns {Promise<{success: boolean, job: Object, error?: string}|null>}
     */
    async processNextJobOnce() {
        if (!isRedisConnected()) return null;
        try {
            const result = await redisClient.lpop(this.queueName);
            if (!result) return null;
            return await this.processJob(result);
        } catch (err) {
            logger.warn(`[RedisQueue Worker] Error in processNextJobOnce: ${err.message}`);
            return null;
        }
    }

    /**
     * Tiến trình Worker chạy ngầm liên tục rút job từ Redis Queue để gửi mail (Non-blocking LPOP với concurrency pool)
     */
    async startWorker() {
        if (process.env.NODE_ENV === 'test') return;
        if (this.isProcessing) return;
        this.isProcessing = true;

        const processLoop = async () => {
            let nextDelayMs = 2000; // Mặc định nghỉ 2 giây khi queue rỗng

            if (isRedisConnected()) {
                while (this.activeJobs < this.maxConcurrency) {
                    try {
                        const rawJob = await redisClient.lpop(this.queueName);
                        if (!rawJob) break; // Queue trống

                        this.activeJobs++;
                        this.processJob(rawJob).finally(() => {
                            this.activeJobs = Math.max(0, this.activeJobs - 1);
                        });
                        nextDelayMs = 150; // Có job, kiểm tra tiếp nhanh
                    } catch (err) {
                        if (err.message && !err.message.includes('Connection is closed')) {
                            logger.warn(`[RedisQueue Worker] Error pulling job: ${err.message}`);
                        }
                        break;
                    }
                }
            }

            const timer = setTimeout(processLoop, nextDelayMs);
            if (timer.unref) timer.unref();
        };

        processLoop();
    }

    /**
     * Lấy thống kê trạng thái hàng đợi và DLQ
     * @returns {Promise<{active: number, dlq: number, isConnected: boolean}>}
     */
    async getQueueStatus() {
        if (!isRedisConnected()) {
            return { active: 0, dlq: 0, isConnected: false };
        }
        try {
            const [active, dlq] = await Promise.all([
                redisClient.llen(this.queueName),
                redisClient.llen(this.dlqName)
            ]);
            return {
                active: Number.isInteger(active) ? active : 0,
                dlq: Number.isInteger(dlq) ? dlq : 0,
                isConnected: true
            };
        } catch (err) {
            logger.warn(`[RedisQueue] Failed to get queue status: ${err.message}`);
            return { active: 0, dlq: 0, isConnected: false, error: err.message };
        }
    }

    /**
     * Lấy danh sách job trong Dead Letter Queue
     * @param {number} limit 
     * @returns {Promise<Array<Object>>}
     */
    async getDlqJobs(limit = 50) {
        if (!isRedisConnected()) return [];
        try {
            const items = await redisClient.lrange(this.dlqName, 0, Math.max(0, limit - 1));
            return items.map(item => {
                try {
                    return JSON.parse(item);
                } catch (e) {
                    return { raw: item, parseError: true };
                }
            });
        } catch (err) {
            logger.warn(`[RedisQueue] Failed to get DLQ jobs: ${err.message}`);
            return [];
        }
    }

    /**
     * Đưa một job từ DLQ trở lại hàng đợi chính để gửi lại
     * @param {string} jobId 
     * @returns {Promise<boolean>}
     */
    async retryDlqJob(jobId) {
        if (!isRedisConnected() || !jobId) return false;
        try {
            const items = await redisClient.lrange(this.dlqName, 0, -1);
            for (const rawItem of items) {
                try {
                    const parsed = JSON.parse(rawItem);
                    if (parsed.id === jobId) {
                        await redisClient.lrem(this.dlqName, 1, rawItem);
                        parsed.attempts = 0;
                        parsed.lastError = null;
                        await redisClient.rpush(this.queueName, JSON.stringify(parsed));
                        logger.info(`[RedisQueue] Retried job [${jobId}] from DLQ back to active queue`);
                        return true;
                    }
                } catch (e) {
                    // Tiếp tục duyệt nếu có bản tin lỗi cú pháp
                }
            }
            return false;
        } catch (err) {
            logger.warn(`[RedisQueue] Failed to retry DLQ job [${jobId}]: ${err.message}`);
            return false;
        }
    }

    /**
     * Xóa sạch toàn bộ job trong Dead Letter Queue
     * @returns {Promise<boolean>}
     */
    async clearDlq() {
        if (!isRedisConnected()) return false;
        try {
            await redisClient.del(this.dlqName);
            logger.info('[RedisQueue] Cleared Dead Letter Queue');
            return true;
        } catch (err) {
            logger.warn(`[RedisQueue] Failed to clear DLQ: ${err.message}`);
            return false;
        }
    }
}

module.exports = new RedisQueueService();
