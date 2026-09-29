const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      required: true,
      enum: [
        'request_received',
        'request_cancelled',
        'request_accepted',
        'request_declined',
        'request_closed',
        'listing_released',
        'listing_expired',
        'pickup_reminder',
        'status_changed',
        'general',
      ],
    },
    title: { type: String, default: '' },
    message: { type: String, required: true },
    link: { type: String, default: '' },
    relatedFoodId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodDonation' },
    relatedRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'Request' },
    isRead: { type: Boolean, default: false, index: true },
    createdAt: { type: Date, default: Date.now, expires: 30 * 24 * 60 * 60 }, // 30 days TTL auto-delete
  }
);

module.exports = mongoose.model('Notification', notificationSchema);
