const User = require('../models/User');
const HexagramRecord = require('../models/HexagramRecord');
const BaziRecord = require('../models/BaziRecord');
const TuViRecord = require('../modules/tu-vi/models/TuViRecord');
const HexagramConversation = require('../models/HexagramConversation');
const BaziConversation = require('../models/BaziConversation');
const TuViConversation = require('../modules/tu-vi/models/TuViConversation');
const SystemLog = require('../models/SystemLog');
const BanAppeal = require('../models/BanAppeal');
const AdminNotification = require('../models/AdminNotification');
const MemoryCacheService = require('../services/MemoryCacheService');
const sseService = require('../services/SseService');

class AdminController {
  // ==========================================
  // MEMBER MANAGEMENT
  // ==========================================
  
  static async getUsers(req, res) {
    try {
      const { search, role, status, limit = 50, page = 1 } = req.query;
      const query = {};

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
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

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const users = await User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      const total = await User.countDocuments(query);

      return res.json({ users, total, page: parseInt(page), limit: parseInt(limit) });
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
      const { type, search, status, limit = 50, page = 1 } = req.query;
      let Model;

      if (type === 'iching') Model = HexagramRecord;
      else if (type === 'bazi') Model = BaziRecord;
      else if (type === 'tuvi') Model = TuViRecord;
      else return res.status(400).json({ error: 'Loại học thuật không hợp lệ.' });

      const query = {};
      
      if (search) {
        // Search by userId, question, or email if we resolve users. Let's support searching by userId first
        query.$or = [
          { userId: { $regex: search, $options: 'i' } }
        ];
        if (type === 'iching') {
          query.$or.push({ question: { $regex: search, $options: 'i' } });
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

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const records = await Model.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      const total = await Model.countDocuments(query);

      // Populate user info and conversation chat tokens for better display
      const recordsWithUser = await Promise.all(records.map(async (record) => {
        let userPromise = Promise.resolve(null);
        if (record.userId && record.userId !== 'guest') {
          userPromise = User.findById(record.userId).select('email name').lean();
        }

        let conversationPromise = Promise.resolve(null);
        if (type === 'iching') {
          conversationPromise = HexagramConversation.findOne({ recordId: record._id }).select('totalTokens').lean();
        } else if (type === 'bazi') {
          conversationPromise = BaziConversation.findOne({ recordId: record._id }).select('totalTokens').lean();
        } else if (type === 'tuvi') {
          conversationPromise = TuViConversation.findOne({ recordId: record._id }).select('totalTokens').lean();
        }

        const [user, conversation] = await Promise.all([userPromise, conversationPromise]);

        return {
          ...record,
          user: user || { name: 'Khách', email: 'guest' },
          chatTokens: conversation?.totalTokens || 0
        };
      }));

      return res.json({ records: recordsWithUser, total, page: parseInt(page), limit: parseInt(limit) });
    } catch (error) {
      console.error('[AdminController.getCalculations] Error:', error);
      return res.status(500).json({ error: 'Lỗi tải danh sách quẻ/lá số.' });
    }
  }

  static async lockCalculation(req, res) {
    try {
      const { type, id } = req.params;
      let Model;
      if (type === 'iching') Model = HexagramRecord;
      else if (type === 'bazi') Model = BaziRecord;
      else if (type === 'tuvi') Model = TuViRecord;
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
      if (type === 'iching') Model = HexagramRecord;
      else if (type === 'bazi') Model = BaziRecord;
      else if (type === 'tuvi') Model = TuViRecord;
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
      if (type === 'iching') Model = HexagramRecord;
      else if (type === 'bazi') Model = BaziRecord;
      else if (type === 'tuvi') Model = TuViRecord;
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
      const totalUsers = await User.countDocuments({ isDeleted: { $ne: true } });
      const totalIching = await HexagramRecord.countDocuments({ isDeleted: { $ne: true } });
      const totalBazi = await BaziRecord.countDocuments({ isDeleted: { $ne: true } });
      const totalTuvi = await TuViRecord.countDocuments({ isDeleted: { $ne: true } });
      const totalAppeals = await BanAppeal.countDocuments({ status: 'pending' });

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

      // 2. Access Logs over time
      const accesses = await SystemLog.aggregate([
        { $match: { timestamp: { $gte: start, $lte: end } } },
        {
          $group: {
            _id: { $dateToString: { format: dateFormat, date: '$timestamp', timezone: 'Asia/Ho_Chi_Minh' } },
            visits: { $sum: 1 }
          }
        }
      ]);

      // 3. Calculation distribution over time
      const matchRange = { createdAt: { $gte: start, $lte: end } };
      
      const baziTimeline = await BaziRecord.aggregate([
        { $match: matchRange },
        { $group: { _id: { $dateToString: { format: dateFormat, date: '$createdAt', timezone: 'Asia/Ho_Chi_Minh' } }, count: { $sum: 1 } } }
      ]);
      const ichingTimeline = await HexagramRecord.aggregate([
        { $match: matchRange },
        { $group: { _id: { $dateToString: { format: dateFormat, date: '$createdAt', timezone: 'Asia/Ho_Chi_Minh' } }, count: { $sum: 1 } } }
      ]);
      const tuviTimeline = await TuViRecord.aggregate([
        { $match: matchRange },
        { $group: { _id: { $dateToString: { format: dateFormat, date: '$createdAt', timezone: 'Asia/Ho_Chi_Minh' } }, count: { $sum: 1 } } }
      ]);

      // 4. Token usage components over time
      const baziTokens = await BaziRecord.aggregate([
        { $match: { ...matchRange, 'aiInterpretation.tokensUsed': { $gt: 0 } } },
        { $group: { _id: { $dateToString: { format: dateFormat, date: '$createdAt', timezone: 'Asia/Ho_Chi_Minh' } }, tokens: { $sum: '$aiInterpretation.tokensUsed' } } }
      ]);

      const ichingTokens = await HexagramRecord.aggregate([
        { $match: { ...matchRange, 'aiInterpretation.tokensUsed': { $gt: 0 } } },
        { $group: { _id: { $dateToString: { format: dateFormat, date: '$createdAt', timezone: 'Asia/Ho_Chi_Minh' } }, tokens: { $sum: '$aiInterpretation.tokensUsed' } } }
      ]);

      const tuviTokens = await TuViRecord.aggregate([
        { $match: { ...matchRange, 'aiInterpretation.tokensUsed': { $gt: 0 } } },
        { $group: { _id: { $dateToString: { format: dateFormat, date: '$createdAt', timezone: 'Asia/Ho_Chi_Minh' } }, tokens: { $sum: '$aiInterpretation.tokensUsed' } } }
      ]);

      const baziChatTokens = await BaziConversation.aggregate([
        { $match: { ...matchRange, totalTokens: { $gt: 0 } } },
        { $group: { _id: { $dateToString: { format: dateFormat, date: '$createdAt', timezone: 'Asia/Ho_Chi_Minh' } }, tokens: { $sum: '$totalTokens' } } }
      ]);

      const ichingChatTokens = await HexagramConversation.aggregate([
        { $match: { ...matchRange, totalTokens: { $gt: 0 } } },
        { $group: { _id: { $dateToString: { format: dateFormat, date: '$createdAt', timezone: 'Asia/Ho_Chi_Minh' } }, tokens: { $sum: '$totalTokens' } } }
      ]);

      const tuviChatTokens = await TuViConversation.aggregate([
        { $match: { ...matchRange, totalTokens: { $gt: 0 } } },
        { $group: { _id: { $dateToString: { format: dateFormat, date: '$createdAt', timezone: 'Asia/Ho_Chi_Minh' } }, tokens: { $sum: '$totalTokens' } } }
      ]);

      // Map everything to a unified timeline array with zero-filling
      const timelineMap = new Map();
      for (const key of timeKeys) {
        timelineMap.set(key, {
          date: key,
          visits: 0,
          iching: 0,
          bazi: 0,
          tuvi: 0,
          ichingTokens: 0,
          baziTokens: 0,
          tuviTokens: 0,
          ichingInterpretTokens: 0,
          baziInterpretTokens: 0,
          tuviInterpretTokens: 0,
          ichingChatTokens: 0,
          baziChatTokens: 0,
          tuviChatTokens: 0,
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
      tuviTimeline.forEach(item => {
        if (timelineMap.has(item._id)) {
          timelineMap.get(item._id).tuvi = item.count || 0;
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
      tuviTokens.forEach(item => {
        if (timelineMap.has(item._id)) {
          const entry = timelineMap.get(item._id);
          entry.tuviInterpretTokens = item.tokens || 0;
          entry.tuviTokens = (entry.tuviTokens || 0) + (item.tokens || 0);
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
      tuviChatTokens.forEach(item => {
        if (timelineMap.has(item._id)) {
          const entry = timelineMap.get(item._id);
          entry.tuviChatTokens = item.tokens || 0;
          entry.tuviTokens = (entry.tuviTokens || 0) + (item.tokens || 0);
          entry.chatTokens += item.tokens || 0;
          entry.tokens += item.tokens || 0;
        }
      });

      const timeline = Array.from(timelineMap.values());

      // 5. User resource consumption drill-down (Top 10 consumers to avoid N+1 query)
      const drillDownMap = new Map();
      
      const sumUserStats = async (model, recordType) => {
        const stats = await model.aggregate([
          { $match: { ...matchRange, userId: { $ne: 'guest' } } },
          {
            $group: {
              _id: '$userId',
              count: { $sum: 1 },
              tokens: { $sum: { $ifNull: ['$aiInterpretation.tokensUsed', 0] } }
            }
          }
        ]);

        for (const item of stats) {
          const uid = item._id;
          if (!uid || uid === 'guest') continue;
          const current = drillDownMap.get(uid) || { tokens: 0, bazi: 0, iching: 0, tuvi: 0, chatTokens: 0, interpretationTokens: 0 };
          current.tokens += item.tokens;
          current.interpretationTokens = (current.interpretationTokens || 0) + item.tokens;
          current[recordType] = item.count;
          drillDownMap.set(uid, current);
        }
      };

      const sumChatStats = async (model) => {
        const stats = await model.aggregate([
          { $match: { ...matchRange, userId: { $ne: 'guest' } } },
          {
            $group: {
              _id: '$userId',
              tokens: { $sum: { $ifNull: ['$totalTokens', 0] } }
            }
          }
        ]);

        for (const item of stats) {
          const uid = item._id;
          if (!uid || uid === 'guest') continue;
          const current = drillDownMap.get(uid) || { tokens: 0, bazi: 0, iching: 0, tuvi: 0, chatTokens: 0, interpretationTokens: 0 };
          current.tokens += item.tokens;
          current.chatTokens = (current.chatTokens || 0) + item.tokens;
          drillDownMap.set(uid, current);
        }
      };

      await sumUserStats(BaziRecord, 'bazi');
      await sumUserStats(HexagramRecord, 'iching');
      await sumUserStats(TuViRecord, 'tuvi');

      await sumChatStats(BaziConversation);
      await sumChatStats(HexagramConversation);
      await sumChatStats(TuViConversation);

      // Sort drillDownMap by tokens used and slice top 10 to completely avoid N+1 query
      const sortedDrillDownEntries = Array.from(drillDownMap.entries())
        .sort((a, b) => b[1].tokens - a[1].tokens)
        .slice(0, 10);

      const topUserIds = sortedDrillDownEntries.map(([uid]) => uid);
      const topUsers = await User.find({ _id: { $in: topUserIds } }).select('email name').lean();
      const topUsersMap = new Map(topUsers.map(u => [u._id.toString(), u]));

      const userConsumptionList = [];
      for (const [uid, stats] of sortedDrillDownEntries) {
        const u = topUsersMap.get(uid.toString());
        if (u) {
          userConsumptionList.push({
            userId: uid,
            name: u.name,
            email: u.email,
            ...stats
          });
        }
      }

      return res.json({
        overview: {
          totalUsers,
          totalIching,
          totalBazi,
          totalTuvi,
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

      if (action === 'approve') {
        const targetUser = await User.findById(appeal.userId);
        if (targetUser) {
          targetUser.status = 'active';
          targetUser.lockReason = '';
          await targetUser.save();
          sseService.sendToUser(targetUser.id || targetUser._id.toString(), 'account_unlocked', {});
        }
      }

      appeal.status = 'resolved';
      await appeal.save();

      sseService.sendToAdmins('user_updated', { userId: appeal.userId, action: 'resolve_appeal' });

      return res.json({ message: 'Giải quyết khiếu nại thành công.', appeal });
    } catch (error) {
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
      const targetUser = await User.findById(id).select('-password').lean();
      if (!targetUser) return res.status(404).json({ error: 'Không tìm thấy người dùng.' });

      const [
        ichingCount,
        baziCount,
        tuviCount,
        ichingTokensRes,
        baziTokensRes,
        tuviTokensRes,
        ichingChatTokensRes,
        baziChatTokensRes,
        tuviChatTokensRes
      ] = await Promise.all([
        HexagramRecord.countDocuments({ userId: id, isDeleted: { $ne: true } }),
        BaziRecord.countDocuments({ userId: id, isDeleted: { $ne: true } }),
        TuViRecord.countDocuments({ userId: id, isDeleted: { $ne: true } }),
        HexagramRecord.aggregate([
          { $match: { userId: id, 'aiInterpretation.tokensUsed': { $gt: 0 } } },
          { $group: { _id: null, total: { $sum: '$aiInterpretation.tokensUsed' } } }
        ]),
        BaziRecord.aggregate([
          { $match: { userId: id, 'aiInterpretation.tokensUsed': { $gt: 0 } } },
          { $group: { _id: null, total: { $sum: '$aiInterpretation.tokensUsed' } } }
        ]),
        TuViRecord.aggregate([
          { $match: { userId: id, 'aiInterpretation.tokensUsed': { $gt: 0 } } },
          { $group: { _id: null, total: { $sum: '$aiInterpretation.tokensUsed' } } }
        ]),
        HexagramConversation.aggregate([
          { $match: { userId: id } },
          { $group: { _id: null, total: { $sum: '$totalTokens' } } }
        ]),
        BaziConversation.aggregate([
          { $match: { userId: id } },
          { $group: { _id: null, total: { $sum: '$totalTokens' } } }
        ]),
        TuViConversation.aggregate([
          { $match: { userId: id } },
          { $group: { _id: null, total: { $sum: '$totalTokens' } } }
        ])
      ]);

      const ichingTokens = ichingTokensRes[0]?.total || 0;
      const baziTokens = baziTokensRes[0]?.total || 0;
      const tuviTokens = tuviTokensRes[0]?.total || 0;

      const ichingChatTokens = ichingChatTokensRes[0]?.total || 0;
      const baziChatTokens = baziChatTokensRes[0]?.total || 0;
      const tuviChatTokens = tuviChatTokensRes[0]?.total || 0;

      const totalInterpretTokens = ichingTokens + baziTokens + tuviTokens;
      const totalChatTokens = ichingChatTokens + baziChatTokens + tuviChatTokens;
      const totalTokens = totalInterpretTokens + totalChatTokens;

      return res.json({
        user: targetUser,
        stats: {
          ichingCount,
          baziCount,
          tuviCount,
          ichingTokens,
          baziTokens,
          tuviTokens,
          ichingChatTokens,
          baziChatTokens,
          tuviChatTokens,
          totalInterpretTokens,
          totalChatTokens,
          totalTokens
        }
      });
    } catch (error) {
      console.error('[AdminController.getUserStats] Error:', error);
      return res.status(500).json({ error: 'Lỗi tải chi tiết thống kê thành viên.' });
    }
  }
}

module.exports = AdminController;
