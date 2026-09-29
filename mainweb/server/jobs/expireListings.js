const cron = require('node-cron');
const FoodDonation = require('../models/FoodDonation');

function startExpireListingsJob() {
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      // Mark "available" listings as expired after pickupTo passes.
      // Do NOT auto-expire "booked" ones - donor will resolve via "Was it picked up?".
      const result = await FoodDonation.updateMany(
        {
          status: 'available',
          $or: [
            { pickupTo: { $lt: now } },
            { pickupTo: { $exists: false }, availableUpto: { $lt: now } },
          ],
        },
        { $set: { status: 'expired' } }
      );
      if (result.modifiedCount > 0) {
        console.log(`Expired ${result.modifiedCount} available food listing(s)`);
      }
    } catch (err) {
      console.error('Expire listings job failed:', err.message);
    }
  });
  console.log('Expire listings cron started (every minute)');
}

module.exports = startExpireListingsJob;
