import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSidebarStore } from "@/store/sidebarStore";

export default function Help() {
  const openSidebar = useSidebarStore((s) => s.setAdminOpen);

  const faqs = [
    {
      q: "How do I verify a company?",
      a: "Navigate to the 'Queue' section on the bottom bar, select a pending company, review their documents, and click 'Approve'.",
    },
    {
      q: "How are platform fees calculated?",
      a: "Platform fees are automatically deducted from completed bookings based on the percentage set in Settings > Payments.",
    },
    {
      q: "Can I suspend a user account?",
      a: "Yes. Go to the Users tab, search for the user, and change their status to 'Suspended'. They will no longer be able to log in.",
    },
  ];

  const handleSupportEmail = () => {
    Linking.openURL('mailto:support@servicefinder.com');
  };

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top', 'left', 'right']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 bg-surface border-b border-outline-variant/10">
        <View className="flex-row items-center gap-4 flex-1">
          <TouchableOpacity onPress={() => openSidebar(true)} className="active:scale-95 p-2 -ml-2">
            <MaterialCommunityIcons name="menu" size={28} color="#002045" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-primary font-headline">
            Help & Support
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 py-4">
        
        {/* Support Contact */}
        <TouchableOpacity 
          onPress={handleSupportEmail}
          className="bg-primary-container rounded-2xl p-5 mb-8 flex-row items-center justify-between active:scale-95"
        >
          <View className="flex-1 pr-4">
            <Text className="text-lg font-bold text-on-primary-container mb-1">
              Need immediate assistance?
            </Text>
            <Text className="text-sm text-on-primary-container opacity-80">
              Contact the developer team directly at support@servicefinder.com
            </Text>
          </View>
          <View className="w-12 h-12 rounded-full bg-primary justify-center items-center">
            <MaterialCommunityIcons name="email-fast" size={24} color="#fff" />
          </View>
        </TouchableOpacity>

        <Text className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-4 px-2">
          Frequently Asked Questions
        </Text>

        <View className="gap-4 pb-10">
          {faqs.map((faq, index) => (
            <View key={index} className="bg-surface-container rounded-lg p-4 border border-outline-variant/10">
              <View className="flex-row items-start gap-3 mb-2">
                <MaterialCommunityIcons name="help-circle" size={20} color="#1a365d" className="mt-0.5" />
                <Text className="text-base font-bold text-on-surface flex-1">
                  {faq.q}
                </Text>
              </View>
              <Text className="text-sm text-on-surface-variant pl-8">
                {faq.a}
              </Text>
            </View>
          ))}
        </View>

        <View className="items-center py-6">
          <Text className="text-xs text-on-surface-variant font-bold">
            ServiceFinder Admin Portal v1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
