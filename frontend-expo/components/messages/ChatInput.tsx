import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, Platform } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const T = {
  accent: "#4C1D95",
  surface: "#FFFFFF",
  bg: "#F7F8FC",
  border: "#EAECF5",
  text1: "#111827",
  text3: "#9CA3AF",
};

interface ChatInputProps {
  onSend: (text: string) => Promise<void>;
}

export function ChatInput({ onSend }: ChatInputProps) {
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!text.trim() || isSending) return;
    
    setIsSending(true);
    try {
      await onSend(text.trim());
      setText("");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <View style={s.root}>
      <TouchableOpacity style={s.attachBtn}>
        <MaterialCommunityIcons name="paperclip" size={24} color={T.text3} />
      </TouchableOpacity>
      
      <View style={s.inputWrap}>
        <TextInput
          style={s.input}
          placeholder="Type a message..."
          placeholderTextColor={T.text3}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={1000}
        />
      </View>

      <TouchableOpacity 
        onPress={handleSend}
        disabled={!text.trim() || isSending}
        style={[s.sendBtn, text.trim() && !isSending ? s.sendBtnActive : s.sendBtnInactive]}
        activeOpacity={0.8}
      >
        {isSending ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <MaterialCommunityIcons 
            name="send" 
            size={20} 
            color={text.trim() ? "#FFFFFF" : T.text3} 
            style={{ marginLeft: 2 }} // center the send icon visually
          />
        )}
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flexDirection: "row", alignItems: "center", padding: 12, backgroundColor: T.surface,
    borderTopWidth: 1, borderTopColor: T.border, paddingBottom: Platform.OS === "ios" ? 24 : 12,
  },
  attachBtn: { padding: 8, marginRight: 4 },
  inputWrap: {
    flex: 1, backgroundColor: T.bg, borderRadius: 24, borderWidth: 1, borderColor: T.border,
    flexDirection: "row", alignItems: "center", paddingHorizontal: 16, minHeight: 48,
  },
  input: {
    flex: 1, fontSize: 15, color: T.text1, paddingTop: 12, paddingBottom: 12,
    minHeight: 48, maxHeight: 120,
  },
  sendBtn: {
    marginLeft: 8, width: 44, height: 44, borderRadius: 22,
    alignItems: "center", justifyContent: "center",
  },
  sendBtnActive: { backgroundColor: T.accent },
  sendBtnInactive: { backgroundColor: T.bg, borderWidth: 1, borderColor: T.border },
});
