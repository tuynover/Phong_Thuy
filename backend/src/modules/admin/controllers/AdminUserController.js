const User = require('../../../core/models/User');
const BanAppeal = require('../models/BanAppeal');
const MemoryCacheService = require('../../../core/services/MemoryCacheService');
const sseService = require('../../../core/services/SseService');
const { clearUserProfileCache } = require('../../../core/config/redis');
const escapeRegExp = require('../../../core/utils/escapeRegExp');
const UserStatsService = require('../../../core/services/UserStatsService');

class AdminUserController {
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
      console.error('[AdminUserController.getUsers] Error:', error);
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
      
      // Auto assign 999900 credits (points) for administrative accounts
      if (role === 'admin' || role === 'co-admin') {
        targetUser.credits = 999900;
      } else if (targetUser.credits >= 9999) {
        targetUser.credits = 100; // reset if demoted
      }

      await targetUser.save();
      
      // Invalidate cache
      MemoryCacheService.clearUserHistoryCache(targetUser.id);
      await clearUserProfileCache(targetUser.id);

      sseService.sendToUser(id, 'account_updated', { role: targetUser.role, credits: targetUser.credits });
      sseService.sendToAdmins('user_updated', { userId: id, action: 'role' });

      return res.json({ message: 'Cập nhật vai trò thành công.', user: targetUser });
    } catch (error) {
      console.error('[AdminUserController.updateUserRole] Error:', error);
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
      await clearUserProfileCache(targetUser.id);

      sseService.sendToUser(id, 'account_updated', { role: targetUser.role, credits: targetUser.credits });
      sseService.sendToAdmins('user_updated', { userId: id, action: 'credits' });

      return res.json({ message: 'Cập nhật lượt sử dụng thành công.', user: targetUser });
    } catch (error) {
      console.error('[AdminUserController.updateUserCredits] Error:', error);
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
      await clearUserProfileCache(targetUser.id);

      sseService.sendToUser(id, 'account_locked', { reason: targetUser.lockReason });
      sseService.sendToAdmins('user_updated', { userId: id, action: 'lock' });

      return res.json({ message: 'Khóa tài khoản thành công.', user: targetUser });
    } catch (error) {
      console.error('[AdminUserController.lockUser] Error:', error);
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
      await clearUserProfileCache(targetUser.id);

      // Automatically resolve appeals for this user
      await BanAppeal.updateMany({ userId: id }, { status: 'resolved' });

      sseService.sendToUser(id, 'account_unlocked', {});
      sseService.sendToAdmins('user_updated', { userId: id, action: 'unlock' });

      return res.json({ message: 'Mở khóa tài khoản thành công.', user: targetUser });
    } catch (error) {
      console.error('[AdminUserController.unlockUser] Error:', error);
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
      console.error('[AdminUserController.deleteUser] Error:', error);
      return res.status(500).json({ error: 'Lỗi xóa tài khoản.' });
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
      console.error('[AdminUserController.restoreUser] Error:', error);
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
        stats = await UserStatsService.updateUserStats(id);
      }

      return res.json({
        user: targetUser,
        stats
      });
    } catch (error) {
      console.error('[AdminUserController.getUserStats] Error:', error);
      return res.status(500).json({ error: 'Lỗi tải chi tiết thống kê thành viên.' });
    }
  }
}

module.exports = AdminUserController;
