const BaziRecord = require('../models/BaziRecord');
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

class BaziHistoryController {
    static async getBaziRecord(req, res) {
        try {
            const { id } = req.params;
            const record = await findByIdFlex(BaziRecord, id);
            if (!record) {
                return res.status(404).json({ error: 'Không tìm thấy bản ghi Bát Tự.' });
            }

            const recordObj = record.toObject();

            if (recordObj.tietKhiTimeline) {
                recordObj.tietKhiTimeline = formatCanChiSpacing(recordObj.tietKhiTimeline);
            }
            if (recordObj.baziData) {
                if (recordObj.baziData.lunarDateStr) {
                    recordObj.baziData.lunarDateStr = formatCanChiSpacing(recordObj.baziData.lunarDateStr);
                }
                if (recordObj.baziData.lunarYear) {
                    recordObj.baziData.lunarYear = formatCanChiSpacing(recordObj.baziData.lunarYear);
                }
                if (recordObj.baziData.tietKhiTimeline) {
                    recordObj.baziData.tietKhiTimeline = formatCanChiSpacing(recordObj.baziData.tietKhiTimeline);
                }
            }
            return res.json(recordObj);
        } catch (error) {
            console.error('getBaziRecord error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async getBaziHistory(req, res) {
        try {
            const userId = req.params.userId;
            if (!userId) return res.status(400).json({ error: 'User ID is required' });
            
            const limit = parseInt(req.query.limit) || 100;
            const query = buildFilterQuery('bazi', req.query, userId);

            let records = await BaziRecord.find(query)
                .sort({ isPinned: -1, createdAt: -1 })
                .select('-analysisSnapshot -aiInterpretation -baziData')
                .limit(limit)
                .lean();
                
            records = filterByBirthInfo(records, req.query, 'bazi');

            const formattedRecords = records.map(record => {
                if (record.tietKhiTimeline) {
                    record.tietKhiTimeline = formatCanChiSpacing(record.tietKhiTimeline);
                }
                if (record.baziData) {
                    if (record.baziData.lunarDateStr) {
                        record.baziData.lunarDateStr = formatCanChiSpacing(record.baziData.lunarDateStr);
                    }
                    if (record.baziData.lunarYear) {
                        record.baziData.lunarYear = formatCanChiSpacing(record.baziData.lunarYear);
                    }
                    if (record.baziData.tietKhiTimeline) {
                        record.baziData.tietKhiTimeline = formatCanChiSpacing(record.baziData.tietKhiTimeline);
                    }
                }
                return record;
            });
            
            return res.json(formattedRecords);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Server error' });
        }
    }

    static async rateBazi(req, res) {
        try {
            const { id } = req.params;
            const { rating, feedback } = req.body;
            
            const record = await updateByIdFlex(BaziRecord, id, { rating, feedback });
            
            if (!record) return res.status(404).json({ error: 'Record not found' });
            
            MemoryCacheService.clearUserHistoryCache(record.userId);
            
            return res.json(record);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Server error' });
        }
    }

    static async linkBazi(req, res) {
        try {
            const { id } = req.params;
            const currentUserId = req.dbUser ? String(req.dbUser.id || req.dbUser._id) : (req.user ? String(req.user.id || req.user._id) : null);
            if (!currentUserId) {
                return res.status(401).json({ error: 'Vui lòng đăng nhập để liên kết bản ghi.' });
            }

            const existingRecord = await findByIdFlex(BaziRecord, id);
            if (!existingRecord) return res.status(404).json({ error: 'Không tìm thấy bản ghi Bát Tự.' });

            if (existingRecord.userId && existingRecord.userId !== 'guest' && String(existingRecord.userId) !== currentUserId) {
                return res.status(403).json({ error: 'Bản ghi này đã thuộc về người dùng khác. Bạn không thể liên kết.' });
            }

            const record = await updateByIdFlex(BaziRecord, id, { userId: currentUserId });
            
            MemoryCacheService.clearUserHistoryCache(existingRecord.userId);
            MemoryCacheService.clearUserHistoryCache(currentUserId);
            
            return res.json(record);
        } catch (error) {
            console.error('linkBazi error:', error);
            return res.status(500).json({ error: 'Server error' });
        }
    }

    static async getBaziChatMessages(req, res) {
        try {
            const { id } = req.params;
            const limit = parseInt(req.query.limit) || 20;
            const page = parseInt(req.query.page) || 1;
            const skip = (page - 1) * limit;

            const cacheKey = `history:chat:bazi:${id}:${page}:${limit}`;
            const cachedData = MemoryCacheService.get(cacheKey);
            if (cachedData) {
                return res.json(cachedData);
            }

            const conversation = await Conversation.findOne({ recordId: id, system: 'bazi' }).lean();
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
            console.error(`getBaziChatMessages error:`, error);
            return res.status(500).json({ error: 'Server error' });
        }
    }
}

module.exports = BaziHistoryController;
