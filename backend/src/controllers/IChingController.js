const IChingRecord = require('../models/IChingRecord');
const IChingDataService = require('../services/IChingDataService');
const MemoryCacheService = require('../services/MemoryCacheService');
const InputValidator = require('../services/InputValidator');

class IChingController {
    static async calculate(req, res) {
        let lockKey = null;
        try {
            const validation = InputValidator.validateIChingInput(req.body);
            if (!validation.isValid) {
                return res.status(400).json({ error: validation.error });
            }

            const lines = req.body.lines; 
            const userId = req.body.userId || 'guest';
            const question = req.body.question || 'xem sức khỏe và công việc sắp tới có thuận lợi hay không';

            // Delegate core Dịch lý calculations to IChingDataService
            const now = req.body.now ? new Date(req.body.now) : new Date();
            const resultPayload = IChingDataService.calculate({ lines, now });

            const movingLinesArray = lines.map((l, i) => l.moving ? i + 1 : -1).filter(i => i !== -1);
            
            // Chống spam 10 request đồng thời cùng bộ dữ liệu (In-Flight Concurrency Protection 2.5s)
            const { acquireRedisLock, releaseRedisLock } = require('../config/redis');
            lockKey = `inflight:iching:${userId}:${resultPayload.primary.binary_code}:${movingLinesArray.join('-')}:${question}`;

            const acquired = await acquireRedisLock(lockKey, 2500);
            if (!acquired) {
                return res.status(429).json({
                    error: 'Yêu cầu của bạn đang được hệ thống xử lý, vui lòng không nhấn gửi liên tục.'
                });
            }
            if (typeof res.on === 'function') {
                res.on('finish', () => {
                    releaseRedisLock(lockKey);
                });
            }

            // Save to database (WITHOUT primaryLines and secondaryLines)
            const record = new IChingRecord({
                userId,
                question,
                primaryHexagram: resultPayload.primary,
                transformedHexagram: resultPayload.secondary,
                movingLines: movingLinesArray,
                lunarDateInfo: resultPayload.dateInfo
            });
            await record.save();

            // Increment user iching record count O(1)
            const UserStatsService = require('../services/UserStatsService');
            UserStatsService.incrementRecordCount(userId, 'iching', 1);

            // Invalidate user history cache
            MemoryCacheService.clearUserHistoryCache(userId);

            // Broadcast to admins
            const sseService = require('../services/SseService');
            sseService.sendToAdmins('new_calculation', { type: 'iching', userId, recordId: record._id });

            releaseRedisLock(lockKey);
            return res.json({ ...resultPayload, recordId: record._id });
        } catch (error) {
            if (lockKey) {
                const { releaseRedisLock } = require('../config/redis');
                releaseRedisLock(lockKey);
            }
            console.error(error);
            return res.status(500).json({ error: error.message || 'Server error' });
        }
    }
}

module.exports = IChingController;
