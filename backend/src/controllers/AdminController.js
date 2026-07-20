const User = require('../models/User');
const IChingRecord = require('../models/IChingRecord');
const BaziRecord = require('../models/BaziRecord');
const ZiweiRecord = require('../models/ZiweiRecord');
const MarriageRecord = require('../models/MarriageRecord');
const Conversation = require('../models/Conversation');
const SystemLog = require('../models/SystemLog');
const BanAppeal = require('../models/BanAppeal');
const AdminNotification = require('../models/AdminNotification');
const MemoryCacheService = require('../services/MemoryCacheService');
const sseService = require('../services/SseService');
const { clearUserProfileCache } = require('../config/redis');
const escapeRegExp = require('../utils/escapeRegExp');
const { runInTransaction } = require('../utils/transactionHelper');


class AdminController {
  // ==========================================
  // MEMBER MANAGEMENT
  // ==========================================
  
  static async getUsers(req, res) {
    try {
      const { search, role, status, limit = 15, cursor } = req.query;
      const query = {};

      if (search) {
        const safeSearch = escapeRegExp(search.trim());
        query.$or = [
          { name: { $regex: safeSearch, $options: 'i' } },
          { email: { $regex: safeSearch, $options: 'i' } }
        ];
      }

      if (role) {
        query.role = role;
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

      const users = await User.find(query)
        .sort({ _id: -1 })
        .limit(parseInt(limit))
        .select('email name role credits status isDeleted createdAt')
        .lean();

      const total = await User.countDocuments(countQuery);

      return res.json({ users, total, limit: parseInt(limit) });
    } catch (error) {
      console.error('[AdminController.getUsers] Error:', error);
      return res.status(500).json({ error: 'Lỗi lấy danh sách thành viên.' });
    }
  }

  static async updateUserRole(req, res) {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!['admin', 'co-admin', 'vip', 'user'].includes(role)) {
        return res.status(400).json({ error: 'Vai trò không hợp lệ.' });
      }

      // Strict limit: at any time only 1 admin, cannot promote anyone to admin
      if (role === 'admin') {
        return res.status(400).json({ error: 'Không thể phong cấp thêm tài khoản Admin.' });
      }

      if (req.user && req.user._id.toString() === id) {
        return res.status(400).json({ error: 'Bạn không thể tự chỉnh sửa vai trò của chính mình.' });
      }

      const targetUser = await User.findById(id);
      if (!targetUser) return res.status(404).json({ error: 'Không tìm thấy người dùng.' });

      // Co-admin cannot promote anyone to admin or co-admin
      if (req.user && req.user.role === 'co-admin') {
        if (role === 'co-admin' || role === 'admin') {
          return res.status(403).json({ error: 'Co-admin không có quyền phong cấp tài khoản khác lên Co-admin hoặc Admin.' });
        }
      }

      // Co-admin cannot modify admin/co-admin accounts
      if (!req.hasAuthorityOver(targetUser)) {
        return res.status(403).json({ error: 'Bạn không có quyền quản lý tài khoản cấp bậc này.' });
      }

      targetUser.role = role;
      
      // Auto assign 9999 credits for administrative accounts
      if (role === 'admin' || role === 'co-admin') {
        targetUser.credits = 9999;
      } else if (targetUser.credits === 9999) {
        targetUser.credits = 1; // reset if demoted
      }

      await targetUser.save();
      
      // Invalidate cache
      MemoryCacheService.clearUserHistoryCache(targetUser.id);
      clearUserProfileCache(targetUser.id);

      sseService.sendToUser(id, 'account_updated', { role: targetUser.role, credits: targetUser.credits });
      sseService.sendToAdmins('user_updated', { userId: id, action: 'role' });

      return res.json({ message: 'Cập nhật vai trò thành công.', user: targetUser });
    } catch (error) {
      console.error('[AdminController.updateUserRole] Error:', error);
      return res.status(500).json({ error: 'Lỗi cập nhật vai trò.' });
    }
  }

  static async updateUserCredits(req, res) {
    try {
      const { id } = req.params;
      const { credits, mode } = req.body; // mode: "set" | "add" | "subtract"

      const targetUser = await User.findById(id);
      if (!targetUser) return res.status(404).json({ error: 'Không tìm thấy người dùng.' });

      if (!req.hasAuthorityOver(targetUser)) {
        return res.status(403).json({ error: 'Bạn không có quyền chỉnh sửa credit của tài khoản này.' });
      }

      const amt = parseInt(credits);
      if (isNaN(amt)) return res.status(400).json({ error: 'Số lượt sử dụng không hợp lệ.' });

      if (mode === 'add') {
        targetUser.credits += amt;
      } else if (mode === 'subtract') {
        targetUser.credits = Math.max(0, targetUser.credits - amt);
      } else {
        targetUser.credits = Math.max(0, amt);
      }

      await targetUser.save();
      clearUserProfileCache(targetUser.id);


      sseService.sendToUser(id, 'account_updated', { role: targetUser.role, credits: targetUser.credits });
      sseService.sendToAdmins('user_updated', { userId: id, action: 'credits' });

      return res.json({ message: 'Cập nhật lượt sử dụng thành công.', user: targetUser });
    } catch (error) {
      console.error('[AdminController.updateUserCredits] Error:', error);
      return res.status(500).json({ error: 'Lỗi cập nhật lượt sử dụng.' });
    }
  }

  static async lockUser(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!reason) return res.status(400).json({ error: 'Lý do khóa tài khoản là bắt buộc.' });

      if (req.user && req.user._id.toString() === id) {
        return res.status(400).json({ error: 'Bạn không thể tự khóa tài khoản của chính mình.' });
      }

      const targetUser = await User.findById(id);
      if (!targetUser) return res.status(404).json({ error: 'Không tìm thấy người dùng.' });

      if (!req.hasAuthorityOver(targetUser)) {
        return res.status(403).json({ error: 'Bạn không có quyền khóa tài khoản này.' });
      }

      targetUser.status = 'locked';
      targetUser.lockReason = reason;
      await targetUser.save();
      clearUserProfileCache(targetUser.id);

      sseService.sendToUser(id, 'account_locked', { reason: targetUser.lockReason });
      sseService.sendToAdmins('user_updated', { userId: id, action: 'lock' });

      return res.json({ message: 'Khóa tài khoản thành công.', user: targetUser });
    } catch (error) {
      console.error('[AdminController.lockUser] Error:', error);
      return res.status(500).json({ error: 'Lỗi khóa tài khoản.' });
    }
  }

  static async unlockUser(req, res) {
    try {
      const { id } = req.params;

      if (req.user && req.user._id.toString() === id) {
        return res.status(400).json({ error: 'Bạn không thể tự mở khóa tài khoản của chính mình.' });
      }

      const targetUser = await User.findById(id);
      if (!targetUser) return res.status(404).json({ error: 'Không tìm thấy người dùng.' });

      if (!req.hasAuthorityOver(targetUser)) {
        return res.status(403).json({ error: 'Bạn không có quyền mở khóa tài khoản này.' });
      }

      targetUser.status = 'active';
      targetUser.lockReason = '';
      await targetUser.save();
      clearUserProfileCache(targetUser.id);


      // Automatically resolve appeals for this user
      await BanAppeal.updateMany({ userId: id }, { status: 'resolved' });

      sseService.sendToUser(id, 'account_unlocked', {});
      sseService.sendToAdmins('user_updated', { userId: id, action: 'unlock' });

      return res.json({ message: 'Mở khóa tài khoản thành công.', user: targetUser });
    } catch (error) {
      console.error('[AdminController.unlockUser] Error:', error);
      return res.status(500).json({ error: 'Lỗi mở khóa tài khoản.' });
    }
  }

  static async deleteUser(req, res) {
    try {
      const { id } = req.params;

      if (req.user && req.user._id.toString() === id) {
        return res.status(400).json({ error: 'Bạn không thể tự xóa tài khoản của chính mình.' });
      }

      const targetUser = await User.findById(id);
      if (!targetUser) return res.status(404).json({ error: 'Không tìm thấy người dùng.' });

      if (!req.hasAuthorityOver(targetUser)) {
        return res.status(403).json({ error: 'Bạn không có quyền xóa tài khoản này.' });
      }

      targetUser.isDeleted = true;
      await targetUser.save();

      sseService.sendToUser(id, 'account_deleted', {});
      sseService.sendToAdmins('user_updated', { userId: id, action: 'delete' });

      return res.json({ message: 'Xóa tài khoản thành công (Xóa mềm).', user: targetUser });
    } catch (error) {
      console.error('[AdminController.deleteUser] Error:', error);
      return res.status(500).json({ error: 'Lỗi xóa tài khoản.' });
    }
  }

  // ==========================================
  // CALCULATION RECORD MANAGEMENT
  // ==========================================

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
        const safeSearch = escapeRegExp(search.trim());
        const searchConditions = [
          { userId: { $regex: safeSearch, $options: 'i' } }
        ];
        if (normType === 'iching') {
          searchConditions.push({ question: { $regex: safeSearch, $options: 'i' } });
        } else if (normType === 'marriage') {
          searchConditions.push({ 'inputInfo.male.name': { $regex: safeSearch, $options: 'i' } });
          searchConditions.push({ 'inputInfo.female.name': { $regex: safeSearch, $options: 'i' } });
        }
        query.$or = searchConditions;
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
      console.error('[AdminController.getCalculations] Error:', error);
      return res.status(500).json({ error: 'Lỗi tải danh sách quẻ/lá số.' });
    }
  }

  static async getCalculationDetail(req, res) {
    try {
      const { type, id } = req.params;
      let Model;
      let selectFields = '';

      let normType = type;
      if (normType === 'tuvi' || normType === 'ziwei') normType = 'ziwei';
      if (normType === 'iching' || normType === 'hexagram') normType = 'iching';
      if (normType === 'marriage') normType = 'marriage';

      if (normType === 'iching') {
        Model = IChingRecord;
        selectFields = '_id userId createdAt status isDeleted question primaryHexagram.name primaryHexagram.ungKy transformedHexagram.name primary.name primary.ungKy secondary.name aiInterpretation.model aiInterpretation.promptVersion aiInterpretation.promptTokens aiInterpretation.completionTokens aiInterpretation.tokensUsed chatTokens';
      } else if (normType === 'bazi') {
        Model = BaziRecord;
        selectFields = '_id userId createdAt status isDeleted baziData.canChi.year baziData.canChi.month baziData.canChi.day baziData.canChi.hour aiInterpretation.model aiInterpretation.promptVersion aiInterpretation.promptTokens aiInterpretation.completionTokens aiInterpretation.tokensUsed chatTokens';
      } else if (normType === 'ziwei') {
        Model = ZiweiRecord;
        selectFields = '_id userId createdAt status isDeleted chartData.fiveElementsClass chartData.zodiac chartData.chineseDate chartData.soul chartData.body chartData.palaces.isBodyPalace chartData.palaces.name aiInterpretation.model aiInterpretation.promptVersion aiInterpretation.promptTokens aiInterpretation.completionTokens aiInterpretation.tokensUsed chatTokens';
      } else if (normType === 'marriage') {
        Model = MarriageRecord;
        selectFields = '_id userId createdAt status isDeleted inputInfo maleBaziData.solarTimeline femaleBaziData.solarTimeline maleBaziData.canChi femaleBaziData.canChi aiInterpretation.model aiInterpretation.promptVersion aiInterpretation.promptTokens aiInterpretation.completionTokens aiInterpretation.tokensUsed chatTokens';
      } else {
        return res.status(400).json({ error: 'Loại học thuật không hợp lệ.' });
      }

      const record = await Model.findById(id).select(selectFields).lean();
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
        user: user || { name: 'Khách', email: 'guest' }
      });
    } catch (error) {
      console.error('[AdminController.getCalculationDetail] Error:', error);
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
      console.error('[AdminController.lockCalculation] Error:', error);
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
      console.error('[AdminController.unlockCalculation] Error:', error);
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
      console.error('[AdminController.deleteCalculation] Error:', error);
      return res.status(500).json({ error: 'Lỗi xóa bản ghi.' });
    }
  }

  // ==========================================
  // ANALYTICS & DRILLDOWN
  // ==========================================

  static async getAnalytics(req, res) {
    try {
      const { startDate, endDate, groupBy = 'day' } = req.query;

      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      let end = endDate ? new Date(endDate) : new Date();
      if (endDate) {
        end = new Date(end.getTime() + 24 * 60 * 60 * 1000 - 1);
      }

      // 1. Total overview stats - using $ne: true to include legacy records
      const [
        totalUsers,
        totalIching,
        totalBazi,
        totalZiwei,
        totalMarriage,
        totalAppeals
      ] = await Promise.all([
        User.countDocuments({ isDeleted: { $ne: true } }),
        IChingRecord.countDocuments({ isDeleted: { $ne: true } }),
        BaziRecord.countDocuments({ isDeleted: { $ne: true } }),
        ZiweiRecord.countDocuments({ isDeleted: { $ne: true } }),
        MarriageRecord.countDocuments({ isDeleted: { $ne: true } }),
        BanAppeal.countDocuments({ status: 'pending' })
      ]);

      // Generate dateFormat
      const dateFormat = groupBy === 'hour' ? '%Y-%m-%d %H:00' : '%Y-%m-%d';

      // Generate all timeline keys for zero-filling
      const timeKeys = [];
      let current = new Date(start.getTime());
      
      current.setSeconds(0);
      current.setMilliseconds(0);
      if (groupBy !== 'hour') {
        current.setHours(0, 0, 0, 0);
      } else {
        current.setMinutes(0);
      }

      const endLimit = new Date(end.getTime());

      const formatTimeTZ = (date, formatStr) => {
        const tzOffsetMs = 7 * 60 * 60 * 1000;
        const localTime = new Date(date.getTime() + tzOffsetMs);
        const yyyy = localTime.getUTCFullYear();
        const mm = String(localTime.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(localTime.getUTCDate()).padStart(2, '0');
        if (formatStr.includes('%H')) {
          const hh = String(localTime.getUTCHours()).padStart(2, '0');
          return `${yyyy}-${mm}-${dd} ${hh}:00`;
        }
        return `${yyyy}-${mm}-${dd}`;
      };

      const stepMs = groupBy === 'hour' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
      let safetyCount = 0;
      while (current <= endLimit && safetyCount < 1000) {
        timeKeys.push(formatTimeTZ(current, dateFormat));
        current = new Date(current.getTime() + stepMs);
        safetyCount++;
      }

      const matchRange = { createdAt: { $gte: start, $lte: end }, isDeleted: { $ne: true } };
      const conversationMatchRange = { createdAt: { $gte: start, $lte: end } };

      // 2. 3. 4. Parallelized aggregates over time
      const [
        accesses,
        baziTimeline,
        ichingTimeline,
        ziweiTimeline,
        marriageTimeline,
        baziTokens,
        ichingTokens,
        ziweiTokens,
        marriageTokens,
        baziChatTokens,
        ichingChatTokens,
        ziweiChatTokens,
        marriageChatTokens
      ] = await Promise.all([
        SystemLog.aggregate([
          { $match: { timestamp: { $gte: start, $lte: end } } },
          {
            $group: {
              _id: { $dateToString: { format: dateFormat, date: '$timestamp', timezone: 'Asia/Ho_Chi_Minh' } },
              visits: { $sum: 1 }
            }
          }
        ]),
        BaziRecord.aggregate([
          { $match: matchRange },
          { $group: { _id: { $dateToString: { format: dateFormat, date: '$createdAt', timezone: 'Asia/Ho_Chi_Minh' } }, count: { $sum: 1 } } }
        ]),
        IChingRecord.aggregate([
          { $match: matchRange },
          { $group: { _id: { $dateToString: { format: dateFormat, date: '$createdAt', timezone: 'Asia/Ho_Chi_Minh' } }, count: { $sum: 1 } } }
        ]),
        ZiweiRecord.aggregate([
          { $match: matchRange },
          { $group: { _id: { $dateToString: { format: dateFormat, date: '$createdAt', timezone: 'Asia/Ho_Chi_Minh' } }, count: { $sum: 1 } } }
        ]),
        MarriageRecord.aggregate([
          { $match: matchRange },
          { $group: { _id: { $dateToString: { format: dateFormat, date: '$createdAt', timezone: 'Asia/Ho_Chi_Minh' } }, count: { $sum: 1 } } }
        ]),
        BaziRecord.aggregate([
          { $match: { ...matchRange, 'aiInterpretation.tokensUsed': { $gt: 0 } } },
          { $group: { _id: { $dateToString: { format: dateFormat, date: '$createdAt', timezone: 'Asia/Ho_Chi_Minh' } }, tokens: { $sum: '$aiInterpretation.tokensUsed' } } }
        ]),
        IChingRecord.aggregate([
          { $match: { ...matchRange, 'aiInterpretation.tokensUsed': { $gt: 0 } } },
          { $group: { _id: { $dateToString: { format: dateFormat, date: '$createdAt', timezone: 'Asia/Ho_Chi_Minh' } }, tokens: { $sum: '$aiInterpretation.tokensUsed' } } }
        ]),
        ZiweiRecord.aggregate([
          { $match: { ...matchRange, 'aiInterpretation.tokensUsed': { $gt: 0 } } },
          { $group: { _id: { $dateToString: { format: dateFormat, date: '$createdAt', timezone: 'Asia/Ho_Chi_Minh' } }, tokens: { $sum: '$aiInterpretation.tokensUsed' } } }
        ]),
        MarriageRecord.aggregate([
          { $match: { ...matchRange, 'aiInterpretation.tokensUsed': { $gt: 0 } } },
          { $group: { _id: { $dateToString: { format: dateFormat, date: '$createdAt', timezone: 'Asia/Ho_Chi_Minh' } }, tokens: { $sum: '$aiInterpretation.tokensUsed' } } }
        ]),
        Conversation.aggregate([
          { $match: { ...conversationMatchRange, system: 'bazi', totalTokens: { $gt: 0 } } },
          { $group: { _id: { $dateToString: { format: dateFormat, date: '$createdAt', timezone: 'Asia/Ho_Chi_Minh' } }, tokens: { $sum: '$totalTokens' } } }
        ]),
        Conversation.aggregate([
          { $match: { ...conversationMatchRange, system: 'iching', totalTokens: { $gt: 0 } } },
          { $group: { _id: { $dateToString: { format: dateFormat, date: '$createdAt', timezone: 'Asia/Ho_Chi_Minh' } }, tokens: { $sum: '$totalTokens' } } }
        ]),
        Conversation.aggregate([
          { $match: { ...conversationMatchRange, system: 'ziwei', totalTokens: { $gt: 0 } } },
          { $group: { _id: { $dateToString: { format: dateFormat, date: '$createdAt', timezone: 'Asia/Ho_Chi_Minh' } }, tokens: { $sum: '$totalTokens' } } }
        ]),
        Conversation.aggregate([
          { $match: { ...conversationMatchRange, system: 'marriage', totalTokens: { $gt: 0 } } },
          { $group: { _id: { $dateToString: { format: dateFormat, date: '$createdAt', timezone: 'Asia/Ho_Chi_Minh' } }, tokens: { $sum: '$totalTokens' } } }
        ])
      ]);

      // Map everything to a unified timeline array with zero-filling
      const timelineMap = new Map();
      for (const key of timeKeys) {
        timelineMap.set(key, {
          date: key,
          visits: 0,
          iching: 0,
          bazi: 0,
          ziwei: 0,
          marriage: 0,
          ichingTokens: 0,
          baziTokens: 0,
          ziweiTokens: 0,
          marriageTokens: 0,
          ichingInterpretTokens: 0,
          baziInterpretTokens: 0,
          ziweiInterpretTokens: 0,
          marriageInterpretTokens: 0,
          ichingChatTokens: 0,
          baziChatTokens: 0,
          ziweiChatTokens: 0,
          marriageChatTokens: 0,
          interpretTokens: 0,
          chatTokens: 0,
          tokens: 0
        });
      }

      accesses.forEach(item => {
        if (timelineMap.has(item._id)) {
          timelineMap.get(item._id).visits = item.visits || 0;
        }
      });

      ichingTimeline.forEach(item => {
        if (timelineMap.has(item._id)) {
          timelineMap.get(item._id).iching = item.count || 0;
        }
      });
      baziTimeline.forEach(item => {
        if (timelineMap.has(item._id)) {
          timelineMap.get(item._id).bazi = item.count || 0;
        }
      });
      ziweiTimeline.forEach(item => {
        if (timelineMap.has(item._id)) {
          timelineMap.get(item._id).ziwei = item.count || 0;
        }
      });
      marriageTimeline.forEach(item => {
        if (timelineMap.has(item._id)) {
          timelineMap.get(item._id).marriage = item.count || 0;
        }
      });

      ichingTokens.forEach(item => {
        if (timelineMap.has(item._id)) {
          const entry = timelineMap.get(item._id);
          entry.ichingInterpretTokens = item.tokens || 0;
          entry.ichingTokens = (entry.ichingTokens || 0) + (item.tokens || 0);
          entry.interpretTokens += item.tokens || 0;
          entry.tokens += item.tokens || 0;
        }
      });
      baziTokens.forEach(item => {
        if (timelineMap.has(item._id)) {
          const entry = timelineMap.get(item._id);
          entry.baziInterpretTokens = item.tokens || 0;
          entry.baziTokens = (entry.baziTokens || 0) + (item.tokens || 0);
          entry.interpretTokens += item.tokens || 0;
          entry.tokens += item.tokens || 0;
        }
      });
      ziweiTokens.forEach(item => {
        if (timelineMap.has(item._id)) {
          const entry = timelineMap.get(item._id);
          entry.ziweiInterpretTokens = item.tokens || 0;
          entry.ziweiTokens = (entry.ziweiTokens || 0) + (item.tokens || 0);
          entry.interpretTokens += item.tokens || 0;
          entry.tokens += item.tokens || 0;
        }
      });
      marriageTokens.forEach(item => {
        if (timelineMap.has(item._id)) {
          const entry = timelineMap.get(item._id);
          entry.marriageInterpretTokens = item.tokens || 0;
          entry.marriageTokens = (entry.marriageTokens || 0) + (item.tokens || 0);
          entry.interpretTokens += item.tokens || 0;
          entry.tokens += item.tokens || 0;
        }
      });

      ichingChatTokens.forEach(item => {
        if (timelineMap.has(item._id)) {
          const entry = timelineMap.get(item._id);
          entry.ichingChatTokens = item.tokens || 0;
          entry.ichingTokens = (entry.ichingTokens || 0) + (item.tokens || 0);
          entry.chatTokens += item.tokens || 0;
          entry.tokens += item.tokens || 0;
        }
      });
      baziChatTokens.forEach(item => {
        if (timelineMap.has(item._id)) {
          const entry = timelineMap.get(item._id);
          entry.baziChatTokens = item.tokens || 0;
          entry.baziTokens = (entry.baziTokens || 0) + (item.tokens || 0);
          entry.chatTokens += item.tokens || 0;
          entry.tokens += item.tokens || 0;
        }
      });
      ziweiChatTokens.forEach(item => {
        if (timelineMap.has(item._id)) {
          const entry = timelineMap.get(item._id);
          entry.ziweiChatTokens = item.tokens || 0;
          entry.ziweiTokens = (entry.ziweiTokens || 0) + (item.tokens || 0);
          entry.chatTokens += item.tokens || 0;
          entry.tokens += item.tokens || 0;
        }
      });
      marriageChatTokens.forEach(item => {
        if (timelineMap.has(item._id)) {
          const entry = timelineMap.get(item._id);
          entry.marriageChatTokens = item.tokens || 0;
          entry.marriageTokens = (entry.marriageTokens || 0) + (item.tokens || 0);
          entry.chatTokens += item.tokens || 0;
          entry.tokens += item.tokens || 0;
        }
      });

      const timeline = Array.from(timelineMap.values());

      // 5. User resource consumption drill-down (Top 10 consumers directly from User stats)
      const topUsers = await User.find({
        isDeleted: { $ne: true },
        'stats.totalTokens': { $gt: 0 }
      })
      .sort({ 'stats.totalTokens': -1 })
      .limit(10)
      .select('email name stats')
      .lean();

      const userConsumptionList = topUsers.map(u => ({
        userId: u._id.toString(),
        name: u.name,
        email: u.email,
        tokens: u.stats?.totalTokens || 0,
        bazi: u.stats?.baziCount || 0,
        iching: u.stats?.ichingCount || 0,
        ziwei: u.stats?.ziweiCount || 0,
        marriage: u.stats?.marriageCount || 0,
        chatTokens: u.stats?.totalChatTokens || 0,
        interpretationTokens: u.stats?.totalInterpretTokens || 0
      }));

      return res.json({
        overview: {
          totalUsers,
          totalIching,
          totalBazi,
          totalZiwei,
          totalMarriage,
          totalAppeals
        },
        timeline,
        userConsumption: userConsumptionList
      });
    } catch (error) {
      console.error('[AdminController.getAnalytics] Error:', error);
      return res.status(500).json({ error: 'Lỗi tải dữ liệu thống kê.' });
    }
  }

  // ==========================================
  // ALERTS & COMPLAINTS
  // ==========================================

  static async getNotifications(req, res) {
    try {
      const alerts = await AdminNotification.find({ type: { $ne: 'appeal' } })
        .sort({ createdAt: -1 })
        .limit(100)
        .lean();

      const appeals = await BanAppeal.find({ status: 'pending' })
        .sort({ createdAt: -1 })
        .lean();

      return res.json({ alerts, appeals });
    } catch (error) {
      console.error('[AdminController.getNotifications] Error:', error);
      return res.status(500).json({ error: 'Lỗi tải danh sách cảnh báo/khiếu nại.' });
    }
  }

  static async markNotificationRead(req, res) {
    try {
      const { id } = req.params;
      const alert = await AdminNotification.findById(id);
      if (!alert) return res.status(404).json({ error: 'Không tìm thấy cảnh báo.' });

      alert.status = 'read';
      await alert.save();

      return res.json({ message: 'Đã đánh dấu đọc thông báo.', alert });
    } catch (error) {
      console.error('[AdminController.markNotificationRead] Error:', error);
      return res.status(500).json({ error: 'Lỗi cập nhật cảnh báo.' });
    }
  }

  static async resolveAppeal(req, res) {
    try {
      const { id } = req.params;
      const { action } = req.body; // 'approve' (unlock user) or 'reject' (dismiss appeal)

      const appeal = await BanAppeal.findById(id);
      if (!appeal) return res.status(404).json({ error: 'Không tìm thấy khiếu nại.' });

      await runInTransaction(async (session) => {
        const opts = session ? { session } : {};
        if (action === 'approve') {
          const targetUser = await User.findById(appeal.userId);
          if (targetUser) {
            if (req.hasAuthorityOver && !req.hasAuthorityOver(targetUser)) {
              const err = new Error('Bạn không có quyền mở khóa cho tài khoản Quản trị viên này.');
              err.statusCode = 403;
              throw err;
            }
            targetUser.status = 'active';
            targetUser.lockReason = '';
            await targetUser.save(opts);
            sseService.sendToUser(targetUser.id || targetUser._id.toString(), 'account_unlocked', {});
          }
        }
        appeal.status = 'resolved';
        await appeal.save(opts);
      });

      sseService.sendToAdmins('user_updated', { userId: appeal.userId, action: 'resolve_appeal' });

      return res.json({ message: 'Giải quyết khiếu nại thành công.', appeal });
    } catch (error) {
      if (error.statusCode === 403) {
        return res.status(403).json({ error: error.message });
      }
      console.error('[AdminController.resolveAppeal] Error:', error);
      return res.status(500).json({ error: 'Lỗi xử lý khiếu nại.' });
    }
  }

  static async restoreUser(req, res) {
    try {
      const { id } = req.params;

      if (req.user && req.user._id.toString() === id) {
        return res.status(400).json({ error: 'Bạn không thể tự khôi phục tài khoản của chính mình.' });
      }

      const targetUser = await User.findById(id);
      if (!targetUser) return res.status(404).json({ error: 'Không tìm thấy người dùng.' });
      if (!req.hasAuthorityOver(targetUser)) {
        return res.status(403).json({ error: 'Bạn không có quyền khôi phục tài khoản này.' });
      }
      targetUser.isDeleted = false;
      await targetUser.save();

      sseService.sendToUser(id, 'account_restored', {});
      sseService.sendToAdmins('user_updated', { userId: id, action: 'restore' });

      return res.json({ message: 'Khôi phục tài khoản thành công.', user: targetUser });
    } catch (error) {
      console.error('[AdminController.restoreUser] Error:', error);
      return res.status(500).json({ error: 'Lỗi khôi phục tài khoản.' });
    }
  }

  static async getUserStats(req, res) {
    try {
      const { id } = req.params;
      const targetUser = await User.findById(id)
        .select('email name role credits status lockReason isDeleted createdAt updatedAt stats')
        .lean();
      if (!targetUser) return res.status(404).json({ error: 'Không tìm thấy người dùng.' });

      let stats = targetUser.stats;
      if (!stats || !stats.lastUpdated) {
        const UserStatsService = require('../services/UserStatsService');
        stats = await UserStatsService.updateUserStats(id);
      }

      return res.json({
        user: targetUser,
        stats
      });
    } catch (error) {
      console.error('[AdminController.getUserStats] Error:', error);
      return res.status(500).json({ error: 'Lỗi tải chi tiết thống kê thành viên.' });
    }
  }
}

module.exports = AdminController;
