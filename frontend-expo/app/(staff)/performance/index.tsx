import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  RefreshControl, StyleSheet, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '@/store/authStore';

// ── Theme — same as dashboard ────────────────────────────────────────────────
const T = {
  bg:           '#F8FAFC',
  surface:      '#FFFFFF',
  primary:      '#0A192F',
  primaryLight: '#F0F4F8',
  text:         '#0F172A',
  textMuted:    '#64748B',
  border:       '#E2E8F0',
  success:      '#10B981',
  successLight: '#ECFDF5',
  amber:        '#F59E0B',
  amberLight:   '#FFFBEB',
  error:        '#EF4444',
  errorLight:   '#FEF2F2',
};

const SHADOW = {};

const GLOW = {};

interface PerformanceData {
  totalJobs:           number;
  completionRate:      number;
  avgRating:           number;
  onTimeRate:          number;
  responseRate:        number;
  ratingDistribution:  number[];
  recentReviews:       { customerName: string; rating: number; comment: string; date: string }[];
}

function Stars({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 1 }}>
      {[1, 2, 3, 4, 5].map(s => (
        <MaterialCommunityIcons
          key={s}
          name={s <= Math.round(rating) ? 'star' : 'star-outline'}
          size={size}
          color={s <= Math.round(rating) ? T.amber : '#CBD5E1'}
        />
      ))}
    </View>
  );
}

