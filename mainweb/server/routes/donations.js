const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const {
  listDonations,
  getMyHistory,
  getDonation,
  createDonation,
  bookFood,
  releaseFood,
  markPickedUp,
} = require('../controllers/donationController');

const router = express.Router();

router.use(authMiddleware);

router.get('/', listDonations);
router.get('/mine', getMyHistory);
router.get('/my-history', getMyHistory);
router.post('/', createDonation);
router.get('/:id', getDonation);

// Donor actions
router.post('/:id/book', bookFood);
router.post('/:id/release', releaseFood);
router.post('/:id/picked-up', markPickedUp);

// Backward compatibility routes
router.patch('/:id/accept', bookFood);
router.patch('/:id/picked-up', markPickedUp);

module.exports = router;
