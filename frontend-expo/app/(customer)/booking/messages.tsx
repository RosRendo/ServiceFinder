import React, { useState } from "react";
import { Image } from "expo-image";
import { ScrollView, Text, View, TouchableOpacity, TextInput, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

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
        <View key={item.id} className="items-center my-4">
          <View className="bg-surface-container-low px-4 py-2 rounded-full border border-outline-variant/10">
            <Text className="text-xs font-bold text-on-surface-variant tracking-wider">
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
        className={`flex-row ${isCustomer ? "justify-end" : "justify-start"} mb-4`}
      >
        <View
          className={`max-w-[85%] ${isCustomer ? "items-end" : "items-start"}`}
        >
          {item.image && (
            <View className="bg-surface-container-lowest p-2 rounded-2xl shadow-sm mb-2 overflow-hidden">
              <Image
                source={{ uri: item.image }}
                className="w-56 h-40 rounded-xl"
              />
              {item.content && (
                <Text className="text-on-surface-variant text-xs px-3 py-2">
                  {item.content}
                </Text>
              )}
            </View>
          )}

          {item.content && !item.image && (
            <View
              className={`p-4 rounded-2xl ${
                isCustomer
                  ? "bg-primary-500 rounded-br-none"
                  : "bg-surface-container-lowest rounded-bl-none shadow-sm"
              }`}
            >
              <Text
                className={`text-base leading-relaxed ${
                  isCustomer ? "text-white" : "text-on-surface-variant"
                }`}
              >
                {item.content}
              </Text>
            </View>
          )}

          <Text
            className={`text-[10px] font-bold text-on-secondary-container mt-2 ${
              isCustomer ? "mr-1" : "ml-1"
            } uppercase tracking-tighter`}
          >
            {item.timestamp}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4 border-b border-surface-container bg-surface-container-lowest">
        <View className="flex-row items-center gap-3 flex-1">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full items-center justify-center"
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color="#002045"
            />
          </TouchableOpacity>

          <View className="flex-row items-center gap-3 flex-1">
            {/* Provider Avatar */}
            <View className="relative">
              <Image
                source={{
                  uri: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
                }}
                className="w-10 h-10 rounded-full bg-surface-container"
              />
              <View className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
            </View>

            <View className="flex-1">
              <Text className="text-base font-bold text-primary-500 font-headline">
                Sparkle Pro Cleaning
              </Text>
              <Text className="text-[10px] font-bold uppercase tracking-widest text-green-600">
                Online
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity className="w-10 h-10 rounded-full items-center justify-center">
          <MaterialCommunityIcons
            name="dots-vertical"
            size={24}
            color="#002045"
          />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        data={messages}
        renderItem={({ item }) => renderMessage(item)}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={true}
      />

      {/* Input Area */}
      <View className="bg-white/80 border-t border-surface-container px-4 py-4 pb-8">
        <View className="flex-row items-end gap-3">
          {/* Add Button */}
          <TouchableOpacity className="w-12 h-12 rounded-full bg-surface-container-low items-center justify-center active:opacity-70">
            <MaterialCommunityIcons name="plus" size={24} color="#515f74" />
          </TouchableOpacity>

          {/* Text Input */}
          <View className="flex-1 bg-surface-container-low rounded-2xl flex-row items-center px-4">
            <TextInput
              className="flex-1 py-3 text-on-surface font-body"
              placeholder="Type a message..."
              placeholderTextColor="#43474e"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity className="p-2">
              <MaterialCommunityIcons
                name="paperclip"
                size={20}
                color="#43474e"
              />
            </TouchableOpacity>
          </View>

          {/* Send Button */}
          <TouchableOpacity
            onPress={handleSendMessage}
            disabled={!inputText.trim()}
            className={`w-12 h-12 rounded-full items-center justify-center shadow-lg active:scale-90 ${
              inputText.trim() ? "bg-primary-500" : "bg-primary-500/50"
            }`}
          >
            <MaterialCommunityIcons name="send" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
