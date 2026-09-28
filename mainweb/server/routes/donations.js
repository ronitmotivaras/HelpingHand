const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const {
  listDonations,
  getMyHistory,
  getDonation,
  createDonation,
  markAccepted,
  markPickedUp,
} = require('../controllers/donationController');

const router = express.Router();

router.use(authMiddleware);

router.get('/', listDonations);
router.get('/my-history', getMyHistory);
router.post('/', createDonation);
router.get('/:id', getDonation);
router.patch('/:id/accept', markAccepted);
router.patch('/:id/picked-up', markPickedUp);

module.exports = router;
