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
  isEmailVerified: {
    type: Boolean,
    default: false
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
    default: 2
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
  tokenVersion: {
    type: Number,
    default: 0
  },
  baziInfo: {
    day: Number,
    month: Number,
    year: Number,
    hour: Number,
    minute: Number,
    ownBaziRecordId: { type: String, default: null },
    ownZiweiRecordId: { type: String, default: null },
  },
  stats: {
    ichingCount: { type: Number, default: 0 },
    baziCount: { type: Number, default: 0 },
    ziweiCount: { type: Number, default: 0 },
    marriageCount: { type: Number, default: 0 },
    ichingTokens: { type: Number, default: 0 },
    baziTokens: { type: Number, default: 0 },
    ziweiTokens: { type: Number, default: 0 },
    marriageTokens: { type: Number, default: 0 },
    ichingChatTokens: { type: Number, default: 0 },
    baziChatTokens: { type: Number, default: 0 },
    ziweiChatTokens: { type: Number, default: 0 },
    marriageChatTokens: { type: Number, default: 0 },
    totalInterpretTokens: { type: Number, default: 0 },
    totalChatTokens: { type: Number, default: 0 },
    totalTokens: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: null }
  },
  tags: [{
    _id: { type: String, default: uuidv7 },
    name: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true,
});

userSchema.index({ "stats.totalTokens": -1 });
userSchema.index({ isDeleted: 1, status: 1, role: 1, _id: -1 });

module.exports = mongoose.model('User', userSchema);
