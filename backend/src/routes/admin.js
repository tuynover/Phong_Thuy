const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/AdminController');
const adminAuth = require('../middleware/adminAuth');

// Apply adminAuth middleware globally to restrict routes to Admin / Co-Admin
router.use(adminAuth);

// 1. User Management Routes
router.get('/users', AdminController.getUsers);
router.put('/users/:id/role', AdminController.updateUserRole);
router.put('/users/:id/credits', AdminController.updateUserCredits);
router.post('/users/:id/lock', AdminController.lockUser);
router.post('/users/:id/unlock', AdminController.unlockUser);
router.delete('/users/:id', AdminController.deleteUser);
router.post('/users/:id/restore', AdminController.restoreUser);
router.get('/users/:id/stats', AdminController.getUserStats);

// 2. Calculation Audits Routes
router.get('/calculations', AdminController.getCalculations);
router.post('/calculations/:type/:id/lock', AdminController.lockCalculation);
router.post('/calculations/:type/:id/unlock', AdminController.unlockCalculation);
router.delete('/calculations/:type/:id', AdminController.deleteCalculation);

// 3. System Analytics Routes
router.get('/analytics', AdminController.getAnalytics);

const sseService = require('../services/SseService');

// 4. Alerts and Appeal Routes
router.get('/notifications', AdminController.getNotifications);
router.put('/notifications/:id/read', AdminController.markNotificationRead);
router.post('/appeals/:id/resolve', AdminController.resolveAppeal);

router.get('/events', (req, res) => {
  sseService.addAdminClient(req, res);
});

module.exports = router;
