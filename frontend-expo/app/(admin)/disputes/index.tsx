/**
 * Admin Disputes Center — Enterprise Clean Business Redesign
 */
import React, { useState, useCallback } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, RefreshControl, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import api from "@/utils/api";
import { FlashList as ShopifyFlashList } from "@shopify/flash-list";
import ErrorState from "@/components/common/ErrorState";
const FlashList = ShopifyFlashList as any;

export default function DisputesList() {
  const router = useRouter();
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

      data = data.filter((d: any) => {
        if (activeTab === 'open') return d.status === 'open' || d.status === 'responded';
        return d.status === activeTab;
      });

      setDisputes(data);
      setHasError(false);
    } catch (error) {
      console.error("Failed to fetch disputes:", error);
      setHasError(true);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useFocusEffect(useCallback(() => {
    setIsLoading(true);
    fetchDisputes();
  }, [fetchDisputes]));

  const getStatusColor = (status: string) => {
    switch (status) {
      case "resolved": return "#059669";
      case "open": return "#DC2626";
      case "responded": return "#D97706";
      default: return "#64748B";
    }
  };

  const tabs = [
    { id: "open", label: "Active Mediation" },
    { id: "resolved", label: "Settled Ledger" },
  ];

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={s.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color="#0F172A" />
          </TouchableOpacity>
          <View>
            <Text style={s.headerTitle}>Disputes Arbitration</Text>
            <Text style={s.headerSubtitle}>Escrow Custody & Mediation Cases</Text>
          </View>
        </View>
        <View style={s.countBadge}>
          <Text style={s.countBadgeText}>{activeTab === 'open' && !isLoading ? disputes.length : '—'}</Text>
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

      {/* Content */}
      {isLoading && !refreshing ? (
        <View style={s.loadingBox}>
          <ActivityIndicator size="large" color="#0F172A" />
          <Text style={s.loadingText}>Loading dispute records…</Text>
        </View>
      ) : hasError ? (
        <ErrorState onRetry={() => fetchDisputes()} />
      ) : (
        <FlashList
          data={disputes}
          keyExtractor={(item: any) => item.id.toString()}
          estimatedItemSize={200}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchDisputes(true)}
              tintColor="#0F172A"
            />
          }
          contentContainerStyle={s.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.emptyBox}>
              <MaterialCommunityIcons name="shield-check-outline" size={48} color="#94A3B8" style={{ marginBottom: 16 }} />
              <Text style={s.emptyText}>Zero Dispute Cases</Text>
              <Text style={s.emptySubText}>All commercial bookings operating smoothly without reported claims.</Text>
            </View>
          }
          renderItem={({ item: dispute }: any) => {
            const dotColor = getStatusColor(dispute.status);
            return (
              <TouchableOpacity
                style={s.disputeCard}
                onPress={() => router.push(`/(admin)/disputes/${dispute.id}` as any)}
                activeOpacity={0.85}
              >
                <View style={s.cardHeader}>
                  <View style={s.cardHeaderInfo}>
                    <Text style={s.disputeType} numberOfLines={1}>
                      {(dispute.type || "DISPUTE").replace(/_/g, ' ').toUpperCase()}
                    </Text>
                    <Text style={s.disputeId}>Case ID #{dispute.id}</Text>
                  </View>
                  <View style={s.statusBadge}>
                    <View style={[s.statusDot, { backgroundColor: dotColor }]} />
                    <Text style={s.statusText}>{dispute.status.toUpperCase()}</Text>
                  </View>
                </View>

                <View style={s.cardBody}>
                  <Text style={s.disputeDesc} numberOfLines={2}>
                    {dispute.description || "No dispute statement provided."}
                  </Text>

                  <View style={s.ledgerBox}>
                    <View style={s.ledgerRow}>
                      <Text style={s.ledgerLabel}>Client Claimant</Text>
                      <Text style={s.ledgerValue} numberOfLines={1}>{dispute.customer?.fullName || 'Client'}</Text>
                    </View>
                    <View style={s.ledgerRow}>
                      <Text style={s.ledgerLabel}>Provider Respondent</Text>
                      <Text style={s.ledgerValue} numberOfLines={1}>{dispute.company?.name || "Company"}</Text>
                    </View>
                    <View style={[s.ledgerRow, { borderBottomWidth: 0 }]}>
                      <Text style={s.ledgerLabel}>Custodial Escrow Value</Text>
                      <Text style={s.escrowAmount}>${Number(dispute.booking?.totalPrice || 0).toFixed(2)}</Text>
                    </View>
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: "#FFFFFF",
    borderBottomWidth: 1, borderBottomColor: "#E2E8F0",
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: "#F8FAFC",
    borderWidth: 1, borderColor: "#E2E8F0", alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: "#0F172A" },
  headerSubtitle: { fontSize: 12, color: "#64748B", fontWeight: "500", marginTop: 1 },
  countBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
    backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0",
  },
  countBadgeText: { color: "#0F172A", fontWeight: '700', fontSize: 13 },

  tabWrapper: { backgroundColor: "#FFFFFF", paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  tabContainer: { flexDirection: 'row', backgroundColor: "#F8FAFC", padding: 4, borderRadius: 10, borderWidth: 1, borderColor: "#E2E8F0" },
  tabButton: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabButtonActive: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E2E8F0" },
  tabText: { fontSize: 13, fontWeight: '600', color: "#64748B" },
  tabTextActive: { color: "#0F172A", fontWeight: '700' },

  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 80, gap: 12 },
  loadingText: { color: "#64748B", fontSize: 14, fontWeight: "500" },
  listContent: { padding: 16, paddingBottom: 120 },

  emptyBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, paddingHorizontal: 32 },
  emptyText: { fontSize: 16, fontWeight: '700', color: "#0F172A", marginBottom: 6 },
  emptySubText: { fontSize: 13, color: "#64748B", textAlign: 'center', lineHeight: 18 },

  disputeCard: {
    backgroundColor: "#FFFFFF", borderRadius: 16, borderWidth: 1, borderColor: "#E2E8F0",
    padding: 16,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardHeaderInfo: { flex: 1, marginRight: 12 },
  disputeType: { fontSize: 14, fontWeight: '700', color: "#0F172A" },
  disputeId: { fontSize: 11, color: "#64748B", marginTop: 2, fontWeight: "500" },

  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
    backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0",
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '700', color: "#0F172A" },

  cardBody: { gap: 10 },
  disputeDesc: { fontSize: 13, color: "#475569", lineHeight: 18 },

  ledgerBox: {
    backgroundColor: "#F8FAFC", borderRadius: 10, borderWidth: 1, borderColor: "#E2E8F0",
    overflow: "hidden", marginTop: 4,
  },
  ledgerRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#E2E8F0",
  },
  ledgerLabel: { fontSize: 11, color: "#64748B", fontWeight: "500" },
  ledgerValue: { fontSize: 12, fontWeight: "600", color: "#0F172A" },
  escrowAmount: { fontSize: 13, fontWeight: "700", color: "#0F172A" },
});
