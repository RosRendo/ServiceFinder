import React, { useState, useEffect } from "react";
import { Image } from "expo-image";
import { ScrollView, Text, View, TouchableOpacity, Alert, ActivityIndicator, StyleSheet, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuthStore, api } from "@/store/authStore";
import MfaSetupModal from "@/components/admin/MfaSetupModal";
import { useTranslation } from "react-i18next";
import { useSidebarStore } from "@/store/sidebarStore";

import { Theme } from "@/constants/theme";

const T = Theme.colors;

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  android: { elevation: 2 },
});

export default function ProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const setStaffOpen = useSidebarStore((s) => s.setStaffOpen);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [mfaModalVisible, setMfaModalVisible] = useState(false);
  
  const [earned, setEarned] = useState<number>(0);
  const [jobs, setJobs] = useState<number>(0);
  const [wallet, setWallet] = useState<number>(0);
  const [creditLimit, setCreditLimit] = useState<number>(0);

  const [staffData] = useState({
    name: t('staffProfile.staff'),
    role: t('staffProfile.serviceProfessional'),
    avatar: "https://ui-avatars.com/api/?name=Staff",
    rating: 0,
    jobs: 0,
    earned: "$0.00",
    endorsements: [
      { id: 1, title: t('staffProfile.expertProfessional'), icon: "briefcase-check" },
      { id: 2, title: t('staffProfile.reliable'), icon: "shield-check" },
      { id: 3, title: t('staffProfile.fiveStarService'), icon: "star" },
    ],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user?.id) return;
        const res = await api.get(`/api/users/${user.id}`);
        setProfile(res.data?.user || res.data?.data || res.data);

        // Fetch earnings and jobs
        const payoutsRes = await api.get("/api/staff/payouts");
        const payoutData = payoutsRes.data?.data || payoutsRes.data;
        setEarned(Number(payoutData?.availableBalance ?? 0));

        const bookingsRes = await api.get("/api/bookings/my-assignments");
        const bookingsData = bookingsRes.data?.data || bookingsRes.data;
        const bList = Array.isArray(bookingsData?.bookings) ? bookingsData.bookings : Array.isArray(bookingsData) ? bookingsData : [];
        setJobs(bList.length);

        try {
          if (user?.staffProfile?.id) {
            const walletRes = await api.get("/api/wallets/staff/" + user.staffProfile.id);
            const walletData = walletRes.data?.data || walletRes.data;
            setWallet(Number(walletData?.balance ?? 0));
            setCreditLimit(Number(walletData?.creditLimit ?? 0));
          }
        } catch (e) {
          console.warn("Wallet data not available");
        }
      } catch (err) {
        console.error("Failed to load profile data", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user?.id]);


  const handlePress = (item: any) => {
    if (item.action === "route" && item.route) {
      router.push(item.route);
    } else if (item.action === "mfa") {
      setMfaModalVisible(true);
    } else {
      Alert.alert(item.title, item.subtitle);
    }
  };

  const handleLogout = () => {
    Alert.alert(t('staffProfile.logOut'), t('staffProfile.logOutConfirm'), [
      { text: t('staffProfile.cancel'), style: "cancel" },
      {
        text: t('staffProfile.logOut'),
        style: "destructive",
        onPress: async () => {
          await logout?.();
        },
      },
    ]);
  };

  const MENU_GROUPS = [
    {
      title: t('staffProfile.myWork'),
      items: [
        { id: 1, title: t('staffProfile.myWallet'), subtitle: t('staffProfile.myWalletDesc'), icon: "wallet", action: "route", route: "/(staff)/(tabs)/wallet" },
        { id: 2, title: t('staffProfile.myPerformance'), subtitle: t('staffProfile.myPerformanceDesc'), icon: "chart-line", action: "route", route: "/(staff)/performance" },
        { id: 3, title: t('staffProfile.timeOffRequests'), subtitle: t('staffProfile.timeOffRequestsDesc'), icon: "beach", action: "route", route: "/(staff)/timeoff" },
        { id: 4, title: t('staffProfile.availability'), subtitle: t('staffProfile.availabilityDesc'), icon: "calendar-check-outline", action: "route", route: "/(staff)/availability" },
      ],
    },
    {
      title: t('staffProfile.account'),
      items: [
        { id: 5, title: t('staffProfile.editProfile'), subtitle: t('staffProfile.editProfileDesc'), icon: "account-edit-outline", action: "route", route: "/(staff)/edit-profile" },
        { id: 51, title: t('staffProfile.changePassword'), subtitle: t('staffProfile.changePasswordDesc'), icon: "lock-reset", action: "route", route: "/(staff)/change-password" },
        { id: 6, title: t('staffProfile.aiAssistant'), subtitle: t('staffProfile.aiAssistantDesc'), icon: "robot-outline", action: "route", route: "/(staff)/ai/ai" },
      ],
    },
    {
      title: t('staffProfile.info'),
      items: [
        { id: 7, title: t('staffProfile.helpSupport'), subtitle: t('staffProfile.helpSupportDesc'), icon: "help-circle-outline", action: "alert" },
        { id: 8, title: t('staffProfile.aboutServiceFinder'), subtitle: t('staffProfile.aboutServiceFinderDesc'), icon: "information-outline", action: "alert" },
      ],
    },
    {
      title: t('staffProfile.security'),
      items: [
        { id: 13, title: t('staffProfile.twoFactorAuth'), subtitle: t('staffProfile.twoFactorAuthDesc'), icon: "shield-lock-outline", action: "mfa" },
      ],
    },
  ];

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={s.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity onPress={() => setStaffOpen(true)} style={s.menuBtn}>
            <MaterialCommunityIcons name="menu" size={26} color={T.accent} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>{t('staffProfile.profile')}</Text>
        </View>
        <TouchableOpacity activeOpacity={0.8} onPress={() => router.push("/(staff)/settings" as any)}>
          <MaterialCommunityIcons name="cog-outline" size={24} color={T.accent} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={s.scroll} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Profile Header */}
        <View style={s.profileHeader}>
          <View style={s.avatarContainer}>
            <Image
              source={{ uri: user?.avatarUrl || "https://ui-avatars.com/api/?name=" + encodeURIComponent(user?.fullName || "Staff") }}
              style={s.avatar}
            />
            <View style={s.verifiedBadge}>
              <MaterialCommunityIcons name="check" size={12} color="#fff" />
            </View>
          </View>

          <View style={s.nameContainer}>
            <Text style={s.nameText}>{profile?.fullName || user?.fullName || staffData.name}</Text>
            <Text style={s.roleText}>{profile?.role?.replace('_', ' ') || user?.role?.replace('_', ' ') || staffData.role}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={s.statsCard}>
          <View style={s.statItem}>
            <View style={s.statValueRow}>
              <Text style={s.statValue}>{profile?.staffMemberships?.[0]?.rating ? Number(profile.staffMemberships[0].rating).toFixed(1) : "0.0"}</Text>
              <MaterialCommunityIcons name="star" size={16} color={T.warning} />
            </View>
            <Text style={s.statLabel}>{t('staffProfile.rating')}</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={s.statValue}>{jobs}</Text>
            <Text style={s.statLabel}>{t('staffProfile.jobs')}</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={s.statValue}>${earned.toFixed(2)}</Text>
            <Text style={s.statLabel}>{t('staffProfile.available')}</Text>
          </View>
        </View>

        {/* Digital Wallet */}
        <View style={[s.section, { marginTop: 16 }]}>
          <View style={[s.statsCard, { marginHorizontal: 0, marginTop: 0, backgroundColor: (wallet || 0) < 0 ? ((wallet || 0) <= (creditLimit || 0) ? T.errorBg : '#FFF3E0') : T.surface }]}>
            <View style={s.statItem}>
              <Text style={[s.statValue, (wallet || 0) < 0 ? { color: T.error } : {}]}>${(wallet || 0).toFixed(2)}</Text>
              <Text style={s.statLabel}>{t('staffProfile.wallet')}</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <Text style={s.statValue}>${(creditLimit || 0).toFixed(2)}</Text>
              <Text style={s.statLabel}>{t('staffProfile.limit')}</Text>
            </View>
          </View>
        </View>

        {/* Endorsements */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>{t('staffProfile.endorsements')}</Text>
          <View style={s.endorsementsWrap}>
            {staffData.endorsements.map(badge => (
              <View key={badge.id} style={s.badge}>
                <MaterialCommunityIcons name={badge.icon as any} size={14} color={T.accentMid} />
                <Text style={s.badgeText}>{badge.title}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Menu Groups */}
        <View style={{ paddingHorizontal: 24, marginTop: 16 }}>
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
                      <View style={s.menuIconBox}>
                        <MaterialCommunityIcons name={item.icon as any} size={22} color={T.accentMid} />
                      </View>
                      <View style={s.menuTextBlock}>
                        <Text style={s.menuTitle}>{item.title}</Text>
                        <Text style={s.menuSubtitle}>{item.subtitle}</Text>
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
            <TouchableOpacity onPress={handleLogout} style={s.logoutRow} activeOpacity={0.8}>
              <View style={[s.menuIconBox, { backgroundColor: T.errorBg || "#FEE2E2" }]}>
                <MaterialCommunityIcons name="logout" size={22} color={T.error} />
              </View>
              <Text style={[s.menuTitle, { color: T.error, flex: 1 }]}>{t('staffProfile.logOut')}</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color={T.error} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <MfaSetupModal
        visible={mfaModalVisible}
        onClose={() => setMfaModalVisible(false)}
        onSuccess={() => {
          setMfaModalVisible(false);
          Alert.alert(t('staffProfile.success'), t('staffProfile.mfaEnabledMsg'));
        }}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8,
  },
  menuBtn: { padding: 4, marginLeft: -4 },
  headerTitle: { fontSize: 24, fontWeight: "800", color: T.accent, letterSpacing: -0.5 },

  scroll: { flex: 1 },

  profileHeader: { alignItems: "center", marginTop: 32, paddingHorizontal: 24 },
  avatarContainer: { position: "relative", backgroundColor: T.border, width: 96, height: 96, borderRadius: 48, overflow: 'visible' },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  verifiedBadge: {
    position: "absolute", bottom: 4, right: 4,
    backgroundColor: T.success, padding: 6, borderRadius: 16,
    borderWidth: 3, borderColor: T.surface,
  },
  nameContainer: { alignItems: "center", marginTop: 16 },
  nameText: { fontSize: 24, fontWeight: "800", color: T.text1 },
  roleText: { fontSize: 14, fontWeight: "600", color: T.text2, marginTop: 4, textTransform: "capitalize" },

  statsCard: {
    flexDirection: "row", marginHorizontal: 24, marginTop: 32,
    backgroundColor: T.surface, borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: T.border,
    ...CARD_SHADOW,
  },
  statItem: { flex: 1, alignItems: "center" },
  statDivider: { width: 1, backgroundColor: T.border },
  statValueRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: "800", color: T.accent, marginBottom: 4 },
  statLabel: { fontSize: 10, fontWeight: "700", color: T.text3, textTransform: "uppercase", letterSpacing: 0.5 },

  section: { marginHorizontal: 24, marginTop: 32, marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: "800", color: T.text3, textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 },
  
  endorsementsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  badge: {
    backgroundColor: T.accentLight, paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20, flexDirection: "row", alignItems: "center", gap: 6,
    borderWidth: 1, borderColor: T.border
  },
  badgeText: { fontSize: 12, fontWeight: "700", color: T.accentMid },

  menuGroup: { marginBottom: 24 },
  groupLabel: { fontSize: 11, fontWeight: "800", color: T.text3, letterSpacing: 1.2, marginBottom: 10 },
  groupCard: {
    backgroundColor: T.surface, borderRadius: 16,
    borderWidth: 1, borderColor: T.border,
    ...CARD_SHADOW,
  },
  menuRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 16, gap: 14 },
  menuIconBox: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: T.accentLight, alignItems: "center", justifyContent: "center",
  },
  menuTextBlock: { flex: 1 },
  menuTitle: { fontSize: 15, fontWeight: "700", color: T.text1, marginBottom: 2 },
  menuSubtitle: { fontSize: 12, fontWeight: "500", color: T.text3 },
  rowDivider: { height: 1, backgroundColor: T.border, marginHorizontal: 16 },
  logoutRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: T.surface, borderRadius: 16,
    padding: 16, gap: 14, borderWidth: 1, borderColor: T.border,
    ...CARD_SHADOW,
  },
});
