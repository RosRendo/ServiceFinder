import React from 'react';
import { ScrollView, Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Theme } from "@/constants/theme";

const T = Theme.colors;

export default function PrivacyPolicy() {
  const router = useRouter();
  
  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right', 'bottom']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <MaterialCommunityIcons name="chevron-left" size={32} color={T.text1} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.date}>Last Updated: October 2023</Text>
        <Text style={s.paragraph}>
          Your privacy is important to us. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our mobile application.
        </Text>
        <Text style={s.heading}>1. Information We Collect</Text>
        <Text style={s.paragraph}>
          We may collect personal information such as your name, email address, and location data to provide our services and connect you with service providers or customers.
        </Text>
        <Text style={s.heading}>2. Use of Your Information</Text>
        <Text style={s.paragraph}>
          We use your information to operate and maintain the App, improve user experience, and communicate with you about updates or support.
        </Text>
        <Text style={s.heading}>3. Sharing of Your Information</Text>
        <Text style={s.paragraph}>
          We may share information with third-party service providers that perform services for us or on our behalf. We do not sell your personal information.
        </Text>
        <Text style={s.heading}>4. Account Deletion</Text>
        <Text style={s.paragraph}>
          You can request to delete your account at any time through the Settings menu. Once deleted, your data will be permanently removed from our active systems.
        </Text>
        <Text style={s.heading}>5. Contact Us</Text>
        <Text style={s.paragraph}>
          If you have questions or comments about this Privacy Policy, please contact us via our support channels.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: T.border,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center", marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: T.text1 },
  content: { padding: 20, paddingBottom: 60 },
  date: { fontSize: 14, color: T.text2, marginBottom: 20 },
  heading: { fontSize: 18, fontWeight: '700', color: T.text1, marginTop: 20, marginBottom: 10 },
  paragraph: { fontSize: 15, color: T.text2, lineHeight: 22 },
});
