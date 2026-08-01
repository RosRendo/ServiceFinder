/**
 * Admin Users List — Premium Light Bento Redesign
 */
import React, { useState, useEffect, useCallback } from "react";
import { Image } from "expo-image";
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, RefreshControl, StyleSheet, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import api from "@/utils/api";
import { useSidebarStore } from "@/store/sidebarStore";
import { FlashList } from "@shopify/flash-list";
import { useTranslation } from "react-i18next";
import { Theme } from "@/constants/theme";

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

  const filters = [
    { id: "all", label: "All Users" },
    { id: "customer", label: "Customer" },
    { id: "staff", label: "Staff" },
    { id: "company_admin", label: "Company Admin" },
    { id: "admin", label: "Super Admin" },
  ];

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
    } catch (error) {
      console.error("Failed to fetch users:", error);
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
          <TouchableOpacity onPress={() => openSidebar(true)} style={s.menuBtn}>
            <MaterialCommunityIcons name="menu" size={28} color={T.text1} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Directory</Text>
        </View>
        <TouchableOpacity style={s.addBtn}>
          <MaterialCommunityIcons name="plus" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search & Filters (Sticky) */}
      <View style={s.filtersContainer}>
        <View style={s.searchBox}>
          <MaterialCommunityIcons name="magnify" size={22} color={T.text3} />
          <TextInput
            placeholder="Search by name or email..."
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

        <View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterChips}>
            {filters.map((filter) => {
              const isActive = activeFilter === filter.id;
              return (
                <TouchableOpacity
                  key={filter.id}
                  onPress={() => setActiveFilter(filter.id)}
                  style={[s.filterChip, isActive && s.filterChipActive]}
                  activeOpacity={0.8}
                >
                  <Text style={[s.filterChipText, isActive && s.filterChipTextActive]}>{filter.label}</Text>
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
        ) : (
          <FlashList
            data={users}
            keyExtractor={(item) => item.id.toString()}
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
                <Text style={s.emptyText}>No Users Found</Text>
                {searchQuery ? <Text style={s.emptySubText}>Try adjusting your search filters.</Text> : null}
              </View>
            }
            renderItem={({ item: user }) => {
              const roleStyle = getRoleColor(user.role);
              const statusStyle = getStatusStyle(user.status);
              
              return (
                <TouchableOpacity
                  style={s.bentoCard}
                  onPress={() => router.push(`/(admin)/users/${user.id}` as any)}
                  activeOpacity={0.9}
                >
                  {/* Top Header: Identity */}
                  <View style={s.bentoHeader}>
                    <View style={s.avatarWrap}>
                      <Image
                        source={{ uri: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=0A192F&color=fff` }}
                        style={s.avatar}
                      />
                      <View style={[s.statusBadge, { backgroundColor: statusStyle.bg }]}>
                        <MaterialCommunityIcons name={statusStyle.icon as any} size={10} color={statusStyle.color} />
                      </View>
                    </View>
                    <View style={s.identityInfo}>
                      <Text style={s.userName} numberOfLines={1}>{user.fullName}</Text>
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
                      <Text style={[s.bentoBoxLabel, { color: roleStyle.text, opacity: 0.8 }]}>Role</Text>
                    </View>
                    
                    {/* Secondary Bento Box: ID */}
                    <View style={[s.bentoBox, { flex: 1 }]}>
                      <MaterialCommunityIcons name="identifier" size={18} color={T.text3} style={{ marginBottom: 4 }} />
                      <Text style={s.bentoBoxValue} numberOfLines={1}>#{user.id}</Text>
                      <Text style={s.bentoBoxLabel}>User ID</Text>
                    </View>

                    {/* Secondary Bento Box: Joined */}
                    <View style={[s.bentoBox, { flex: 1 }]}>
                      <MaterialCommunityIcons name="calendar-outline" size={18} color={T.text3} style={{ marginBottom: 4 }} />
                      <Text style={s.bentoBoxValue} numberOfLines={1}>{new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', year: '2-digit' })}</Text>
                      <Text style={s.bentoBoxLabel}>Joined</Text>
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
  headerTitle: { fontSize: 28, fontWeight: "800", color: T.text1, letterSpacing: -0.5 },
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
  emptyText: { fontSize: 20, fontWeight: "800", color: T.text1, marginBottom: 8 },
  emptySubText: { fontSize: 15, color: T.text2, textAlign: "center", paddingHorizontal: 32 },

  /* BENTO CARD UI */
  bentoCard: { backgroundColor: T.surface, borderRadius: 24, padding: 16, borderWidth: 1, borderColor: T.border, ...CARD_SHADOW },
  bentoHeader: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 16 },
  
  avatarWrap: { position: "relative" },
  avatar: { width: 56, height: 56, borderRadius: 20, backgroundColor: T.bg, borderWidth: 1, borderColor: T.border },
  statusBadge: { position: "absolute", bottom: -4, right: -4, width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: T.surface },
  
  identityInfo: { flex: 1, justifyContent: "center" },
  userName: { fontSize: 18, fontWeight: "800", color: T.text1, marginBottom: 4, letterSpacing: -0.3 },
  userEmail: { fontSize: 14, fontWeight: "500", color: T.text3 },

  bentoGrid: { flexDirection: "row", gap: 8 },
  bentoBox: { backgroundColor: T.bg, borderRadius: 16, padding: 12, justifyContent: "center" },
  bentoBoxValue: { fontSize: 14, fontWeight: "800", color: T.text1, marginBottom: 2, textTransform: "capitalize", letterSpacing: -0.2 },
  bentoBoxLabel: { fontSize: 11, fontWeight: "600", color: T.text3, textTransform: "uppercase" },
});
