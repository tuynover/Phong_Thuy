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
  gender: {
    type: Number,
    default: 1 // 1 for Male, 0 for Female
  },
  baziInfo: {
    day: Number,
    month: Number,
    year: Number,
    hour: Number,
    minute: Number,
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('User', userSchema);
