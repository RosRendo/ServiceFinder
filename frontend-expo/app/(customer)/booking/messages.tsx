import React, { useState } from "react";
import { Image } from "expo-image";
import { ScrollView, Text, View, TouchableOpacity, TextInput, FlatList, StyleSheet, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Theme } from "@/constants/theme";

const T = Theme.colors;

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
  android: { elevation: 1 },
});

type Message = {
  id: string;
  type: "provider" | "customer" | "system";
  content?: string;
  image?: string;
  timestamp: string;
};

const MESSAGES: Message[] = [
  {
    id: "1",
    type: "system",
    content: "Booking Confirmed - Oct 24, 09:00 AM",
    timestamp: "02:10 PM",
  },
  {
    id: "2",
    type: "provider",
    content:
      "Hello! I'm Sarah from Sparkle Pro. I've confirmed your booking for tomorrow morning. Do you have any specific areas you'd like us to focus on?",
    timestamp: "02:14 PM",
  },
  {
    id: "3",
    type: "customer",
    content:
      "Hi Sarah! Yes, please focus on the kitchen tiles and the guest bathroom. We also have a small dog, just so you're aware.",
    timestamp: "02:18 PM",
  },
  {
    id: "4",
    type: "provider",
    content:
      "Noted! We love pets, so that's no problem at all. We'll bring our eco-friendly supplies for the tiles. See you tomorrow at 9:00 AM!",
    timestamp: "02:20 PM",
  },
  {
    id: "5",
    type: "system",
    content: "Sarah added a photo to the job file",
    timestamp: "02:21 PM",
  },
  {
    id: "6",
    type: "provider",
    image:
      "https://images.unsplash.com/photo-1584622181563-430f63602d4b?w=400&h=300&fit=crop",
    content: "These are the supplies we'll be using.",
    timestamp: "02:21 PM",
  },
];

