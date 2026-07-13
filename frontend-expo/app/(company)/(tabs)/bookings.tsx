/**
 * Company Bookings — Premium Redesign (Compact)
 */
import React, { useState, useCallback, useRef, useEffect } from "react";
import { Image } from "expo-image";
import { ScrollView, Text, View, TouchableOpacity, TextInput, ActivityIndicator, RefreshControl, StyleSheet, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { api } from "@/store/authStore";
import { useSidebarStore } from "@/store/sidebarStore";

const T = {
  bg: "#FFFFFF", surface: "#FFFFFF", border: "#EBEBEB",
  accent: "#0A192F", accentMid: "#1E3A8A", accentLight: "#F7F7F7",
  text1: "#111827", text2: "#717171", text3: "#B0B0B0",
  success: "#00A699", error: "#E31C5F", warning: "#FFB800",
  info: "#3B82F6", purple: "#8B5CF6",
};

const HERO_SHADOW = Platform.select({
  ios: { shadowColor: '#0A192F', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 16 },
  android: { elevation: 8 },
});

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  android: { elevation: 2 },
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
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const setCompanyOpen = useSidebarStore((s) => s.setCompanyOpen);

  // Debounce search input 300ms
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
    <>
      <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => setCompanyOpen(true)} style={s.menuBtn}>
            <MaterialCommunityIcons name="menu" size={28} color={T.accent} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Bookings</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Search */}
        <View style={s.searchWrap}>
          <View style={s.searchBox}>
            <MaterialCommunityIcons name="magnify" size={20} color={T.text3} />
            <TextInput
              placeholder="Search by ID or customer..."
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

        {/* Filter Chips */}
        <View style={{ height: 60 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filtersRow} style={{ flexGrow: 0 }}>
          {FILTERS.map((f, i) => (
            <TouchableOpacity
              key={f.key}
              onPress={() => setActiveFilter(f.key)}
              style={[
                s.filterChip, 
                activeFilter === f.key && s.filterChipActive,
                i !== FILTERS.length - 1 && { marginRight: 10 }
              ]}
            >
              <Text style={[s.filterChipText, activeFilter === f.key && s.filterChipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
          </ScrollView>
        </View>

        {/* Bookings List */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadBookings(true)} tintColor={T.accent} />}
        >
          {loading ? (
            <View style={s.loadingBox}>
              <ActivityIndicator size="large" color={T.accent} />
            </View>
          ) : filteredBookings.length === 0 ? (
            <View style={s.emptyBox}>
              <MaterialCommunityIcons name="inbox-outline" size={56} color={T.text3} />
              <Text style={s.emptyTitle}>No bookings found</Text>
              <Text style={s.emptySubtitle}>Try adjusting your search or filters</Text>
            </View>
          ) : (
            filteredBookings.map((booking) => {
              const status = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.pending;
              return (
                <TouchableOpacity
                  key={booking.id}
                  onPress={() => router.push(`/(company)/booking/${booking.id}` as any)}
                  style={[s.bookingCard, { borderLeftColor: status.accent }]}
                  activeOpacity={0.85}
                >
                  {/* Top row */}
                  <View style={s.cardTop}>
                    <View style={s.cardTopLeft}>
                      <Text style={s.bookingId}>#{booking.id}</Text>
                      <Text style={s.customerName}>{booking.customer?.fullName ?? "Unknown"}</Text>
                    </View>
                    <View style={[s.statusBadge, { backgroundColor: status.bg }]}>
                      <Text style={[s.statusText, { color: status.color }]}>{status.label}</Text>
                    </View>
                  </View>

                  {/* Details */}
                  <View style={s.cardDetails}>
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

                  <View style={s.cardDivider} />

                  {/* Footer */}
                  <View style={s.cardFooter}>
                    {booking.assignedStaff ? (
                      <View style={s.staffRow}>
                        <View style={s.staffAvatar}>
                          <Text style={s.staffInitial}>
                            {booking.assignedStaff.user?.fullName?.charAt(0)?.toUpperCase() ?? "S"}
                          </Text>
                        </View>
                        <Text style={s.staffName}>{booking.assignedStaff.user?.fullName}</Text>
                      </View>
                    ) : (
                      <View style={s.staffRow}>
                        <View style={[s.staffAvatar, { backgroundColor: T.border }]}>
                          <MaterialCommunityIcons name="account-question" size={16} color={T.text3} />
                        </View>
                        <Text style={[s.staffName, { color: T.text3 }]}>Unassigned</Text>
                      </View>
                    )}
                    <Text style={s.priceText}>${Number(booking.totalPrice ?? 0).toFixed(2)}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 24, paddingVertical: 16, backgroundColor: T.surface,
    borderBottomWidth: 1, borderBottomColor: T.border,
  },
  menuBtn: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: T.accent },

  searchWrap: { paddingHorizontal: 24, paddingVertical: 16, backgroundColor: T.surface, borderBottomWidth: 1, borderBottomColor: T.border },
  searchBox: { flexDirection: "row", alignItems: "center", backgroundColor: T.bg, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, gap: 10, borderWidth: 1, borderColor: T.border },
  searchInput: { flex: 1, fontSize: 15, color: T.text1, fontWeight: "500" },

  filtersRow: { paddingHorizontal: 24, paddingVertical: 14 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: T.border, backgroundColor: T.surface },
  filterChipActive: { backgroundColor: T.accent, borderColor: T.accent },
  filterChipText: { fontSize: 13, fontWeight: "700", color: T.text2 },
  filterChipTextActive: { color: "#fff" },

  listContent: { padding: 16, gap: 10, paddingBottom: 40 },
  loadingBox: { paddingVertical: 80, alignItems: "center" },
  emptyBox: { paddingVertical: 80, alignItems: "center", gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: T.text1, marginTop: 8 },
  emptySubtitle: { fontSize: 14, fontWeight: "500", color: T.text3 },

  bookingCard: {
    backgroundColor: T.surface, borderRadius: 20, padding: 16,
    borderLeftWidth: 4, borderWidth: 1, borderColor: T.border, ...CARD_SHADOW
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  cardTopLeft: { flex: 1 },
  bookingId: { fontSize: 10, fontWeight: "700", color: T.text3, letterSpacing: 1, marginBottom: 2 },
  customerName: { fontSize: 15, fontWeight: "800", color: T.text1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },

  cardDetails: { gap: 6, marginBottom: 10 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  detailText: { fontSize: 12, fontWeight: "600", color: T.text2 },
  cardDivider: { height: 1, backgroundColor: T.border, marginBottom: 10 },

  cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  staffRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  staffAvatar: { width: 26, height: 26, borderRadius: 13, backgroundColor: T.accentMid, alignItems: "center", justifyContent: "center" },
  staffInitial: { fontSize: 11, fontWeight: "800", color: "#fff" },
  staffName: { fontSize: 12, fontWeight: "600", color: T.text2 },
  priceText: { fontSize: 14, fontWeight: "800", color: T.accent },
});
