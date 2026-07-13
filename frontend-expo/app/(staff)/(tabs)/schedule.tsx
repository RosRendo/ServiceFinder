/**
 * Staff Schedule — Timeline Redesign
 * Vertical timeline, skeleton loaders, animated empty state
 */
import React, { useState, useEffect, useRef } from "react";
import { Image } from "expo-image";
import {
  ScrollView, Text, View, TouchableOpacity,
  StyleSheet, Platform, Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { api } from "@/store/authStore";
import { ScheduleCalendar } from "@/components/schedule/ScheduleCalendar";
import { useStaffAvailability } from "@/hooks/useStaffAvailability";
import { useSidebarStore } from "@/store/sidebarStore";
import { useTranslation } from "react-i18next";
import { Theme } from "@/constants/theme";

const T = {
  bg: Theme.colors.bg,
  surface: Theme.colors.surface,
  border: Theme.colors.border,
  primary: Theme.colors.primary,
  primaryLight: Theme.colors.primaryLight,
  primaryMid: Theme.colors.primaryMid,
  text: Theme.colors.text,
  textMuted: Theme.colors.textMuted,
  success: Theme.colors.success,
  successBg: Theme.colors.successBg,
  warning: Theme.colors.warning,
  warningBg: Theme.colors.warningBg,
  error: Theme.colors.error,
  errorBg: Theme.colors.errorBg,
};

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  android: { elevation: 2 },
});

function SkeletonBone({ width, height, radius = 8, style }: { width: number | string; height: number; radius?: number; style?: any }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });
  return <Animated.View style={[{ width, height, borderRadius: radius, backgroundColor: '#CBD5E1', opacity }, style]} />;
}