export default function BookingMessagesScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(MESSAGES);
  const [inputText, setInputText] = useState("");

  const handleSendMessage = () => {
    if (inputText.trim()) {
      const newMessage: Message = {
        id: String(messages.length + 1),
        type: "customer",
        content: inputText,
        timestamp: new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages([...messages, newMessage]);
      setInputText("");
    }
  };

  const renderMessage = (item: Message) => {
    if (item.type === "system") {
      return (
        <View key={item.id} style={s.systemMsgRow}>
          <View style={s.systemBadge}>
            <Text style={s.systemBadgeText}>
              {item.content}
            </Text>
          </View>
        </View>
      );
    }

    const isCustomer = item.type === "customer";

    return (
      <View
        key={item.id}
        style={[s.msgRow, isCustomer ? s.msgRowCustomer : s.msgRowProvider]}
      >
        <View
          style={[s.msgWrap, isCustomer ? s.msgWrapCustomer : s.msgWrapProvider]}
        >
          {item.image && (
            <View style={s.imageCard}>
              <Image
                source={{ uri: item.image }}
                style={s.msgImage}
              />
              {item.content && (
                <Text style={s.imageCaption}>
                  {item.content}
                </Text>
              )}
            </View>
          )}

          {item.content && !item.image && (
            <View
              style={[
                s.bubble,
                isCustomer ? s.bubbleMe : s.bubbleThem
              ]}
            >
              <Text
                style={[
                  s.msgText,
                  isCustomer ? s.msgTextMe : s.msgTextThem
                ]}
              >
                {item.content}
              </Text>
            </View>
          )}

          <Text
            style={[
              s.msgTime,
              isCustomer ? s.msgTimeMe : s.msgTimeThem
            ]}
          >
            {item.timestamp}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={s.backBtn}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={T.primary}
            />
          </TouchableOpacity>

          <View style={s.providerBadge}>
            {/* Provider Avatar */}
            <View style={s.avatarWrap}>
              <Image
                source={{
                  uri: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
                }}
                style={s.avatarImg}
              />
              <View style={s.onlineDot} />
            </View>

            <View style={s.providerText}>
              <Text style={s.providerName}>
                Sparkle Pro Cleaning
              </Text>
              <Text style={s.statusText}>
                Online
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={s.moreBtn}>
          <MaterialCommunityIcons
            name="dots-vertical"
            size={24}
            color={T.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        data={messages}
        renderItem={({ item }) => renderMessage(item)}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
        scrollEnabled={true}
      />

      {/* Input Area */}
      <View style={s.inputContainer}>
        <View style={s.inputRow}>
          {/* Add Button */}
          <TouchableOpacity style={s.attachBtn} activeOpacity={0.7}>
            <MaterialCommunityIcons name="plus" size={24} color={T.text2} />
          </TouchableOpacity>

          {/* Text Input */}
          <View style={s.inputWrap}>
            <TextInput
              style={s.textInput}
              placeholder="Type a message..."
              placeholderTextColor={T.text3}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity style={s.clipBtn}>
              <MaterialCommunityIcons
                name="paperclip"
                size={20}
                color={T.text2}
              />
            </TouchableOpacity>
          </View>

          {/* Send Button */}
          <TouchableOpacity
            onPress={handleSendMessage}
            disabled={!inputText.trim()}
            style={[
              s.sendBtn,
              inputText.trim() ? s.sendBtnActive : s.sendBtnInactive
            ]}
          >
            <MaterialCommunityIcons name="send" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    backgroundColor: T.surface,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  providerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  avatarWrap: {
    position: "relative",
  },
  avatarImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: T.bg,
  },
  onlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 11,
    height: 11,
    backgroundColor: T.success,
    borderWidth: 2,
    borderColor: "white",
    borderRadius: 5.5,
  },
  providerText: {
    flex: 1,
  },
  providerName: {
    fontSize: 15,
    fontWeight: "800",
    color: T.text1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: T.success,
    marginTop: 2,
  },
  moreBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  systemMsgRow: {
    alignItems: "center",
    marginVertical: 16,
  },
  systemBadge: {
    backgroundColor: T.border,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  systemBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: T.text2,
    letterSpacing: 0.2,
  },
  msgRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  msgRowCustomer: {
    justifyContent: "flex-end",
  },
  msgRowProvider: {
    justifyContent: "flex-start",
  },
  msgWrap: {
    maxWidth: "85%",
  },
  msgWrapCustomer: {
    alignItems: "flex-end",
  },
  msgWrapProvider: {
    alignItems: "flex-start",
  },
  imageCard: {
    backgroundColor: T.surface,
    padding: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: T.border,
    overflow: "hidden",
    ...CARD_SHADOW,
  },
  msgImage: {
    width: 220,
    height: 160,
    borderRadius: 12,
  },
  imageCaption: {
    fontSize: 13,
    color: T.text2,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  bubbleMe: {
    backgroundColor: T.primary,
    borderBottomRightRadius: 2,
  },
  bubbleThem: {
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.border,
    borderBottomLeftRadius: 2,
    ...CARD_SHADOW,
  },
  msgText: {
    fontSize: 14,
    lineHeight: 20,
  },
  msgTextMe: {
    color: "white",
  },
  msgTextThem: {
    color: T.text1,
  },
  msgTime: {
    fontSize: 9,
    fontWeight: "800",
    marginTop: 6,
    textTransform: "uppercase",
    letterSpacing: 0.2,
  },
  msgTimeMe: {
    color: T.text3,
    marginRight: 4,
  },
  msgTimeThem: {
    color: T.text3,
    marginLeft: 4,
  },
  inputContainer: {
    backgroundColor: T.surface,
    borderTopWidth: 1,
    borderTopColor: T.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
  },
  attachBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: T.bg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: T.border,
  },
  inputWrap: {
    flex: 1,
    backgroundColor: T.bg,
    borderWidth: 1.5,
    borderColor: T.border,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  textInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: T.text1,
    maxHeight: 100,
  },
  clipBtn: {
    padding: 8,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    ...CARD_SHADOW,
  },
  sendBtnActive: {
    backgroundColor: T.primary,
  },
  sendBtnInactive: {
    backgroundColor: T.border,
    opacity: 0.6,
  },
});
