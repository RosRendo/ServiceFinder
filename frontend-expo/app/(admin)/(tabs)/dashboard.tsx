/**
 * Admin Dashboard — Premium Deep Navy Redesign
 */
import React, { useState, useEffect, useCallback } from "react";
import { Image } from "expo-image";
import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator, RefreshControl, StyleSheet, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import api from "@/utils/api";
import { useSidebarStore } from "@/store/sidebarStore";
import NotificationBell from "@/components/NotificationBell";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/store/authStore";

const T = {
  bg: "#FFFFFF", surface: "#FFFFFF", border: "#EBEBEB",
  accent: "#0A192F", accentMid: "#1E3A8A", accentLight: "#F0F4F8",
  text1: "#111827", text2: "#4B5563", text3: "#9CA3AF",
  success: "#10B981", warning: "#F59E0B", error: "#EF4444",
  purple: "#8B5CF6", blue: "#3B82F6",
};

export default function AdminDashboard() {
  const router = useRouter();
  const openSidebar = useSidebarStore((s) => s.setAdminOpen);
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const adminFirstName = user?.name?.split(" ")[0] || "Admin";
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMetrics = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      // Use /api/admin/analytics — properly guarded admin endpoint
      const response = await api.get('/api/admin/analytics');
      // TransformInterceptor: { success, data: { totalUsers, ... } }
      const data = response.data?.data ?? response.data;
      setMetrics(data);
    } catch (error) {
      console.error("Failed to fetch admin metrics", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchMetrics(); }, [fetchMetrics]));

  const formatCurrency = (amount: number) => {
    return '$' + Math.round(amount || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return (num || 0).toString();
  };

  const healthMetrics = [
    { id: 1, label: t('adminDashboard.totalUsers'), value: formatNumber(metrics?.totalUsers), trend: metrics?.usersGrowth ? `+${metrics.usersGrowth}%` : "+5%", icon: "account-multiple-outline", color: T.blue },
    { id: 2, label: t('adminDashboard.companies'), value: formatNumber(metrics?.totalCompanies), trend: metrics?.companiesGrowth ? `+${metrics.companiesGrowth}%` : "+8%", icon: "office-building-outline", color: T.success },
    { id: 3, label: t('adminDashboard.bookings'), value: formatNumber(metrics?.totalBookings), trend: metrics?.bookingsGrowth ? `+${metrics.bookingsGrowth}%` : undefined, icon: "calendar-check-outline", color: T.purple },
    { id: 4, label: t('adminDashboard.pending'), value: formatNumber(metrics?.pendingCompanies), icon: "clock-alert-outline", color: T.warning },
  ];

  const weeklyData = [40, 65, 50, 85, 60, 95, 75];
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <TouchableOpacity onPress={openSidebar} style={s.menuBtn}>
            <MaterialCommunityIcons name="menu" size={28} color={T.text1} />
          </TouchableOpacity>
          <View>
            <Text style={s.headerGreeting}>{greeting},</Text>
            <Text style={s.headerTitle}>{adminFirstName} 👋</Text>
          </View>
        </View>
        <View style={s.headerRight}>
          <NotificationBell color={T.text1} />
          <Image
            source={{ uri: "https://ui-avatars.com/api/?name=Admin+User&background=0A192F&color=fff" }}
            style={s.avatar}
          />
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={s.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchMetrics(true)} tintColor={T.accent} />}
      >
        {isLoading && !metrics ? (
          <View style={s.loadingBox}><ActivityIndicator size="large" color={T.accent} /></View>
        ) : (
          <>
            <View style={s.revenueCard}>
              <View style={s.revenueHeader}>
                <View>
                  <Text style={s.revenueSubtitle}>{t('adminDashboard.totalRevenue')}</Text>
                  <Text style={s.revenueGmv}>{t('adminDashboard.completedBookings', { count: metrics?.completedBookings || 0 })}</Text>
                </View>
                <View style={s.revenueTrendPill}>
                  <MaterialCommunityIcons name="trending-up" size={14} color="#fff" />
                  <Text style={s.revenueTrendText}>{metrics?.revenueGrowth || 12}%</Text>
                </View>
              </View>
              <Text style={s.revenueTitle}>{formatCurrency(metrics?.totalRevenue || 0)}</Text>
              
              {/* Decorative Background */}
              <View style={s.revenueDecor1} />
              <View style={s.revenueDecor2} />
            </View>

            {/* Quick Actions / Critical Queues */}
            <View style={s.queueGrid}>
              <TouchableOpacity onPress={() => router.push('/(admin)/queue' as any)} style={[s.queueCard, { borderColor: T.blue + "30" }]} activeOpacity={0.8}>
                <View style={[s.queueIconWrap, { backgroundColor: T.blue + "15" }]}>
                  <MaterialCommunityIcons name="shield-check-outline" size={22} color={T.blue} />
                </View>
                <Text style={s.queueCount}>{metrics?.pendingCompanies || 0}</Text>
                <Text style={s.queueLabel}>{t('adminDashboard.pending')}</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => router.push('/(admin)/disputes')} style={[s.queueCard, { borderColor: T.error + "30" }]} activeOpacity={0.8}>
                <View style={[s.queueIconWrap, { backgroundColor: T.error + "15" }]}>
                  <MaterialCommunityIcons name="scale-balance" size={22} color={T.error} />
                </View>
                <Text style={s.queueCount}>{metrics?.cancelledBookings || 0}</Text>
                <Text style={s.queueLabel}>{t('adminDashboard.disputes')}</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => router.push('/(admin)/support')} style={[s.queueCard, { borderColor: T.warning + "30" }]} activeOpacity={0.8}>
                <View style={[s.queueIconWrap, { backgroundColor: T.warning + "15" }]}>
                  <MaterialCommunityIcons name="ticket-confirmation-outline" size={22} color={T.warning} />
                </View>
                <Text style={s.queueCount}>{metrics?.activeBookings || 0}</Text>
                <Text style={s.queueLabel}>{t('adminDashboard.active')}</Text>
              </TouchableOpacity>
            </View>

            {/* Platform Health */}
            <View style={s.section}>
              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>{t('adminDashboard.platformHealth')}</Text>
                <Text style={s.sectionSubtitle}>{t('adminDashboard.healthSubtitle')}</Text>
              </View>
              <View style={s.healthGrid}>
                {healthMetrics.map((m) => (
                  <View key={m.id} style={s.healthCard}>
                    <View style={s.healthIconRow}>
                      <View style={[s.healthIconWrap, { backgroundColor: m.color + "15" }]}>
                        <MaterialCommunityIcons name={m.icon as any} size={20} color={m.color} />
                      </View>
                      {m.trend && (
                        <Text style={[s.healthTrend, { color: m.color }]}>{m.trend}</Text>
                      )}
                    </View>
                    <Text style={s.healthValue}>{m.value}</Text>
                    <Text style={s.healthLabel}>{m.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Growth Trends */}
            <View style={s.section}>
              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>{t('adminDashboard.weeklyBookings')}</Text>
                <Text style={s.sectionSubtitle}>{t('adminDashboard.weeklyBookingsSubtitle')}</Text>
              </View>
              <View style={s.chartCard}>
                <View style={s.chartBars}>
                  {(metrics?.weeklyStats || weeklyData.map((v, i) => ({ day: days[i], bookings: v }))).map((item: any, idx: number) => {
                    const val = item.bookings || item;
                    const maxVal = metrics?.weeklyStats ? Math.max(...metrics.weeklyStats.map((d: any) => d.bookings)) : Math.max(...weeklyData);
                    const heightPct = maxVal > 0 ? Math.round((val / maxVal) * 75) : 10;
                    const isMax = val === maxVal;
                    return (
                      <View key={idx} style={s.chartCol}>
                        <View style={[s.chartBar, { height: `${heightPct}%`, backgroundColor: isMax ? T.accent : T.accentLight }]} />
                        <Text style={[s.chartDay, isMax && { color: T.accent, fontWeight: "800" }]}>{item.day || days[idx]}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* Recent Companies */}
            <View style={s.section}>
              <View style={s.sectionHeaderRow}>
                <View>
                  <Text style={s.sectionTitle}>{t('adminDashboard.recentCompanies')}</Text>
                  <Text style={s.sectionSubtitle}>{t('adminDashboard.recentCompaniesSubtitle')}</Text>
                </View>
                <TouchableOpacity onPress={() => router.push('/(admin)/companies' as any)}>
                  <Text style={s.viewAllBtn}>{t('adminDashboard.viewAll')}</Text>
                </TouchableOpacity>
              </View>
              
              <View style={s.recentList}>
                {metrics?.recentCompanies?.map((company: any) => {
                  const isVerified = company.verificationStatus === 'verified';
                  return (
                    <View key={company.id} style={s.recentItem}>
                      <View style={[s.statusIcon, { backgroundColor: isVerified ? T.success + "15" : T.warning + "15" }]}>
                        <MaterialCommunityIcons 
                          name={isVerified ? "check-decagram" : "clock-alert-outline"} 
                          size={20} 
                          color={isVerified ? T.success : T.warning} 
                        />
                      </View>
                      <View style={s.recentInfo}>
                        <Text style={s.recentName} numberOfLines={1}>{company.name}</Text>
                        <Text style={s.recentStatus}>{company.verificationStatus}</Text>
                      </View>
                      <Text style={s.recentDate}>
                        {new Date(company.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </Text>
                    </View>
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
  root: { flex: 1, backgroundColor: T.bg },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: T.surface, borderBottomWidth: 1, borderBottomColor: T.border,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  menuBtn: { marginLeft: -8, padding: 8 },
  headerGreeting: { fontSize: 11, fontWeight: "600", color: T.text3, letterSpacing: 0.3 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: T.text1, letterSpacing: -0.3 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: T.border },

  scrollContent: { padding: 20, gap: 24, paddingBottom: 60 },
  loadingBox: { paddingVertical: 80, alignItems: "center" },

  revenueCard: {
    backgroundColor: T.accent, borderRadius: 24, padding: 24,
    overflow: "hidden", borderWidth: 1, borderColor: T.border, shadowColor: T.accent,
  },
  revenueHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  revenueSubtitle: { color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: "600", marginBottom: 2 },
  revenueGmv: { color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: "500" },
  revenueTrendPill: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(255,255,255,0.15)", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  revenueTrendText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  revenueTitle: { color: "#fff", fontSize: 40, fontWeight: "800", letterSpacing: -1 },
  revenueDecor1: { position: "absolute", top: -40, right: -40, width: 140, height: 140, borderRadius: 70, backgroundColor: "rgba(255,255,255,0.05)" },
  revenueDecor2: { position: "absolute", bottom: -20, right: 40, width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(255,255,255,0.05)" },

  queueGrid: { flexDirection: "row", gap: 12 },
  queueCard: { flex: 1, backgroundColor: T.surface, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: T.border },
  queueIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  queueCount: { fontSize: 22, fontWeight: "800", color: T.text1, marginBottom: 2 },
  queueLabel: { fontSize: 12, fontWeight: "600", color: T.text3 },

  section: { gap: 12 },
  sectionHeader: { gap: 2 },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: T.text1 },
  sectionSubtitle: { fontSize: 13, color: T.text3, fontWeight: "500" },
  viewAllBtn: { fontSize: 13, fontWeight: "700", color: T.accentMid, marginBottom: 2 },

  healthGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  healthCard: { width: "48%", backgroundColor: T.surface, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: T.border },
  healthIconRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  healthIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  healthTrend: { fontSize: 12, fontWeight: "800", marginTop: 4 },
  healthValue: { fontSize: 24, fontWeight: "800", color: T.text1, marginBottom: 2 },
  healthLabel: { fontSize: 12, fontWeight: "600", color: T.text3 },

  chartCard: { backgroundColor: T.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: T.border },
  chartBars: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", height: 160 },
  chartCol: { alignItems: "center", flex: 1, height: "100%", justifyContent: "flex-end" },
  chartBar: { width: 12, borderRadius: 6, marginBottom: 8 },
  chartDay: { fontSize: 11, fontWeight: "600", color: T.text3, textTransform: "uppercase" },

  recentList: { gap: 12 },
  recentItem: { flexDirection: "row", alignItems: "center", backgroundColor: T.surface, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: T.border, gap: 12 },
  statusIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  recentInfo: { flex: 1 },
  recentName: { fontSize: 15, fontWeight: "800", color: T.text1, marginBottom: 2 },
  recentStatus: { fontSize: 12, fontWeight: "700", color: T.text3, textTransform: "uppercase" },
  recentDate: { fontSize: 12, fontWeight: "600", color: T.text2 },
  emptyText: { textAlign: "center", color: T.text3, paddingVertical: 20 },
});

