const IChingRecord = require('../models/IChingRecord');
const BaziRecord = require('../models/BaziRecord');
const ZiweiRecord = require('../models/ZiweiRecord');
const MarriageRecord = require('../models/MarriageRecord');
const IChingDataService = require('../services/IChingDataService');
const MemoryCacheService = require('../services/MemoryCacheService');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const mongoose = require('mongoose');
const BaziAnalyzer = require('../services/BaziAnalyzer');
const User = require('../models/User');

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
    if (record && record.userId && record.userId !== 'guest') {
        const UserStatsService = require('../services/UserStatsService');
        UserStatsService.updateUserStatsBackground(record.userId);
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
            const record = await findByIdFlex(IChingRecord, id);
            if (!record) {
                return res.status(404).json({ error: 'Không tìm thấy bản ghi quẻ dịch.' });
            }

            const recordObj = record.toObject();
            const reconstructed = IChingDataService.parseLines({
                primaryHexagram: recordObj.primaryHexagram,
                secondaryHexagram: recordObj.transformedHexagram || recordObj.primaryHexagram,
                movingLines: recordObj.movingLines,
                dayGanZhi: recordObj.lunarDateInfo.dayCanChi,
                monthGanZhi: recordObj.lunarDateInfo.monthCanChi
            });
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

    static async getBaziRecord(req, res) {
        try {
            const { id } = req.params;
            const record = await findByIdFlex(BaziRecord, id);
            if (!record) {
                return res.status(404).json({ error: 'Không tìm thấy bản ghi Bát Tự.' });
            }

            let updated = false;
            // Migrate legacy cungMenh
            if (!record.baziData || !record.baziData.cungMenh || !record.baziData.cungMenh.gan || !record.baziData.tietKhiName || !record.baziData.tuLenhCan) {
                const dateStr = record.inputInfo.date;
                const timeStr = record.inputInfo.time;
                const genderVal = record.inputInfo.gender;
                const boundary = record.inputInfo.dayBoundaryMode || 'midnight';
                const freshResult = BaziAnalyzer.analyze(dateStr, timeStr, genderVal, boundary);
                record.baziData = freshResult;
                record.solarTimeline = freshResult.solarTimeline;
                record.tietKhiTimeline = freshResult.tietKhiTimeline;
                updated = true;
            }

            // Migrate legacy menhQuai
            if (record.baziData && !record.baziData.menhQuai) {
                const dateStr = record.inputInfo.date;
                let yearVal = null;
                if (dateStr.includes('/')) {
                    yearVal = parseInt(dateStr.split('/')[2]);
                } else if (dateStr.includes('-')) {
                    yearVal = parseInt(dateStr.split('-')[0]);
                }

                const GUA_MAP = {
                    1: { cung: 'Khảm', element: 'Thủy', group: 'Đông tứ mệnh' },
                    2: { cung: 'Khôn', element: 'Thổ', group: 'Tây tứ mệnh' },
                    3: { cung: 'Chấn', element: 'Mộc', group: 'Đông tứ mệnh' },
                    4: { cung: 'Tốn', element: 'Mộc', group: 'Đông tứ mệnh' },
                    5: { 
                        male: { cung: 'Khôn', element: 'Thổ', group: 'Tây tứ mệnh' },
                        female: { cung: 'Cấn', element: 'Thổ', group: 'Tây tứ mệnh' }
                    },
                    6: { cung: 'Càn', element: 'Kim', group: 'Tây tứ mệnh' },
                    7: { cung: 'Đoài', element: 'Kim', group: 'Tây tứ mệnh' },
                    8: { cung: 'Cấn', element: 'Thổ', group: 'Tây tứ mệnh' },
                    9: { cung: 'Ly', element: 'Hỏa', group: 'Đông tứ mệnh' }
                };

                const calculateMenhQuai = (solarYear, gender) => {
                    let tempYear = parseInt(solarYear);
                    if (isNaN(tempYear)) return null;
                    let sum = tempYear;
                    while (sum >= 10) {
                        sum = String(sum).split('').reduce((acc, digit) => acc + parseInt(digit), 0);
                    }
                    let guaNum;
                    const genderVal = parseInt(gender) === 0 ? 0 : 1;
                    if (genderVal === 1) {
                        guaNum = 11 - sum;
                        if (guaNum <= 0) guaNum += 9;
                    } else {
                        guaNum = 4 + sum;
                        while (guaNum > 9) guaNum -= 9;
                    }
                    const gua = GUA_MAP[guaNum];
                    if (guaNum === 5) {
                        return genderVal === 1 ? gua.male : gua.female;
                    }
                    return gua;
                };

                record.baziData.menhQuai = calculateMenhQuai(yearVal, record.inputInfo.gender);
                record.markModified('baziData');
                updated = true;
            }

            if (updated) {
                await record.save();
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

    static async getHexagramHistory(req, res) {
        try {
            const userId = req.params.userId;
            if (!userId) return res.status(400).json({ error: 'User ID is required' });
            
            const limit = parseInt(req.query.limit) || 50;
            const startDate = req.query.startDate || '';
            const endDate = req.query.endDate || '';
            const cacheKey = `history:${userId}:hexagrams:${limit}:${startDate}:${endDate}`;
            
            // Check in-memory cache
            const cachedData = MemoryCacheService.get(cacheKey);
            if (cachedData) {
                return res.json(cachedData);
            }
            
            const query = { 
                userId, 
                isDeleted: { $ne: true }, 
                status: { $ne: 'locked' } 
            };

            if (startDate || endDate) {
                query.dateCast = {};
                if (startDate) {
                    query.dateCast.$gte = new Date(startDate);
                }
                if (endDate) {
                    const end = new Date(endDate);
                    end.setHours(23, 59, 59, 999);
                    query.dateCast.$lte = end;
                }
            }

            const records = await IChingRecord.find(query)
                .sort({ isPinned: -1, createdAt: -1 })
                .select('-analysisSnapshot -aiInterpretation -ungKy -movingLines')
                .limit(limit)
                .lean();
            
            // Cache for 5 minutes
            MemoryCacheService.set(cacheKey, records, 300000);
            
            return res.json(records);
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
            const startDate = req.query.startDate || '';
            const endDate = req.query.endDate || '';
            const cacheKey = `history:${userId}:bazi:${limit}:${startDate}:${endDate}`;
            
            // Check in-memory cache
            const cachedData = MemoryCacheService.get(cacheKey);
            if (cachedData) {
                return res.json(cachedData);
            }
            
            const query = { 
                userId, 
                isDeleted: { $ne: true }, 
                status: { $ne: 'locked' } 
            };

            if (startDate || endDate) {
                query.createdAt = {};
                if (startDate) {
                    query.createdAt.$gte = new Date(startDate);
                }
                if (endDate) {
                    const end = new Date(endDate);
                    end.setHours(23, 59, 59, 999);
                    query.createdAt.$lte = end;
                }
            }

            const records = await BaziRecord.find(query)
                .sort({ isPinned: -1, createdAt: -1 })
                .select('-analysisSnapshot -aiInterpretation -baziData')
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

    static async getZiweiHistory(req, res) {
        try {
            const userId = req.params.userId;
            if (!userId) return res.status(400).json({ error: 'User ID is required' });
            
            const limit = parseInt(req.query.limit) || 50;
            const startDate = req.query.startDate || '';
            const endDate = req.query.endDate || '';
            const cacheKey = `history:${userId}:ziwei:${limit}:${startDate}:${endDate}`;
            
            // Check in-memory cache
            const cachedData = MemoryCacheService.get(cacheKey);
            if (cachedData) {
                return res.json(cachedData);
            }
            
            const query = { 
                userId, 
                isDeleted: { $ne: true }, 
                status: { $ne: 'locked' } 
            };

            if (startDate || endDate) {
                query.createdAt = {};
                if (startDate) {
                    query.createdAt.$gte = new Date(startDate);
                }
                if (endDate) {
                    const end = new Date(endDate);
                    end.setHours(23, 59, 59, 999);
                    query.createdAt.$lte = end;
                }
            }

            const records = await ZiweiRecord.find(query)
                .sort({ isPinned: -1, createdAt: -1 })
                .select('-chartData -analysisSnapshot -aiInterpretation')
                .limit(limit)
                .lean();
                
            // Cache for 5 minutes
            MemoryCacheService.set(cacheKey, records, 300000);
            
            return res.json(records);
        } catch (error) {
            console.error('getZiweiHistory error:', error);
            return res.status(500).json({ error: 'Server error' });
        }
    }

    static async rateHexagram(req, res) {
        try {
            const { id } = req.params;
            const { rating, feedback } = req.body;
            
            const record = await updateByIdFlex(IChingRecord, id, { rating, feedback });
            
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

    static async rateZiwei(req, res) {
        try {
            const { id } = req.params;
            const { rating, feedback } = req.body;
            
            const record = await updateByIdFlex(ZiweiRecord, id, { rating, feedback });
            
            if (!record) return res.status(404).json({ error: 'Record not found' });
            
            // Invalidate cache
            MemoryCacheService.clearUserHistoryCache(record.userId);
            
            return res.json(record);
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
            
            const record = await updateByIdFlex(IChingRecord, id, { userId });
            
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

    static async linkZiwei(req, res) {
        try {
            const { id } = req.params;
            const { userId } = req.body;
            
            const record = await updateByIdFlex(ZiweiRecord, id, { userId });
            
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

    static async getChatMessages(req, res, system) {
        try {
            const { id } = req.params;
            const limit = parseInt(req.query.limit) || 20;
            const page = parseInt(req.query.page) || 1;
            const skip = (page - 1) * limit;

            const cacheKey = `history:chat:${system}:${id}:${page}:${limit}`;
            const cachedData = MemoryCacheService.get(cacheKey);
            if (cachedData) {
                return res.json(cachedData);
            }

            const conversation = await Conversation.findOne({ recordId: id, system }).lean();
            if (!conversation) {
                return res.json({ messages: [], hasMore: false });
            }

            const total = await Message.countDocuments({ conversationId: conversation._id });
            const messages = await Message.find({ conversationId: conversation._id })
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
            console.error(`getChatMessages error for ${system}:`, error);
            return res.status(500).json({ error: 'Server error' });
        }
    }

    static async getHexagramChatMessages(req, res) {
        return HistoryController.getChatMessages(req, res, 'iching');
    }

    static async getBaziChatMessages(req, res) {
        return HistoryController.getChatMessages(req, res, 'bazi');
    }

    static async getZiweiChatMessages(req, res) {
        return HistoryController.getChatMessages(req, res, 'ziwei');
    }

    static async getMarriageChatMessages(req, res) {
        return HistoryController.getChatMessages(req, res, 'marriage');
    }

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
            
            const limit = parseInt(req.query.limit) || 50;
            const startDate = req.query.startDate || '';
            const endDate = req.query.endDate || '';
            const cacheKey = `history:${userId}:marriage:${limit}:${startDate}:${endDate}`;
            
            const cachedData = MemoryCacheService.get(cacheKey);
            if (cachedData) {
                return res.json(cachedData);
            }
            
            const query = { 
                userId, 
                isDeleted: { $ne: true }, 
                status: { $ne: 'locked' } 
            };

            if (startDate || endDate) {
                query.createdAt = {};
                if (startDate) {
                    query.createdAt.$gte = new Date(startDate);
                }
                if (endDate) {
                    const end = new Date(endDate);
                    end.setHours(23, 59, 59, 999);
                    query.createdAt.$lte = end;
                }
            }

            const records = await MarriageRecord.find(query)
                .sort({ isPinned: -1, createdAt: -1 })
                .select('-maleBaziData -femaleBaziData -aiInterpretation')
                .limit(limit)
                .lean();

            MemoryCacheService.set(cacheKey, records, 300); // cache for 5 mins
            return res.json(records);
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
                Model = IChingRecord;
            } else if (type === 'bazi' || type === 'bat_tu') {
                Model = BaziRecord;
            } else if (type === 'tu_vi' || type === 'tu-vi' || type === 'ziwei') {
                Model = ZiweiRecord;
            } else if (type === 'marriage') {
                Model = MarriageRecord;
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
            // Soft delete the record from database
            await Model.updateOne({ _id: record._id }, { $set: { isDeleted: true } });

            // Clear linked own record IDs from user profile if this was their "own" chart
            const recordIdStr = record._id?.toString() || record._id;
            if (type === 'bazi' || type === 'bat_tu') {
                await User.updateOne(
                    { _id: userId, 'baziInfo.ownBaziRecordId': recordIdStr },
                    { $set: { 'baziInfo.ownBaziRecordId': null } }
                );
            } else if (type === 'tu_vi' || type === 'tu-vi' || type === 'ziwei') {
                await User.updateOne(
                    { _id: userId, 'baziInfo.ownZiweiRecordId': recordIdStr },
                    { $set: { 'baziInfo.ownZiweiRecordId': null } }
                );
            }

            // Clear cache
            MemoryCacheService.clearUserHistoryCache(userId);

            return res.json({ message: 'Xóa bản ghi thành công.' });
        } catch (error) {
            console.error('deleteCalculation error:', error);
            return res.status(500).json({ error: 'Lỗi máy chủ khi xóa bản ghi.' });
        }
    }

    static async pinCalculation(req, res) {
        try {
            const { type, id } = req.params;
            const userId = req.user.id || req.user._id?.toString();

            if (!userId) {
                return res.status(401).json({ error: 'Người dùng chưa xác thực.' });
            }

            let Model;
            if (type === 'hexagrams' || type === 'iching') {
                Model = IChingRecord;
            } else if (type === 'bazi' || type === 'bat_tu') {
                Model = BaziRecord;
            } else if (type === 'tu_vi' || type === 'tu-vi' || type === 'ziwei') {
                Model = ZiweiRecord;
            } else if (type === 'marriage') {
                Model = MarriageRecord;
            } else {
                return res.status(400).json({ error: 'Loại quẻ/lá số không hợp lệ.' });
            }

            const record = await findByIdFlex(Model, id);
            if (!record) {
                return res.status(404).json({ error: 'Không tìm thấy bản ghi.' });
            }

            if (record.userId !== userId && record.userId?.toString() !== userId) {
                return res.status(403).json({ error: 'Bạn không có quyền ghim bản ghi này.' });
            }

            const currentPinnedStatus = !!record.isPinned;
            
            const updatedRecord = await updateByIdFlex(Model, id, { isPinned: !currentPinnedStatus });

            // Clear cache
            MemoryCacheService.clearUserHistoryCache(userId);

            return res.json(updatedRecord);
        } catch (error) {
            console.error('pinCalculation error:', error);
            return res.status(500).json({ error: 'Lỗi máy chủ khi ghim bản ghi.' });
        }
    }
}

module.exports = HistoryController;
