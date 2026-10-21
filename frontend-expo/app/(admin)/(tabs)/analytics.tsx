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
import ErrorState from "@/components/common/ErrorState";
import { useTranslation } from "react-i18next";

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
// Lightweight bar chart using monochrome slate bars
function BarChart({ data, valueKey, labelKey }: {
  data: any[], valueKey: string, labelKey: string, color?: string
}) {
  if (!data || data.length === 0) return (
    <View style={{ height: 120, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: "#94A3B8", fontSize: 13 }}>No data recorded</Text>
    </View>
  );
  const max = Math.max(...data.map(d => d[valueKey] || 0), 1);
  return (
    <View style={s.barChartWrap}>
      {data.map((item, i) => {
        const pct = Math.max(8, Math.round((item[valueKey] / max) * 85));
        const isMax = item[valueKey] === max;
        return (
          <View key={i} style={s.barCol}>
            <Text style={s.barValue}>
              {item[valueKey] > 999 ? (item[valueKey] / 1000).toFixed(1) + "k" : item[valueKey] || 0}
            </Text>
            <View
              style={[
                s.bar,
                {
                  height: `${pct}%` as any,
                  backgroundColor: isMax ? "#0F172A" : "#CBD5E1",
                },
              ]}
            />
            <Text style={[s.barLabel, isMax && { color: "#0F172A", fontWeight: "700" }]}>{item[labelKey]}</Text>
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
  const { t } = useTranslation();
  const openSidebar = useSidebarStore((s) => s.setAdminOpen);
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const response = await api.get("/api/admin/analytics");
      const analytics = response.data?.data ?? response.data;
      setData(analytics);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
      setHasError(true);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchAnalytics(); }, [fetchAnalytics]));

  const kpiCards = data ? [
    { label: "Total Revenue", value: formatCurrency(data.totalRevenue), sub: `+${data.revenueGrowth || 0}% growth`, icon: "cash-multiple" },
    { label: "Total Bookings", value: formatNumber(data.totalBookings), sub: `${data.completedBookings} completed`, icon: "calendar-check" },
    { label: "Total Users", value: formatNumber(data.totalUsers), sub: `+${data.usersGrowth || 0}% growth`, icon: "account-group" },
    { label: "Companies", value: formatNumber(data.totalCompanies), sub: `${data.pendingCompanies} pending`, icon: "office-building" },
  ] : [];

  return (
    <SafeAreaView style={s.root} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <TouchableOpacity 
              accessibilityRole="button"
              accessibilityLabel={t('common.openMenu')}
              onPress={() => openSidebar(true)} style={s.menuBtn}>
            <MaterialCommunityIcons name="menu" size={26} color="#0F172A" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Platform Telemetry</Text>
        </View>
        <TouchableOpacity onPress={() => fetchAnalytics(true)} style={s.refreshBtn}>
          <MaterialCommunityIcons name="refresh" size={18} color="#0F172A" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={s.loadingBox}>
          <ActivityIndicator size="large" color="#0F172A" />
          <Text style={s.loadingText}>Loading telemetry…</Text>
        </View>
      ) : hasError ? (
        <ErrorState onRetry={() => fetchAnalytics()} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchAnalytics(true)} tintColor="#0F172A" />}
        >
          {/* Revenue Hero Card */}
          <View style={s.heroCard}>
            <View style={s.heroCardHeader}>
              <View>
                <Text style={s.heroCardTitle}>PLATFORM GROSS VOLUME</Text>
                <Text style={s.heroCardSub}>Consolidated 6-month transaction ledger</Text>
              </View>
              <View style={s.growthPill}>
                <View style={s.growthDot} />
                <Text style={s.growthPillText}>+{data?.revenueGrowth || 0}% vs prior</Text>
              </View>
            </View>
            <Text style={s.heroCardAmount}>{formatCurrency(data?.totalRevenue || 0)}</Text>
          </View>

          {/* KPI Cards Grid */}
          <View style={s.kpiGrid}>
            {kpiCards.map((card, i) => (
              <View key={i} style={s.kpiCard}>
                <View style={s.kpiIconWrap}>
                  <MaterialCommunityIcons name={card.icon as any} size={18} color="#0F172A" />
                </View>
                <Text style={s.kpiValue}>{card.value}</Text>
                <Text style={s.kpiLabel}>{card.label}</Text>
                <Text style={s.kpiSub}>{card.sub}</Text>
              </View>
            ))}
          </View>

          {/* Monthly Revenue Chart */}
          <View style={s.chartSection}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Monthly Revenue Trend</Text>
              <Text style={s.sectionSub}>Gross transaction volume</Text>
            </View>
            <View style={s.chartCard}>
              <BarChart
                data={data?.monthlyData || []}
                valueKey="revenue"
                labelKey="name"
              />
            </View>
          </View>

          {/* Bookings Chart */}
          <View style={s.chartSection}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Monthly Bookings Volume</Text>
              <Text style={s.sectionSub}>Dispatched orders across all categories</Text>
            </View>
            <View style={s.chartCard}>
              <BarChart
                data={data?.monthlyData || []}
                valueKey="bookings"
                labelKey="name"
              />
            </View>
          </View>

          {/* Registration Trend */}
          <View style={s.chartSection}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>New Account Registrations</Text>
              <Text style={s.sectionSub}>Verified user onboarding velocity</Text>
            </View>
            <View style={s.chartCard}>
              <BarChart
                data={data?.registrationTrend || []}
                valueKey="users"
                labelKey="name"
              />
            </View>
          </View>

          {/* Key Metrics Summary */}
          <View style={s.chartSection}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Platform Efficiency Ratios</Text>
              <Text style={s.sectionSub}>Operating benchmark ledger</Text>
            </View>
            <View style={s.metricsGrid}>
              {[
                { label: "Avg Booking Value", value: formatCurrency(data?.avgBookingValue || 0), icon: "tag-outline" },
                { label: "Conversion Rate", value: `${data?.conversionRate || 0}%`, icon: "percent-outline" },
                { label: "Active Orders", value: formatNumber(data?.activeBookings || 0), icon: "progress-clock" },
                { label: "Cancelled Orders", value: formatNumber(data?.cancelledBookings || 0), icon: "close-circle-outline" },
              ].map((m, i) => (
                <View key={i} style={s.metricCard}>
                  <View style={s.metricIcon}>
                    <MaterialCommunityIcons name={m.icon as any} size={16} color="#0F172A" />
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
                <Text style={s.sectionTitle}>Top Commercial Partners</Text>
                <Text style={s.sectionSub}>Ranked by settled volume</Text>
              </View>
              <View style={s.chartCard}>
                {data.topCompanies.map((co: any, i: number) => (
                  <View key={i} style={[s.topCoRow, i > 0 && s.topCoRowBorder]}>
                    <View style={s.topCoRank}>
                      <Text style={s.rankText}>#{i + 1}</Text>
                    </View>
                    <View style={s.topCoInfo}>
                      <Text style={s.topCoName} numberOfLines={1}>{co.name}</Text>
                      <Text style={s.topCoSub}>{co.completedJobs} jobs · {co.revenue}</Text>
                    </View>
                    <View style={s.ratingPill}>
                      <MaterialCommunityIcons name="star" size={11} color="#D97706" />
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
  root: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: "#FFFFFF",
    borderBottomWidth: 1, borderBottomColor: "#E2E8F0",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  menuBtn: { marginLeft: -8, padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  refreshBtn: { padding: 10, backgroundColor: "#F8FAFC", borderRadius: 20, borderWidth: 1, borderColor: "#E2E8F0" },

  loadingBox: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { color: "#64748B", fontSize: 14, fontWeight: "500" },

  scrollContent: { padding: 16, gap: 0, paddingBottom: 120 },

  // KPI Grid
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 20 },
  kpiCard: { width: "47.5%", backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#E2E8F0" },
  kpiIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  kpiValue: { fontSize: 22, fontWeight: "700", color: "#0F172A", marginBottom: 2 },
  kpiLabel: { fontSize: 12, fontWeight: "700", color: "#334155", marginBottom: 2 },
  kpiSub: { fontSize: 11, color: "#64748B", fontWeight: "500" },

  // Hero Revenue Card
  heroCard: {
    backgroundColor: "#0F172A", borderRadius: 20, padding: 22, marginBottom: 20,
    borderWidth: 1, borderColor: "#1E293B",
  },
  heroCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  heroCardTitle: { color: "#94A3B8", fontSize: 11, fontWeight: "700", letterSpacing: 0.8 },
  heroCardSub: { color: "#64748B", fontSize: 12, marginTop: 2 },
  heroCardAmount: { color: "#FFFFFF", fontSize: 36, fontWeight: "700", letterSpacing: -1 },
  growthPill: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#1E293B", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: "#334155" },
  growthDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#059669" },
  growthPillText: { color: "#E2E8F0", fontSize: 11, fontWeight: "600" },

  // Chart sections
  chartSection: { marginBottom: 20 },
  sectionHeader: { marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
  sectionSub: { fontSize: 12, color: "#64748B", fontWeight: "500", marginTop: 2 },
  chartCard: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#E2E8F0" },

  // Bar Chart
  barChartWrap: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", height: 140, gap: 4 },
  barCol: { flex: 1, alignItems: "center", justifyContent: "flex-end", gap: 4 },
  bar: { width: "70%", borderRadius: 4, minHeight: 4 },
  barLabel: { fontSize: 10, color: "#64748B", fontWeight: "600", textTransform: "uppercase" },
  barValue: { fontSize: 9, color: "#64748B", fontWeight: "700" },

  // Legend
  legendRow: { flexDirection: "row", gap: 16, marginBottom: 12 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, color: "#334155", fontWeight: "600" },

  // Status breakdown
  statusDotRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  statusDotLabel: { flex: 1, fontSize: 13, color: "#334155", fontWeight: "600" },
  statusDotVal: { fontSize: 13, color: "#0F172A", fontWeight: "700" },
  statusBarHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  statusBarLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusBarLabel: { fontSize: 13, color: "#334155", fontWeight: "600" },
  statusBarPct: { fontSize: 12, color: "#64748B", fontWeight: "700" },
  progressTrack: { height: 8, backgroundColor: "#F1F5F9", borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4 },

  // Metrics grid
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  metricCard: { width: "47.5%", backgroundColor: "#FFFFFF", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#E2E8F0" },
  metricIcon: { width: 34, height: 34, borderRadius: 8, backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0", alignItems: "center", justifyContent: "center", marginBottom: 10 },
  metricValue: { fontSize: 19, fontWeight: "700", color: "#0F172A", marginBottom: 2 },
  metricLabel: { fontSize: 11, color: "#64748B", fontWeight: "600" },

  // Top companies
  topCoRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 12 },
  topCoRowBorder: { borderTopWidth: 1, borderTopColor: "#E2E8F0" },
  topCoRank: { width: 28, height: 28, borderRadius: 6, backgroundColor: "#F1F5F9", borderWidth: 1, borderColor: "#E2E8F0", alignItems: "center", justifyContent: "center" },
  rankText: { fontSize: 12, fontWeight: "700", color: "#334155" },
  topCoInfo: { flex: 1 },
  topCoName: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  topCoSub: { fontSize: 12, color: "#64748B", marginTop: 2 },
  ratingPill: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  ratingText: { fontSize: 12, fontWeight: "700", color: "#0F172A" },
});

