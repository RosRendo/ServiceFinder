/**
 * Company Dashboard — Premium Redesign (Animated)
 */
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  ScrollView, Text, View, TouchableOpacity, ActivityIndicator,
  RefreshControl, StyleSheet, Animated, Pressable, Platform, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
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
    <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} style={style}>
      <Animated.View style={{ transform: [{ scale }] }}>
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
  const [totalPendingCount, setTotalPendingCount] = useState(0);
  const [bookings, setBookings] = useState<any[]>([]);

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
      const pending = allBookings.filter((b: any) => b.status === 'pending');
      setTotalPendingCount(pending.length);
      setPendingBookings(pending.slice(0, 3));
      setBookings(allBookings);
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

  const formatBookingTime = (dateStr?: string, timeStr?: string) => {
    if (!dateStr) return "Flexible schedule";
    try {
      const d = new Date(dateStr);
      const today = new Date();
      const isToday = d.toDateString() === today.toDateString();
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);
      const isTomorrow = d.toDateString() === tomorrow.toDateString();

      const dayPrefix = isToday
        ? "Today"
        : isTomorrow
        ? "Tomorrow"
        : d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

      if (timeStr) {
        if (timeStr.includes("T")) {
          const timeDate = new Date(timeStr);
          return `${dayPrefix} · ${timeDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
        }
        return `${dayPrefix} · ${timeStr}`;
      }
      return dayPrefix;
    } catch {
      return dateStr;
    }
  };

  const isInstantBooking = (booking: any) => {
    if (booking.isInstant) return true;
    const notes = (booking.customerNotes || "").toLowerCase();
    const addr = (booking.serviceAddress || "").toLowerCase();
    if (notes.includes("urgent") || notes.includes("instant") || notes.includes("asap")) return true;
    if (addr.includes("instant") || addr.includes("urgent")) return true;
    if (booking.createdAt && booking.bookingDate) {
      const created = new Date(booking.createdAt).getTime();
      const bDate = new Date(booking.bookingDate).getTime();
      if (Math.abs(bDate - created) < 2 * 60 * 60 * 1000) return true;
    }
    return false;
  };

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
    Alert.alert(
      "Decline Booking",
      "Are you sure you want to decline this booking request? The customer will be informed promptly.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Review Details", 
          onPress: () => router.push(`/(company)/booking/${id}` as any) 
        },
        { 
          text: "Decline Now", 
          style: "destructive",
          onPress: async () => {
            try {
              await api.patch(`/api/bookings/${id}/status`, { status: 'cancelled' });
              Toast.show({ type: 'info', text1: 'Booking Declined', text2: 'The customer has been notified.' });
              loadDashboardData(true);
            } catch (e: any) {
              Toast.show({ type: 'error', text1: 'Error', text2: e.response?.data?.message || 'Failed to decline booking.' });
            }
          }
        }
      ]
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
              {/* Today's Jobs Overview */}
              <View style={[s.todayJobsCard, CARD_SHADOW]}>
                <Text style={s.todayJobsHeader}>Today's Jobs</Text>
                <View style={s.todayJobsRow}>
                  <View style={s.todayJobsCol}>
                    <Text style={[s.todayJobsCount, { color: T.warning }]}>{bookings.filter((b: any) => b.status === 'pending').length}</Text>
                    <Text style={s.todayJobsLabel}>Pending</Text>
                  </View>
                  <View style={s.todayJobsDivider} />
                  <View style={s.todayJobsCol}>
                    <Text style={[s.todayJobsCount, { color: T.info }]}>{bookings.filter((b: any) => b.status === 'confirmed').length}</Text>
                    <Text style={s.todayJobsLabel}>Assigned</Text>
                  </View>
                  <View style={s.todayJobsDivider} />
                  <View style={s.todayJobsCol}>
                    <Text style={[s.todayJobsCount, { color: T.success }]}>{bookings.filter((b: any) => b.status === 'in_progress').length}</Text>
                    <Text style={s.todayJobsLabel}>Active</Text>
                  </View>
                </View>
              </View>

              {/* Quick Actions Grid */}
              <View style={s.quickActionsSection}>
                <Text style={s.sectionSubtitle}>Quick Actions</Text>
                <View style={s.quickActionsRow}>
                  <TouchableOpacity onPress={() => router.push("/(company)/(tabs)/operations" as any)} style={[s.quickActionBtn, CARD_SHADOW]}>
                    <View style={s.quickActionIconBox}>
                      <MaterialCommunityIcons name="plus-circle-outline" size={22} color={T.accent} />
                    </View>
                    <Text style={s.quickActionText}>Create Job</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => router.push("/(company)/(tabs)/staff" as any)} style={[s.quickActionBtn, CARD_SHADOW]}>
                    <View style={s.quickActionIconBox}>
                      <MaterialCommunityIcons name="account-plus-outline" size={22} color={T.accent} />
                    </View>
                    <Text style={s.quickActionText}>Assign Staff</Text>
                  </TouchableOpacity>
                </View>
                <View style={[s.quickActionsRow, { marginTop: 12 }]}>
                  <TouchableOpacity onPress={() => router.push("/(company)/services" as any)} style={[s.quickActionBtn, CARD_SHADOW]}>
                    <View style={s.quickActionIconBox}>
                      <MaterialCommunityIcons name="tag-plus-outline" size={22} color={T.accent} />
                    </View>
                    <Text style={s.quickActionText}>Add Service</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => router.push("/(company)/(tabs)/finance" as any)} style={[s.quickActionBtn, CARD_SHADOW]}>
                    <View style={s.quickActionIconBox}>
                      <MaterialCommunityIcons name="cash-multiple" size={22} color={T.accent} />
                    </View>
                    <Text style={s.quickActionText}>Earnings</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Available Wallet Balance Hero Card */}
              <PressCard onPress={() => router.push("/(company)/payments" as any)} style={[s.heroCard, { backgroundColor: T.accent, marginBottom: 20 }]}>
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

              {/* KPI Cards Row 1: Escrow & Total Revenue */}
              <View style={s.kpiRow}>
                <PressCard onPress={() => router.push("/(company)/(tabs)/operations" as any)} style={s.kpiCard}>
                  <Text style={s.kpiLabel}>In Escrow</Text>
                  <AnimatedNumber 
                    value={metrics?.escrowBalance || 0} 
                    prefix="$" 
                    fractionDigits={2} 
                    style={[s.kpiValue, { color: T.info }]} 
                  />
                  <Text style={s.kpiSubLabel}>Active jobs</Text>
                </PressCard>

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
              </View>

              {/* KPI Cards Row 2: Completion Rate */}
              <View style={s.kpiRow}>
                <PressCard onPress={() => router.push("/(company)/(tabs)/operations" as any)} style={s.kpiCard}>
                  <Text style={s.kpiLabel}>Completion Rate</Text>
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
                    <View style={s.queueHeaderLeft}>
                      <View style={s.urgentDot} />
                      <Text style={[s.sectionTitle, { color: T.error }]}>Urgent Action Queue</Text>
                      <View style={s.queueCountBadge}>
                        <Text style={s.queueCountBadgeText}>{totalPendingCount}</Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => router.push("/(company)/(tabs)/operations" as any)}>
                      <Text style={s.viewAllBtn}>VIEW ALL</Text>
                    </TouchableOpacity>
                  </View>
                  
                  {/* Warning SLA Banner */}
                  <View style={s.slaWarningBanner}>
                    <MaterialCommunityIcons name="clock-alert-outline" size={20} color={T.error} />
                    <View style={s.slaWarningContent}>
                      <Text style={s.slaWarningTitle}>
                        {totalPendingCount} pending job{totalPendingCount > 1 ? 's' : ''} awaiting immediate response
                      </Text>
                      <Text style={s.slaWarningSub}>
                        Respond within 2 hours to keep provider dispatch search rank high.
                      </Text>
                    </View>
                  </View>

                  <View style={s.urgentCardList}>
                    {pendingBookings.map((booking) => {
                      const isUrgent = isInstantBooking(booking);
                      return (
                        <TouchableOpacity
                          key={booking.id}
                          style={s.urgentDispatchCard}
                          activeOpacity={0.92}
                          onPress={() => router.push(`/(company)/booking/${booking.id}` as any)}
                        >
                          {/* Top Row: Urgency Tag + Earnings/Price */}
                          <View style={s.dispatchCardTop}>
                            <View style={[s.urgencyPill, isUrgent ? s.urgencyPillInstant : s.urgencyPillScheduled]}>
                              <MaterialCommunityIcons 
                                name={isUrgent ? "lightning-bolt" : "calendar-clock"} 
                                size={12} 
                                color={isUrgent ? "#DC2626" : "#0284C7"} 
                              />
                              <Text style={[s.urgencyPillText, isUrgent ? s.urgencyPillTextInstant : s.urgencyPillTextScheduled]}>
                                {isUrgent ? "⚡ INSTANT DISPATCH" : "📅 SCHEDULED"}
                              </Text>
                            </View>

                            <View style={s.payoutWrap}>
                              <Text style={s.payoutLabel}>PAYOUT</Text>
                              <Text style={s.payoutValue}>
                                ${Number(booking.companyEarnings ?? booking.totalPrice ?? 0).toFixed(2)}
                              </Text>
                            </View>
                          </View>

                          {/* Customer & Service Info */}
                          <View style={s.customerRow}>
                            <View style={s.customerAvatar}>
                              <Text style={s.customerAvatarText}>
                                {(booking.customer?.fullName || "C").charAt(0).toUpperCase()}
                              </Text>
                            </View>
                            <View style={s.customerMeta}>
                              <Text style={s.customerName} numberOfLines={1}>
                                {booking.customer?.fullName || 'Customer'}
                              </Text>
                              <Text style={s.serviceName} numberOfLines={1}>
                                {booking.service?.name || 'Service Request'}
                              </Text>
                            </View>
                          </View>

                          {/* Time & Location Details */}
                          <View style={s.dispatchLogistics}>
                            <View style={s.dispatchLogisticsItem}>
                              <MaterialCommunityIcons name="clock-time-four-outline" size={14} color={T.text3} />
                              <Text style={s.dispatchLogisticsText} numberOfLines={1}>
                                {formatBookingTime(booking.bookingDate, booking.startTime)}
                              </Text>
                            </View>
                            <View style={s.dispatchLogisticsItem}>
                              <MaterialCommunityIcons name="map-marker-outline" size={14} color={T.text3} />
                              <Text style={s.dispatchLogisticsText} numberOfLines={1}>
                                {booking.serviceAddress || "Address provided upon acceptance"}
                              </Text>
                            </View>
                          </View>

                          {/* Optional Customer Note */}
                          {booking.customerNotes ? (
                            <View style={s.customerNoteBox}>
                              <MaterialCommunityIcons name="message-text-outline" size={13} color={T.text3} />
                              <Text style={s.customerNoteText} numberOfLines={2}>
                                "{booking.customerNotes}"
                              </Text>
                            </View>
                          ) : null}

                          {/* 1-Tap Action Row */}
                          <View style={s.dispatchActionRow}>
                            <TouchableOpacity
                              style={s.declineBtn}
                              onPress={() => handleDeclineBooking(booking.id)}
                              activeOpacity={0.7}
                            >
                              <MaterialCommunityIcons name="close" size={16} color={T.error} />
                              <Text style={s.declineBtnText}>Decline</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={s.acceptBtn}
                              onPress={() => handleAcceptBooking(booking.id)}
                              activeOpacity={0.8}
                            >
                              <MaterialCommunityIcons name="check-bold" size={16} color="#FFF" />
                              <Text style={s.acceptBtnText}>Accept & Assign</Text>
                            </TouchableOpacity>
                          </View>
                        </TouchableOpacity>
                      );
                    })}

                    {/* Overflow Bar: what if many more */}
                    {totalPendingCount > 3 && (
                      <TouchableOpacity
                        style={s.overflowBar}
                        onPress={() => router.push("/(company)/(tabs)/operations" as any)}
                        activeOpacity={0.8}
                      >
                        <View style={s.overflowLeft}>
                          <View style={s.overflowIconWrap}>
                            <MaterialCommunityIcons name="layers-triple-outline" size={18} color={T.accent} />
                          </View>
                          <View>
                            <Text style={s.overflowTitle}>
                              +{totalPendingCount - 3} more pending job{totalPendingCount - 3 > 1 ? 's' : ''}
                            </Text>
                            <Text style={s.overflowSub}>
                              Tap to view complete operational dispatch queue
                            </Text>
                          </View>
                        </View>
                        <View style={s.overflowRightBadge}>
                          <Text style={s.overflowRightText}>Ops Queue</Text>
                          <MaterialCommunityIcons name="arrow-right" size={14} color={T.accent} />
                        </View>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ) : (
                <View style={s.emptyQueueCard}>
                  <View style={s.emptyQueueIconCircle}>
                    <MaterialCommunityIcons name="check-decagram-outline" size={36} color={T.success} />
                  </View>
                  <Text style={s.emptyQueueTitle}>All Caught Up!</Text>
                  <Text style={s.emptyQueueSub}>No urgent pending actions in your dispatch queue.</Text>
                </View>
              )}

              {/* Activity Feed */}
              <View style={s.activitySection}>
                <View style={s.activityHeader}>
                  <Text style={s.sectionTitle}>Recent Activity</Text>
                  <TouchableOpacity onPress={() => router.push("/(company)/(tabs)/operations" as any)}>
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

  todayJobsCard: {
    backgroundColor: T.surface,
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: T.border,
  },
  todayJobsHeader: {
    fontSize: 13,
    fontWeight: "800",
    color: T.text1,
    marginBottom: 16,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  todayJobsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  todayJobsCol: {
    flex: 1,
    alignItems: "center",
  },
  todayJobsCount: {
    fontSize: 28,
    fontWeight: "900",
  },
  todayJobsLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: T.text3,
    marginTop: 4,
  },
  todayJobsDivider: {
    width: 1,
    height: 32,
    backgroundColor: T.border,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: "800",
    color: T.text1,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  quickActionsSection: {
    marginBottom: 24,
  },
  quickActionsRow: {
    flexDirection: "row",
    gap: 12,
  },
  quickActionBtn: {
    flex: 1,
    backgroundColor: T.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: T.accentLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: "800",
    color: T.text1,
  },

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
  queueHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  urgentDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: T.error },
  queueCountBadge: {
    backgroundColor: T.errorBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: T.error + "40",
  },
  queueCountBadgeText: { fontSize: 12, fontWeight: "800", color: T.error },

  slaWarningBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: T.errorBg,
    padding: 12,
    borderRadius: 14,
    marginBottom: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: T.error + "25",
  },
  slaWarningContent: { flex: 1, gap: 2 },
  slaWarningTitle: { fontSize: 13, fontWeight: "700", color: T.error },
  slaWarningSub: { fontSize: 12, color: T.text2, lineHeight: 16 },

  urgentCardList: { gap: 14 },
  urgentDispatchCard: {
    backgroundColor: T.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: T.border,
    ...CARD_SHADOW,
  },
  dispatchCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  urgencyPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  urgencyPillInstant: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  urgencyPillScheduled: {
    backgroundColor: "#F0F9FF",
    borderColor: "#BAE6FD",
  },
  urgencyPillText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  urgencyPillTextInstant: { color: "#DC2626" },
  urgencyPillTextScheduled: { color: "#0284C7" },

  payoutWrap: { alignItems: "flex-end" },
  payoutLabel: { fontSize: 9, fontWeight: "700", color: T.text3, letterSpacing: 0.8 },
  payoutValue: { fontSize: 17, fontWeight: "800", color: T.text1 },

  customerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  customerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: T.accentLight,
    alignItems: "center",
    justifyContent: "center",
  },
  customerAvatarText: { fontSize: 17, fontWeight: "800", color: T.accent },
  customerMeta: { flex: 1, gap: 2 },
  customerName: { fontSize: 15, fontWeight: "700", color: T.text1 },
  serviceName: { fontSize: 13, fontWeight: "500", color: T.text2 },

  dispatchLogistics: {
    backgroundColor: T.bg,
    borderRadius: 12,
    padding: 10,
    gap: 6,
    marginBottom: 10,
  },
  dispatchLogisticsItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  dispatchLogisticsText: { fontSize: 12, fontWeight: "500", color: T.text2, flex: 1 },

  customerNoteBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFFBEB",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    gap: 6,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#FEF3C7",
  },
  customerNoteText: { fontSize: 12, color: "#92400E", fontStyle: "italic", flex: 1 },

  dispatchActionRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  declineBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: T.border,
    backgroundColor: T.surface,
  },
  declineBtnText: { fontSize: 13, fontWeight: "700", color: T.error },
  acceptBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: T.accent,
  },
  acceptBtnText: { fontSize: 13, fontWeight: "700", color: "#FFF" },

  overflowBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: T.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: T.accentLight,
    marginTop: 2,
    ...CARD_SHADOW,
  },
  overflowLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  overflowIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: T.accentLight,
    alignItems: "center",
    justifyContent: "center",
  },
  overflowTitle: { fontSize: 13, fontWeight: "700", color: T.text1 },
  overflowSub: { fontSize: 11, color: T.text3, marginTop: 1 },
  overflowRightBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: T.accentLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  overflowRightText: { fontSize: 11, fontWeight: "700", color: T.accent },

  emptyQueueCard: {
    backgroundColor: T.surface,
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: T.border,
    marginBottom: 24,
    ...CARD_SHADOW,
  },
  emptyQueueIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: T.successBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyQueueTitle: { fontSize: 16, fontWeight: "700", color: T.text1 },
  emptyQueueSub: { fontSize: 13, color: T.text3, marginTop: 4, textAlign: "center" },
});
