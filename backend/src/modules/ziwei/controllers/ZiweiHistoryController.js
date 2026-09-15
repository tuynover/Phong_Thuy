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
            const currentUserId = req.dbUser ? String(req.dbUser.id || req.dbUser._id) : (req.user ? String(req.user.id || req.user._id) : null);
            if (!currentUserId) {
                return res.status(401).json({ error: 'Vui lòng đăng nhập để liên kết bản ghi.' });
            }

            const existingRecord = await findByIdFlex(ZiweiRecord, id);
            if (!existingRecord) return res.status(404).json({ error: 'Không tìm thấy bản ghi Tử Vi.' });

            if (existingRecord.userId && existingRecord.userId !== 'guest' && String(existingRecord.userId) !== currentUserId) {
                return res.status(403).json({ error: 'Bản ghi này đã thuộc về người dùng khác. Bạn không thể liên kết.' });
            }

            const record = await updateByIdFlex(ZiweiRecord, id, { userId: currentUserId });
            
            MemoryCacheService.clearUserHistoryCache(existingRecord.userId);
            MemoryCacheService.clearUserHistoryCache(currentUserId);
            
            return res.json(record);
        } catch (error) {
            console.error('linkZiwei error:', error);
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
