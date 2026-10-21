/**
 * Admin Global Bookings Directory — Enterprise Operations Cockpit
 */
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  StyleSheet,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import api from "@/utils/api";
import { useSidebarStore } from "@/store/sidebarStore";
import { Theme } from "@/constants/theme";
import ErrorState from "@/components/common/ErrorState";
import { useTranslation } from "react-i18next";

const T = Theme.colors;

type BookingStatus = "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";

const STATUS_CONFIG: Record<BookingStatus, { label: string; dotColor: string }> = {
  pending:     { label: "Pending",     dotColor: "#D97706" }, // Amber
  confirmed:   { label: "Confirmed",   dotColor: "#334155" }, // Slate
  in_progress: { label: "In Progress", dotColor: "#0284C7" }, // Blue
  completed:   { label: "Completed",   dotColor: "#059669" }, // Emerald
  cancelled:   { label: "Cancelled",   dotColor: "#DC2626" }, // Red
};

const FILTER_TABS: { id: BookingStatus | "all"; label: string }[] = [
  { id: "all",         label: "All" },
  { id: "pending",     label: "Pending" },
  { id: "confirmed",   label: "Confirmed" },
  { id: "in_progress", label: "In Progress" },
  { id: "completed",   label: "Completed" },
  { id: "cancelled",   label: "Cancelled" },
];

