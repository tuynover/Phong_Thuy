const IChingRecord = require('../models/IChingRecord');
const BaziRecord = require('../models/BaziRecord');
const ZiweiRecord = require('../models/ZiweiRecord');
const MarriageRecord = require('../models/MarriageRecord');
const GoogleIndexingService = require('../services/GoogleIndexingService');
const IChingDataService = require('../services/IChingDataService');
const MemoryCacheService = require('../services/MemoryCacheService');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const mongoose = require('mongoose');
const BaziAnalyzer = require('../services/BaziAnalyzer');
const User = require('../models/User');
const { runInTransaction } = require('../utils/transactionHelper');

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

const buildFilterQuery = (system, queryParams, userId) => {
    const { tag, isPublic, startDate, endDate, gender, search, name } = queryParams;
    const query = { 
        userId, 
        isDeleted: { $ne: true }, 
        status: { $ne: 'locked' } 
    };

    const andConditions = [];

    if (tag && tag !== 'Tất cả' && tag !== 'all') {
        if (tag === 'Chung') {
            andConditions.push({
                $or: [
                    { tags: 'Chung' },
                    { tags: { $exists: false } },
                    { tags: null },
                    { tags: { $size: 0 } }
                ]
            });
        } else {
            query.tags = tag;
        }
    }

    if (isPublic !== undefined && isPublic !== '' && isPublic !== 'all') {
        query.isPublic = (isPublic === 'true' || isPublic === true);
    }

    const dateField = system === 'iching' ? 'dateCast' : 'createdAt';
    if (startDate || endDate) {
        query[dateField] = {};
        if (startDate) {
            query[dateField].$gte = new Date(startDate);
        }
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            query[dateField].$lte = end;
        }
    }

    const searchTerm = (search || name || '').trim();
    if (searchTerm) {
        const regex = new RegExp(searchTerm, 'i');
        if (system === 'iching') {
            query.question = regex;
        } else if (system === 'bazi' || system === 'ziwei') {
            query['inputInfo.name'] = regex;
        } else if (system === 'marriage') {
            andConditions.push({
                $or: [
                    { 'inputInfo.male.name': regex },
                    { 'inputInfo.female.name': regex }
                ]
            });
        }
    }

    if (gender !== undefined && gender !== '' && gender !== 'all') {
        const gNum = parseInt(gender);
        if (system === 'bazi') {
            query['inputInfo.gender'] = gNum;
        } else if (system === 'ziwei') {
            query['inputInfo.gender'] = { $in: [gNum === 1 ? 'Nam' : 'Nữ', gNum === 1 ? 'male' : 'female', gNum, String(gNum)] };
        }
    }

    if (andConditions.length > 0) {
        query.$and = andConditions;
    }

    return query;
};

