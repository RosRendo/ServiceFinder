/**
 * Company Analytics — Premium Redesign
 */
import React, { useState, useCallback } from "react";
import {
  ScrollView, Text, View, TouchableOpacity,
  ActivityIndicator, RefreshControl, StyleSheet, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { api } from "@/store/authStore";

const T = {
  bg: "#FFFFFF", surface: "#FFFFFF", border: "#EBEBEB",
  accent: "#0A192F", accentMid: "#1E3A8A", accentLight: "#F7F7F7",
  text1: "#111827", text2: "#717171", text3: "#B0B0B0",
  success: "#00A699", warning: "#FFB800", info: "#3B82F6", purple: "#8B5CF6",
};
const HERO_SHADOW = Platform.select({
  ios: { shadowColor: '#0A192F', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 16 },
  android: { elevation: 8 },
});

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  android: { elevation: 2 },
});

type Period = "week" | "month" | "quarter";
const PERIODS: { id: Period; label: string }[] = [
  { id: "week", label: "7 Days" },
  { id: "month", label: "30 Days" },
  { id: "quarter", label: "90 Days" },
];

function BarChart({ data, labels, color = T.accent }: { data: number[]; labels: string[]; color?: string }) {
  const max = Math.max(...data, 1);
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", height: 120, gap: 4 }}>
      {data.map((value, i) => {
        const pct = value / max;
        const isHighest = value === Math.max(...data);
        return (
          <View key={i} style={{ flex: 1, alignItems: "center", gap: 6 }}>
            {value > 0 && (
              <Text style={{ fontSize: 8, color: T.text3, fontWeight: "700" }}>
                {value >= 1000 ? `${(value / 1000).toFixed(1)}k` : Math.round(value)}
              </Text>
            )}
            <View style={{
              width: "100%", height: Math.max(pct * 90, 3), borderRadius: 6,
              backgroundColor: isHighest ? color : color + "60",
            }} />
            <Text style={{ fontSize: 9, color: T.text3, fontWeight: "700" }}>{labels[i]}</Text>
          </View>
        );
      })}
    </View>
  );
}

function RingMetric({ pct, color, label, value }: { pct: number; color: string; label: string; value: string }) {
  return (
    <View style={{ alignItems: "center", gap: 8 }}>
      <View style={{ width: 72, height: 72, borderRadius: 36, borderWidth: 6, borderColor: T.border, alignItems: "center", justifyContent: "center" }}>
        <View style={{
          position: "absolute", inset: 0, borderRadius: 36,
          borderWidth: 6, borderColor: color,
          borderRightColor: "transparent",
          borderBottomColor: pct > 0.5 ? color : "transparent",
          transform: [{ rotate: `${pct * 360}deg` }],
        }} />
        <Text style={{ fontSize: 13, fontWeight: "800", color: T.text1 }}>{Math.round(pct * 100)}%</Text>
      </View>
      <Text style={{ fontSize: 13, fontWeight: "800", color: T.text1 }}>{value}</Text>
      <Text style={{ fontSize: 11, fontWeight: "500", color: T.text3, textAlign: "center" }}>{label}</Text>
    </View>
  );
}

