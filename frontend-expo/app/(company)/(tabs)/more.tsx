/**
 * Company More Screen — Premium Redesign
 */
import React, { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity, Alert, StyleSheet, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSidebarStore } from "@/store/sidebarStore";
import { useAuthStore } from "@/store/authStore";
import MfaSetupModal from "@/components/admin/MfaSetupModal";

const T = {
  bg: "#FFFFFF", surface: "#FFFFFF", border: "#EBEBEB",
  accent: "#0A192F", accentMid: "#1E3A8A", accentLight: "#F7F7F7",
  text1: "#111827", text2: "#717171", text3: "#B0B0B0",
  error: "#E31C5F", errorBg: "#FEE2E2",
};

// Routes that require company verification
const PREMIUM_ROUTES = new Set([
  "/(company)/analytics",
  "/(company)/payments",
  "/(company)/subscription",
  "/(company)/coverage",
]);

type IconName = string;

interface MenuItem {
  id: number;
  title: string;
  subtitle: string;
  icon: IconName;
  action: string;
  route?: string;
  accent?: string;
}

const MENU_GROUPS: { title: string; items: MenuItem[] }[] = [
  {
    title: "Business",
    items: [
      { id: 1, title: "Business Settings",      subtitle: "Company info & preferences",    icon: "cog-outline",           action: "route", route: "/(company)/settings" },
      { id: 2, title: "Services",               subtitle: "Manage your service listings",  icon: "briefcase-outline",     action: "route", route: "/(company)/services" },
      { id: 3, title: "Analytics & Reports",    subtitle: "Performance data & insights",   icon: "chart-box-outline",     action: "route", route: "/(company)/analytics" },
      { id: 4, title: "Payments & Payouts",     subtitle: "Earnings and payout history",   icon: "credit-card-outline",   action: "route", route: "/(company)/payments" },
      { id: 12, title: "Subscription & Billing", subtitle: "Manage your plan and billing", icon: "star-circle-outline",   action: "route", route: "/(company)/subscription" },
    ],
  },
  {
    title: "Team",
    items: [
      { id: 5, title: "Staff Management",       subtitle: "View and manage your team",     icon: "account-group-outline", action: "route", route: "/(company)/(tabs)/staff" },
      { id: 6, title: "Coverage Areas",         subtitle: "Manage service locations",      icon: "map-marker-outline",    action: "route", route: "/(company)/coverage" },
    ],
  },
  {
    title: "Support",
    items: [
      { id: 7, title: "Help & Support",         subtitle: "Get help and contact us",       icon: "help-circle-outline",   action: "route", route: "/(company)/support" },
      { id: 8, title: "Reviews",                subtitle: "Customer feedback & ratings",   icon: "star-outline",          action: "route", route: "/(company)/reviews" },
    ],
  },
  {
    title: "Account & Security",
    items: [
      { id: 21, title: "Personal Profile", subtitle: "Name, email & phone", icon: "account-edit-outline", action: "route", route: "/(company)/edit-profile" },
      { id: 22, title: "Change Password", subtitle: "Update your password", icon: "lock-reset", action: "route", route: "/(company)/change-password" },
      { id: 13, title: "Two-Factor Auth",       subtitle: "Enhance account security",      icon: "shield-lock-outline",   action: "mfa" },
    ],
  },
  {
    title: "Legal",
    items: [
      { id: 9,  title: "Terms of Service",      subtitle: "Read our terms",                icon: "file-document-outline", action: "alert", accent: undefined },
      { id: 10, title: "Privacy Policy",        subtitle: "How we use your data",          icon: "shield-outline",        action: "alert", accent: undefined },
      { id: 11, title: "About ServiceFinder",   subtitle: "Version 2.4.0 · © 2025",       icon: "information-outline",   action: "alert", accent: undefined },
    ],
  },
];

