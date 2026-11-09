const express = require('express');
const router = express.Router();
const AdminUserController = require('../controllers/AdminUserController');
const AdminRecordController = require('../controllers/AdminRecordController');
const AdminStatsController = require('../controllers/AdminStatsController');
const AdminAppealController = require('../controllers/AdminAppealController');
const AdminConfigController = require('../controllers/AdminConfigController');
const adminAuth = require('../../../core/middleware/adminAuth');
const superAdminOnly = require('../../../core/middleware/superAdminOnly');
const sseService = require('../../../core/services/SseService');

// Apply adminAuth middleware globally to restrict routes to Admin / Co-Admin
router.use(adminAuth);

// 1. User Management Routes
router.get('/users', AdminUserController.getUsers);
router.put('/users/:id/role', AdminUserController.updateUserRole);
router.put('/users/:id/credits', AdminUserController.updateUserCredits);
router.post('/users/:id/lock', AdminUserController.lockUser);
router.post('/users/:id/unlock', AdminUserController.unlockUser);
router.delete('/users/:id', AdminUserController.deleteUser);
router.post('/users/:id/restore', AdminUserController.restoreUser);
router.get('/users/:id/stats', AdminUserController.getUserStats);

// 2. Calculation Audits Routes
router.get('/calculations', AdminRecordController.getCalculations);
router.get('/calculations/:type/:id', AdminRecordController.getCalculationDetail);
router.post('/calculations/:type/:id/lock', AdminRecordController.lockCalculation);
router.post('/calculations/:type/:id/unlock', AdminRecordController.unlockCalculation);
router.delete('/calculations/:type/:id', AdminRecordController.deleteCalculation);

// 3. System Analytics Routes
router.get('/analytics', AdminStatsController.getAnalytics);

// 4. Alerts and Appeal Routes
router.get('/notifications', AdminAppealController.getNotifications);
router.put('/notifications/read-all', AdminAppealController.markAllNotificationsRead);
router.put('/notifications/:id/read', AdminAppealController.markNotificationRead);
router.post('/appeals/:id/resolve', AdminAppealController.resolveAppeal);

// 5. System Queue & DLQ Management Routes
router.get('/system/queue', AdminRecordController.getQueueStatus);
router.post('/system/queue/dlq/retry', superAdminOnly, AdminRecordController.retryDlqJob);
router.delete('/system/queue/dlq', superAdminOnly, AdminRecordController.clearDlq);

// 6. System Configuration & Hot-Reload Routes (Strict Super Admin Only)
router.get('/config', superAdminOnly, AdminConfigController.getConfigs);
router.put('/config', superAdminOnly, AdminConfigController.updateConfigs);
router.post('/config/test-ai', superAdminOnly, AdminConfigController.testAiConnection);
router.post('/config/test-smtp', superAdminOnly, AdminConfigController.testSmtpConnection);

router.get('/events', (req, res) => {
  sseService.addAdminClient(req, res);
});

module.exports = router;
