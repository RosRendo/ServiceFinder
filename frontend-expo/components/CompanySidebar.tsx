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
import { useAuthStore } from "@/store/authStore";

interface CompanySidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const { width } = Dimensions.get("window");
const SIDEBAR_WIDTH = Math.min(width * 0.82, 320);

interface NavSection {
  title: string;
  items: {
    name: string;
    icon: string;
    route: string;
    badge?: string;
    isTab?: boolean;
  }[];
}

const CORE_TABS = [
  { name: "Cockpit",  icon: "view-dashboard",  route: "/(company)/(tabs)/dashboard" },
  { name: "Dispatch", icon: "radar",           route: "/(company)/(tabs)/operations" },
  { name: "Crew",     icon: "account-group",   route: "/(company)/(tabs)/staff" },
  { name: "Finance",  icon: "currency-usd",    route: "/(company)/(tabs)/finance" },
];

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Operations & Fleet",
    items: [
      { name: "Customer Messages",   icon: "message-text-outline",     route: "/(company)/(tabs)/messages", badge: "Live" },
      { name: "Service Offerings",   icon: "briefcase-outline",        route: "/(company)/services" },
      { name: "Coverage Zones",      icon: "map-marker-radius-outline",route: "/(company)/coverage" },
      { name: "Available Pool Jobs", icon: "hand-pointing-right",      route: "/(company)/available-jobs" },
    ],
  },
  {
    title: "Growth & Performance",
    items: [
      { name: "Analytics & Trends",  icon: "chart-line",               route: "/(company)/analytics" },
      { name: "Customer Reviews",    icon: "star-outline",             route: "/(company)/reviews" },
      { name: "Marketing & Promos",  icon: "bullhorn-outline",         route: "/(company)/marketing" },
    ],
  },
  {
    title: "Governance & Account",
    items: [
      { name: "Escrow Disputes",     icon: "scale-balance",            route: "/(company)/disputes" },
      { name: "Company Settings",    icon: "cog-outline",              route: "/(company)/settings" },
      { name: "Billing & Tier",      icon: "credit-card-outline",      route: "/(company)/subscription" },
      { name: "Dispatch Support",    icon: "help-circle-outline",      route: "/(company)/support" },
    ],
  },
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
        Animated.spring(translateX, { toValue: 0, damping: 24, stiffness: 240, useNativeDriver: true }),
        Animated.timing(backdropOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, { toValue: -SIDEBAR_WIDTH, duration: 200, useNativeDriver: true }),
        Animated.timing(backdropOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [isOpen]);

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to end this company session?", [
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
    setTimeout(() => {
      router.push(route as any);
    }, 80);
  };

  return (
    <View
      style={[StyleSheet.absoluteFill, { zIndex: 9999 }]}
      pointerEvents={isOpen ? "auto" : "none"}
    >
      {/* Dimmed Backdrop */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: backdropOpacity }]}>
        <Pressable
          style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(10, 25, 47, 0.45)" }]}
          onPress={onClose}
        />
      </Animated.View>

      {/* Slideout Panel */}
      <Animated.View style={[styles.panel, { transform: [{ translateX }] }]}>
        {/* Top Header Card */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.brandIconWrap}>
              <MaterialCommunityIcons name="briefcase-check" size={20} color="#0A192F" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.nameWithBadge}>
                <Text style={styles.brandName} numberOfLines={1}>
                  {(user as any)?.company?.name || "ServiceFinder"}
                </Text>
                <MaterialCommunityIcons name="shield-check" size={15} color="#0284C7" />
              </View>
              <View style={styles.statusPill}>
                <View style={styles.greenPulseDot} />
                <Text style={styles.statusPillText}>Shift Active · Online</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close menu">
            <MaterialCommunityIcons name="close" size={18} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* Core Tab Quick Bar */}
        <View style={styles.quickBar}>
          <Text style={styles.quickBarTitle}>ACTIVE TAB SWITCHER</Text>
          <View style={styles.quickBarRow}>
            {CORE_TABS.map((tab) => {
              const isActive = pathname === tab.route || pathname.includes(tab.name.toLowerCase());
              return (
                <TouchableOpacity
                  key={tab.name}
                  onPress={() => navigate(tab.route)}
                  style={[styles.quickTabBtn, isActive && styles.quickTabBtnActive]}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name={tab.icon as any}
                    size={16}
                    color={isActive ? "#0A192F" : "#64748B"}
                  />
                  <Text style={[styles.quickTabLabel, isActive && styles.quickTabLabelActive]}>
                    {tab.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Categorized Nav List */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollList}
          bounces={false}
        >
          {NAV_SECTIONS.map((section, sIdx) => (
            <View key={section.title} style={styles.sectionWrap}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {section.items.map((item) => {
                const isActive = pathname === item.route;
                return (
                  <TouchableOpacity
                    key={item.route}
                    onPress={() => navigate(item.route)}
                    style={[styles.navItem, isActive && styles.navItemActive]}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.navIconBox, isActive && styles.navIconBoxActive]}>
                      <MaterialCommunityIcons
                        name={item.icon as any}
                        size={18}
                        color={isActive ? "#0A192F" : "#475569"}
                      />
                    </View>
                    <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                      {item.name}
                    </Text>

                    {item.badge && (
                      <View style={styles.itemBadge}>
                        <Text style={styles.itemBadgeText}>{item.badge}</Text>
                      </View>
                    )}

                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={16}
                      color={isActive ? "#0A192F" : "#CBD5E1"}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </ScrollView>

        {/* Footer: User Account & Sign Out */}
        <View style={styles.footer}>
          <View style={styles.userCard}>
            <View style={styles.userAvatar}>
              <Text style={styles.userInitial}>
                {user?.fullName?.charAt(0)?.toUpperCase() ?? user?.name?.charAt(0)?.toUpperCase() ?? "O"}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName} numberOfLines={1}>
                {user?.fullName ?? user?.name ?? "Company Operator"}
              </Text>
              <Text style={styles.userEmail} numberOfLines={1}>
                {user?.email || "admin@company.com"}
              </Text>
            </View>
          </View>

          <View style={styles.footerActionRow}>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn} activeOpacity={0.75}>
              <MaterialCommunityIcons name="logout" size={16} color="#DC2626" />
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>

            <Text style={styles.versionTag}>v1.4.0 · OS</Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: "#FFFFFF",
    paddingTop: Platform.OS === "android" ? 44 : 58,
    ...Platform.select({
      ios: { shadowColor: "#0A192F", shadowOffset: { width: 4, height: 0 }, shadowOpacity: 0.16, shadowRadius: 24 },
      android: { elevation: 20 },
    }),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  brandIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  nameWithBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  brandName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.2,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  greenPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#059669",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  quickBar: {
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  quickBarTitle: {
    fontSize: 9,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  quickBarRow: {
    flexDirection: "row",
    gap: 6,
  },
  quickTabBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 2,
  },
  quickTabBtnActive: {
    backgroundColor: "#E2E8F0",
    borderColor: "#0A192F",
  },
  quickTabLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#64748B",
  },
  quickTabLabelActive: {
    color: "#0A192F",
    fontWeight: "800",
  },
  scrollList: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 24,
  },
  sectionWrap: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "800",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
    paddingHorizontal: 6,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 2,
    gap: 10,
  },
  navItemActive: {
    backgroundColor: "#F1F5F9",
  },
  navIconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  navIconBoxActive: {
    backgroundColor: "#FFFFFF",
    borderColor: "#CBD5E1",
  },
  navLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#334155",
    flex: 1,
  },
  navLabelActive: {
    color: "#0A192F",
    fontWeight: "800",
  },
  itemBadge: {
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  itemBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#0284C7",
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 30 : 16,
    backgroundColor: "#FFFFFF",
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    marginBottom: 10,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#0A192F",
    alignItems: "center",
    justifyContent: "center",
  },
  userInitial: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  userName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
  },
  userEmail: {
    fontSize: 10,
    color: "#64748B",
  },
  footerActionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
  },
  logoutText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#DC2626",
  },
  versionTag: {
    fontSize: 9,
    fontWeight: "600",
    color: "#94A3B8",
  },
});
