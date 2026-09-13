const User = require('../../../core/models/User');
const BanAppeal = require('../models/BanAppeal');
const AdminNotification = require('../models/AdminNotification');
const sseService = require('../../../core/services/SseService');
const { runInTransaction } = require('../../../core/utils/transactionHelper');

class AdminAppealController {
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
      console.error('[AdminAppealController.getNotifications] Error:', error);
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
      console.error('[AdminAppealController.markNotificationRead] Error:', error);
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
      console.error('[AdminAppealController.resolveAppeal] Error:', error);
      return res.status(500).json({ error: 'Lỗi xử lý khiếu nại.' });
    }
  }
}

module.exports = AdminAppealController;
