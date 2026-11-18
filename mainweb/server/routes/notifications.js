const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const {
  getNotifications,
  getUnreadCount,
  markOneRead,
  markAllRead,
} = require('../controllers/notificationController');

const router = express.Router();

router.use(authMiddleware);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/mark-all-read', markAllRead);
router.patch('/:id/read', markOneRead);

module.exports = router;
