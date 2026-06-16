const HexagramRecord = require('../models/HexagramRecord');
const BaziRecord = require('../models/BaziRecord');
const HexagramDataService = require('../services/HexagramDataService');
const MemoryCacheService = require('../services/MemoryCacheService');
const HexagramConversation = require('../models/HexagramConversation');
const HexagramMessage = require('../models/HexagramMessage');
const BaziConversation = require('../models/BaziConversation');
const BaziMessage = require('../models/BaziMessage');
const mongoose = require('mongoose');

const findByIdFlex = async (Model, id) => {
    let record = await Model.findById(id);
    if (!record && mongoose.isValidObjectId(id)) {
        const rawObj = await Model.collection.findOne({ _id: new mongoose.Types.ObjectId(id) });
        if (rawObj) record = Model.hydrate(rawObj);
    }
    return record;
};

const updateByIdFlex = async (Model, id, update) => {
    let record = await Model.findByIdAndUpdate(id, update, { new: true });
    if (!record && mongoose.isValidObjectId(id)) {
        const rawObj = await Model.collection.findOneAndUpdate(
            { _id: new mongoose.Types.ObjectId(id) },
            { $set: { ...update, updatedAt: new Date() } },
            { returnDocument: 'after' }
        );
        if (rawObj) record = Model.hydrate(rawObj);
    }
    return record;
};

const formatCanChiSpacing = (str) => {
    if (!str) return str;
    return str.replace(/(Giáp|Ất|Bính|Đinh|Mậu|Kỷ|Canh|Tân|Nhâm|Quý)(?=[A-Z])/g, '$1 ');
};

