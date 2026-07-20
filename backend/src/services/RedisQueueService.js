const { redisClient, isRedisConnected } = require('../config/redis');
const logger = require('./LoggerService');
const EmailService = require('./EmailService');

class RedisQueueService {
    constructor() {
        this.queueName = 'queue:emails';
        this.isProcessing = false;
        this.startWorker();
    }

    /**
     * Đẩy tác vụ gửi email vào Redis Queue để xử lý ngầm (async)
     * @param {Object} emailOptions { to, subject, html }
     * @returns {Promise<boolean>}
     */
    async enqueueEmail(emailOptions) {
        if (!emailOptions || !emailOptions.to) return false;

        // If Redis is connected, push to Redis Queue for background processing
        if (isRedisConnected()) {
            try {
                const payload = JSON.stringify(emailOptions);
                await redisClient.rpush(this.queueName, payload);
                logger.info(`[RedisQueue] Enqueued email job to [${emailOptions.to}]`);
                return true;
            } catch (err) {
                logger.warn(`[RedisQueue] Enqueue failed: ${err.message}. Sending email directly.`);
            }
        }

        // Fallback: Send email directly if Redis is unavailable
        EmailService.sendEmail(emailOptions).catch(err => {
            logger.error(`[RedisQueue] Direct email sending failed: ${err.message}`);
        });
        return true;
    }

    /**
     * Tiến trình Worker chạy ngầm liên tục rút job từ Redis Queue để gửi mail
     */
    async startWorker() {
        if (this.isProcessing) return;
        this.isProcessing = true;

        const processNextJob = async () => {
            if (isRedisConnected()) {
                try {
                    // Pop job from queue with 5 second timeout
                    const result = await redisClient.blpop(this.queueName, 5);
                    if (result && result[1]) {
                        const emailOptions = JSON.parse(result[1]);
                        logger.info(`[RedisQueue Worker] Processing email job for [${emailOptions.to}]`);
                        await EmailService.sendEmail(emailOptions);
                    }
                } catch (err) {
                    if (err.message && !err.message.includes('Connection is closed')) {
                        logger.warn(`[RedisQueue Worker] Error processing job: ${err.message}`);
                    }
                }
            }

            // Loop forever with a small delay
            setTimeout(processNextJob, 1000);
        };

        processNextJob();
    }
}

module.exports = new RedisQueueService();