export default function Performance() {
  const router = useRouter();
  const [data,       setData]       = useState<PerformanceData | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = async () => {
    try {
      const [perfRes, revRes] = await Promise.allSettled([
        api.get('/api/staff/performance'),
        api.get('/api/staff/reviews?limit=10'),
      ]);
      const p = perfRes.status === 'fulfilled' ? (perfRes.value.data?.performance ?? {}) : {};
      const reviews = revRes.status === 'fulfilled' ? (revRes.value.data?.reviews ?? []) : [];

      setData({
        totalJobs:          p.completedBookings ?? 0,
        completionRate:     Number(p.completionRate ?? 0),
        avgRating:          Number(p.avgRating ?? 0),
        onTimeRate:         100,
        responseRate:       Number(p.responseRate ?? 92),
        ratingDistribution: Array.isArray(p.ratingDistribution) ? p.ratingDistribution : [0, 0, 0, 0, 0],
        recentReviews:      reviews.map((r: any) => ({
          customerName: r.customer?.fullName ?? 'Anonymous',
          rating:       r.staffRating ?? 5,
          comment:      r.comment ?? '',
          date:         r.createdAt ?? new Date().toISOString(),
        })),
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetch(); }, []);
  const onRefresh = () => { setRefreshing(true); fetch(); };

  const totalRatings = data?.ratingDistribution.reduce((a, b) => a + b, 0) ?? 0;

  if (loading) {
    return (
      <SafeAreaView style={s.root}>
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color={T.primary} />
          <Text style={{ color: T.textMuted, marginTop: 12 }}>Loading performance…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const avg = data?.avgRating ?? 0;
  const platformAvg = 4.3;
  const isAboveAvg = avg >= platformAvg;

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={T.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>My Performance</Text>
          <Text style={s.headerSub}>Ratings, reviews & job stats</Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 80, paddingTop: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero rating card ─────────────────────────────────────────────── */}
        <View style={s.heroCard}>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={s.heroLabel}>Average Rating</Text>
            <Text style={s.heroRating}>{avg.toFixed(1)}</Text>
            <Stars rating={avg} size={22} />
            <Text style={s.heroSub}>{totalRatings} total ratings</Text>
          </View>
          <View style={s.heroDivV} />
          <View style={{ flex: 1, gap: 14, paddingLeft: 24 }}>
            {[
              { label: 'Jobs Done',   value: String(data?.totalJobs ?? 0),      icon: 'briefcase-check-outline' },
              { label: 'Completion',  value: `${data?.completionRate ?? 0}%`,    icon: 'check-circle-outline' },
              { label: 'Response',    value: `${data?.responseRate ?? 0}%`,      icon: 'message-text-clock-outline' },
            ].map(m => (
              <View key={m.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={s.miniIconBox}>
                  <MaterialCommunityIcons name={m.icon as any} size={16} color="#FFF" />
                </View>
                <View>
                  <Text style={s.miniVal}>{m.value}</Text>
                  <Text style={s.miniLbl}>{m.label}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ── Platform comparison banner ───────────────────────────────────── */}
        <View style={[s.banner, { backgroundColor: isAboveAvg ? T.successLight : T.amberLight, borderColor: isAboveAvg ? '#6EE7B7' : '#FDE68A' }]}>
          <View style={[s.bannerIcon, { backgroundColor: isAboveAvg ? '#D1FAE5' : '#FEF3C7' }]}>
            <MaterialCommunityIcons
              name={isAboveAvg ? 'trending-up' : 'trending-neutral'}
              size={20}
              color={isAboveAvg ? T.success : T.amber}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.bannerTitle, { color: isAboveAvg ? '#065F46' : '#92400E' }]}>
              {isAboveAvg ? 'Above Platform Average' : 'Room to Improve'}
            </Text>
            <Text style={[s.bannerSub, { color: isAboveAvg ? '#047857' : '#B45309' }]}>
              Your {avg.toFixed(1)}★ {isAboveAvg ? 'beats' : 'is below'} the {platformAvg} platform average
            </Text>
          </View>
        </View>

        {/* ── Stat cards ───────────────────────────────────────────────────── */}
        <View style={s.statsGrid}>
          {[
            { icon: 'briefcase-check', label: 'Total Jobs',       value: String(data?.totalJobs ?? 0),   color: T.primary,  bg: T.primaryLight },
            { icon: 'check-circle',    label: 'Completion Rate',  value: `${data?.completionRate ?? 0}%`, color: T.success,  bg: T.successLight },
            { icon: 'message-text-clock', label: 'Response Rate', value: `${data?.responseRate ?? 92}%`, color: T.amber,    bg: T.amberLight },
            { icon: 'clock-check',     label: 'On-Time Rate',     value: `${data?.onTimeRate ?? 0}%`,     color: T.primary,  bg: T.primaryLight },
          ].map(m => (
            <View key={m.label} style={s.statCard}>
              <View style={[s.statIcon, { backgroundColor: m.bg }]}>
                <MaterialCommunityIcons name={m.icon as any} size={20} color={m.color} />
              </View>
              <Text style={[s.statVal, { color: m.color }]}>{m.value}</Text>
              <Text style={s.statLbl}>{m.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Rating Breakdown ─────────────────────────────────────────────── */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <View style={s.cardIconBox}>
              <MaterialCommunityIcons name="chart-bar" size={18} color={T.primary} />
            </View>
            <Text style={s.cardTitle}>Rating Breakdown</Text>
          </View>

          {totalRatings === 0 ? (
            <View style={s.emptyBox}>
              <MaterialCommunityIcons name="star-outline" size={36} color="#CBD5E1" />
              <Text style={s.emptyText}>No ratings yet.</Text>
            </View>
          ) : (
            <View style={{ gap: 8 }}>
              {[5, 4, 3, 2, 1].map(star => {
                const count = data?.ratingDistribution[star - 1] ?? 0;
                const pct = totalRatings > 0 ? (count / totalRatings) * 100 : 0;
                return (
                  <View key={star} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <MaterialCommunityIcons name="star" size={14} color={T.amber} />
                    <Text style={{ fontSize: 12, fontWeight: '700', color: T.text, width: 12 }}>{star}</Text>
                    <View style={{ flex: 1, height: 8, backgroundColor: T.border, borderRadius: 4, overflow: 'hidden' }}>
                      <View style={{ height: '100%', width: `${pct}%`, backgroundColor: T.amber, borderRadius: 4 }} />
                    </View>
                    <Text style={{ fontSize: 12, color: T.textMuted, width: 28, textAlign: 'right' }}>{count}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* ── Recent Reviews ───────────────────────────────────────────────── */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <View style={s.cardIconBox}>
              <MaterialCommunityIcons name="comment-text-multiple-outline" size={18} color={T.primary} />
            </View>
            <Text style={s.cardTitle}>Customer Reviews</Text>
            {(data?.recentReviews?.length ?? 0) > 0 && (
              <View style={s.countBadge}>
                <Text style={s.countBadgeTxt}>{data!.recentReviews.length}</Text>
              </View>
            )}
          </View>

          {(data?.recentReviews?.length ?? 0) === 0 ? (
            <View style={s.emptyBox}>
              <MaterialCommunityIcons name="comment-outline" size={36} color="#CBD5E1" />
              <Text style={s.emptyText}>No reviews yet.</Text>
              <Text style={[s.emptyText, { fontSize: 12, marginTop: 4 }]}>Complete jobs to start receiving customer feedback.</Text>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {data!.recentReviews.map((rev, i) => (
                <View key={i} style={s.reviewCard}>
                  {/* Avatar + Name row */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <View style={s.avatar}>
                      <Text style={s.avatarLetter}>{rev.customerName.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={s.reviewName}>{rev.customerName}</Text>
                      <Text style={s.reviewDate}>
                        {new Date(rev.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </Text>
                    </View>
                    <Stars rating={rev.rating} size={14} />
                  </View>
                  {!!rev.comment && (
                    <Text style={s.reviewComment}>{rev.comment}</Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:       { flex: 1, backgroundColor: T.bg },
  loadingWrap:{ flex: 1, alignItems: 'center', justifyContent: 'center' },

  header:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: T.surface, borderBottomWidth: 1, borderBottomColor: T.border },
  backBtn:    { width: 40, height: 40, borderRadius: 20, backgroundColor: T.primaryLight, alignItems: 'center', justifyContent: 'center' },
  headerTitle:{ fontSize: 20, fontWeight: '800', color: T.text },
  headerSub:  { fontSize: 12, color: T.textMuted, marginTop: 1 },

  heroCard:   { marginHorizontal: 16, backgroundColor: T.primary, borderRadius: 20, padding: 22, flexDirection: 'row', alignItems: 'center' },
  heroLabel:  { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  heroRating: { fontSize: 52, fontWeight: '900', color: '#FFF', lineHeight: 60 },
  heroSub:    { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4 },
  heroDivV:   { width: 1, height: '80%', backgroundColor: 'rgba(255,255,255,0.12)' },
  miniIconBox:{ width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  miniVal:    { fontSize: 15, fontWeight: '800', color: '#FFF' },
  miniLbl:    { fontSize: 10, color: 'rgba(255,255,255,0.55)', marginTop: 1 },

  banner:     { marginHorizontal: 16, marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  bannerIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  bannerTitle:{ fontSize: 14, fontWeight: '700' },
  bannerSub:  { fontSize: 12, marginTop: 2 },

  statsGrid:  { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: 12, marginTop: 14, gap: 10 },
  statCard:   { flex: 1, minWidth: '44%', backgroundColor: T.surface, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: T.border },
  statIcon:   { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statVal:    { fontSize: 24, fontWeight: '900' },
  statLbl:    { fontSize: 11, color: T.textMuted, marginTop: 2 },

  card:       { marginHorizontal: 16, marginTop: 16, backgroundColor: T.surface, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: T.border },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  cardIconBox:{ width: 34, height: 34, borderRadius: 10, backgroundColor: T.primaryLight, alignItems: 'center', justifyContent: 'center' },
  cardTitle:  { fontSize: 16, fontWeight: '800', color: T.text, flex: 1 },
  countBadge: { backgroundColor: T.primary, borderRadius: 100, paddingHorizontal: 8, paddingVertical: 2 },
  countBadgeTxt:{ fontSize: 11, fontWeight: '700', color: '#FFF' },

  emptyBox:   { alignItems: 'center', paddingVertical: 28, gap: 6 },
  emptyText:  { color: T.textMuted, fontSize: 13, textAlign: 'center' },

  reviewCard: { backgroundColor: T.bg, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: T.border },
  avatar:     { width: 38, height: 38, borderRadius: 19, backgroundColor: T.primary, alignItems: 'center', justifyContent: 'center' },
  avatarLetter:{ fontSize: 16, fontWeight: '800', color: '#FFF' },
  reviewName: { fontSize: 14, fontWeight: '700', color: T.text },
  reviewDate: { fontSize: 11, color: T.textMuted, marginTop: 1 },
  reviewComment:{ fontSize: 13, color: T.textMuted, lineHeight: 20 },
});