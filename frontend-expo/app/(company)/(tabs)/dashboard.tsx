/**
 * Company Dashboard — Premium Redesign (Animated)
 */
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  ScrollView, Text, View, TouchableOpacity, ActivityIndicator,
  RefreshControl, StyleSheet, Animated, Pressable, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { Swipeable } from "react-native-gesture-handler";
import { api } from "@/store/authStore";
import NotificationBell from "@/components/NotificationBell";
import ErrorState from "@/components/common/ErrorState";
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

function AnimatedNumber({ value, prefix = "", suffix = "", fractionDigits = 0, style }: { value: number, prefix?: string, suffix?: string, fractionDigits?: number, style?: any }) {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    let start = 0;
    const duration = 1200;
    const frames = 60;
    const stepTime = Math.abs(Math.floor(duration / frames));
    const step = value / frames;
    
    let current = start;
    const timer = setInterval(() => {
      current += step;
      if (current >= value) {
        clearInterval(timer);
        setDisplayValue(value);
      } else {
        setDisplayValue(current);
      }
    }, stepTime);
    
    return () => clearInterval(timer);
  }, [value]);

  return <Text style={style}>{prefix}{displayValue.toLocaleString(undefined, { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits })}{suffix}</Text>;
}

function ChartBar({ item, index }: { item: any, index: number }) {
  const heightAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.timing(heightAnim, {
      toValue: Math.max(item.value || item.actualValue || 0, 4),
      duration: 800,
      delay: index * 100,
      useNativeDriver: false
    }).start();
  }, [item.value, item.actualValue]);

  return (
    <View style={s.chartBarContainer}>
      <Animated.View style={[s.chartBarBg, { height: heightAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) }]}>
        <View style={[s.chartBarFill, item.latest && s.chartBarFillLatest]} />
      </Animated.View>
      <Text style={[s.chartBarLabel, item.latest && s.chartBarLabelLatest]}>{item.label || item.day}</Text>
    </View>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [timeframe, setTimeframe] = useState("week");
  const setCompanyOpen = useSidebarStore((s) => s.setCompanyOpen);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [company, setCompany] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [pendingBookings, setPendingBookings] = useState<any[]>([]);

  const loadDashboardData = useCallback(async (isRefresh = false, period = timeframe) => {
    if (isRefresh) { setRefreshing(true); } else { setLoading(true); }
    try {
      const [companyRes, metricsRes, bookingsRes] = await Promise.all([
        api.get("/api/companies/my-company"),
        api.get(`/api/companies/my-company/metrics?period=${period}`),
        api.get("/api/bookings"),
      ]);
      setCompany(companyRes.data?.data || companyRes.data);
      setMetrics(metricsRes.data?.data || metricsRes.data);

      const allBookings = bookingsRes.data?.data?.bookings || bookingsRes.data?.bookings || bookingsRes.data?.data || [];
      setPendingBookings(allBookings.filter((b: any) => b.status === 'pending').slice(0, 3));
      setHasError(false);
    } catch (error) {
      console.error("Failed to load dashboard data", error);
      setHasError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [timeframe]);

  useEffect(() => { loadDashboardData(false, timeframe); }, [timeframe]);

  const handleAcceptBooking = async (id: number) => {
    try {
      await api.patch(`/api/bookings/${id}/status`, { status: 'confirmed' });
      Toast.show({ type: 'success', text1: 'Booking Accepted', text2: 'The customer has been notified.' });
      loadDashboardData(true);
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: e.response?.data?.message || 'Failed to accept booking.' });
    }
  };

  const handleDeclineBooking = (id: number) => {
    router.push(`/(company)/booking/${id}` as any);
  };

  const renderLeftActions = (progress: any, dragX: any, id: number) => {
    const scale = dragX.interpolate({ inputRange: [0, 100], outputRange: [0, 1], extrapolate: 'clamp' });
    return (
      <TouchableOpacity style={s.swipeActionLeft} onPress={() => handleAcceptBooking(id)}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <MaterialCommunityIcons name="check-bold" size={28} color="#FFF" />
          <Text style={s.swipeActionText}>ACCEPT</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const renderRightActions = (progress: any, dragX: any, id: number) => {
    const scale = dragX.interpolate({ inputRange: [-100, 0], outputRange: [1, 0], extrapolate: 'clamp' });
    return (
      <TouchableOpacity style={s.swipeActionRight} onPress={() => handleDeclineBooking(id)}>
        <Animated.View style={{ transform: [{ scale }], alignItems: 'center' }}>
          <MaterialCommunityIcons name="close" size={28} color="#FFF" />
          <Text style={s.swipeActionText}>DECLINE</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
        {/* Top App Bar */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => setCompanyOpen(true)} style={s.menuBtn} accessibilityRole="button" accessibilityLabel="Open menu">
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
          ) : hasError && !metrics ? (
            <ErrorState onRetry={() => { setLoading(true); loadDashboardData(false, timeframe); }} />
          ) : (
            <View style={s.contentPad}>
              {/* Escrow and Wallet KPI Grid */}
              <View style={s.kpiGrid}>
                {/* Available Wallet Balance */}
                <PressCard onPress={() => router.push("/(company)/payouts/request" as any)} style={[s.heroCard, { flex: 2, backgroundColor: T.accent }]}>
                  <View style={s.heroHeader}>
                    <View style={s.heroIconWrap}>
                      <MaterialCommunityIcons name="wallet-outline" size={24} color={T.accent} />
                    </View>
                    <Text style={[s.heroLabel, { color: "rgba(255,255,255,0.8)" }]}>Available Wallet</Text>
                  </View>
                  <View style={s.heroContent}>
                    <AnimatedNumber 
                      value={metrics?.availableBalance || 0} 
                      prefix="$" 
                      fractionDigits={2} 
                      style={[s.heroValue, { color: "#FFF" }]} 
                    />
                    <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 4, fontWeight: "600" }}>Tap to withdraw funds</Text>
                  </View>
                </PressCard>
                
                {/* Escrow Hold */}
                <PressCard onPress={() => router.push("/(company)/(tabs)/operations" as any)} style={[s.kpiCard, { flex: 1.5 }]}>
                  <Text style={s.kpiLabel}>In Escrow</Text>
                  <AnimatedNumber 
                    value={metrics?.escrowBalance || 0} 
                    prefix="$" 
                    fractionDigits={2} 
                    style={[s.kpiValue, { color: T.info }]} 
                  />
                  <Text style={s.kpiSubLabel}>Active jobs</Text>
                </PressCard>
              </View>

              {/* Secondary KPIs */}
              <View style={s.kpiRow}>
                <PressCard onPress={() => router.push("/(company)/analytics" as any)} style={s.kpiCard}>
                  <Text style={s.kpiLabel}>Total Revenue</Text>
                  <AnimatedNumber 
                    value={metrics?.revenue || 0} 
                    prefix="$" 
                    fractionDigits={2} 
                    style={s.kpiValue} 
                  />
                  <Text style={s.kpiSubLabel}>All-time earnings</Text>
                </PressCard>
                <PressCard onPress={() => router.push("/(company)/(tabs)/operations" as any)} style={s.kpiCard}>
                  <Text style={s.kpiLabel}>Completion</Text>
                  <View style={{ flexDirection: "row", alignItems: "baseline" }}>
                    <AnimatedNumber 
                      value={metrics?.completionRate || 0} 
                      suffix="%" 
                      style={s.kpiValue} 
                    />
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 }}>
                    <Text style={s.kpiSubLabel}>Target: 95%</Text>
                    {metrics?.completionRate >= 95 && <MaterialCommunityIcons name="check-circle" size={14} color={T.success} />}
                  </View>
                </PressCard>
              </View>

              {/* Revenue Trend Chart */}
              <View style={s.chartCard}>
                <View style={s.chartHeader}>
                  <Text style={s.sectionTitle}>Weekly Trend</Text>
                  <Text style={s.chartSub}>Last 7 days performance</Text>
                </View>

                <View style={s.chartBarsWrap}>
                  {metrics?.weeklyData && metrics.weeklyData.length > 0 ? (
                    metrics.weeklyData.map((item: any, idx: number) => (
                      <ChartBar key={idx} item={{...item, latest: idx === metrics.weeklyData.length - 1}} index={idx} />
                    ))
                  ) : (
                    <Text style={s.emptyText}>No data for this period</Text>
                  )}
                </View>
              </View>

              {/* Urgent Action SLA Queue */}
              {pendingBookings.length > 0 ? (
                <View style={s.pendingSection}>
                  <View style={s.activityHeader}>
                    <Text style={[s.sectionTitle, { color: T.error }]}>Urgent Action Queue</Text>
                    <TouchableOpacity onPress={() => router.push("/(company)/(tabs)/bookings" as any)}>
                      <Text style={s.viewAllBtn}>VIEW ALL</Text>
                    </TouchableOpacity>
                  </View>
                  
                  {/* Warning SLA Banner */}
                  <View style={s.slaWarningBanner}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={20} color={T.error} />
                    <Text style={s.slaWarningText}>
                      You have {pendingBookings.length} pending job{pendingBookings.length > 1 ? 's' : ''} nearing the 2-hour response limit.
                    </Text>
                  </View>

                  <View style={s.activityList}>
                    {pendingBookings.map((booking) => (
                      <Swipeable
                        key={booking.id}
                        renderLeftActions={(p, d) => renderLeftActions(p, d, booking.id)}
                        renderRightActions={(p, d) => renderRightActions(p, d, booking.id)}
                        overshootLeft={false}
                        overshootRight={false}
                      >
                        <View style={s.pendingCard}>
                          <View style={s.pendingInfo}>
                            <Text style={s.pendingTitle}>{booking.customer?.fullName || 'Customer'}</Text>
                            <Text style={s.pendingSub}>{booking.service?.name}</Text>
                            <Text style={s.pendingDate}>
                              {new Date(booking.bookingDate).toLocaleDateString()} {booking.startTime ? `at ${booking.startTime}` : ''}
                            </Text>
                          </View>
                          <View style={s.swipeHintRow}>
                            <MaterialCommunityIcons name="chevron-left" size={14} color={T.text3} />
                            <Text style={s.swipeHintText}>Swipe left to decline, right to accept</Text>
                            <MaterialCommunityIcons name="chevron-right" size={14} color={T.text3} />
                          </View>
                        </View>
                      </Swipeable>
                    ))}
                  </View>
                </View>
              ) : (
                <View style={[s.pendingSection, { alignItems: 'center', paddingVertical: 32 }]}>
                   <MaterialCommunityIcons name="check-circle-outline" size={48} color={T.success} style={{ marginBottom: 16 }} />
                   <Text style={{ fontSize: 16, fontWeight: '700', color: T.text1 }}>No urgent actions needed!</Text>
                   <Text style={{ fontSize: 14, color: T.text3, marginTop: 4 }}>You're all caught up on your booking queue.</Text>
                </View>
              )}

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
  headerTitle: { flex: 1, textAlign: "center", fontSize: 18, fontWeight: "700", color: T.accent },
  
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
  heroValue: { fontSize: 36, fontWeight: "700", color: "#fff", letterSpacing: -0.5 },

  kpiGrid: { gap: 16, marginBottom: 24 },
  kpiRow: { flexDirection: "row", gap: 16, marginBottom: 24 },
  kpiCard: { flex: 1, backgroundColor: T.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: T.border, ...CARD_SHADOW },
  kpiLabel: { fontSize: 12, fontWeight: "700", color: T.text3, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 },
  kpiValue: { fontSize: 26, fontWeight: "700", color: T.text1 },
  kpiSubLabel: { fontSize: 12, fontWeight: "600", color: T.text3, marginTop: 6 },

  chartCard: { backgroundColor: T.surface, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: T.border, marginBottom: 32, ...CARD_SHADOW },
  chartHeader: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: T.text1 },
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
  viewAllBtn: { fontSize: 12, fontWeight: "700", color: T.accentMid, letterSpacing: 1 },
  
  activityList: { gap: 12 },
  emptyBox: { alignItems: "center", paddingVertical: 40, gap: 12, backgroundColor: T.surface, borderRadius: 20, borderWidth: 1, borderColor: T.border },
  emptyText: { color: T.text3, fontWeight: "600", fontSize: 14 },
  
  activityCard: { flexDirection: "row", alignItems: "center", backgroundColor: T.surface, borderRadius: 20, padding: 16, gap: 16, borderWidth: 1, borderColor: T.border, ...CARD_SHADOW },
  activityIconBox: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  activityInfo: { flex: 1, gap: 4 },
  activityTitle: { fontSize: 15, fontWeight: "700", color: T.text1 },
  activitySub: { fontSize: 13, fontWeight: "500", color: T.text3 },

  pendingSection: { marginBottom: 24 },
  slaWarningBanner: { flexDirection: "row", alignItems: "center", backgroundColor: T.error + "15", padding: 12, borderRadius: 12, marginBottom: 16, gap: 8 },
  slaWarningText: { fontSize: 13, fontWeight: "600", color: T.error, flex: 1 },
  
  pendingCard: { backgroundColor: T.surface, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: T.warning, ...CARD_SHADOW },
  pendingInfo: { marginBottom: 12 },
  pendingTitle: { fontSize: 16, fontWeight: "700", color: T.text1 },
  pendingSub: { fontSize: 14, fontWeight: "600", color: T.text2, marginTop: 4 },
  pendingDate: { fontSize: 13, color: T.text3, marginTop: 4 },
  
  swipeHintRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: T.border },
  swipeHintText: { fontSize: 11, fontWeight: "700", color: T.text3, textTransform: "uppercase" },

  swipeActionLeft: { backgroundColor: T.success, justifyContent: "center", alignItems: "center", width: 100, borderTopLeftRadius: 20, borderBottomLeftRadius: 20, height: "100%" },
  swipeActionRight: { backgroundColor: T.error, justifyContent: "center", alignItems: "center", width: 100, borderTopRightRadius: 20, borderBottomRightRadius: 20, height: "100%" },
  swipeActionText: { color: "#fff", fontSize: 11, fontWeight: "700", marginTop: 4, textTransform: "uppercase" },
});
