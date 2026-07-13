import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { api } from "@/store/authStore";

type Role = "user" | "assistant";

interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: Date;
}

const QUICK_PROMPTS = [
  "How do I handle a difficult customer?",
  "Tips for faster job completion",
  "How to write a professional report?",
  "Best practices for safety on site",
];

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi! I'm your AI assistant. I can help you with job tips, handling customer situations, writing reports, safety guidelines, and more. How can I help you today?",
  timestamp: new Date(),
};

export default function AIToolsScreen() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef<FlatList>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setInput("");

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    scrollToBottom();

    try {
      const history = messages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await api.post("/api/ai/chat", {
        message: content,
        history,
        context: "staff_assistant",
      });

      const reply =
        res.data?.data?.response ??
        res.data?.response ??
        res.data?.message ??
        "I'm here to help! Could you rephrase your question?";

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: reply,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e: any) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === "user";
    return (
      <View
        className={`mb-3 flex-row ${isUser ? "justify-end" : "justify-start"}`}
      >
        {!isUser && (
          <View className="w-8 h-8 rounded-full bg-[#002045] items-center justify-center mr-2 mt-0.5 flex-shrink-0">
            <MaterialCommunityIcons name="robot" size={16} color="white" />
          </View>
        )}
        <View
          className={`max-w-[78%] px-4 py-3 rounded-2xl ${
            isUser
              ? "bg-[#002045] rounded-tr-sm"
              : "bg-surface-container-lowest border border-surface-container rounded-tl-sm"
          }`}
        >
          <Text
            className={`text-sm leading-relaxed ${
              isUser ? "text-white" : "text-on-surface"
            }`}
          >
            {item.content}
          </Text>
          <Text
            className={`text-[10px] mt-1.5 ${
              isUser ? "text-blue-200 text-right" : "text-on-surface-variant"
            }`}
          >
            {item.timestamp.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
        {isUser && (
          <View className="w-8 h-8 rounded-full bg-secondary-fixed items-center justify-center ml-2 mt-0.5 flex-shrink-0">
            <MaterialCommunityIcons name="account" size={16} color="#002045" />
          </View>
        )}
      </View>
    );
  };

  const renderTypingIndicator = () => (
    <View className="flex-row justify-start mb-3">
      <View className="w-8 h-8 rounded-full bg-[#002045] items-center justify-center mr-2">
        <MaterialCommunityIcons name="robot" size={16} color="white" />
      </View>
      <View className="bg-surface-container-lowest border border-surface-container rounded-2xl rounded-tl-sm px-4 py-3 flex-row gap-1.5 items-center">
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            className="w-2 h-2 rounded-full bg-on-surface-variant opacity-60"
          />
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* Header */}
      <View className="flex-row items-center gap-3 px-4 py-4 border-b border-surface-container bg-surface-container-lowest">
        <View className="w-10 h-10 rounded-full bg-[#002045] items-center justify-center">
          <MaterialCommunityIcons name="robot" size={22} color="white" />
        </View>
        <View className="flex-1">
          <Text className="font-bold text-primary text-base">AI Assistant</Text>
          <View className="flex-row items-center gap-1.5">
            <View className="w-2 h-2 rounded-full bg-green-500" />
            <Text className="text-xs text-on-surface-variant">Online · Ready to help</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => setMessages([WELCOME_MESSAGE])}
          className="w-9 h-9 rounded-full bg-surface-container items-center justify-center"
        >
          <MaterialCommunityIcons name="refresh" size={18} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {/* Message list */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}
          ListFooterComponent={loading ? renderTypingIndicator() : null}
        />

        {/* Quick prompts — only show if only welcome message */}
        {messages.length === 1 && (
          <View className="px-4 pb-3">
            <Text className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-2">
              Quick Questions
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {QUICK_PROMPTS.map((prompt) => (
                <TouchableOpacity
                  key={prompt}
                  onPress={() => sendMessage(prompt)}
                  className="bg-surface-container-lowest border border-surface-container rounded-full px-3 py-2"
                >
                  <Text className="text-xs text-primary font-medium">{prompt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Input bar */}
        <View className="flex-row items-end gap-3 px-4 py-3 border-t border-surface-container bg-surface">
          <TextInput
            className="flex-1 bg-surface-container-lowest border border-surface-container rounded-2xl px-4 py-3 text-on-surface text-sm"
            placeholder="Ask me anything..."
            placeholderTextColor="#9CA3AF"
            multiline
            maxLength={1000}
            value={input}
            onChangeText={setInput}
            style={{ maxHeight: 120, textAlignVertical: "top" }}
          />
          <TouchableOpacity
            onPress={() => sendMessage()}
            disabled={!input.trim() || loading}
            className={`w-11 h-11 rounded-full items-center justify-center flex-shrink-0 ${
              input.trim() && !loading ? "bg-[#002045]" : "bg-surface-container"
            }`}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#9CA3AF" />
            ) : (
              <MaterialCommunityIcons
                name="send"
                size={18}
                color={input.trim() ? "white" : "#9CA3AF"}
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
