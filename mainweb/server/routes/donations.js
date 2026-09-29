const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const {
  listDonations,
  getMyHistory,
  getDonation,
  createDonation,
  requestPickup,
  cancelPickupRequest,
  acceptRequest,
  declineRequest,
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

// NGO pickup request actions
router.post('/:id/request', requestPickup);
router.post('/:id/cancel-request', cancelPickupRequest);

// Donor actions on requests
router.post('/:id/requests/:requestId/accept', acceptRequest);
router.post('/:id/requests/:requestId/decline', declineRequest);

// Donor status lifecycle actions
router.post('/:id/release', releaseFood);
router.post('/:id/picked-up', markPickedUp);

// Backward compatibility routes
router.post('/:id/book', bookFood);
router.patch('/:id/accept', bookFood);
router.patch('/:id/picked-up', markPickedUp);

module.exports = router;
