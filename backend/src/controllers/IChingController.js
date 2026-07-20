const IChingRecord = require('../models/IChingRecord');
const IChingDataService = require('../services/IChingDataService');
const MemoryCacheService = require('../services/MemoryCacheService');

class IChingController {
    static async calculate(req, res) {
        try {
            const lines = req.body.lines; 
            const userId = req.body.userId || 'guest';
            const question = req.body.question || 'xem sức khỏe và công việc sắp tới có thuận lợi hay không';

            if (!lines || lines.length !== 6) {
                return res.status(400).json({ error: 'Require exactly 6 lines.' });
            }

            // Delegate core Dịch lý calculations to IChingDataService
            const now = req.body.now ? new Date(req.body.now) : new Date();
            const resultPayload = IChingDataService.calculate({ lines, now });

            const movingLinesArray = lines.map((l, i) => l.moving ? i + 1 : -1).filter(i => i !== -1);
            
            // Check for duplicate record
            const existingRecord = await IChingRecord.findOne({
                userId,
                question,
                'primaryHexagram.binary_code': resultPayload.primary.binary_code,
                movingLines: movingLinesArray,
                isDeleted: { $ne: true }
            });

            if (existingRecord) {
                return res.json({ 
                    ...resultPayload, 
                    recordId: existingRecord._id, 
                    interpretation: existingRecord.aiInterpretation?.content || '' 
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

            return res.json({ ...resultPayload, recordId: record._id });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: error.message || 'Server error' });
        }
    }
}

module.exports = IChingController;
