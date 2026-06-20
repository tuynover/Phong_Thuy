const mongoose = require('mongoose');
const { v7: uuidv7 } = require('uuid');

const userSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuidv7
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    default: 'User',
  },
  phone: {
    type: String,
    default: '',
  },
  gender: {
    type: Number,
    default: 1 // 1 for Male, 0 for Female
  },
  role: {
    type: String,
    enum: ['admin', 'co-admin', 'vip', 'user'],
    default: 'user'
  },
  credits: {
    type: Number,
    default: 1
  },
  status: {
    type: String,
    enum: ['active', 'locked'],
    default: 'active'
  },
  lockReason: {
    type: String,
    default: ''
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  baziInfo: {
    day: Number,
    month: Number,
    year: Number,
    hour: Number,
    minute: Number,
  },
  stats: {
    ichingCount: { type: Number, default: 0 },
    baziCount: { type: Number, default: 0 },
    tuviCount: { type: Number, default: 0 },
    ichingTokens: { type: Number, default: 0 },
    baziTokens: { type: Number, default: 0 },
    tuviTokens: { type: Number, default: 0 },
    ichingChatTokens: { type: Number, default: 0 },
    baziChatTokens: { type: Number, default: 0 },
    tuviChatTokens: { type: Number, default: 0 },
    totalInterpretTokens: { type: Number, default: 0 },
    totalChatTokens: { type: Number, default: 0 },
    totalTokens: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: null }
  }
}, {
  timestamps: true,
});

userSchema.index({ "stats.totalTokens": -1 });

module.exports = mongoose.model('User', userSchema);
