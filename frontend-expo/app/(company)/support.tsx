import React, { useState } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function Support() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = () => {
    if (!subject || !message) {
      Alert.alert("Missing Fields", "Please provide a subject and message.");
      return;
    }
    
    setSending(true);
    // Simulate API call for support ticket
    setTimeout(() => {
      setSending(false);
      setSubject("");
      setMessage("");
      Alert.alert("Ticket Submitted", "Our support team will get back to you shortly.");
    }, 1500);
  };

  const faqs = [
    {
      q: "How do I change my payout schedule?",
      a: "You can adjust your payout schedule under Payments > Payout Settings. Options include Daily, Weekly, and Monthly."
    },
    {
      q: "Can I assign multiple staff to one booking?",
      a: "Yes. When viewing a booking, tap 'Assign Staff' and you can select multiple available team members."
    },
    {
      q: "How do I update my company coverage radius?",
      a: "Go to the Coverage Areas page from the sidebar menu to adjust your primary location and operating radius."
    }
  ];

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top', 'left', 'right']}>
      {/* Top App Bar */}
      <View className="flex-row items-center justify-between px-6 py-4 bg-surface border-b border-outline-variant/10">
        <View className="flex-row items-center gap-4 flex-1">
          <TouchableOpacity onPress={() => router.back()} className="active:scale-95 p-2 -ml-2">
            <MaterialCommunityIcons name="arrow-left" size={28} color="#002045" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-primary font-headline">
            Help & Support
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1"
      >
        <View className="px-6 py-6 gap-8 pb-24">
          
          {/* Quick Contact Options */}
          <View className="flex-row gap-4">
            <TouchableOpacity className="flex-1 bg-primary-container p-4 rounded-xl items-center border border-primary/20 active:scale-95">
              <MaterialCommunityIcons name="phone" size={24} color="#002045" className="mb-2" />
              <Text className="text-sm font-bold text-on-primary-container">Call Support</Text>
              <Text className="text-[10px] font-medium text-on-primary-container/80 mt-1">24/7 Priority Line</Text>
            </TouchableOpacity>
            
            <TouchableOpacity className="flex-1 bg-surface-container-low p-4 rounded-xl items-center border border-outline-variant/10 active:scale-95">
              <MaterialCommunityIcons name="book-open-page-variant" size={24} color="#002045" className="mb-2" />
              <Text className="text-sm font-bold text-on-surface">Knowledge Base</Text>
              <Text className="text-[10px] font-medium text-on-surface-variant mt-1">Guides & Tutorials</Text>
            </TouchableOpacity>
          </View>

          {/* Contact Form */}
          <View className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/10 shadow-sm">
            <Text className="text-lg font-bold text-primary font-headline mb-4">Send us a message</Text>
            
            <View className="gap-4">
              <View>
                <Text className="text-xs font-bold text-on-surface-variant mb-2 ml-1">Subject</Text>
                <View className="bg-surface-container-low rounded-xl px-4 py-3 border border-outline-variant/10">
                  <TextInput
                    value={subject}
                    onChangeText={setSubject}
                    placeholder="Brief description of the issue"
                    className="text-on-surface text-base"
                    placeholderTextColor="#74777f"
                  />
                </View>
              </View>

              <View>
                <Text className="text-xs font-bold text-on-surface-variant mb-2 ml-1">Message</Text>
                <View className="bg-surface-container-low rounded-xl px-4 py-3 border border-outline-variant/10 min-h-[120px]">
                  <TextInput
                    value={message}
                    onChangeText={setMessage}
                    placeholder="How can we help you today?"
                    className="text-on-surface text-base"
                    placeholderTextColor="#74777f"
                    multiline
                    textAlignVertical="top"
                  />
                </View>
              </View>

              <TouchableOpacity 
                onPress={handleSend}
                disabled={sending}
                className={`py-3.5 rounded-xl items-center ${sending ? 'bg-outline-variant/50' : 'bg-primary'} active:scale-95`}
              >
                <Text className={`font-bold ${sending ? 'text-on-surface-variant' : 'text-on-primary'}`}>
                  {sending ? 'Sending...' : 'Submit Ticket'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* FAQs */}
          <View>
            <Text className="text-lg font-bold text-primary font-headline mb-4 ml-1">Frequently Asked Questions</Text>
            <View className="gap-3">
              {faqs.map((faq, index) => (
                <View key={index} className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/10">
                  <Text className="text-sm font-bold text-on-surface mb-2">{faq.q}</Text>
                  <Text className="text-sm text-on-surface-variant leading-5">{faq.a}</Text>
                </View>
              ))}
            </View>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
