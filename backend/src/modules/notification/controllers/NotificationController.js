const Notification = require('../models/Notification');

class NotificationController {
    static async getNotifications(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const notifications = await Notification.find({ userId })
                .sort({ createdAt: -1 })
                .limit(50);

            return res.json(notifications);
        } catch (error) {
            console.error('getNotifications error:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    static async markAsRead(req, res) {
        try {
            const userId = req.user?.id;
            const { id } = req.params;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const notification = await Notification.findOneAndUpdate(
                { _id: id, userId },
                { isRead: true },
                { new: true }
            );

            if (!notification) {
                return res.status(404).json({ error: 'Notification not found' });
            }

            return res.json(notification);
        } catch (error) {
            console.error('markAsRead error:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    static async markAllAsRead(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            await Notification.updateMany(
                { userId, isRead: false },
                { isRead: true }
            );

            return res.json({ success: true });
        } catch (error) {
            console.error('markAllAsRead error:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}

module.exports = NotificationController;
