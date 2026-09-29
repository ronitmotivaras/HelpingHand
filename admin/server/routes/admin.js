const express = require('express');
const adminMiddleware = require('../middleware/adminMiddleware');
const {
  adminLogin,
  changePassword,
  getStats,
  listNgoRequests,
  approveNgo,
  rejectNgo,
  setNgoPending,
  addAdminNote,
  listUsers,
  updateUser,
  deleteUser,
} = require('../controllers/adminController');

const router = express.Router();

router.post('/login', adminLogin);

router.patch('/change-password', adminMiddleware, changePassword);
router.get('/stats', adminMiddleware, getStats);

// NGO management
router.get('/ngo-requests', adminMiddleware, listNgoRequests);
router.get('/ngos', adminMiddleware, listNgoRequests);
router.patch('/ngo-requests/:id/approve', adminMiddleware, approveNgo);
router.patch('/ngo-requests/:id/reject', adminMiddleware, rejectNgo);
router.patch('/ngo-requests/:id/pending', adminMiddleware, setNgoPending);
router.post('/ngos/:id/note', adminMiddleware, addAdminNote);
router.delete('/ngos/:id', adminMiddleware, deleteUser);

// User management
router.get('/users', adminMiddleware, listUsers);
router.patch('/users/:id', adminMiddleware, updateUser);
router.delete('/users/:id', adminMiddleware, deleteUser);

module.exports = router;
