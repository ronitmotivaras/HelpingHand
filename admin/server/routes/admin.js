const express = require('express');
const adminMiddleware = require('../middleware/adminMiddleware');
const {
  adminLogin,
  getStats,
  listNgoRequests,
  approveNgo,
  rejectNgo,
  listUsers,
  updateUser,
  deleteUser,
} = require('../controllers/adminController');

const router = express.Router();

router.post('/login', adminLogin);

router.get('/stats', adminMiddleware, getStats);
router.get('/ngo-requests', adminMiddleware, listNgoRequests);

router.patch('/ngo-requests/:id/approve', adminMiddleware, approveNgo);
router.patch('/ngo-requests/:id/reject', adminMiddleware, rejectNgo);
router.get('/users', adminMiddleware, listUsers);
router.patch('/users/:id', adminMiddleware, updateUser);
router.delete('/users/:id', adminMiddleware, deleteUser);

module.exports = router;
