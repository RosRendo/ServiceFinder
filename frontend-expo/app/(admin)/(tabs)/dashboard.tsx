/**
 * Admin Dashboard — Obsidian Executive Cockpit
 */
import React, { useState, useCallback } from "react";
import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator, RefreshControl, StyleSheet, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import api from "@/utils/api";
import { useSidebarStore } from "@/store/sidebarStore";
import NotificationBell from "@/components/NotificationBell";
import ErrorState from "@/components/common/ErrorState";
import InitialsAvatar from "@/components/common/InitialsAvatar";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/store/authStore";
import { Theme } from "@/constants/theme";
import ExecutiveMetricRibbon from "@/components/admin/ExecutiveMetricRibbon";
import SlaAlertMatrix from "@/components/admin/SlaAlertMatrix";

const T = Theme.colors;

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  android: { elevation: 2 },
});

export default function AdminDashboard() {
  const router = useRouter();
  const openSidebar = useSidebarStore((s) => s.setAdminOpen);
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const adminName = (user as any)?.fullName ?? (user as any)?.name ?? "Admin";
  const adminFirstName = adminName.split(" ")[0];
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);

  const fetchMetrics = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const response = await api.get('/api/admin/analytics');
      const data = response.data?.data ?? response.data;
      setMetrics(data);
      setHasError(false);
    } catch (error) {
      console.error("Failed to fetch admin metrics", error);
      setHasError(true);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchMetrics(); }, [fetchMetrics]));

  const formatNumber = (num: number) => {
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return (num || 0).toString();
  };

  // No invented fallbacks — when the API has no growth data we show "—".
  const growthLabel = (growth?: number) =>
    typeof growth === "number" && Number.isFinite(growth)
      ? `${growth >= 0 ? "+" : ""}${growth}%`
      : "—";

  const healthMetrics = [
    { id: 1, label: t('adminDashboard.totalUsers'), value: formatNumber(metrics?.totalUsers), trend: growthLabel(metrics?.usersGrowth), icon: "account-multiple-outline", route: '/(admin)/(tabs)/users' },
    { id: 2, label: t('adminDashboard.companies'), value: formatNumber(metrics?.totalCompanies), trend: growthLabel(metrics?.companiesGrowth), icon: "office-building-outline", route: '/(admin)/(tabs)/companies' },
    { id: 3, label: t('adminDashboard.bookings'), value: formatNumber(metrics?.totalBookings), trend: growthLabel(metrics?.bookingsGrowth), icon: "calendar-check-outline", route: '/(admin)/bookings' },
    { id: 4, label: t('adminDashboard.pending'), value: formatNumber(metrics?.pendingCompanies), trend: metrics?.pendingCompanies > 0 ? "Action Req" : "Clear", isPendingAlert: metrics?.pendingCompanies > 0, icon: "clock-alert-outline", route: '/(admin)/(tabs)/queue' },
  ];

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <TouchableOpacity
            onPress={() => openSidebar(true)}
            style={s.menuBtn}
            accessibilityRole="button"
            accessibilityLabel={t('common.openMenu')}
          >
            <MaterialCommunityIcons name="menu" size={26} color="#0F172A" />
          </TouchableOpacity>
          <View>
            <Text style={s.headerGreeting}>{greeting.toUpperCase()}</Text>
            <Text style={s.headerTitle}>{adminFirstName}</Text>
          </View>
        </View>
        <View style={s.headerRight}>
          <NotificationBell color="#0F172A" />
          <InitialsAvatar name={adminName} size={36} />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchMetrics(true)} tintColor="#0F172A" />}
      >
        {isLoading && !metrics ? (
          <View style={s.loadingBox}><ActivityIndicator size="large" color="#0F172A" /></View>
        ) : hasError && !metrics ? (
          <ErrorState onRetry={() => { setIsLoading(true); fetchMetrics(); }} />
        ) : (
          <>
            {/* Executive Revenue Ribbon Card */}
            <ExecutiveMetricRibbon
              totalRevenue={metrics?.totalRevenue || 0}
              revenueGrowth={metrics?.revenueGrowth}
              completedBookings={metrics?.completedBookings || 0}
              onInspectPress={() => router.push('/(admin)/(tabs)/analytics' as any)}
            />

            {/* Actionable SLA Urgency Alert Matrix (Zero hardcoded fallbacks) */}
            <SlaAlertMatrix
              pendingVerificationsCount={metrics?.pendingCompanies || 0}
              activeDisputesCount={metrics?.activeDisputes || 0}
              pendingPayoutsCount={metrics?.payoutRequests || 0}
              onNavigateQueue={() => router.push('/(admin)/(tabs)/queue' as any)}
              onNavigateDisputes={() => router.push('/(admin)/(tabs)/issues' as any)}
              onNavigatePayouts={() => router.push('/(admin)/payouts' as any)}
            />

            {/* Platform Quick Health Metric Grid */}
            <View style={s.section}>
              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>{t('adminDashboard.platformHealth')}</Text>
                <Text style={s.sectionSubtitle}>{t('adminDashboard.healthSubtitle')}</Text>
              </View>
              <View style={s.healthGrid}>
                {healthMetrics.map((m) => (
                  <TouchableOpacity
                    key={m.id}
                    style={s.healthCard}
                    activeOpacity={0.8}
                    onPress={() => m.route && router.push(m.route as any)}
                    accessibilityLabel={`${m.label}: ${m.value}${m.trend ? ', ' + m.trend : ''}`}
                  >
                    <View style={s.healthIconRow}>
                      <View style={s.healthIconWrap}>
                        <MaterialCommunityIcons name={m.icon as any} size={18} color="#0F172A" />
                      </View>
                      {m.trend && (
                        <View style={s.healthTrendPill}>
                          <View
                            style={[
                              s.healthTrendDot,
                              { backgroundColor: m.isPendingAlert ? "#D97706" : "#64748B" },
                            ]}
                          />
                          <Text style={s.healthTrendText}>{m.trend}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={s.healthValue}>{m.value}</Text>
                    <Text style={s.healthLabel}>{m.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Monthly Revenue Chart (last 6 months from monthlyData) */}
            <View style={s.section}>
              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>{t('adminDashboard.monthlyRevenue')}</Text>
                <Text style={s.sectionSubtitle}>{t('adminDashboard.monthlyRevenueSubtitle')}</Text>
              </View>
              <View style={s.chartCard}>
                <View style={s.chartBars}>
                  {(() => {
                    const chartData = (metrics?.monthlyData || []).slice(-6);
                    if (!chartData || chartData.length === 0) {
                      return <Text style={s.emptyText}>{t('adminDashboard.noRevenueData')}</Text>;
                    }
                    const maxVal = Math.max(...chartData.map((d: any) => d.revenue || 0), 1);
                    return chartData.map((item: any, idx: number) => {
                      const val = item.revenue || 0;
                      const heightPct = Math.max(Math.round((val / maxVal) * 85), 10);
                      const isMax = val === maxVal;
                      return (
                        <View key={idx} style={s.chartCol}>
                          <View
                            style={[
                              s.chartBar,
                              {
                                height: `${heightPct}%` as any,
                                backgroundColor: isMax ? "#0F172A" : "#CBD5E1",
                              },
                            ]}
                          />
                          <Text style={[s.chartDay, isMax && s.chartDayActive]}>
                            {item.name}
                          </Text>
                        </View>
                      );
                    });
                  })()}
                </View>
              </View>
            </View>

            {/* Recent Companies Verification Triage */}
            <View style={s.section}>
              <View style={s.sectionHeaderRow}>
                <View>
                  <Text style={s.sectionTitle}>{t('adminDashboard.recentCompanies')}</Text>
                  <Text style={s.sectionSubtitle}>{t('adminDashboard.recentCompaniesSubtitle')}</Text>
                </View>
                <TouchableOpacity onPress={() => router.push('/(admin)/(tabs)/companies' as any)}>
                  <Text style={s.viewAllBtn}>{t('adminDashboard.viewAll')}</Text>
                </TouchableOpacity>
              </View>

              <View style={s.recentList}>
                {metrics?.recentCompanies?.map((company: any) => {
                  const isVerified = company.verificationStatus === 'verified';
                  return (
                    <TouchableOpacity
                      key={company.id}
                      style={s.recentItem}
                      onPress={() => company.id && router.push(`/(admin)/company/${company.id}` as any)}
                      accessibilityLabel={company.name + ': ' + company.verificationStatus}
                    >
                      <View style={s.statusIcon}>
                        <MaterialCommunityIcons
                          name="office-building"
                          size={18}
                          color="#475569"
                        />
                      </View>
                      <View style={s.recentInfo}>
                        <Text style={s.recentName} numberOfLines={1}>{company.name}</Text>
                        <View style={s.statusLedgerRow}>
                          <View
                            style={[
                              s.statusDotSmall,
                              { backgroundColor: isVerified ? "#059669" : "#D97706" },
                            ]}
                          />
                          <Text style={s.recentStatus}>
                            {isVerified ? "VERIFIED" : "PENDING REVIEW"}
                          </Text>
                        </View>
                      </View>
                      <Text style={s.recentDate}>
                        {new Date(company.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                {!metrics?.recentCompanies?.length && (
                  <Text style={s.emptyText}>{t('adminDashboard.noRecentCompanies')}</Text>
                )}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  menuBtn: { padding: 4 },
  headerGreeting: { fontSize: 10, fontWeight: "800", color: "#64748B", letterSpacing: 0.6 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#0F172A", letterSpacing: -0.3 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 12 },

  // paddingBottom: 120 ensures zero collision with the floating tab bar
  scrollContent: { padding: 16, gap: 20, paddingBottom: 120 },
  loadingBox: { paddingVertical: 80, alignItems: "center" },

  section: { gap: 10 },
  sectionHeader: { gap: 2 },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#0F172A", letterSpacing: -0.2 },
  sectionSubtitle: { fontSize: 12, color: "#64748B", fontWeight: "500" },
  viewAllBtn: { fontSize: 12, fontWeight: "700", color: "#0F172A", marginBottom: 2 },

  healthGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  healthCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...CARD_SHADOW,
  },
  healthIconRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  healthIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  healthTrendPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  healthTrendDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  healthTrendText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#475569",
  },
  healthValue: { fontSize: 22, fontWeight: "800", color: "#0F172A", marginBottom: 2 },
  healthLabel: { fontSize: 11, fontWeight: "600", color: "#64748B" },

  chartCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...CARD_SHADOW,
  },
  chartBars: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", height: 140 },
  chartCol: { alignItems: "center", flex: 1, height: "100%", justifyContent: "flex-end" },
  chartBar: { width: 14, borderRadius: 4, marginBottom: 8 },
  chartDay: { fontSize: 10, fontWeight: "700", color: "#94A3B8", textTransform: "uppercase" },
  chartDayActive: { color: "#0F172A" },

  recentList: { gap: 8 },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 12,
    ...CARD_SHADOW,
  },
  statusIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  recentInfo: { flex: 1 },
  recentName: { fontSize: 14, fontWeight: "700", color: "#0F172A", marginBottom: 2 },
  statusLedgerRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  statusDotSmall: { width: 5, height: 5, borderRadius: 3 },
  recentStatus: { fontSize: 10, fontWeight: "800", color: "#64748B", letterSpacing: 0.4 },
  recentDate: { fontSize: 11, fontWeight: "600", color: "#94A3B8" },
  emptyText: { textAlign: "center", color: "#94A3B8", paddingVertical: 20 },
});
