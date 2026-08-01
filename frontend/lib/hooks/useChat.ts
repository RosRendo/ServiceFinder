import { useEffect, useState, useCallback } from "react";
import { useAuthContext } from "@/lib/contexts/AuthContext";
import { useSocket } from "@/lib/hooks/useSocket";

export interface ChatConversation {
  id: string;
  updatedAt?: string;
  type?: string;
  bookingId?: string | null;
  archivedAt?: string | null;
  otherUser: {
    id: string;
    fullName: string;
    role?: string;
    avatar: string | null;
  } | null;
  lastMessage: {
    content: string;
    createdAt: string;
    isMe: boolean;
  } | null;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  read?: boolean;
  flaggedAsPhone?: boolean;
}

interface UseConversationsResult {
  conversations: ChatConversation[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UseMessagesResult {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  sendMessage: (params: {
    content: string;
    conversationId?: string;
    recipientId?: string;
    companyId?: string;
  }) => Promise<{ success: boolean; conversationId?: string; error?: string }>;
  refetch: (conversationId: string) => Promise<void>;
  addMessage: (msg: ChatMessage) => void;
  isTyping: boolean;
  typingUser: string | null;
  setTyping: (typing: boolean) => void;
  markAsRead: (messageId: string) => void;
}

export function useConversations(): UseConversationsResult {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/conversations`,
        {
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to load conversations");
      }
      const data = await res.json();
      // backend returns { data: [...] } via TransformInterceptor
      const list = data.data || data.conversations || data || [];
      setConversations(Array.isArray(list) ? list : []);
    } catch (err: any) {
      setError(err.message || "Failed to load conversations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return { conversations, loading, error, refetch: fetchConversations };
}

export function useMessages(conversationId?: string): UseMessagesResult {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  
  const { socket, isConnected } = useSocket();

  const fetchMessages = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/conversations/${id}/messages`,
        {
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to load messages");
      }
      const data = await res.json();
      // backend returns { data: [messages], pagination: {...} }
      const raw = data.data || data.messages || [];
      const list = Array.isArray(raw) ? raw : [];
      setMessages(
        list.map((m: any) => ({
          id: m.id,
          senderId: m.sender?.id ?? m.senderId,
          senderName: m.sender?.fullName ?? m.senderName ?? "",
          text: m.content ?? m.text ?? "",
          timestamp: m.createdAt ?? m.timestamp ?? "",
          read: m.read ?? false,
          flaggedAsPhone: m.flaggedAsPhone ?? false,
        }))
      );
    } catch (err: any) {
      setError(err.message || "Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (conversationId) {
      fetchMessages(conversationId);
    }
  }, [conversationId, fetchMessages]);

  const sendMessage = useCallback(
    async ({
      content,
      conversationId: convoId,
      recipientId,
      companyId,
      type,
      bookingId,
    }: {
      content: string;
      conversationId?: string;
      recipientId?: string;
      companyId?: string;
      type?: string;
      bookingId?: string;
    }) => {
      try {
        const token = localStorage.getItem("token");
        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        };

        // Step 1: get or create conversation
        let activeConvoId = convoId;
        if (!activeConvoId && (companyId || recipientId || bookingId)) {
          const convoRes = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/conversations`,
            {
              method: "POST",
              credentials: "include",
              headers,
              body: JSON.stringify({ companyId, targetUserId: recipientId, type, bookingId }),
            },
          );
          const convoData = await convoRes.json().catch(() => ({}));
          if (!convoRes.ok) {
            return { success: false, error: convoData.message || "Failed to start conversation" };
          }
          activeConvoId = convoData.data?.id || convoData.id;
        }

        if (!activeConvoId) {
          return { success: false, error: "No conversation ID available" };
        }

        // Step 2: send message to conversation
        const msgRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/conversations/${activeConvoId}/messages`,
          {
            method: "POST",
            credentials: "include",
            headers,
            body: JSON.stringify({ content }),
          },
        );
        const msgData = await msgRes.json().catch(() => ({}));
        if (!msgRes.ok) {
          return { success: false, error: msgData.message || "Failed to send message" };
        }

        const newMsg = msgData.data || msgData.message;
        if (newMsg) {
          const chatMsg: ChatMessage = {
            id: newMsg.id,
            senderId: newMsg.sender?.id,
            senderName: newMsg.sender?.fullName,
            text: newMsg.content,
            timestamp: newMsg.createdAt,
            read: false,
            flaggedAsPhone: newMsg.flaggedAsPhone ?? false,
          };
          setMessages((prev) => [...prev, chatMsg]);
        }

        return { success: true, conversationId: activeConvoId };
      } catch (err: any) {
        return { success: false, error: err.message || "Failed to send message" };
      }
    },
    [],
  );

  const addMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => {
      // Prevent duplicates
      if (prev.some(m => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
  }, []);

  const setTyping = useCallback((typing: boolean) => {
    if (isConnected && socket && conversationId) {
      if (typing) {
        socket.emit("typing:start", { conversationId });
      } else {
        socket.emit("typing:stop", { conversationId });
      }
    }
  }, [isConnected, socket, conversationId]);

  const markAsRead = useCallback((messageId: string) => {
    if (isConnected && socket && conversationId) {
      socket.emit("message:read", { conversationId, messageId });
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, read: true } : m));
    }
  }, [isConnected, socket, conversationId]);

  // WebSockets Live Tracking Integration
  useEffect(() => {
    if (isConnected && socket && conversationId) {
      socket.emit("join_conversation", conversationId);

      const handleReceiveMessage = (data: any) => {
        // Only add if it belongs to this exact conversation
        if (data.conversationId === conversationId) {
          addMessage({
            id: data.id,
            senderId: data.senderId,
            senderName: data.senderName,
            text: data.text,
            timestamp: data.timestamp,
            read: false
          });
        }
      };

      const handleTypingStart = (data: any) => {
        if (data.conversationId === conversationId) {
          setIsTyping(true);
          setTypingUser(data.senderName || "Someone");
        }
      };

      const handleTypingStop = (data: any) => {
        if (data.conversationId === conversationId) {
          setIsTyping(false);
          setTypingUser(null);
        }
      };

      const handleMessageRead = (data: any) => {
        if (data.conversationId === conversationId && data.messageId) {
          setMessages(prev => prev.map(m => m.id === data.messageId ? { ...m, read: true } : m));
        }
      };

      socket.on("receive_message", handleReceiveMessage);
      socket.on("typing:start", handleTypingStart);
      socket.on("typing:stop", handleTypingStop);
      socket.on("message:read", handleMessageRead);

      return () => {
        socket.off("receive_message", handleReceiveMessage);
        socket.off("typing:start", handleTypingStart);
        socket.off("typing:stop", handleTypingStop);
        socket.off("message:read", handleMessageRead);
        // Leave room
        socket.emit("leave_conversation", conversationId); // ensure we don't bleed states
      };
    }
  }, [isConnected, socket, conversationId, addMessage]);

  return {
    messages,
    loading,
    error,
    sendMessage,
    refetch: fetchMessages,
    addMessage,
    isTyping,
    typingUser,
    setTyping,
    markAsRead,
  };
}

