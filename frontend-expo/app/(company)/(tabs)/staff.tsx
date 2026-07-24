/**
 * Company Staff — Premium Deep Navy Redesign (Unified Architecture)
 */
import React, { useState, useCallback } from "react";
import { Image } from "expo-image";
import {
  Text, View, TouchableOpacity, TextInput,
  ActivityIndicator, RefreshControl, StyleSheet, Platform, ScrollView
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { api } from "@/store/authStore";
import { useSidebarStore } from "@/store/sidebarStore";
import { FlashList } from "@shopify/flash-list";
import { Theme } from "@/constants/theme";

const T = Theme.colors;

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  android: { elevation: 2 },
});

const FAB_SHADOW = Platform.select({
  ios: { shadowColor: T.accentMid, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.28, shadowRadius: 14 },
  android: { elevation: 8 },
});

export default function Staff() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const setCompanyOpen = useSidebarStore((s) => s.setCompanyOpen);

  const filters = [
    { id: "all", label: "All Staff" },
    { id: "active", label: "Active" },
    { id: "inactive", label: "Inactive" },
  ];

  const loadStaff = useCallback(async (isRefresh = false) => {
    if (isRefresh) { setRefreshing(true); } else { setLoading(true); }
    try {
      const response = await api.get("/api/companies/my-company/staff");
      let data = response.data;
      if (data && data.success) data = data.data;
      if (data && data.data) data = data.data; // Pagination wrap
      setStaffList(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load staff", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadStaff(); }, [loadStaff]));

  const filteredStaff = staffList.filter((m) => {
    const matchesSearch = (m.fullName?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
                          (m.role?.toLowerCase() || "").includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    
    if (activeFilter === "active") return m.status === "active";
    if (activeFilter === "inactive") return m.status !== "active";
    return true;
  });

  const getRoleColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case "company_admin": return T.error;
      case "supervisor": return T.blue;
      case "worker": return T.gray;
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
          <TouchableOpacity onPress={() => setCompanyOpen(true)} style={s.menuBtn}>
            <MaterialCommunityIcons name="menu" size={28} color={T.text1} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Team Directory</Text>
        </View>
      </View>

      {/* Search & Filters */}
      <View style={s.filtersContainer}>
        <View style={s.searchBox}>
          <MaterialCommunityIcons name="magnify" size={22} color={T.text3} />
          <TextInput
            placeholder="Search by name or role..."
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

      {/* Staff List */}
      {loading && !refreshing ? (
        <View style={s.loadingBox}>
          <ActivityIndicator size="large" color={T.accent} />
        </View>
      ) : (
        <FlashList
          data={filteredStaff}
          keyExtractor={(item) => item.id?.toString()}
          estimatedItemSize={160}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadStaff(true)} tintColor={T.accent} />}
          contentContainerStyle={s.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.emptyBox}>
              <MaterialCommunityIcons name="account-group" size={48} color={T.text3} style={{ marginBottom: 16 } as any} />
              <Text style={s.emptyText}>{searchQuery ? `No results for "${searchQuery}"` : "Your team is empty"}</Text>
              <Text style={s.emptySubText}>{searchQuery ? "Try a different name or role" : "Invite your first staff member to get started."}</Text>
            </View>
          }
          renderItem={({ item: member }) => {
            const sStyle = getStatusStyle(member.status);
            return (
              <TouchableOpacity
                style={s.userCard}
                onPress={() => router.push(`/(company)/staff/${member.id}` as any)}
                activeOpacity={0.8}
              >
                <View style={s.cardHeader}>
                  <Image
                    source={{ uri: member.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.fullName || 'S')}&background=1E3A8A&color=fff` }}
                    style={s.avatar}
                  />
                  <View style={s.cardHeaderInfo}>
                    <Text style={s.userName} numberOfLines={1}>{member.fullName || "Unknown"}</Text>
                    <Text style={s.userEmail} numberOfLines={1}>{member.email || "No Email"}</Text>
                  </View>
                  <View style={[s.statusBadge, { backgroundColor: sStyle.bg }]}>
                    <Text style={[s.statusText, { color: sStyle.color }]}>{member.status || "inactive"}</Text>
                  </View>
                </View>

                <View style={s.cardBody}>
                  <View style={s.infoBlock}>
                    <Text style={s.infoLabel}>Role</Text>
                    <View style={s.roleRow}>
                      <View style={[s.roleDot, { backgroundColor: getRoleColor(member.role) }]} />
                      <Text style={s.infoValue}>{member.role?.replace('_', ' ') || "Staff"}</Text>
                    </View>
                  </View>
                  <View style={s.infoBlock}>
                    <Text style={s.infoLabel}>Rating</Text>
                    <View style={s.roleRow}>
                      <MaterialCommunityIcons name="star" size={14} color="#F59E0B" />
                      <Text style={s.infoValue}>{member.averageRating ? Number(member.averageRating).toFixed(1) : "N/A"}</Text>
                    </View>
                  </View>
                  <View style={s.infoBlock}>
                    <Text style={s.infoLabel}>Joined</Text>
                    <Text style={s.infoValue}>{member.createdAt ? new Date(member.createdAt).toLocaleDateString() : "-"}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={s.fab} 
        activeOpacity={0.9} 
        onPress={() => router.push("/(company)/staff/new" as any)}
      >
        <MaterialCommunityIcons name="account-plus" size={26} color="#FFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

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

  listContent: { padding: 16, paddingBottom: 100 },
  loadingBox: { paddingVertical: 80, alignItems: "center" },
  emptyBox: { alignItems: "center", paddingVertical: 80 },
  emptyText: { fontSize: 16, fontWeight: "700", color: T.text1 },
  emptySubText: { fontSize: 14, color: T.text3, marginTop: 4, textAlign: "center", paddingHorizontal: 32 },

  userCard: { backgroundColor: T.surface, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: T.border, ...CARD_SHADOW },
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

  fab: {
    position: "absolute", bottom: 24, right: 24,
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: T.accentMid,
    alignItems: "center", justifyContent: "center",
    ...FAB_SHADOW,
  },
});
