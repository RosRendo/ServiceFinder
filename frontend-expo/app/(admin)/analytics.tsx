import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSidebarStore } from "@/store/sidebarStore";
import api from "@/utils/api";

type Period = "week" | "month" | "quarter";

const PERIOD_OPTIONS: { id: Period; label: string }[] = [
  { id: "week",    label: "7 Days" },
  { id: "month",   label: "30 Days" },
  { id: "quarter", label: "90 Days" },
];

function BarChart({ data, labels, color = "#002045" }: { data: number[]; labels: string[]; color?: string }) {
  const max = Math.max(...data, 1);
  return (
    <View className="flex-row items-end justify-between gap-1" style={{ height: 120 }}>
      {data.map((value, i) => {
        const pct = value / max;
        return (
          <View key={i} className="flex-1 items-center gap-1">
            {value > 0 && (
              <Text className="text-[8px] text-on-surface-variant" numberOfLines={1}>
                {value >= 1000 ? `${(value / 1000).toFixed(1)}k` : Math.round(value)}
              </Text>
            )}
            <View
              className="w-full rounded-t-md"
              style={{
                height: Math.max(pct * 90, 4),
                backgroundColor: pct > 0.75 ? color : pct > 0.4 ? `${color}cc` : `${color}66`,
              }}
            />
            <Text className="text-[9px] text-on-surface-variant font-medium">{labels[i]}</Text>
          </View>
        );
      })}
    </View>
  );
}

function MetricProgress({ pct, color, label, value }: { pct: number; color: string; label: string; value: string }) {
  return (
    <View className="items-center gap-1">
      <View className="w-16 h-16 rounded-full items-center justify-center" style={{ borderWidth: 6, borderColor: "#e5e7eb" }}>
        <View
          className="absolute inset-0 rounded-full"
          style={{
            borderWidth: 6,
            borderColor: color,
            borderRightColor: "transparent",
            borderBottomColor: pct > 0.5 ? color : "transparent",
            transform: [{ rotate: `${pct * 360}deg` }],
          }}
        />
        <Text className="text-xs font-extrabold text-on-surface">{Math.round(pct * 100)}%</Text>
      </View>
      <Text className="text-xs font-bold text-on-surface">{value}</Text>
      <Text className="text-[10px] text-on-surface-variant text-center">{label}</Text>
    </View>
  );
}

