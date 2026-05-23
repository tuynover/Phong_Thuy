const mongoose = require('mongoose');
const { v7: uuidv7 } = require('uuid');

const tuViConversationSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuidv7
  },
  recordId: {
    type: String,
    ref: 'TuViRecord',
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
  messageCount: {
    type: Number,
    default: 0
  },
  promptVersion: {
    type: String,
    default: 'tv_prompt_followup_v1'
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
  },
  totalCost: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('TuViConversation', tuViConversationSchema);