export default function MoreScreen() {
  const router = useRouter();
  const setCompanyOpen = useSidebarStore((s) => s.setCompanyOpen);
  const [mfaModalVisible, setMfaModalVisible] = useState(false);
  const { logout, user } = useAuthStore();
  // Company verification status from auth store
  const isVerified = (user as any)?.company?.verificationStatus === "verified";

  const handlePress = (item: MenuItem) => {
    if (item.action === "route" && item.route) {
      // Guard premium routes for unverified companies
      if (!isVerified && PREMIUM_ROUTES.has(item.route)) {
        Alert.alert(
          "Verification Required",
          "Your company must be verified before accessing this feature. Complete your verification to unlock all features.",
          [
            { text: "Not Now", style: "cancel" },
            { text: "Get Verified", onPress: () => router.push("/(company)/settings" as any) },
          ]
        );
        return;
      }
      router.push(item.route as any);
    } else if (item.action === "mfa") {
      setMfaModalVisible(true);
    } else {
      Alert.alert(item.title, item.subtitle);
    }
  };

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await logout?.();
        },
      },
    ]);
  };

  return (
    <>
      <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => setCompanyOpen(true)} style={s.menuBtn}>
            <MaterialCommunityIcons name="menu" size={28} color={T.accent} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>More</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
          {MENU_GROUPS.map((group) => (
            <View key={group.title} style={s.menuGroup}>
              <Text style={s.groupLabel}>{group.title.toUpperCase()}</Text>
              <View style={s.groupCard}>
                {group.items.map((item, idx) => (
                  <React.Fragment key={item.id}>
                    <TouchableOpacity
                      onPress={() => handlePress(item)}
                      style={s.menuRow}
                      activeOpacity={0.75}
                    >
                      <View style={[
                        s.menuIconBox,
                        (!isVerified && item.route && PREMIUM_ROUTES.has(item.route)) && { backgroundColor: "#FEF3C7" }
                      ]}>
                        <MaterialCommunityIcons
                          name={(!isVerified && item.route && PREMIUM_ROUTES.has(item.route)) ? "lock-outline" as any : item.icon as any}
                          size={22}
                          color={(!isVerified && item.route && PREMIUM_ROUTES.has(item.route)) ? "#92400E" : T.accentMid}
                        />
                      </View>
                      <View style={s.menuTextBlock}>
                        <Text style={[
                          s.menuTitle,
                          (!isVerified && item.route && PREMIUM_ROUTES.has(item.route)) && { color: T.text2 }
                        ]}>{item.title}</Text>
                        <Text style={s.menuSubtitle}>
                          {(!isVerified && item.route && PREMIUM_ROUTES.has(item.route))
                            ? "Verification required"
                            : item.subtitle}
                        </Text>
                      </View>
                      <MaterialCommunityIcons name="chevron-right" size={20} color={T.text3} />
                    </TouchableOpacity>
                    {idx < group.items.length - 1 && <View style={s.rowDivider} />}
                  </React.Fragment>
                ))}
              </View>
            </View>
          ))}

          {/* Logout */}
          <View style={s.menuGroup}>
            <TouchableOpacity onPress={handleLogout} style={[s.logoutRow]} activeOpacity={0.8}>
              <View style={[s.menuIconBox, { backgroundColor: T.errorBg }]}>
                <MaterialCommunityIcons name="logout" size={22} color={T.error} />
              </View>
              <Text style={[s.menuTitle, { color: T.error, flex: 1 }]}>Log Out</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color={T.error} />
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
      
      <MfaSetupModal
        visible={mfaModalVisible}
        onClose={() => setMfaModalVisible(false)}
        onSuccess={() => {
          setMfaModalVisible(false);
          Alert.alert("Success", "Two-Factor Authentication is now enabled.");
        }}
      />
    </>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 24, paddingVertical: 16, backgroundColor: T.surface,
    borderBottomWidth: 1, borderBottomColor: T.border,
  },
  menuBtn: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: T.accent },

  scrollContent: { padding: 24 },

  menuGroup: { marginBottom: 24 },
  groupLabel: { fontSize: 11, fontWeight: "800", color: T.text3, letterSpacing: 1.2, marginBottom: 10 },
  groupCard: {
    backgroundColor: T.surface, borderRadius: 16,
    borderWidth: 1, borderColor: T.border,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },

  menuRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 16, gap: 14 },
  menuIconBox: { width: 42, height: 42, borderRadius: 12, backgroundColor: T.accentLight, alignItems: "center", justifyContent: "center" },
  menuTextBlock: { flex: 1 },
  menuTitle: { fontSize: 15, fontWeight: "700", color: T.text1, marginBottom: 2 },
  menuSubtitle: { fontSize: 12, fontWeight: "500", color: T.text3 },
  rowDivider: { height: 1, backgroundColor: T.border, marginHorizontal: 16 },

  logoutRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: T.surface, borderRadius: 16,
    padding: 16, gap: 14, borderWidth: 1, borderColor: T.border,
  },
});