class HistoryController {
    static async getHexagramRecord(req, res) {
        try {
            const { id } = req.params;
            const record = await findByIdFlex(HexagramRecord, id);
            if (!record) {
                return res.status(404).json({ error: 'Không tìm thấy bản ghi quẻ dịch.' });
            }

            const recordObj = record.toObject();
            const reconstructed = HexagramDataService.reconstructLines(recordObj);
            const enhancedRecord = {
                ...recordObj,
                primaryLines: reconstructed.primaryLines,
                secondaryLines: reconstructed.secondaryLines,
                primaryHexagram: reconstructed.primaryHexagram,
                transformedHexagram: reconstructed.transformedHexagram
            };

            return res.json(enhancedRecord);
        } catch (error) {
            console.error('getHexagramRecord error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async getHexagramHistory(req, res) {
        try {
            const userId = req.params.userId;
            if (!userId) return res.status(400).json({ error: 'User ID is required' });
            
            const limit = parseInt(req.query.limit) || 50;
            const cacheKey = `history:${userId}:hexagrams:${limit}`;
            
            // Check in-memory cache
            const cachedData = MemoryCacheService.get(cacheKey);
            if (cachedData) {
                return res.json(cachedData);
            }
            
            const records = await HexagramRecord.find({ 
                userId, 
                isDeleted: { $ne: true }, 
                status: { $ne: 'locked' } 
            })
                .sort({ createdAt: -1 })
                .select('-analysisSnapshot')
                .limit(limit)
                .lean();
            
            const enhancedRecords = records.map(record => {
                const reconstructed = HexagramDataService.reconstructLines(record);
                return {
                    ...record,
                    primaryLines: reconstructed.primaryLines,
                    secondaryLines: reconstructed.secondaryLines,
                    primaryHexagram: reconstructed.primaryHexagram,
                    transformedHexagram: reconstructed.transformedHexagram
                };
            });
            
            // Cache for 5 minutes
            MemoryCacheService.set(cacheKey, enhancedRecords, 300000);
            
            return res.json(enhancedRecords);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Server error' });
        }
    }

    static async getBaziHistory(req, res) {
        try {
            const userId = req.params.userId;
            if (!userId) return res.status(400).json({ error: 'User ID is required' });
            
            const limit = parseInt(req.query.limit) || 50;
            const cacheKey = `history:${userId}:bazi:${limit}`;
            
            // Check in-memory cache
            const cachedData = MemoryCacheService.get(cacheKey);
            if (cachedData) {
                return res.json(cachedData);
            }
            
            const records = await BaziRecord.find({ 
                userId, 
                isDeleted: { $ne: true }, 
                status: { $ne: 'locked' } 
            })
                .sort({ createdAt: -1 })
                .select('-analysisSnapshot')
                .limit(limit)
                .lean();
                
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
                
            // Cache for 5 minutes
            MemoryCacheService.set(cacheKey, formattedRecords, 300000);
            
            return res.json(formattedRecords);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Server error' });
        }
    }

    static async rateHexagram(req, res) {
        try {
            const { id } = req.params;
            const { rating, feedback } = req.body;
            
            const record = await updateByIdFlex(HexagramRecord, id, { rating, feedback });
            
            if (!record) return res.status(404).json({ error: 'Record not found' });
            
            // Invalidate cache
            MemoryCacheService.clearUserHistoryCache(record.userId);
            
            return res.json(record);
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
            
            // Invalidate cache
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
            const { userId } = req.body;
            
            const record = await updateByIdFlex(HexagramRecord, id, { userId });
            
            if (!record) return res.status(404).json({ error: 'Record not found' });
            
            // Invalidate cache for both old guest and newly linked user accounts
            MemoryCacheService.clearUserHistoryCache(record.userId);
            MemoryCacheService.clearUserHistoryCache(userId);
            
            return res.json(record);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Server error' });
        }
    }

    static async linkBazi(req, res) {
        try {
            const { id } = req.params;
            const { userId } = req.body;
            
            const record = await updateByIdFlex(BaziRecord, id, { userId });
            
            if (!record) return res.status(404).json({ error: 'Record not found' });
            
            // Invalidate cache for both old guest and newly linked user accounts
            MemoryCacheService.clearUserHistoryCache(record.userId);
            MemoryCacheService.clearUserHistoryCache(userId);
            
            return res.json(record);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Server error' });
        }
    }

    static async getHexagramChatMessages(req, res) {
        try {
            const { id } = req.params;
            const limit = parseInt(req.query.limit) || 20;
            const page = parseInt(req.query.page) || 1;
            const skip = (page - 1) * limit;

            const cacheKey = `history:chat:hexagrams:${id}:${page}:${limit}`;
            const cachedData = MemoryCacheService.get(cacheKey);
            if (cachedData) {
                return res.json(cachedData);
            }

            const conversation = await HexagramConversation.findOne({ recordId: id }).lean();
            if (!conversation) {
                return res.json({ messages: [], hasMore: false });
            }

            const total = await HexagramMessage.countDocuments({ conversationId: conversation._id });
            const messages = await HexagramMessage.find({ conversationId: conversation._id })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean();

            // Reverse to chronological order (oldest first)
            messages.reverse();

            const responseData = {
                messages,
                hasMore: total > skip + messages.length,
                total
            };

            MemoryCacheService.set(cacheKey, responseData, 300000); // Cache for 5 minutes

            return res.json(responseData);
        } catch (error) {
            console.error(error);
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

            const conversation = await BaziConversation.findOne({ recordId: id }).lean();
            if (!conversation) {
                return res.json({ messages: [], hasMore: false });
            }

            const total = await BaziMessage.countDocuments({ conversationId: conversation._id });
            const messages = await BaziMessage.find({ conversationId: conversation._id })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean();

            // Reverse to chronological order (oldest first)
            messages.reverse();

            const responseData = {
                messages,
                hasMore: total > skip + messages.length,
                total
            };

            MemoryCacheService.set(cacheKey, responseData, 300000); // Cache for 5 minutes

            return res.json(responseData);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Server error' });
        }
    }

    static async deleteCalculation(req, res) {
        try {
            const { type, id } = req.params;
            const userId = req.user.id || req.user._id?.toString();

            if (!userId) {
                return res.status(401).json({ error: 'Người dùng chưa xác thực.' });
            }

            let Model;
            if (type === 'hexagrams' || type === 'iching') {
                Model = HexagramRecord;
            } else if (type === 'bazi' || type === 'bat_tu') {
                Model = BaziRecord;
            } else if (type === 'tu_vi' || type === 'tu-vi') {
                const TuViRecord = require('../modules/tu-vi/models/TuViRecord');
                Model = TuViRecord;
            } else {
                return res.status(400).json({ error: 'Loại quẻ/lá số không hợp lệ.' });
            }

            const record = await findByIdFlex(Model, id);
            if (!record) {
                return res.status(404).json({ error: 'Không tìm thấy bản ghi cần xóa.' });
            }

            if (record.userId !== userId && record.userId?.toString() !== userId) {
                return res.status(403).json({ error: 'Bạn không có quyền xóa bản ghi này.' });
            }

            // Permanently delete the record from database
            await Model.deleteOne({ _id: record._id });

            // Clear cache
            MemoryCacheService.clearUserHistoryCache(userId);

            return res.json({ message: 'Xóa bản ghi thành công.' });
        } catch (error) {
            console.error('deleteCalculation error:', error);
            return res.status(500).json({ error: 'Lỗi máy chủ khi xóa bản ghi.' });
        }
    }
}

module.exports = HistoryController;
