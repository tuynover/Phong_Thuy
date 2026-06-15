const mongoose = require('mongoose');
const { v7: uuidv7 } = require('uuid');

const baziRecordSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuidv7
  },
  userId: {
    type: String,
    required: true,
    default: 'guest',
  },
  idempotencyKey: {
    type: String,
    index: true,
    default: null
  },
  inputInfo: {
    date: String, // e.g. "05/09/2004"
    time: String, // e.g. "14:30"
    gender: Number // 1 for Male, 0 for Female
  },
  solarTimeline: {
    type: String,
    required: true,
  },
  tietKhiTimeline: {
    type: String,
    required: true,
  },
  baziData: {
    type: Object,
    required: true,
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

baziRecordSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('BaziRecord', baziRecordSchema);
