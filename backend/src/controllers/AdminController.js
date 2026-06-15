const User = require('../models/User');
const HexagramRecord = require('../models/HexagramRecord');
const BaziRecord = require('../models/BaziRecord');
const TuViRecord = require('../modules/tu-vi/models/TuViRecord');
const SystemLog = require('../models/SystemLog');
const BanAppeal = require('../models/BanAppeal');
const AdminNotification = require('../models/AdminNotification');
const MemoryCacheService = require('../services/MemoryCacheService');

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
          query.isDeleted = false;
        } else if (status === 'active') {
          query.status = 'active';
          query.isDeleted = false;
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

      const targetUser = await User.findById(id);
      if (!targetUser) return res.status(404).json({ error: 'Không tìm thấy người dùng.' });

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

      const targetUser = await User.findById(id);
      if (!targetUser) return res.status(404).json({ error: 'Không tìm thấy người dùng.' });

      if (!req.hasAuthorityOver(targetUser)) {
        return res.status(403).json({ error: 'Bạn không có quyền khóa tài khoản này.' });
      }

      targetUser.status = 'locked';
      targetUser.lockReason = reason;
      await targetUser.save();

      return res.json({ message: 'Khóa tài khoản thành công.', user: targetUser });
    } catch (error) {
      console.error('[AdminController.lockUser] Error:', error);
      return res.status(500).json({ error: 'Lỗi khóa tài khoản.' });
    }
  }

  static async unlockUser(req, res) {
    try {
      const { id } = req.params;

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

      return res.json({ message: 'Mở khóa tài khoản thành công.', user: targetUser });
    } catch (error) {
      console.error('[AdminController.unlockUser] Error:', error);
      return res.status(500).json({ error: 'Lỗi mở khóa tài khoản.' });
    }
  }

  static async deleteUser(req, res) {
    try {
      const { id } = req.params;

      const targetUser = await User.findById(id);
      if (!targetUser) return res.status(404).json({ error: 'Không tìm thấy người dùng.' });

      if (!req.hasAuthorityOver(targetUser)) {
        return res.status(403).json({ error: 'Bạn không có quyền xóa tài khoản này.' });
      }

      targetUser.isDeleted = true;
      await targetUser.save();

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
          query.isDeleted = false;
        } else if (status === 'active') {
          query.status = 'active';
          query.isDeleted = false;
        }
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const records = await Model.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      const total = await Model.countDocuments(query);

      // Populate user info for better display
      const recordsWithUser = await Promise.all(records.map(async (record) => {
        if (record.userId && record.userId !== 'guest') {
          const user = await User.findById(record.userId).select('email name').lean();
          return { ...record, user };
        }
        return { ...record, user: { name: 'Khách', email: 'guest' } };
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
      const { startDate, endDate } = req.query;

      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      // 1. Total overview stats
      const totalUsers = await User.countDocuments({ isDeleted: false });
      const totalIching = await HexagramRecord.countDocuments({ isDeleted: false });
      const totalBazi = await BaziRecord.countDocuments({ isDeleted: false });
      const totalTuvi = await TuViRecord.countDocuments({ isDeleted: false });
      const totalAppeals = await BanAppeal.countDocuments({ status: 'pending' });

      // 2. Access Logs over time (grouped by day)
      const accesses = await SystemLog.aggregate([
        { $match: { timestamp: { $gte: start, $lte: end } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp', timezone: 'Asia/Ho_Chi_Minh' } },
            visits: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      // 3. Calculation distribution over time
      const matchRange = { createdAt: { $gte: start, $lte: end } };
      
      const baziTimeline = await BaziRecord.aggregate([
        { $match: matchRange },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Ho_Chi_Minh' } }, count: { $sum: 1 } } }
      ]);
      const ichingTimeline = await HexagramRecord.aggregate([
        { $match: matchRange },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Ho_Chi_Minh' } }, count: { $sum: 1 } } }
      ]);
      const tuviTimeline = await TuViRecord.aggregate([
        { $match: matchRange },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Ho_Chi_Minh' } }, count: { $sum: 1 } } }
      ]);

      // 4. Token usage over time (summing aiInterpretation.tokensUsed from all three Record collections)
      const baziTokens = await BaziRecord.aggregate([
        { $match: { ...matchRange, 'aiInterpretation.tokensUsed': { $gt: 0 } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Ho_Chi_Minh' } }, tokens: { $sum: '$aiInterpretation.tokensUsed' } } }
      ]);

      const ichingTokens = await HexagramRecord.aggregate([
        { $match: { ...matchRange, 'aiInterpretation.tokensUsed': { $gt: 0 } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Ho_Chi_Minh' } }, tokens: { $sum: '$aiInterpretation.tokensUsed' } } }
      ]);

      const tuviTokens = await TuViRecord.aggregate([
        { $match: { ...matchRange, 'aiInterpretation.tokensUsed': { $gt: 0 } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Ho_Chi_Minh' } }, tokens: { $sum: '$aiInterpretation.tokensUsed' } } }
      ]);

      // Map everything to a unified timeline array for Recharts
      const datesSet = new Set();
      const formatMap = (arr, valKey, targetMap) => {
        arr.forEach(item => {
          datesSet.add(item._id);
          const current = targetMap.get(item._id) || {};
          current[valKey] = item.count || item.tokens || 0;
          targetMap.set(item._id, current);
        });
      };

      const timelineDataMap = new Map();
      
      // Load accesses
      accesses.forEach(item => {
        datesSet.add(item._id);
        timelineDataMap.set(item._id, { visits: item.visits });
      });

      formatMap(ichingTimeline, 'iching', timelineDataMap);
      formatMap(baziTimeline, 'bazi', timelineDataMap);
      formatMap(tuviTimeline, 'tuvi', timelineDataMap);

      // Load tokens (summing them)
      const tokensMap = new Map();
      baziTokens.forEach(t => tokensMap.set(t._id, (tokensMap.get(t._id) || 0) + t.tokens));
      ichingTokens.forEach(t => tokensMap.set(t._id, (tokensMap.get(t._id) || 0) + t.tokens));
      tuviTokens.forEach(t => tokensMap.set(t._id, (tokensMap.get(t._id) || 0) + t.tokens));

      tokensMap.forEach((tokens, dateStr) => {
        datesSet.add(dateStr);
        const current = timelineDataMap.get(dateStr) || {};
        current.tokens = tokens;
        timelineDataMap.set(dateStr, current);
      });

      // Construct final unified timeline list sorted by date
      const timeline = Array.from(datesSet).sort().map(dateStr => {
        const data = timelineDataMap.get(dateStr);
        return {
          date: dateStr,
          visits: data.visits || 0,
          iching: data.iching || 0,
          bazi: data.bazi || 0,
          tuvi: data.tuvi || 0,
          tokens: data.tokens || 0
        };
      });

      // 5. User resource consumption drill-down (Group by user showing tokens, bazi count, iching count, tuvi count)
      const drillDownMap = new Map(); // userId -> { name, email, tokens, bazi, iching, tuvi }
      
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
          const current = drillDownMap.get(uid) || { tokens: 0, bazi: 0, iching: 0, tuvi: 0 };
          current.tokens += item.tokens;
          current[recordType] = item.count;
          drillDownMap.set(uid, current);
        }
      };

      await sumUserStats(BaziRecord, 'bazi');
      await sumUserStats(HexagramRecord, 'iching');
      await sumUserStats(TuViRecord, 'tuvi');

      // Populate user profiles
      const userConsumptionList = [];
      for (const [uid, stats] of drillDownMap.entries()) {
        const u = await User.findById(uid).select('email name').lean();
        if (u) {
          userConsumptionList.push({
            userId: uid,
            name: u.name,
            email: u.email,
            ...stats
          });
        }
      }

      // Sort by tokens used descending
      userConsumptionList.sort((a, b) => b.tokens - a.tokens);

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
      const alerts = await AdminNotification.find()
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
        }
      }

      appeal.status = 'resolved';
      await appeal.save();

      return res.json({ message: 'Giải quyết khiếu nại thành công.', appeal });
    } catch (error) {
      console.error('[AdminController.resolveAppeal] Error:', error);
      return res.status(500).json({ error: 'Lỗi xử lý khiếu nại.' });
    }
  }
}

module.exports = AdminController;
