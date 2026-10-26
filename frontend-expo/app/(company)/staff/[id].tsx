/**
 * Staff Detail Dossier — Quiet Executive Monochromatic Standard (Linear / Apple Pro)
 */
import React, { useState, useCallback } from "react";
import { Image } from "expo-image";
import {
  ScrollView, Text, View, TouchableOpacity,
  ActivityIndicator, RefreshControl, StyleSheet, Platform, Alert, Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { api } from "@/store/authStore";
import InitialsAvatar from "@/components/common/InitialsAvatar";

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6 },
  android: { elevation: 1 },
});

export default function StaffDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [staff, setStaff] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStaff = useCallback(async (isRefresh = false) => {
    if (isRefresh) { setRefreshing(true); } else { setLoading(true); }
    try {
      let member: any = null;
      try {
        const res = await api.get(`/api/companies/staff/${id}`);
        member = res.data?.data ?? res.data;
      } catch {
        const listRes = await api.get("/api/companies/my-company/staff");
        const list = listRes.data?.data?.data ?? listRes.data?.data ?? listRes.data ?? [];
        member = (Array.isArray(list) ? list : []).find((s: any) => s.id?.toString() === id?.toString());
      }
      setStaff(member ?? null);
    } catch (error) {
      console.error("Failed to load staff details", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useFocusEffect(useCallback(() => { loadStaff(); }, [loadStaff]));

  const handleRemove = () => {
    Alert.alert(
      "Remove Staff Member",
      `Are you sure you want to remove ${staff?.fullName || "this staff member"} from your company?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove", style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/api/companies/staff/${id}`);
              Alert.alert("Removed", "Staff member has been removed.", [
                { text: "OK", onPress: () => router.back() }
              ]);
            } catch {
              Alert.alert("Error", "Could not remove staff member.");
            }
          }
        }
      ]
    );
  };

  const handleMessage = async () => {
    const targetId = staff?.userId || staff?.user?.id;
    if (!targetId) {
      Alert.alert("Error", "Staff user account is unavailable.");
      return;
    }
    try {
      const res = await api.post("/api/conversations", { targetUserId: targetId.toString() });
      let conversation = res.data?.data?.data || res.data?.data || res.data;
      if (conversation?.data && !conversation.id) {
        conversation = conversation.data;
      }

      if (conversation?.id) {
        router.push(`/(company)/messages/${conversation.id}?otherName=${encodeURIComponent(staff.fullName || staff.name || "Technician")}` as any);
      } else {
        throw new Error("Invalid response");
      }
    } catch (error) {
      console.error("Failed to start conversation:", error);
      Alert.alert("Error", "Could not start chat conversation.");
    }
  };

  const handleCall = () => {
    const phone = staff?.user?.phone || staff?.phone;
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    } else {
      Alert.alert("No Phone", "No phone number registered for this staff member.");
    }
  };

  if (loading && !staff) {
    return (
      <SafeAreaView style={[s.root, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="small" color="#0F172A" />
      </SafeAreaView>
    );
  }

  if (!staff) {
    return (
      <SafeAreaView style={s.root}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={22} color="#0F172A" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Staff Profile</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <MaterialCommunityIcons name="account-search-outline" size={48} color="#94A3B8" />
          <Text style={{ color: "#0F172A", fontSize: 16, fontWeight: "700", marginTop: 12 }}>Staff Member Not Found</Text>
          <TouchableOpacity onPress={() => router.back()} style={s.returnBtn}>
            <Text style={s.returnBtnText}>Return to Fleet</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const fullName = staff.fullName || staff.user?.fullName || staff.name || "Technician";
  const email = staff.email || staff.user?.email || "No email on file";
  const phone = staff.phone || staff.user?.phone || "";
  const avatar = staff.avatar || staff.user?.avatar;
  const isOnline = staff.status === "active";
  const isAvailable = staff.isAvailable !== false;
  const rating = staff.averageRating != null ? Number(staff.averageRating) : null;
  const completedJobs = Number(staff.completedJobsCount || staff.jobsCompleted || staff.completedJobs || 0);
  const completionRate = staff.completionRate != null ? `${staff.completionRate}%` : "—";
  const acceptanceRate = staff.acceptanceRate != null ? `${staff.acceptanceRate}%` : "—";
  const totalRevenue = Number(staff.generatedRevenue || staff.totalRevenue || staff.revenue || 0);
  const unremittedCash = Number(staff.walletBalance || staff.pendingPayout || 0);

  const assignedBookings: any[] = staff.recentBookings || staff.assignedBookings || [];
  const reviews: any[] = staff.recentReviews || staff.reviews || [];
  const compliance: any[] = Array.isArray(staff.compliance) ? staff.compliance.filter(Boolean) : [];

  return (
    <SafeAreaView style={s.root} edges={["top", "left", "right"]}>
      {/* Quiet Top Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#0F172A" />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>{fullName}</Text>
          <Text style={s.headerSubtitle}>{staff.role ? String(staff.role).replace("_", " ") : "Technician"}</Text>
        </View>
        <TouchableOpacity onPress={handleRemove} style={s.deleteBtn}>
          <MaterialCommunityIcons name="dots-horizontal" size={22} color="#64748B" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadStaff(true)} tintColor="#0F172A" />}
      >
        {/* Restrained Hero Card */}
        <View style={[s.heroCard, CARD_SHADOW]}>
          <View style={s.heroProfileRow}>
            <View style={s.avatarWrap}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={s.avatar} />
              ) : (
                <InitialsAvatar name={fullName} size={64} style={s.avatar} />
              )}
              {isOnline && <View style={s.statusPulseDot} />}
            </View>

            <View style={s.heroInfo}>
              <View style={s.heroNameRow}>
                <Text style={s.heroName} numberOfLines={1}>{fullName}</Text>
                <View style={s.ratingBadge}>
                  <MaterialCommunityIcons name="star" size={11} color="#F59E0B" />
                  <Text style={s.ratingBadgeText}>{rating != null ? rating.toFixed(1) : "—"}</Text>
                </View>
              </View>

              <Text style={s.heroEmail}>{email}</Text>

              <View style={s.heroPillsRow}>
                <View style={[s.heroPill, isOnline ? s.pillOnline : s.pillOffline]}>
                  <View style={[s.pillDot, { backgroundColor: isOnline ? "#10B981" : "#94A3B8" }]} />
                  <Text style={[s.heroPillText, { color: isOnline ? "#065F46" : "#64748B" }]}>
                    {isOnline ? "Online Shift" : "Offline"}
                  </Text>
                </View>

                <View style={[s.heroPill, s.pillNeutral]}>
                  <Text style={s.heroPillTextNeutral}>
                    {isAvailable ? "Ready to Dispatch" : "On Active Job"}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Revenue & Jobs Summary */}
          <View style={s.heroDivider} />
          <View style={s.revenueRibbon}>
            <View style={s.ribbonItem}>
              <Text style={s.ribbonLabel}>TOTAL REVENUE</Text>
              <Text style={s.ribbonValue}>${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
            </View>
            <View style={s.ribbonDivider} />
            <View style={s.ribbonItem}>
              <Text style={s.ribbonLabel}>CASH FLOAT</Text>
              <Text style={[s.ribbonValue, unremittedCash > 0 && { color: "#E11D48" }]}>
                ${unremittedCash.toFixed(2)}
              </Text>
            </View>
            <View style={s.ribbonDivider} />
            <View style={s.ribbonItem}>
              <Text style={s.ribbonLabel}>FULFILLED</Text>
              <Text style={s.ribbonValue}>{completedJobs}</Text>
            </View>
          </View>
        </View>

        {/* Quiet Action Row */}
        <View style={s.actionRow}>
          {phone ? (
            <TouchableOpacity onPress={handleCall} style={[s.actionButton, s.primaryButton]} activeOpacity={0.85}>
              <MaterialCommunityIcons name="phone" size={16} color="#FFFFFF" />
              <Text style={s.primaryButtonText}>Call Staff</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity onPress={handleMessage} style={[s.actionButton, s.secondaryButton]} activeOpacity={0.85}>
            <MaterialCommunityIcons name="chat-outline" size={16} color="#0F172A" />
            <Text style={s.secondaryButtonText}>Direct Chat</Text>
          </TouchableOpacity>
        </View>

        {/* Monochromatic 4-Metric Performance Strip */}
        <View style={s.metricsGrid}>
          <View style={[s.metricCard, CARD_SHADOW]}>
            <View style={s.metricIconBox}>
              <MaterialCommunityIcons name="briefcase-check-outline" size={18} color="#475569" />
            </View>
            <Text style={s.metricValue}>{completedJobs}</Text>
            <Text style={s.metricLabel}>Jobs Done</Text>
          </View>

          <View style={[s.metricCard, CARD_SHADOW]}>
            <View style={s.metricIconBox}>
              <MaterialCommunityIcons name="percent-outline" size={18} color="#475569" />
            </View>
            <Text style={s.metricValue}>{completionRate}</Text>
            <Text style={s.metricLabel}>Completion</Text>
          </View>

          <View style={[s.metricCard, CARD_SHADOW]}>
            <View style={s.metricIconBox}>
              <MaterialCommunityIcons name="thumb-up-outline" size={18} color="#475569" />
            </View>
            <Text style={s.metricValue}>{acceptanceRate}</Text>
            <Text style={s.metricLabel}>Acceptance</Text>
          </View>

          <View style={[s.metricCard, CARD_SHADOW]}>
            <View style={s.metricIconBox}>
              <MaterialCommunityIcons name="close-circle-outline" size={18} color="#475569" />
            </View>
            <Text style={s.metricValue}>{staff.cancellationRate != null ? `${staff.cancellationRate}%` : "—"}</Text>
            <Text style={s.metricLabel}>Cancellation</Text>
          </View>
        </View>

        {/* Contact & Dispatch Assignment */}
        <View style={[s.sectionCard, CARD_SHADOW]}>
          <Text style={s.sectionTitle}>Contact & Assignment</Text>
          <View style={s.infoList}>
            <View style={s.infoItem}>
              <MaterialCommunityIcons name="phone-outline" size={16} color="#64748B" />
              <View style={{ flex: 1 }}>
                <Text style={s.infoItemLabel}>PHONE</Text>
                <Text style={s.infoItemVal}>{phone || "Not provided"}</Text>
              </View>
            </View>
            <View style={s.infoItem}>
              <MaterialCommunityIcons name="email-outline" size={16} color="#64748B" />
              <View style={{ flex: 1 }}>
                <Text style={s.infoItemLabel}>EMAIL</Text>
                <Text style={s.infoItemVal}>{email}</Text>
              </View>
            </View>
            <View style={s.infoItem}>
              <MaterialCommunityIcons name="map-marker-outline" size={16} color="#64748B" />
              <View style={{ flex: 1 }}>
                <Text style={s.infoItemLabel}>LOCATION BASE</Text>
                 <Text style={s.infoItemVal}>{staff.currentLocation || "—"}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Verified Compliance Credentials */}
        <View style={[s.sectionCard, CARD_SHADOW]}>
          <Text style={s.sectionTitle}>Verification & Compliance</Text>
          {compliance.length === 0 ? (
            <Text style={{ fontSize: 12, fontWeight: "500", color: "#94A3B8" }}>No compliance records</Text>
          ) : (
            <View style={s.complianceList}>
              {compliance.map((item: any, i: number) => {
                const label = typeof item === "string" ? item : item?.name || item?.label || item?.type || "Record";
                const status = item?.status;
                const isVerified = status === "verified" || status === "approved";
                return (
                  <View key={item?.id ?? i} style={s.complianceItem}>
                    <MaterialCommunityIcons
                      name={isVerified ? "check-circle" : "information-outline"}
                      size={15}
                      color={isVerified ? "#059669" : "#64748B"}
                    />
                    <Text style={s.complianceText}>{label}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Recent Work Orders */}
        {assignedBookings.length > 0 && (
          <View style={[s.sectionCard, CARD_SHADOW]}>
            <Text style={s.sectionTitle}>Recent Work Orders</Text>
            <View style={s.bookingList}>
              {assignedBookings.slice(0, 5).map((booking: any) => {
                const bId = booking.id;
                const svcName = booking.serviceName || booking.service?.name || "Service Booking";
                const custName = booking.customerName || booking.customer?.fullName || "Customer";
                const isDone = booking.status === "completed";
                return (
                  <TouchableOpacity
                    key={bId}
                    style={s.bookingItem}
                    onPress={() => router.push(`/(company)/booking/${bId}` as any)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={s.bookingSvc} numberOfLines={1}>{svcName}</Text>
                      <Text style={s.bookingCust}>{custName} • #{String(bId).slice(-4)}</Text>
                    </View>
                    <View style={[s.bookingStatusBadge, isDone ? s.badgeDone : s.badgeActive]}>
                      <Text style={isDone ? s.badgeDoneText : s.badgeActiveText}>
                        {booking.status ? String(booking.status).toUpperCase() : "ACTIVE"}
                      </Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={16} color="#94A3B8" />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Customer Feedback */}
        {reviews.length > 0 && (
          <View style={[s.sectionCard, CARD_SHADOW]}>
            <Text style={s.sectionTitle}>Customer Feedback</Text>
            <View style={s.reviewsList}>
              {reviews.slice(0, 3).map((r: any, idx: number) => (
                <View key={r.id || idx} style={[s.reviewItem, idx < reviews.length - 1 && s.reviewBorder]}>
                  <View style={s.reviewTop}>
                    <Text style={s.reviewCust}>{r.customerName || r.customer?.fullName || "Customer"}</Text>
                    <View style={s.reviewStars}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <MaterialCommunityIcons
                          key={star}
                          name={star <= Math.round(Number(r.rating ?? r.staffRating ?? 0)) ? "star" : "star-outline"}
                          size={11}
                          color="#F59E0B"
                        />
                      ))}
                    </View>
                  </View>
                  {r.comment ? (
                    <Text style={s.reviewComment}>{r.comment}</Text>
                  ) : null}
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#FFFFFF",
    borderBottomWidth: 1, borderBottomColor: "#E2E8F0",
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerCenter: { alignItems: "center" },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A", letterSpacing: -0.2 },
  headerSubtitle: { fontSize: 11, fontWeight: "500", color: "#64748B", marginTop: 1, textTransform: "capitalize" },
  deleteBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },

  returnBtn: {
    marginTop: 16, backgroundColor: "#0F172A", paddingHorizontal: 18, paddingVertical: 9, borderRadius: 10,
  },
  returnBtnText: { color: "#FFFFFF", fontWeight: "600", fontSize: 13 },

  scrollContent: { padding: 16, gap: 12, paddingBottom: 60 },

  heroCard: {
    backgroundColor: "#FFFFFF", borderRadius: 18, padding: 18,
    borderWidth: 1, borderColor: "#E2E8F0",
  },
  heroProfileRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatarWrap: { position: "relative" },
  avatar: { width: 64, height: 64, borderRadius: 20, backgroundColor: "#F1F5F9" },
  statusPulseDot: {
    position: "absolute", bottom: -1, right: -1,
    width: 14, height: 14, borderRadius: 7, backgroundColor: "#10B981",
    borderWidth: 2, borderColor: "#FFFFFF",
  },
  heroInfo: { flex: 1 },
  heroNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  heroName: { fontSize: 17, fontWeight: "700", color: "#0F172A", letterSpacing: -0.2 },
  ratingBadge: {
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: "#FEF3C7", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
  },
  ratingBadgeText: { fontSize: 11, fontWeight: "700", color: "#92400E" },
  heroEmail: { fontSize: 12, fontWeight: "500", color: "#64748B", marginTop: 2 },
  heroPillsRow: { flexDirection: "row", gap: 6, marginTop: 8 },
  heroPill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  pillOnline: { backgroundColor: "#ECFDF5" },
  pillOffline: { backgroundColor: "#F1F5F9" },
  pillNeutral: { backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0" },
  pillDot: { width: 5, height: 5, borderRadius: 2.5 },
  heroPillText: { fontSize: 11, fontWeight: "600" },
  heroPillTextNeutral: { fontSize: 11, fontWeight: "600", color: "#475569" },

  heroDivider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 14 },
  revenueRibbon: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  ribbonItem: { flex: 1, alignItems: "center" },
  ribbonLabel: { fontSize: 9, fontWeight: "700", color: "#94A3B8", letterSpacing: 0.6 },
  ribbonValue: { fontSize: 15, fontWeight: "700", color: "#0F172A", marginTop: 3 },
  ribbonDivider: { width: 1, height: 24, backgroundColor: "#E2E8F0" },

  actionRow: { flexDirection: "row", gap: 10 },
  actionButton: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    paddingVertical: 11, borderRadius: 12,
  },
  primaryButton: { backgroundColor: "#0F172A" },
  primaryButtonText: { fontSize: 13, fontWeight: "600", color: "#FFFFFF" },
  secondaryButton: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E2E8F0" },
  secondaryButtonText: { fontSize: 13, fontWeight: "600", color: "#0F172A" },

  metricsGrid: { flexDirection: "row", gap: 8 },
  metricCard: {
    flex: 1, backgroundColor: "#FFFFFF", borderRadius: 14, padding: 10,
    borderWidth: 1, borderColor: "#E2E8F0", alignItems: "center",
  },
  metricIconBox: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: "#F8FAFC",
    alignItems: "center", justifyContent: "center", marginBottom: 6,
    borderWidth: 1, borderColor: "#F1F5F9",
  },
  metricValue: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  metricLabel: { fontSize: 10, fontWeight: "500", color: "#64748B", marginTop: 1 },

  sectionCard: {
    backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: "#E2E8F0",
  },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: "#0F172A", marginBottom: 10, letterSpacing: -0.1 },

  complianceList: { gap: 8 },
  complianceItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  complianceText: { fontSize: 12, fontWeight: "500", color: "#334155" },

  infoList: { gap: 10 },
  infoItem: { flexDirection: "row", alignItems: "center", gap: 10 },
  infoItemLabel: { fontSize: 9, fontWeight: "700", color: "#94A3B8", letterSpacing: 0.5 },
  infoItemVal: { fontSize: 12, fontWeight: "600", color: "#0F172A", marginTop: 1 },

  bookingList: { gap: 6 },
  bookingItem: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#F8FAFC",
  },
  bookingSvc: { fontSize: 13, fontWeight: "600", color: "#0F172A" },
  bookingCust: { fontSize: 11, fontWeight: "400", color: "#64748B", marginTop: 1 },
  bookingStatusBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  badgeDone: { backgroundColor: "#F1F5F9" },
  badgeDoneText: { fontSize: 9, fontWeight: "600", color: "#475569" },
  badgeActive: { backgroundColor: "#EFF6FF" },
  badgeActiveText: { fontSize: 9, fontWeight: "600", color: "#1D4ED8" },

  reviewsList: { gap: 8 },
  reviewItem: { paddingVertical: 6 },
  reviewBorder: { borderBottomWidth: 1, borderBottomColor: "#F1F5F9", paddingBottom: 8 },
  reviewTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  reviewCust: { fontSize: 12, fontWeight: "600", color: "#0F172A" },
  reviewStars: { flexDirection: "row", gap: 1 },
  reviewComment: { fontSize: 12, fontWeight: "400", color: "#475569", marginTop: 3, lineHeight: 16 },
});
