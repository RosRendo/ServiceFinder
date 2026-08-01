/**
 * Admin Disputes List — Premium Deep Navy Redesign
 */
import React, { useState, useEffect } from "react";
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, StyleSheet, Platform
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { api } from "@/store/authStore";
import { useSidebarStore } from "@/store/sidebarStore";
import { Theme } from "@/constants/theme";

const T = Theme.colors;



type DisputeStatus = "open" | "under_review" | "resolved" | "closed";

const STATUS_CONFIG: Record<DisputeStatus, { label: string; color: string; bg: string }> = {
  open:         { label: "Open",         color: T.error,   bg: T.error + "15" },
  under_review: { label: "Under Review", color: T.warning, bg: T.warning + "15" },
  resolved:     { label: "Resolved",     color: T.success, bg: T.success + "15" },
  closed:       { label: "Closed",       color: T.gray,    bg: T.gray + "15" },
};

const TABS: { id: DisputeStatus | "all"; label: string }[] = [
  { id: "open",         label: "Open" },
  { id: "under_review", label: "In Review" },
  { id: "resolved",     label: "Resolved" },
  { id: "all",          label: "All" },
];

export default function AdminDisputesScreen() {
  const router = useRouter();
  const openSidebar = useSidebarStore((s) => s.setAdminOpen);
  const [activeTab, setActiveTab] = useState<DisputeStatus | "all">("open");
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchDisputes = async () => {
    try {
      const params = activeTab !== "all" ? { status: activeTab } : {};
      const res = await api.get("/api/admin/disputes", { params });
      // Backend returns { success: true, data: [...], meta: {} }
      const data = res.data?.data ?? [];
      setDisputes(Array.isArray(data) ? data : (data?.data ?? []));
    } catch (e) {
      console.error("Failed to fetch disputes", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  useEffect(() => {
    setLoading(true);
    fetchDisputes();
  }, [activeTab]);

  const handleReview = async (disputeId: string) => {
    setActionLoading(disputeId);
    try {
      await api.patch(`/api/admin/disputes/${disputeId}`, { status: "under_review" });
      await fetchDisputes();
    } catch {
      Alert.alert("Error", "Failed to update dispute status.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleResolve = (disputeId: string) => {
    Alert.alert(
      "Resolve Dispute",
      "Mark this dispute as resolved? Both parties will be notified.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Resolve",
          onPress: async () => {
            setActionLoading(disputeId);
            try {
              await api.patch(`/api/admin/disputes/${disputeId}`, { status: "resolved" });
              await fetchDisputes();
            } catch {
              Alert.alert("Error", "Failed to resolve dispute.");
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const renderDispute = ({ item }: { item: any }) => {
    const cfg = STATUS_CONFIG[item.status as DisputeStatus] ?? STATUS_CONFIG.open;
    const isActioning = actionLoading === item.id;

    return (
      <TouchableOpacity 
        style={s.card} 
        activeOpacity={0.7} 
        onPress={() => router.push(`/(admin)/disputes/${item.id}`)}
      >
        {/* Top row */}
        <View style={s.cardHeader}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={s.cardTitle} numberOfLines={2}>
              {item.reason || item.subject || "Dispute"}
            </Text>
            <Text style={s.cardSubtitle}>
              Booking #{item.bookingId?.slice(-8)?.toUpperCase() ?? "N/A"}
            </Text>
          </View>
          <View style={[s.badge, { backgroundColor: cfg.bg }]}>
            <Text style={[s.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>

        {/* Parties */}
        <View style={s.partiesRow}>
          <View style={s.partyCol}>
            <Text style={s.partyLabel}>Customer</Text>
            <Text style={s.partyValue}>{item.customer?.fullName ?? item.raisedBy?.fullName ?? "N/A"}</Text>
          </View>
          <View style={s.partyCol}>
            <Text style={s.partyLabel}>Against</Text>
            <Text style={s.partyValue}>{item.company?.name ?? item.againstCompany?.name ?? "N/A"}</Text>
          </View>
          <View>
            <Text style={s.partyLabel}>Date</Text>
            <Text style={s.dateValue}>
              {new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </Text>
          </View>
        </View>

        {/* Actions */}
        {(item.status === "open" || item.status === "under_review") && (
          <View style={s.cardActions}>
            {item.status === "open" && (
              <TouchableOpacity
                onPress={() => handleReview(item.id)}
                disabled={isActioning}
                style={[s.actionBtn, s.actionBtnLeft]}
              >
                {isActioning ? (
                  <ActivityIndicator size="small" color={T.accent} />
                ) : (
                  <Text style={s.actionBtnText}>Start Review</Text>
                )}
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => handleResolve(item.id)}
              disabled={isActioning}
              style={s.actionBtn}
            >
              {isActioning ? (
                <ActivityIndicator size="small" color={T.success} />
              ) : (
                <Text style={s.actionBtnTextSuccess}>Resolve</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const openCount = disputes.filter((d) => d.status === "open").length;

  return (
    <SafeAreaView style={s.root} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <TouchableOpacity onPress={() => openSidebar(true)} style={s.menuBtn}>
            <MaterialCommunityIcons name="menu" size={28} color={T.text1} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Disputes</Text>
        </View>
        {openCount > 0 && (
          <View style={s.openCountBadge}>
            <Text style={s.openCountText}>{openCount}</Text>
          </View>
        )}
      </View>

      {/* Tabs */}
      <View style={s.tabsRow}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => setActiveTab(tab.id)}
            style={[s.tab, activeTab === tab.id && s.tabActive]}
          >
            <Text style={[s.tabText, activeTab === tab.id && s.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {loading ? (
        <View style={s.loadingBox}>
          <ActivityIndicator size="large" color={T.accent} />
        </View>
      ) : (
        <FlatList
          data={disputes}
          keyExtractor={(item) => item.id}
          renderItem={renderDispute}
          contentContainerStyle={s.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDisputes(); }} tintColor={T.accent} />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.emptyBox}>
              <MaterialCommunityIcons name="scale-balance" size={48} color={T.text3} style={{ marginBottom: 16 }} />
              <Text style={s.emptyText}>No disputes found</Text>
              <Text style={s.emptySubText}>All clear in this category</Text>
            </View>
          }
        />
      )}
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
  openCountBadge: { backgroundColor: T.error, borderRadius: 12, minWidth: 24, height: 24, paddingHorizontal: 6, alignItems: "center", justifyContent: "center" },
  openCountText: { color: "#fff", fontSize: 12, fontWeight: "800" },

  tabsRow: { flexDirection: "row", backgroundColor: T.surface, borderBottomWidth: 1, borderBottomColor: T.border, paddingHorizontal: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabActive: { borderBottomColor: T.accent },
  tabText: { fontSize: 14, fontWeight: "600", color: T.text2 },
  tabTextActive: { color: T.accent, fontWeight: "700" },

  listContent: { padding: 16, paddingBottom: 60, gap: 16 },
  loadingBox: { flex: 1, alignItems: "center", justifyContent: "center" },

  card: { backgroundColor: T.surface, borderRadius: 20,  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", padding: 16, paddingBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: T.text1, marginBottom: 4 },
  cardSubtitle: { fontSize: 12, color: T.text3, fontWeight: "500" },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 10, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 },

  partiesRow: { flexDirection: "row", paddingHorizontal: 16, paddingBottom: 16, gap: 16 },
  partyCol: { flex: 1 },
  partyLabel: { fontSize: 10, fontWeight: "800", color: T.text3, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  partyValue: { fontSize: 13, fontWeight: "600", color: T.text1 },
  dateValue: { fontSize: 13, color: T.text2 },

  cardActions: { flexDirection: "row", borderTopWidth: 1, borderTopColor: T.border },
  actionBtn: { flex: 1, paddingVertical: 12, alignItems: "center", justifyContent: "center" },
  actionBtnLeft: { borderRightWidth: 1, borderRightColor: T.border },
  actionBtnText: { fontSize: 13, fontWeight: "800", color: T.accent },
  actionBtnTextSuccess: { fontSize: 13, fontWeight: "800", color: T.success },

  emptyBox: { alignItems: "center", paddingVertical: 80, paddingHorizontal: 32 },
  emptyText: { fontSize: 16, fontWeight: "700", color: T.text1 },
  emptySubText: { fontSize: 14, color: T.text3, marginTop: 4, textAlign: "center" },
});

