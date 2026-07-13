import React from 'react';
import { ScrollView, Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const T = {
  bg: "#FFFFFF", surface: "#FFFFFF", border: "#EBEBEB",
  text1: "#111827", text2: "#717171"
};

export default function TermsOfService() {
  const router = useRouter();
  
  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right', 'bottom']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <MaterialCommunityIcons name="chevron-left" size={32} color={T.text1} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Terms of Service</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.date}>Last Updated: October 2023</Text>
        <Text style={s.paragraph}>
          These Terms of Service govern your use of our mobile application and services. By accessing or using the App, you agree to be bound by these Terms.
        </Text>
        <Text style={s.heading}>1. User Accounts</Text>
        <Text style={s.paragraph}>
          You must provide accurate and complete information when creating an account. You are responsible for maintaining the confidentiality of your account credentials.
        </Text>
        <Text style={s.heading}>2. Acceptable Use</Text>
        <Text style={s.paragraph}>
          You agree not to use the App for any unlawful purpose or in any way that interrupts, damages, or impairs the service provided.
        </Text>
        <Text style={s.heading}>3. Service Providers & Customers</Text>
        <Text style={s.paragraph}>
          The App acts as a platform connecting customers with service providers. We do not directly employ service providers and are not liable for the performance of any services booked through the App.
        </Text>
        <Text style={s.heading}>4. Account Termination</Text>
        <Text style={s.paragraph}>
          We reserve the right to suspend or terminate your account if you violate these Terms. You may also delete your account at any time via the Settings menu.
        </Text>
        <Text style={s.heading}>5. Changes to Terms</Text>
        <Text style={s.paragraph}>
          We may modify these Terms at any time. Continued use of the App after changes indicates your acceptance of the updated Terms.
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
