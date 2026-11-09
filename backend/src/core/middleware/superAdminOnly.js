/**
 * superAdminOnly middleware
 * Chặn hoàn toàn Co-Admin và các vai trò khác, chỉ duy nhất người dùng có role 'admin'
 * (Super Administrator) mới được phép thực thi các tác vụ hệ thống tối mật.
 */
const superAdminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Quyền truy cập bị từ chối. Chỉ Quản Trị Viên Tối Cao (Super Admin) mới có quyền thực hiện thao tác cấu hình hệ thống.'
    });
  }
  next();
};

module.exports = superAdminOnly;
