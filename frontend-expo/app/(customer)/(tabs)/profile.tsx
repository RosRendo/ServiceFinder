/**
 * Customer Profile Screen — Premium Redesign
 */
import React, { useRef } from "react";
import {
  ScrollView, Text, View, TouchableOpacity,
  Alert, StyleSheet, Animated, Pressable, Platform,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { useTranslation } from "react-i18next";
import { Theme } from "@/constants/theme";
import { GuestCTA } from "@/components/common/GuestCTA";

// ─── Design Tokens ──────────────────────────────────────────
const T = Theme.colors;

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10 },
  android: { elevation: 2 },
});
const HERO_SHADOW = Platform.select({
  ios: { shadowColor: '#0A192F', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 16 },
  android: { elevation: 8 },
});

// ─── PressRow component ──────────────────────────────────────
function PressRow({ onPress, children, style }: { onPress: () => void; children: React.ReactNode; style?: any }) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.timing(scale, { toValue: 0.98, duration: 80, useNativeDriver: true }).start();
  const pressOut = () => Animated.timing(scale, { toValue: 1, duration: 120, useNativeDriver: true }).start();
  return (
    <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut}>
      <Animated.View style={[{ transform: [{ scale }] }, style]}>{children}</Animated.View>
    </Pressable>
  );
}

// ─── Menu Group ─────────────────────────────────────────────
interface MenuItem {
  id: number;
  icon: any;
  title: string;
  subtitle: string;
  onPress: () => void;
  danger?: boolean;
  badge?: string;
}