const filterByBirthInfo = (records, { birthDay, birthMonth, birthYear, birthHour }, system) => {
    if (!birthDay && !birthMonth && !birthYear && (birthHour === undefined || birthHour === null || birthHour === '')) {
        return records;
    }
    const bd = birthDay ? parseInt(birthDay) : null;
    const bm = birthMonth ? parseInt(birthMonth) : null;
    const by = birthYear ? parseInt(birthYear) : null;
    const bh = (birthHour !== undefined && birthHour !== null && birthHour !== '') ? parseInt(birthHour) : null;

    return records.filter(record => {
        if (system === 'iching') return true;
        const info = record.inputInfo;
        if (!info) return true;

        const checkPerson = (pInfo) => {
            if (!pInfo) return false;
            let dateStr = pInfo.date || '';
            let day = null, month = null, year = null;
            if (dateStr.includes('/')) {
                const parts = dateStr.split('/');
                if (parts.length === 3) {
                    day = parseInt(parts[0]);
                    month = parseInt(parts[1]);
                    year = parseInt(parts[2]);
                }
            } else if (dateStr.includes('-')) {
                const parts = dateStr.split('-');
                if (parts.length === 3) {
                    year = parseInt(parts[0]);
                    month = parseInt(parts[1]);
                    day = parseInt(parts[2]);
                }
            }

            if (bd !== null && day !== bd) return false;
            if (bm !== null && month !== bm) return false;
            if (by !== null && year !== by) return false;

            if (bh !== null) {
                if (system === 'ziwei') {
                    if (pInfo.hour !== undefined && pInfo.hour !== null && pInfo.hour !== bh) return false;
                } else if (pInfo.time) {
                    const timeHour = parseInt(pInfo.time.split(':')[0]);
                    if (!isNaN(timeHour) && timeHour !== bh) return false;
                }
            }
            return true;
        };

        if (system === 'marriage') {
            return checkPerson(info.male) || checkPerson(info.female);
        }
        return checkPerson(info);
    });
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
            
            const limit = parseInt(req.query.limit) || 100;
            const query = buildFilterQuery('iching', req.query, userId);

            const records = await IChingRecord.find(query)
                .sort({ isPinned: -1, createdAt: -1 })
                .select('-analysisSnapshot -aiInterpretation -ungKy -movingLines')
                .limit(limit)
                .lean();
            
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

    static async getAllHistory(req, res) {
        try {
            const userId = req.params.userId;
            if (!userId) return res.status(400).json({ error: 'User ID is required' });

            const limit = parseInt(req.query.limit) || 100;

            const [hexagrams, bazisRaw, ziweisRaw, marriagesRaw] = await Promise.all([
                IChingRecord.find(buildFilterQuery('iching', req.query, userId))
                    .sort({ isPinned: -1, createdAt: -1 })
                    .select('-analysisSnapshot -aiInterpretation -ungKy -movingLines')
                    .limit(limit)
                    .lean(),
                BaziRecord.find(buildFilterQuery('bazi', req.query, userId))
                    .sort({ isPinned: -1, createdAt: -1 })
                    .select('-analysisSnapshot -aiInterpretation -baziData')
                    .limit(limit)
                    .lean(),
                ZiweiRecord.find(buildFilterQuery('ziwei', req.query, userId))
                    .sort({ isPinned: -1, createdAt: -1 })
                    .select('-chartData -analysisSnapshot -aiInterpretation')
                    .limit(limit)
                    .lean(),
                MarriageRecord.find(buildFilterQuery('marriage', req.query, userId))
                    .sort({ isPinned: -1, createdAt: -1 })
                    .select('-maleBaziData -femaleBaziData -aiInterpretation')
                    .limit(limit)
                    .lean()
            ]);

            const bazis = filterByBirthInfo(bazisRaw, req.query, 'bazi').map(record => {
                if (record.tietKhiTimeline) record.tietKhiTimeline = formatCanChiSpacing(record.tietKhiTimeline);
                return record;
            });

            const ziweis = filterByBirthInfo(ziweisRaw, req.query, 'ziwei');
            const marriages = filterByBirthInfo(marriagesRaw, req.query, 'marriage');

            return res.json({
                hexagrams,
                bazis,
                ziweis,
                marriages,
                counts: {
                    hexagrams: hexagrams.length,
                    bazis: bazis.length,
                    ziweis: ziweis.length,
                    marriages: marriages.length,
                    total: hexagrams.length + bazis.length + ziweis.length + marriages.length
                }
            });
        } catch (error) {
            console.error('getAllHistory error:', error);
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
            // Soft delete the record and clear linked own record IDs inside an ACID transaction
            await runInTransaction(async (session) => {
                const opts = session ? { session } : {};
                await Model.updateOne({ _id: record._id }, { $set: { isDeleted: true } }, opts);

                const recordIdStr = record._id?.toString() || record._id;
                if (type === 'bazi' || type === 'bat_tu') {
                    await User.updateOne(
                        { _id: userId, 'baziInfo.ownBaziRecordId': recordIdStr },
                        { $set: { 'baziInfo.ownBaziRecordId': null } },
                        opts
                    );
                } else if (type === 'tu_vi' || type === 'tu-vi' || type === 'ziwei') {
                    await User.updateOne(
                        { _id: userId, 'baziInfo.ownZiweiRecordId': recordIdStr },
                        { $set: { 'baziInfo.ownZiweiRecordId': null } },
                        opts
                    );
                }
            });

            // Decrement user record count O(1)
            const UserStatsService = require('../services/UserStatsService');
            UserStatsService.incrementRecordCount(userId, type, -1);

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

    static async togglePublicCalculation(req, res) {
        try {
            const { type, id } = req.params;
            const { isPublic } = req.body;
            const userId = req.user.id || req.user._id?.toString();

            if (!userId) {
                return res.status(401).json({ error: 'Người dùng chưa xác thực.' });
            }

            let Model;
            let typePath = '';
            if (type === 'hexagrams' || type === 'iching') {
                Model = IChingRecord;
                typePath = 'iching';
            } else if (type === 'bazi' || type === 'bat_tu') {
                Model = BaziRecord;
                typePath = 'bazi';
            } else if (type === 'tu_vi' || type === 'tu-vi' || type === 'ziwei') {
                Model = ZiweiRecord;
                typePath = 'ziwei';
            } else if (type === 'marriage') {
                Model = MarriageRecord;
                typePath = 'marriage';
            } else {
                return res.status(400).json({ error: 'Loại quẻ/lá số không hợp lệ.' });
            }

            const record = await findByIdFlex(Model, id);
            if (!record) {
                return res.status(404).json({ error: 'Không tìm thấy bản ghi.' });
            }

            if (record.userId !== userId && record.userId?.toString() !== userId) {
                return res.status(403).json({ error: 'Bạn không có quyền thay đổi trạng thái bản ghi này.' });
            }

            const publicStatus = isPublic === undefined ? !record.isPublic : Boolean(isPublic);
            
            const updatedRecord = await updateByIdFlex(Model, id, { isPublic: publicStatus });

            // Clear cache lịch sử
            MemoryCacheService.clearUserHistoryCache(userId);

            // Gửi thông báo Google Indexing API không đồng bộ
            const targetUrl = `https://tuynover.ddns.net/${typePath}/record/${record._id}`;
            const action = publicStatus ? 'URL_UPDATED' : 'URL_DELETED';
            GoogleIndexingService.publishUrl(targetUrl, action).catch(err => {
                console.error(`[HistoryController.togglePublicCalculation] Lỗi ping Google Indexing cho ${targetUrl}:`, err);
            });

            return res.json(updatedRecord);
        } catch (error) {
            console.error('togglePublicCalculation error:', error);
            return res.status(500).json({ error: 'Lỗi máy chủ khi thay đổi chế độ chia sẻ bản ghi.' });
        }
    }
}

module.exports = HistoryController;
