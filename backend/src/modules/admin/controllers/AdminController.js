const AdminUserController = require('./AdminUserController');
const AdminRecordController = require('./AdminRecordController');
const AdminStatsController = require('./AdminStatsController');
const AdminAppealController = require('./AdminAppealController');

class AdminController {
  static getUsers = AdminUserController.getUsers;
  static updateUserRole = AdminUserController.updateUserRole;
  static updateUserCredits = AdminUserController.updateUserCredits;
  static lockUser = AdminUserController.lockUser;
  static unlockUser = AdminUserController.unlockUser;
  static deleteUser = AdminUserController.deleteUser;
  static restoreUser = AdminUserController.restoreUser;
  static getUserStats = AdminUserController.getUserStats;

  static getCalculations = AdminRecordController.getCalculations;
  static getCalculationDetail = AdminRecordController.getCalculationDetail;
  static lockCalculation = AdminRecordController.lockCalculation;
  static unlockCalculation = AdminRecordController.unlockCalculation;
  static deleteCalculation = AdminRecordController.deleteCalculation;

  static getAnalytics = AdminStatsController.getAnalytics;

  static getNotifications = AdminAppealController.getNotifications;
  static markNotificationRead = AdminAppealController.markNotificationRead;
  static resolveAppeal = AdminAppealController.resolveAppeal;
}

module.exports = AdminController;
