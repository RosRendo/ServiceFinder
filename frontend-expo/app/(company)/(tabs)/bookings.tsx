import React, { useState, useCallback, useRef, useEffect } from "react";
import { Image } from "expo-image";
import { ScrollView, Text, View, TouchableOpacity, TextInput, ActivityIndicator, RefreshControl, StyleSheet, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { api } from "@/store/authStore";
import { useSidebarStore } from "@/store/sidebarStore";
import { useTranslation } from "react-i18next";

const T = {
  bg: "#F9FAFB", surface: "#FFFFFF", border: "#E5E7EB",
  accent: "#0A192F", accentLight: "#F0F4F8",
  text1: "#111827", text2: "#4B5563", text3: "#9CA3AF",
  success: "#10B981", warning: "#F59E0B", error: "#EF4444", info: "#3B82F6", purple: "#8B5CF6",
};

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 },
  android: { elevation: 3 },
});

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; accent: string }> = {
  pending:     { label: "Pending",     color: "#92400E", bg: "#FEF3C7", accent: T.warning },
  confirmed:   { label: "Confirmed",   color: "#1E40AF", bg: "#DBEAFE", accent: T.info },
  in_progress: { label: "In Progress", color: "#5B21B6", bg: "#EDE9FE", accent: T.purple },
  completed:   { label: "Completed",   color: "#065F46", bg: "#D1FAE5", accent: T.success },
  cancelled:   { label: "Cancelled",   color: "#991B1B", bg: "#FEE2E2", accent: T.error },
};

const FILTERS = [
  { key: "all",         label: "All" },
  { key: "pending",     label: "Pending" },
  { key: "confirmed",   label: "Confirmed" },
  { key: "in_progress", label: "In Progress" },
  { key: "completed",   label: "Completed" },
  { key: "cancelled",   label: "Cancelled" },
];

