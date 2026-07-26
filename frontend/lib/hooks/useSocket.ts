import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Only connect if we have a token (user is authenticated)
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    if (!token) {
      return;
    }

    // Get the base API URL and strip any /api suffix to get the root domain where Socket.io lives
    const rawUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const baseUrl = rawUrl.replace(/\/api\/?$/, '');

    const socketInstance = io(baseUrl, {
      auth: {
        token: token
      },
      reconnection: true,
      autoConnect: true // Enabled for location tracking
    });

    socketInstance.on('connect', () => {
      if (process.env.NODE_ENV === 'development') {
        console.debug('🔗 WebSocket Connected:', socketInstance.id);
      }
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      if (process.env.NODE_ENV === 'development') {
        console.debug('🔴 WebSocket Disconnected');
      }
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('WebSocket Connection Error:', error);
      setIsConnected(false);
    });

    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return { socket, isConnected };
};
