const Notification = require('../models/Notification');

async function getNotifications(req, res) {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    return res.json(notifications);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load notifications' });
  }
}

async function getUnreadCount(req, res) {
  try {
    const unreadCount = await Notification.countDocuments({
      userId: req.user._id,
      isRead: false,
    });
    return res.json({ unreadCount });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to get unread count' });
  }
}

async function markOneRead(req, res) {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isRead: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    return res.json(notification);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to mark notification as read' });
  }
}

async function markAllRead(req, res) {
  try {
    await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { isRead: true }
    );
    return res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to mark all notifications as read' });
  }
}

module.exports = {
  getNotifications,
  getUnreadCount,
  markOneRead,
  markAllRead,
};