export default function AdminBookingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const openSidebar = useSidebarStore((s) => s.setAdminOpen);

  const [activeTab, setActiveTab] = useState<BookingStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookings = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const params: any = { limit: 150 };
      if (activeTab !== "all") {
        params.status = activeTab;
      }
      const res = await api.get("/bookings", { params });
      const payload = res.data?.data ?? res.data;
      const list = Array.isArray(payload) ? payload : (payload?.bookings || []);
      setBookings(list);
      setHasError(false);
    } catch (err) {
      console.error("Failed to load admin bookings", err);
      setHasError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const filteredBookings = useMemo(() => {
    if (!search.trim()) return bookings;
    const q = search.toLowerCase().trim();
    return bookings.filter((b) => {
      const bkgId = b.id?.toString().toLowerCase() || "";
      const cust = b.customer?.fullName?.toLowerCase() || "";
      const comp = b.company?.name?.toLowerCase() || "";
      const srv = b.service?.name?.toLowerCase() || "";
      const staff = b.assignedStaff?.user?.fullName?.toLowerCase() || "";
      return bkgId.includes(q) || cust.includes(q) || comp.includes(q) || srv.includes(q) || staff.includes(q);
    });
  }, [bookings, search]);

  const kpis = useMemo(() => {
    let totalVal = 0;
    let activeCount = 0;
    let completedCount = 0;

    bookings.forEach((b) => {
      const val = parseFloat(b.totalPrice) || 0;
      totalVal += val;
      if (["pending", "confirmed", "in_progress"].includes(b.status)) {
        activeCount++;
      } else if (b.status === "completed") {
        completedCount++;
      }
    });

    return {
      total: bookings.length,
      volume: totalVal.toFixed(2),
      active: activeCount,
      completed: completedCount,
    };
  }, [bookings]);

  const renderBookingCard = ({ item }: { item: any }) => {
    const sCfg = STATUS_CONFIG[item.status as BookingStatus] ?? { label: item.status || "Unknown", dotColor: "#94A3B8" };
    const dateFormatted = item.bookingDate
      ? new Date(item.bookingDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : "Pending Schedule";
    const timeFormatted = item.startTime ? `${item.startTime}${item.endTime ? ` - ${item.endTime}` : ''}` : '';
    const staffName = item.assignedStaff?.user?.fullName;

    return (
      <TouchableOpacity
        style={s.card}
        activeOpacity={0.7}
        onPress={() => router.push(`/(admin)/bookings/${item.id}` as any)}
      >
        {/* Card Header */}
        <View style={s.cardHeader}>
          <View style={s.refWrap}>
            <Text style={s.refText}>BKG-{item.id}</Text>
          </View>
          <View style={s.statusTag}>
            <View style={[s.statusDot, { backgroundColor: sCfg.dotColor }]} />
            <Text style={s.statusText}>{sCfg.label}</Text>
          </View>
        </View>

        {/* Service Title */}
        <Text style={s.serviceTitle} numberOfLines={1}>
          {item.service?.name || "General Service Booking"}
        </Text>

        {/* Stakeholder Details */}
        <View style={s.metaGrid}>
          <View style={s.metaRow}>
            <MaterialCommunityIcons name="account-outline" size={15} color="#64748B" />
            <Text style={s.metaLabel} numberOfLines={1}>
              {item.customer?.fullName || "Unregistered Customer"}
            </Text>
          </View>
          <View style={s.metaRow}>
            <MaterialCommunityIcons name="office-building-outline" size={15} color="#64748B" />
            <Text style={s.metaLabel} numberOfLines={1}>
              {item.company?.name || "Service Company"}
            </Text>
          </View>
        </View>

        {/* Schedule & Location */}
        <View style={s.scheduleRow}>
          <View style={s.scheduleItem}>
            <MaterialCommunityIcons name="calendar-clock" size={15} color="#475569" />
            <Text style={s.scheduleText}>{dateFormatted} {timeFormatted ? `· ${timeFormatted}` : ''}</Text>
          </View>
        </View>

        {/* Card Footer: Financials & Staff Assignment */}
        <View style={s.cardFooter}>
          <View style={s.priceBox}>
            <Text style={s.priceLabel}>Gross Escrow</Text>
            <Text style={s.priceValue}>${parseFloat(item.totalPrice || 0).toFixed(2)}</Text>
          </View>

          <View style={s.staffBox}>
            <MaterialCommunityIcons
              name={staffName ? "account-hard-hat" : "account-question-outline"}
              size={14}
              color={staffName ? "#334155" : "#94A3B8"}
            />
            <Text style={[s.staffText, !staffName && { color: "#94A3B8" }]} numberOfLines={1}>
              {staffName || "Unassigned Staff"}
            </Text>
          </View>

          <MaterialCommunityIcons name="chevron-right" size={18} color="#94A3B8" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={s.root} edges={["top", "left", "right"]}>
      {/* Top Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={t("common.openMenu")}
            onPress={() => openSidebar(true)}
            style={s.menuBtn}
          >
            <MaterialCommunityIcons name="menu" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Global Bookings</Text>
        </View>
        <View style={s.badge}>
          <Text style={s.badgeText}>{filteredBookings.length} Orders</Text>
        </View>
      </View>

      {/* KPI Ribbon */}
      <View style={s.kpiRibbon}>
        <View style={s.kpiItem}>
          <Text style={s.kpiLabel}>Total Orders</Text>
          <Text style={s.kpiValue}>{kpis.total}</Text>
        </View>
        <View style={s.kpiDivider} />
        <View style={s.kpiItem}>
          <Text style={s.kpiLabel}>Gross Volume</Text>
          <Text style={s.kpiValue}>${kpis.volume}</Text>
        </View>
        <View style={s.kpiDivider} />
        <View style={s.kpiItem}>
          <Text style={s.kpiLabel}>In Progress</Text>
          <Text style={[s.kpiValue, { color: "#0284C7" }]}>{kpis.active}</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={s.searchWrap}>
        <View style={s.searchBar}>
          <MaterialCommunityIcons name="magnify" size={18} color="#64748B" />
          <TextInput
            style={s.searchInput}
            placeholder="Search booking ref, customer, company, service..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
            clearButtonMode="while-editing"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")} style={{ padding: 4 }}>
              <MaterialCommunityIcons name="close-circle" size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={s.tabsRow}>
        <FlatList
          data={FILTER_TABS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(t) => t.id}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 6 }}
          renderItem={({ item: tab }) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                onPress={() => setActiveTab(tab.id)}
                style={[s.tab, isActive && s.tabActive]}
                activeOpacity={0.7}
              >
                <Text style={[s.tabText, isActive && s.tabTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Content */}
      {loading && !refreshing ? (
        <View style={s.centerBox}>
          <ActivityIndicator size="large" color="#0F172A" />
        </View>
      ) : hasError ? (
        <ErrorState onRetry={() => fetchBookings()} />
      ) : (
        <FlatList
          data={filteredBookings}
          keyExtractor={(item) => item.id?.toString()}
          renderItem={renderBookingCard}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchBookings(true)}
              tintColor="#0F172A"
            />
          }
          ListEmptyComponent={
            <View style={s.emptyBox}>
              <MaterialCommunityIcons name="calendar-search" size={44} color="#94A3B8" style={{ marginBottom: 12 }} />
              <Text style={s.emptyTitle}>No Bookings Found</Text>
              <Text style={s.emptySub}>
                {search ? "No booking records match your query." : "There are currently no orders under this status."}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  menuBtn: { marginLeft: -6, padding: 6 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A", letterSpacing: -0.3 },
  badge: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { fontSize: 12, fontWeight: "700", color: "#0F172A" },

  kpiRibbon: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    alignItems: "center",
  },
  kpiItem: { flex: 1, alignItems: "center" },
  kpiDivider: { width: 1, height: 26, backgroundColor: "#E2E8F0" },
  kpiLabel: { fontSize: 11, fontWeight: "600", color: "#64748B", textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 2 },
  kpiValue: { fontSize: 15, fontWeight: "700", color: "#0F172A" },

  searchWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: "#F8FAFC",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 13, color: "#0F172A", height: "100%" },

  tabsRow: {
    backgroundColor: "#F8FAFC",
    paddingBottom: 10,
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  tabActive: {
    backgroundColor: "#0F172A",
    borderColor: "#0F172A",
  },
  tabText: { fontSize: 12, fontWeight: "600", color: "#64748B" },
  tabTextActive: { color: "#FFFFFF", fontWeight: "700" },

  listContent: { padding: 16, paddingBottom: 120, gap: 12 },
  centerBox: { flex: 1, alignItems: "center", justifyContent: "center" },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  refWrap: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  refText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  statusTag: { flexDirection: "row", alignItems: "center", gap: 5 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: "600", color: "#475569" },

  serviceTitle: { fontSize: 15, fontWeight: "700", color: "#0F172A", marginBottom: 8, lineHeight: 20 },

  metaGrid: {
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    padding: 10,
    gap: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  metaLabel: { fontSize: 12, color: "#334155", fontWeight: "500", flex: 1 },

  scheduleRow: { marginBottom: 12 },
  scheduleItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  scheduleText: { fontSize: 12, color: "#64748B", fontWeight: "500" },

  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingTop: 10,
  },
  priceBox: {},
  priceLabel: { fontSize: 10, color: "#64748B", textTransform: "uppercase", letterSpacing: 0.3, fontWeight: "600" },
  priceValue: { fontSize: 14, fontWeight: "700", color: "#0F172A" },

  staffBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    maxWidth: "50%",
  },
  staffText: { fontSize: 11, fontWeight: "600", color: "#334155" },

  emptyBox: { alignItems: "center", paddingVertical: 80, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: "#0F172A", marginBottom: 4 },
  emptySub: { fontSize: 13, color: "#64748B", textAlign: "center" },
});
