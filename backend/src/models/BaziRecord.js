const mongoose = require('mongoose');

const baziRecordSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    default: 'guest',
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
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('BaziRecord', baziRecordSchema);
