const prisma = require('../config/database');

exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;

    const notifications = await prisma.notification.findMany({
      where: { userId: BigInt(userId) },
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit to recent 50
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: BigInt(userId), isRead: false }
    });

    // Convert BigInts for JSON
    const serialized = notifications.map(n => ({
      ...n,
      id: n.id.toString(),
      userId: n.userId.toString()
    }));

    res.json({
      success: true,
      notifications: serialized,
      unreadCount
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to find notifications' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    if (id === 'all') {
      // Mark all as read
      await prisma.notification.updateMany({
        where: { userId: BigInt(userId), isRead: false },
        data: { isRead: true }
      });
    } else {
      // Check ownership
      const notification = await prisma.notification.findUnique({
        where: { id: BigInt(id) }
      });

      if (!notification || notification.userId !== BigInt(userId)) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      await prisma.notification.update({
        where: { id: BigInt(id) },
        data: { isRead: true }
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking as read:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
};
