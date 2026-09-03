import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import api from '../../../utils/api';

const { width } = Dimensions.get('window');

export default function MoneyScreen() {
  const router = useRouter();
  const T = { 
    bg: '#F8FAFC', 
    surface: '#FFFFFF', 
    surfaceSubtle: '#F1F5F9',
    text1: '#0F172A', 
    text2: '#475569', 
    text3: '#94A3B8', 
    primary: '#0A192F', 
    primaryLight: '#F1F5F9',
    success: '#10B981', 
    successLight: '#ECFDF5',
    successDark: '#059669',
    amber: '#F59E0B',
    amberLight: '#FEF3C7',
    border: '#E2E8F0', 
    danger: '#EF4444' 
  };

  const [perf, setPerf] = useState<any>(null);
  const [completedTrips, setCompletedTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'today' | 'week'>('today');

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      (async () => {
        try {
          const [perfRes, tripsRes] = await Promise.all([
            api.get('/api/staff/performance'),
            api.get('/api/bookings/my-assignments', { params: { status: 'completed', limit: 10 } })
          ]);

          if (isActive) {
            setPerf(perfRes.data.performance || perfRes.data.data);
            const trips = tripsRes.data.bookings || tripsRes.data.data?.bookings || tripsRes.data.data || [];
            setCompletedTrips(Array.isArray(trips) ? trips : []);
          }
        } catch (err) {
          console.warn("Failed to load staff performance/trips", err);
        } finally {
          if (isActive) setLoading(false);
        }
      })();
      return () => { isActive = false; };
    }, [])
  );

  if (loading) {
    return (
      <SafeAreaView style={[s.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={T.primary} />
      </SafeAreaView>
    );
  }

  const p = perf || {};
  const todayEarn = p.todayEarnings || 0;
  const weeklyEarn = p.weeklyEarnings || 0;
  const todayJobs = p.todayCompleted || 0;
  const weeklyJobs = p.weeklyCompleted || 0;
  const avgRating = typeof p.avgRating === 'number' ? p.avgRating : 5.0;
  const compRate = typeof p.completionRate === 'number' ? p.completionRate : 100;
  const acceptanceRate = typeof p.responseRate === 'number' ? p.responseRate : 100;

  // Real 7-Day Weekly Chart from API
  const defaultDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => ({
    day,
    amount: 0,
    isToday: false
  }));
  const daysData = (Array.isArray(p.weeklyChart) && p.weeklyChart.length > 0) 
    ? p.weeklyChart 
    : defaultDays;
  const maxBarVal = Math.max(...daysData.map((d: any) => d.amount), 1);

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        
        {/* Top Shift Header */}
        <View style={s.headerRow}>
          <View>
            <Text style={s.headerTitle}>Earnings</Text>
            <Text style={s.headerSubtitle}>Delivery & Service Revenue</Text>
          </View>
          <View style={s.shiftPill}>
            <View style={s.shiftDot} />
            <Text style={s.shiftText}>Active Shift</Text>
          </View>
        </View>

        {/* Timeframe Switcher */}
        <View style={s.segmentContainer}>
          <TouchableOpacity 
            style={[s.segmentBtn, timeframe === 'today' && s.segmentBtnActive]}
            onPress={() => setTimeframe('today')}
            activeOpacity={0.85}
          >
            <Text style={[s.segmentText, timeframe === 'today' && s.segmentTextActive]}>Today</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[s.segmentBtn, timeframe === 'week' && s.segmentBtnActive]}
            onPress={() => setTimeframe('week')}
            activeOpacity={0.85}
          >
            <Text style={[s.segmentText, timeframe === 'week' && s.segmentTextActive]}>This Week</Text>
          </TouchableOpacity>
        </View>

        {/* Main Uber-style Earnings Hero Card */}
        <View style={s.heroCard}>
          <Text style={s.heroLabel}>
            {timeframe === 'today' ? "TODAY'S NET EARNINGS" : "THIS WEEK'S NET EARNINGS"}
          </Text>
          <Text style={s.heroAmount}>
            ${timeframe === 'today' ? todayEarn.toFixed(2) : weeklyEarn.toFixed(2)}
          </Text>

          {/* Quick Metrics Bar */}
          <View style={s.heroMetricsRow}>
            <View style={s.heroMetricItem}>
              <Text style={s.heroMetricValue}>{timeframe === 'today' ? todayJobs : weeklyJobs}</Text>
              <Text style={s.heroMetricLabel}>Completed Trips</Text>
            </View>
            <View style={s.heroMetricDivider} />
            <View style={s.heroMetricItem}>
              <Text style={s.heroMetricValue}>{timeframe === 'today' ? '3h 45m' : '22h 10m'}</Text>
              <Text style={s.heroMetricLabel}>Online Time</Text>
            </View>
          </View>

          {/* Company Payroll Info Banner */}
          <View style={s.payrollBanner}>
            <View style={s.payrollIconBox}>
              <MaterialCommunityIcons name="shield-check" size={18} color="#10B981" />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={s.payrollTitle}>Direct Company Payroll</Text>
              <Text style={s.payrollSub}>
                Your earnings are tracked automatically and disbursed directly by your company manager.
              </Text>
            </View>
          </View>
        </View>

        {/* 7-Day Weekly Breakdown Bar Chart */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Weekly Activity</Text>
          <Text style={s.sectionMeta}>Avg. $78 / day</Text>
        </View>
        
        <View style={s.chartCard}>
          <View style={s.barsContainer}>
            {daysData.map((d: any, idx: number) => {
              const barHeight = Math.max(12, (d.amount / maxBarVal) * 90);
              return (
                <View key={idx} style={s.barColumn}>
                  <Text style={s.barAmountText}>${d.amount}</Text>
                  <View style={s.barTrack}>
                    <View 
                      style={[
                        s.barFill, 
                        { height: barHeight },
                        d.isToday ? s.barFillToday : s.barFillNormal
                      ]} 
                    />
                  </View>
                  <Text style={[s.barDayLabel, d.isToday && s.barDayLabelToday]}>{d.day}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Driver Performance & Rating */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Driver Quality Metrics</Text>
        </View>

        <View style={s.statsGrid}>
          <View style={s.statCard}>
            <View style={s.statIconCircleAmber}>
              <MaterialCommunityIcons name="star" size={20} color="#D97706" />
            </View>
            <Text style={s.statNumber}>{typeof avgRating === 'number' ? avgRating.toFixed(2) : '4.98'}</Text>
            <Text style={s.statName}>Customer Rating</Text>
          </View>

          <View style={s.statCard}>
            <View style={s.statIconCircleGreen}>
              <MaterialCommunityIcons name="check-decagram" size={20} color={T.success} />
            </View>
            <Text style={s.statNumber}>{compRate}%</Text>
            <Text style={s.statName}>Completion Rate</Text>
          </View>

          <View style={s.statCard}>
            <View style={s.statIconCircleIndigo}>
              <MaterialCommunityIcons name="gesture-tap" size={20} color={T.primary} />
            </View>
            <Text style={s.statNumber}>{acceptanceRate}%</Text>
            <Text style={s.statName}>Acceptance</Text>
          </View>
        </View>

        {/* Recent Delivery Trips Feed */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Recent Completed Trips</Text>
          <Text style={s.sectionMeta}>{completedTrips.length} recent</Text>
        </View>

        {completedTrips.length === 0 ? (
          <View style={s.emptyTripsCard}>
            <MaterialCommunityIcons name="car-sports" size={36} color={T.text3} />
            <Text style={s.emptyTripsTitle}>No completed trips yet today</Text>
            <Text style={s.emptyTripsSub}>Completed customer dispatches will appear here with detailed payout breakdowns.</Text>
          </View>
        ) : (
          completedTrips.map((trip) => {
            const customerName = trip.customer?.fullName || "Customer";
            const serviceName = trip.service?.name || "On-Demand Service";
            const fare = trip.totalPrice || "35.00";
            const dateStr = trip.bookingDate 
              ? new Date(trip.bookingDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'Recently';

            return (
              <View key={trip.id} style={s.tripItemCard}>
                <View style={s.tripIconCircle}>
                  <MaterialCommunityIcons name="check-bold" size={16} color={T.success} />
                </View>
                
                <View style={{ flex: 1, marginHorizontal: 12 }}>
                  <Text style={s.tripServiceName}>{serviceName}</Text>
                  <Text style={s.tripCustomerName}>{customerName} · {dateStr}</Text>
                  <Text style={s.tripAddress} numberOfLines={1}>{trip.serviceAddress || "Phnom Penh Metro"}</Text>
                </View>

                <View style={s.tripPayoutBlock}>
                  <Text style={s.tripAmount}>+${fare}</Text>
                  <View style={s.paidBadge}>
                    <Text style={s.paidBadgeText}>Paid</Text>
                  </View>
                </View>
              </View>
            );
          })
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 20, paddingBottom: 110 },
  
  /* Header */
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.6,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  shiftPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  shiftDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  shiftText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#059669',
  },

  /* Segment */
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    padding: 4,
    marginBottom: 18,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  segmentTextActive: {
    color: '#0F172A',
    fontWeight: '800',
  },

  /* Hero Card */
  heroCard: {
    backgroundColor: '#0F172A',
    borderRadius: 24,
    padding: 22,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
    marginBottom: 24,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  heroAmount: {
    fontSize: 38,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 4,
    letterSpacing: -1,
  },
  heroMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 18,
    marginBottom: 18,
  },
  heroMetricItem: {
    alignItems: 'center',
    flex: 1,
  },
  heroMetricValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroMetricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: 2,
  },
  heroMetricDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  payrollBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  payrollIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  payrollTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  payrollSub: {
    fontSize: 10.5,
    fontWeight: '500',
    color: '#94A3B8',
    lineHeight: 14,
  },

  /* Sections */
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  sectionMeta: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },

  /* Weekly Chart */
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 130,
    paddingTop: 10,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
  },
  barAmountText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 4,
  },
  barTrack: {
    height: 90,
    width: 14,
    backgroundColor: '#F1F5F9',
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 7,
  },
  barFillNormal: {
    backgroundColor: '#CBD5E1',
  },
  barFillToday: {
    backgroundColor: '#4F46E5',
  },
  barDayLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: 6,
  },
  barDayLabelToday: {
    color: '#4F46E5',
    fontWeight: '900',
  },

  /* Stats Grid */
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  statIconCircleAmber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statIconCircleGreen: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statIconCircleIndigo: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  statName: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },

  /* Trips Feed */
  tripItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  tripIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tripServiceName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  tripCustomerName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  tripAddress: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  tripPayoutBlock: {
    alignItems: 'flex-end',
  },
  tripAmount: {
    fontSize: 16,
    fontWeight: '900',
    color: '#10B981',
  },
  paidBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 3,
  },
  paidBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  emptyTripsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  emptyTripsTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 6,
  },
  emptyTripsSub: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
  },
});
