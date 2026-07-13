import React, { useEffect, useRef } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, Pressable,
  Animated, Dimensions, StyleSheet, Platform, Alert
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";
import { useAuthStore } from "@/store/authStore";

interface CompanySidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const { width } = Dimensions.get("window");
const SIDEBAR_WIDTH = Math.min(width * 0.78, 300);

const T = {
  bg: "#0A192F",          // deep navy panel
  surface: "#112240",     // slightly lighter navy for items
  active: "#1E3A8A",
  text: "#E2E8F0",
  textMuted: "#94A3B8",
  accent: "#60A5FA",
  border: "rgba(255,255,255,0.08)",
  error: "#F87171",
};

const NAV_ITEMS = [
  { name: "Dashboard",      icon: "view-dashboard-outline",   route: "/(company)/dashboard" },
  { name: "Bookings",       icon: "calendar-check-outline",   route: "/(company)/bookings" },
  { name: "Staff",          icon: "account-group-outline",    route: "/(company)/staff" },
  { name: "Messages",       icon: "message-outline",          route: "/(company)/messages" },
  { name: "Services",       icon: "briefcase-outline",        route: "/(company)/services" },
  { name: "Analytics",      icon: "chart-line",               route: "/(company)/analytics" },
  { name: "Payments",       icon: "credit-card-outline",      route: "/(company)/payments" },
  { name: "Coverage Areas", icon: "map-marker-outline",       route: "/(company)/coverage" },
  { name: "Reviews",        icon: "star-outline",             route: "/(company)/reviews" },
  { name: "Settings",       icon: "cog-outline",              route: "/(company)/settings" },
  { name: "Help & Support", icon: "help-circle-outline",      route: "/(company)/support" },
];

export default function CompanySidebar({ isOpen, onClose }: CompanySidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout, user } = useAuthStore();

  const translateX = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0,
          damping: 20,
          stiffness: 200,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: -SIDEBAR_WIDTH,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
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
    // Small delay so sidebar closes smoothly before navigation
    setTimeout(() => router.push(route as any), 50);
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={isOpen ? "auto" : "none"}>
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
              <MaterialCommunityIcons name="briefcase-check" size={20} color={T.accent} />
            </View>
            <View>
              <Text style={s.brandName}>ServiceFinder</Text>
              <Text style={s.brandRole}>Business Dashboard</Text>
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
              <Text style={s.userInitial}>
                {(user as any).fullName?.charAt(0)?.toUpperCase() ?? (user as any).name?.charAt(0)?.toUpperCase() ?? "U"}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.userName} numberOfLines={1}>
                {(user as any).fullName ?? (user as any).name ?? "Owner"}
              </Text>
              <Text style={s.userEmail} numberOfLines={1}>{user.email}</Text>
            </View>
          </View>
        )}

        <View style={s.divider} />

        {/* Nav Items */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.navList}
          bounces={false}
        >
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.route || pathname.startsWith(item.route.replace("(tabs)/", ""));
            return (
              <TouchableOpacity
                key={item.route}
                onPress={() => navigate(item.route)}
                style={[s.navItem, isActive && s.navItemActive]}
                activeOpacity={0.75}
              >
                <MaterialCommunityIcons
                  name={item.icon as any}
                  size={21}
                  color={isActive ? T.accent : T.textMuted}
                />
                <Text style={[s.navLabel, isActive && s.navLabelActive]}>
                  {item.name}
                </Text>
                {isActive && <View style={s.activeIndicator} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={s.divider} />

        {/* Logout */}
        <TouchableOpacity onPress={handleLogout} style={s.logoutBtn} activeOpacity={0.8}>
          <MaterialCommunityIcons name="logout" size={21} color={T.error} />
          <Text style={s.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  panel: {
    position: "absolute", top: 0, left: 0, bottom: 0,
    width: SIDEBAR_WIDTH,
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
  brandRole: { fontSize: 11, fontWeight: "500", color: T.textMuted, marginTop: 1 },
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
