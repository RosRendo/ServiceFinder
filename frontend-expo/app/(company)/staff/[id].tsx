/**
 * Staff Detail — Premium Deep Navy Redesign
 * Displays all available data: ratings, jobs, availability, contact, etc.
 */
import React, { useState, useCallback } from "react";
import {
  ScrollView, Text, View, TouchableOpacity,
  ActivityIndicator, RefreshControl, StyleSheet, Platform, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { api } from "@/store/authStore";

const T = {
  bg: "#FFFFFF", surface: "#FFFFFF", border: "#EBEBEB",
  accent: "#0A192F", accentMid: "#1E3A8A", accentLight: "#F7F7F7",
  text1: "#111827", text2: "#717171", text3: "#B0B0B0",
  success: "#00A699", warning: "#FFB800", error: "#E31C5F",
};

const HERO_SHADOW = Platform.select({
  ios: { shadowColor: '#0A192F', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 16 },
  android: { elevation: 8 },
});

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  android: { elevation: 2 },
});

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  supervisor: { bg: "#EDE9FE", text: "#5B21B6" },
  worker:     { bg: "#DBEAFE", text: "#1E40AF" },
  technician: { bg: "#D1FAE5", text: "#065F46" },
  admin:      { bg: "#FEF3C7", text: "#92400E" },
  default:    { bg: T.accentLight, text: T.accentMid },
};

function Avatar({ name, size = 72 }: { name: string; size?: number }) {
  const initials = (name ?? "?").split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  const palette = ["#0A192F", "#1E3A8A", "#1E40AF", "#1D4ED8", "#2563EB", "#3B82F6"];
  const color = palette[(name ?? "").length % palette.length];
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontSize: size * 0.33, fontWeight: "800", color: "#fff" }}>{initials}</Text>
    </View>
  );
}

