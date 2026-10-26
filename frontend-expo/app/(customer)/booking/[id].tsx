import React, { useState, useEffect, useCallback } from "react";
import {
  ScrollView, Text, View, TouchableOpacity, Alert,
  ActivityIndicator, RefreshControl, TextInput, StyleSheet,
  Platform, Modal, Animated, Easing, Linking
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { api } from "@/store/authStore";
import { Theme } from "@/constants/theme";

// ─── Theme & Shadows ────────────────────────────────────────────────────────
const T = Theme.colors;

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  android: { elevation: 2 },
});
const TICKET_SHADOW = {};

// ─── Types ─────────────────────────────────────────────────────────────────
interface BookingDetail {
  id: string;
  status: string;
  scheduledAt: string;
  bookingDate?: string;
  startTime?: string;
  endTime?: string;
  serviceAddress?: string;
  notes?: string;
  totalAmount?: number; platformFee?: number; totalPrice?: number;
  progressPercent?: number;
  service?: {
    id: string;
    name: string;
    image?: string;
    durationMin?: number;
    basePrice?: number;
  };
  company?: {
    id: string;
    name: string;
    logoUrl?: string;
  };
  assignedStaff?: {
    user?: { name: string };
  }[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending:     { label: "Pending",     color: "#B45309", bg: "#FEF3C7" },
  confirmed:   { label: "Confirmed",   color: "#1E40AF", bg: "#DBEAFE" },
  in_progress: { label: "In Progress", color: "#5B21B6", bg: "#EDE9FE" },
  completed:   { label: "Completed",   color: "#065F46", bg: "#D1FAE5" },
  cancelled:   { label: "Cancelled",   color: "#991B1B", bg: "#FEE2E2" },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const extractData = (res: any): any => {
  const d = res?.data;
  if (!d) return res;
  if (d?.data?.booking) return d.data.booking;
  if (d?.booking) return d.booking;
  if (d?.data && !Array.isArray(d.data)) return d.data;
  if (d && !Array.isArray(d) && (d.id || d.status)) return d;
  return d;
};

const formatDateTime = (dateStr?: string, timeStr?: string) => {
  if (!dateStr || !timeStr) return "—";
  const d = new Date(dateStr);
  const datePart = d.toLocaleDateString("en-US", {
    weekday: "long", month: "short", day: "numeric",
  });
  
  let timePart = timeStr;
  if (timeStr.includes('T')) {
    const td = new Date(timeStr);
    let h = td.getUTCHours();
    const m = td.getUTCMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    timePart = `${h}:${m.toString().padStart(2, '0')} ${ampm}`;
  }
  return `${datePart} · ${timePart}`;
};

const formatTimeOnly = (timeStr?: string) => {
  if (!timeStr) return "";
  if (timeStr.includes('T')) {
    const td = new Date(timeStr);
    let h = td.getUTCHours();
    const m = td.getUTCMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m.toString().padStart(2, '0')} ${ampm}`;
  }
  return timeStr;
};

const getStepIndex = (status: string) => {
  if (status === "pending") return 0;
  if (status === "confirmed") return 1;
  if (status === "in_progress") return 2;
  if (status === "completed") return 3;
  return 0;
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function BookingDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const progressAnim = React.useRef(new Animated.Value(0)).current;
  const pendingPushAnim = React.useRef(new Animated.Value(0)).current;

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [companyRating, setCompanyRating] = useState(0);
  const [companyComment, setCompanyComment] = useState("");
  const [staffRating, setStaffRating] = useState(0);
  const [staffComment, setStaffComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  
  // Dispute State
  const [isDisputeModalVisible, setIsDisputeModalVisible] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);

  const loadBooking = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const res = await api.get(`/api/bookings/${id}`);
      setBooking(extractData(res));
    } catch (e: any) {
      Alert.alert("Error", "Could not load booking details.");
      router.back();
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { loadBooking(); }, [loadBooking]);

  useEffect(() => {
    if (booking) {
      const stepIdx = getStepIndex(booking.status);
      const targetPercent = Math.max(0, Math.min((stepIdx / 3) * 100, 100));
      Animated.timing(progressAnim, {
        toValue: targetPercent,
        duration: 1200,
        useNativeDriver: false,
      }).start();

      if (booking.status === 'pending') {
        pendingPushAnim.setValue(0);
        Animated.loop(
          Animated.timing(pendingPushAnim, { 
            toValue: 1, 
            duration: 1200, 
            easing: Easing.linear,
            useNativeDriver: false 
          })
        ).start();
      } else {
        pendingPushAnim.stopAnimation();
      }
    }
  }, [booking?.status]);

  const handleCancel = () => {
    Alert.alert(
      "Cancel Booking?",
      "Our Refund Policy:\n• Cancel > 24 hrs: 100% Refund\n• Cancel < 24 hrs: 50% Penalty\n\nAre you sure you want to cancel?",
      [
        { text: "Keep Booking", style: "cancel" },
        { 
          text: "Yes, Cancel", 
          style: "destructive", 
          onPress: () => router.push(`/(customer)/booking/cancel?bookingId=${id}` as any) 
        }
      ]
    );
  };

  const handlePayment = () => {
    router.push(`/(customer)/checkout?bookingId=${id}` as any);
  };

  const handleCallStaff = () => {
    const rawPhone = (booking?.assignedStaff as any)?.user?.phone ||
      (booking?.assignedStaff as any)?.phone ||
      (booking?.company as any)?.phone;
    if (!rawPhone) {
      Alert.alert("Unable to Call", "No phone number available for this booking yet.");
      return;
    }
    const cleanPhone = rawPhone.replace(/[^\d+]/g, '');
    Linking.openURL(`tel:${cleanPhone}`).catch(() => {
      Alert.alert("Unable to Call", `Could not launch native phone dialer for ${cleanPhone}`);
    });
  };

  const handleMessageStaff = async () => {
    if (!staffName) return;
    try {
      const res = await api.post("/api/conversations", {
        type: "job",
        bookingId: id.toString(),
      });
      const responseData = res.data?.data || res.data;
      const conversation = responseData?.data || responseData;
      router.push(
        `/(customer)/messages/${conversation.id}?otherName=${encodeURIComponent(staffName || "Staff")}` as any
      );
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Could not start chat with staff.";
      Alert.alert("Error", Array.isArray(msg) ? msg.join(", ") : msg);
    }
  };

  const handleSubmitReview = async () => {
    if (companyRating === 0) {
      Alert.alert("Rate first", "Please select a star rating for the company.");
      return;
    }
    setIsSubmittingReview(true);
    try {
      await api.post("/api/reviews", {
        bookingId: id,
        companyRating,
        companyComment: companyComment.trim() || undefined,
        staffRating: staffRating > 0 ? staffRating : undefined,
        staffComment: staffComment.trim() || undefined,
      });
      Alert.alert("Thank you!", "Your review has been submitted.");
      setCompanyRating(0);
      setCompanyComment("");
      setStaffRating(0);
      setStaffComment("");
      loadBooking(); // Reload to hide review box if backend updates status or sets review state
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.message || "Could not submit review.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleSubmitDispute = async () => {
    if (!disputeReason.trim()) {
      Alert.alert("Reason Required", "Please provide a reason for the dispute.");
      return;
    }
    if (!booking?.company?.id) return;
    setIsSubmittingDispute(true);
    try {
      await api.post(`/api/bookings/${id}/dispute`, {
        type: "other",
        description: disputeReason.trim(),
      });
      Alert.alert("Dispute Filed", "Your dispute has been submitted and will be reviewed.");
      setDisputeReason("");
      setIsDisputeModalVisible(false);
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.message || "Could not file dispute.");
    } finally {
      setIsSubmittingDispute(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[s.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={T.accent} />
        <Text style={s.loadingText}>Loading booking...</Text>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={s.root}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={24} color={T.text1} />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ fontSize: 18, color: T.text3 }}>Booking Not Found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isPending = booking.status?.toLowerCase() === "pending";
  const isCompleted = booking.status?.toLowerCase() === "completed";
  const isCancelled = ["cancelled", "rejected"].includes(booking.status?.toLowerCase() || "");
  const isActive = !isCompleted && !isCancelled;
  const stepIdx = getStepIndex(booking.status?.toLowerCase() || "pending");
  const statusConfig = STATUS_CONFIG[booking.status?.toLowerCase() || "pending"] ?? STATUS_CONFIG.pending;

  const heroImg =
    booking.service?.image || (booking.service as any)?.serviceType?.imageUrl || (booking.service as any)?.serviceType?.category?.imageUrl ||
    booking.company?.logoUrl;

  const staffName = (booking.assignedStaff as any)?.fullName ?? (booking.assignedStaff as any)?.user?.fullName ?? null;
  const parsedTotal = booking.totalPrice != null ? Number(booking.totalPrice.toString?.() || booking.totalPrice) || 0 : 0;
  const parsedBase = booking.service?.basePrice != null ? Number(booking.service.basePrice.toString?.() || booking.service.basePrice) || 0 : 0;
  const totalPrice = parsedTotal > 0 ? parsedTotal : parsedBase;

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      {/* ── HEADER ────────────────────────────────────────────── */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color={T.text1} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Booking Receipt</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadBooking} tintColor={T.accent} />}
      >
        {/* Cancelled badge */}
        {isCancelled && (
          <View style={s.cancelledBox}>
            <Ionicons name="close-circle" size={24} color={T.error} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.cancelledTitle}>{booking.status}</Text>
              <Text style={s.cancelledSub}>This booking has been cancelled.</Text>
            </View>
          </View>
        )}

        {/* ── SERVICE SUMMARY CARD ────────────────────────────────────────────── */}
        <View style={s.heroCard}>
          <View style={s.heroImgWrapper}>
            {heroImg ? (
              <Image source={{ uri: heroImg }} style={StyleSheet.absoluteFill} contentFit="cover" />
            ) : (
              <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center", backgroundColor: T.accentLight }]}>
                <MaterialCommunityIcons name="toolbox-outline" size={32} color={T.accentMid} />
              </View>
            )}
            <View style={s.heroBadge}>
              <View style={[s.heroBadgeDot, { backgroundColor: statusConfig.color }]} />
              <Text style={[s.heroBadgeText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
            </View>
          </View>

          <View style={s.heroBody}>
            <View style={{ flex: 1, paddingRight: 16 }}>
              <Text style={s.heroTitle} numberOfLines={2}>{booking.service?.name ?? "Service Booking"}</Text>
              <Text style={s.heroSub} numberOfLines={1}>by {booking.company?.name}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={s.heroPrice}>${Number(totalPrice).toFixed(2)}</Text>
              <Text style={s.heroPriceLabel}>Total</Text>
            </View>
          </View>
        </View>

        {/* ── APPOINTMENT DETAILS ────────────────────────────────────────────── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Appointment Details</Text>
          <View style={s.row}>
            <MaterialCommunityIcons name="calendar-month-outline" size={20} color={T.text3} />
            <Text style={s.rowText}>{formatDateTime(booking.bookingDate, booking.startTime)}</Text>
          </View>
          {booking.endTime && (
            <View style={s.row}>
              <MaterialCommunityIcons name="clock-outline" size={20} color={T.text3} />
              <Text style={s.rowText}>Until {formatTimeOnly(booking.endTime)}</Text>
            </View>
          )}
          {booking.serviceAddress && (
            <View style={[s.row, { alignItems: "flex-start" }]}>
              <MaterialCommunityIcons name="map-marker-outline" size={20} color={T.text3} />
              <Text style={[s.rowText, { flex: 1 }]}>{booking.serviceAddress}</Text>
            </View>
          )}
        </View>

        {/* ── PRICE BREAKDOWN ────────────────────────────────────────────── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Price Breakdown</Text>
          <View style={s.priceRow}>
            <Text style={s.totalLabel}>Total Amount</Text>
            <Text style={s.totalVal}>${Number(totalPrice).toFixed(2)}</Text>
          </View>
        </View>

        {/* ── STATUS TIMELINE ────────────────────────────────────────────── */}
        {!isCancelled && (
          <View style={s.card}>
            <View style={s.timelineContainer}>
              <View style={[s.timelineTrack, { backgroundColor: T.border }]} />
              
              {/* Push Line (Pending -> Confirmed) */}
              {booking.status === 'pending' && (
                <View style={[s.timelineTrack, { width: '33.3%', overflow: 'hidden', backgroundColor: 'transparent' }]}>
                  <Animated.View
                    style={{
                      height: '100%',
                      width: '40%',
                      backgroundColor: T.accent,
                      borderRadius: 2,
                      left: pendingPushAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['-40%', '100%']
                      })
                    }}
                  />
                </View>
              )}

              {/* Solid Progress Track */}
              <Animated.View
                style={[
                  s.timelineTrack,
                  { 
                    backgroundColor: T.accent, 
                    width: progressAnim.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0%', '100%']
                    }) 
                  },
                ]}
              />
              {[
                { label: "Pending", step: 0 },
                { label: "Confirmed", step: 1 },
                { label: "In Progress", step: 2 },
                { label: "Completed", step: 3 },
              ].map(({ label, step }) => {
                const isPassed = stepIdx >= step;
                return (
                  <View key={label} style={s.timelineStep}>
                    <View
                      style={[
                        s.timelineDot,
                        {
                          backgroundColor: isPassed ? T.accent : T.surface,
                          borderColor: isPassed ? T.accent : T.border,
                        },
                      ]}
                    >
                      {isPassed && <MaterialCommunityIcons name="check" size={14} color="#fff" />}
                    </View>
                    <Text style={[s.timelineLabel, { color: isPassed ? T.text1 : T.text3 }]}>
                      {label}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Track Staff Banner if in_progress */}
            {(booking.status === "confirmed" || booking.status === "in_progress") && (
              <View style={s.progressBox}>
                {booking.status === "in_progress" && (
                  <View style={{ marginBottom: 16 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                      <Text style={{ fontSize: 13, color: T.text2, fontWeight: "600" }}>Job Progress</Text>
                      <Text style={{ fontSize: 13, fontWeight: "800", color: T.accent }}>
                        {booking.progressPercent ?? Math.round((getStepIndex(booking.status?.toLowerCase() || "") / 3) * 100)}%
                      </Text>
                    </View>
                    <View style={{ height: 6, backgroundColor: T.border, borderRadius: 3, overflow: "hidden" }}>
                      <View style={{ height: "100%", backgroundColor: T.accent, width: `${booking.progressPercent ?? Math.round((getStepIndex(booking.status?.toLowerCase() || "") / 3) * 100)}%` }} />
                    </View>
                  </View>
                )}
                
                <TouchableOpacity
                  onPress={() => router.push(`/(customer)/map-view?bookingId=${id}&mode=tracking` as any)}
                  style={s.trackBtn}
                >
                  <MaterialCommunityIcons name="map-marker-radius" size={18} color="#fff" />
                  <Text style={s.trackBtnText}>Track Live Staff Location</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* ── ASSIGNED STAFF ────────────────────────────────────────────── */}
        {staffName && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Assigned Professional</Text>
            <View style={s.staffRow}>
              <View style={s.staffAvatar}>
                <Ionicons name="person" size={22} color={T.text3} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.staffName}>{staffName}</Text>
                <Text style={s.staffRole}>Assigned Staff</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TouchableOpacity 
                  style={[s.chatStaffBtn, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}
                  onPress={handleCallStaff}
                >
                  <MaterialCommunityIcons name="phone" size={20} color="#059669" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={s.chatStaffBtn}
                  onPress={handleMessageStaff}
                >
                  <MaterialCommunityIcons name="message-text" size={20} color={T.accent} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* ── NOTES ────────────────────────────────────────────── */}
        {booking.notes && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Notes from Customer</Text>
            <View style={s.notesBox}>
              <Text style={s.notesText}>{booking.notes}</Text>
            </View>
          </View>
        )}

        {/* ── RATING & REVIEWS ────────────────────────────────────────────── */}
        {isCompleted && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Rate Your Experience</Text>
            
            {/* Company Rating */}
            <Text style={s.ratingPrompt}>How was {booking.company?.name ?? "the service"}?</Text>
            <View style={s.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setCompanyRating(star)}>
                  <MaterialCommunityIcons
                    name={star <= companyRating ? "star" : "star-outline"}
                    size={36}
                    color={star <= companyRating ? T.warning : T.border}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={s.commentLabel}>Company Comments (Optional)</Text>
            <TextInput
              style={s.commentInput}
              placeholder="Share your experience with the company..."
              placeholderTextColor={T.text3}
              multiline
              value={companyComment}
              onChangeText={setCompanyComment}
            />

            {/* Staff Rating (if assigned) */}
            {staffName && (
              <View style={{ marginTop: 24, paddingTop: 24, borderTopWidth: 1, borderTopColor: T.border }}>
                <Text style={s.ratingPrompt}>How was your professional, {staffName}?</Text>
                <View style={s.starsRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity key={`staff-${star}`} onPress={() => setStaffRating(star)}>
                      <MaterialCommunityIcons
                        name={star <= staffRating ? "star" : "star-outline"}
                        size={36}
                        color={star <= staffRating ? T.warning : T.border}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={s.commentLabel}>Professional Comments (Optional)</Text>
                <TextInput
                  style={[s.commentInput, { minHeight: 80 }]}
                  placeholder={`Share your experience with ${staffName}...`}
                  placeholderTextColor={T.text3}
                  multiline
                  value={staffComment}
                  onChangeText={setStaffComment}
                />
              </View>
            )}

            <TouchableOpacity
              onPress={handleSubmitReview}
              disabled={isSubmittingReview}
              style={[s.primaryBtn, { marginTop: 24 }, isSubmittingReview && { opacity: 0.7 }]}
            >
              {isSubmittingReview ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.primaryBtnText}>Submit Review</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Spacer for bottom bar */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── BOTTOM ACTIONS ────────────────────────────────────────────── */}
      <View style={s.bottomBar}>
        {isPending && (
          <>
            <TouchableOpacity style={s.secondaryBtn} onPress={handleCancel}>
              <Text style={s.secondaryBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.primaryBtn, { flex: 1, marginTop: 0 }]} onPress={handlePayment}>
              <MaterialCommunityIcons name="credit-card-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={s.primaryBtnText}>Pay Now</Text>
            </TouchableOpacity>
          </>
        )}
        
        {isActive && !isPending && (
          <>
            <TouchableOpacity style={s.secondaryBtn} onPress={handleCancel}>
              <Text style={s.secondaryBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.secondaryBtn, { borderColor: '#10B981', backgroundColor: '#ECFDF5' }]}
              onPress={handleCallStaff}
            >
              <MaterialCommunityIcons name="phone" size={18} color="#059669" style={{ marginRight: 6 }} />
              <Text style={[s.secondaryBtnText, { color: '#059669' }]}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.primaryBtn, { flex: 1, marginTop: 0 }]}
              onPress={() => router.push(`/(customer)/messages/new?companyId=${booking.company?.id}` as any)}
            >
              <MaterialCommunityIcons name="chat" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={s.primaryBtnText}>Message</Text>
            </TouchableOpacity>
          </>
        )}

        {isCompleted && (
          <>
            <TouchableOpacity
              style={s.secondaryBtn}
              onPress={() => setIsDisputeModalVisible(true)}
            >
              <MaterialCommunityIcons name="alert-circle-outline" size={18} color={T.error} style={{ marginRight: 8 }} />
              <Text style={[s.secondaryBtnText, { color: T.error }]}>Dispute</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.primaryBtn, { flex: 1, marginTop: 0 }]}
              onPress={() => {
                if (booking?.scheduledAt) {
                  const hoursDiff = (new Date(booking.scheduledAt).getTime() - new Date().getTime()) / (1000 * 60 * 60);
                  if (hoursDiff < 24) {
                    Alert.alert(
                      "Reschedule Not Allowed",
                      "You cannot reschedule a booking within 24 hours of the start time. Please contact the company directly.",
                      [{ text: "OK", style: "cancel" }]
                    );
                    return;
                  }
                }
                Alert.alert(
                  "Reschedule",
                  "Select a new date and time. This must be approved by the company.",
                  [
                    { text: "Cancel", style: "cancel" },
                    { text: "Select Time", onPress: () => router.push(`/(customer)/booking/reschedule?bookingId=${id}&id=${id}` as any) }
                  ]
                );
              }}
            >
              <MaterialCommunityIcons name="calendar-clock" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={s.primaryBtnText}>Reschedule</Text>
            </TouchableOpacity>
          </>
        )}

        {isCancelled && (
          <TouchableOpacity
            style={[s.primaryBtn, { flex: 1, marginTop: 0 }]}
            onPress={() => router.push("/(customer)/(tabs)/explore" as any)}
          >
            <Text style={s.primaryBtnText}>Browse Services</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── DISPUTE MODAL ────────────────────────────────────────────── */}
      <Modal
        visible={isDisputeModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsDisputeModalVisible(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>File a Dispute</Text>
            <Text style={s.modalDesc}>If you had an issue with the service, please explain below. Our team will review your case.</Text>
            <TextInput
              style={s.modalInput}
              placeholder="Describe your issue..."
              placeholderTextColor={T.text3}
              multiline
              value={disputeReason}
              onChangeText={setDisputeReason}
            />
            <View style={s.modalActions}>
              <TouchableOpacity
                style={s.modalBtnCancel}
                onPress={() => setIsDisputeModalVisible(false)}
              >
                <Text style={s.modalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.modalBtnSubmit}
                onPress={handleSubmitDispute}
                disabled={isSubmittingDispute}
              >
                {isSubmittingDispute ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={s.modalBtnSubmitText}>Submit Dispute</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  loadingText: { marginTop: 12, fontSize: 15, color: T.text3, fontWeight: "600" },
  
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: T.bg,
  },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: T.surface, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: T.border },
  headerTitle: { fontSize: 18, fontWeight: "800", color: T.text1 },

  scrollContent: { padding: 24, paddingBottom: 40, gap: 20 },

  // ── Hero Card ──
  heroCard: { backgroundColor: T.surface, borderRadius: 20, overflow: "hidden", marginBottom: 20, borderWidth: 1, borderColor: T.border },
  heroImgWrapper: { width: "100%", height: 180, backgroundColor: T.accentLight, position: "relative" },
  heroBadge: { position: "absolute", bottom: 16, left: 16, flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: T.surface, borderWidth: 1, borderColor: T.border },
  heroBadgeDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  heroBadgeText: { fontSize: 13, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 },
  heroBody: { padding: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  heroTitle: { fontSize: 20, fontWeight: "900", color: T.text1, marginBottom: 4, letterSpacing: -0.5 },
  heroSub: { fontSize: 14, fontWeight: "600", color: T.text3 },
  heroPrice: { fontSize: 22, fontWeight: "900", color: T.accent, letterSpacing: -0.5 },
  heroPriceLabel: { fontSize: 12, fontWeight: "700", color: T.text3, textTransform: "uppercase", marginTop: 2 },

  // ── Standard Cards ──
  card: { backgroundColor: T.surface, borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: T.border },
  cardTitle: { fontSize: 14, fontWeight: "800", color: T.text1, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 16 },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  rowText: { fontSize: 15, fontWeight: "600", color: T.text2, marginLeft: 12 },
  
  priceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  priceLineItem: { fontSize: 14, fontWeight: "600", color: T.text2 },
  priceLineAmt: { fontSize: 14, fontWeight: "800", color: T.text1 },
  cardDivider: { height: 1, backgroundColor: T.border, marginVertical: 16 },
  totalLabel: { fontSize: 16, fontWeight: "800", color: T.text1 },
  totalVal: { fontSize: 24, fontWeight: "900", color: T.accent, letterSpacing: -1 },

  // Timeline
  timelineContainer: { flexDirection: "row", justifyContent: "space-between", position: "relative", paddingHorizontal: 10, paddingBottom: 4 },
  timelineTrack: { position: "absolute", top: 12, left: 10, right: 10, height: 3, zIndex: 0 },
  timelineStep: { alignItems: "center", zIndex: 1 },
  timelineDot: { width: 26, height: 26, borderRadius: 13, borderWidth: 4, backgroundColor: T.surface, alignItems: "center", justifyContent: "center" },
  timelineLabel: { fontSize: 11, fontWeight: "800", marginTop: 10, textTransform: "uppercase", letterSpacing: 0.5 },

  progressBox: { marginTop: 24, paddingTop: 20, borderTopWidth: 1, borderTopColor: T.border },
  trackBtn: { backgroundColor: T.accent, paddingVertical: 14, borderRadius: 14, flexDirection: "row", justifyContent: "center", alignItems: "center" },
  trackBtnText: { color: "#fff", fontSize: 14, fontWeight: "800", marginLeft: 8 },

  cancelledBox: { backgroundColor: "#FEF2F2", borderRadius: 16, flexDirection: "row", alignItems: "center", padding: 16, borderWidth: 1, borderColor: "#FCA5A5" },
  cancelledTitle: { fontSize: 16, fontWeight: "800", color: "#991B1B", textTransform: "capitalize" },
  cancelledSub: { fontSize: 14, color: "#DC2626", marginTop: 2, fontWeight: "500" },

  // Staff
  staffRow: { flexDirection: "row", alignItems: "center" },
  staffAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: T.accentLight, alignItems: "center", justifyContent: "center", marginRight: 14 },
  staffName: { fontSize: 16, fontWeight: "800", color: T.text1 },
  staffRole: { fontSize: 13, fontWeight: "600", color: T.text3, marginTop: 2 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: T.bg, alignItems: "center", justifyContent: "center" },
  chatStaffBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: T.accentLight, alignItems: "center", justifyContent: "center" },

  // Notes
  notesBox: { backgroundColor: T.bg, padding: 16, borderRadius: 14 },
  notesText: { fontSize: 15, color: T.text2, lineHeight: 24, fontWeight: "500" },

  // Rating
  ratingPrompt: { fontSize: 16, fontWeight: "700", color: T.text1, marginBottom: 12 },
  starsRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 20 },
  commentLabel: { fontSize: 12, fontWeight: "800", color: T.text3, textTransform: "uppercase", marginBottom: 8 },
  commentInput: { backgroundColor: T.bg, borderWidth: 1, borderColor: T.border, borderRadius: 14, padding: 16, minHeight: 120, fontSize: 15, color: T.text1, textAlignVertical: "top" },

  // Bottom Bar
  bottomBar: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: T.surface, paddingHorizontal: 24, paddingVertical: 16, paddingBottom: Platform.OS === 'ios' ? 32 : 24, borderTopWidth: 1, borderTopColor: T.border, flexDirection: "row", gap: 12 },
  primaryBtn: { backgroundColor: T.accent, paddingVertical: 16, borderRadius: 16, alignItems: "center", justifyContent: "center", flexDirection: "row" },
  primaryBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  secondaryBtn: { backgroundColor: T.surface, paddingVertical: 16, paddingHorizontal: 20, borderRadius: 16, alignItems: "center", justifyContent: "center", flexDirection: "row", borderWidth: 2, borderColor: T.border },
  secondaryBtnText: { color: T.text1, fontSize: 15, fontWeight: "800" },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(10, 25, 47, 0.6)", justifyContent: "center", alignItems: "center", padding: 24 },
  modalContent: { backgroundColor: T.surface, width: "100%", borderRadius: 24, padding: 24 },
  modalTitle: { fontSize: 22, fontWeight: "900", color: T.text1, marginBottom: 8, letterSpacing: -0.5 },
  modalDesc: { fontSize: 15, color: T.text2, lineHeight: 22, marginBottom: 24, fontWeight: "500" },
  modalInput: { backgroundColor: T.bg, borderWidth: 1, borderColor: T.border, borderRadius: 16, padding: 16, minHeight: 120, fontSize: 15, color: T.text1, textAlignVertical: "top", marginBottom: 24 },
  modalActions: { flexDirection: "row", gap: 12 },
  modalBtnCancel: { flex: 1, paddingVertical: 16, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: T.bg },
  modalBtnCancelText: { color: T.text2, fontSize: 15, fontWeight: "800" },
  modalBtnSubmit: { flex: 1, paddingVertical: 16, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: T.error },
  modalBtnSubmitText: { color: "#fff", fontSize: 15, fontWeight: "800" },
});
