import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, StyleSheet, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import api from "@/utils/api";
import { Theme } from "@/constants/theme";

const T = Theme.colors;

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  android: { elevation: 2 },
});

type PayoutStatus = "pending" | "approved" | "paid" | "rejected";

const STATUS_CONFIG: Record<PayoutStatus, { label: string; color: string; bg: string; icon: string }> = {
  pending:  { label: "Pending",  color: T.warning, bg: T.warningBg, icon: "clock-outline" },
  approved: { label: "Approved", color: T.info, bg: T.blueBg, icon: "check-circle-outline" },
  paid:     { label: "Paid",     color: T.success, bg: T.successBg, icon: "bank-check" },
  rejected: { label: "Rejected", color: T.error, bg: T.errorBg, icon: "close-circle-outline" },
};

const FILTERS: { id: PayoutStatus | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "paid", label: "Paid" },
  { id: "rejected", label: "Rejected" },
];

export default function PayoutHistoryScreen() {
  const router = useRouter();
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<PayoutStatus | "all">("all");

  const fetchPayouts = async () => {
    try {
      const res = await api.get('/api/company/payouts');
      const list = res.data?.payouts || [];
      const mapped = list.map((p: any) => ({
        id: p.id,
        amount: p.amount,
        fee: 0,
        net: p.amount,
        status: p.status === 'completed' ? 'paid' : p.status,
        method: p.method === 'bank_transfer' ? 'Bank Transfer' : p.method,
        date: p.requestedAt || p.createdAt || new Date().toISOString()
      }));
      setPayouts(mapped);
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchPayouts(); }, []);

  const filtered = payouts.filter(p => filter === "all" || p.status === filter);
  const totalPaid = payouts.filter(p => p.status === "paid").reduce((sum, p) => sum + p.net, 0);

  const renderItem = ({ item }: { item: any }) => {
    const cfg = STATUS_CONFIG[item.status as PayoutStatus] ?? STATUS_CONFIG.pending;
    return (
      <View style={s.card}>
        <View style={s.cardHeader}>
          <View>
            <Text style={s.amountText}>${item.amount.toFixed(2)}</Text>
            <Text style={s.methodText}>via {item.method}</Text>
          </View>
          <View style={[s.badge, { backgroundColor: cfg.bg }]}>
            <MaterialCommunityIcons name={cfg.icon as any} size={12} color={cfg.color} />
            <Text style={[s.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>

        <View style={s.detailsRow}>
          <View style={s.detailCol}>
            <Text style={s.detailLabel}>Fee</Text>
            <Text style={s.feeValue}>-${item.fee.toFixed(2)}</Text>
          </View>
          <View style={s.detailCol}>
            <Text style={s.detailLabel}>Net Received</Text>
            <Text style={s.netValue}>${item.net.toFixed(2)}</Text>
          </View>
          <View style={s.detailCol}>
            <Text style={s.detailLabel}>Date</Text>
            <Text style={s.dateValue}>
              {new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={T.primary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Payout History</Text>
      </View>

      {/* Summary */}
      <View style={s.summaryCard}>
        <View>
          <Text style={s.summaryLabel}>Total Received</Text>
          <Text style={s.summaryValue}>${totalPaid.toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={s.requestBtn}
          onPress={() => router.push("/(company)/payouts/request")}
        >
          <Text style={s.requestBtnText}>Request Payout</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={s.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.id}
            style={[
              s.filterBtn,
              filter === f.id ? s.filterBtnActive : s.filterBtnInactive
            ]}
            onPress={() => setFilter(f.id)}
          >
            <Text style={[
              s.filterText,
              filter === f.id ? s.filterTextActive : s.filterTextInactive
            ]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={T.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={s.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPayouts(); }} tintColor={T.primary} />}
          ListEmptyComponent={
            <View style={s.emptyState}>
              <MaterialCommunityIcons name="bank-transfer-out" size={64} color={T.text3} />
              <Text style={s.emptyTitle}>No payouts yet</Text>
              <Text style={s.emptyDesc}>Your payout history will appear here.</Text>
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
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    backgroundColor: T.surface,
  },
  backBtn: {
    padding: 6,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: T.primary,
  },
  summaryCard: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: T.primary,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    ...CARD_SHADOW,
  },
  summaryLabel: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  summaryValue: {
    color: "white",
    fontSize: 24,
    fontWeight: "700",
    marginTop: 4,
  },
  requestBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  requestBtnText: {
    color: "white",
    fontWeight: "700",
    fontSize: 13,
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    ...CARD_SHADOW,
  },
  filterBtnActive: {
    backgroundColor: T.primary,
    borderColor: T.primary,
  },
  filterBtnInactive: {
    backgroundColor: T.surface,
    borderColor: T.border,
  },
  filterText: {
    fontSize: 13,
    fontWeight: "700",
  },
  filterTextActive: {
    color: "white",
  },
  filterTextInactive: {
    color: T.text2,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 16,
    paddingBottom: 60,
  },
  card: {
    backgroundColor: T.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: T.border,
    ...CARD_SHADOW,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  amountText: {
    fontWeight: "700",
    fontSize: 18,
    color: T.text1,
  },
  methodText: {
    fontSize: 12,
    color: T.text2,
    marginTop: 2,
    fontWeight: "500",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    marginLeft: 4,
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: T.border,
  },
  detailCol: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 10,
    color: T.text3,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  feeValue: {
    fontSize: 13,
    color: T.error,
    fontWeight: "600",
  },
  netValue: {
    fontSize: 13,
    fontWeight: "700",
    color: T.primary,
  },
  dateValue: {
    fontSize: 13,
    color: T.text1,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyTitle: {
    fontWeight: "700",
    color: T.text1,
    marginTop: 16,
    fontSize: 16,
  },
  emptyDesc: {
    color: T.text3,
    fontSize: 13,
    marginTop: 4,
  },
});
