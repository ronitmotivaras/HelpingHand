const Notification = require('../models/Notification');

async function sendNotification({
  userId,
  type,
  title = '',
  message,
  link = '',
  relatedFoodId = null,
  relatedRequestId = null,
}) {
  try {
    if (!userId || !message) return null;
    return await Notification.create({
      userId,
      type,
      title,
      message,
      link,
      relatedFoodId,
      relatedRequestId,
      isRead: false,
      createdAt: new Date(),
    });
  } catch (err) {
    console.error('Failed to create notification:', err.message);
    return null;
  }
}

module.exports = { sendNotification };
