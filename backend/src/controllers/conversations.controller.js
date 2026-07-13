const prisma = require('../config/database');
const { getIo } = require('../config/socket');
const { createNotification } = require('../utils/notifications');

// List conversations for the authenticated user
const getMyConversations = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                role: true,
                avatar: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
      },
    });

    const formatted = conversations.map((conv) => {
      const otherParticipants = conv.participants.filter(
        (p) => p.userId !== userId,
      );
      const other =
        otherParticipants.length > 0 ? otherParticipants[0].user : null;
      const lastMessage = conv.messages[0] || null;

      return {
        id: conv.id.toString(),
        otherUser: other
          ? {
              id: other.id.toString(),
              name: other.fullName,
              role: other.role,
              avatar: other.avatar || null,
            }
          : null,
        lastMessage: lastMessage ? lastMessage.content : null,
        lastMessageTime: lastMessage ? lastMessage.createdAt : null,
      };
    });

    res.json({ conversations: formatted });
  } catch (error) {
    next(error);
  }
};

// List messages in a conversation
const getConversationMessages = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const conversationId = BigInt(id);

    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId,
      },
    });

    if (!participant) {
      return res.status(403).json({ error: 'Access denied to this conversation' });
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    const formatted = messages.map((m) => ({
      id: m.id.toString(),
      senderId: m.senderId.toString(),
      senderName: m.sender.fullName,
      text: m.content,
      timestamp: m.createdAt,
    }));

    res.json({ messages: formatted });
  } catch (error) {
    next(error);
  }
};

// Send a message (creates conversation if needed)
const sendMessage = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { conversationId, recipientId, content } = req.body;

    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'Message content is required' });
    }

    let convoId;

    if (conversationId) {
      convoId = BigInt(conversationId);

      const participant = await prisma.conversationParticipant.findFirst({
        where: {
          conversationId: convoId,
          userId,
        },
      });

      if (!participant) {
        return res
          .status(403)
          .json({ error: 'Access denied to this conversation' });
      }
    } else {
      if (!recipientId) {
        return res
          .status(400)
          .json({ error: 'recipientId is required when no conversationId is provided' });
      }

      const otherUserId = BigInt(recipientId);

      if (otherUserId === userId) {
        return res
          .status(400)
          .json({ error: 'Cannot start a conversation with yourself' });
      }

      const existing = await prisma.conversation.findFirst({
        where: {
          participants: {
            some: { userId },
          },
          AND: {
            participants: {
              some: { userId: otherUserId },
            },
          },
        },
        include: { participants: true },
      });

      if (existing) {
        convoId = existing.id;
      } else {
        const newConversation = await prisma.conversation.create({
          data: {
            participants: {
              create: [
                { userId },
                { userId: otherUserId },
              ],
            },
          },
        });
        convoId = newConversation.id;
      }
    }

    const message = await prisma.message.create({
      data: {
        conversationId: convoId,
        senderId: userId,
        content,
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    await prisma.conversation.update({
      where: { id: convoId },
      data: { updatedAt: new Date() },
    });

      // Broadcast to WebSocket room
    try {
      const io = getIo();
      if (io) {
        io.to(`conversation_${convoId.toString()}`).emit('receive_message', {
          id: message.id.toString(),
          senderId: message.senderId.toString(),
          senderName: message.sender.fullName,
          text: message.content,
          timestamp: message.createdAt,
          conversationId: convoId.toString()
        });
      }
    } catch (wsError) {
      console.error("WebSocket broadcast failed:", wsError);
    }

    // Trigger Notification for the recipient(s)
    try {
      const conversation = await prisma.conversation.findUnique({
        where: { id: convoId },
        include: { participants: true }
      });

      if (conversation) {
        const recipients = conversation.participants.filter(p => p.userId !== userId);
        
        for (const recipient of recipients) {
          await createNotification(
            recipient.userId,
            'New Message',
            `You have a new message from ${message.sender.fullName}: "${message.content.substring(0, 50)}${message.content.length > 50 ? '...' : ''}"`,
            'message',
            req.user.role === 'customer' ? '/customer/messages' : 
            req.user.role === 'staff' ? '/staff/messages' : '/company/messages'
          );
        }
      }
    } catch (notificationError) {
      console.error("Failed to send message notification:", notificationError);
    }

    res.status(201).json({
      message: {
        id: message.id.toString(),
        senderId: message.senderId.toString(),
        senderName: message.sender.fullName,
        text: message.content,
        timestamp: message.createdAt,
      },
      conversationId: convoId.toString(),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyConversations,
  getConversationMessages,
  sendMessage,
};

