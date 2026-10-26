/**
 * Company Operational & Financial Analytics — Executive Obsidian Standard
 */
import React, { useState, useCallback } from "react";
import {
  ScrollView, Text, View, TouchableOpacity,
  ActivityIndicator, RefreshControl, StyleSheet, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { Image } from "expo-image";
import { api } from "@/store/authStore";
import ErrorState from "@/components/common/ErrorState";
import InitialsAvatar from "@/components/common/InitialsAvatar";
import { Theme } from "@/constants/theme";

const T = Theme.colors;

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
  android: { elevation: 3 },
});

function BarChart({ data, labels, color = "#38BDF8" }: { data: number[]; labels: string[]; color?: string }) {
  const max = Math.max(...data, 1);
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", height: 110, gap: 4 }}>
      {data.map((value, i) => {
        const pct = value / max;
        const isHighest = value === Math.max(...data) && value > 0;
        return (
          <View key={i} style={{ flex: 1, alignItems: "center", gap: 6 }}>
            {value > 0 ? (
              <Text style={{ fontSize: 8, color: isHighest ? "#0F172A" : T.text3, fontWeight: isHighest ? "800" : "600" }}>
                {value >= 1000 ? `${(value / 1000).toFixed(1)}k` : Math.round(value)}
              </Text>
            ) : (
              <View style={{ height: 10 }} />
            )}
            <View style={{
              width: "100%", height: Math.max(pct * 75, 4), borderRadius: 5,
              backgroundColor: isHighest ? color : color + "40",
            }} />
            <Text style={{ fontSize: 9, color: T.text3, fontWeight: "700" }}>{labels[i]}</Text>
          </View>
        );
      })}
    </View>
  );
}