function AnimatedCalendarEmpty() {
  const sparkle = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: -6, duration: 1000, useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(sparkle, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(sparkle, { toValue: 0.2, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={{ alignItems: 'center', transform: [{ translateY: float }] }}>
      {/* Calendar icon block */}
      <View style={{ width: 88, height: 88, borderRadius: 24, backgroundColor: T.primaryLight, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: T.border, marginBottom: 8 }}>
        <MaterialCommunityIcons name="calendar-check" size={48} color={T.primary} />
      </View>
      {/* Sparkle dots */}
      <Animated.View style={{ position: 'absolute', top: -4, right: 0, opacity: sparkle }}>
        <MaterialCommunityIcons name="star-four-points" size={14} color="#F59E0B" />
      </Animated.View>
      <Animated.View style={{ position: 'absolute', top: 12, left: -8, opacity: sparkle }}>
        <MaterialCommunityIcons name="star-four-points" size={10} color="#34D399" />
      </Animated.View>
    </Animated.View>
  );
}

function getStatusConfig(status: string) {
  switch (status) {
    case 'confirmed':    return { color: '#2563EB', bg: '#DBEAFE', dot: '#2563EB' };
    case 'in_progress':  return { color: T.success, bg: T.successBg, dot: T.success };
    case 'pending':      return { color: T.warning, bg: T.warningBg, dot: T.warning };
    case 'completed':    return { color: '#6B7280', bg: '#F3F4F6', dot: '#6B7280' };
    default:             return { color: T.textMuted, bg: T.bg, dot: T.border };
  }
}

export default function ScheduleScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const setStaffOpen = useSidebarStore((s) => s.setStaffOpen);

  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  const [bookings, setBookings] = useState<any[]>([]);
  const [isBookingsLoading, setIsBookingsLoading] = useState(true);

  const { availability, isLoading: isAvailLoading, fetchAvailability } = useStaffAvailability();

  useEffect(() => { fetchAvailability(); }, [fetchAvailability]);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setIsBookingsLoading(true);
        const res = await api.get('/api/bookings/my-assignments', { params: { limit: 100 } });
        setBookings(res.data?.bookings || res.data?.data?.bookings || res.data || []);
      } catch (e) {
        console.error("Failed to fetch schedule", e);
      } finally {
        setIsBookingsLoading(false);
      }
    };
    fetchBookings();
  }, []);

  const jobs = bookings.filter(b => {
    const dateObj = new Date(b.bookingDate);
    const d = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
    return d === selectedDate;
  }).map(b => {
    let timeString = t('staffSchedule.timeTbd');
    if (b.startTime && b.endTime) {
      const start = new Date(b.startTime);
      const end = new Date(b.endTime);
      timeString = isNaN(start.getTime())
        ? `${b.startTime} – ${b.endTime}`
        : `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return {
      id: b.id,
      time: timeString,
      title: b.service?.name || t('staffSchedule.serviceTask'),
      status: b.status,
      location: b.serviceAddress,
      client: { name: b.customer?.fullName || t('staffSchedule.unknown') },
    };
  });

  const selectedDateFormatted = new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  return (
    <>
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      {/* ── Header ─────────────────────────────────────────── */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <TouchableOpacity onPress={() => setStaffOpen(true)} style={s.menuBtn}>
            <MaterialCommunityIcons name="menu" size={26} color={T.primary} />
          </TouchableOpacity>
          <View>
            <Text style={s.headerTitle}>{t('staffSchedule.schedule')}</Text>
            <Text style={s.headerSub}>{selectedDateFormatted}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={s.manageBtn}
          onPress={() => router.push("/(staff)/timeoff" as any)}
        >
          <MaterialCommunityIcons name="calendar-edit" size={16} color={T.primary} />
          <Text style={s.manageBtnText}>{t('staffSchedule.manage')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        {/* Calendar */}
        <View style={s.calendarWrapper}>
          <ScheduleCalendar
            slots={availability}
            isLoading={isAvailLoading}
            onDateSelect={(date) => setSelectedDate(date)}
          />
        </View>

        {/* ── Daily Agenda ────────────────────────────────── */}
        <View style={s.agendaSection}>
          <View style={s.agendaHeader}>
            <Text style={s.agendaTitle}>Today's Agenda</Text>
            <View style={s.agendaCountBadge}>
              <Text style={s.agendaCountText}>{jobs.length} jobs</Text>
            </View>
          </View>

          {isBookingsLoading ? (
            <View style={{ gap: 16 }}>
              {[...Array(3)].map((_, i) => (
                <View key={i} style={s.timelineRow}>
                  <View style={s.timelineLeft}>
                    <SkeletonBone width={40} height={12} radius={6} />
                    <View style={s.timelineLine} />
                  </View>
                  <View style={[s.jobCard, { flex: 1, gap: 10 }]}>
                    <SkeletonBone width="70%" height={14} />
                    <SkeletonBone width="50%" height={11} />
                    <SkeletonBone width="90%" height={11} />
                  </View>
                </View>
              ))}
            </View>
          ) : jobs.length === 0 ? (
            <View style={s.emptyState}>
              <AnimatedCalendarEmpty />
              <Text style={s.emptyTitle}>All clear today!</Text>
              <Text style={s.emptySubtitle}>No bookings scheduled for this date. Enjoy your free time ✨</Text>
            </View>
          ) : (
            /* ── Timeline List ─── */
            jobs.map((job, index) => {
              const sc = getStatusConfig(job.status);
              const isLast = index === jobs.length - 1;
              return (
                <TouchableOpacity
                  key={job.id}
                  onPress={() => router.push(`/(staff)/job/${job.id}` as any)}
                  activeOpacity={0.8}
                >
                  <View style={s.timelineRow}>
                    {/* Left: time + line */}
                    <View style={s.timelineLeft}>
                      <Text style={s.timelineTime}>{job.time.split('–')[0]?.trim()}</Text>
                      <View style={[s.timelineDot, { backgroundColor: sc.dot }]} />
                      {!isLast && <View style={s.timelineLine} />}
                    </View>

                    {/* Right: card */}
                    <View style={[s.jobCard, { borderLeftWidth: 3, borderLeftColor: sc.dot }]}>
                      <View style={s.jobCardTop}>
                        <Text style={s.jobTitle} numberOfLines={1}>{job.title}</Text>
                        <View style={[s.statusBadge, { backgroundColor: sc.bg }]}>
                          <Text style={[s.statusText, { color: sc.color }]}>{job.status}</Text>
                        </View>
                      </View>

                      {job.location && (
                        <View style={s.jobLocation}>
                          <MaterialCommunityIcons name="map-marker-outline" size={14} color={T.textMuted} />
                          <Text style={s.locationText} numberOfLines={1}>{job.location}</Text>
                        </View>
                      )}

                      <View style={s.clientFooter}>
                        <View style={s.clientAvatarCircle}>
                          <Text style={s.clientAvatarText}>{(job.client?.name?.[0] || 'C').toUpperCase()}</Text>
                        </View>
                        <Text style={s.clientName}>{job.client.name}</Text>
                        <MaterialCommunityIcons name="chevron-right" size={18} color={T.textMuted} />
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
    </>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  scrollContent: { paddingBottom: 120 },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 16, backgroundColor: T.surface,
    borderBottomWidth: 1, borderBottomColor: T.border,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  menuBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: T.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: "800", color: T.text, letterSpacing: -0.3 },
  headerSub: { fontSize: 12, fontWeight: "500", color: T.textMuted, marginTop: 1 },

  manageBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: T.primaryLight, paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 20, borderWidth: 1, borderColor: T.border,
  },
  manageBtnText: { fontSize: 13, fontWeight: '700', color: T.primary },

  calendarWrapper: { padding: 20 },

  agendaSection: { paddingHorizontal: 20, gap: 0 },
  agendaHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginBottom: 20,
  },
  agendaTitle: { fontSize: 18, fontWeight: "800", color: T.text },
  agendaCountBadge: {
    backgroundColor: T.primaryLight, paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 16,
  },
  agendaCountText: { fontSize: 12, fontWeight: '700', color: T.primary },

  // ── Timeline ───────────────────────────────────────────
  timelineRow: { flexDirection: 'row', gap: 16, marginBottom: 0 },
  timelineLeft: { width: 52, alignItems: 'center', paddingTop: 4 },
  timelineTime: { fontSize: 11, fontWeight: '700', color: T.textMuted, marginBottom: 8, textAlign: 'center' },
  timelineDot: { width: 12, height: 12, borderRadius: 6, marginBottom: 0 },
  timelineLine: { flex: 1, width: 2, backgroundColor: T.border, marginTop: 4, minHeight: 24 },

  // ── Job Card ───────────────────────────────────────────
  jobCard: {
    flex: 1, backgroundColor: T.surface, borderRadius: 16,
    padding: 16, marginBottom: 20, borderWidth: 1, borderColor: T.border,
    ...CARD_SHADOW,
  },
  jobCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  jobTitle: { fontSize: 15, fontWeight: '800', color: T.text, flex: 1, marginRight: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, alignSelf: 'flex-start' },
  statusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },

  jobLocation: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  locationText: { fontSize: 12, color: T.textMuted, flex: 1 },

  clientFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: T.border },
  clientAvatarCircle: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: T.primary, alignItems: 'center', justifyContent: 'center',
  },
  clientAvatarText: { fontSize: 12, fontWeight: '800', color: '#fff' },
  clientName: { flex: 1, fontSize: 13, fontWeight: '700', color: T.text },

  // ── Empty State ─────────────────────────────────────────
  emptyState: {
    alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24,
    backgroundColor: T.surface, borderRadius: 24, borderWidth: 1, borderColor: T.border,
    ...CARD_SHADOW,
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: T.text, marginTop: 24, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: T.textMuted, textAlign: 'center', lineHeight: 22 },
});
