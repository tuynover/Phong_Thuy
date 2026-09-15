const IChingRecord = require('../models/IChingRecord');
const Conversation = require('../../../core/models/Conversation');
const Message = require('../../../core/models/Message');
const IChingDataService = require('../services/IChingDataService');
const MemoryCacheService = require('../../../core/services/MemoryCacheService');
const { 
    findByIdFlex, 
    updateByIdFlex, 
    buildFilterQuery 
} = require('../../../core/services/HistoryQueryHelper');

class IChingHistoryController {
    static async getHexagramRecord(req, res) {
        try {
            const { id } = req.params;
            const record = await findByIdFlex(IChingRecord, id);
            if (!record) {
                return res.status(404).json({ error: 'Không tìm thấy bản ghi quẻ dịch.' });
            }

            const reconstructed = IChingDataService.parseLines({
                primaryHexagram: record.primaryHexagram,
                secondaryHexagram: record.transformedHexagram || record.primaryHexagram,
                movingLines: record.movingLines,
                dayGanZhi: record.lunarDateInfo?.dayCanChi,
                monthGanZhi: record.lunarDateInfo?.monthCanChi
            });

            const fullRecord = {
                ...record.toObject(),
                primaryLines: reconstructed.primaryLines,
                secondaryLines: reconstructed.secondaryLines,
                primaryHexagram: reconstructed.primaryHexagram,
                transformedHexagram: reconstructed.transformedHexagram
            };

            return res.json(fullRecord);
        } catch (error) {
            console.error('getHexagramRecord error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async getHexagramHistory(req, res) {
        try {
            const userId = req.params.userId;
            if (!userId) return res.status(400).json({ error: 'User ID is required' });
            
            const limit = parseInt(req.query.limit) || 100;
            const query = buildFilterQuery('iching', req.query, userId);

            const records = await IChingRecord.find(query)
                .sort({ isPinned: -1, createdAt: -1 })
                .select('-analysisSnapshot -aiInterpretation -ungKy -movingLines')
                .limit(limit)
                .lean();
            
            return res.json(records);
        } catch (error) {
            console.error('getHexagramHistory error:', error);
            return res.status(500).json({ error: 'Server error' });
        }
    }

    static async rateHexagram(req, res) {
        try {
            const { id } = req.params;
            const { rating, feedback } = req.body;
            
            const record = await updateByIdFlex(IChingRecord, id, { rating, feedback });
            
            if (!record) return res.status(404).json({ error: 'Record not found' });
            
            MemoryCacheService.clearUserHistoryCache(record.userId);
            
            return res.json(record);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Server error' });
        }
    }

    static async linkHexagram(req, res) {
        try {
            const { id } = req.params;
            const currentUserId = req.dbUser ? String(req.dbUser.id || req.dbUser._id) : (req.user ? String(req.user.id || req.user._id) : null);
            if (!currentUserId) {
                return res.status(401).json({ error: 'Vui lòng đăng nhập để liên kết bản ghi.' });
            }

            const existingRecord = await findByIdFlex(IChingRecord, id);
            if (!existingRecord) return res.status(404).json({ error: 'Không tìm thấy bản ghi quẻ dịch.' });

            if (existingRecord.userId && existingRecord.userId !== 'guest' && String(existingRecord.userId) !== currentUserId) {
                return res.status(403).json({ error: 'Bản ghi này đã thuộc về người dùng khác. Bạn không thể liên kết.' });
            }

            const record = await updateByIdFlex(IChingRecord, id, { userId: currentUserId });
            
            MemoryCacheService.clearUserHistoryCache(existingRecord.userId);
            MemoryCacheService.clearUserHistoryCache(currentUserId);
            
            return res.json(record);
        } catch (error) {
            console.error('linkHexagram error:', error);
            return res.status(500).json({ error: 'Server error' });
        }
    }

    static async getHexagramChatMessages(req, res) {
        try {
            const { id } = req.params;
            const limit = parseInt(req.query.limit) || 20;
            const page = parseInt(req.query.page) || 1;
            const skip = (page - 1) * limit;

            const cacheKey = `history:chat:iching:${id}:${page}:${limit}`;
            const cachedData = MemoryCacheService.get(cacheKey);
            if (cachedData) {
                return res.json(cachedData);
            }

            const conversation = await Conversation.findOne({ recordId: id, system: 'iching' }).lean();
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
            console.error(`getHexagramChatMessages error:`, error);
            return res.status(500).json({ error: 'Server error' });
        }
    }
}

module.exports = IChingHistoryController;
