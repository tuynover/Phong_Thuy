const MarriageRecord = require('../models/MarriageRecord');
const Conversation = require('../../../core/models/Conversation');
const Message = require('../../../core/models/Message');
const MemoryCacheService = require('../../../core/services/MemoryCacheService');
const { 
    findByIdFlex, 
    updateByIdFlex, 
    formatCanChiSpacing, 
    buildFilterQuery, 
    filterByBirthInfo 
} = require('../../../core/services/HistoryQueryHelper');

class MarriageHistoryController {
    static async getMarriageRecord(req, res) {
        try {
            const { id } = req.params;
            const record = await findByIdFlex(MarriageRecord, id);
            if (!record) {
                return res.status(404).json({ error: 'Không tìm thấy bản ghi hôn nhân.' });
            }

            const recordObj = record.toObject();
            if (recordObj.maleBaziData) {
                if (recordObj.maleBaziData.lunarDateStr) recordObj.maleBaziData.lunarDateStr = formatCanChiSpacing(recordObj.maleBaziData.lunarDateStr);
                if (recordObj.maleBaziData.lunarYear) recordObj.maleBaziData.lunarYear = formatCanChiSpacing(recordObj.maleBaziData.lunarYear);
                if (recordObj.maleBaziData.tietKhiTimeline) recordObj.maleBaziData.tietKhiTimeline = formatCanChiSpacing(recordObj.maleBaziData.tietKhiTimeline);
            }
            if (recordObj.femaleBaziData) {
                if (recordObj.femaleBaziData.lunarDateStr) recordObj.femaleBaziData.lunarDateStr = formatCanChiSpacing(recordObj.femaleBaziData.lunarDateStr);
                if (recordObj.femaleBaziData.lunarYear) recordObj.femaleBaziData.lunarYear = formatCanChiSpacing(recordObj.femaleBaziData.lunarYear);
                if (recordObj.femaleBaziData.tietKhiTimeline) recordObj.femaleBaziData.tietKhiTimeline = formatCanChiSpacing(recordObj.femaleBaziData.tietKhiTimeline);
            }

            return res.json(recordObj);
        } catch (error) {
            console.error('getMarriageRecord error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async getMarriageHistory(req, res) {
        try {
            const userId = req.params.userId;
            if (!userId) return res.status(400).json({ error: 'User ID is required' });
            
            const limit = parseInt(req.query.limit) || 100;
            const query = buildFilterQuery('marriage', req.query, userId);

            let records = await MarriageRecord.find(query)
                .sort({ isPinned: -1, createdAt: -1 })
                .select('-maleBaziData -femaleBaziData -aiInterpretation')
                .limit(limit)
                .lean();

            records = filterByBirthInfo(records, req.query, 'marriage');
            return res.json(records);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Server error' });
        }
    }

    static async rateMarriage(req, res) {
        try {
            const { id } = req.params;
            const { rating, feedback } = req.body;
            
            const record = await updateByIdFlex(MarriageRecord, id, { rating, feedback });
            
            if (!record) return res.status(404).json({ error: 'Record not found' });
            
            MemoryCacheService.clearUserHistoryCache(record.userId);
            
            return res.json(record);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Server error' });
        }
    }

    static async getMarriageChatMessages(req, res) {
        try {
            const { id } = req.params;
            const limit = parseInt(req.query.limit) || 20;
            const page = parseInt(req.query.page) || 1;
            const skip = (page - 1) * limit;

            const cacheKey = `history:chat:marriage:${id}:${page}:${limit}`;
            const cachedData = MemoryCacheService.get(cacheKey);
            if (cachedData) {
                return res.json(cachedData);
            }

            const conversation = await Conversation.findOne({ recordId: id, system: 'marriage' }).lean();
            if (!conversation) {
                return res.json({ messages: [], hasMore: false });
            }

            const total = await Message.countDocuments({ conversationId: conversation._id });
            const messages = await Message.find({ conversationId: conversation._id })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean();

            messages.reverse();

            const responseData = {
                messages,
                hasMore: total > skip + messages.length,
                total
            };

            MemoryCacheService.set(cacheKey, responseData, 300000);

            return res.json(responseData);
        } catch (error) {
            console.error(`getMarriageChatMessages error:`, error);
            return res.status(500).json({ error: 'Server error' });
        }
    }
}

module.exports = MarriageHistoryController;
