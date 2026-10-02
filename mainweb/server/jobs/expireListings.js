const cron = require('node-cron');
const FoodDonation = require('../models/FoodDonation');
const Request = require('../models/Request');
const { sendNotification } = require('../utils/notify');

function startExpireListingsJob() {
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();

      // Find active listings that have passed expiryAt or pickupTo
      const expiredDonations = await FoodDonation.find({
        status: { $in: ['available', 'accepted', 'booked'] },
        $or: [
          { expiryAt: { $lt: now } },
          { pickupTo: { $lt: now } },
          { pickupTo: { $exists: false }, availableUpto: { $lt: now } },
        ],
      });

      for (const donation of expiredDonations) {
        donation.status = 'expired';
        await donation.save();

        // Close pending requests
        await Request.updateMany(
          { foodId: donation._id, status: 'pending' },
          { status: 'closed' }
        );

        // Notify donor
        await sendNotification({
          userId: donation.donorId,
          type: 'listing_expired',
          title: 'Listing Expired',
          message: `Your listing for "${donation.foodName || 'Food'}" expired with no pickup.`,
          link: '/my-donations',
          relatedFoodId: donation._id,
        });

        // Notify NGOs who had requested
        const pendingNgos = (donation.requests || []).filter((r) => r.status === 'pending');
        for (const r of pendingNgos) {
          await sendNotification({
            userId: r.ngoId,
            type: 'listing_expired',
            title: 'Food Listing Expired',
            message: `The food listing for "${donation.foodName || 'Food'}" has expired.`,
            link: '/feed',
            relatedFoodId: donation._id,
          });
        }
      }

      if (expiredDonations.length > 0) {
        console.log(`Expired ${expiredDonations.length} available food listing(s)`);
      }
    } catch (err) {
      console.error('Expire listings job failed:', err.message);
    }
  });
  console.log('Expire listings cron started (every minute)');
}

module.exports = startExpireListingsJob;
