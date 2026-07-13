/**
 * Company Staff — Premium Redesign
 */
import React, { useState, useCallback } from "react";
import {
  ScrollView, Text, View, TouchableOpacity, TextInput,
  ActivityIndicator, RefreshControl, StyleSheet, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { api } from "@/store/authStore";
import { useSidebarStore } from "@/store/sidebarStore";

const T = {
  bg: "#FFFFFF", surface: "#FFFFFF", border: "#EBEBEB",
  accent: "#0A192F", accentMid: "#1E3A8A", accentLight: "#F7F7F7",
  text1: "#111827", text2: "#717171", text3: "#B0B0B0",
  success: "#00A699", warning: "#FFB800", error: "#E31C5F",
};
const SHADOW = {};

const FAB_SHADOW = Platform.select({
  ios: {
    shadowColor: T.accentMid,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
  },
  android: { elevation: 8 },
});

function Avatar({ name, size = 52 }: { name: string; size?: number }) {
  const initials = (name ?? "?").split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();
  const palette = ["#1E3A8A", "#065F46", "#7C3AED", "#B45309", "#0A192F", "#BE185D"];
  const color = palette[(name ?? "").length % palette.length];
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontSize: size * 0.32, fontWeight: "800", color: "#fff" }}>{initials}</Text>
    </View>
  );
}

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  admin:         { bg: "#EDE9FE", text: "#5B21B6" },
  company_admin: { bg: "#EDE9FE", text: "#5B21B6" },
  staff:         { bg: "#DBEAFE", text: "#1E40AF" },
  technician:    { bg: "#D1FAE5", text: "#065F46" },
  default:       { bg: T.accentLight, text: T.accentMid },
};