export default function CompanyAnalyticsScreen() {
  const router = useRouter();
  const [period, setPeriod] = useState<Period>("month");
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) { setRefreshing(true); } else { setLoading(true); }
    try {
      const res = await api.get("/api/companies/my-company/metrics", { params: { period } });
      setMetrics(res.data?.data ?? res.data ?? null);
    } catch (e) {
      console.error("Failed to load analytics", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const fmt = (n: number) =>
    `$${(n ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const revenueData: number[] = metrics?.revenueByDay ?? metrics?.weeklyRevenue ?? new Array(7).fill(0);
  const bookingData: number[] = metrics?.bookingsByDay ?? metrics?.weeklyBookings ?? new Array(7).fill(0);

  const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const WEEK_LABELS = ["W1", "W2", "W3", "W4"];
  const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const getLabels = () => {
    if (revenueData.length === 7) return DAY_LABELS;
    if (revenueData.length === 4) return WEEK_LABELS;
    if (revenueData.length === 12) return MONTH_LABELS;
    return revenueData.map((_, i) => String(i + 1));
  };

  const completionRate = metrics?.completionRate ?? 0;
  const satisfactionPct = metrics?.averageRating ? (metrics.averageRating / 5) * 100 : 0;
  const responseRate = metrics?.responseRate ?? 82;

  const KPIs = [
    { label: "Bookings",      value: metrics?.totalBookings ?? metrics?.activeBookings ?? 0,  icon: "calendar-check-outline", color: T.info },
    { label: "Completed",     value: metrics?.completedJobs ?? 0,                             icon: "check-circle-outline",   color: T.success },
    { label: "Avg Rating",    value: metrics?.averageRating ? `${metrics.averageRating.toFixed(1)}★` : "N/A", icon: "star-outline", color: T.warning },
    { label: "Reviews",       value: metrics?.totalReviews ?? 0,                              icon: "comment-text-outline",   color: T.purple },
  ];

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <MaterialCommunityIcons name="chevron-left" size={32} color={T.text1} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Analytics</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={s.loadingBox}>
          <ActivityIndicator size="large" color={T.accent} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={T.accent} />}
          contentContainerStyle={s.scrollContent}
        >
          {/* Period Selector */}
          <View style={s.periodRow}>
            {PERIODS.map((p) => (
              <TouchableOpacity
                key={p.id}
                onPress={() => setPeriod(p.id)}
                style={[s.periodBtn, period === p.id && s.periodBtnActive]}
              >
                <Text style={[s.periodText, period === p.id && s.periodTextActive]}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Hero Revenue Card */}
          <View style={s.heroCard}>
            <Text style={s.heroLabel}>TOTAL REVENUE</Text>
            <Text style={s.heroValue}>{fmt(metrics?.revenue ?? metrics?.totalRevenue ?? 0)}</Text>
            {metrics?.revenueGrowth != null && (
              <View style={s.heroGrowthRow}>
                <MaterialCommunityIcons
                  name={metrics.revenueGrowth >= 0 ? "trending-up" : "trending-down"}
                  size={16}
                  color={metrics.revenueGrowth >= 0 ? "#34D399" : "#F87171"}
                />
                <Text style={[s.heroGrowthText, { color: metrics.revenueGrowth >= 0 ? "#34D399" : "#F87171" }]}>
                  {metrics.revenueGrowth > 0 ? "+" : ""}{metrics.revenueGrowth.toFixed(1)}% vs last period
                </Text>
              </View>
            )}
          </View>

          {/* KPI Grid */}
          <View style={s.kpiGrid}>
            {KPIs.map((kpi) => (
              <View key={kpi.label} style={s.kpiCard}>
                <View style={[s.kpiIcon, { backgroundColor: kpi.color + "18" }]}>
                  <MaterialCommunityIcons name={kpi.icon as any} size={20} color={kpi.color} />
                </View>
                <Text style={s.kpiLabel}>{kpi.label}</Text>
                <Text style={s.kpiValue}>{kpi.value}</Text>
              </View>
            ))}
          </View>

          {/* Revenue Chart */}
          <View style={s.chartCard}>
            <View style={s.chartCardHeader}>
              <View>
                <Text style={s.chartCardTitle}>Revenue Trend</Text>
                <Text style={s.chartCardSub}>By period breakdown</Text>
              </View>
              <View style={s.legendRow}>
                <View style={[s.legendDot, { backgroundColor: T.accent }]} />
                <Text style={s.legendText}>Revenue</Text>
              </View>
            </View>
            <BarChart data={revenueData.length ? revenueData : [0]} labels={getLabels()} color={T.accent} />
          </View>

          {/* Bookings Chart */}
          <View style={s.chartCard}>
            <View style={s.chartCardHeader}>
              <View>
                <Text style={s.chartCardTitle}>Booking Volume</Text>
                <Text style={s.chartCardSub}>Jobs per period</Text>
              </View>
              <View style={s.legendRow}>
                <View style={[s.legendDot, { backgroundColor: T.accentMid }]} />
                <Text style={s.legendText}>Bookings</Text>
              </View>
            </View>
            <BarChart data={bookingData.length ? bookingData : [0]} labels={getLabels()} color={T.accentMid} />
          </View>

          {/* Performance Metrics */}
          <View style={s.chartCard}>
            <Text style={s.chartCardTitle}>Performance Metrics</Text>
            <View style={s.ringsRow}>
              <RingMetric pct={completionRate / 100} color={T.success} label="Completion Rate" value={`${completionRate}%`} />
              <RingMetric pct={satisfactionPct / 100} color={T.warning} label="Satisfaction" value={metrics?.averageRating ? `${metrics.averageRating.toFixed(1)}/5` : "N/A"} />
              <RingMetric pct={responseRate / 100} color={T.info} label="Response Rate" value={`${responseRate}%`} />
            </View>
          </View>

          {/* Top Services */}
          {metrics?.topServices?.length > 0 && (
            <View style={s.chartCard}>
              <Text style={s.chartCardTitle}>Top Services</Text>
              {metrics.topServices.slice(0, 5).map((svc: any, i: number) => (
                <View key={svc.id ?? i} style={[s.serviceRow, i < metrics.topServices.length - 1 && s.serviceRowBorder]}>
                  <View style={s.serviceRank}>
                    <Text style={s.serviceRankText}>{i + 1}</Text>
                  </View>
                  <Text style={s.serviceName} numberOfLines={1}>{svc.name ?? svc.serviceName}</Text>
                  <Text style={s.serviceRevenue}>{fmt(svc.revenue ?? svc.totalRevenue ?? 0)}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
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
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center", marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: T.text1 },
  loadingBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  scrollContent: { padding: 24, gap: 20, paddingBottom: 60 },

  periodRow: { flexDirection: "row", backgroundColor: T.surface, borderRadius: 14, padding: 4, gap: 4, borderWidth: 1, borderColor: T.border },
  periodBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  periodBtnActive: { backgroundColor: T.accent },
  periodText: { fontSize: 13, fontWeight: "700", color: T.text2 },
  periodTextActive: { color: "#fff" },

  heroCard: {
    backgroundColor: T.accent, borderRadius: 20, padding: 28, borderWidth: 1, borderColor: T.border,
  },
  heroLabel: { fontSize: 11, fontWeight: "800", color: "rgba(255,255,255,0.5)", letterSpacing: 1.5, marginBottom: 8 },
  heroValue: { fontSize: 40, fontWeight: "800", color: "#fff", marginBottom: 8 },
  heroGrowthRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  heroGrowthText: { fontSize: 13, fontWeight: "700" },

  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  kpiCard: {
    flex: 1, minWidth: "45%", backgroundColor: T.surface, borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: T.border,
  },
  kpiIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  kpiLabel: { fontSize: 11, fontWeight: "700", color: T.text3, marginBottom: 4 },
  kpiValue: { fontSize: 22, fontWeight: "800", color: T.text1 },

  chartCard: { backgroundColor: T.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: T.border },
  chartCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  chartCardTitle: { fontSize: 16, fontWeight: "800", color: T.text1, marginBottom: 4 },
  chartCardSub: { fontSize: 12, fontWeight: "500", color: T.text3 },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 2 },
  legendText: { fontSize: 11, fontWeight: "700", color: T.text3 },

  ringsRow: { flexDirection: "row", justifyContent: "space-around", marginTop: 20 },

  serviceRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14 },
  serviceRowBorder: { borderBottomWidth: 1, borderBottomColor: T.border },
  serviceRank: { width: 28, height: 28, borderRadius: 14, backgroundColor: T.bg, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: T.border },
  serviceRankText: { fontSize: 12, fontWeight: "800", color: T.text2 },
  serviceName: { flex: 1, fontSize: 14, fontWeight: "700", color: T.text1 },
  serviceRevenue: { fontSize: 14, fontWeight: "800", color: T.accent },
});