export default function Analytics() {
  const openSidebar = useSidebarStore((s) => s.setAdminOpen);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<Period>("month");

  const fetchMetrics = async (isRefresh = false) => {
    if (isRefresh) { setRefreshing(true); } else { setLoading(true); }
    try {
      const response = await api.get('/api/users/admin/metrics', { params: { period } });
      setMetrics(response.data);
    } catch (error) {
      console.error("Failed to fetch admin metrics", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchMetrics(); }, [period]);

  const formatCurrency = (amount: number) => {
    return '$' + Math.round(amount || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  if (loading && !metrics) {
    return (
      <SafeAreaView className="flex-1 bg-surface justify-center items-center">
        <ActivityIndicator size="large" color="#002045" />
      </SafeAreaView>
    );
  }

  const revenueData = metrics?.revenueHistory || [1200, 1900, 2400, 3100, 2800, 3900, 4200];
  const labels = metrics?.revenueLabels || ["M1", "M2", "M3", "M4", "M5", "M6", "M7"];
  const userGrowth = metrics?.userGrowthHistory || [50, 75, 120, 90, 150, 200, 220];

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top', 'left', 'right']}>
      <View className="flex-row items-center justify-between px-6 py-4 bg-surface border-b border-surface-container">
        <View className="flex-row items-center gap-4 flex-1">
          <TouchableOpacity onPress={openSidebar} className="active:scale-95 p-2 -ml-2">
            <MaterialCommunityIcons name="menu" size={28} color="#002045" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-primary font-headline">Analytics Dashboard</Text>
        </View>
        <TouchableOpacity className="bg-surface-container p-2 rounded-full">
          <MaterialCommunityIcons name="download" size={20} color="#002045" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4 py-4" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchMetrics(true)} />}>
        <View className="gap-5 pb-10">
          {/* Period selector */}
          <View className="flex-row bg-surface-container-low rounded-xl p-1 gap-1">
            {PERIOD_OPTIONS.map((opt) => (
               <TouchableOpacity
                key={opt.id}
                onPress={() => setPeriod(opt.id)}
                className={`flex-1 py-2 rounded-lg items-center ${period === opt.id ? "bg-primary" : ""}`}
              >
                <Text className={`text-xs font-bold ${period === opt.id ? "text-white" : "text-on-surface-variant"}`}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Revenue Overview */}
          <View className="bg-surface-container-lowest rounded-2xl p-5 border border-surface-container">
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Platform GMV</Text>
                <Text className="text-3xl font-extrabold text-primary mt-1">{formatCurrency(metrics?.gmv || 19540)}</Text>
                <Text className="text-xs text-green-600 mt-1 font-bold">↑ +14.5% vs last period</Text>
              </View>
              <View className="bg-primary-container p-3 rounded-2xl">
                <MaterialCommunityIcons name="finance" size={28} color="#1a365d" />
              </View>
            </View>
            <View className="pt-4 border-t border-surface-container">
              <Text className="text-xs text-on-surface-variant mb-3 font-semibold">Volume Trend</Text>
              <BarChart data={revenueData} labels={labels} color="#1a365d" />
            </View>
          </View>

          {/* Operational Metrics */}
          <Text className="font-headline font-bold text-on-surface px-1 mt-2">Operations</Text>
          <View className="flex-row gap-4">
            <View className="flex-1 bg-primary rounded-2xl p-5 shadow-sm">
              <Text className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Platform Fees</Text>
              <Text className="text-2xl font-extrabold text-white mt-1">{formatCurrency(metrics?.platformFees || 1954)}</Text>
              <View className="mt-4 flex-row items-center gap-1 bg-white/20 self-start px-2 py-1 rounded-md">
                 <MaterialCommunityIcons name="trending-up" size={12} color="white" />
                 <Text className="text-[10px] text-white font-bold">+8.2%</Text>
              </View>
            </View>
            <View className="flex-1 bg-surface-container-lowest border border-surface-container rounded-2xl p-5">
              <Text className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Total Bookings</Text>
              <Text className="text-2xl font-extrabold text-primary mt-1">{metrics?.totalBookings || 842}</Text>
              <View className="mt-4 flex-row items-center gap-1 bg-green-100 self-start px-2 py-1 rounded-md">
                 <MaterialCommunityIcons name="check-circle" size={12} color="#16a34a" />
                 <Text className="text-[10px] text-green-700 font-bold">92% Completion</Text>
              </View>
            </View>
          </View>

          <View className="bg-surface-container-lowest rounded-2xl p-5 border border-surface-container flex-row justify-around">
            <MetricProgress pct={0.92} color="#10b981" label="Completion Rate" value="774 Jobs" />
            <MetricProgress pct={0.06} color="#f59e0b" label="Cancellations" value="50 Jobs" />
            <MetricProgress pct={0.02} color="#ef4444" label="Disputes" value="18 Cases" />
          </View>

          {/* User Acquisition */}
          <Text className="font-headline font-bold text-on-surface px-1 mt-2">Network Growth</Text>
          <View className="bg-surface-container-lowest rounded-2xl p-5 border border-surface-container">
            <View className="flex-row justify-between items-center mb-4">
              <View>
                <Text className="text-sm font-bold text-on-surface">User Acquisition</Text>
                <Text className="text-xs text-on-surface-variant">New signups per month</Text>
              </View>
              <View className="bg-blue-100 px-3 py-1 rounded-full">
                <Text className="text-xs font-bold text-blue-700">+31% YoY</Text>
              </View>
            </View>
            <BarChart data={userGrowth} labels={labels} color="#059669" />
          </View>

          {/* Ecosystem Health */}
          <View className="bg-surface-container-lowest rounded-2xl p-5 border border-surface-container mb-6">
            <Text className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-4">Ecosystem Breakdown</Text>
            <View className="gap-4">
              <View className="flex-row justify-between items-center py-2 border-b border-surface-container">
                <View className="flex-row items-center gap-3">
                  <View className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center"><MaterialCommunityIcons name="account-group" size={16} color="#1d4ed8" /></View>
                  <Text className="text-sm text-on-surface font-semibold">Customers</Text>
                </View>
                <Text className="text-sm font-bold text-primary">{metrics?.totalUsers || "12,482"}</Text>
              </View>
              <View className="flex-row justify-between items-center py-2 border-b border-surface-container">
                 <View className="flex-row items-center gap-3">
                  <View className="w-8 h-8 rounded-full bg-purple-100 items-center justify-center"><MaterialCommunityIcons name="office-building" size={16} color="#7c3aed" /></View>
                  <Text className="text-sm text-on-surface font-semibold">Service Companies</Text>
                </View>
                <Text className="text-sm font-bold text-primary">{metrics?.totalCompanies || "342"}</Text>
              </View>
              <View className="flex-row justify-between items-center py-2">
                 <View className="flex-row items-center gap-3">
                  <View className="w-8 h-8 rounded-full bg-amber-100 items-center justify-center"><MaterialCommunityIcons name="account-hard-hat" size={16} color="#d97706" /></View>
                  <Text className="text-sm text-on-surface font-semibold">Active Staff</Text>
                </View>
                <Text className="text-sm font-bold text-primary">{metrics?.totalStaff || "1,894"}</Text>
              </View>
            </View>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

