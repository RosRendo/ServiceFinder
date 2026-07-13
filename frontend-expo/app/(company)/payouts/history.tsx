import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import api from "@/utils/api";

type PayoutStatus = "pending" | "approved" | "paid" | "rejected";

const STATUS_CONFIG: Record<PayoutStatus, { label: string; color: string; bg: string; icon: string }> = {
  pending:  { label: "Pending",  color: "#d97706", bg: "#fef3c7", icon: "clock-outline" },
  approved: { label: "Approved", color: "#1ba9ed", bg: "#e0f2fe", icon: "check-circle-outline" },
  paid:     { label: "Paid",     color: "#059669", bg: "#d1fae5", icon: "bank-check" },
  rejected: { label: "Rejected", color: "#dc2626", bg: "#fee2e2", icon: "close-circle-outline" },
};

// No mock payouts needed

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
      <View className="bg-surface-container-lowest rounded-2xl p-4 mb-3 border border-surface-container">
        <View className="flex-row justify-between items-start mb-3">
          <View>
            <Text className="font-bold text-lg text-on-surface">${item.amount.toFixed(2)}</Text>
            <Text className="text-xs text-on-surface-variant mt-0.5">via {item.method}</Text>
          </View>
          <View className="flex-row items-center px-3 py-1 rounded-full" style={{ backgroundColor: cfg.bg }}>
            <MaterialCommunityIcons name={cfg.icon as any} size={12} color={cfg.color} />
            <Text className="text-xs font-bold ml-1" style={{ color: cfg.color }}>{cfg.label}</Text>
          </View>
        </View>

        <View className="flex-row justify-between pt-3 border-t border-outline-variant">
          <View>
            <Text className="text-[10px] text-on-surface-variant uppercase tracking-wider">Fee</Text>
            <Text className="text-sm text-error">-${item.fee.toFixed(2)}</Text>
          </View>
          <View>
            <Text className="text-[10px] text-on-surface-variant uppercase tracking-wider">Net Received</Text>
            <Text className="text-sm font-bold text-primary">${item.net.toFixed(2)}</Text>
          </View>
          <View>
            <Text className="text-[10px] text-on-surface-variant uppercase tracking-wider">Date</Text>
            <Text className="text-sm text-on-surface">
              {new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="flex-row items-center px-4 py-3 border-b border-surface-container">
        <TouchableOpacity onPress={() => router.back()} className="p-2 mr-2">
          <MaterialCommunityIcons name="arrow-left" size={24} color="#191c1e" />
        </TouchableOpacity>
        <Text className="text-xl font-headline font-bold text-on-surface">Payout History</Text>
      </View>

      {/* Summary */}
      <View className="mx-4 mt-4 mb-2 bg-primary rounded-2xl p-4 flex-row justify-between items-center">
        <View>
          <Text className="text-white/80 text-xs uppercase tracking-wider">Total Received</Text>
          <Text className="text-white text-2xl font-bold mt-1">${totalPaid.toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          className="bg-white/20 px-4 py-2 rounded-full"
          onPress={() => router.push("/(company)/payouts/request")}
        >
          <Text className="text-white font-bold text-sm">Request Payout</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View className="flex-row px-4 py-3 gap-2">
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.id}
            className={`px-4 py-1.5 rounded-full border ${filter === f.id ? "bg-primary border-primary" : "border-outline-variant"}`}
            onPress={() => setFilter(f.id)}
          >
            <Text className={`text-sm font-bold ${filter === f.id ? "text-white" : "text-on-surface-variant"}`}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1ba9ed" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPayouts(); }} colors={["#1ba9ed"]} />}
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <MaterialCommunityIcons name="bank-transfer-out" size={64} color="#c4c6cf" />
              <Text className="font-bold text-on-surface mt-4">No payouts yet</Text>
              <Text className="text-on-surface-variant text-sm mt-1">Your payout history will appear here.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
