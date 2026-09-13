const ZiweiRecord = require('../models/ZiweiRecord');
const Conversation = require('../../../core/models/Conversation');
const Message = require('../../../core/models/Message');
const MemoryCacheService = require('../../../core/services/MemoryCacheService');
const { 
    findByIdFlex, 
    updateByIdFlex, 
    buildFilterQuery, 
    filterByBirthInfo 
} = require('../../../core/services/HistoryQueryHelper');

class ZiweiHistoryController {
    static async getZiweiRecord(req, res) {
        try {
            const { id } = req.params;
            const record = await findByIdFlex(ZiweiRecord, id);
            if (!record) {
                return res.status(404).json({ error: 'Không tìm thấy bản ghi lá số Tử Vi.' });
            }
            return res.json(record);
        } catch (error) {
            console.error('getZiweiRecord error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async getZiweiHistory(req, res) {
        try {
            const userId = req.params.userId;
            if (!userId) return res.status(400).json({ error: 'User ID is required' });
            
            const limit = parseInt(req.query.limit) || 100;
            const query = buildFilterQuery('ziwei', req.query, userId);

            let records = await ZiweiRecord.find(query)
                .sort({ isPinned: -1, createdAt: -1 })
                .select('-chartData -analysisSnapshot -aiInterpretation')
                .limit(limit)
                .lean();
                
            records = filterByBirthInfo(records, req.query, 'ziwei');

            return res.json(records);
        } catch (error) {
            console.error('getZiweiHistory error:', error);
            return res.status(500).json({ error: 'Server error' });
        }
    }

    static async rateZiwei(req, res) {
        try {
            const { id } = req.params;
            const { rating, feedback } = req.body;
            
            const record = await updateByIdFlex(ZiweiRecord, id, { rating, feedback });
            
            if (!record) return res.status(404).json({ error: 'Record not found' });
            
            MemoryCacheService.clearUserHistoryCache(record.userId);
            
            return res.json(record);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Server error' });
        }
    }

    static async linkZiwei(req, res) {
        try {
            const { id } = req.params;
            const { userId } = req.body;
            
            const record = await updateByIdFlex(ZiweiRecord, id, { userId });
            
            if (!record) return res.status(404).json({ error: 'Record not found' });
            
            MemoryCacheService.clearUserHistoryCache(record.userId);
            MemoryCacheService.clearUserHistoryCache(userId);
            
            return res.json(record);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Server error' });
        }
    }

    static async getZiweiChatMessages(req, res) {
        try {
            const { id } = req.params;
            const limit = parseInt(req.query.limit) || 20;
            const page = parseInt(req.query.page) || 1;
            const skip = (page - 1) * limit;

            const cacheKey = `history:chat:ziwei:${id}:${page}:${limit}`;
            const cachedData = MemoryCacheService.get(cacheKey);
            if (cachedData) {
                return res.json(cachedData);
            }

            const conversation = await Conversation.findOne({ recordId: id, system: 'ziwei' }).lean();
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
            console.error(`getZiweiChatMessages error:`, error);
            return res.status(500).json({ error: 'Server error' });
        }
    }
}

module.exports = ZiweiHistoryController;
