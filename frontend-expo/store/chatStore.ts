import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import { api, useAuthStore } from "./authStore";
// Import constants if available, else hardcode for local dev
const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000";

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName?: string;
  text: string;
  timestamp: string;
  isMe?: boolean;
  flaggedAsPhone?: boolean;
}

export interface ChatConversation {
  id: string;
  updatedAt?: string;
  type?: string;
  bookingId?: string | null;
  archivedAt?: string | null;
  otherUser: {
    id: string;
    fullName: string;
    avatar: string | null;
  } | null;
  lastMessage: {
    content: string;
    createdAt: string;
    isMe: boolean;
  } | null;
}

interface ChatState {
  socket: Socket | null;
  isConnected: boolean;
  conversations: ChatConversation[];
  messagesByConversation: Record<string, ChatMessage[]>;
  activeConversationId: string | null;
  isLoading: boolean;
  error: string | null;

  connect: (token: string) => void;
  disconnect: () => void;
  fetchConversations: () => Promise<void>;
  fetchMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, content: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  startConversation: (params: { companyId?: string; targetUserId?: string }) => Promise<{ success: boolean; conversationId?: string; error?: string }>;
  setActiveConversation: (id: string | null) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  socket: null,
  isConnected: false,
  conversations: [],
  messagesByConversation: {},
  activeConversationId: null,
  isLoading: false,
  error: null,

  connect: (token: string) => {
    const currentSocket = get().socket;
    if (currentSocket?.connected) return;

    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      auth: { token },
    });

    socket.on("connect", () => {
      set({ isConnected: true, error: null });
      const { activeConversationId } = get();
      if (activeConversationId) {
        socket?.emit("join_conversation", activeConversationId);
      }
    });
    socket.on("disconnect", () => set({ isConnected: false }));
    socket.on("connect_error", (err) => set({ error: err.message }));

    // Handle both event names just in case
    const handleNewMessage = (data: any) => {
      const { messagesByConversation } = get();
      const myUserId = useAuthStore.getState().user?.id;
      
      const newMsg: ChatMessage = {
        id: data.id || Math.random().toString(),
        conversationId: data.conversationId,
        senderId: data.senderId,
        senderName: data.senderName,
        text: data.content || data.text,
        timestamp: data.createdAt || new Date().toISOString(),
        isMe: data.isMe ?? (String(data.senderId) === String(myUserId)),
        flaggedAsPhone: data.flaggedAsPhone ?? false,
      };

      set((state) => {
        const existingMessages = state.messagesByConversation[data.conversationId] || [];
        // Prevent duplicate messages if sendMessage already added it
        const exists = existingMessages.some((m) => m.id === newMsg.id);
        if (exists) return state;
        
        return { 
          messagesByConversation: {
            ...state.messagesByConversation,
            [data.conversationId]: [...existingMessages, newMsg]
          }
        };
      });

      // Also refresh conversations to update last message
      get().fetchConversations();
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("receive_message", handleNewMessage);

    set({ socket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  },

  fetchConversations: async () => {
    try {
      set({ isLoading: true, error: null });
      const res = await api.get("/api/conversations");
      const list = res.data?.data?.data || res.data?.data || res.data?.conversations || res.data || [];
      set({ conversations: Array.isArray(list) ? list : [] });
    } catch (err: any) {
      set({ error: err.message || "Failed to load conversations" });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchMessages: async (conversationId: string) => {
    try {
      set({ isLoading: true, error: null, activeConversationId: conversationId });
      const { socket } = get();
      if (socket) {
        socket.emit("join_conversation", conversationId);
      }
      const res = await api.get(`/api/conversations/${conversationId}/messages?_t=${Date.now()}`);

      // Guard: if the user navigated away while this request was in flight, discard
      if (get().activeConversationId !== conversationId) return;

      const raw = res.data?.data?.data || res.data?.data || res.data?.messages || [];
      const list = Array.isArray(raw) ? raw : [];
      
      const myUserId = useAuthStore.getState().user?.id;

      const mapped = list.map((m: any) => {
        const senderId = m.sender?.id ?? m.senderId;
        const isMe = m.isMe ?? (String(senderId) === String(myUserId));
        
        return {
          id: m.id,
          conversationId: m.conversationId || conversationId,
          senderId,
          senderName: m.sender?.fullName ?? m.senderName ?? "",
          text: m.content ?? m.text ?? "",
          timestamp: m.createdAt ?? m.timestamp ?? "",
          isMe,
          flaggedAsPhone: m.flaggedAsPhone ?? false,
        };
      });

      set((state) => ({ 
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: mapped
        }, 
        isLoading: false 
      }));
    } catch (err: any) {
      if (get().activeConversationId !== conversationId) return;
      set({ error: err.message, isLoading: false });
    } finally {
      set({ isLoading: false });
    }
  },

  sendMessage: async (conversationId: string, content: string) => {
    try {
      const res = await api.post(`/api/conversations/${conversationId}/messages`, { content });
      const newMsg = res.data?.data || res.data;
      
      const mappedMsg: ChatMessage = {
        id: newMsg.id || Math.random().toString(),
        conversationId: newMsg.conversationId || conversationId,
        senderId: newMsg.sender?.id ?? newMsg.senderId,
        text: newMsg.content ?? content,
        timestamp: newMsg.createdAt || new Date().toISOString(),
        isMe: true,
        flaggedAsPhone: newMsg.flaggedAsPhone ?? false
      };

      set((state) => {
        const existingMessages = state.messagesByConversation[conversationId] || [];
        return {
          messagesByConversation: {
            ...state.messagesByConversation,
            [conversationId]: [...existingMessages, mappedMsg]
          }
        };
      });

      return { success: true, data: newMsg };
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      return { success: false, error: Array.isArray(msg) ? msg.join(", ") : msg };
    }
  },

  startConversation: async (params: { companyId?: string; targetUserId?: string }) => {
    try {
      set({ isLoading: true });
      const res = await api.post("/api/conversations", params);
      const data = res.data?.data || res.data;
      
      if (data && data.id) {
        return { success: true, conversationId: data.id.toString() };
      }
      return { success: false, error: "Failed to get conversation ID" };
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      return { success: false, error: Array.isArray(msg) ? msg.join(", ") : msg };
    } finally {
      set({ isLoading: false });
    }
  },

  setActiveConversation: (id) => set({ activeConversationId: id }),
}));
