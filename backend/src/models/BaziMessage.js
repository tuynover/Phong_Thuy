const mongoose = require('mongoose');
const { v7: uuidv7 } = require('uuid');

const baziMessageSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuidv7
  },
  conversationId: {
    type: String,
    ref: 'BaziConversation',
    required: true,
    index: true
  },
  role: {
    type: String,
    enum: ['user', 'ai'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  structuredContent: {
    answer: { type: String, default: "" },
    timing: { type: String, default: "" },
    risk: { type: String, default: "" },
    confidence: { type: Number, default: 1.0 }
  },
  timestamp: {
    type: Date,
    default: Date.now
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

module.exports = mongoose.model('BaziMessage', baziMessageSchema);
