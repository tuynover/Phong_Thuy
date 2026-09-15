const mongoose = require('mongoose');
const { v7: uuidv7 } = require('uuid');

const notificationSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuidv7
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  hexagramId: {
    type: String,
    ref: 'IChingRecord',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    default: 'ung_ky'
  }
}, {
  timestamps: true
});

notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 }); // 90-day TTL retention

module.exports = mongoose.model('Notification', notificationSchema);
