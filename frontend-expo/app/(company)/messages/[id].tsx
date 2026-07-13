import React, { useEffect, useRef } from "react";
import {
  View, Text, TouchableOpacity, FlatList,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { ChatMessage } from "@/components/messages/ChatMessage";
import { ChatInput } from "@/components/messages/ChatInput";

export default function ChatScreen() {
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

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* Header */}
      <View className="flex-row items-center gap-3 px-4 py-3 border-b border-surface-container bg-white/95">
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 rounded-full items-center justify-center">
          <MaterialCommunityIcons name="arrow-left" size={24} color="#002045" />
        </TouchableOpacity>
        <View className="w-10 h-10 rounded-full bg-secondary-fixed items-center justify-center">
          <Text className="text-base font-black text-primary-500">
            {otherName ? otherName.charAt(0).toUpperCase() : "?"}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="font-bold text-primary-500" numberOfLines={1}>{otherName ?? "Conversation"}</Text>
          <View className="flex-row items-center gap-1">
            <View className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-green-500" : "bg-gray-400"}`} />
            <Text className="text-xs text-gray-400">{isConnected ? "Online" : "Connecting..."}</Text>
          </View>
        </View>
      </View>

      {/* Messages */}
      {isLoading && activeMessages.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#002045" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          style={{ flex: 1 }}
          data={activeMessages}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <ChatMessage message={item} isMe={!!item.isMe} />}
          contentContainerStyle={{ paddingVertical: 12, paddingHorizontal: 16 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              <MaterialCommunityIcons name="message-text-outline" size={48} color="#D1D5DB" />
              <Text className="text-gray-400 mt-2">Send the first message</Text>
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
