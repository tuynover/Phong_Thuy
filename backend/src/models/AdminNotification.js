const mongoose = require('mongoose');
const { v7: uuidv7 } = require('uuid');

const adminNotificationSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuidv7
  },
  type: { 
    type: String, 
    enum: ['appeal', 'request_spike', 'token_spike'], 
    required: true 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  metadata: { type: Object, default: null }, // Stores details: e.g. IP, count, user ID
  status: { type: String, enum: ['unread', 'read'], default: 'unread' }
}, { timestamps: true });

adminNotificationSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('AdminNotification', adminNotificationSchema);