export default function Bookings() {
  const router = useRouter();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const setCompanyOpen = useSidebarStore((s) => s.setCompanyOpen);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [searchQuery]);

  const loadBookings = useCallback(async (isRefresh = false) => {
    if (isRefresh) { setRefreshing(true); } else { setLoading(true); }
    try {
      const response = await api.get("/api/bookings");
      const data = response.data?.data ?? response.data;
      setBookings(data?.bookings || []);
    } catch (error) {
      console.error("Failed to load bookings", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadBookings(); }, [loadBookings]));

  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      b.customer?.fullName?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      b.id.toString().includes(debouncedSearch);
    const matchesFilter = activeFilter === "all" || b.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      {/* STANDARD HEADER */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <TouchableOpacity onPress={() => setCompanyOpen(true)} style={s.menuBtn}>
            <MaterialCommunityIcons name="menu" size={28} color={T.text1} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Bookings</Text>
        </View>
      </View>

      {/* SEARCH & FILTERS */}
      <View style={s.filtersContainer}>
        <View style={s.searchBox}>
          <MaterialCommunityIcons name="magnify" size={22} color={T.text3} />
          <TextInput
            placeholder="Search bookings..."
            placeholderTextColor={T.text3}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={s.searchInput}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <MaterialCommunityIcons name="close-circle" size={20} color={T.text3} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterChips}>
          {FILTERS.map((f) => {
            const isActive = activeFilter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                onPress={() => setActiveFilter(f.key)}
                style={[s.filterChip, isActive && s.filterChipActive]}
              >
                <Text style={[s.filterChipText, isActive && s.filterChipTextActive]}>{f.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* STANDARD LIST */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadBookings(true)} tintColor={T.accent} />}
      >
        {loading && !refreshing ? (
          <View style={s.loadingBox}>
            <ActivityIndicator size="large" color={T.accent} />
            <Text style={s.loadingText}>Loading data...</Text>
          </View>
        ) : filteredBookings.length === 0 ? (
          <View style={s.emptyBox}>
            <MaterialCommunityIcons name={searchQuery ? "text-search" : "inbox-outline"} size={56} color={T.text3} style={{ marginBottom: 16 }} />
            <Text style={s.emptyTitle}>No results found</Text>
            <Text style={s.emptySubText}>{searchQuery ? "Try a different search term or filter" : "You have no bookings matching this criteria."}</Text>
          </View>
        ) : (
          filteredBookings.map((booking) => {
            const status = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.pending;
            return (
              <TouchableOpacity
                key={booking.id}
                onPress={() => router.push(`/(company)/booking/${booking.id}` as any)}
                style={[s.standardCard, { borderLeftColor: status.accent }]}
                activeOpacity={0.8}
              >
                {/* Card Header */}
                <View style={s.cardHeader}>
                  <View style={s.cardHeaderLeft}>
                    <Text style={s.cardId}>#{booking.id}</Text>
                    <Text style={s.cardTitle}>{booking.customer?.fullName ?? "Unknown"}</Text>
                  </View>
                  <View style={[s.statusBadge, { backgroundColor: status.bg }]}>
                    <Text style={[s.statusText, { color: status.color }]}>{status.label}</Text>
                  </View>
                </View>

                {/* Card Body */}
                <View style={s.cardBody}>
                  <View style={s.detailRow}>
                    <MaterialCommunityIcons name="briefcase-outline" size={16} color={T.text3} />
                    <Text style={s.detailText}>{booking.service?.name ?? "—"}</Text>
                  </View>
                  <View style={s.detailRow}>
                    <MaterialCommunityIcons name="calendar-outline" size={16} color={T.text3} />
                    <Text style={s.detailText}>
                      {new Date(booking.bookingDate).toLocaleDateString("en-US", {
                        weekday: "short", month: "short", day: "numeric",
                      })}
                      {booking.startTime ? ` · ${booking.startTime}` : ""}
                    </Text>
                  </View>
                </View>

                {/* Card Footer */}
                <View style={s.cardDivider} />
                <View style={s.cardFooter}>
                  {booking.assignedStaff ? (
                    <View style={s.footerLeft}>
                      <View style={s.avatarSmall}>
                        <Text style={s.avatarSmallText}>
                          {booking.assignedStaff.user?.fullName?.charAt(0)?.toUpperCase() ?? "S"}
                        </Text>
                      </View>
                      <Text style={s.footerLeftText}>{booking.assignedStaff.user?.fullName}</Text>
                    </View>
                  ) : (
                    <View style={s.footerLeft}>
                      <View style={[s.avatarSmall, { backgroundColor: T.border }]}>
                        <MaterialCommunityIcons name="account-question" size={14} color={T.text3} />
                      </View>
                      <Text style={[s.footerLeftText, { color: T.text3 }]}>Unassigned</Text>
                    </View>
                  )}
                  <Text style={s.footerRightText}>${Number(booking.totalPrice ?? 0).toFixed(2)}</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  
  // Header Standard
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: T.surface,
    borderBottomWidth: 1, borderBottomColor: T.border,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  menuBtn: { marginLeft: -8, padding: 8 },
  headerTitle: { fontSize: 22, fontWeight: "800", color: T.text1 },
  
  // Search & Filters Standard
  filtersContainer: { backgroundColor: T.surface, borderBottomWidth: 1, borderBottomColor: T.border, paddingBottom: 16 },
  searchBox: {
    flexDirection: "row", alignItems: "center", backgroundColor: T.bg,
    marginHorizontal: 16, marginTop: 16, paddingHorizontal: 16, borderRadius: 16, height: 48,
    borderWidth: 1, borderColor: T.border, gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, color: T.text1, fontWeight: "500" },
  filterChips: { paddingHorizontal: 16, paddingTop: 16, gap: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: T.bg, borderWidth: 1, borderColor: T.border },
  filterChipActive: { backgroundColor: T.accent, borderColor: T.accent },
  filterChipText: { fontSize: 13, fontWeight: "600", color: T.text2 },
  filterChipTextActive: { color: "#fff" },

  // List Standard
  listContent: { padding: 16, gap: 12, paddingBottom: 60 },
  loadingBox: { paddingVertical: 80, alignItems: "center" },
  loadingText: { fontSize: 14, color: T.text3, marginTop: 12, fontWeight: "500" },
  emptyBox: { alignItems: "center", paddingVertical: 80 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: T.text1 },
  emptySubText: { fontSize: 14, color: T.text3, marginTop: 4, textAlign: "center", paddingHorizontal: 32, lineHeight: 20 },

  // Card Standard
  standardCard: {
    backgroundColor: T.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: T.border, borderLeftWidth: 4, ...CARD_SHADOW,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  cardHeaderLeft: { flex: 1, paddingRight: 12 },
  cardId: { fontSize: 11, fontWeight: "700", color: T.text3, letterSpacing: 0.5, marginBottom: 4 },
  cardTitle: { fontSize: 16, fontWeight: "800", color: T.text1 },
  
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: "800", textTransform: "uppercase" },

  cardBody: { gap: 8, marginBottom: 16 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  detailText: { fontSize: 13, fontWeight: "500", color: T.text2 },

  cardDivider: { height: 1, backgroundColor: T.border, marginBottom: 16, marginHorizontal: -16 },
  
  cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  footerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  avatarSmall: { width: 24, height: 24, borderRadius: 12, backgroundColor: T.accent, alignItems: "center", justifyContent: "center" },
  avatarSmallText: { fontSize: 10, fontWeight: "800", color: "#fff" },
  footerLeftText: { fontSize: 13, fontWeight: "600", color: T.text1 },
  footerRightText: { fontSize: 15, fontWeight: "800", color: T.accent },
});
