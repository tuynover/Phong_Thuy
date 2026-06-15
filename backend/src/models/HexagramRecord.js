const mongoose = require('mongoose');
const { v7: uuidv7 } = require('uuid');

const hexagramRecordSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuidv7
  },
  userId: {
    type: String, // Can be a MongoDB ObjectId string or 'guest'
    required: true,
    default: 'guest',
  },
  question: {
    type: String,
    required: true,
    default: 'xem sức khỏe và công việc sắp tới có thuận lợi hay không',
  },
  dateCast: {
    type: Date,
    default: Date.now,
  },
  // We store the full JSON response from DivinationController
  // This ensures all derived data (elements, families, lunar info) is captured
  primaryHexagram: {
    type: Object,
    required: true,
  },
  transformedHexagram: {
    type: Object,
    default: null,
  },

  movingLines: [{
    type: Number,
  }],
  lunarDateInfo: {
    type: Object, // { day, month, year, ... } from lunar-javascript
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  feedback: {
    type: String,
    default: ''
  },
  aiInterpretation: {
    content: { type: String, default: "" },
    generatedAt: { type: Date, default: null },
    model: { type: String, default: "" },
    promptVersion: { type: String, default: "" },
    promptTokens: { type: Number, default: 0 },
    completionTokens: { type: Number, default: 0 },
    tokensUsed: { type: Number, default: 0 }
  },
  ungKy: [{
    lunarDay: { type: Number, default: null },
    lunarMonth: { type: Number, required: true },
    lunarYear: { type: Number, required: true },
    isMonthOnly: { type: Boolean, default: false },
    originalText: { type: String, default: "" },
    status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
    solarDate: { type: Date, required: true },
    notified3Days: { type: Boolean, default: false },
    notified2Days: { type: Boolean, default: false },
    notified1Day: { type: Boolean, default: false }
  }],
  isGeneratingInterpretation: {
    type: Boolean,
    default: false
  },
  analysisSnapshot: {
    type: Object,
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'locked'],
    default: 'active'
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
});

hexagramRecordSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('HexagramRecord', hexagramRecordSchema);
