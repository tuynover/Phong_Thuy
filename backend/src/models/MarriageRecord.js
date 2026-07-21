const mongoose = require('mongoose');
const { v7: uuidv7 } = require('uuid');

const marriageRecordSchema = new mongoose.Schema({
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
    male: {
      date: String, // e.g. "27/08/2004"
      time: String  // e.g. "07:30"
    },
    female: {
      date: String, // e.g. "02/01/2001"
      time: String  // e.g. "03:02"
    }
  },
  maleBaziData: {
    type: Object,
    required: true
  },
  femaleBaziData: {
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
  status: {
    type: String,
    enum: ['active', 'locked'],
    default: 'active'
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
});

marriageRecordSchema.index({ userId: 1, isDeleted: 1, createdAt: -1 }); // Compound index cho query lịch sử: { userId, isDeleted: { $ne: true } } sort createdAt: -1
marriageRecordSchema.index({ userId: 1, createdAt: -1 });
marriageRecordSchema.index({ createdAt: 1 });
marriageRecordSchema.index({ isDeleted: 1, status: 1, userId: 1, _id: -1 });

module.exports = mongoose.model('MarriageRecord', marriageRecordSchema);
