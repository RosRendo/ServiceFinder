/**
 * Company Dashboard — Premium Redesign
 */
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  ScrollView, Text, View, TouchableOpacity, ActivityIndicator,
  RefreshControl, StyleSheet, Animated, Pressable, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { api } from "@/store/authStore";
import NotificationBell from "@/components/NotificationBell";
import { useSidebarStore } from "@/store/sidebarStore";

import { Theme } from "@/constants/theme";

const T = Theme.colors;

const HERO_SHADOW = Platform.select({
  ios: { shadowColor: '#0A192F', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 16 },
  android: { elevation: 8 },
});

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  android: { elevation: 2 },
});

function PressCard({ onPress, style, children }: { onPress: () => void; style?: any; children: React.ReactNode; }) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.timing(scale, { toValue: 0.97, duration: 100, useNativeDriver: true }).start();
  const pressOut = () => Animated.timing(scale, { toValue: 1, duration: 100, useNativeDriver: true }).start();
  
  return (
    <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} style={{ flex: 1 }}>
      <Animated.View style={[{ transform: [{ scale }], flex: 1 }, style]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [timeframe, setTimeframe] = useState("week");
  const setCompanyOpen = useSidebarStore((s) => s.setCompanyOpen);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [company, setCompany] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);

  const loadDashboardData = useCallback(async (isRefresh = false, period = timeframe) => {
    if (isRefresh) { setRefreshing(true); } else { setLoading(true); }
    try {
      const [companyRes, metricsRes] = await Promise.all([
        api.get("/api/companies/my-company"),
        api.get(`/api/companies/my-company/metrics?period=${period}`),
      ]);
      setCompany(companyRes.data?.data || companyRes.data);
      setMetrics(metricsRes.data?.data || metricsRes.data);
    } catch (error) {
      console.error("Failed to load dashboard data", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [timeframe]);

  useEffect(() => { loadDashboardData(false, timeframe); }, [timeframe]);

  return (
    <>
      <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
        {/* Top App Bar */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => setCompanyOpen(true)} style={s.menuBtn}>
            <MaterialCommunityIcons name="menu" size={28} color={T.accent} />
          </TouchableOpacity>
          <Text style={s.headerTitle} numberOfLines={1}>
            {company?.name || "Dashboard"}
          </Text>
          <NotificationBell color={T.accent} />
        </View>

        {/* Date Range Selector */}
        <View style={s.timeframeContainer}>
          <View style={s.timeframeRow}>
            {["today", "week", "month"].map((period) => (
              <TouchableOpacity
                key={period}
                onPress={() => setTimeframe(period)}
                style={[s.timeframeBtn, timeframe === period && s.timeframeBtnActive]}
                activeOpacity={0.8}
              >
                <Text style={[s.timeframeText, timeframe === period && s.timeframeTextActive]}>
                  {period === 'today' ? "Today" : period === 'week' ? "7 Days" : "30 Days"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false} 
          style={s.scrollView}
          contentContainerStyle={{ paddingBottom: 60 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadDashboardData(true)} tintColor={T.accent} />}
        >
          {loading ? (
            <View style={s.loadingBox}>
              <ActivityIndicator size="large" color={T.accent} />
            </View>
          ) : (
            <View style={s.contentPad}>
              {/* Primary KPI - Revenue */}
              <PressCard onPress={() => router.push("/(company)/analytics" as any)} style={s.heroCard}>
                <View style={s.heroHeader}>
                  <View style={s.heroIconWrap}>
                    <MaterialCommunityIcons name="currency-usd" size={24} color="#FFF" />
                  </View>
                  <Text style={s.heroLabel}>Total Revenue</Text>
                  <MaterialCommunityIcons name="chevron-right" size={20} color="rgba(255,255,255,0.4)" />
                </View>
                <View style={s.heroContent}>
                  <Text style={s.heroValue}>
                    ${metrics?.revenue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? "0.00"}
                  </Text>
                  {metrics?.revenueGrowth != null && (
                    <View style={s.heroGrowthRow}>
                      <MaterialCommunityIcons
                        name={metrics.revenueGrowth >= 0 ? "trending-up" : "trending-down"}
                        size={18}
                        color={metrics.revenueGrowth >= 0 ? "#A7F3D0" : "#FECACA"}
                      />
                      <Text style={[s.heroGrowthText, { color: metrics.revenueGrowth >= 0 ? "#A7F3D0" : "#FECACA" }]}>
                        {metrics.revenueGrowth >= 0 ? "+" : ""}{metrics.revenueGrowth.toFixed(1)}% vs last {timeframe}
                      </Text>
                    </View>
                  )}
                </View>
              </PressCard>

              {/* Secondary KPIs Grid */}
              <View style={s.kpiGrid}>
                <View style={s.kpiRow}>
                  <PressCard onPress={() => router.push("/(company)/(tabs)/bookings" as any)} style={s.kpiCard}>
                    <Text style={s.kpiLabel}>Bookings</Text>
                    <Text style={s.kpiValue}>{metrics?.activeBookings ?? 0}</Text>
                    <Text style={s.kpiSubLabel}>Active now</Text>
                  </PressCard>

                  <PressCard onPress={() => router.push("/(company)/(tabs)/bookings" as any)} style={s.kpiCard}>
                    <Text style={s.kpiLabel}>Completion</Text>
                    <Text style={s.kpiValue}>{metrics?.completionRate ?? 0}%</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Text style={s.kpiSubLabel}>Target: 95%</Text>
                      {metrics?.completionRate >= 95 && <MaterialCommunityIcons name="check-circle" size={14} color={T.success} />}
                    </View>
                  </PressCard>
                </View>

                <View style={s.kpiRow}>
                  <PressCard onPress={() => router.push("/(company)/reviews" as any)} style={[s.kpiCard, { flex: 2.1 }]}>
                    <Text style={s.kpiLabel}>Average Rating</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
                      <Text style={s.kpiValue}>{metrics?.averageRating ? metrics.averageRating.toFixed(1) : "N/A"}</Text>
                      <View style={{ flexDirection: "row", marginTop: 4 }}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <MaterialCommunityIcons key={s} name="star" size={18} color={s <= Math.round(metrics?.averageRating ?? 0) ? T.warning : T.border} />
                        ))}
                      </View>
                    </View>
                    <Text style={s.kpiSubLabel}>{metrics?.totalReviews ?? 0} total reviews</Text>
                  </PressCard>
                </View>
              </View>

              {/* Revenue Trend Chart */}
              <View style={s.chartCard}>
                <View style={s.chartHeader}>
                  <Text style={s.sectionTitle}>Weekly Trend</Text>
                  <Text style={s.chartSub}>Last 7 days performance</Text>
                </View>

                <View style={s.chartBarsWrap}>
                  {metrics?.weeklyData?.map((item: any, idx: number) => (
                    <View key={idx} style={s.chartBarContainer}>
                      <View style={[s.chartBarBg, { height: `${Math.max(item.value, 4)}%` }]}>
                        <View style={[s.chartBarFill, item.latest && s.chartBarFillLatest]} />
                      </View>
                      <Text style={[s.chartBarLabel, item.latest && s.chartBarLabelLatest]}>{item.label}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Activity Feed */}
              <View style={s.activitySection}>
                <View style={s.activityHeader}>
                  <Text style={s.sectionTitle}>Recent Activity</Text>
                  <TouchableOpacity onPress={() => router.push("/(company)/(tabs)/bookings" as any)}>
                    <Text style={s.viewAllBtn}>VIEW ALL</Text>
                  </TouchableOpacity>
                </View>

                <View style={s.activityList}>
                  {metrics?.activities?.length === 0 ? (
                    <View style={s.emptyBox}>
                      <MaterialCommunityIcons name="bell-sleep" size={40} color={T.text3} />
                      <Text style={s.emptyText}>No recent activity found.</Text>
                    </View>
                  ) : (
                    metrics?.activities?.map((activity: any) => (
                      <View key={activity.id} style={s.activityCard}>
                        <View style={[s.activityIconBox, { backgroundColor: activity.iconBg || T.accentLight }]}>
                          <MaterialCommunityIcons name={activity.icon} size={22} color={activity.iconColor || T.accent} />
                        </View>
                        <View style={s.activityInfo}>
                          <Text style={s.activityTitle}>{activity.title}</Text>
                          <Text style={s.activitySub}>{activity.subtitle}</Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={18} color={T.border} />
                      </View>
                    ))
                  )}
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 24, paddingVertical: 16, backgroundColor: T.bg,
  },
  menuBtn: { marginLeft: -8, padding: 8 },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 18, fontWeight: "800", color: T.accent },
  
  timeframeContainer: { paddingHorizontal: 24, paddingBottom: 16, backgroundColor: T.bg },
  timeframeRow: { flexDirection: "row", backgroundColor: T.surface, borderRadius: 14, padding: 4, borderWidth: 1, borderColor: T.border },
  timeframeBtn: { flex: 1, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  timeframeBtnActive: { backgroundColor: T.accent, borderWidth: 1, borderColor: T.border },
  timeframeText: { fontSize: 13, fontWeight: "700", color: T.text2 },
  timeframeTextActive: { color: "#fff" },

  scrollView: { flex: 1 },
  contentPad: { paddingHorizontal: 24, paddingTop: 8 },
  loadingBox: { paddingVertical: 80, alignItems: "center" },

  heroCard: { backgroundColor: T.accent, borderRadius: 24, padding: 24, marginBottom: 16, overflow: "visible", ...HERO_SHADOW },
  heroHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 20 },
  heroIconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  heroLabel: { flex: 1, fontSize: 13, fontWeight: "700", color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: 1 },
  heroContent: { gap: 8 },
  heroValue: { fontSize: 36, fontWeight: "800", color: "#fff", letterSpacing: -0.5 },
  heroGrowthRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  heroGrowthText: { fontSize: 13, fontWeight: "700" },

  kpiGrid: { gap: 16, marginBottom: 24 },
  kpiRow: { flexDirection: "row", gap: 16 },
  kpiCard: { flex: 1, backgroundColor: T.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: T.border, ...CARD_SHADOW },
  kpiLabel: { fontSize: 12, fontWeight: "700", color: T.text3, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 },
  kpiValue: { fontSize: 26, fontWeight: "800", color: T.text1 },
  kpiSubLabel: { fontSize: 12, fontWeight: "600", color: T.text3, marginTop: 6 },

  chartCard: { backgroundColor: T.surface, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: T.border, marginBottom: 32, ...CARD_SHADOW },
  chartHeader: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: T.text1 },
  chartSub: { fontSize: 13, fontWeight: "500", color: T.text3, marginTop: 4 },

  chartBarsWrap: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", height: 160, gap: 12 },
  chartBarContainer: { flex: 1, alignItems: "center", gap: 10 },
  chartBarBg: { width: "100%", backgroundColor: T.accentLight, borderRadius: 8, overflow: "hidden" },
  chartBarFill: { position: "absolute", bottom: 0, left: 0, right: 0, top: 0, backgroundColor: T.accentMid, opacity: 0.5 },
  chartBarFillLatest: { backgroundColor: T.accent, opacity: 1 },
  chartBarLabel: { fontSize: 11, fontWeight: "700", color: T.text3 },
  chartBarLabelLatest: { color: T.accent },

  activitySection: { marginBottom: 24 },
  activityHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  viewAllBtn: { fontSize: 12, fontWeight: "800", color: T.accentMid, letterSpacing: 1 },
  
  activityList: { gap: 12 },
  emptyBox: { alignItems: "center", paddingVertical: 40, gap: 12, backgroundColor: T.surface, borderRadius: 20, borderWidth: 1, borderColor: T.border },
  emptyText: { color: T.text3, fontWeight: "600", fontSize: 14 },
  
  activityCard: { flexDirection: "row", alignItems: "center", backgroundColor: T.surface, borderRadius: 20, padding: 16, gap: 16, borderWidth: 1, borderColor: T.border, ...CARD_SHADOW },
  activityIconBox: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  activityInfo: { flex: 1, gap: 4 },
  activityTitle: { fontSize: 15, fontWeight: "800", color: T.text1 },
  activitySub: { fontSize: 13, fontWeight: "500", color: T.text3 },
});
