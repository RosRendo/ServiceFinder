import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";

import { useAuthStore } from "@/store/authStore";
import { useChatStore, ChatMessage as ChatMessageType } from "@/store/chatStore";
import { usePresenceStore } from "@/store/presenceStore";
import { formatDistanceToNow } from "date-fns";
import { ChatInput } from "@/components/messages/ChatInput";
import { useTranslation } from "react-i18next";
import { Theme } from "@/constants/theme";

const T = Theme.colors;

export default function ChatScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { id, otherName } = useLocalSearchParams<{ id: string; otherName?: string }>();
  const flatListRef = useRef<FlatList>(null);

  const { token } = useAuthStore();
  const {
    messagesByConversation,
    isLoading,
    isConnected,
    connect,
    fetchMessages,
    sendMessage,
    setActiveConversation,
    conversations,
    fetchConversations,
  } = useChatStore();

  const activeMessages = id ? (messagesByConversation[id] || []) : [];
  const activeConversation = conversations.find(c => c.id === id);
  const isArchived = activeConversation?.archivedAt
    ? new Date(activeConversation.archivedAt) <= new Date()
    : false;
  
  const rawUserId = activeConversation?.otherUser?.rawUserId;
  const presence = usePresenceStore((state) => rawUserId ? state.userStatuses[rawUserId] : null);
  
  const isOnline = presence?.status === 'online' || presence?.status === 'on_job';
  let statusText = isOnline ? t('messages.activeNow') : t('messages.connecting');
  
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
    fetchConversations();
    setActiveConversation(id);
    fetchMessages(id);
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

  const renderMessage = ({ item, index }: { item: ChatMessageType; index: number }) => {
    const isMe = !!item.isMe;
    const timeString = new Date(item.timestamp).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });

    // Check if previous message is from the same sender to group bubbles
    const prevMsg = index > 0 ? activeMessages[index - 1] : null;
    const isConsecutive = prevMsg && !!prevMsg.isMe === isMe;

    return (
      <View style={[s.msgRow, isMe ? s.msgRowMe : s.msgRowThem, isConsecutive ? s.msgRowConsecutive : null]}>
        {!isMe && (
          <View style={s.avatarContainer}>
            {!isConsecutive ? (
              <View style={s.avatarSmall}>
                <Text style={s.avatarSmallText}>
                  {otherName ? otherName.charAt(0).toUpperCase() : "?"}
                </Text>
              </View>
            ) : (
              <View style={s.avatarPlaceholder} />
            )}
          </View>
        )}

        <View style={[s.bubble, isMe ? s.bubbleMe : s.bubbleThem]}>
          <Text style={isMe ? s.bubbleMeText : s.bubbleThemText}>{item.text}</Text>
          {item.flaggedAsPhone && (
            <View style={s.warningContainer}>
              <Text style={s.warningText}>
                ⚠️ Sharing contact info may violate platform terms. Keep payments & chats secure on the platform.
              </Text>
            </View>
          )}
          <Text style={[s.timeText, isMe ? s.timeTextMe : s.timeTextThem]}>{timeString}</Text>
        </View>
      </View>
    );
  };

  const initials = otherName ? otherName.charAt(0).toUpperCase() : "?";

  return (
    <SafeAreaView style={s.root} edges={["top", "left", "right"]}>
      {/* Premium Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
          <MaterialCommunityIcons name="chevron-left" size={32} color={T.accent} />
        </TouchableOpacity>

        <View style={s.headerProfile}>
          <View style={s.headerAvatar}>
            <Text style={s.headerAvatarText}>{initials}</Text>
            {isOnline && <View style={s.onlineIndicator} />}
          </View>
          <View style={s.headerTextWrap}>
            <Text style={s.headerName} numberOfLines={1}>
              {otherName ?? t('messages.conversationFallback')}
            </Text>
            <Text style={s.headerStatus}>{statusText}</Text>
          </View>
        </View>

        <TouchableOpacity style={s.headerActionBtn}>
          <MaterialCommunityIcons name="dots-vertical" size={24} color={T.text2} />
        </TouchableOpacity>
      </View>

      {/* Chat Messages */}
      <View style={s.chatContainer}>
        {isLoading && activeMessages.length === 0 ? (
          <View style={s.centerBox}>
            <ActivityIndicator size="large" color={T.accent} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={activeMessages}
            keyExtractor={(item, index) => item.id || index.toString()}
            renderItem={renderMessage}
            contentContainerStyle={s.listContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <View style={s.centerBox}>
                <View style={s.emptyIconWrap}>
                  <MaterialCommunityIcons name="chat-processing-outline" size={48} color={T.accent} />
                </View>
                <Text style={s.emptyTitle}>{t('messages.sayHello')}</Text>
                <Text style={s.emptySubtitle}>{t('messages.startConversationWith', { name: otherName || t('messages.thisUser') })}</Text>
              </View>
            }
          />
        )}
      </View>

      {/* Input Area */}
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {isArchived ? (
          <View style={s.lockBanner}>
            <MaterialCommunityIcons name="lock-outline" size={16} color="#92400E" />
            <Text style={s.lockBannerText}>
              This job chat is archived because the service booking has been completed.
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

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 12,
    backgroundColor: T.surface,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    zIndex: 10,
  },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerProfile: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: T.accentLight,
    alignItems: "center",
    justifyContent: "center",
  },
  headerAvatarText: { fontSize: 18, fontWeight: "700", color: T.accent },
  onlineIndicator: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: T.success,
    borderWidth: 2,
    borderColor: T.surface,
  },
  headerTextWrap: { flex: 1, justifyContent: "center" },
  headerName: { fontSize: 17, fontWeight: "700", color: T.text1 },
  headerStatus: { fontSize: 13, color: T.text3, marginTop: 2, fontWeight: "500" },
  headerActionBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },

  chatContainer: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingVertical: 20 },
  
  msgRow: { flexDirection: "row", width: "100%", marginBottom: 16, alignItems: "flex-end" },
  msgRowMe: { justifyContent: "flex-end" },
  msgRowThem: { justifyContent: "flex-start" },
  msgRowConsecutive: { marginBottom: 4 },

  avatarContainer: { width: 32, marginRight: 8, alignItems: "center", justifyContent: "flex-end" },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: T.accentLight,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarSmallText: { fontSize: 13, fontWeight: "700", color: T.accent },
  avatarPlaceholder: { width: 32, height: 32 },

  bubble: {
    maxWidth: "75%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  bubbleMe: {
    backgroundColor: T.bubbleMe,
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    backgroundColor: T.bubbleThem,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: T.border,
  },
  
  bubbleMeText: { fontSize: 16, color: T.bubbleMeText, lineHeight: 22 },
  bubbleThemText: { fontSize: 16, color: T.bubbleThemText, lineHeight: 22 },

  timeText: { fontSize: 11, marginTop: 6, alignSelf: "flex-end", fontWeight: "500" },
  timeTextMe: { color: "rgba(255,255,255,0.7)" },
  timeTextThem: { color: T.text3 },

  centerBox: { flex: 1, alignItems: "center", justifyContent: "center", marginTop: 100 },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: T.accentLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: T.text1, marginBottom: 8 },
  emptySubtitle: { fontSize: 15, color: T.text2 },
  warningContainer: {
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FCD34D",
    borderRadius: 8,
    padding: 8,
    marginTop: 6,
  },
  warningText: {
    color: "#92400E",
    fontSize: 11,
    fontWeight: "500",
    lineHeight: 16,
  },
  lockBanner: {
    backgroundColor: "#FEF3C7",
    borderTopWidth: 1,
    borderTopColor: "#FCD34D",
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  lockBannerText: {
    color: "#92400E",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
});
