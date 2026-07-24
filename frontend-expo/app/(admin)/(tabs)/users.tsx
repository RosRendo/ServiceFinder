/**
 * Admin Users List — Premium Deep Navy Redesign
 */
import React, { useState, useEffect, useCallback } from "react";
import { Image } from "expo-image";
import { ScrollView, Text, View, TouchableOpacity, TextInput, ActivityIndicator, RefreshControl, StyleSheet, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import api from "@/utils/api";
import { useSidebarStore } from "@/store/sidebarStore";
import { useTranslation } from "react-i18next";
import { Theme } from "@/constants/theme";

const T = Theme.colors;



export default function Users() {
  const router = useRouter();
  const openSidebar = useSidebarStore((s) => s.setAdminOpen);
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const filters = [
    { id: "all", label: t('adminUsers.allUsers') },
    { id: "customer", label: t('adminUsers.customer') },
    { id: "staff", label: t('adminUsers.staff') },
    { id: "company_admin", label: t('adminUsers.companyAdmin') },
    { id: "admin", label: t('adminUsers.superAdmin') },
  ];

  const fetchUsers = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const queryParams = new URLSearchParams();
      queryParams.append("limit", "50");
      if (activeFilter !== "all") queryParams.append("role", activeFilter);
      if (searchQuery) queryParams.append("search", searchQuery);

      // Use /api/admin/users — properly guarded admin endpoint
      const response = await api.get(`/api/admin/users?${queryParams.toString()}`);
      // Admin service returns { data: [...], meta: {...} } wrapped by TransformInterceptor
      const responseData = response.data?.data ?? response.data;
      setUsers(responseData.data || responseData.users || []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [activeFilter, searchQuery]);

  // Debounced search / filter changes
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => fetchUsers(), 400);
    return () => clearTimeout(timer);
  }, [activeFilter, searchQuery, fetchUsers]);

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin": return T.error;
      case "company_admin": return T.blue;
      case "staff": return T.gray;
      default: return T.success;
    }
  };

  const getStatusStyle = (status: string) => {
    return status === 'active' 
      ? { bg: T.success + "15", color: T.success }
      : { bg: T.warning + "15", color: T.warning };
  };

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <TouchableOpacity onPress={() => openSidebar(true)} style={s.menuBtn}>
            <MaterialCommunityIcons name="menu" size={28} color={T.text1} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>{t('adminUsers.title')}</Text>
        </View>
      </View>

      {/* Search & Filters */}
      <View style={s.filtersContainer}>
        <View style={s.searchBox}>
          <MaterialCommunityIcons name="magnify" size={22} color={T.text3} />
          <TextInput
            placeholder={t('adminUsers.searchPlaceholder')}
            placeholderTextColor={T.text3}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={s.searchInput}
            autoCapitalize="none"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <MaterialCommunityIcons name="close-circle" size={20} color={T.text3} />
            </TouchableOpacity>
          ) : null}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterChips}>
          {filters.map((filter) => {
            const isActive = activeFilter === filter.id;
            return (
              <TouchableOpacity
                key={filter.id}
                onPress={() => setActiveFilter(filter.id)}
                style={[s.filterChip, isActive && s.filterChipActive]}
              >
                <Text style={[s.filterChipText, isActive && s.filterChipTextActive]}>{filter.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchUsers(true)} tintColor={T.accent} />}
      >
        {isLoading && !refreshing ? (
          <View style={s.loadingBox}><ActivityIndicator size="large" color={T.accent} /></View>
        ) : users.length > 0 ? (
          users.map((user) => {
            const sStyle = getStatusStyle(user.status);
            return (
              <TouchableOpacity
                key={user.id}
                style={s.userCard}
                onPress={() => router.push(`/(admin)/users/${user.id}` as any)}
                activeOpacity={0.8}
              >
                <View style={s.cardHeader}>
                  <Image
                    source={{ uri: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=1E3A8A&color=fff` }}
                    style={s.avatar}
                  />
                  <View style={s.cardHeaderInfo}>
                    <Text style={s.userName} numberOfLines={1}>{user.fullName}</Text>
                    <Text style={s.userEmail} numberOfLines={1}>{user.email}</Text>
                  </View>
                  <View style={[s.statusBadge, { backgroundColor: sStyle.bg }]}>
                    <Text style={[s.statusText, { color: sStyle.color }]}>{user.status}</Text>
                  </View>
                </View>

                <View style={s.cardBody}>
                  <View style={s.infoBlock}>
                    <Text style={s.infoLabel}>{t('adminUsers.role')}</Text>
                    <View style={s.roleRow}>
                      <View style={[s.roleDot, { backgroundColor: getRoleColor(user.role) }]} />
                      <Text style={s.infoValue}>{user.role.replace('_', ' ')}</Text>
                    </View>
                  </View>
                  <View style={s.infoBlock}>
                    <Text style={s.infoLabel}>{t('adminUsers.joined')}</Text>
                    <Text style={s.infoValue}>{new Date(user.createdAt).toLocaleDateString()}</Text>
                  </View>
                  <View style={s.infoBlock}>
                    <Text style={s.infoLabel}>{t('adminUsers.userId')}</Text>
                    <Text style={s.infoValue}>#{user.id}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={s.emptyBox}>
            <MaterialCommunityIcons name="account-search" size={48} color={T.text3} style={{ marginBottom: 16 }} />
            <Text style={s.emptyText}>{t('adminUsers.noUsers')}</Text>
            {searchQuery ? <Text style={s.emptySubText}>{t('adminUsers.adjustSearch')}</Text> : null}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}


const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  android: { elevation: 2 },
});

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: T.surface,
    borderBottomWidth: 1, borderBottomColor: T.border,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  menuBtn: { marginLeft: -8, padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: T.text1 },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: T.accent, alignItems: "center", justifyContent: "center" },

  filtersContainer: { backgroundColor: T.surface, borderBottomWidth: 1, borderBottomColor: T.border, paddingBottom: 16 },
  searchBox: {
    flexDirection: "row", alignItems: "center", backgroundColor: T.bg,
    marginHorizontal: 16, marginTop: 16, paddingHorizontal: 16, borderRadius: 16, height: 48,
    borderWidth: 1, borderColor: T.border,
  },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 15, color: T.text1, fontWeight: "500" },
  filterChips: { paddingHorizontal: 16, paddingTop: 16, gap: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: T.bg, borderWidth: 1, borderColor: T.border },
  filterChipActive: { backgroundColor: T.accent, borderColor: T.accent },
  filterChipText: { fontSize: 13, fontWeight: "600", color: T.text2 },
  filterChipTextActive: { color: "#fff" },

  listContent: { padding: 16, gap: 16, paddingBottom: 60 },
  loadingBox: { paddingVertical: 80, alignItems: "center" },
  emptyBox: { alignItems: "center", paddingVertical: 80 },
  emptyText: { fontSize: 16, fontWeight: "700", color: T.text1 },
  emptySubText: { fontSize: 14, color: T.text3, marginTop: 4, textAlign: "center", paddingHorizontal: 32 },

  userCard: { backgroundColor: T.surface, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: T.border , ...CARD_SHADOW },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  avatar: { width: 48, height: 48, borderRadius: 16, backgroundColor: T.bg },
  cardHeaderInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: "800", color: T.text1, marginBottom: 2 },
  userEmail: { fontSize: 13, fontWeight: "500", color: T.text3 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: "800", textTransform: "uppercase" },

  cardBody: { flexDirection: "row", backgroundColor: T.bg, borderRadius: 12, padding: 12, justifyContent: "space-between" },
  infoBlock: { flex: 1 },
  infoLabel: { fontSize: 11, fontWeight: "600", color: T.text3, marginBottom: 4, textTransform: "uppercase" },
  infoValue: { fontSize: 13, fontWeight: "700", color: T.text1, textTransform: "capitalize" },
  roleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  roleDot: { width: 8, height: 8, borderRadius: 4 },
});

