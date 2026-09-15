const express = require('express');
const router = express.Router();
const AdminUserController = require('../controllers/AdminUserController');
const AdminRecordController = require('../controllers/AdminRecordController');
const AdminStatsController = require('../controllers/AdminStatsController');
const AdminAppealController = require('../controllers/AdminAppealController');
const adminAuth = require('../../../core/middleware/adminAuth');
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
router.put('/notifications/:id/read', AdminAppealController.markNotificationRead);
router.post('/appeals/:id/resolve', AdminAppealController.resolveAppeal);

// 5. System Queue & DLQ Management Routes
router.get('/system/queue', AdminRecordController.getQueueStatus);
router.post('/system/queue/dlq/retry', AdminRecordController.retryDlqJob);
router.delete('/system/queue/dlq', AdminRecordController.clearDlq);

router.get('/events', (req, res) => {
  sseService.addAdminClient(req, res);
});

module.exports = router;
