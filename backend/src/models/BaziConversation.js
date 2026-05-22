const mongoose = require('mongoose');
const { v7: uuidv7 } = require('uuid');

const baziConversationSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuidv7
  },
  recordId: {
    type: String,
    ref: 'BaziRecord',
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
  messageCount: {
    type: Number,
    default: 0
  },
  promptVersion: {
    type: String,
    default: 'v1.0-followup'
  },
  totalPromptTokens: {
    type: Number,
    default: 0
  },
  totalCompletionTokens: {
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

module.exports = mongoose.model('BaziConversation', baziConversationSchema);
