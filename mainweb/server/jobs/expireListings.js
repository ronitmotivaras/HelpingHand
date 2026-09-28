const cron = require('node-cron');
const FoodDonation = require('../models/FoodDonation');

function startExpireListingsJob() {
  cron.schedule('* * * * *', async () => {
    try {
      const result = await FoodDonation.updateMany(
        { status: 'available', availableUpto: { $lt: new Date() } },
        { $set: { status: 'expired' } }
      );
      if (result.modifiedCount > 0) {
        console.log(`Expired ${result.modifiedCount} food listing(s)`);
      }
    } catch (err) {
      console.error('Expire listings job failed:', err.message);
    }
  });
  console.log('Expire listings cron started (every minute)');
}

module.exports = startExpireListingsJob;
