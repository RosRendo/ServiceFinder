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

export default function Help() {
  const { t } = useTranslation();
  const openSidebar = useSidebarStore((s) => s.setAdminOpen);

  const faqs = [
    {
      q: "How do I review and verify a new business application?",
      a: "Navigate to the 'Approvals' queue tab. Tap any pending enterprise dossier to inspect their legal registration, tax IDs, and uploaded documents before approving or rejecting.",
    },
    {
      q: "How does the platform handle dispute arbitration?",
      a: "Open the Issues triage console or Disputes registry. You can inspect claimant claims, provider evidence, and escrow holds, then issue a two-step arbitrated payout or refund.",
    },
    {
      q: "How are platform commission fees deducted?",
      a: "Platform commission fees are automatically collected during custodial escrow hold at the time of customer booking and finalized upon disbursement approval.",
    },
    {
      q: "How can I suspend or discipline an abusive user account?",
      a: "Access the Users directory, locate the user dossier, and utilize the Compliance Enforcement console to instantly restrict, suspend, or ban the target identity.",
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
          onPress={() => openSidebar(true)}
          style={s.menuBtn}
        >
          <MaterialCommunityIcons name="menu" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Operations Handbook</Text>
      </View>

      <ScrollView style={s.scrollView} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Urgent Engineering Contact */}
        <TouchableOpacity 
          onPress={handleSupportEmail}
          style={s.contactCard}
          activeOpacity={0.85}
        >
          <View style={s.contactLeft}>
            <Text style={s.contactTitle}>Engineering Support Escalation</Text>
            <Text style={s.contactDesc}>
              For infrastructure disruptions, database irregularities, or critical security vulnerabilities, dispatch an incident report directly to engineering.
            </Text>
            <View style={s.emailTag}>
              <MaterialCommunityIcons name="email-fast-outline" size={14} color="#FFFFFF" />
              <Text style={s.emailTagText}>support@servicefinder.com</Text>
            </View>
          </View>
        </TouchableOpacity>

        <Text style={s.sectionTitle}>
          Standard Operating Procedures
        </Text>

        <View style={s.faqList}>
          {faqs.map((faq, index) => (
            <View key={index} style={s.faqCard}>
              <View style={s.faqQuestionRow}>
                <MaterialCommunityIcons name="file-document-outline" size={18} color="#0F172A" style={s.faqIcon} />
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
            ServiceFinder Cockpit · Enterprise Operations Edition
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    gap: 10,
  },
  menuBtn: { marginLeft: -6, padding: 6 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A", letterSpacing: -0.3 },

  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 120 },

  contactCard: {
    backgroundColor: "#0F172A",
    borderRadius: 12,
    padding: 18,
    marginBottom: 24,
  },
  contactLeft: { flex: 1 },
  contactTitle: { fontSize: 15, fontWeight: "700", color: "#FFFFFF", marginBottom: 6 },
  contactDesc: { fontSize: 13, color: "#94A3B8", lineHeight: 18, marginBottom: 12 },
  emailTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  emailTagText: { color: "#FFFFFF", fontSize: 12, fontWeight: "600" },

  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  faqList: { gap: 10, marginBottom: 20 },
  faqCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  faqQuestionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 8,
  },
  faqIcon: { marginTop: 1 },
  faqQuestion: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    flex: 1,
    lineHeight: 19,
  },
  faqAnswer: {
    fontSize: 13,
    color: "#475569",
    paddingLeft: 26,
    lineHeight: 19,
  },
  footer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "600",
  },
});
