/**
 * My Activity Screen — Premium Redesign (Ticket Style)
 */
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  ScrollView, Text, View, TouchableOpacity,
  Alert, RefreshControl, StyleSheet,
  Animated, Pressable, Platform, Easing
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { api } from "@/store/authStore";
import { useTranslation } from "react-i18next";
import { Theme } from "@/constants/theme";

// ─── Design Tokens ───────────────────────────────────────────
const T = Theme.colors;

const TICKET_SHADOW = Platform.select({
  ios: { shadowColor: '#0A192F', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 20 },
  android: { elevation: 8 },
});

// ─── Types ───────────────────────────────────────────────────
type BookingStatus = "pending" | "confirmed" | "in_progress" | "completed" | "cancelled" | "rejected";

interface Booking {
  id: string;
  status: BookingStatus;
  scheduledAt: string;
  bookingDate: string;
  startTime: string;
  totalPrice?: number;
  notes?: string;
  service?: { id: string; name: string; image?: string; durationMin?: number; serviceType?: any };
  company?: { id: string; name: string; logoUrl?: string };
}

// ─── Helpers ─────────────────────────────────────────────────
const extractArray = (data: any): any[] => {
  if (Array.isArray(data)) return data;
  const inner = data?.data;
  if (inner) {
    if (Array.isArray(inner)) return inner;
    if (Array.isArray(inner.data)) return inner.data;
    if (Array.isArray(inner.bookings)) return inner.bookings;
    if (Array.isArray(inner.items)) return inner.items;
  }
  return [];
};

const formatDate = (iso: string, t: any) => {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return "Today";
  const tomorrow = new Date(); tomorrow.setDate(now.getDate() + 1);
  if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
};

