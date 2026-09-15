const User = require('../../../core/models/User');
const IChingRecord = require('../../iching/models/IChingRecord');
const BaziRecord = require('../../bazi/models/BaziRecord');
const ZiweiRecord = require('../../ziwei/models/ZiweiRecord');
const MarriageRecord = require('../../bazi/models/MarriageRecord');
const Conversation = require('../../../core/models/Conversation');
const MemoryCacheService = require('../../../core/services/MemoryCacheService');
const escapeRegExp = require('../../../core/utils/escapeRegExp');

class AdminRecordController {
  static async getCalculations(req, res) {
    try {
      const { type, search, status, limit = 15, cursor } = req.query;
      let Model;

      let normType = type;
      if (normType === 'tuvi' || normType === 'ziwei') normType = 'ziwei';
      if (normType === 'iching' || normType === 'hexagram') normType = 'iching';
      if (normType === 'marriage') normType = 'marriage';

      if (normType === 'iching') Model = IChingRecord;
      else if (normType === 'bazi') Model = BaziRecord;
      else if (normType === 'ziwei') Model = ZiweiRecord;
      else if (normType === 'marriage') Model = MarriageRecord;
      else return res.status(400).json({ error: 'Loại học thuật không hợp lệ.' });

      // Lọc bỏ tài khoản guest hoàn toàn
      const query = {
        userId: { $ne: 'guest', $exists: true, $ne: null }
      };
      
      if (search) {
        const trimmedSearch = search.trim();
        const safeSearch = escapeRegExp(trimmedSearch);

        // Tối ưu tìm kiếm: Tìm User trước theo name/email để lấy danh sách userId (tránh Table Scan unindexed regex trên userId)
        const matchedUsers = await User.find({
          $or: [
            { name: { $regex: safeSearch, $options: 'i' } },
            { email: { $regex: safeSearch, $options: 'i' } }
          ]
        }).select('_id').limit(100).lean();

        const matchedUserIds = matchedUsers.map(u => u._id.toString());
        const searchConditions = [];

        if (matchedUserIds.length > 0) {
          searchConditions.push({ userId: { $in: matchedUserIds } });
        }

        // Nếu chuỗi tìm kiếm khớp định dạng UUID (hoặc prefix UUID), so khớp trực tiếp index userId
        const isUuidLike = /^[0-9a-f-]{4,36}$/i.test(trimmedSearch);
        if (isUuidLike) {
          searchConditions.push({ userId: trimmedSearch });
        }

        if (normType === 'iching') {
          searchConditions.push({ question: { $regex: safeSearch, $options: 'i' } });
        } else if (normType === 'marriage') {
          searchConditions.push({ 'inputInfo.male.name': { $regex: safeSearch, $options: 'i' } });
          searchConditions.push({ 'inputInfo.female.name': { $regex: safeSearch, $options: 'i' } });
        } else if (normType === 'bazi' || normType === 'ziwei') {
          searchConditions.push({ 'inputInfo.name': { $regex: safeSearch, $options: 'i' } });
        }

        if (searchConditions.length > 0) {
          query.$or = searchConditions;
        } else {
          query._id = '00000000-0000-0000-0000-000000000000'; // Không có kết quả nào khớp
        }
      }

      if (status) {
        if (status === 'deleted') {
          query.isDeleted = true;
        } else if (status === 'locked') {
          query.status = 'locked';
          query.isDeleted = { $ne: true };
        } else if (status === 'active') {
          query.status = { $ne: 'locked' };
          query.isDeleted = { $ne: true };
        }
      }

      const countQuery = { ...query };

      // Cursor-based pagination using UUIDv7 _id
      if (cursor) {
        query._id = { $lt: cursor };
      }

      // Tải nhanh: Loại trừ các trường dữ liệu biểu đồ và luận giải nặng
      const records = await Model.find(query)
        .sort({ _id: -1 })
        .select('-aiInterpretation -analysisSnapshot -baziData -chartData -primaryHexagram -transformedHexagram -maleBaziData -femaleBaziData')
        .limit(parseInt(limit))
        .lean();

      const total = await Model.countDocuments(countQuery);

      // Tránh N+1 queries bằng Bulk Query
      // 1. Gom danh sách userId duy nhất
      const userIds = [...new Set(records.map(r => r.userId).filter(id => id && id !== 'guest'))];
      
      // 2. Query Users bằng $in
      const users = userIds.length > 0
        ? await User.find({ _id: { $in: userIds } }).select('email name').lean()
        : [];
      const userMap = new Map(users.map(u => [u._id.toString(), u]));

      // 3. Gom danh sách recordId duy nhất
      const recordIds = records.map(r => r._id);

      // 4. Query Conversations bằng $in dựa trên từng loại
      let conversations = [];
      if (recordIds.length > 0) {
        let systemType = normType;
        conversations = await Conversation.find({ recordId: { $in: recordIds }, system: systemType }).select('recordId totalTokens').lean();
      }
      const conversationMap = new Map(conversations.map(c => [c.recordId.toString(), c]));

      // 5. Gộp thông tin
      const recordsWithUser = records.map(record => {
        const user = record.userId ? userMap.get(record.userId.toString()) : null;
        const conversation = conversationMap.get(record._id.toString());
        return {
          ...record,
          type: normType,
          user: user || { name: 'Khách', email: 'guest' },
          chatTokens: conversation?.totalTokens || 0
        };
      });

      return res.json({ records: recordsWithUser, total, limit: parseInt(limit) });
    } catch (error) {
      console.error('[AdminRecordController.getCalculations] Error:', error);
      return res.status(500).json({ error: 'Lỗi tải danh sách quẻ/lá số.' });
    }
  }

