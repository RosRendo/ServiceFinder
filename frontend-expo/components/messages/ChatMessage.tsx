import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { ChatMessage as ChatMessageType } from "@/store/chatStore";
import { Theme } from "@/constants/theme";

const T = Theme.colors;

interface ChatMessageProps {
  message: ChatMessageType;
  isMe: boolean;
}

export function ChatMessage({ message, isMe }: ChatMessageProps) {
  return (
    <View style={[s.row, isMe ? s.rowMe : s.rowThem]}>
      <View style={[s.bubble, isMe ? s.bubbleMe : s.bubbleThem]}>
        <Text style={[s.text, isMe ? s.textMe : s.textThem]}>
          {message.text || (message as any).text}
        </Text>
        <Text style={[s.time, isMe ? s.timeMe : s.timeThem]}>
          {new Date(message.timestamp || (message as any).timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  row: { width: "100%", flexDirection: "row", marginVertical: 4 },
  rowMe: { justifyContent: "flex-end" },
  rowThem: { justifyContent: "flex-start" },
  
  bubble: { maxWidth: "80%", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10 },
  bubbleMe: { backgroundColor: T.accent, borderTopRightRadius: 4 },
  bubbleThem: { backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, borderTopLeftRadius: 4 },
  
  text: { fontSize: 15, lineHeight: 22 },
  textMe: { color: "#FFFFFF" },
  textThem: { color: T.text1 },
  
  time: { fontSize: 10, marginTop: 4, textAlign: "right" },
  timeMe: { color: "rgba(255,255,255,0.7)" },
  timeThem: { color: T.text3 },
});