function MenuGroup({ title, items }: { title: string; items: MenuItem[] }) {
  return (
    <View style={s.menuGroup}>
      <Text style={s.menuGroupTitle}>{title}</Text>
      <View style={[s.menuCard, CARD_SHADOW]}>
        {items.map((item, index) => (
          <PressRow key={item.id} onPress={item.onPress}>
            <View style={[s.menuRow, index < items.length - 1 && s.menuRowBorder]}>
              <View style={[s.menuIconBox, item.danger && s.menuIconBoxDanger]}>
                <MaterialCommunityIcons
                  name={item.icon}
                  size={20}
                  color={item.danger ? T.error : T.accent}
                />
              </View>
              <View style={s.menuRowContent}>
                <Text style={[s.menuRowTitle, item.danger && { color: T.error }]}>{item.title}</Text>
                <Text style={s.menuRowSubtitle} numberOfLines={1}>{item.subtitle}</Text>
              </View>
              {item.badge && (
                <View style={s.menuBadge}>
                  <Text style={s.menuBadgeText}>{item.badge}</Text>
                </View>
              )}
              <MaterialCommunityIcons name="chevron-right" size={20} color={T.text3} />
            </View>
          </PressRow>
        ))}
      </View>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────
export default function ProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, logout, isGuest } = useAuthStore();

  const avatarUrl = user?.avatar || (user
    ? `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(user.fullName || user.name || t('profile.guestUser'))}&backgroundColor=000000&textColor=ffffff`
    : `https://api.dicebear.com/9.x/initials/svg?seed=User`);

  const handleLogout = () => {
    Alert.alert(t('profile.alertLogoutTitle'), t('profile.alertLogoutMessage'), [
      { text: t('profile.alertCancel'), style: "cancel" },
      {
        text: t('profile.logOut'),
        style: "destructive",
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  const accountItems: MenuItem[] = [
    {
      id: 1, icon: "account-edit-outline", title: t('profile.editProfile'),
      subtitle: t('profile.editProfileSub'),
      onPress: () => router.push("/(customer)/edit-profile" as any),
    },
    {
      id: 2, icon: "map-marker-outline", title: t('profile.savedAddresses'),
      subtitle: t('profile.savedAddressesSub'),
      onPress: () => router.push("/(customer)/address" as any),
    },
    ...(user?.email ? [{
      id: 3, icon: "lock-reset", title: t('profile.changePassword'),
      subtitle: t('profile.changePasswordSub'),
      onPress: () => router.push("/(customer)/change-password" as any),
    } as MenuItem] : []),
  ];

  const preferenceItems: MenuItem[] = [
    {
      id: 4, icon: "bell-outline", title: t('profile.notificationSettings'),
      subtitle: t('profile.notificationSettingsSub'),
      onPress: () => router.push("/(customer)/settings" as any),
      badge: t('profile.newBadge'),
    },
    {
      id: 5, icon: "shield-lock-outline", title: t('profile.privacySecurity'),
      subtitle: t('profile.privacySecuritySub'),
      onPress: () => router.push("/(customer)/settings" as any),
    },
  ];

  const supportItems: MenuItem[] = [
    {
      id: 6, icon: "help-circle-outline", title: t('profile.helpSupport'),
      subtitle: t('profile.helpSupportSub'),
      onPress: () => Alert.alert("Support", "Contact us at support@servicefinder.app"),
    },
    {
      id: 7, icon: "star-outline", title: t('profile.rateApp'),
      subtitle: t('profile.rateAppSub'),
      onPress: () => Alert.alert("Rate Us", "Thanks for your support!"),
    },
    {
      id: 8, icon: "logout", title: t('profile.logOut'),
      subtitle: t('profile.logOutSub'),
      onPress: handleLogout,
      danger: true,
    },
  ];

  if (isGuest) {
    return <GuestCTA title="Log in to view profile" subtitle="Manage your account settings, addresses, and preferences by logging in." icon="account-outline" />;
  }

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>

        {/* ── HEADER ──────────────────────────────────────────── */}
        <View style={s.header}>
          <Text style={s.headerTitle}>{t('profile.title')}</Text>
          <TouchableOpacity style={s.headerSettingsBtn} onPress={() => router.push("/(customer)/settings" as any)}>
            <MaterialCommunityIcons name="cog-outline" size={22} color={T.text1} />
          </TouchableOpacity>
        </View>

        {/* ── HERO CARD ────────────────────────────────────────── */}
        <View style={s.heroPad}>
          <View style={[s.heroCard, HERO_SHADOW]}>
            {/* Background decorative circles */}
            <View style={s.heroCircle1} />
            <View style={s.heroCircle2} />

            <View style={s.heroContent}>
              {/* Avatar */}
              <View style={s.avatarWrap}>
                <Image source={{ uri: avatarUrl }} style={s.avatar} />
                <TouchableOpacity
                  style={s.avatarEdit}
                  onPress={() => router.push("/(customer)/edit-profile" as any)}
                >
                  <MaterialCommunityIcons name="pencil" size={12} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* User info */}
              <View style={s.heroInfo}>
                <Text style={s.heroName} numberOfLines={1}>{user?.fullName || user?.name || t('profile.guestUser')}</Text>
                <Text style={s.heroEmail} numberOfLines={1}>{user?.email || ""}</Text>
                {user?.role && (
                  <View style={s.roleBadge}>
                    <Text style={s.roleBadgeText}>{user.role.toUpperCase()}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Stats strip */}
            <View style={s.statsStrip}>
              <TouchableOpacity
                style={[s.statItem, s.statItemBorder]}
                onPress={() => router.push("/(customer)/(tabs)/activity" as any)}
              >
                <MaterialCommunityIcons name="calendar-check" size={20} color="rgba(255,255,255,0.8)" />
                <Text style={s.statValue}>—</Text>
                <Text style={s.statLabel}>{t('profile.bookings')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.statItem, s.statItemBorder]}
                onPress={() => router.push("/(customer)/reviews" as any)}
              >
                <MaterialCommunityIcons name="star" size={20} color="rgba(255,255,255,0.8)" />
                <Text style={s.statValue}>—</Text>
                <Text style={s.statLabel}>{t('profile.reviews')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.statItem}
                onPress={() => router.push("/(customer)/saved" as any)}
              >
                <MaterialCommunityIcons name="heart" size={20} color="rgba(255,255,255,0.8)" />
                <Text style={s.statValue}>—</Text>
                <Text style={s.statLabel}>{t('profile.saved')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── MENU GROUPS ──────────────────────────────────────── */}
        <MenuGroup title={t('profile.groupAccount')} items={accountItems} />
        <MenuGroup title={t('profile.groupPreferences')} items={preferenceItems} />
        <MenuGroup title={t('profile.groupSupport')} items={supportItems} />

        {/* ── VERSION ──────────────────────────────────────────── */}
        <Text style={s.version}>ServiceFinder v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 24, paddingTop: 8, paddingBottom: 16,
  },
  headerTitle: { fontSize: 28, fontWeight: "800", color: T.text1, letterSpacing: -0.5 },
  headerSettingsBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: T.surface,
    alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: T.border,
  },

  heroPad: { paddingHorizontal: 24, marginBottom: 8 },
  heroCard: {
    backgroundColor: T.accent, borderRadius: 24, overflow: "hidden", borderWidth: 1, borderColor: T.border
  },
  heroCircle1: {
    position: "absolute", width: 200, height: 200, borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.05)", right: -60, top: -60,
  },
  heroCircle2: {
    position: "absolute", width: 120, height: 120, borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.05)", left: -30, bottom: -40,
  },
  heroContent: { flexDirection: "row", alignItems: "center", padding: 24, gap: 20 },
  avatarWrap: { position: "relative" },
  avatar: {
    width: 76, height: 76, borderRadius: 38,
    borderWidth: 3, borderColor: "rgba(255,255,255,0.3)",
  },
  avatarEdit: {
    position: "absolute", bottom: 0, right: 0,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: T.accentMid, alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: T.accent,
  },
  heroInfo: { flex: 1 },
  heroName: { fontSize: 20, fontWeight: "800", color: "#fff", letterSpacing: -0.3 },
  heroEmail: { fontSize: 13, color: "rgba(255,255,255,0.65)", marginTop: 4, fontWeight: "500" },
  roleBadge: {
    alignSelf: "flex-start", marginTop: 10,
    backgroundColor: "rgba(255,255,255,0.15)", paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20,
  },
  roleBadgeText: { fontSize: 10, fontWeight: "800", color: "#fff", letterSpacing: 1 },

  statsStrip: {
    flexDirection: "row", borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.12)",
    paddingVertical: 16,
  },
  statItem: { flex: 1, alignItems: "center", gap: 4 },
  statItemBorder: { borderRightWidth: 1, borderRightColor: "rgba(255,255,255,0.12)" },
  statValue: { fontSize: 18, fontWeight: "800", color: "#fff" },
  statLabel: { fontSize: 10, fontWeight: "700", color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: 0.5 },

  menuGroup: { marginTop: 24, paddingHorizontal: 24 },
  menuGroupTitle: { fontSize: 12, fontWeight: "700", color: T.text3, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12, marginLeft: 8 },
  menuCard: { backgroundColor: T.surface, borderRadius: 20, overflow: "hidden", borderWidth: 1, borderColor: T.border },
  menuRow: { flexDirection: "row", alignItems: "center", padding: 16, gap: 16 },
  menuRowBorder: { borderBottomWidth: 1, borderBottomColor: T.border },
  menuIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: T.accentLight, alignItems: "center", justifyContent: "center" },
  menuIconBoxDanger: { backgroundColor: "rgba(239,68,68,0.1)" },
  menuRowContent: { flex: 1 },
  menuRowTitle: { fontSize: 15, fontWeight: "600", color: T.text1, marginBottom: 2 },
  menuRowSubtitle: { fontSize: 13, color: T.text3 },
  menuBadge: { backgroundColor: T.error, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginRight: 8 },
  menuBadgeText: { fontSize: 10, fontWeight: "800", color: "#fff" },

  version: { textAlign: "center", marginTop: 40, fontSize: 12, color: T.text3, fontWeight: "500" },
});