function StatCard({ icon, iconColor, value, label }: { icon: string; iconColor: string; value: string; label: string }) {
  return (
    <View style={s.statCard}>
      <MaterialCommunityIcons name={icon as any} size={26} color={iconColor} />
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function InfoRow({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={s.infoRow}>
      <MaterialCommunityIcons name={icon as any} size={20} color={T.text3} />
      <Text style={s.infoText}>{text}</Text>
    </View>
  );
}

export default function StaffDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [staff, setStaff] = useState<any>(null);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [availability, setAvailability] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStaff = useCallback(async (isRefresh = false) => {
    if (isRefresh) { setRefreshing(true); } else { setLoading(true); }
    try {
      const res = await api.get("/api/companies/my-company/staff");
      let data = res.data;
      if (data && data.success) data = data.data;
      if (data && data.data) data = data.data;
      const list = Array.isArray(data) ? data : [];
      const member = list.find((s: any) => s.id.toString() === id?.toString());
      setStaff(member ?? null);

      if (member) {
        try {
          const payoutRes = await api.get(`/api/company/staff/${member.id}/payouts`);
          const payoutData = payoutRes.data?.data || payoutRes.data;
          setPayouts(payoutData?.payouts || []);
        } catch (payoutErr) {
          console.error("Failed to load payouts", payoutErr);
        }

        try {
          const availRes = await api.get(`/api/staff/${member.id}/availability`);
          const availData = availRes.data?.data || availRes.data;
          setAvailability(availData?.availability || []);
        } catch (availErr) {
          console.error("Failed to load availability", availErr);
        }
      }
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
      `Remove ${staff?.fullName} from your company?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove", style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/api/companies/staff/${id}`);
              Alert.alert("Done", "Staff member removed.", [{ text: "OK", onPress: () => router.back() }]);
            } catch {
              Alert.alert("Error", "Could not remove staff member.");
            }
          }
        }
      ]
    );
  };

  const handleMessage = async () => {
    if (!staff?.userId) {
      Alert.alert("Error", "Staff user ID is missing.");
      return;
    }
    try {
      const res = await api.post("/api/conversations", { targetUserId: staff.userId.toString() });
      
      // The NestJS backend returns wrapped data, and the ConversationsService ALSO wraps it in { data: ... }
      // So the structure is res.data (axios) -> data (interceptor) -> data (service) -> id
      let conversation = res.data?.data?.data || res.data?.data || res.data;
      
      // Some endpoints might not double-nest it, so we traverse down until we find an ID
      if (conversation?.data && !conversation.id) {
        conversation = conversation.data;
      }

      if (conversation?.id) {
        router.push(`/(company)/messages/${conversation.id}?otherName=${encodeURIComponent(staff.fullName ?? "Staff")}` as any);
      } else {
        throw new Error("Invalid response from server: " + JSON.stringify(res.data));
      }
    } catch (error) {
      console.error("Failed to start conversation:", error);
      Alert.alert("Error", "Could not start conversation.");
    }
  };

  const handleApprovePayout = (payoutId: number) => {
    Alert.alert("Approve Payout", "Are you sure you want to approve this payout request?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Approve",
        style: "default",
        onPress: async () => {
          try {
            await api.patch(`/api/company/payouts/${payoutId}/approve`);
            Alert.alert("Success", "Payout approved.");
            loadStaff();
          } catch (error) {
            console.error("Failed to approve payout:", error);
            Alert.alert("Error", "Could not approve payout.");
          }
        }
      }
    ]);
  };

  const handleRejectPayout = (payoutId: number) => {
    Alert.alert("Reject Payout", "Are you sure you want to reject this payout request? Funds will be returned to the staff's wallet.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reject",
        style: "destructive",
        onPress: async () => {
          try {
            await api.patch(`/api/company/payouts/${payoutId}/reject`);
            Alert.alert("Success", "Payout rejected and funds refunded.");
            loadStaff();
          } catch (error) {
            console.error("Failed to reject payout:", error);
            Alert.alert("Error", "Could not reject payout.");
          }
        }
      }
    ]);
  };

  if (loading && !staff) {
    return (
      <SafeAreaView style={[s.root, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={T.accent} />
      </SafeAreaView>
    );
  }

  if (!staff) {
    return (
      <SafeAreaView style={s.root}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <MaterialCommunityIcons name="chevron-left" size={32} color={T.text1} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Staff Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: T.text3, fontSize: 15 }}>Staff member not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const roleKey = (staff.role ?? "default").toLowerCase();
  const roleStyle = ROLE_COLORS[roleKey] ?? ROLE_COLORS.default;
  const isActive = staff.status === "active";
  const hasRating = staff.averageRating != null;
  const joinedDate = staff.joinedAt
    ? new Date(staff.joinedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "Unknown";

  return (
    <SafeAreaView style={s.root} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <MaterialCommunityIcons name="chevron-left" size={32} color={T.text1} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Staff Profile</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <TouchableOpacity onPress={handleMessage} style={s.msgBtn}>
            <MaterialCommunityIcons name="message-text-outline" size={22} color={T.accent} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleRemove} style={s.deleteBtn}>
            <MaterialCommunityIcons name="delete-outline" size={22} color={T.error} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadStaff(true)} tintColor={T.accent} />}
      >
        {/* Hero Card */}
        <View style={s.heroCard}>
          <View style={s.avatarWrap}>
            <Avatar name={staff.fullName ?? "S"} size={80} />
            <View style={[s.statusDot, { backgroundColor: isActive ? T.success : T.text3 }]} />
          </View>
          <Text style={s.heroName}>{staff.fullName}</Text>
          <Text style={s.heroEmail}>{staff.email}</Text>
          <View style={s.heroBadgeRow}>
            <View style={[s.roleBadge, { backgroundColor: roleStyle.bg }]}>
              <Text style={[s.roleBadgeText, { color: roleStyle.text }]}>
                {(staff.role ?? "Staff").replace("_", " ")}
              </Text>
            </View>
            <View style={[s.availBadge, { backgroundColor: staff.isAvailable ? "#D1FAE5" : "#FEE2E2" }]}>
              <View style={[s.availDot, { backgroundColor: staff.isAvailable ? T.success : T.error }]} />
              <Text style={[s.availText, { color: staff.isAvailable ? "#065F46" : "#991B1B" }]}>
                {staff.isAvailable ? "Available" : "Unavailable"}
              </Text>
            </View>
          </View>
        </View>

        {/* Stats Row */}
        <View style={s.statsRow}>
          <StatCard
            icon="check-circle-outline"
            iconColor={T.success}
            value={String(staff.completedJobs ?? 0)}
            label="Completed Jobs"
          />
          <View style={s.statsDivider} />
          <StatCard
            icon="star-outline"
            iconColor={T.warning}
            value={hasRating ? Number(staff.averageRating).toFixed(1) : "—"}
            label="Avg Rating"
          />
          <View style={s.statsDivider} />
          <StatCard
            icon="comment-multiple-outline"
            iconColor={T.accentMid}
            value={String(staff.totalReviews ?? 0)}
            label="Reviews"
          />
        </View>

        {/* Active Jobs Badge */}
        {(staff.activeRequests ?? 0) > 0 && (
          <View style={s.activeJobBanner}>
            <MaterialCommunityIcons name="lightning-bolt" size={18} color={T.warning} />
            <Text style={s.activeJobText}>{staff.activeRequests} active job{staff.activeRequests > 1 ? "s" : ""} in progress</Text>
          </View>
        )}

        {/* Contact Info */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Contact Information</Text>
          <InfoRow icon="email-outline" text={staff.email ?? "No email"} />
          <InfoRow icon="phone-outline" text={staff.phone ?? "No phone"} />
          <InfoRow icon="calendar-outline" text={`Joined ${joinedDate}`} />
        </View>

        {/* Rating Details */}
        {hasRating && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Performance</Text>
            <View style={s.ratingDisplay}>
              <Text style={s.ratingBig}>{Number(staff.averageRating).toFixed(1)}</Text>
              <View>
                <View style={s.starsRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <MaterialCommunityIcons
                      key={star}
                      name={star <= Math.round(staff.averageRating) ? "star" : "star-outline"}
                      size={20}
                      color={T.warning}
                    />
                  ))}
                </View>
                <Text style={s.ratingSubtext}>Based on {staff.totalReviews} review{staff.totalReviews !== 1 ? "s" : ""}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Time Off */}
        {availability.filter(a => a.isAvailable === false).length > 0 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Time Off (Unavailable)</Text>
            {availability.filter(a => a.isAvailable === false).map((slot: any) => (
              <View key={slot.id} style={s.timeOffCard}>
                <View style={s.timeOffIcon}>
                  <MaterialCommunityIcons name="calendar-remove" size={20} color={T.error} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.timeOffDate}>{new Date(slot.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })}</Text>
                  <Text style={s.timeOffText}>Staff is unavailable for jobs</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Pending Payout Requests */}
        {payouts.filter(p => p.status === 'pending').length > 0 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Pending Payout Requests</Text>
            {payouts.filter(p => p.status === 'pending').map((payout: any) => (
              <View key={payout.id} style={s.payoutCard}>
                <View style={s.payoutRow}>
                  <Text style={s.payoutAmount}>${Number(payout.amount).toFixed(2)}</Text>
                  <Text style={s.payoutMethod}>{payout.method}</Text>
                </View>
                <View style={s.payoutActions}>
                  <TouchableOpacity onPress={() => handleRejectPayout(payout.id)} style={[s.payoutBtn, s.payoutBtnReject]}>
                    <Text style={s.payoutBtnRejectText}>Reject</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleApprovePayout(payout.id)} style={[s.payoutBtn, s.payoutBtnApprove]}>
                    <Text style={s.payoutBtnApproveText}>Approve</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: T.surface, borderBottomWidth: 1, borderBottomColor: T.border,
  },
  backBtn: { padding: 4, marginLeft: -8 },
  msgBtn: { padding: 8, backgroundColor: T.accentLight, borderRadius: 8 },
  deleteBtn: { padding: 8, backgroundColor: "#FEE2E2", borderRadius: 8 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: T.accent, flex: 1, textAlign: "center", marginLeft: 32 },

  scrollContent: { padding: 24, gap: 16, paddingBottom: 60 },

  heroCard: {
    backgroundColor: T.accent, borderRadius: 20, padding: 28,
    alignItems: "center", gap: 8, borderWidth: 1, borderColor: T.border,
  },
  avatarWrap: { position: "relative", marginBottom: 4 },
  statusDot: {
    position: "absolute", bottom: 4, right: 4,
    width: 18, height: 18, borderRadius: 9, borderWidth: 2.5, borderColor: T.accent,
  },
  heroName: { fontSize: 22, fontWeight: "800", color: "#fff" },
  heroEmail: { fontSize: 13, fontWeight: "500", color: "rgba(255,255,255,0.6)" },
  heroBadgeRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  roleBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  roleBadgeText: { fontSize: 12, fontWeight: "800", textTransform: "capitalize" },
  availBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  availDot: { width: 7, height: 7, borderRadius: 4 },
  availText: { fontSize: 12, fontWeight: "800" },

  statsRow: {
    backgroundColor: T.surface, borderRadius: 16, padding: 20,
    flexDirection: "row", alignItems: "center", justifyContent: "space-around",
    borderWidth: 1, borderColor: T.border,
  },
  statCard: { flex: 1, alignItems: "center", gap: 6 },
  statValue: { fontSize: 22, fontWeight: "800", color: T.text1 },
  statLabel: { fontSize: 11, fontWeight: "600", color: T.text3, textAlign: "center" },
  statsDivider: { width: 1, height: 48, backgroundColor: T.border },

  activeJobBanner: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#FEF3C7", borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: "#FDE68A",
  },
  activeJobText: { fontSize: 14, fontWeight: "700", color: "#92400E" },

  card: {
    backgroundColor: T.surface, borderRadius: 16, padding: 20,
    
  },
  cardTitle: { fontSize: 15, fontWeight: "800", color: T.accent },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  infoText: { fontSize: 14, fontWeight: "500", color: T.text1, flex: 1 },

  ratingDisplay: { flexDirection: "row", alignItems: "center", gap: 16 },
  ratingBig: { fontSize: 40, fontWeight: "800", color: T.accent, letterSpacing: -1 },
  starsRow: { flexDirection: "row", gap: 2, marginBottom: 4 },
  ratingSubtext: { fontSize: 13, color: T.text3, fontWeight: "500" },

  payoutCard: {
    backgroundColor: T.bg, borderRadius: 12, padding: 16, marginTop: 12,
    borderWidth: 1, borderColor: T.border, gap: 12,
  },
  payoutRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  payoutAmount: { fontSize: 20, fontWeight: "800", color: T.accent },
  payoutMethod: { fontSize: 13, fontWeight: "600", color: T.text2, textTransform: "uppercase" },
  payoutActions: { flexDirection: "row", gap: 8 },
  payoutBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: "center" },
  payoutBtnReject: { backgroundColor: "#FEE2E2" },
  payoutBtnRejectText: { color: "#991B1B", fontWeight: "700" },
  payoutBtnApprove: { backgroundColor: T.success },
  payoutBtnApproveText: { color: "#fff", fontWeight: "700" },

  timeOffCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#FEF2F2", padding: 12, borderRadius: 12,
    borderWidth: 1, borderColor: "#FECACA", marginTop: 8
  },
  timeOffIcon: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: "#FEE2E2",
    alignItems: "center", justifyContent: "center"
  },
  timeOffDate: { fontSize: 15, fontWeight: "700", color: "#991B1B" },
  timeOffText: { fontSize: 13, color: "#B91C1C", marginTop: 2 }
});
