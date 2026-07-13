const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*", // allow frontend access 
      methods: ["GET", "POST"]
    }
  });

  // Socket Authentication Middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded; // { id, role }
      next();
    } catch (err) {
      return next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    
    // Automatically join a personal room for notifications
    socket.join(`user_${socket.user.id}`);

    // Join a specific booking room to track live location/status
    socket.on("join_booking", (bookingId) => {
      socket.join(`booking_${bookingId}`);
    });

    // Leave a specific booking room
    socket.on("leave_booking", (bookingId) => {
      socket.leave(`booking_${bookingId}`);
    });

    // Handle Staff sending their live location
    socket.on("staff_location_update", (data) => {
      // data format: { bookingId, latitude, longitude }
      const { bookingId, latitude, longitude } = data;
      
      // Ensure only staff/admin can emit locations
      if (socket.user.role === 'staff' || socket.user.role === 'admin' || socket.user.role === 'company_admin') {
        // Broadcast to everyone else in this booking's room (e.g. the Customer)
        socket.to(`booking_${bookingId}`).emit("staff_location_updated", {
          bookingId,
          latitude,
          longitude,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Optional: Chat Messaging
    socket.on("send_message", (data) => {
      const { conversationId, content } = data;
      socket.to(`conversation_${conversationId}`).emit("receive_message", {
        conversationId,
        content,
        senderId: socket.user.id,
        timestamp: new Date().toISOString()
      });
    });

    socket.on("join_conversation", (conversationId) => {
      socket.join(`conversation_${conversationId}`);
    });

    socket.on("leave_conversation", (conversationId) => {
      socket.leave(`conversation_${conversationId}`);
    });

    socket.on("disconnect", () => {
    });
  });

  return io;
};

const getIo = () => {
  if (!io) {
    throw new Error('Socket.io is not initialized!');
  }
  return io;
};

module.exports = { initializeSocket, getIo };
