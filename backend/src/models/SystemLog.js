const mongoose = require('mongoose');

const systemLogSchema = new mongoose.Schema({
  userId: { type: String, default: 'anonymous' },
  email: { type: String, default: '' },
  name: { type: String, default: '' },
  ip: { type: String, required: true },
  action: { type: String, required: true }, // Descriptive action in Vietnamese
  method: { type: String, required: true },
  path: { type: String, required: true },
  statusCode: { type: Number, required: true },
  duration: { type: Number, required: true }, // millisecond duration
  tokensUsed: { type: Number, default: 0 },
  requestParams: { type: Object, default: null }, // sanitized body/query parameters
  timestamp: { type: Date, default: Date.now }
});

systemLogSchema.index({ timestamp: -1 });
systemLogSchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model('SystemLog', systemLogSchema);
