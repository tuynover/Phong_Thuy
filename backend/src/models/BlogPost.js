const mongoose = require('mongoose');
const { v7: uuidv7 } = require('uuid');

const blogPostSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuidv7
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  summary: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['iching', 'bazi', 'ziwei', 'marriage', 'fengshui', 'general'],
    default: 'general'
  },
  tags: [{
    type: String
  }],
  thumbnailUrl: {
    type: String,
    default: ''
  },
  author: {
    type: String,
    default: 'Chuyên gia Phong Thủy'
  },
  views: {
    type: Number,
    default: 0
  },
  isPublished: {
    type: Boolean,
    default: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for performance and sorting
blogPostSchema.index({ slug: 1 });
blogPostSchema.index({ isDeleted: 1, isPublished: 1, createdAt: -1 });

module.exports = mongoose.model('BlogPost', blogPostSchema);
