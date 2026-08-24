/**
 * Admin Users List — Premium Light Bento Redesign
 */
import React, { useState, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, RefreshControl, StyleSheet, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import api from "@/utils/api";
import { useSidebarStore } from "@/store/sidebarStore";
import { FlashList as ShopifyFlashList } from "@shopify/flash-list";
import { useTranslation } from "react-i18next";
import ErrorState from "@/components/common/ErrorState";
import InitialsAvatar from "@/components/common/InitialsAvatar";
import { Theme } from "@/constants/theme";
const FlashList = ShopifyFlashList as any;

const T = Theme.colors;

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 },
  android: { elevation: 3 },
});

export default function Users() {
  const router = useRouter();
  const openSidebar = useSidebarStore((s) => s.setAdminOpen);
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);

  // t() is stable per language change; filters stay declarative and translate at render time.
  const filterIds = ["all", "customer", "staff", "company_admin", "admin"] as const;

  const fetchUsers = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const queryParams = new URLSearchParams();
      queryParams.append("limit", "50");
      if (activeFilter !== "all") queryParams.append("role", activeFilter);
      if (searchQuery) queryParams.append("search", searchQuery);

      const response = await api.get(`/api/admin/users?${queryParams.toString()}`);
      // Backend returns { success: true, data: [...], meta: {} }
      const data = response.data?.data ?? [];
      setUsers(Array.isArray(data) ? data : []);
      setHasError(false);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setHasError(true);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [activeFilter, searchQuery]);


  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => fetchUsers(), 400);
    return () => clearTimeout(timer);
  }, [activeFilter, searchQuery, fetchUsers]);

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin": return { bg: "rgba(239, 68, 68, 0.1)", text: T.error, icon: "shield-account-outline" };
      case "company_admin": return { bg: "rgba(37, 99, 235, 0.1)", text: T.blue, icon: "domain" };
      case "staff": return { bg: "rgba(100, 116, 139, 0.1)", text: T.gray, icon: "briefcase-account-outline" };
      default: return { bg: "rgba(16, 185, 129, 0.1)", text: T.success, icon: "account-outline" };
    }
  };

  const getStatusStyle = (status: string) => {
    return status === 'active' 
      ? { bg: T.success, color: "#fff", icon: "check" }
      : { bg: T.warning, color: "#fff", icon: "pause" };
  };

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <TouchableOpacity
            onPress={() => openSidebar(true)}
            style={s.menuBtn}
            accessibilityRole="button"
            accessibilityLabel={t('common.openMenu')}
          >
            <MaterialCommunityIcons name="menu" size={28} color={T.text1} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>{t('adminDirectory.title')}</Text>
        </View>
        <TouchableOpacity
          style={s.addBtn}
          accessibilityRole="button"
          accessibilityLabel={t('common.addUser')}
        >
          <MaterialCommunityIcons name="plus" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search & Filters (Sticky) */}
      <View style={s.filtersContainer}>
        <View style={s.searchBox}>
          <MaterialCommunityIcons name="magnify" size={22} color={T.text3} />
          <TextInput
            placeholder={t('adminDirectory.searchPlaceholder')}
            placeholderTextColor={T.text3}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={s.searchInput}
            autoCapitalize="none"
            accessibilityLabel={t('adminDirectory.searchPlaceholder')}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")} accessibilityRole="button" accessibilityLabel={t('common.clearSearch')}>
              <MaterialCommunityIcons name="close-circle" size={20} color={T.text3} />
            </TouchableOpacity>
          ) : null}
        </View>

        <View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterChips}>
            {filterIds.map((id) => {
              const isActive = activeFilter === id;
              return (
                <TouchableOpacity
                  key={id}
                  onPress={() => setActiveFilter(id)}
                  style={[s.filterChip, isActive && s.filterChipActive]}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={t(`adminDirectory.filter.${id}`)}
                >
                  <Text style={[s.filterChipText, isActive && s.filterChipTextActive]}>{t(`adminDirectory.filter.${id}`)}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>

      {/* List - Using FlashList for Performance */}
      <View style={{ flex: 1 }}>
        {isLoading && !refreshing ? (
          <View style={s.loadingBox}><ActivityIndicator size="large" color={T.primary} /></View>
        ) : hasError && users.length === 0 ? (
          <ErrorState onRetry={() => { setIsLoading(true); fetchUsers(); }} />
        ) : (
          <FlashList
            data={users}
            keyExtractor={(item: any) => item.id.toString()}
            estimatedItemSize={180}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchUsers(true)} tintColor={T.primary} />}
            contentContainerStyle={s.listContent}
            ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={s.emptyBox}>
                <View style={s.emptyIconCircle}>
                  <MaterialCommunityIcons name="account-search-outline" size={48} color={T.primary} />
                </View>
                <Text style={s.emptyText}>{t('adminDirectory.noResults')}</Text>
                {searchQuery ? <Text style={s.emptySubText}>{t('adminDirectory.tryAdjusting')}</Text> : null}
              </View>
            }
            renderItem={({ item: user }: any) => {
              const roleStyle = getRoleColor(user.role);
              const statusStyle = getStatusStyle(user.status);
              const displayName = user.fullName ?? user.name ?? t('adminDirectory.fallbackName');

              return (
                <TouchableOpacity
                  style={s.bentoCard}
                  onPress={() => router.push(`/(admin)/users/${user.id}` as any)}
                  activeOpacity={0.9}
                  accessibilityRole="button"
                  accessibilityLabel={`${displayName}, ${user.role}, ${user.email}`}
                >
                  {/* Top Header: Identity */}
                  <View style={s.bentoHeader}>
                    <View style={s.avatarWrap}>
                      <InitialsAvatar name={displayName} size={56} radius={20} />
                      <View style={[s.statusBadge, { backgroundColor: statusStyle.bg }]}>
                        <MaterialCommunityIcons name={statusStyle.icon as any} size={10} color={statusStyle.color} />
                      </View>
                    </View>
                    <View style={s.identityInfo}>
                      <Text style={s.userName} numberOfLines={1}>{displayName}</Text>
                      <Text style={s.userEmail} numberOfLines={1}>{user.email}</Text>
                    </View>
                  </View>

                  {/* Bento Grid Layout for Secondary Data */}
                  <View style={s.bentoGrid}>
                    {/* Primary Bento Box: Role */}
                    <View style={[s.bentoBox, { flex: 1.5, backgroundColor: roleStyle.bg }]}>
                      <MaterialCommunityIcons name={roleStyle.icon as any} size={18} color={roleStyle.text} style={{ marginBottom: 4 }} />
                      <Text style={[s.bentoBoxValue, { color: roleStyle.text }]} numberOfLines={1}>
                        {user.role.replace('_', ' ')}
                      </Text>
                      <Text style={[s.bentoBoxLabel, { color: roleStyle.text, opacity: 0.8 }]}>{t('adminDirectory.role')}</Text>
                    </View>

                    {/* Secondary Bento Box: ID */}
                    <View style={[s.bentoBox, { flex: 1 }]}>
                      <MaterialCommunityIcons name="identifier" size={18} color={T.text3} style={{ marginBottom: 4 }} />
                      <Text style={s.bentoBoxValue} numberOfLines={1}>#{user.id}</Text>
                      <Text style={s.bentoBoxLabel}>{t('adminDirectory.userId')}</Text>
                    </View>

                    {/* Secondary Bento Box: Joined */}
                    <View style={[s.bentoBox, { flex: 1 }]}>
                      <MaterialCommunityIcons name="calendar-outline" size={18} color={T.text3} style={{ marginBottom: 4 }} />
                      <Text style={s.bentoBoxValue} numberOfLines={1}>{new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', year: '2-digit' })}</Text>
                      <Text style={s.bentoBoxLabel}>{t('adminDirectory.joined')}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, backgroundColor: T.bg,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  menuBtn: { marginLeft: -8, padding: 8 },
  headerTitle: { fontSize: 28, fontWeight: "700", color: T.text1, letterSpacing: -0.5 },
  addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: T.primary, alignItems: "center", justifyContent: "center", ...CARD_SHADOW },

  filtersContainer: { backgroundColor: T.bg, paddingBottom: 16, zIndex: 10 },
  searchBox: {
    flexDirection: "row", alignItems: "center", backgroundColor: T.surface,
    marginHorizontal: 20, marginBottom: 16, paddingHorizontal: 16, borderRadius: 16, height: 52,
    borderWidth: 1, borderColor: T.border, ...CARD_SHADOW
  },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 16, color: T.text1, fontWeight: "500" },
  
  filterChips: { paddingHorizontal: 20, gap: 8, paddingBottom: 4 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: T.surface, borderWidth: 1, borderColor: T.border },
  filterChipActive: { backgroundColor: T.primary, borderColor: T.primary, ...CARD_SHADOW },
  filterChipText: { fontSize: 13, fontWeight: "700", color: T.text2 },
  filterChipTextActive: { color: "#fff" },

  listContent: { padding: 20, paddingBottom: 100 },
  loadingBox: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyBox: { alignItems: "center", paddingVertical: 100 },
  emptyIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(10, 25, 47, 0.05)", alignItems: "center", justifyContent: "center", marginBottom: 20 },
  emptyText: { fontSize: 20, fontWeight: "700", color: T.text1, marginBottom: 8 },
  emptySubText: { fontSize: 15, color: T.text2, textAlign: "center", paddingHorizontal: 32 },

  /* BENTO CARD UI */
  bentoCard: { backgroundColor: T.surface, borderRadius: 24, padding: 16, borderWidth: 1, borderColor: T.border, ...CARD_SHADOW },
  bentoHeader: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 16 },
  
  avatarWrap: { position: "relative" },
  statusBadge: { position: "absolute", bottom: -4, right: -4, width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: T.surface },
  
  identityInfo: { flex: 1, justifyContent: "center" },
  userName: { fontSize: 18, fontWeight: "700", color: T.text1, marginBottom: 4, letterSpacing: -0.3 },
  userEmail: { fontSize: 14, fontWeight: "500", color: T.text3 },

  bentoGrid: { flexDirection: "row", gap: 8 },
  bentoBox: { backgroundColor: T.bg, borderRadius: 16, padding: 12, justifyContent: "center" },
  bentoBoxValue: { fontSize: 14, fontWeight: "700", color: T.text1, marginBottom: 2, textTransform: "capitalize", letterSpacing: -0.2 },
  bentoBoxLabel: { fontSize: 11, fontWeight: "600", color: T.text3, textTransform: "uppercase" },
});
