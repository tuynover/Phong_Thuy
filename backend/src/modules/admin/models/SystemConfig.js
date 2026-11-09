const mongoose = require('mongoose');
const { v7: uuidv7 } = require('uuid');

const SystemConfigSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuidv7
  },
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  value: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    enum: ['ai', 'security', 'database', 'email', 'system'],
    default: 'system',
    index: true
  },
  label: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  isSecret: {
    type: Boolean,
    default: false
  },
  requiresRestart: {
    type: Boolean,
    default: false
  },
  updatedBy: {
    type: String,
    default: 'system'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SystemConfig', SystemConfigSchema);
