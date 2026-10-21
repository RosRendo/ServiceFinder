/**
 * Admin Operations Hub & Settings — Quiet Luxury Executive Standard
 * Centralizes governance, financial, and operational management.
 */
import React, { useState, useEffect } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSidebarStore } from "@/store/sidebarStore";
import { useAuthStore } from "@/store/authStore";
import api from "@/utils/api";
import MfaSetupModal from "@/components/admin/MfaSetupModal";
import { useTranslation } from "react-i18next";
import { Theme } from "@/constants/theme";
import ErrorState from "@/components/common/ErrorState";

const T = Theme.colors;

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: "#0F172A", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  android: { elevation: 2 },
});

export default function OperationsHub() {
  const router = useRouter();
  const openSidebar = useSidebarStore((s) => s.setAdminOpen);
  const { logout, user } = useAuthStore();
  const { t } = useTranslation();

  const [notifications, setNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);
  const [mfaModalVisible, setMfaModalVisible] = useState(false);
  const [hasError, setHasError] = useState(false);

  const fetchSettings = async () => {
    try {
      const prefsRes = await api.get("/api/users/me/preferences");
      const prefsData = prefsRes.data?.data || prefsRes.data;
      if (prefsData.pushNotificationsEnabled !== undefined) {
        setNotifications(prefsData.pushNotificationsEnabled);
      }
      if (prefsData.emailNotificationsEnabled !== undefined) {
        setEmailAlerts(prefsData.emailNotificationsEnabled);
      }
      setHasError(false);
    } catch (error) {
      console.error("Failed to fetch settings:", error);
      // Non-blocking fallback
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updatePreference = async (key: "pushNotificationsEnabled" | "emailNotificationsEnabled", value: boolean) => {
    try {
      if (key === "pushNotificationsEnabled") setNotifications(value);
      if (key === "emailNotificationsEnabled") setEmailAlerts(value);
      await api.patch("/api/users/me/preferences", { [key]: value });
    } catch (error) {
      console.error(`Failed to update ${key}:`, error);
      if (key === "pushNotificationsEnabled") setNotifications(!value);
      if (key === "emailNotificationsEnabled") setEmailAlerts(!value);
    }
  };

  const handleLogout = () => {
    Alert.alert(t("adminSettings.logOutTitle", "Log Out"), t("adminSettings.logOutConfirm", "Are you sure you want to end your executive session?"), [
      { text: t("adminSettings.cancel", "Cancel"), style: "cancel" },
      {
        text: t("adminSettings.logOutBtn", "Log Out"),
        style: "destructive",
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  const operationalSections = [
    {
      category: "FINANCIAL GOVERNANCE",
      items: [
        {
          label: "Payout Batches",
          subtitle: "Authorize service provider payouts & bank disbursements",
          icon: "bank-transfer",
          route: "/(admin)/payouts",
          badge: "Financial",
          color: "#0284C7",
        },
        {
          label: "Refunds Ledger",
          subtitle: "Customer refunds, chargebacks, and transaction reverses",
          icon: "cash-refund",
          route: "/(admin)/refunds",
          badge: "Ledger",
          color: "#0D9488",
        },
        {
          label: "Escrow Dispute Mediation",
          subtitle: "Arbitrate disputes and manage held funds",
          icon: "scale-balance",
          route: "/(admin)/(tabs)/issues",
          badge: "Mediation",
          color: "#EF4444",
        },
      ],
    },
    {
      category: "PLATFORM GOVERNANCE & TELEMETRY",
      items: [
        {
          label: "System Audit Logs",
          subtitle: "Immutable activity trail of admin & system actions",
          icon: "clipboard-text-clock",
          route: "/(admin)/audit",
          badge: "Security",
          color: "#6366F1",
        },
        {
          label: "Infrastructure Monitoring",
          subtitle: "Server health, API telemetry, database latencies",
          icon: "monitor-dashboard",
          route: "/(admin)/monitoring",
          badge: "Live",
          color: "#10B981",
        },
        {
          label: "Content & User Moderation",
          subtitle: "Flagged user profiles, reviews, and violation bans",
          icon: "shield-account-outline",
          route: "/(admin)/moderation",
          badge: "Safety",
          color: "#D97706",
        },
        {
          label: "Legal Compliance",
          subtitle: "Terms of service, privacy protocols, and regulatory filings",
          icon: "file-certificate-outline",
          route: "/(admin)/compliance",
          badge: "Legal",
          color: "#64748B",
        },
      ],
    },
    {
      category: "MARKETPLACE CONFIGURATION",
      items: [
        {
          label: "Global Bookings Ledger",
          subtitle: "Inspect active orders, customer bookings & job status",
          icon: "calendar-check-outline",
          route: "/(admin)/bookings",
          badge: "Orders",
          color: "#0F172A",
        },
        {
          label: "Platform User Accounts",
          subtitle: "Browse and govern all customer and provider profiles",
          icon: "account-multiple-outline",
          route: "/(admin)/(tabs)/users",
          badge: "Directory",
          color: "#3B82F6",
        },
        {
          label: "Service Categories",
          subtitle: "Manage categories, taxonomy, and icon assignments",
          icon: "shape-outline",
          route: "/(admin)/categories",
          badge: "Taxonomy",
          color: "#8B5CF6",
        },
        {
          label: "Service Specifications",
          subtitle: "Standardize service templates and pricing bounds",
          icon: "briefcase-outline",
          route: "/(admin)/service-types",
          badge: "Catalog",
          color: "#EC4899",
        },
      ],
    },
    {
      category: "MARKETING & COMMUNICATIONS",
      items: [
        {
          label: "Broadcast Announcements",
          subtitle: "Push mass notifications to users or providers",
          icon: "radio-tower",
          route: "/(admin)/broadcasts",
          badge: "Push",
          color: "#F97316",
        },
        {
          label: "Promotions & Vouchers",
          subtitle: "Discount campaigns, platform promo vouchers",
          icon: "ticket-percent-outline",
          route: "/(admin)/promotions",
          badge: "Campaigns",
          color: "#14B8A6",
        },
        {
          label: "Support Desk",
          subtitle: "Escalated user support tickets and live assistance",
          icon: "ticket-confirmation-outline",
          route: "/(admin)/support",
          badge: "Helpdesk",
          color: "#3B82F6",
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={s.root} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <TouchableOpacity onPress={() => openSidebar(true)} style={s.menuBtn}>
            <MaterialCommunityIcons name="menu" size={26} color="#0F172A" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Operations & Control</Text>
        </View>
      </View>

      <ScrollView
        style={s.scrollView}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Operations Hub Navigation Categories */}
        {operationalSections.map((section, sIdx) => (
          <View key={sIdx} style={s.section}>
            <Text style={s.sectionHeaderTitle}>{section.category}</Text>
            <View style={[s.sectionCard, CARD_SHADOW]}>
              {section.items.map((item, iIdx) => {
                const isLast = iIdx === section.items.length - 1;
                return (
                  <TouchableOpacity
                    key={iIdx}
                    style={[s.hubRow, !isLast && s.rowBorder]}
                    onPress={() => router.push(item.route as any)}
                    activeOpacity={0.7}
                  >
                    <View style={s.iconBox}>
                      <MaterialCommunityIcons name={item.icon as any} size={18} color="#0F172A" />
                    </View>
                    <View style={s.rowTextWrap}>
                      <Text style={s.rowTitle}>{item.label}</Text>
                      <Text style={s.rowSubtitle} numberOfLines={1}>
                        {item.subtitle}
                      </Text>
                    </View>
                    <View style={s.badgePill}>
                      <Text style={s.badgeText}>{item.badge}</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={16} color="#94A3B8" />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        {/* Security & Authentication */}
        <View style={s.section}>
          <Text style={s.sectionHeaderTitle}>EXECUTIVE SECURITY & PREFERENCES</Text>
          <View style={[s.sectionCard, CARD_SHADOW]}>
            {/* MFA Switch */}
            <View style={[s.hubRow, s.rowBorder]}>
              <View style={s.iconBox}>
                <MaterialCommunityIcons name="shield-key-outline" size={18} color="#0F172A" />
              </View>
              <View style={s.rowTextWrap}>
                <Text style={s.rowTitle}>Two-Factor Authentication (2FA)</Text>
                <Text style={s.rowSubtitle}>TOTP security codes for privileged actions</Text>
              </View>
              <Switch
                value={twoFactor}
                onValueChange={(val) => {
                  if (val) setMfaModalVisible(true);
                  else setTwoFactor(false);
                }}
                trackColor={{ false: "#E2E8F0", true: "#0F172A" }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Push Notifications */}
            <View style={[s.hubRow, s.rowBorder]}>
              <View style={s.iconBox}>
                <MaterialCommunityIcons name="bell-ring-outline" size={18} color="#0F172A" />
              </View>
              <View style={s.rowTextWrap}>
                <Text style={s.rowTitle}>Emergency Push Alerts</Text>
                <Text style={s.rowSubtitle}>Immediate device alerts for SLA breaches</Text>
              </View>
              <Switch
                value={notifications}
                onValueChange={(val) => updatePreference("pushNotificationsEnabled", val)}
                trackColor={{ false: "#E2E8F0", true: "#0F172A" }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Email Alerts */}
            <View style={s.hubRow}>
              <View style={s.iconBox}>
                <MaterialCommunityIcons name="email-check-outline" size={18} color="#0F172A" />
              </View>
              <View style={s.rowTextWrap}>
                <Text style={s.rowTitle}>Daily Executive Digest</Text>
                <Text style={s.rowSubtitle}>Summary of GMV, disputes, and verifications</Text>
              </View>
              <Switch
                value={emailAlerts}
                onValueChange={(val) => updatePreference("emailNotificationsEnabled", val)}
                trackColor={{ false: "#E2E8F0", true: "#0F172A" }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        {/* Danger Zone: Log Out */}
        <View style={s.section}>
          <View style={[s.sectionCard, CARD_SHADOW]}>
            <TouchableOpacity style={s.hubRow} activeOpacity={0.7} onPress={handleLogout}>
              <View style={[s.iconBox, { borderColor: "#FECACA" }]}>
                <MaterialCommunityIcons name="logout" size={18} color="#DC2626" />
              </View>
              <View style={s.rowTextWrap}>
                <Text style={[s.rowTitle, { color: "#DC2626" }]}>End Executive Session</Text>
                <Text style={s.rowSubtitle}>Safely log out of the admin cockpit</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={16} color="#DC2626" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* 2FA Setup Modal */}
      <MfaSetupModal
        visible={mfaModalVisible}
        onClose={() => setMfaModalVisible(false)}
        onSuccess={() => {
          setMfaModalVisible(false);
          setTwoFactor(true);
          Alert.alert("2FA Enabled", "Two-factor authentication is now active on your account.");
        }}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  menuBtn: { marginLeft: -6, padding: 6 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#0F172A", letterSpacing: -0.3 },

  scrollView: { flex: 1 },
  // paddingBottom: 120 guarantees content does not hide behind the floating tab bar
  scrollContent: { padding: 16, paddingBottom: 120, gap: 20 },

  section: { gap: 8 },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.6,
    paddingHorizontal: 4,
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
  },
  hubRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  rowTextWrap: { flex: 1, marginRight: 8 },
  rowTitle: { fontSize: 14, fontWeight: "700", color: "#0F172A", marginBottom: 2 },
  rowSubtitle: { fontSize: 12, color: "#64748B", fontWeight: "500" },
  badgePill: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 6,
  },
  badgeText: { fontSize: 10, fontWeight: "700", color: "#475569" },
});
