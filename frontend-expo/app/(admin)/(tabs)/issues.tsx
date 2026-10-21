/**
 * Admin Issues & Dispute Triage — Quiet Luxury Standard
 * Displays disputes with SLA response deadlines and escrow amount tags.
 */
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import api from "@/utils/api";
import { useSidebarStore } from "@/store/sidebarStore";
import { FlashList as ShopifyFlashList } from "@shopify/flash-list";
import { Theme } from "@/constants/theme";
import ErrorState from "@/components/common/ErrorState";

const FlashList = ShopifyFlashList as any;
const T = Theme.colors;

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: "#0F172A", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  android: { elevation: 2 },
});

export default function IssuesTab() {
  const router = useRouter();
  const openSidebar = useSidebarStore((s) => s.setAdminOpen);
  const [activeTab, setActiveTab] = useState("open");
  const [disputes, setDisputes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDisputes = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const response = await api.get(`/api/disputes`);
      let data = response.data?.data ?? response.data?.disputes ?? response.data ?? [];
      if (!Array.isArray(data)) data = [];

      // Filter based on active tab
      data = data.filter((d: any) => {
        if (activeTab === "open") return d.status === "open" || d.status === "responded";
        return d.status === activeTab;
      });

      setDisputes(data);
    } catch (error) {
      console.error("Failed to fetch disputes:", error);
      setHasError(true);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchDisputes();
    }, [fetchDisputes])
  );

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "resolved":
        return { dotColor: "#059669", label: "RESOLVED" };
      case "open":
        return { dotColor: "#DC2626", label: "CLAIM OPEN" };
      case "responded":
        return { dotColor: "#2563EB", label: "DEFENSE FILED" };
      default:
        return { dotColor: "#64748B", label: status?.toUpperCase() || "UNKNOWN" };
    }
  };

  const tabs = [
    { id: "open", label: "Action Needed" },
    { id: "resolved", label: "Resolved" },
  ];

  return (
    <SafeAreaView style={s.root} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <TouchableOpacity onPress={() => openSidebar(true)} style={s.menuBtn}>
            <MaterialCommunityIcons name="menu" size={26} color="#0F172A" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Dispute Mediation</Text>
        </View>
        <View style={s.badge}>
          <Text style={s.badgeText}>{activeTab === "open" && !isLoading ? disputes.length : "—"}</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={s.tabWrapper}>
        <View style={s.tabContainer}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={[s.tabButton, isActive && s.tabButtonActive]}
                activeOpacity={0.8}
              >
                <Text style={[s.tabText, isActive && s.tabTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Disputes List */}
      {isLoading && !refreshing ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color="#0F172A" />
        </View>
      ) : hasError ? (
        <ErrorState onRetry={() => fetchDisputes()} />
      ) : (
        <FlashList
          data={disputes}
          estimatedItemSize={175}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchDisputes(true)} tintColor="#0F172A" />
          }
          contentContainerStyle={s.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={s.emptyWrap}>
              <View style={s.emptyIconCircle}>
                <MaterialCommunityIcons name="shield-check-outline" size={36} color="#0F172A" />
              </View>
              <Text style={s.emptyTitle}>Escrow Clear</Text>
              <Text style={s.emptyDesc}>No active disputes require mediation in this category.</Text>
            </View>
          )}
          renderItem={({ item }: any) => {
            const status = getStatusConfig(item.status);
            const escrowAmount = Number(
              item.booking?.totalPrice || item.amount || 45.0
            ).toFixed(2);

            // Compute SLA response deadline (48 hours from created)
            const createdTime = new Date(item.createdAt).getTime();
            const elapsedHours = Math.max(0, (Date.now() - createdTime) / 3600000);
            const remainingHours = Math.max(0, 48 - elapsedHours);
            const isBreached = remainingHours === 0;
            const isUrgent = remainingHours > 0 && remainingHours <= 12;
            const slaDotColor = isBreached ? "#DC2626" : isUrgent ? "#D97706" : "#059669";

            return (
              <TouchableOpacity
                onPress={() => router.push(`/(admin)/disputes/${item.id}` as any)}
                style={[s.itemCard, CARD_SHADOW]}
                activeOpacity={0.85}
              >
                {/* SLA Timeline Tag Header */}
                <View style={s.slaRow}>
                  <View style={s.slaBadge}>
                    <View style={[s.statusDotSmall, { backgroundColor: slaDotColor }]} />
                    <Text style={s.slaBadgeText}>
                      {isBreached ? "SLA Overdue" : `${Math.round(remainingHours)}h SLA Window`}
                    </Text>
                  </View>

                  <View style={s.escrowPill}>
                    <MaterialCommunityIcons name="lock" size={11} color="#0F172A" />
                    <Text style={s.escrowPillText}>${escrowAmount} ESCROW HOLD</Text>
                  </View>
                </View>

                {/* Case Header */}
                <View style={s.itemHeader}>
                  <Text style={s.itemCategory}>{item.type?.toUpperCase() || "SERVICE CLAIM"}</Text>
                  <View style={s.statusTag}>
                    <View style={[s.statusDotSmall, { backgroundColor: status.dotColor }]} />
                    <Text style={s.statusLabel}>{status.label}</Text>
                  </View>
                </View>

                {/* Comparative Evidence Split Row */}
                <View style={s.comparativeRow}>
                  <View style={{ flex: 1 }}>
                    <View style={s.partyHeader}>
                      <MaterialCommunityIcons name="account-outline" size={12} color="#64748B" />
                      <Text style={s.partyRole}>CLAIMANT</Text>
                    </View>
                    <Text style={s.partyName} numberOfLines={1}>
                      {item.customer?.fullName || item.customer?.name || "Customer"}
                    </Text>
                  </View>

                  <View style={s.partyDivider} />

                  <View style={{ flex: 1 }}>
                    <View style={s.partyHeader}>
                      <MaterialCommunityIcons name="office-building-outline" size={12} color="#64748B" />
                      <Text style={s.partyRole}>PROVIDER</Text>
                    </View>
                    <Text style={s.partyName} numberOfLines={1}>
                      {item.booking?.company?.name || item.company?.name || "Service Company"}
                    </Text>
                  </View>
                </View>

                <Text style={s.itemReason} numberOfLines={2}>
                  {item.reason || item.description || "No detail provided"}
                </Text>

                {/* Footer */}
                <View style={s.itemFooter}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <MaterialCommunityIcons name="calendar-clock" size={12} color="#94A3B8" />
                    <Text style={s.itemDate}>
                      {new Date(item.createdAt).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                    <Text style={s.arbitrateLink}>Arbitrate Case</Text>
                    <MaterialCommunityIcons name="arrow-right" size={13} color="#0F172A" />
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
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
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  menuBtn: { marginLeft: -6, padding: 6 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#0F172A", letterSpacing: -0.3 },
  badge: {
    backgroundColor: "#0F172A",
    minWidth: 26,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  badgeText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },

  tabWrapper: { paddingHorizontal: 16, paddingVertical: 12 },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#E2E8F0",
    borderRadius: 12,
    padding: 3,
  },
  tabButton: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 9 },
  tabButtonActive: {
    backgroundColor: "#0F172A",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: { fontSize: 12, fontWeight: "700", color: "#64748B" },
  tabTextActive: { color: "#FFFFFF" },

  loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center" },

  // paddingBottom: 120 guarantees content does not hide behind the floating tab bar
  listContent: { paddingHorizontal: 16, paddingBottom: 120 },

  itemCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  slaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  statusDotSmall: { width: 6, height: 6, borderRadius: 3 },
  slaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  slaBadgeText: { fontSize: 10, fontWeight: "700", color: "#334155" },
  escrowPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  escrowPillText: { fontSize: 10, fontWeight: "800", color: "#0F172A", letterSpacing: 0.3 },

  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  itemCategory: { fontSize: 10, fontWeight: "900", color: "#0F172A", letterSpacing: 0.8 },
  statusTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  statusLabel: { fontSize: 9, fontWeight: "800", color: "#334155", letterSpacing: 0.3 },

  comparativeRow: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 10,
  },
  partyHeader: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2 },
  partyRole: { fontSize: 9, fontWeight: "800", color: "#94A3B8", letterSpacing: 0.4 },
  partyName: { fontSize: 13, fontWeight: "700", color: "#0F172A" },
  partyDivider: { width: 1, backgroundColor: "#E2E8F0" },

  itemReason: { fontSize: 13, fontWeight: "600", color: "#334155", lineHeight: 18, marginBottom: 12 },

  itemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 10,
  },
  itemDate: { fontSize: 11, fontWeight: "500", color: "#94A3B8" },
  arbitrateLink: { fontSize: 12, fontWeight: "800", color: "#0F172A" },

  emptyWrap: { alignItems: "center", justifyContent: "center", paddingVertical: 80, paddingHorizontal: 32 },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptyTitle: { fontSize: 17, fontWeight: "800", color: "#0F172A", marginBottom: 4 },
  emptyDesc: { fontSize: 13, color: "#64748B", textAlign: "center" },
});
