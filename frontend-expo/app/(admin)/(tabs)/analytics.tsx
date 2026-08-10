/**
 * Admin Analytics — Premium Deep Navy Redesign
 * Data from /api/admin/analytics
 */
import React, { useState, useCallback } from "react";
import {
  ScrollView, Text, View, TouchableOpacity,
  ActivityIndicator, RefreshControl, StyleSheet, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import api from "@/utils/api";
import { useSidebarStore } from "@/store/sidebarStore";

import { Theme } from "@/constants/theme";

const T = Theme.colors;



function formatCurrency(n: number) {
  return "$" + Math.round(n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
function formatNumber(n: number) {
  if (!n) return "0";
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return n.toString();
}

// Lightweight bar chart using plain Views
function BarChart({ data, valueKey, labelKey, color }: {
  data: any[], valueKey: string, labelKey: string, color: string
}) {
  if (!data || data.length === 0) return (
    <View style={{ height: 120, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: T.text3, fontSize: 13 }}>No data yet</Text>
    </View>
  );
  const max = Math.max(...data.map(d => d[valueKey] || 0), 1);
  return (
    <View style={s.barChartWrap}>
      {data.map((item, i) => {
        const pct = Math.max(4, Math.round((item[valueKey] / max) * 100));
        const isMax = item[valueKey] === max;
        return (
          <View key={i} style={s.barCol}>
            <Text style={s.barValue}>
              {item[valueKey] > 999 ? (item[valueKey] / 1000).toFixed(1) + "k" : item[valueKey] || 0}
            </Text>
            <View style={[s.bar, { height: pct * 1.2, backgroundColor: isMax ? color : color + "40" }]} />
            <Text style={[s.barLabel, isMax && { color: T.text1, fontWeight: "700" }]}>{item[labelKey]}</Text>
          </View>
        );
      })}
    </View>
  );
}

// Status dot badge
function StatusDot({ color, label, value }: { color: string, label: string, value: number }) {
  return (
    <View style={s.statusDotRow}>
      <View style={[s.dot, { backgroundColor: color }]} />
      <Text style={s.statusDotLabel}>{label}</Text>
      <Text style={s.statusDotVal}>{value}</Text>
    </View>
  );
}

export default function Analytics() {
  const openSidebar = useSidebarStore((s) => s.setAdminOpen);
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const response = await api.get("/api/admin/analytics");
      const analytics = response.data?.data ?? response.data;
      setData(analytics);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchAnalytics(); }, [fetchAnalytics]));

  const kpiCards = data ? [
    { label: "Total Revenue", value: formatCurrency(data.totalRevenue), sub: `+${data.revenueGrowth || 0}% growth`, icon: "cash-multiple", color: T.success },
    { label: "Total Bookings", value: formatNumber(data.totalBookings), sub: `${data.completedBookings} completed`, icon: "calendar-check", color: T.blue },
    { label: "Total Users", value: formatNumber(data.totalUsers), sub: `+${data.usersGrowth || 0}% growth`, icon: "account-group", color: T.purple },
    { label: "Companies", value: formatNumber(data.totalCompanies), sub: `${data.pendingCompanies} pending`, icon: "office-building", color: T.warning },
  ] : [];

  return (
    <SafeAreaView style={s.root} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <TouchableOpacity onPress={() => openSidebar(true)} style={s.menuBtn}>
            <MaterialCommunityIcons name="menu" size={28} color={T.text1} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Analytics</Text>
        </View>
        <TouchableOpacity onPress={() => fetchAnalytics(true)} style={s.refreshBtn}>
          <MaterialCommunityIcons name="refresh" size={20} color={T.text1} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={s.loadingBox}>
          <ActivityIndicator size="large" color={T.accent} />
          <Text style={s.loadingText}>Loading analytics…</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchAnalytics(true)} tintColor={T.accent} />}
        >
          {/* KPI Cards Grid */}
          <View style={s.kpiGrid}>
            {kpiCards.map((card, i) => (
              <View key={i} style={s.kpiCard}>
                <View style={[s.kpiIconWrap, { backgroundColor: card.color + "15" }]}>
                  <MaterialCommunityIcons name={card.icon as any} size={22} color={card.color} />
                </View>
                <Text style={s.kpiValue}>{card.value}</Text>
                <Text style={s.kpiLabel}>{card.label}</Text>
                <Text style={s.kpiSub}>{card.sub}</Text>
              </View>
            ))}
          </View>

          {/* Revenue Card */}
          <View style={s.heroCard}>
            <View style={s.heroCardHeader}>
              <View>
                <Text style={s.heroCardTitle}>Platform Revenue</Text>
                <Text style={s.heroCardSub}>Last 6 months performance</Text>
              </View>
              <View style={s.growthPill}>
                <MaterialCommunityIcons name="trending-up" size={14} color="#fff" />
                <Text style={s.growthPillText}>+{data?.revenueGrowth || 0}%</Text>
              </View>
            </View>
            <Text style={s.heroCardAmount}>{formatCurrency(data?.totalRevenue || 0)}</Text>
            <View style={s.heroCardDecor1} />
            <View style={s.heroCardDecor2} />
          </View>

          {/* Monthly Revenue Chart */}
          <View style={s.chartSection}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Monthly Revenue</Text>
              <Text style={s.sectionSub}>6-month trend</Text>
            </View>
            <View style={s.chartCard}>
              <BarChart
                data={data?.monthlyData || []}
                valueKey="revenue"
                labelKey="name"
                color={T.success}
              />
            </View>
          </View>

          {/* Bookings Chart */}
          <View style={s.chartSection}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Monthly Bookings</Text>
              <Text style={s.sectionSub}>Volume over 6 months</Text>
            </View>
            <View style={s.chartCard}>
              <BarChart
                data={data?.monthlyData || []}
                valueKey="bookings"
                labelKey="name"
                color={T.blue}
              />
            </View>
          </View>

          {/* Registration Trend */}
          <View style={s.chartSection}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>New Registrations</Text>
              <Text style={s.sectionSub}>Users & companies joining monthly</Text>
            </View>
            <View style={s.chartCard}>
              <View style={s.legendRow}>
                <View style={s.legendItem}>
                  <View style={[s.legendDot, { backgroundColor: T.blue }]} />
                  <Text style={s.legendText}>Users</Text>
                </View>
                <View style={s.legendItem}>
                  <View style={[s.legendDot, { backgroundColor: T.purple }]} />
                  <Text style={s.legendText}>Companies</Text>
                </View>
              </View>
              <BarChart
                data={data?.registrationTrend || []}
                valueKey="users"
                labelKey="name"
                color={T.blue}
              />
            </View>
          </View>

          {/* Booking Status Breakdown */}
          {data?.statusBreakdown?.length > 0 && (
            <View style={s.chartSection}>
              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>Booking Status</Text>
                <Text style={s.sectionSub}>Distribution of all bookings</Text>
              </View>
              <View style={[s.chartCard, { gap: 12 }]}>
                {data.statusBreakdown.map((item: any, i: number) => {
                  const total = data.statusBreakdown.reduce((a: number, b: any) => a + b.value, 0) || 1;
                  const pct = Math.round((item.value / total) * 100);
                  return (
                    <View key={i}>
                      <View style={s.statusBarHeader}>
                        <View style={s.statusBarLeft}>
                          <View style={[s.dot, { backgroundColor: item.color || T.blue }]} />
                          <Text style={s.statusBarLabel}>{item.name}</Text>
                        </View>
                        <Text style={s.statusBarPct}>{item.value} ({pct}%)</Text>
                      </View>
                      <View style={s.progressTrack}>
                        <View style={[s.progressFill, { width: `${pct}%`, backgroundColor: item.color || T.blue }]} />
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Key Metrics Summary */}
          <View style={s.chartSection}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Key Metrics</Text>
              <Text style={s.sectionSub}>Platform-wide summary</Text>
            </View>
            <View style={s.metricsGrid}>
              {[
                { label: "Avg Booking Value", value: formatCurrency(data?.avgBookingValue || 0), icon: "tag-outline", color: T.success },
                { label: "Conversion Rate", value: `${data?.conversionRate || 0}%`, icon: "percent-outline", color: T.purple },
                { label: "Active Bookings", value: formatNumber(data?.activeBookings || 0), icon: "progress-clock", color: T.blue },
                { label: "Cancelled", value: formatNumber(data?.cancelledBookings || 0), icon: "close-circle-outline", color: T.error },
              ].map((m, i) => (
                <View key={i} style={s.metricCard}>
                  <View style={[s.metricIcon, { backgroundColor: m.color + "15" }]}>
                    <MaterialCommunityIcons name={m.icon as any} size={18} color={m.color} />
                  </View>
                  <Text style={s.metricValue}>{m.value}</Text>
                  <Text style={s.metricLabel}>{m.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Top Companies */}
          {data?.topCompanies?.length > 0 && (
            <View style={[s.chartSection, { paddingBottom: 0 }]}>
              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>Top Companies</Text>
                <Text style={s.sectionSub}>By completed jobs</Text>
              </View>
              <View style={s.chartCard}>
                {data.topCompanies.map((co: any, i: number) => (
                  <View key={i} style={[s.topCoRow, i > 0 && { borderTopWidth: 1, borderTopColor: T.border }]}>
                    <View style={s.topCoRank}>
                      <Text style={s.rankText}>#{i + 1}</Text>
                    </View>
                    <View style={s.topCoInfo}>
                      <Text style={s.topCoName} numberOfLines={1}>{co.name}</Text>
                      <Text style={s.topCoSub}>{co.completedJobs} jobs · {co.revenue}</Text>
                    </View>
                    <View style={s.ratingPill}>
                      <MaterialCommunityIcons name="star" size={12} color={T.warning} />
                      <Text style={s.ratingText}>{Number(co.rating).toFixed(1)}</Text>
                    </View>
                  </View>
                ))}
              </View>
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
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  menuBtn: { marginLeft: -8, padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: T.text1 },
  refreshBtn: { padding: 10, backgroundColor: T.bg, borderRadius: 20 },

  loadingBox: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { color: T.text3, fontSize: 14 },

  scrollContent: { padding: 16, gap: 0, paddingBottom: 60 },

  // KPI Grid
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 20 },
  kpiCard: { width: "47.5%", backgroundColor: T.surface, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: T.border },
  kpiIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  kpiValue: { fontSize: 24, fontWeight: "800", color: T.text1, marginBottom: 2 },
  kpiLabel: { fontSize: 12, fontWeight: "700", color: T.text2, marginBottom: 2 },
  kpiSub: { fontSize: 11, color: T.text3, fontWeight: "500" },

  // Hero Revenue Card
  heroCard: {
    backgroundColor: T.accent, borderRadius: 24, padding: 24, marginBottom: 20,
    overflow: "hidden", borderWidth: 1, borderColor: T.border, shadowColor: T.accent,
  },
  heroCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  heroCardTitle: { color: "rgba(255,255,255,0.9)", fontSize: 15, fontWeight: "700" },
  heroCardSub: { color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 2 },
  heroCardAmount: { color: "#fff", fontSize: 38, fontWeight: "800", letterSpacing: -1 },
  growthPill: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(255,255,255,0.15)", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  growthPillText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  heroCardDecor1: { position: "absolute", top: -40, right: -40, width: 140, height: 140, borderRadius: 70, backgroundColor: "rgba(255,255,255,0.05)" },
  heroCardDecor2: { position: "absolute", bottom: -20, right: 40, width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(255,255,255,0.05)" },

  // Chart sections
  chartSection: { marginBottom: 20 },
  sectionHeader: { marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: T.text1 },
  sectionSub: { fontSize: 12, color: T.text3, fontWeight: "500", marginTop: 2 },
  chartCard: { backgroundColor: T.surface, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: T.border },

  // Bar Chart
  barChartWrap: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", height: 140, gap: 4 },
  barCol: { flex: 1, alignItems: "center", justifyContent: "flex-end", gap: 4 },
  bar: { width: "70%", borderRadius: 6, minHeight: 4 },
  barLabel: { fontSize: 10, color: T.text3, fontWeight: "600", textTransform: "uppercase" },
  barValue: { fontSize: 9, color: T.text3, fontWeight: "700" },

  // Legend
  legendRow: { flexDirection: "row", gap: 16, marginBottom: 12 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, color: T.text2, fontWeight: "600" },

  // Status breakdown
  statusDotRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  statusDotLabel: { flex: 1, fontSize: 13, color: T.text2, fontWeight: "600" },
  statusDotVal: { fontSize: 13, color: T.text1, fontWeight: "800" },
  statusBarHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  statusBarLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusBarLabel: { fontSize: 13, color: T.text2, fontWeight: "600" },
  statusBarPct: { fontSize: 12, color: T.text3, fontWeight: "700" },
  progressTrack: { height: 8, backgroundColor: T.bg, borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4 },

  // Metrics grid
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  metricCard: { width: "47.5%", backgroundColor: T.surface, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: T.border },
  metricIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  metricValue: { fontSize: 20, fontWeight: "800", color: T.text1, marginBottom: 2 },
  metricLabel: { fontSize: 11, color: T.text3, fontWeight: "600" },

  // Top companies
  topCoRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 12 },
  topCoRank: { width: 28, height: 28, borderRadius: 8, backgroundColor: T.bg, alignItems: "center", justifyContent: "center" },
  rankText: { fontSize: 12, fontWeight: "800", color: T.text2 },
  topCoInfo: { flex: 1 },
  topCoName: { fontSize: 14, fontWeight: "700", color: T.text1 },
  topCoSub: { fontSize: 12, color: T.text3, marginTop: 2 },
  ratingPill: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: T.warning + "15", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  ratingText: { fontSize: 12, fontWeight: "700", color: T.warning },
});

