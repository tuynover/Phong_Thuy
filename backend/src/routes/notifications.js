const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const NotificationController = require('../controllers/NotificationController');

router.get('/', auth, NotificationController.getNotifications);
router.put('/read-all', auth, NotificationController.markAllAsRead);
router.put('/:id/read', auth, NotificationController.markAsRead);

module.exports = router;
