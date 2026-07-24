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
import { ChatMessage } from "@/components/messages/ChatMessage";
import { ChatInput } from "@/components/messages/ChatInput";
import { Theme } from "@/constants/theme";

const T = Theme.colors;

export default function AdminChatScreen() {
  const router = useRouter();
  const { id, otherName } = useLocalSearchParams<{ id: string; otherName?: string }>();
  const flatListRef = useRef<FlatList>(null);
  
  const { token } = useAuthStore();
  const { 
    messagesByConversation, isLoading, isConnected, 
    connect, disconnect, fetchMessages, sendMessage, setActiveConversation 
  } = useChatStore();

  const activeMessages = id ? (messagesByConversation[id] || []) : [];

  useEffect(() => {
    if (!id || !token) return;
    
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

  const nameInitial = otherName ? otherName.charAt(0).toUpperCase() : "?";

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={T.text1} />
        </TouchableOpacity>
        <View style={s.avatarBox}>
          <Text style={s.avatarText}>{nameInitial}</Text>
        </View>
        <View style={s.headerInfo}>
          <Text style={s.titleText} numberOfLines={1}>{otherName ?? "Conversation"}</Text>
          <View style={s.statusRow}>
            <View style={[s.statusDot, { backgroundColor: isConnected ? T.success : T.text3 }]} />
            <Text style={s.statusText}>{isConnected ? "Online" : "Connecting..."}</Text>
          </View>
        </View>
      </View>

      {/* Messages */}
      {isLoading && activeMessages.length === 0 ? (
        <View style={s.loadingBox}>
          <ActivityIndicator size="large" color={T.accent} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          style={{ flex: 1 }}
          data={activeMessages}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <ChatMessage message={item} isMe={!!item.isMe} />}
          contentContainerStyle={{ paddingVertical: 16, paddingHorizontal: 16 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={s.emptyBox}>
              <MaterialCommunityIcons name="message-text-outline" size={48} color={T.text3} />
              <Text style={s.emptyText}>Send the first message</Text>
            </View>
          }
        />
      )}

      {/* Input */}
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ChatInput onSend={handleSend} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  header: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: T.surface, borderBottomWidth: 1, borderBottomColor: T.border, gap: 12
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  avatarBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: T.accent + "15", alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 16, fontWeight: "800", color: T.accent },
  headerInfo: { flex: 1 },
  titleText: { fontSize: 16, fontWeight: "800", color: T.text1 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, color: T.text3, fontWeight: "500" },
  loadingBox: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyBox: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 80 },
  emptyText: { fontSize: 14, color: T.text3, marginTop: 8, fontWeight: "500" }
});
