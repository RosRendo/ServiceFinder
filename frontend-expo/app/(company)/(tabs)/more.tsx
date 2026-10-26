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
import { Theme } from "@/constants/theme";

const T = Theme.colors;

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
    title: "Operations (What's happening today?)",
    items: [
      { id: 101, title: "Today's Booking",      subtitle: "Real-time job statuses",         icon: "calendar-today",        action: "route", route: "/(company)/(tabs)/dashboard" },
      { id: 102, title: "Pending Approval",     subtitle: "Bookings awaiting acceptance",   icon: "check-decagram-outline",action: "route", route: "/(company)/(tabs)/operations" },
      { id: 103, title: "Dispatch Staff",       subtitle: "Move jobs to available workers", icon: "truck-fast-outline",    action: "route", route: "/(company)/(tabs)/staff" },
      { id: 104, title: "Staff Availability",   subtitle: "Who is online right now",        icon: "account-clock-outline", action: "route", route: "/(company)/(tabs)/staff" },
      { id: 105, title: "Coverage",             subtitle: "Geofence / service radius",      icon: "map-marker-radius",     action: "route", route: "/(company)/coverage" },
      { id: 106, title: "Attendance",           subtitle: "Clock-in / Clock-out tracking",  icon: "fingerprint",           action: "soon" },
      { id: 107, title: "Schedules",            subtitle: "Shift planning",                 icon: "calendar-month-outline",action: "soon" },
      { id: 108, title: "Available Jobs",        subtitle: "Claim open pool bookings",       icon: "hand-pointing-right",   action: "route", route: "/(company)/available-jobs" },
    ],
  },
  {
    title: "Finance (How much money?)",
    items: [
      { id: 201, title: "Revenue",              subtitle: "Total incoming cash",            icon: "cash-multiple",         action: "route", route: "/(company)/payments" },
      { id: 202, title: "Salary",               subtitle: "Flat payouts for staff",         icon: "account-cash-outline",  action: "route", route: "/(company)/payments" },
      { id: 203, title: "Commission",           subtitle: "Split payouts for staff",        icon: "cash-percent",          action: "route", route: "/(company)/payments" },
      { id: 204, title: "Withdrawal",           subtitle: "Move money to bank",             icon: "bank-transfer-out",     action: "route", route: "/(company)/payments" },
    ],
  },
  {
    title: "Customer (Are customers happy?)",
    items: [
      { id: 301, title: "Escrow Disputes",      subtitle: "Mediation claims & defense",     icon: "scale-balance",         action: "route", route: "/(company)/disputes" },
      { id: 302, title: "Reviews",              subtitle: "Public feedback moderation",     icon: "star-half-full",        action: "route", route: "/(company)/reviews" },
      { id: 303, title: "Support",              subtitle: "Direct messaging with clients",  icon: "message-text-outline",  action: "route", route: "/(company)/support" },
      { id: 304, title: "Client CRM",           subtitle: "Search past customers & history",icon: "card-account-details-outline", action: "route", route: "/(company)/customers" },
    ],
  },
  {
    title: "Services (What are we selling?)",
    items: [
      { id: 401, title: "Catalog",              subtitle: "Create/edit service items",      icon: "format-list-bulleted",  action: "route", route: "/(company)/services" },
      { id: 402, title: "Pricing",              subtitle: "Base rates, peak surcharges",    icon: "tag-multiple-outline",  action: "route", route: "/(company)/services" },
      { id: 403, title: "Packages",             subtitle: "Bundles (e.g. 5x Cleaning)",     icon: "package-variant",       action: "route", route: "/(company)/services" },
    ],
  },
  {
    title: "Business (How is it configured?)",
    items: [
      { id: 501, title: "Branches",             subtitle: "Multi-location management — coming soon", icon: "storefront-outline", action: "soon" },
      { id: 502, title: "Subscription",         subtitle: "Platform fees/plans",            icon: "star-circle-outline",   action: "route", route: "/(company)/subscription" },
      { id: 503, title: "Company Profile",      subtitle: "Logos, tax info, HQ",            icon: "domain",                action: "route", route: "/(company)/settings" },
    ],
  },
  {
    title: "Analytics & Marketing",
    items: [
      { id: 601, title: "Growth",               subtitle: "Month-over-month user metrics",  icon: "chart-line",            action: "route", route: "/(company)/analytics" },
      { id: 602, title: "Performance",          subtitle: "Completion rates, job times",    icon: "chart-bar",             action: "route", route: "/(company)/analytics" },
      { id: 603, title: "Coupons",              subtitle: "Run flash sales & promotions",   icon: "ticket-percent-outline",action: "route", route: "/(company)/marketing" },
    ],
  },
  {
    title: "Security (Is the business safe?)",
    items: [
      { id: 701, title: "Password",             subtitle: "Account protection",             icon: "lock-outline",          action: "route", route: "/(company)/change-password" },
      { id: 702, title: "2FA",                  subtitle: "Multi-factor authentication",    icon: "shield-lock-outline",   action: "mfa" },
      { id: 703, title: "Legal",                subtitle: "TOS & Privacy policies",         icon: "scale-balance",         action: "route", route: "/(company)/settings" },
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
    } else if (item.action === "soon") {
      Alert.alert("Coming Soon", `${item.subtitle || item.title} isn't available in the app yet.`);
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
          <TouchableOpacity onPress={() => setCompanyOpen(true)} style={s.menuBtn} accessibilityRole="button" accessibilityLabel="Open menu">
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
                    accessibilityRole="button"
                    accessibilityLabel={`${item.title}. ${item.subtitle}`}
                  >
                    <View style={[
                      s.menuIconBox,
                      item.action === "soon" && { backgroundColor: "#F1F5F9" },
                      (!isVerified && item.route && PREMIUM_ROUTES.has(item.route)) && { backgroundColor: "#FEF3C7" }
                    ]}>
                      <MaterialCommunityIcons
                        name={item.action === "soon" ? "hourglass-empty" as any : (!isVerified && item.route && PREMIUM_ROUTES.has(item.route)) ? "lock-outline" as any : item.icon as any}
                        size={22}
                        color={item.action === "soon" ? T.text3 : (!isVerified && item.route && PREMIUM_ROUTES.has(item.route)) ? "#92400E" : T.accentMid}
                      />
                    </View>
                    <View style={s.menuTextBlock}>
                      <Text style={[
                        s.menuTitle,
                        item.action === "soon" && { color: T.text2 },
                        (!isVerified && item.route && PREMIUM_ROUTES.has(item.route)) && { color: T.text2 }
                      ]}>{item.title}</Text>
                      <Text style={s.menuSubtitle}>
                        {item.action === "soon"
                          ? "Coming soon"
                          : (!isVerified && item.route && PREMIUM_ROUTES.has(item.route))
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
            <TouchableOpacity onPress={handleLogout} style={[s.logoutRow]} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel="Log out of your account">
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
  headerTitle: { fontSize: 18, fontWeight: "700", color: T.accent },

  scrollContent: { padding: 24 },

  menuGroup: { marginBottom: 24 },
  groupLabel: { fontSize: 11, fontWeight: "700", color: T.text3, letterSpacing: 1.2, marginBottom: 10 },
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
