const mongoose = require('mongoose');
const { v7: uuidv7 } = require('uuid');

const astrologyJobSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuidv7
  },
  system: {
    type: String,
    enum: ['tu_vi', 'bat_tu', 'kinh_dich'],
    required: true
  },
  status: {
    type: String,
    enum: ['queued', 'processing', 'completed', 'failed'],
    default: 'queued',
    index: true
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  params: {
    type: Object,
    required: true
  },
  result: {
    type: Object,
    default: null
  },
  error: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AstrologyJob', astrologyJobSchema);