  static async getCalculationDetail(req, res) {
    try {
      const { type, id } = req.params;
      let Model;

      let normType = type;
      if (normType === 'tuvi' || normType === 'ziwei') normType = 'ziwei';
      if (normType === 'iching' || normType === 'hexagram') normType = 'iching';
      if (normType === 'marriage') normType = 'marriage';

      if (normType === 'iching') {
        Model = IChingRecord;
      } else if (normType === 'bazi') {
        Model = BaziRecord;
      } else if (normType === 'ziwei') {
        Model = ZiweiRecord;
      } else if (normType === 'marriage') {
        Model = MarriageRecord;
      } else {
        return res.status(400).json({ error: 'Loại học thuật không hợp lệ.' });
      }

      const record = await Model.findById(id).lean();
      if (!record) {
        return res.status(404).json({ error: 'Không tìm thấy bản ghi.' });
      }

      // Populate user info
      let user = null;
      if (record.userId && record.userId !== 'guest') {
        user = await User.findById(record.userId).select('email name').lean();
      }

      return res.json({
        ...record,
        type: normType,
        user: user || { name: 'Khách', email: 'guest' }
      });
    } catch (error) {
      console.error('[AdminRecordController.getCalculationDetail] Error:', error);
      return res.status(500).json({ error: 'Lỗi tải chi tiết bản ghi.' });
    }
  }

  static async lockCalculation(req, res) {
    try {
      const { type, id } = req.params;
      let Model;
      let normType = type;
      if (normType === 'tuvi' || normType === 'ziwei') normType = 'ziwei';
      if (normType === 'iching' || normType === 'hexagram') normType = 'iching';
      if (normType === 'marriage') normType = 'marriage';

      if (normType === 'iching') Model = IChingRecord;
      else if (normType === 'bazi') Model = BaziRecord;
      else if (normType === 'ziwei') Model = ZiweiRecord;
      else if (normType === 'marriage') Model = MarriageRecord;
      else return res.status(400).json({ error: 'Loại học thuật không hợp lệ.' });

      const record = await Model.findById(id);
      if (!record) return res.status(404).json({ error: 'Không tìm thấy bản ghi.' });

      record.status = 'locked';
      await record.save();

      // Clear related caches
      if (record.userId) MemoryCacheService.clearUserHistoryCache(record.userId);

      return res.json({ message: 'Khóa bản ghi luận giải thành công.', record });
    } catch (error) {
      console.error('[AdminRecordController.lockCalculation] Error:', error);
      return res.status(500).json({ error: 'Lỗi khóa bản ghi.' });
    }
  }

  static async unlockCalculation(req, res) {
    try {
      const { type, id } = req.params;
      let Model;
      let normType = type;
      if (normType === 'tuvi' || normType === 'ziwei') normType = 'ziwei';
      if (normType === 'iching' || normType === 'hexagram') normType = 'iching';
      if (normType === 'marriage') normType = 'marriage';

      if (normType === 'iching') Model = IChingRecord;
      else if (normType === 'bazi') Model = BaziRecord;
      else if (normType === 'ziwei') Model = ZiweiRecord;
      else if (normType === 'marriage') Model = MarriageRecord;
      else return res.status(400).json({ error: 'Loại học thuật không hợp lệ.' });

      const record = await Model.findById(id);
      if (!record) return res.status(404).json({ error: 'Không tìm thấy bản ghi.' });

      record.status = 'active';
      await record.save();

      // Clear related caches
      if (record.userId) MemoryCacheService.clearUserHistoryCache(record.userId);

      return res.json({ message: 'Mở khóa bản ghi luận giải thành công.', record });
    } catch (error) {
      console.error('[AdminRecordController.unlockCalculation] Error:', error);
      return res.status(500).json({ error: 'Lỗi mở khóa bản ghi.' });
    }
  }

  static async deleteCalculation(req, res) {
    try {
      const { type, id } = req.params;
      let Model;
      let normType = type;
      if (normType === 'tuvi' || normType === 'ziwei') normType = 'ziwei';
      if (normType === 'iching' || normType === 'hexagram') normType = 'iching';
      if (normType === 'marriage') normType = 'marriage';

      if (normType === 'iching') Model = IChingRecord;
      else if (normType === 'bazi') Model = BaziRecord;
      else if (normType === 'ziwei') Model = ZiweiRecord;
      else if (normType === 'marriage') Model = MarriageRecord;
      else return res.status(400).json({ error: 'Loại học thuật không hợp lệ.' });

      const record = await Model.findById(id);
      if (!record) return res.status(404).json({ error: 'Không tìm thấy bản ghi.' });

      record.isDeleted = true;
      await record.save();

      // Clear related caches
      if (record.userId) MemoryCacheService.clearUserHistoryCache(record.userId);

      return res.json({ message: 'Xóa bản ghi thành công (Xóa mềm).', record });
    } catch (error) {
      console.error('[AdminRecordController.deleteCalculation] Error:', error);
      return res.status(500).json({ error: 'Lỗi xóa bản ghi.' });
    }
  }
}

module.exports = AdminRecordController;
