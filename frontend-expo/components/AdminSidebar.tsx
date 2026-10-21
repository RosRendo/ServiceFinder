import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Pressable,
  Animated,
  Dimensions,
  StyleSheet,
  Platform,
  Alert,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/store/authStore";
import { Theme } from "@/constants/theme";

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const { width } = Dimensions.get("window");
const SIDEBAR_WIDTH = Math.min(width * 0.82, 320);

const T = Theme.colors;

const NAV_SECTIONS = [
  {
    title: "EXECUTIVE COMMAND",
    items: [
      { key: "dashboard", label: "Cockpit Dashboard", icon: "view-dashboard-outline", route: "/(admin)/(tabs)/dashboard" },
      { key: "bookings",  label: "Global Bookings",   icon: "calendar-check-outline",  route: "/(admin)/bookings" },
      { key: "queue",     label: "KYC & Approvals",   icon: "shield-check-outline",    route: "/(admin)/(tabs)/queue", badge: "Action" },
      { key: "disputes",  label: "Escrow Mediation",  icon: "scale-balance",           route: "/(admin)/(tabs)/issues" },
      { key: "analytics", label: "Platform Analytics",icon: "chart-line",              route: "/(admin)/(tabs)/analytics" },
    ],
  },
  {
    title: "FINANCIAL GOVERNANCE",
    items: [
      { key: "payouts",  label: "Payout Batches",    icon: "bank-transfer",           route: "/(admin)/payouts" },
      { key: "refunds",  label: "Refunds Ledger",    icon: "cash-refund",             route: "/(admin)/refunds" },
    ],
  },
  {
    title: "RISK & COMPLIANCE",
    items: [
      { key: "auditLog",   label: "Audit Logs",        icon: "clipboard-text-clock",    route: "/(admin)/audit" },
      { key: "monitoring", label: "Infrastructure",    icon: "monitor-dashboard",       route: "/(admin)/monitoring" },
      { key: "moderation", label: "User Moderation",   icon: "shield-account-outline",  route: "/(admin)/moderation" },
      { key: "compliance", label: "Legal Compliance",  icon: "file-certificate-outline",route: "/(admin)/compliance" },
    ],
  },
  {
    title: "MARKETPLACE SETUP",
    items: [
      { key: "companies",   label: "Companies Directory", icon: "office-building",         route: "/(admin)/(tabs)/companies" },
      { key: "users",       label: "User Accounts",       icon: "account-group-outline",   route: "/(admin)/(tabs)/users" },
      { key: "categories",  label: "Categories",          icon: "shape-outline",           route: "/(admin)/categories" },
      { key: "serviceTypes",label: "Service Types",       icon: "briefcase-outline",       route: "/(admin)/service-types" },
      { key: "broadcasts",  label: "Broadcasts",          icon: "radio-tower",             route: "/(admin)/broadcasts" },
      { key: "promotions",  label: "Promo Codes",         icon: "ticket-percent-outline",  route: "/(admin)/promotions" },
      { key: "support",     label: "Support Desk",        icon: "ticket-confirmation-outline", route: "/(admin)/support" },
      { key: "settings",    label: "Operations Hub",      icon: "tune-variant",            route: "/(admin)/(tabs)/settings" },
    ],
  },
];

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  const { logout, user } = useAuthStore();

  const translateX = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.spring(translateX, { toValue: 0, damping: 22, stiffness: 220, useNativeDriver: true }),
        Animated.timing(backdropOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, { toValue: -SIDEBAR_WIDTH, duration: 220, useNativeDriver: true }),
        Animated.timing(backdropOpacity, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start();
    }
  }, [isOpen]);

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out of the admin panel?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          onClose();
          await logout();
        },
      },
    ]);
  };

  const navigate = (route: string) => {
    onClose();
    setTimeout(() => router.push(route as any), 60);
  };

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 9999 }]} pointerEvents={isOpen ? "auto" : "none"}>
      {/* Backdrop */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: backdropOpacity }]}>
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(10,25,47,0.55)" }]} onPress={onClose} />
      </Animated.View>

      {/* Sidebar Panel */}
      <Animated.View style={[s.panel, { transform: [{ translateX }] }]}>
        {/* Header */}
        <View style={s.panelHeader}>
          <View style={s.brandRow}>
            <View style={s.brandIcon}>
              <MaterialCommunityIcons name="shield-crown" size={20} color="#FFFFFF" />
            </View>
            <View>
              <Text style={s.brandName}>ServiceFinder</Text>
              <Text style={s.brandRole}>Enterprise Console</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={s.closeBtn}>
            <MaterialCommunityIcons name="close" size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* User Info */}
        {user && (
          <View style={s.userCard}>
            <View style={s.userAvatar}>
              <Text style={s.userInitial}>
                {(user as any).fullName?.charAt(0)?.toUpperCase() ??
                  (user as any).name?.charAt(0)?.toUpperCase() ??
                  "A"}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.userName} numberOfLines={1}>
                {(user as any).fullName ?? (user as any).name ?? "Administrator"}
              </Text>
              <Text style={s.userEmail} numberOfLines={1}>
                {user.email}
              </Text>
            </View>
          </View>
        )}

        {/* Categorized Nav Items */}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.navList} bounces={false}>
          {NAV_SECTIONS.map((section, sIdx) => (
            <View key={sIdx} style={s.navGroup}>
              <Text style={s.groupTitle}>{section.title}</Text>
              {section.items.map((item) => {
                const normalizedRoute = item.route.replace("(tabs)/", "");
                const normalizedPath = pathname.replace("(tabs)/", "");
                const isActive =
                  normalizedPath === normalizedRoute ||
                  normalizedPath.startsWith(normalizedRoute + "/");

                return (
                  <TouchableOpacity
                    key={item.route}
                    onPress={() => navigate(item.route)}
                    style={[s.navItem, isActive && s.navItemActive]}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={item.label}
                    accessibilityState={{ selected: isActive }}
                  >
                    <MaterialCommunityIcons
                      name={item.icon as any}
                      size={20}
                      color={isActive ? "#0F172A" : "#64748B"}
                    />
                    <Text style={[s.navLabel, isActive && s.navLabelActive]}>{item.label}</Text>
                    {item.badge && (
                      <View style={s.badgePill}>
                        <Text style={s.badgeText}>{item.badge}</Text>
                      </View>
                    )}
                    {isActive && <View style={s.activeIndicator} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </ScrollView>

        <View style={s.divider} />

        {/* Logout */}
        <TouchableOpacity
          onPress={handleLogout}
          style={s.logoutBtn}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t("common.signOut", "Sign Out")}
        >
          <MaterialCommunityIcons name="logout" size={20} color="#DC2626" />
          <Text style={s.logoutText}>{t("common.signOut", "Sign Out")}</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  panel: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: "#FFFFFF",
    paddingTop: Platform.OS === "android" ? 40 : 54,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    ...Platform.select({
      ios: { shadowColor: "#0F172A", shadowOffset: { width: 4, height: 0 }, shadowOpacity: 0.15, shadowRadius: 24 },
      android: { elevation: 16 },
    }),
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
  },
  brandName: { fontSize: 16, fontWeight: "900", color: "#0F172A", letterSpacing: -0.3 },
  brandRole: { fontSize: 11, fontWeight: "600", color: "#64748B" },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },

  userCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  userAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
  },
  userInitial: { fontSize: 15, fontWeight: "800", color: "#FFFFFF" },
  userName: { fontSize: 13, fontWeight: "700", color: "#0F172A" },
  userEmail: { fontSize: 11, fontWeight: "500", color: "#64748B", marginTop: 1 },

  navList: { paddingHorizontal: 12, paddingBottom: 16 },
  navGroup: { marginBottom: 16 },
  groupTitle: {
    fontSize: 10,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 0.8,
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 2,
    position: "relative",
  },
  navItemActive: { backgroundColor: "#F1F5F9" },
  navLabel: { fontSize: 13, fontWeight: "600", color: "#475569", flex: 1 },
  navLabelActive: { color: "#0F172A", fontWeight: "800" },
  badgePill: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: { fontSize: 9, fontWeight: "800", color: "#0F172A" },
  activeIndicator: {
    position: "absolute",
    left: 0,
    top: 6,
    bottom: 6,
    width: 3,
    borderRadius: 2,
    backgroundColor: "#0F172A",
  },

  divider: { height: 1, backgroundColor: "#E2E8F0", marginHorizontal: 16, marginVertical: 4 },

  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 26,
    paddingVertical: 14,
  },
  logoutText: { fontSize: 14, fontWeight: "700", color: "#DC2626" },
});
