import React, { useEffect, useState } from "react";
import { Image } from "expo-image";
import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator, Dimensions, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { api } from "@/store/authStore";
import Animated, { FadeInDown, ZoomIn, FadeInUp, withRepeat, withTiming, useSharedValue, useAnimatedStyle } from "react-native-reanimated";

interface ConfirmationData {
  id: string;
  status: string;
  totalPrice: number;
  bookingDate: string;
  startTime: string;
  serviceAddress: string;
  service?: { name: string; image?: string };
  company?: { name: string; logoUrl?: string };
  assignedStaff?: { user?: { fullName?: string; name?: string } };
}

const { width } = Dimensions.get('window');

export default function BookingConfirmationScreen() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();

  const [booking, setBooking] = useState<ConfirmationData | null>(null);
  const [loading, setLoading] = useState(!!bookingId);

  // Pulsing glow animation
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1.3, { duration: 1500 }), -1, true);
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: 1 - (pulse.value - 1) * 2
  }));

  useEffect(() => {
    if (!bookingId) return;
    const load = async () => {
      try {
        const res = await api.get(`/api/bookings/${bookingId}`);
        const raw = res.data;
        const d = raw?.data?.booking || raw?.data?.data || raw?.data || raw;
        setBooking(d);
      } catch (e) {
        console.error("Failed to load booking", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [bookingId]);

  const formatSchedule = () => {
    if (!booking) return "—";
    try {
      const date = new Date(booking.bookingDate);
      const timePart = booking.startTime?.split("T")[1]?.slice(0, 5) || "—";
      return (
        date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }) +
        " · " + timePart
      );
    } catch { return "—"; }
  };

  const refId = booking ? `#BK-${booking.id.toString().padStart(6, "0")}` : bookingId ? `#BK-${bookingId.padStart(6, "0")}` : "#BK-??????";
  const serviceName = booking?.service?.name ?? "Your Service";
  const companyName = booking?.company?.name;
  const heroImg = booking?.service?.image || booking?.company?.logoUrl ||
    "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop";
  const totalAmount = booking ? `$${Number(booking.totalPrice).toFixed(2)}` : "—";
  const staffName = booking?.assignedStaff?.user?.fullName || booking?.assignedStaff?.user?.name || null;
  const address = booking?.serviceAddress ?? "—";

  if (loading) {
    return (
      <View style={[s.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#00D47E" />
        <Text style={s.loadingText}>Finalizing Booking...</Text>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <SafeAreaView style={s.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
          
          {/* Header */}
          <View style={s.headerRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push("/(customer)/(tabs)/home")}
              style={s.headerCloseBtn}
            >
              <MaterialCommunityIcons name="close" size={20} color="#0A2540" />
            </TouchableOpacity>
            <View style={s.headerTitleWrap}>
              <Text style={s.headerTitle}>E-Receipt</Text>
            </View>
          </View>

          {/* Epic Success Visual */}
          <View style={s.successBox}>
            <View style={s.iconWrap}>
              <Animated.View style={[pulseStyle, s.pulseGlow]} />
              <Animated.View entering={ZoomIn.duration(800).springify()} style={s.iconCircle}>
                <MaterialCommunityIcons name="check-bold" size={44} color="white" />
              </Animated.View>
            </View>
            <Animated.Text entering={FadeInUp.delay(300).duration(600)} style={s.successTitle}>
              Booking Confirmed
            </Animated.Text>
            <Animated.Text entering={FadeInUp.delay(400).duration(600)} style={s.successSubtitle}>
              Your service has been successfully scheduled. We've sent a copy to your email.
            </Animated.Text>
          </View>

          {/* Premium Ticket Layout */}
          <Animated.View entering={FadeInDown.delay(500).duration(800)} style={s.ticketWrap}>
            
            {/* Top Half of Ticket */}
            <View style={s.ticketTop}>
              <View style={s.heroBox}>
                <Image source={{ uri: heroImg }} style={s.heroImg} contentFit="cover" />
                <View style={s.heroOverlay} />
                <View style={s.heroTextWrap}>
                  <Text style={s.heroTitle}>{serviceName}</Text>
                  {companyName && (
                    <Text style={s.heroCompany}>{companyName}</Text>
                  )}
                </View>
              </View>

              <View style={s.ticketSummary}>
                <View>
                  <Text style={s.ticketLabel}>Booking Ref</Text>
                  <Text style={s.ticketValue}>{refId}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={s.ticketLabel}>Total Paid</Text>
                  <Text style={s.ticketAmount}>{totalAmount}</Text>
                </View>
              </View>
            </View>

            {/* Ticket Divider with Cutouts */}
            <View style={s.dividerRow}>
              <View style={s.cutoutLeft} />
              <View style={s.dashLine} />
              <View style={s.cutoutRight} />
            </View>

            {/* Bottom Half of Ticket */}
            <View style={s.ticketBottom}>
              <Animated.View entering={FadeInDown.delay(700).duration(500)} style={s.detailRow}>
                <View style={s.detailIcon}>
                  <Ionicons name="calendar" size={20} color="#00D47E" />
                </View>
                <View style={s.detailTextCol}>
                  <Text style={s.ticketLabel}>Date & Time</Text>
                  <Text style={s.detailValue}>{formatSchedule()}</Text>
                </View>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(800).duration(500)} style={s.detailRow}>
                <View style={s.detailIcon}>
                  <Ionicons name="location" size={20} color="#00D47E" />
                </View>
                <View style={s.detailTextCol}>
                  <Text style={s.ticketLabel}>Service Location</Text>
                  <Text style={s.detailValue}>{address}</Text>
                </View>
              </Animated.View>

              {staffName && (
                <Animated.View entering={FadeInDown.delay(900).duration(500)} style={s.detailRow}>
                  <View style={s.detailIcon}>
                    <Ionicons name="person" size={18} color="#00D47E" />
                  </View>
                  <View style={s.detailTextCol}>
                    <Text style={s.ticketLabel}>Assigned Professional</Text>
                    <Text style={s.detailValue}>{staffName}</Text>
                  </View>
                </Animated.View>
              )}
            </View>
          </Animated.View>

          {/* Bottom Action Buttons */}
          <Animated.View entering={FadeInUp.delay(1000).duration(600)} style={s.actionsWrap}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => bookingId && router.push(`/(customer)/booking/${bookingId}` as any)}
              style={s.btnTrack}
            >
              <Text style={s.btnTrackText}>Track My Booking</Text>
              <MaterialCommunityIcons name="arrow-right" size={20} color="white" style={{ marginLeft: 8 }} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.6}
              onPress={() => router.push("/(customer)/(tabs)/home")}
              style={s.btnBack}
            >
              <Text style={s.btnBackText}>Back to Dashboard</Text>
            </TouchableOpacity>
          </Animated.View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFF" },
  safeArea: { flex: 1 },
  scrollContent: { paddingBottom: 60, paddingTop: 10 },
  loadingText: { color: "#6B7280", marginTop: 16, fontWeight: "500", letterSpacing: 1, textTransform: "uppercase", fontSize: 12 },

  headerRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 24, marginBottom: 8 },
  headerCloseBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#F3F4F6"},
  headerTitleWrap: { flex: 1, alignItems: "center", paddingRight: 40 },
  headerTitle: { color: "#9CA3AF", fontSize: 12, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" },

  successBox: { alignItems: "center", paddingVertical: 24, paddingHorizontal: 16 },
  iconWrap: { position: "relative", width: 96, height: 96, alignItems: "center", justifyContent: "center", marginBottom: 24 },
  pulseGlow: { position: "absolute", width: 96, height: 96, borderRadius: 48, backgroundColor: "rgba(0, 212, 126, 0.2)" },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#00D47E", alignItems: "center", justifyContent: "center", zIndex: 10},
  successTitle: { fontSize: 30, fontWeight: "900", color: "#0A2540", textAlign: "center", marginBottom: 8, letterSpacing: -0.5 },
  successSubtitle: { color: "#6B7280", textAlign: "center", maxWidth: 280, fontSize: 14, lineHeight: 20 },

  ticketWrap: { marginHorizontal: 24, marginTop: 16, position: "relative" },
  
  ticketTop: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 24, borderWidth: 1, borderColor: "#F3F4F6", borderBottomWidth: 0, overflow: "hidden" },
  ticketBottom: { backgroundColor: "#fff", borderBottomLeftRadius: 24, borderBottomRightRadius: 24, padding: 24, paddingTop: 32, borderWidth: 1, borderColor: "#F3F4F6", borderTopWidth: 0 },
  heroBox: { height: 144, backgroundColor: "#E5E7EB", position: "relative" },
  heroImg: { width: "100%", height: "100%", opacity: 0.9 },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)" },
  heroTextWrap: { position: "absolute", bottom: 20, left: 24, right: 24 },
  heroTitle: { color: "#fff", fontWeight: "900", fontSize: 24, lineHeight: 28 },
  heroCompany: { color: "#00D47E", fontWeight: "700", fontSize: 14, marginTop: 4, textTransform: "uppercase", letterSpacing: 0.5 },
  
  ticketSummary: { paddingHorizontal: 24, paddingTop: 24, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  ticketLabel: { color: "#9CA3AF", fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
  ticketValue: { color: "#0A2540", fontWeight: "900", fontSize: 18 },
  ticketAmount: { color: "#00D47E", fontWeight: "900", fontSize: 24 },

  dividerRow: { height: 0, flexDirection: "row", alignItems: "center", position: "relative", backgroundColor: "#fff", zIndex: 10, borderLeftWidth: 1, borderRightWidth: 1, borderColor: "#F3F4F6" },
  cutoutLeft: { position: "absolute", left: -17, width: 32, height: 32, borderRadius: 16, backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#F3F4F6" },
  dashLine: { flex: 1, borderTopWidth: 2, borderStyle: "dashed", borderColor: "#E5E7EB", marginHorizontal: 8 },
  cutoutRight: { position: "absolute", right: -17, width: 32, height: 32, borderRadius: 16, backgroundColor: "#F9FAFB",  borderTopWidth: 0},
  detailRow: { flexDirection: "row", alignItems: "flex-start" },
  detailIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0, 212, 126, 0.1)", alignItems: "center", justifyContent: "center", marginRight: 16 },
  detailTextCol: { flex: 1, paddingTop: 4 },
  detailValue: { color: "#0A2540", fontWeight: "700", fontSize: 15, lineHeight: 20 },

  actionsWrap: { paddingHorizontal: 24, marginTop: 40, gap: 16 },
  btnTrack: { width: "100%", backgroundColor: "#0A2540", borderRadius: 16, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center"},
  btnTrackText: { color: "#fff", fontWeight: "900", fontSize: 16, textTransform: "uppercase", letterSpacing: 0.5 },
  btnBack: { width: "100%", backgroundColor: "#fff", borderRadius: 16, paddingVertical: 16, alignItems: "center", borderWidth: 1, borderColor: "#E5E7EB" },
  btnBackText: { color: "#0A2540", fontWeight: "700", fontSize: 14, letterSpacing: 0.2 },
});

