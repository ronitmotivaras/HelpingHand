const mongoose = require('mongoose');

const blockedPhoneSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true, trim: true },
  reason: { type: String, default: 'Confirmed fraud' },
  blockedBy: { type: String, default: 'admin' },
  blockedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('BlockedPhone', blockedPhoneSchema);