export default function Staff() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const setCompanyOpen = useSidebarStore((s) => s.setCompanyOpen);

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

  const filteredStaff = staffList.filter((m) =>
    m.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = staffList.filter((m) => m.status === "active").length;

  return (
    <>
      <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => setCompanyOpen(true)} style={s.menuBtn}>
            <MaterialCommunityIcons name="menu" size={28} color={T.accent} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Team Directory</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadStaff(true)} tintColor={T.accent} />}
        >
          {/* Stats Banner */}
          <View style={s.statsBanner}>
            <View style={s.statItem}>
              <Text style={s.statNumber}>{staffList.length}</Text>
              <Text style={s.statLabel}>Members</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <Text style={[s.statNumber, { color: T.success }]}>{activeCount}</Text>
              <Text style={s.statLabel}>Active</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <Text style={[s.statNumber, { color: T.warning }]}>{staffList.length - activeCount}</Text>
              <Text style={s.statLabel}>Offline</Text>
            </View>
          </View>

          {/* Search */}
          <View style={s.searchWrap}>
            <View style={s.searchBox}>
              <MaterialCommunityIcons name="magnify" size={20} color={T.text3} />
              <TextInput
                placeholder="Search by name or role..."
                placeholderTextColor={T.text3}
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={s.searchInput}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <MaterialCommunityIcons name="close-circle" size={18} color={T.text3} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Staff List */}
          {loading ? (
            <View style={s.loadingBox}>
              <ActivityIndicator size="large" color={T.accent} />
            </View>
          ) : filteredStaff.length === 0 ? (
            <View style={s.emptyBox}>
              {/* Premium empty state — different for search vs truly empty */}
              {searchQuery.length > 0 ? (
                <>
                  <View style={s.emptyIconCircle}>
                    <MaterialCommunityIcons name="account-search-outline" size={42} color="#fff" />
                  </View>
                  <Text style={s.emptyTitle}>No results for "{searchQuery}"</Text>
                  <Text style={s.emptySubtitle}>Try a different name or role</Text>
                </>
              ) : (
                <>
                  <View style={s.emptyIconCircle}>
                    <MaterialCommunityIcons name="account-group-outline" size={42} color="#fff" />
                  </View>
                  <Text style={s.emptyTitle}>Your team is empty</Text>
                  <Text style={s.emptySubtitle}>Invite your first staff member to get started managing your team.</Text>
                  <TouchableOpacity
                    style={s.emptyInviteBtn}
                    activeOpacity={0.85}
                    onPress={() => router.push("/(company)/staff/new" as any)}
                  >
                    <MaterialCommunityIcons name="account-plus" size={18} color="#fff" />
                    <Text style={s.emptyInviteBtnText}>Invite Staff Member</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          ) : (
            <View style={s.staffList}>
              {filteredStaff.map((member) => {
                const roleKey = member.role?.toLowerCase() ?? "default";
                const roleStyle = ROLE_COLORS[roleKey] ?? ROLE_COLORS.default;
                const isActive = member.status === "active";
                return (
                  <TouchableOpacity
                    key={member.id}
                    onPress={() => router.push(`/(company)/staff/${member.id}` as any)}
                    style={s.staffCard}
                    activeOpacity={0.8}
                  >
                    <View style={s.avatarWrap}>
                      <Avatar name={member.fullName ?? "S"} size={52} />
                      <View style={[s.onlineDot, { backgroundColor: isActive ? T.success : T.text3 }]} />
                    </View>

                    <View style={s.staffInfo}>
                      <View style={s.nameRow}>
                        <Text style={s.staffName} numberOfLines={1}>{member.fullName ?? "Unknown"}</Text>
                      </View>
                      <Text style={s.staffEmail} numberOfLines={1}>{member.email ?? ""}</Text>
                      <View style={s.badgeRow}>
                        <View style={[s.roleBadge, { backgroundColor: roleStyle.bg }]}>
                          <Text style={[s.roleBadgeText, { color: roleStyle.text }]}>
                            {member.role?.replace("_", " ") ?? "Staff"}
                          </Text>
                        </View>
                        {member.averageRating != null && member.averageRating > 0 && (
                          <View style={s.ratingBadge}>
                            <MaterialCommunityIcons name="star" size={12} color="#F59E0B" />
                            <Text style={s.ratingText}>{Number(member.averageRating).toFixed(1)}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={T.border} />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>

        {/* Floating Action Button */}
        <TouchableOpacity 
          style={s.fab} 
          activeOpacity={0.9} 
          onPress={() => router.push("/(company)/staff/new" as any)}
        >
          <MaterialCommunityIcons name="account-plus" size={26} color="#FFF" />
        </TouchableOpacity>
      </SafeAreaView>
    </>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 24, paddingVertical: 16, backgroundColor: T.bg,
  },
  menuBtn: { padding: 8, marginLeft: -8, width: 44, alignItems: "center" },
  headerTitle: { fontSize: 20, fontWeight: "800", color: T.accent },
  scrollContent: { padding: 24, paddingTop: 8, paddingBottom: 100 },

  statsBanner: {
    backgroundColor: T.accent, borderRadius: 20, padding: 20,
    flexDirection: "row", alignItems: "center", justifyContent: "space-around",
    marginBottom: 24, borderWidth: 1, borderColor: T.border,
  },
  statItem: { alignItems: "center", flex: 1, gap: 4 },
  statNumber: { fontSize: 24, fontWeight: "800", color: "#fff" },
  statLabel: { fontSize: 11, fontWeight: "600", color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: 0.5 },
  statDivider: { width: 1, height: 32, backgroundColor: "rgba(255,255,255,0.15)" },

  searchWrap: { marginBottom: 20 },
  searchBox: {
    flexDirection: "row", alignItems: "center", backgroundColor: T.surface,
    borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, gap: 10,
    borderWidth: 1, borderColor: T.border,
  },
  searchInput: { flex: 1, fontSize: 15, color: T.text1, fontWeight: "500" },

  loadingBox: { paddingVertical: 80, alignItems: "center" },
  emptyBox: { paddingVertical: 80, alignItems: "center", gap: 12 },
  emptyIconCircle: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: T.accent,
    alignItems: "center", justifyContent: "center", marginBottom: 8,
  },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: T.text1, textAlign: "center" },
  emptySubtitle: { fontSize: 14, fontWeight: "500", color: T.text3, textAlign: "center", lineHeight: 22, paddingHorizontal: 24 },
  emptyInviteBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: T.accentMid, borderRadius: 14,
    paddingHorizontal: 24, paddingVertical: 14, marginTop: 8,
  },
  emptyInviteBtnText: { fontSize: 15, fontWeight: "800", color: "#fff" },

  staffList: { gap: 12 },
  staffCard: {
    flexDirection: "row", alignItems: "center", gap: 16,
    backgroundColor: T.surface, borderRadius: 20, padding: 16,
    borderWidth: 1, borderColor: T.border,
  },
  avatarWrap: { position: "relative" },
  onlineDot: { position: "absolute", bottom: 0, right: 0, width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: T.surface },
  staffInfo: { flex: 1, justifyContent: "center" },
  nameRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 2 },
  staffName: { fontSize: 16, fontWeight: "800", color: T.text1, flex: 1 },
  staffEmail: { fontSize: 13, fontWeight: "500", color: T.text3, marginBottom: 8 },
  badgeRow: { flexDirection: "row", gap: 8, alignItems: "center", flexWrap: "wrap" },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  roleBadgeText: { fontSize: 11, fontWeight: "800", textTransform: "capitalize" },
  ratingBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#FFFBEB", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: "#FEF3C7" },
  ratingText: { fontSize: 11, fontWeight: "800", color: "#92400E" },

  fab: {
    position: "absolute", bottom: 24, right: 24,
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: T.accentMid,
    alignItems: "center", justifyContent: "center",
    ...FAB_SHADOW,
  },
});