export default function CompanyAnalyticsScreen() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<any>(null);
  const [revenueData, setRevenueData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) { setRefreshing(true); } else { setLoading(true); }
    try {
      const [metricsRes, revRes] = await Promise.allSettled([
        api.get("/api/companies/my-company/metrics"),
        api.get("/api/companies/my-company/revenue"),
      ]);

      if (metricsRes.status === "fulfilled") {
        const d = metricsRes.value.data;
        setMetrics(d?.data ?? d ?? null);
      }
      if (revRes.status === "fulfilled") {
        const rd = revRes.value.data;
        setRevenueData(rd?.data ?? rd ?? null);
      }
      if (metricsRes.status === "rejected" && revRes.status === "rejected") {
        setHasError(true);
      } else {
        setHasError(false);
      }
    } catch (e) {
      setHasError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const fmt = (n: number) =>
    `$${(n ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const totalGross = revenueData?.breakdown?.gross ?? metrics?.revenue ?? 0;
  const platformFee = revenueData?.breakdown?.platformFee;
  const staffPayout = revenueData?.breakdown?.staffPayout;
  const netProfit = revenueData?.breakdown?.net;

  const revenueGrowth = metrics?.revenueGrowth;
  const completedJobsCount = Array.isArray(metrics?.statusDistribution)
    ? metrics.statusDistribution.find((x: any) => x?.name === "Completed")?.value ?? 0
    : 0;
  const completionRate = metrics?.completionRate;
  const averageRating = metrics?.averageRating;
  const activeCrew = revenueData?.staffData?.length ?? metrics?.topStaff?.length ?? null;

  const revTrend = Array.isArray(revenueData?.trendData)
    ? revenueData.trendData.map((t: any) => ({ label: t.day?.slice(0, 3) ?? "", value: Number(t.gross || 0) }))
    : [];
  const bookTrend = Array.isArray(revenueData?.trendData)
    ? revenueData.trendData.map((t: any) => ({ label: t.day?.slice(0, 3) ?? "", value: Number(t.bookings || 0) }))
    : [];
  const topServices: any[] = Array.isArray(revenueData?.serviceData) ? revenueData.serviceData.slice(0, 5) : [];
  const staffLeaderboard: any[] = Array.isArray(revenueData?.staffData) ? revenueData.staffData.slice(0, 5) : [];

  return (
    <SafeAreaView style={s.root} edges={["top", "left", "right"]}>
      {/* Top Executive Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={T.text1} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>Intelligence & P&L</Text>
          <Text style={s.headerSubtitle}>Fleet & Financial Performance</Text>
        </View>
        <TouchableOpacity onPress={() => loadData(true)} style={s.refreshBtn}>
          <MaterialCommunityIcons name="refresh" size={20} color={T.text2} />
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={s.loadingBox}>
          <ActivityIndicator size="large" color="#0284C7" />
          <Text style={s.loadingText}>Compiling business metrics...</Text>
        </View>
      ) : hasError && !metrics && !revenueData ? (
        <ErrorState onRetry={() => { setLoading(true); loadData(); }} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} tintColor="#0284C7" />}
          contentContainerStyle={s.scrollContent}
        >
          {/* Obsidian Hero Revenue Card */}
          <View style={[s.heroCard, CARD_SHADOW]}>
            <View style={s.heroTopRow}>
              <View>
                <Text style={s.heroLabel}>GROSS REVENUE</Text>
                <Text style={s.heroValue}>{fmt(totalGross)}</Text>
              </View>
              {revenueGrowth != null && (
                <View style={s.growthBadge}>
                  <MaterialCommunityIcons
                    name={Number(revenueGrowth) >= 0 ? "trending-up" : "trending-down"}
                    size={14}
                    color="#34D399"
                  />
                  <Text style={s.growthBadgeText}>
                    {Number(revenueGrowth) >= 0 ? "+" : ""}{Number(revenueGrowth).toFixed(1)}%
                  </Text>
                </View>
              )}
            </View>

            {/* P&L Margin Ribbon */}
            <View style={s.pnlDivider} />
            <Text style={s.pnlTitle}>PROFIT & LOSS MARGIN</Text>
            
            <View style={s.pnlGrid}>
              <View style={s.pnlCol}>
                <Text style={s.pnlColLabel}>Platform Fee</Text>
                <Text style={[s.pnlColValue, { color: "#F87171" }]}>-{platformFee != null ? fmt(platformFee) : "—"}</Text>
              </View>
              <View style={s.pnlCol}>
                <Text style={s.pnlColLabel}>Crew Payout</Text>
                <Text style={[s.pnlColValue, { color: "#FBBF24" }]}>-{staffPayout != null ? fmt(staffPayout) : "—"}</Text>
              </View>
              <View style={s.pnlCol}>
                <Text style={s.pnlColLabel}>Net Revenue</Text>
                <Text style={[s.pnlColValue, { color: "#34D399", fontWeight: "900" }]}>{netProfit != null ? fmt(netProfit) : "—"}</Text>
              </View>
            </View>
          </View>

          {/* 4 Core Operational Health KPIs */}
          <View style={s.kpiGrid}>
            <View style={[s.kpiCard, CARD_SHADOW]}>
              <View style={[s.kpiIconWrap, { backgroundColor: "#E0F2FE" }]}>
                <MaterialCommunityIcons name="calendar-check" size={20} color="#0284C7" />
              </View>
              <Text style={s.kpiVal}>{completedJobsCount}</Text>
              <Text style={s.kpiLbl}>Completed Jobs</Text>
            </View>

            <View style={[s.kpiCard, CARD_SHADOW]}>
              <View style={[s.kpiIconWrap, { backgroundColor: "#DCFCE7" }]}>
                <MaterialCommunityIcons name="check-decagram" size={20} color="#16A34A" />
              </View>
              <Text style={s.kpiVal}>{completionRate != null ? `${completionRate}%` : "—"}</Text>
              <Text style={s.kpiLbl}>Completion Rate</Text>
            </View>

            <View style={[s.kpiCard, CARD_SHADOW]}>
              <View style={[s.kpiIconWrap, { backgroundColor: "#FEF3C7" }]}>
                <MaterialCommunityIcons name="star" size={20} color="#D97706" />
              </View>
              <Text style={s.kpiVal}>{averageRating ? `${Number(averageRating).toFixed(1)}★` : "—"}</Text>
              <Text style={s.kpiLbl}>Customer Rating</Text>
            </View>

            <View style={[s.kpiCard, CARD_SHADOW]}>
              <View style={[s.kpiIconWrap, { backgroundColor: "#F3E8FF" }]}>
                <MaterialCommunityIcons name="account-group" size={20} color="#9333EA" />
              </View>
              <Text style={s.kpiVal}>{activeCrew ?? "—"}</Text>
              <Text style={s.kpiLbl}>Active Crew</Text>
            </View>
          </View>

          {/* Technician Leaderboard (New Mobile Capability) */}
          <View style={[s.card, CARD_SHADOW]}>
            <View style={s.cardHeader}>
              <View style={s.cardHeaderTitleRow}>
                <MaterialCommunityIcons name="trophy-outline" size={20} color="#F59E0B" />
                <Text style={s.cardTitle}>Crew Leaderboard</Text>
              </View>
              <Text style={s.cardBadge}>{staffLeaderboard.length} Techs</Text>
            </View>

            {staffLeaderboard.length === 0 ? (
              <View style={s.emptyRoster}>
                <Text style={s.emptyRosterText}>No technician performance logged for this period</Text>
              </View>
            ) : (
              <View style={s.leaderboardList}>
                {staffLeaderboard.slice(0, 5).map((tech, idx) => (
                  <View key={tech.id || idx} style={[s.leaderboardRow, idx < staffLeaderboard.length - 1 && s.rowBorder]}>
                    <View style={[s.rankBadge, idx === 0 && { backgroundColor: "#FEF3C7" }]}>
                      <Text style={[s.rankText, idx === 0 && { color: "#B45309" }]}>#{idx + 1}</Text>
                    </View>
                    {tech.avatar ? (
                      <Image source={{ uri: tech.avatar }} style={s.techAvatar} />
                    ) : (
                      <InitialsAvatar name={tech.name || "Tech"} size={36} />
                    )}
                    <View style={s.techInfo}>
                      <Text style={s.techName} numberOfLines={1}>{tech.name || "Technician"}</Text>
                      <Text style={s.techStats}>{tech.jobs || 0} jobs completed • {Number(tech.rating || 5.0).toFixed(1)}★</Text>
                    </View>
                    <View style={s.techRevBox}>
                      <Text style={s.techRev}>{fmt(tech.revenue || 0)}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Revenue Volume Trend Chart */}
          <View style={[s.card, CARD_SHADOW]}>
            <View style={s.chartHeader}>
              <View>
                <Text style={s.cardTitle}>Revenue Inflow</Text>
                <Text style={s.cardSub}>Daily cash & escrow progression</Text>
              </View>
              <View style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: "#0284C7" }]} />
                <Text style={s.legendText}>Volume ($)</Text>
              </View>
            </View>
            <BarChart
              data={revTrend.length ? revTrend.map((t: any) => t.value) : [0]}
              labels={revTrend.length ? revTrend.map((t: any) => t.label) : [""]}
              color="#0284C7"
            />
          </View>

          {/* Booking Volume Chart */}
          <View style={[s.card, CARD_SHADOW]}>
            <View style={s.chartHeader}>
              <View>
                <Text style={s.cardTitle}>Booking Dispatch Volume</Text>
                <Text style={s.cardSub}>Total work orders fulfilled</Text>
              </View>
              <View style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: "#10B981" }]} />
                <Text style={s.legendText}>Jobs</Text>
              </View>
            </View>
            <BarChart
              data={bookTrend.length ? bookTrend.map((t: any) => t.value) : [0]}
              labels={bookTrend.length ? bookTrend.map((t: any) => t.label) : [""]}
              color="#10B981"
            />
          </View>

          {/* Top Revenue Services */}
          {topServices.length > 0 && (
            <View style={[s.card, CARD_SHADOW]}>
              <View style={s.cardHeader}>
                <View style={s.cardHeaderTitleRow}>
                  <MaterialCommunityIcons name="briefcase-check-outline" size={20} color="#0284C7" />
                  <Text style={s.cardTitle}>Top Revenue Services</Text>
                </View>
                <Text style={s.cardBadge}>Catalog</Text>
              </View>
              <View style={s.serviceList}>
                {topServices.slice(0, 5).map((svc: any, i: number) => {
                  const sName = svc.name || svc.serviceName || "Service";
                  const sRev = svc.revenue ?? svc.totalRevenue ?? 0;
                  return (
                    <View key={svc.id ?? i} style={[s.serviceRow, i < topServices.length - 1 && s.rowBorder]}>
                      <View style={s.serviceRank}>
                        <Text style={s.serviceRankText}>{i + 1}</Text>
                      </View>
                      <View style={{ flex: 1, paddingRight: 10 }}>
                        <Text style={s.serviceName} numberOfLines={1}>{sName}</Text>
                        <Text style={s.serviceSub}>{svc.value ? `${svc.value} bookings fulfilled` : "Core Service"}</Text>
                      </View>
                      <Text style={s.serviceRev}>{fmt(sRev)}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          <View style={{ height: 40 }} />
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
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerCenter: { alignItems: "center" },
  headerTitle: { fontSize: 17, fontWeight: "800", color: "#0F172A", letterSpacing: -0.3 },
  headerSubtitle: { fontSize: 11, fontWeight: "600", color: "#64748B", marginTop: 1 },
  refreshBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },

  loadingBox: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 13, fontWeight: "600", color: "#64748B" },
  scrollContent: { padding: 16, gap: 16, paddingBottom: 60 },

  periodRow: {
    flexDirection: "row", backgroundColor: "#E2E8F0", borderRadius: 12, padding: 3, gap: 4,
  },
  periodBtn: { flex: 1, paddingVertical: 8, borderRadius: 9, alignItems: "center" },
  periodBtnActive: { backgroundColor: "#0A192F" },
  periodText: { fontSize: 12, fontWeight: "700", color: "#475569" },
  periodTextActive: { color: "#FFFFFF" },

  heroCard: {
    backgroundColor: "#0A192F",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  heroTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  heroLabel: { fontSize: 10, fontWeight: "800", color: "#94A3B8", letterSpacing: 1.2 },
  heroValue: { fontSize: 32, fontWeight: "900", color: "#F8FAFC", marginTop: 4 },
  growthBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(52, 211, 153, 0.15)",
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  growthBadgeText: { fontSize: 11, fontWeight: "800", color: "#34D399" },

  pnlDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.08)", marginVertical: 16 },
  pnlTitle: { fontSize: 10, fontWeight: "800", color: "#94A3B8", letterSpacing: 1, marginBottom: 12 },
  pnlGrid: { flexDirection: "row", justifyContent: "space-between" },
  pnlCol: { flex: 1 },
  pnlColLabel: { fontSize: 11, fontWeight: "600", color: "#94A3B8" },
  pnlColValue: { fontSize: 14, fontWeight: "800", color: "#F8FAFC", marginTop: 3 },

  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  kpiCard: {
    width: "48.5%", backgroundColor: "#FFFFFF", borderRadius: 16,
    padding: 14, borderWidth: 1, borderColor: "#E2E8F0",
  },
  kpiIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  kpiVal: { fontSize: 20, fontWeight: "800", color: "#0F172A" },
  kpiLbl: { fontSize: 11, fontWeight: "600", color: "#64748B", marginTop: 2 },

  card: {
    backgroundColor: "#FFFFFF", borderRadius: 18, padding: 18,
    borderWidth: 1, borderColor: "#E2E8F0",
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  cardHeaderTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle: { fontSize: 15, fontWeight: "800", color: "#0F172A" },
  cardSub: { fontSize: 11, fontWeight: "500", color: "#64748B", marginTop: 2 },
  cardBadge: { fontSize: 11, fontWeight: "700", color: "#64748B", backgroundColor: "#F1F5F9", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },

  chartHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, fontWeight: "700", color: "#64748B" },

  emptyRoster: { paddingVertical: 20, alignItems: "center" },
  emptyRosterText: { fontSize: 12, fontWeight: "600", color: "#94A3B8" },
  leaderboardList: { gap: 10 },
  leaderboardRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  rankBadge: { width: 26, height: 26, borderRadius: 13, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center" },
  rankText: { fontSize: 11, fontWeight: "800", color: "#64748B" },
  techAvatar: { width: 36, height: 36, borderRadius: 18 },
  techInfo: { flex: 1 },
  techName: { fontSize: 13, fontWeight: "700", color: "#0F172A" },
  techStats: { fontSize: 11, fontWeight: "600", color: "#64748B", marginTop: 1 },
  techRevBox: { alignItems: "flex-end" },
  techRev: { fontSize: 13, fontWeight: "800", color: "#0284C7" },

  serviceList: { gap: 8 },
  serviceRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
  serviceRank: { width: 24, height: 24, borderRadius: 12, backgroundColor: "#F8FAFC", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#E2E8F0" },
  serviceRankText: { fontSize: 11, fontWeight: "700", color: "#475569" },
  serviceName: { fontSize: 13, fontWeight: "700", color: "#0F172A" },
  serviceSub: { fontSize: 10, fontWeight: "500", color: "#64748B", marginTop: 1 },
  serviceRev: { fontSize: 13, fontWeight: "800", color: "#0284C7" },
});
