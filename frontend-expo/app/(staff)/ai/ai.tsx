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
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { api } from "@/store/authStore";
import { Theme } from "@/constants/theme";

const T = Theme.colors;

const Fonts = { headline: "System" };

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
  android: { elevation: 1 },
});

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
      <View style={[s.msgRow, isUser ? s.msgRowUser : s.msgRowAssistant]}>
        {!isUser && (
          <View style={s.avatarWrapAssistant}>
            <MaterialCommunityIcons name="robot" size={16} color="white" />
          </View>
        )}
        <View style={[
          s.bubble,
          isUser ? s.bubbleMe : s.bubbleThem
        ]}>
          <Text style={[
            s.bubbleText,
            isUser ? s.bubbleTextMe : s.bubbleTextThem
          ]}>
            {item.content}
          </Text>
          <Text style={[
            s.bubbleTime,
            isUser ? s.bubbleTimeMe : s.bubbleTimeThem
          ]}>
            {item.timestamp.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
        {isUser && (
          <View style={s.avatarWrapUser}>
            <MaterialCommunityIcons name="account" size={16} color={T.primary} />
          </View>
        )}
      </View>
    );
  };

  const renderTypingIndicator = () => (
    <View style={[s.msgRow, s.msgRowAssistant]}>
      <View style={s.avatarWrapAssistant}>
        <MaterialCommunityIcons name="robot" size={16} color="white" />
      </View>
      <View style={[s.bubble, s.bubbleThem, s.typingIndicatorWrap]}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={s.typingDot} />
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerInfo}>
          <View style={s.robotBadge}>
            <MaterialCommunityIcons name="robot" size={22} color="white" />
          </View>
          <View>
            <Text style={s.headerTitle}>AI Assistant</Text>
            <View style={s.statusRow}>
              <View style={s.statusDot} />
              <Text style={s.statusText}>Online · Ready to help</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => setMessages([WELCOME_MESSAGE])}
          style={s.refreshBtn}
        >
          <MaterialCommunityIcons name="refresh" size={18} color={T.text2} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={s.flex1}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {/* Message list */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}
          ListFooterComponent={loading ? renderTypingIndicator() : null}
        />

        {/* Quick prompts — only show if only welcome message */}
        {messages.length === 1 && (
          <View style={s.quickPromptsWrap}>
            <Text style={s.quickPromptsTitle}>
              Quick Questions
            </Text>
            <View style={s.chipContainer}>
              {QUICK_PROMPTS.map((prompt) => (
                <TouchableOpacity
                  key={prompt}
                  onPress={() => sendMessage(prompt)}
                  style={s.promptChip}
                >
                  <Text style={s.promptText}>{prompt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Input bar */}
        <View style={s.inputBar}>
          <TextInput
            style={s.textInput}
            placeholder="Ask me anything..."
            placeholderTextColor={T.text3}
            multiline
            maxLength={1000}
            value={input}
            onChangeText={setInput}
          />
          <TouchableOpacity
            onPress={() => sendMessage()}
            disabled={!input.trim() || loading}
            style={[
              s.sendBtn,
              input.trim() && !loading ? s.sendBtnActive : s.sendBtnInactive
            ]}
          >
            {loading ? (
              <ActivityIndicator size="small" color={T.text3} />
            ) : (
              <MaterialCommunityIcons
                name="send"
                size={18}
                color={input.trim() ? "white" : T.text3}
              />
            )}
          </TouchableOpacity>
        </View>
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
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    backgroundColor: T.surface,
  },
  headerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  robotBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: T.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: Fonts?.headline || "System",
    fontWeight: "800",
    color: T.text1,
    fontSize: 16,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: T.success,
  },
  statusText: {
    fontSize: 11,
    color: T.text3,
    fontWeight: "600",
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: T.bg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: T.border,
  },
  listContent: {
    padding: 16,
    paddingBottom: 16,
  },
  msgRow: {
    marginBottom: 12,
    flexDirection: "row",
  },
  msgRowUser: {
    justifyContent: "flex-end",
  },
  msgRowAssistant: {
    justifyContent: "flex-start",
  },
  avatarWrapAssistant: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: T.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    marginTop: 2,
  },
  avatarWrapUser: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: T.accentLight,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
    marginTop: 2,
  },
  bubble: {
    maxWidth: "78%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    ...CARD_SHADOW,
  },
  bubbleMe: {
    backgroundColor: T.primary,
    borderTopRightRadius: 2,
  },
  bubbleThem: {
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.border,
    borderTopLeftRadius: 2,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleTextMe: {
    color: "white",
  },
  bubbleTextThem: {
    color: T.text1,
  },
  bubbleTime: {
    fontSize: 9,
    marginTop: 6,
    fontWeight: "600",
  },
  bubbleTimeMe: {
    color: T.accentLight,
    textAlign: "right",
  },
  bubbleTimeThem: {
    color: T.text3,
  },
  typingIndicatorWrap: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    paddingVertical: 14,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: T.text3,
    opacity: 0.6,
  },
  quickPromptsWrap: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  quickPromptsTitle: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    color: T.text3,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  promptChip: {
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    ...CARD_SHADOW,
  },
  promptText: {
    fontSize: 12,
    color: T.primary,
    fontWeight: "700",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: T.border,
    backgroundColor: T.surface,
  },
  textInput: {
    flex: 1,
    backgroundColor: T.bg,
    borderWidth: 1.5,
    borderColor: T.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: T.text1,
    maxHeight: 100,
    textAlignVertical: "top",
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnActive: {
    backgroundColor: T.primary,
  },
  sendBtnInactive: {
    backgroundColor: T.bg,
    borderWidth: 1,
    borderColor: T.border,
  },
});
