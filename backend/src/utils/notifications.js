const prisma = require('../config/database');
const { getIo } = require('../config/socket');

/**
 * Creates a notification in the database and pushes it to the user in real-time via Socket.io
 * @param {number} userId - The user ID to notify
 * @param {string} title - The notification title
 * @param {string} body - The notification body/message
 * @param {string} type - Notification type (e.g., 'booking', 'message', 'system', 'payment')
 * @param {string} link - Optional actionable link (e.g., '/customer/bookings/123')
 */
const createNotification = async (userId, title, body, type = 'info', link = null) => {
  try {
    // 1. Save to Database
    const notification = await prisma.notification.create({
      data: {
        userId: BigInt(userId),
        title,
        body,
        type,
        link,
        isRead: false
      }
    });

    // 2. Convert BigInt to strings for JSON payload
    const payload = {
      ...notification,
      id: notification.id.toString(),
      userId: notification.userId.toString()
    };

    // 3. Push real-time over WebSocket
    try {
      const io = getIo();
      io.to(`user_${userId}`).emit('new_notification', payload);
    } catch (socketError) {
      console.warn(`[Socket] Could not push notification to user_${userId} (they might be offline)`);
    }

    return notification;
  } catch (error) {
    console.error('[Notification Error]: Failed to create notification', error);
  }
};

module.exports = {
  createNotification
};
