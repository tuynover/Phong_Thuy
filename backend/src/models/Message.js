const mongoose = require('mongoose');
const { v7: uuidv7 } = require('uuid');

const messageSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuidv7
  },
  conversationId: {
    type: String,
    required: true,
    ref: 'Conversation',
    index: true
  },
  role: {
    type: String,
    required: true,
    enum: ['user', 'ai']
  },
  content: {
    type: String,
    required: true
  },
  structuredContent: {
    answer: String,
    timing: String,
    risk: String,
    dos: String,
    donts: String,
    confidence: Number
  },
  promptTokens: {
    type: Number,
    default: 0
  },
  completionTokens: {
    type: Number,
    default: 0
  },
  totalTokens: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

messageSchema.index({ createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
