const mongoose = require('mongoose');

const ngoDetailsSchema = new mongoose.Schema(
  {
    ngoName: { type: String, default: '' },
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    contactNum: { type: String, default: '' },
    coordinatorPhone: { type: String, default: '' },
    coordinatorName: { type: String, default: '' },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  mobile: { type: String, sparse: true, trim: true, default: '' },
  passwordHash: { type: String, required: true },
  city: { type: String, required: true, trim: true },
  ngoStatus: {
    type: String,
    enum: ['none', 'pending', 'approved', 'rejected'],
    default: 'none',
  },
  ngoDetails: { type: ngoDetailsSchema, default: () => ({}) },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);
