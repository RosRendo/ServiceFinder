import React, { useState, useCallback, useRef, useEffect } from "react";
import { Image } from "expo-image";
import { ScrollView, Text, View, TouchableOpacity, TextInput, ActivityIndicator, RefreshControl, StyleSheet, Platform, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { api } from "@/store/authStore";
import { useSidebarStore } from "@/store/sidebarStore";
import { useTranslation } from "react-i18next";
import ErrorState from "@/components/common/ErrorState";
import { Theme } from "@/constants/theme";
import { MobileStatusPill } from "@/components/admin/ManagementCard";

const T = Theme.colors;

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 },
  android: { elevation: 3 },
});

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; accent: string }> = {
  pending:     { label: "Pending",     color: "#B45309", bg: "#FEF3C7", accent: "#F59E0B" },
  confirmed:   { label: "Confirmed",   color: "#1D4ED8", bg: "#DBEAFE", accent: "#3B82F6" },
  in_progress: { label: "In Progress", color: "#6D28D9", bg: "#EDE9FE", accent: "#8B5CF6" },
  completed:   { label: "Completed",   color: "#047857", bg: "#D1FAE5", accent: "#10B981" },
  cancelled:   { label: "Cancelled",   color: "#B91C1C", bg: "#FEE2E2", accent: "#EF4444" },
};

const FILTERS = [
  { key: "all",         label: "All" },
  { key: "pending",     label: "Pending" },
  { key: "confirmed",   label: "Confirmed" },
  { key: "in_progress", label: "In Progress" },
  { key: "completed",   label: "Completed" },
  { key: "cancelled",   label: "Cancelled" },
];

export default function Operations() {
  const router = useRouter();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const setCompanyOpen = useSidebarStore((s) => s.setCompanyOpen);

  const pulseAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.5, duration: 800, useNativeDriver: true })
      ])
    ).start();
  }, [pulseAnim]);

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
      setHasError(false);
    } catch (error) {
      console.error("Failed to load operations", error);
      setHasError(true);
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
          <TouchableOpacity onPress={() => setCompanyOpen(true)} style={s.menuBtn} accessibilityRole="button" accessibilityLabel="Open menu">
            <MaterialCommunityIcons name="menu" size={28} color={T.text1} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Operations</Text>
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
          <View style={s.skeletonContainer}>
            {[1, 2, 3].map((key) => (
              <Animated.View key={key} style={[s.skeletonCard, { opacity: pulseAnim }]}>
                <View style={s.skeletonHeader}>
                  <View style={s.skeletonLineShort} />
                  <View style={s.skeletonBadge} />
                </View>
                <View style={s.skeletonLineLong} />
                <View style={s.skeletonLineMedium} />
              </Animated.View>
            ))}
          </View>
        ) : hasError && bookings.length === 0 ? (
          <ErrorState onRetry={() => { setLoading(true); loadBookings(); }} />
        ) : filteredBookings.length === 0 ? (
          <View style={s.emptyBox}>
            <View style={s.emptyIconCircle}>
              <MaterialCommunityIcons name={searchQuery ? "file-search-outline" : "calendar-blank"} size={42} color={T.text3} />
            </View>
            <Text style={s.emptyTitle}>{searchQuery ? "No matching bookings" : "No bookings yet"}</Text>
            <Text style={s.emptySubText}>{searchQuery ? "Try adjusting your search or filters to find what you're looking for." : "When customers book your services, they will appear here."}</Text>
          </View>
        ) : (
          filteredBookings.map((booking) => {
            return (
              <TouchableOpacity
                key={booking.id}
                onPress={() => router.push(`/(company)/booking/${booking.id}` as any)}
                style={s.standardCard}
                activeOpacity={0.8}
              >
                {/* Card Header */}
                <View style={s.cardHeader}>
                  <View style={s.cardHeaderLeft}>
                    <Text style={s.cardId}>#{booking.id?.slice?.(-6)?.toUpperCase?.() || booking.id}</Text>
                    <Text style={s.cardTitle}>{booking.customer?.fullName ?? "Customer"}</Text>
                  </View>
                  <MobileStatusPill status={booking.status} />
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
  headerTitle: { fontSize: 22, fontWeight: "700", color: T.text1 },
  
  // Search & Filters Standard
  filtersContainer: { backgroundColor: T.surface, borderBottomWidth: 1, borderBottomColor: T.border, paddingBottom: 12 },
  searchBox: {
    flexDirection: "row", alignItems: "center", backgroundColor: T.bg,
    marginHorizontal: 16, marginTop: 12, paddingHorizontal: 16, borderRadius: 12, height: 44,
    borderWidth: 1, borderColor: T.border, gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, color: T.text1, fontWeight: "500" },
  filterChips: { paddingHorizontal: 16, paddingTop: 12, gap: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 24, backgroundColor: T.bg, borderWidth: 1, borderColor: T.border },
  filterChipActive: { backgroundColor: T.text1, borderColor: T.text1 },
  filterChipText: { fontSize: 13, fontWeight: "600", color: T.text2 },
  filterChipTextActive: { color: T.surface },

  // List Standard
  listContent: { padding: 16, gap: 12, paddingBottom: 80 },
  
  // Skeleton
  skeletonContainer: { gap: 12 },
  skeletonCard: { backgroundColor: T.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: T.border, gap: 12 },
  skeletonHeader: { flexDirection: "row", justifyContent: "space-between" },
  skeletonLineShort: { width: "40%", height: 16, backgroundColor: T.border, borderRadius: 8 },
  skeletonBadge: { width: 70, height: 24, backgroundColor: T.border, borderRadius: 12 },
  skeletonLineLong: { width: "80%", height: 16, backgroundColor: T.border, borderRadius: 8, marginTop: 8 },
  skeletonLineMedium: { width: "60%", height: 16, backgroundColor: T.border, borderRadius: 8 },

  emptyBox: { alignItems: "center", paddingVertical: 60 },
  emptyIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: T.border, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: T.text1, marginBottom: 8 },
  emptySubText: { fontSize: 14, color: T.text3, textAlign: "center", paddingHorizontal: 32, lineHeight: 22 },

  // Card Standard
  standardCard: {
    backgroundColor: T.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: T.border, ...CARD_SHADOW,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  cardHeaderLeft: { flex: 1, paddingRight: 12 },
  cardId: { fontSize: 11, fontWeight: "700", color: T.text3, letterSpacing: 0.5, marginBottom: 4, textTransform: "uppercase" },
  cardTitle: { fontSize: 17, fontWeight: "700", color: T.text1, lineHeight: 22 },
  
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },

  cardBody: { gap: 10, marginBottom: 16 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  detailText: { fontSize: 14, fontWeight: "500", color: T.text2 },

  cardDivider: { height: 1, backgroundColor: T.border, marginBottom: 16, marginHorizontal: -16 },
  
  cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  footerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  avatarSmall: { width: 26, height: 26, borderRadius: 13, backgroundColor: T.accent, alignItems: "center", justifyContent: "center" },
  avatarSmallText: { fontSize: 11, fontWeight: "700", color: "#fff" },
  footerLeftText: { fontSize: 13, fontWeight: "600", color: T.text1 },
  footerRightText: { fontSize: 16, fontWeight: "700", color: T.text1 },
});
