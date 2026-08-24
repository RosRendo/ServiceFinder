import React, { useEffect, useRef } from "react";
import {
  View, Text, TouchableOpacity, FlatList,
  ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { usePresenceStore } from "@/store/presenceStore";
import { formatDistanceToNow } from "date-fns";
import { ChatMessage } from "@/components/messages/ChatMessage";
import { ChatInput } from "@/components/messages/ChatInput";
import { Theme } from "@/constants/theme";

const T = Theme.colors;

export default function ChatScreen() {
  const router = useRouter();
  const { id, otherName } = useLocalSearchParams<{ id: string; otherName?: string }>();
  const flatListRef = useRef<FlatList>(null);
  
  const { token } = useAuthStore();
  const { 
    messagesByConversation, isLoading, isConnected, 
    connect, disconnect, fetchMessages, sendMessage, setActiveConversation,
    conversations, fetchConversations
  } = useChatStore();

  const activeMessages = id ? (messagesByConversation[id] || []) : [];
  const activeConversation = conversations.find(c => c.id === id);
  const isArchived = activeConversation?.archivedAt
    ? new Date(activeConversation.archivedAt) <= new Date()
    : false;

  const rawUserId = activeConversation?.otherUser?.rawUserId;
  const presence = usePresenceStore((state) => rawUserId ? state.userStatuses[rawUserId] : null);
  
  const isOnline = presence?.status === 'online' || presence?.status === 'on_job';
  let statusText = isOnline ? 'Online' : 'Connecting...';
  
  if (!isOnline && presence?.lastSeen) {
    try {
      statusText = `Last seen ${formatDistanceToNow(new Date(presence.lastSeen), { addSuffix: true })}`;
    } catch (e) {
      statusText = 'Offline';
    }
  } else if (!isOnline && presence?.status === 'offline') {
    statusText = 'Offline';
  }

  useEffect(() => {
    if (!id || !token) return;
    
    // Fetch conversations list to ensure we have the conversation details/metadata (like archivedAt)
    fetchConversations();
    
    // Set active conversation and fetch initial messages
    setActiveConversation(id);
    fetchMessages(id);
    
    // Connect to WebSocket
    connect(token);
    
    return () => {
      setActiveConversation(null);
    };
  }, [id, token]);

  const handleSend = async (text: string) => {
    if (!id) return;
    await sendMessage(id, text);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <SafeAreaView style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={T.primary} />
        </TouchableOpacity>
        <View style={s.avatarWrap}>
          <Text style={s.avatarText}>
            {otherName ? otherName.charAt(0).toUpperCase() : "?"}
          </Text>
        </View>
        <View style={s.headerInfo}>
          <Text style={s.headerTitle} numberOfLines={1}>{otherName ?? "Conversation"}</Text>
          <View style={s.statusRow}>
            <View style={[s.statusDot, { backgroundColor: isOnline ? T.success : T.grayDot }]} />
            <Text style={s.statusText}>{statusText}</Text>
          </View>
        </View>
      </View>

      {/* Messages */}
      {isLoading && activeMessages.length === 0 ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={T.primary} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          style={s.flex1}
          data={activeMessages}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <ChatMessage message={item} isMe={!!item.isMe} />}
          contentContainerStyle={s.listContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={s.emptyState}>
              <MaterialCommunityIcons name="message-text-outline" size={48} color={T.text3} />
              <Text style={s.emptyText}>Send the first message</Text>
            </View>
          }
        />
      )}

      {/* Input */}
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {isArchived ? (
          <View style={s.archiveBanner}>
            <MaterialCommunityIcons name="lock-outline" size={16} color="#92400E" />
            <Text style={s.archiveText}>
              This job chat is archived because the booking has been completed.
            </Text>
          </View>
        ) : (
          <ChatInput onSend={handleSend} />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  flex1: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    backgroundColor: T.surface,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: T.accentLight,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "900",
    color: T.primary,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontWeight: "800",
    color: T.text1,
    fontSize: 15,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusText: {
    fontSize: 11,
    color: T.text3,
    fontWeight: "600",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 120,
  },
  emptyText: {
    color: T.text3,
    marginTop: 8,
    fontSize: 13,
    fontWeight: "600",
  },
  archiveBanner: {
    backgroundColor: "#FEF3C7",
    borderTopWidth: 1,
    borderTopColor: "#FDE68A",
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  archiveText: {
    color: "#92400E",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    flex: 1,
  },
});
