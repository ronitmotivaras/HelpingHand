const mongoose = require('mongoose');

const foodDonationSchema = new mongoose.Schema({
  donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  donorName: { type: String, required: true, trim: true },
  donorPhone: { type: String, required: true, trim: true },
  foodName: { type: String, required: true, trim: true },
  quantity: { type: String, required: true, trim: true },
  foodType: { type: String, enum: ['veg', 'nonveg'], required: true },
  availableUpto: { type: Date, required: true },
  address: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  status: {
    type: String,
    enum: ['available', 'booked', 'pickedUp', 'expired', 'accepted', 'picked_up'],
    default: 'available',
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('FoodDonation', foodDonationSchema);
