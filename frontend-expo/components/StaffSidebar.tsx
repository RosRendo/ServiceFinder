import React, { useEffect, useRef } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, Pressable,
  Animated, Dimensions, StyleSheet, Platform, Alert,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";
import { useAuthStore } from "@/store/authStore";

interface StaffSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const { width } = Dimensions.get("window");
const SIDEBAR_WIDTH = Math.min(width * 0.78, 300);

const T = {
  bg: "#002045",
  surface: "#0A2E5A",
  active: "#1E3A8A",
  text: "#E2E8F0",
  textMuted: "#94A3B8",
  accent: "#60A5FA",
  border: "rgba(255,255,255,0.08)",
  error: "#F87171",
};

const NAV_GROUPS = [
  {
    group: "Daily Work",
    items: [
      { name: "Dashboard", icon: "view-dashboard-outline", route: "/(staff)/(tabs)/dashboard" },
      { name: "Schedule", icon: "calendar-outline", route: "/(staff)/(tabs)/schedule" },
      { name: "Messages", icon: "message-outline", route: "/(staff)/(tabs)/messages" },
    ],
  },
  {
    group: "Personal",
    items: [
      { name: "Profile",      icon: "account-outline",       route: "/(staff)/(tabs)/profile" },
      { name: "Wallet",       icon: "wallet",                route: "/(staff)/(tabs)/wallet" },
      { name: "Performance",  icon: "chart-line",            route: "/(staff)/performance" },
      { name: "Time Off",     icon: "beach",                 route: "/(staff)/timeoff" },
      { name: "Availability", icon: "calendar-check-outline",route: "/(staff)/availability" },
    ],
  },
  {
    group: "AI Tools",
    items: [
      { name: "AI Assistant", icon: "robot-outline", route: "/(staff)/ai/ai" },
    ],
  },
];

