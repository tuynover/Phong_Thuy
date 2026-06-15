const mongoose = require('mongoose');
const { v7: uuidv7 } = require('uuid');

const tuViRecordSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuidv7
  },
  userId: {
    type: String,
    required: true,
    default: 'guest',
  },
  system: {
    type: String,
    default: 'tu_vi',
    required: true
  },
  idempotencyKey: {
    type: String,
    index: true,
    default: null
  },
  inputInfo: {
    date: String,        // YYYY-MM-DD
    hour: Number,        // Hour index (0..11)
    gender: String,      // "Nam" | "Nữ"
    timezone: { type: Number, default: 7 },
    school: { type: String, default: 'bac_phai' },
    calendarType: { type: String, default: 'solar' }
  },
  chartHash: {
    type: String,
    required: true,
    index: true
  },
  chartData: {
    type: Object,
    required: true
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
    summary: { type: String, default: "" },
    sections: { type: Array, default: [] },
    generatedAt: { type: Date, default: null },
    model: { type: String, default: "" },
    promptVersion: { type: String, default: "" },
    knowledgeVersion: { type: String, default: "" },
    promptTokens: { type: Number, default: 0 },
    completionTokens: { type: Number, default: 0 },
    tokensUsed: { type: Number, default: 0 },
    cost: { type: Number, default: 0 }
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
  timestamps: true
});

tuViRecordSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('TuViRecord', tuViRecordSchema);