const formatTime = (t: string) => {
  if (!t) return "";
  if (t.includes('T')) {
    const d = new Date(t);
    let h = d.getUTCHours();
    const m = d.getUTCMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m.toString().padStart(2, '0')} ${ampm}`;
  }
  return t;
};

const getStatusConfig = (status: BookingStatus) => {
  switch (status) {
    case "pending":    return { color: T.pending,    bg: T.pendingBg,    icon: "clock-outline",        label: "Pending" };
    case "confirmed":  return { color: T.confirmed,  bg: T.confirmedBg,  icon: "check-circle-outline", label: "Confirmed" };
    case "in_progress":return { color: T.inprogress, bg: T.inprogressBg, icon: "progress-wrench",      label: "In Progress" };
    case "completed":  return { color: T.completed,  bg: T.completedBg,  icon: "check-decagram",       label: "Completed" };
    case "cancelled":  return { color: T.cancelled,  bg: T.cancelledBg,  icon: "close-circle-outline", label: "Cancelled" };
    case "rejected":   return { color: T.cancelled,  bg: T.cancelledBg,  icon: "close-circle-outline", label: "Rejected" };
    default:           return { color: T.text3,      bg: T.accentLight,  icon: "help-circle-outline",  label: status };
  }
};

// ─── Skeleton Card ───────────────────────────────────────────
function SkeletonCard({ index }: { index: number }) {
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
  const Bone = ({ w, h, r = 8, mb = 0 }: { w: number | string; h: number; r?: number; mb?: number }) => (
    <Animated.View style={{ width: w, height: h, borderRadius: r, backgroundColor: "#CBD5E1", opacity, marginBottom: mb } as any} />
  );
  return (
    <View style={[s.bookingCard, { borderWidth: 1, borderColor: T.border }]}>
      <View style={s.cardTop}>
        <Bone w={72} h={72} r={16} />
        <View style={{ flex: 1, gap: 12 }}>
          <Bone w="70%" h={16} r={6} />
          <Bone w="40%" h={12} r={4} />
          <Bone w="30%" h={22} r={11} />
        </View>
      </View>
      <View style={s.cardDivider} />
      <View style={s.cardBottom}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View>
            <Bone w={100} h={14} r={4} mb={8} />
            <Bone w={80} h={18} r={4} />
          </View>
          <Bone w={80} h={36} r={18} />
        </View>
      </View>
    </View>
  );
}

// ─── Booking Card (Clean Style) ──────────────────────────────
function BookingCard({ booking, onCancel, index }: { booking: Booking; onCancel: (id: string) => void; index: number }) {
  const router = useRouter();
  
  // Staggered Entrance Animation
  const enterAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(enterAnim, {
      toValue: 1, tension: 60, friction: 9,
      useNativeDriver: true, delay: index * 60,
    }).start();
  }, []);
  const translateY = enterAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] });
  const opacity = enterAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  // Press Animation
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.timing(scale, { toValue: 0.97, duration: 100, useNativeDriver: true }).start();
  const pressOut = () => Animated.timing(scale, { toValue: 1, duration: 150, useNativeDriver: true }).start();

  const cfg = getStatusConfig(booking.status);
  const heroImg =
    booking.service?.image || (booking.service as any)?.serviceType?.imageUrl || (booking.service as any)?.serviceType?.category?.imageUrl ||
    booking.company?.logoUrl;

  return (
    <Animated.View style={{ transform: [{ translateY }, { scale }], opacity }}>
      <Pressable 
        onPressIn={pressIn} 
        onPressOut={pressOut}
        onPress={() => router.push(`/(customer)/booking/${booking.id}` as any)}
      >
        <View style={[s.bookingCard, { borderWidth: 1, borderColor: T.border }]}>
          
          {/* TOP HALF: Service Info */}
          <View style={s.cardTop}>
            <View style={s.cardImgBox}>
              {heroImg ? (
                <Image source={{ uri: heroImg }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
              ) : (
                <View style={[StyleSheet.absoluteFillObject, { alignItems: "center", justifyContent: "center", backgroundColor: T.accentLight }]}>
                  <MaterialCommunityIcons name="toolbox-outline" size={28} color={T.accentMid} />
                </View>
              )}
            </View>

            <View style={{ flex: 1, justifyContent: "space-between" }}>
              <View>
                <Text style={s.cardTitle} numberOfLines={1}>
                  {booking.service?.name || "Service Booking"}
                </Text>
                <Text style={s.cardProvider} numberOfLines={1}>
                  by {booking.company?.name || "Service Provider"}
                </Text>
              </View>

              <View style={{ alignSelf: "flex-start" }}>
                <View style={[s.statusBadge, { backgroundColor: cfg.bg }]}>
                  <MaterialCommunityIcons name={cfg.icon as any} size={12} color={cfg.color} />
                  <Text style={[s.statusBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* DIVIDER: Clean Line */}
          <View style={s.cardDivider} />

          {/* BOTTOM HALF: Time & Actions */}
          <View style={s.cardBottom}>
            <View style={s.cardBottomRow}>
              
              {/* Date & Time */}
              <View style={s.dateTimeBox}>
                <View style={s.dateTimeRow}>
                  <MaterialCommunityIcons name="calendar-month-outline" size={16} color={T.text3} />
                  <Text style={s.dateText}>{formatDate(booking.bookingDate || booking.scheduledAt, null)}</Text>
                </View>
                <View style={[s.dateTimeRow, { marginTop: 4 }]}>
                  <MaterialCommunityIcons name="clock-outline" size={16} color={T.text3} />
                  <Text style={s.timeText}>
                    {formatTime(booking.startTime || booking.scheduledAt)}
                    {booking.service?.durationMin ? ` · ${booking.service.durationMin} mins` : ''}
                  </Text>
                </View>
              </View>

              {/* Price & Action */}
              <View style={s.priceActionBox}>
                <Text style={s.priceText}>
                  {booking.totalPrice ? `$${Number(booking.totalPrice).toFixed(2)}` : "—"}
                </Text>
                
                {booking.status?.toLowerCase() === "pending" && (
                  <TouchableOpacity onPress={(e) => { e.stopPropagation(); onCancel(booking.id); }} style={s.actionBtnOutline} hitSlop={10}>
                    <Text style={s.actionBtnOutlineText}>Cancel</Text>
                  </TouchableOpacity>
                )}
                {booking.status?.toLowerCase() === "confirmed" && (
                  <TouchableOpacity style={s.actionBtnPrimary} hitSlop={10} onPress={(e) => { e.stopPropagation(); router.push(`/(customer)/booking/${booking.id}` as any); }}>
                    <Text style={s.actionBtnPrimaryText}>Details</Text>
                  </TouchableOpacity>
                )}
                {booking.status?.toLowerCase() === "in_progress" && (
                  <TouchableOpacity style={[s.actionBtnPrimary, { backgroundColor: T.inprogress }]} hitSlop={10} onPress={(e) => { e.stopPropagation(); router.push(`/(customer)/booking/${booking.id}` as any); }}>
                    <Text style={s.actionBtnPrimaryText}>Track Staff</Text>
                  </TouchableOpacity>
                )}
                {booking.status?.toLowerCase() === "completed" && (
                  <TouchableOpacity 
                    style={[s.actionBtnPrimary, { backgroundColor: T.confirmed }]} 
                    hitSlop={10}
                    onPress={(e) => { e.stopPropagation(); router.push(`/(customer)/booking/${booking.id}` as any); }}
                  >
                    <Text style={s.actionBtnPrimaryText}>Leave Review</Text>
                  </TouchableOpacity>
                )}
                {(booking.status?.toLowerCase() === "cancelled" || booking.status?.toLowerCase() === "rejected") && (
                  <TouchableOpacity style={[s.actionBtnPrimary, { backgroundColor: T.accentMid }]} hitSlop={10} onPress={(e) => { e.stopPropagation(); router.push(`/(customer)/booking/${booking.id}` as any); }}>
                    <Text style={s.actionBtnPrimaryText}>Rebook</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
          
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ─── Animated Empty Icon ─────────────────────────────────────
function AnimatedEmptyIcon({ activeTab }: { activeTab: string }) {
  const floatAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -12, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={[s.emptyIconBox, { transform: [{ translateY: floatAnim }] }]}>
      <MaterialCommunityIcons
        name={activeTab === "upcoming" ? "calendar-blank" : activeTab === "past" ? "calendar-check-outline" : "calendar-remove-outline"}
        size={56}
        color="#FFFFFF"
      />
    </Animated.View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────
export default function ActivityScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"upcoming" | "past" | "cancelled">("upcoming");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadBookings = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/api/bookings");
      const all: Booking[] = extractArray(res.data);
      const filtered = all.filter((b) => {
        if (activeTab === "upcoming") return ["pending", "confirmed", "in_progress"].includes(b.status);
        if (activeTab === "past") return b.status === "completed";
        return ["cancelled", "rejected"].includes(b.status);
      });
      setBookings(filtered);
    } catch (e: any) {
      console.error("[Activity] load error:", e?.message);
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { loadBookings(); }, [loadBookings]);

  const handleCancel = (id: string) => {
    Alert.alert("Cancel Booking", "Are you sure you want to cancel this booking?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, Cancel", style: "destructive",
        onPress: async () => {
          try {
            await api.patch(`/api/bookings/${id}/cancel`, { reason: "Cancelled by Customer" });
            loadBookings();
          } catch (e: any) {
            Alert.alert("Error", e?.response?.data?.message || "Could not cancel booking.");
          }
        },
      },
    ]);
  };

  const TABS = [
    { key: "upcoming" as const, label: "Upcoming" },
    { key: "past" as const,     label: "Completed" },
    { key: "cancelled" as const,label: "Cancelled" },
  ];

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      {/* ── HEADER ────────────────────────────────────────────── */}
      <View style={s.header}>
        <View>
          <Text style={s.headerEyebrow}>Your History & Schedule</Text>
          <Text style={s.headerTitle}>My Activity</Text>
        </View>
        <TouchableOpacity onPress={loadBookings} style={s.refreshBtn}>
          <Ionicons name="reload" size={18} color={T.text1} />
        </TouchableOpacity>
      </View>

      {/* ── SLEEK TABS ────────────────────────────────────────── */}
      <View style={s.tabsWrapper}>
        <View style={s.tabsContainer}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[s.tabBtn, isActive && s.tabBtnActive]}
                activeOpacity={0.8}
              >
                <Text style={[s.tabText, isActive && s.tabTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── CONTENT ───────────────────────────────────────────── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadBookings} tintColor={T.accent} colors={[T.accent]} />
        }
      >
        {isLoading ? (
          <View style={{ gap: 20 }}>
            {[...Array(3)].map((_, i) => <SkeletonCard key={i} index={i} />)}
          </View>
        ) : bookings.length === 0 ? (
          /* Empty State */
          <Animated.View style={s.emptyState}>
              <AnimatedEmptyIcon activeTab={activeTab} />
            <Text style={s.emptyTitle}>
              {activeTab === "upcoming" ? "No Active Services" :
               activeTab === "past" ? "No Completed Services" : "No Cancelled Services"}
            </Text>
            <Text style={s.emptyBody}>
              {activeTab === "upcoming"
                ? "You don't have any bookings active at the moment."
                : "Your historical services will display here."}
            </Text>
            {activeTab === "upcoming" && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => router.push("/(customer)/(tabs)/home" as any)}
                style={s.emptyBtn}
              >
                <Text style={s.emptyBtnText}>Explore Services</Text>
                <MaterialCommunityIcons name="arrow-right" size={18} color="#fff" />
              </TouchableOpacity>
            )}
          </Animated.View>
        ) : (
          <View style={{ gap: 20 }}>
            {bookings.map((b, i) => <BookingCard key={b.id} booking={b} index={i} onCancel={handleCancel} />)}
          </View>
        )}

        {/* ── SUPPORT BANNER ─────────────────────────────────── */}
        {!isLoading && bookings.length > 0 && (
          <View style={s.supportBanner}>
            <View style={s.supportContent}>
              <View style={s.supportIconWrap}>
                <Ionicons name="chatbubbles" size={24} color={T.accentMid} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.supportTitle}>Need assistance?</Text>
                <Text style={s.supportBody}>Chat directly with support agents 24/7</Text>
              </View>
              <TouchableOpacity style={s.supportBtn}>
                <Text style={s.supportBtnText}>Chat</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  scrollContent: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 64 },

  header: {
    flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between",
    paddingHorizontal: 24, paddingTop: 16, paddingBottom: 20,
  },
  headerEyebrow: { fontSize: 13, fontWeight: "700", color: T.text3, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 4 },
  headerTitle: { fontSize: 32, fontWeight: "800", color: T.text1, letterSpacing: -0.8 },
  refreshBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: T.surface,
    alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: T.border,
  },

  // Sleek Tabs
  tabsWrapper: { paddingHorizontal: 24, paddingBottom: 20 },
  tabsContainer: {
    flexDirection: "row", backgroundColor: "#F2F2F7", borderRadius: 12, padding: 4,
  },
  tabBtn: {
    flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 8,
  },
  tabBtnActive: { backgroundColor: T.surface},
  tabText: { fontSize: 14, fontWeight: "600", color: T.text2 },
  tabTextActive: { color: T.accent, fontWeight: "800" },

  bookingCard: {
    backgroundColor: T.surface, borderRadius: 20, overflow: "hidden", padding: 16,
    ...TICKET_SHADOW,
  },
  cardTop: { flexDirection: "row", gap: 16 },
  cardImgBox: {
    width: 80, height: 80, borderRadius: 16, backgroundColor: T.accentLight, overflow: "hidden",
  },
  cardTitle: { fontSize: 17, fontWeight: "800", color: T.text1, marginBottom: 4, letterSpacing: -0.3 },
  cardProvider: { fontSize: 13, fontWeight: "600", color: T.text3, marginBottom: 10 },
  
  statusBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12,
  },
  statusBadgeText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.3, textTransform: "uppercase" },

  // Clean Line Divider
  cardDivider: {
    height: 1, backgroundColor: T.border, marginVertical: 16,
  },

  cardBottom: { paddingTop: 0 },
  cardBottomRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  dateTimeBox: { flex: 1, gap: 6 },
  dateTimeRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  dateText: { fontSize: 13, fontWeight: "700", color: T.text1 },
  timeText: { fontSize: 13, fontWeight: "600", color: T.text2 },
  
  priceActionBox: { alignItems: "flex-end", gap: 12 },
  priceText: { fontSize: 20, fontWeight: "900", color: T.text1, letterSpacing: -0.5 },
  actionBtnOutline: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 14,
    borderWidth: 1.5, borderColor: T.border,
  },
  actionBtnOutlineText: { fontSize: 13, fontWeight: "700", color: T.text2 },
  actionBtnPrimary: {
    paddingHorizontal: 18, paddingVertical: 8, borderRadius: 14, backgroundColor: T.accent,
  },
  actionBtnPrimaryText: { fontSize: 13, fontWeight: "800", color: "#fff" },

  // Empty State
  emptyState: { alignItems: "center", paddingTop: 60, paddingHorizontal: 20 },
  emptyIconBox: {
    width: 110, height: 110, borderRadius: 55, backgroundColor: T.accent,
    alignItems: "center", justifyContent: "center", marginBottom: 24,
  },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: T.text1, marginBottom: 12 },
  emptyBody: { fontSize: 15, color: T.text2, textAlign: "center", lineHeight: 24, fontWeight: "500", marginBottom: 32 },
  emptyBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: T.accent, borderRadius: 16, paddingHorizontal: 24, paddingVertical: 16,
  },
  emptyBtnText: { fontSize: 16, fontWeight: "800", color: "#fff" },

  // Support Banner
  supportBanner: {
    marginTop: 32, backgroundColor: "#fff", borderRadius: 24, padding: 2,
    borderWidth: 1, borderColor: T.border,
  },
  supportContent: {
    flexDirection: "row", alignItems: "center", padding: 16, gap: 16,
    backgroundColor: T.accentLight, borderRadius: 22,
  },
  supportIconWrap: {
    width: 48, height: 48, borderRadius: 16, backgroundColor: "#fff",
    alignItems: "center", justifyContent: "center",
  },
  supportTitle: { fontSize: 15, fontWeight: "800", color: T.text1, marginBottom: 2 },
  supportBody: { fontSize: 13, color: T.text2, fontWeight: "500" },
  supportBtn: {
    backgroundColor: "#fff", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: T.border,
  },
  supportBtnText: { fontSize: 13, fontWeight: "800", color: T.accent },
});
