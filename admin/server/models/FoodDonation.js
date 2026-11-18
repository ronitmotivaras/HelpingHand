const mongoose = require('mongoose');

const foodItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    quantity: { type: String, required: true, trim: true },
    unit: {
      type: String,
      enum: ['portions', 'kg', 'packets', 'pieces', 'litres'],
      default: 'portions',
    },
  },
  { _id: false }
);

const donationRequestSchema = new mongoose.Schema({
  ngoId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ngoName: { type: String, required: true, trim: true },
  coordinatorName: { type: String, default: '', trim: true },
  phone: { type: String, required: true, trim: true },
  isVerified: { type: Boolean, default: true },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'closed', 'cancelled'],
    default: 'pending',
  },
  createdAt: { type: Date, default: Date.now },
});

const foodDonationSchema = new mongoose.Schema({
  donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  donorName: { type: String, required: true, trim: true },
  donorPhone: { type: String, required: true, trim: true },

  items: { type: [foodItemSchema], default: [] },
  foodName: { type: String, trim: true, default: '' },
  quantity: { type: String, trim: true, default: '' },
  foodType: { type: String, enum: ['veg', 'nonveg', 'mixed'], required: true },

  pickupFrom: { type: Date },
  pickupTo: { type: Date },
  expiryAt: { type: Date },
  availableUpto: { type: Date },

  address: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },

  status: {
    type: String,
    enum: ['available', 'accepted', 'pickedUp', 'expired', 'booked', 'picked_up'],
    default: 'available',
  },

  requests: { type: [donationRequestSchema], default: [] },

  acceptedNgo: {
    ngoId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    ngoName: { type: String, default: '' },
    coordinatorName: { type: String, default: '' },
    phone: { type: String, default: '' },
    acceptedAt: { type: Date },
  },

  bookedByNgoName: { type: String, default: '' },
  bookedAt: { type: Date },
  pickedUpAt: { type: Date },

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('FoodDonation', foodDonationSchema);
