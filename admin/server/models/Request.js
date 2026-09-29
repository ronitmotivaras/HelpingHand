const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema(
  {
    foodId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodDonation', required: true, index: true },
    ngoId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    ngoName: { type: String, required: true, trim: true },
    coordinatorName: { type: String, default: '', trim: true },
    phone: { type: String, required: true, trim: true },
    isVerified: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'cancelled', 'closed'],
      default: 'pending',
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Request', requestSchema);
