const mongoose = require('mongoose');

const hexagramRecordSchema = new mongoose.Schema({
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
    type: String,
    default: ''
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('HexagramRecord', hexagramRecordSchema);
