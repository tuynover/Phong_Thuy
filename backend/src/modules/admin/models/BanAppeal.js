const mongoose = require('mongoose');
const { v7: uuidv7 } = require('uuid');

const banAppealSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuidv7
  },
  userId: { type: String, required: true },
  email: { type: String, required: true },
  reason: { type: String, required: true },      // Original lock reason
  message: { type: String, required: true },     // Appeal text input from user
  status: { type: String, enum: ['pending', 'resolved'], default: 'pending' }
}, { timestamps: true });

banAppealSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('BanAppeal', banAppealSchema);
