import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  StyleSheet,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSidebarStore } from "@/store/sidebarStore";
import { Theme } from "@/constants/theme";
import { useTranslation } from "react-i18next";

const T = Theme.colors;

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  android: { elevation: 2 },
});

export default function Help() {
  const { t } = useTranslation();
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
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity 
              accessibilityRole="button"
              accessibilityLabel={t('common.openMenu')}
              onPress={() => openSidebar(true)} style={s.menuBtn}>
          <MaterialCommunityIcons name="menu" size={28} color={T.primary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Help & Support</Text>
      </View>

      <ScrollView style={s.scrollView} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Support Contact */}
        <TouchableOpacity 
          onPress={handleSupportEmail}
          style={s.contactCard}
          activeOpacity={0.9}
        >
          <View style={s.contactLeft}>
            <Text style={s.contactTitle}>
              Need immediate assistance?
            </Text>
            <Text style={s.contactDesc}>
              Contact the developer team directly at support@servicefinder.com
            </Text>
          </View>
          <View style={s.contactIconWrap}>
            <MaterialCommunityIcons name="email-fast" size={24} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        <Text style={s.sectionTitle}>
          Frequently Asked Questions
        </Text>

        <View style={s.faqList}>
          {faqs.map((faq, index) => (
            <View key={index} style={s.faqCard}>
              <View style={s.faqQuestionRow}>
                <MaterialCommunityIcons name="help-circle" size={20} color={T.accentMid} style={s.faqIcon} />
                <Text style={s.faqQuestion}>
                  {faq.q}
                </Text>
              </View>
              <Text style={s.faqAnswer}>
                {faq.a}
              </Text>
            </View>
          ))}
        </View>

        <View style={s.footer}>
          <Text style={s.footerText}>
            ServiceFinder Admin Portal v1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    backgroundColor: T.surface,
    gap: 12,
  },
  menuBtn: {
    padding: 6,
    marginLeft: -6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: T.text1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 60,
  },
  contactCard: {
    backgroundColor: T.primary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    ...CARD_SHADOW,
  },
  contactLeft: {
    flex: 1,
    paddingRight: 16,
  },
  contactTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  contactDesc: {
    fontSize: 13,
    color: "#FFFFFF",
    opacity: 0.85,
    lineHeight: 18,
  },
  contactIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: T.text3,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  faqList: {
    gap: 12,
    marginBottom: 20,
  },
  faqCard: {
    backgroundColor: T.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: T.border,
    ...CARD_SHADOW,
  },
  faqQuestionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 8,
  },
  faqIcon: {
    marginTop: 1,
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: "700",
    color: T.text1,
    flex: 1,
    lineHeight: 20,
  },
  faqAnswer: {
    fontSize: 14,
    color: T.text2,
    paddingLeft: 30,
    lineHeight: 20,
  },
  footer: {
    alignItems: "center",
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 11,
    color: T.text3,
    fontWeight: "700",
  },
});
