const mongoose = require('mongoose');
const { v7: uuidv7 } = require('uuid');

const conversationSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuidv7
  },
  system: {
    type: String,
    required: true,
    enum: ['iching', 'bazi', 'ziwei', 'marriage']
  },
  recordId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  summary: {
    type: String,
    default: ''
  },
  summarizedMemory: {
    type: String,
    default: ''
  },
  totalTokens: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

conversationSchema.index({ userId: 1, totalTokens: 1 });
conversationSchema.index({ createdAt: 1 });

conversationSchema.post('save', function(doc) {
  if (doc.userId && doc.userId !== 'guest') {
    const UserStatsService = require('../services/UserStatsService');
    UserStatsService.updateUserStatsBackground(doc.userId);
  }
});

module.exports = mongoose.model('Conversation', conversationSchema);
