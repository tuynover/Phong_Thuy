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
  sectionId: {
    type: String,
    default: null
  },
  sectionTitle: {
    type: String,
    default: null
  },
  structuredContent: {
    answer: { type: String, default: '' },
    timing: { type: mongoose.Schema.Types.Mixed, default: null },
    risk: { type: mongoose.Schema.Types.Mixed, default: null },
    dos: { type: mongoose.Schema.Types.Mixed, default: null },
    donts: { type: mongoose.Schema.Types.Mixed, default: null },
    confidence: { type: Number, default: 0.8 }
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

messageSchema.index({ conversationId: 1, createdAt: 1 });
messageSchema.index({ createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