export default function StaffSidebar({ isOpen, onClose }: StaffSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout, user } = useAuthStore();

  const translateX = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.spring(translateX, { toValue: 0, damping: 20, stiffness: 200, useNativeDriver: true }),
        Animated.timing(backdropOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, { toValue: -SIDEBAR_WIDTH, duration: 220, useNativeDriver: true }),
        Animated.timing(backdropOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [isOpen]);

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          onClose();
          await logout();
          router.replace("/(public)/login" as any);
        },
      },
    ]);
  };

  const navigate = (route: string) => {
    onClose();
    setTimeout(() => router.push(route as any), 50);
  };

  const isActive = (route: string) => {
    const normalized = route.replace("(tabs)/", "");
    const currentNorm = pathname.replace("(tabs)/", "");
    return currentNorm === normalized || currentNorm.startsWith(normalized + "/");
  };

  const userInitial =
    (user as any)?.fullName?.charAt(0)?.toUpperCase() ??
    (user as any)?.name?.charAt(0)?.toUpperCase() ?? "S";
  const userName = (user as any)?.fullName ?? (user as any)?.name ?? "Staff Member";

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 9999 }]} pointerEvents={isOpen ? "auto" : "none"}>
      {/* Backdrop */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: backdropOpacity }]}>
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.6)" }]} onPress={onClose} />
      </Animated.View>

      {/* Sidebar Panel */}
      <Animated.View style={[s.panel, { transform: [{ translateX }] }]}>
        {/* Header */}
        <View style={s.panelHeader}>
          <View style={s.brandRow}>
            <View style={s.brandIcon}>
              <MaterialCommunityIcons name="briefcase-account" size={20} color={T.accent} />
            </View>
            <View>
              <Text style={s.brandName}>ServiceFinder</Text>
              <Text style={s.brandRole}>Staff Portal</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={s.closeBtn}>
            <MaterialCommunityIcons name="close" size={22} color={T.textMuted} />
          </TouchableOpacity>
        </View>

        {/* User Info */}
        {user && (
          <View style={s.userCard}>
            <View style={s.userAvatar}>
              <Text style={s.userInitial}>{userInitial}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.userName} numberOfLines={1}>{userName}</Text>
              <Text style={s.userEmail} numberOfLines={1}>{user.email}</Text>
            </View>
          </View>
        )}

        <View style={s.divider} />

        {/* Nav Groups */}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.navList} bounces={false}>
          {NAV_GROUPS.map((group) => (
            <View key={group.group}>
              <Text style={s.groupLabel}>{group.group.toUpperCase()}</Text>
              {group.items.map((item) => {
                const active = isActive(item.route);
                return (
                  <TouchableOpacity
                    key={item.route}
                    onPress={() => navigate(item.route)}
                    style={[s.navItem, active && s.navItemActive]}
                    activeOpacity={0.75}
                  >
                    {active && <View style={s.activeIndicator} />}
                    <MaterialCommunityIcons name={item.icon as any} size={21} color={active ? T.accent : T.textMuted} />
                    <Text style={[s.navLabel, active && s.navLabelActive]}>{item.name}</Text>
                  </TouchableOpacity>
                );
              })}
              <View style={s.groupDivider} />
            </View>
          ))}
        </ScrollView>

        {/* Logout */}
        <TouchableOpacity onPress={handleLogout} style={s.logoutBtn} activeOpacity={0.8}>
          <MaterialCommunityIcons name="logout" size={21} color={T.error} />
          <Text style={s.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  panel: {
    position: "absolute", top: 0, left: 0, bottom: 0, width: SIDEBAR_WIDTH,
    backgroundColor: T.bg,
    paddingTop: Platform.OS === "android" ? 40 : 56,
    paddingBottom: Platform.OS === "ios" ? 34 : 24,
  },
  panelHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingBottom: 16,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  brandIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "rgba(96,165,250,0.12)",
    alignItems: "center", justifyContent: "center",
  },
  brandName: { fontSize: 15, fontWeight: "800", color: T.text },
  brandRole: { fontSize: 11, fontWeight: "500", color: T.accent, marginTop: 1 },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: T.surface, alignItems: "center", justifyContent: "center",
  },

  userCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    marginHorizontal: 16, marginBottom: 16,
    backgroundColor: T.surface, borderRadius: 14, padding: 12,
  },
  userAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: T.active, alignItems: "center", justifyContent: "center",
  },
  userInitial: { fontSize: 16, fontWeight: "800", color: "#fff" },
  userName: { fontSize: 14, fontWeight: "700", color: T.text },
  userEmail: { fontSize: 11, fontWeight: "500", color: T.textMuted, marginTop: 2 },

  divider: { height: 1, backgroundColor: T.border, marginHorizontal: 16, marginVertical: 8 },
  groupDivider: { height: 1, backgroundColor: T.border, marginHorizontal: 12, marginTop: 8, marginBottom: 12 },
  groupLabel: {
    fontSize: 10, fontWeight: "700", color: T.textMuted,
    letterSpacing: 1.2, paddingHorizontal: 14, marginBottom: 4,
  },

  navList: { paddingHorizontal: 12, paddingVertical: 4 },
  navItem: {
    flexDirection: "row", alignItems: "center", gap: 14,
    paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12,
    marginBottom: 2, position: "relative",
  },
  navItemActive: { backgroundColor: "rgba(96,165,250,0.10)" },
  navLabel: { fontSize: 14, fontWeight: "600", color: T.textMuted, flex: 1 },
  navLabelActive: { color: T.accent, fontWeight: "700" },
  activeIndicator: {
    position: "absolute", left: 0, top: 8, bottom: 8,
    width: 3, borderRadius: 2, backgroundColor: T.accent,
  },

  logoutBtn: {
    flexDirection: "row", alignItems: "center", gap: 14,
    paddingHorizontal: 26, paddingVertical: 16,
  },
  logoutText: { fontSize: 14, fontWeight: "700", color: T.error },
});
