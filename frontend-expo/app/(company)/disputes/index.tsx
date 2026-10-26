/**
 * Company Escrow Disputes Directory — Executive Provider Cockpit
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
import { api } from "@/store/authStore";
import { useSidebarStore } from "@/store/sidebarStore";
import ErrorState from "@/components/common/ErrorState";

type DisputeStatus = "open" | "responded" | "investigating" | "resolved" | "closed";

const STATUS_CONFIG: Record<DisputeStatus, { label: string; dotColor: string }> = {
  open:          { label: "Action Required", dotColor: "#D97706" }, // Amber
  responded:     { label: "Responded",       dotColor: "#0284C7" }, // Blue
  investigating: { label: "Under Review",    dotColor: "#334155" }, // Slate
  resolved:      { label: "Resolved",        dotColor: "#059669" }, // Emerald
  closed:        { label: "Closed",          dotColor: "#94A3B8" }, // Muted
};

const FILTER_TABS: { id: DisputeStatus | "all"; label: string }[] = [
  { id: "all",         label: "All Claims" },
  { id: "open",        label: "Open" },
  { id: "responded",   label: "Responded" },
  { id: "investigating",label: "Under Review" },
  { id: "resolved",    label: "Resolved" },
];

export default function CompanyDisputesScreen() {
  const router = useRouter();
  const setCompanyOpen = useSidebarStore((s) => s.setCompanyOpen);

  const [activeTab, setActiveTab] = useState<DisputeStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDisputes = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await api.get("/api/disputes");
      const payload = res.data?.data ?? res.data;
      const list = Array.isArray(payload) ? payload : (payload?.disputes || []);
      setDisputes(list);
      setHasError(false);
    } catch (err) {
      console.error("Failed to load company disputes", err);
      setHasError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  const filteredDisputes = useMemo(() => {
    return disputes.filter((d) => {
      const matchesFilter = activeTab === "all" || d.status === activeTab;
      if (!matchesFilter) return false;
      if (!search.trim()) return true;

      const q = search.toLowerCase().trim();
      const idStr = String(d.id || "").toLowerCase();
      const bkgStr = String(d.bookingId || "").toLowerCase();
      const customer = (d.customer?.fullName || d.customer?.name || "").toLowerCase();
      const type = (d.type || "").toLowerCase();
      return idStr.includes(q) || bkgStr.includes(q) || customer.includes(q) || type.includes(q);
    });
  }, [disputes, activeTab, search]);

  const openCount = disputes.filter((d) => d.status === "open").length;

  const renderDisputeCard = ({ item }: { item: any }) => {
    const sCfg = STATUS_CONFIG[item.status as DisputeStatus] ?? { label: item.status || "Unknown", dotColor: "#94A3B8" };
    const dateFormatted = item.createdAt
      ? new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : "Recent";
    const customerName = item.customer?.fullName || item.customer?.name || "Customer Client";

    return (
      <TouchableOpacity
        style={s.card}
        activeOpacity={0.7}
        onPress={() => router.push(`/(company)/disputes/${item.id}` as any)}
      >
        {/* Header */}
        <View style={s.cardHeader}>
          <View style={s.refWrap}>
            <Text style={s.refText}>DSP-{item.id}</Text>
          </View>
          <View style={s.statusTag}>
            <View style={[s.statusDot, { backgroundColor: sCfg.dotColor }]} />
            <Text style={s.statusText}>{sCfg.label}</Text>
          </View>
        </View>

        {/* Claim Type & Description */}
        <Text style={s.claimType}>
          {item.type ? item.type.replace(/_/g, " ").toUpperCase() : "SERVICE QUALITY CLAIM"}
        </Text>
        <Text style={s.claimDesc} numberOfLines={2}>
          {item.description || "Customer filed a mediation request regarding booking deliverables."}
        </Text>

        {/* Stakeholder & Associated Order */}
        <View style={s.metaBox}>
          <View style={s.metaRow}>
            <MaterialCommunityIcons name="account-outline" size={14} color="#64748B" />
            <Text style={s.metaText}>{customerName}</Text>
          </View>
          <View style={s.metaRow}>
            <MaterialCommunityIcons name="calendar-check-outline" size={14} color="#64748B" />
            <Text style={s.metaText}>Order #{item.bookingId || "—"}</Text>
          </View>
          <View style={s.metaRow}>
            <MaterialCommunityIcons name="clock-outline" size={14} color="#64748B" />
            <Text style={s.metaText}>{dateFormatted}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={s.cardFooter}>
          <View style={s.escrowTag}>
            <MaterialCommunityIcons name="shield-lock-outline" size={14} color="#D97706" />
            <Text style={s.escrowText}>Dispute open — escrow status pending</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={18} color="#94A3B8" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={s.root} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Open Menu"
            onPress={() => setCompanyOpen(true)}
            style={s.menuBtn}
          >
            <MaterialCommunityIcons name="menu" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Escrow Mediation</Text>
        </View>
        {openCount > 0 && (
          <View style={s.openBadge}>
            <Text style={s.openBadgeText}>{openCount} Action Required</Text>
          </View>
        )}
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <View style={s.searchBar}>
          <MaterialCommunityIcons name="magnify" size={18} color="#64748B" />
          <TextInput
            style={s.searchInput}
            placeholder="Search claim ref, order #, client..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")} style={{ padding: 4 }}>
              <MaterialCommunityIcons name="close-circle" size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tabs */}
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
        <ErrorState onRetry={() => fetchDisputes()} />
      ) : (
        <FlatList
          data={filteredDisputes}
          keyExtractor={(item) => item.id?.toString()}
          renderItem={renderDisputeCard}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchDisputes(true)}
              tintColor="#0F172A"
            />
          }
          ListEmptyComponent={
            <View style={s.emptyBox}>
              <MaterialCommunityIcons name="scale-balance" size={44} color="#94A3B8" style={{ marginBottom: 12 }} />
              <Text style={s.emptyTitle}>No Mediation Claims</Text>
              <Text style={s.emptySub}>
                {search ? "No claims match your search query." : "Your company currently has zero active dispute tickets."}
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
  openBadge: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  openBadgeText: { fontSize: 11, fontWeight: "700", color: "#DC2626" },

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

  tabsRow: { backgroundColor: "#F8FAFC", paddingBottom: 10 },
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

  claimType: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  claimDesc: { fontSize: 13, color: "#475569", lineHeight: 18, marginBottom: 12 },

  metaBox: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    padding: 10,
    gap: 12,
    marginBottom: 12,
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { fontSize: 12, color: "#475569", fontWeight: "500" },

  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingTop: 10,
  },
  escrowTag: { flexDirection: "row", alignItems: "center", gap: 6 },
  escrowText: { fontSize: 11, fontWeight: "600", color: "#D97706" },

  emptyBox: { alignItems: "center", paddingVertical: 80, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: "#0F172A", marginBottom: 4 },
  emptySub: { fontSize: 13, color: "#64748B", textAlign: "center" },
});
