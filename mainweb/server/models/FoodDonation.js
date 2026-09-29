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

const foodDonationSchema = new mongoose.Schema({
  donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  donorName: { type: String, required: true, trim: true },
  donorPhone: { type: String, required: true, trim: true },

  // Multiple items
  items: { type: [foodItemSchema], default: [] },

  // Backward compatibility fields
  foodName: { type: String, trim: true, default: '' },
  quantity: { type: String, trim: true, default: '' },

  foodType: { type: String, enum: ['veg', 'nonveg'], required: true },

  // Timing fields
  pickupFrom: { type: Date },
  pickupTo: { type: Date },
  expiryAt: { type: Date },
  availableUpto: { type: Date }, // Kept for backwards compatibility

  address: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },

  status: {
    type: String,
    enum: ['available', 'booked', 'pickedUp', 'expired', 'accepted', 'picked_up'],
    default: 'available',
  },

  bookedByNgoName: { type: String, default: '' },
  bookedAt: { type: Date },
  pickedUpAt: { type: Date },

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('FoodDonation', foodDonationSchema);
