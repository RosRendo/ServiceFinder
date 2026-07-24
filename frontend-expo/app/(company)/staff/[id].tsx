/**
 * Staff Detail — Premium Deep Navy Redesign (Unified Architecture)
 */
import React, { useState, useCallback } from "react";
import { Image } from "expo-image";
import {
  ScrollView, Text, View, TouchableOpacity,
  ActivityIndicator, RefreshControl, StyleSheet, Platform, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { api } from "@/store/authStore";
import { Theme } from "@/constants/theme";

const T = {
  bg: Theme.colors.bg,
  surface: Theme.colors.surface,
  border: Theme.colors.border,
  accent: Theme.colors.primary,
  accentMid: Theme.colors.primaryMid,
  text1: Theme.colors.text,
  text2: Theme.colors.textMuted,
  text3: Theme.colors.textMuted,
  success: Theme.colors.success,
  warning: Theme.colors.warning,
  error: Theme.colors.error,
  blue: "#3B82F6",
  gray: "#6B7280",
};

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  android: { elevation: 2 },
});

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  company_admin: { bg: T.error + "15", text: T.error },
  supervisor:    { bg: T.blue + "15", text: T.blue },
  worker:        { bg: T.gray + "15", text: T.gray },
  default:       { bg: T.success + "15", text: T.success },
};

function StatCard({ icon, iconColor, value, label }: { icon: string; iconColor: string; value: string; label: string }) {
  return (
    <View style={s.statCard}>
      <MaterialCommunityIcons name={icon as any} size={26} color={iconColor} style={{ marginBottom: 4 }} />
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function InfoRow({ icon, text, label }: { icon: string; text: string; label: string }) {
  return (
    <View style={s.infoRow}>
      <View style={s.infoIconWrap}>
        <MaterialCommunityIcons name={icon as any} size={20} color={T.accentMid} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.infoLabelText}>{label}</Text>
        <Text style={s.infoText}>{text}</Text>
      </View>
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
      let conversation = res.data?.data?.data || res.data?.data || res.data;
      if (conversation?.data && !conversation.id) {
        conversation = conversation.data;
      }

      if (conversation?.id) {
        router.push(`/(company)/messages/${conversation.id}?otherName=${encodeURIComponent(staff.fullName ?? "Staff")}` as any);
      } else {
        throw new Error("Invalid response");
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
    Alert.alert("Reject Payout", "Are you sure you want to reject this payout request?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reject",
        style: "destructive",
        onPress: async () => {
          try {
            await api.patch(`/api/company/payouts/${payoutId}/reject`);
            Alert.alert("Success", "Payout rejected.");
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
  const joinedDate = staff.createdAt
    ? new Date(staff.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "Unknown";

  return (
    <SafeAreaView style={s.root} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <MaterialCommunityIcons name="chevron-left" size={32} color={T.text1} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Staff Profile</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <TouchableOpacity onPress={handleMessage} style={s.actionBtn}>
            <MaterialCommunityIcons name="message-text-outline" size={22} color={T.accentMid} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleRemove} style={[s.actionBtn, { backgroundColor: T.error + "15" }]}>
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
            <Image
              source={{ uri: staff.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(staff.fullName || 'S')}&background=1E3A8A&color=fff` }}
              style={s.avatar}
            />
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
            <View style={[s.availBadge, { backgroundColor: staff.isAvailable ? T.success + "15" : T.error + "15" }]}>
              <View style={[s.availDot, { backgroundColor: staff.isAvailable ? T.success : T.error }]} />
              <Text style={[s.availText, { color: staff.isAvailable ? T.success : T.error }]}>
                {staff.isAvailable ? "Available" : "Unavailable"}
              </Text>
            </View>
          </View>
        </View>

        {/* Stats Row */}
        <View style={s.statsRow}>
          <StatCard
            icon="briefcase-check-outline"
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
            icon="comment-text-multiple-outline"
            iconColor={T.blue}
            value={String(staff.totalReviews ?? 0)}
            label="Reviews"
          />
        </View>

        {/* Active Jobs Badge */}
        {(staff.activeRequests ?? 0) > 0 && (
          <View style={s.activeJobBanner}>
            <MaterialCommunityIcons name="lightning-bolt" size={20} color={T.warning} />
            <Text style={s.activeJobText}>{staff.activeRequests} active job{staff.activeRequests > 1 ? "s" : ""} in progress</Text>
          </View>
        )}

        {/* Contact Info */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Contact Information</Text>
          <View style={{ gap: 16 }}>
            <InfoRow icon="email-outline" label="Email Address" text={staff.email ?? "No email"} />
            <InfoRow icon="phone-outline" label="Phone Number" text={staff.phone ?? "No phone"} />
            <InfoRow icon="calendar-outline" label="Date Joined" text={joinedDate} />
          </View>
        </View>

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
            <Text style={s.cardTitle}>Pending Payouts</Text>
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
  actionBtn: { padding: 8, backgroundColor: T.blue + "15", borderRadius: 8 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: T.text1, flex: 1, textAlign: "center", marginLeft: 32 },

  scrollContent: { padding: 16, gap: 16, paddingBottom: 60 },

  heroCard: {
    backgroundColor: T.accent, borderRadius: 24, padding: 28,
    alignItems: "center", gap: 8, ...CARD_SHADOW,
  },
  avatarWrap: { position: "relative", marginBottom: 8 },
  avatar: { width: 88, height: 88, borderRadius: 32, backgroundColor: T.bg },
  statusDot: {
    position: "absolute", bottom: 0, right: 0,
    width: 22, height: 22, borderRadius: 11, borderWidth: 3, borderColor: T.accent,
  },
  heroName: { fontSize: 24, fontWeight: "800", color: "#fff" },
  heroEmail: { fontSize: 14, fontWeight: "500", color: "rgba(255,255,255,0.7)" },
  heroBadgeRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  roleBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12 },
  roleBadgeText: { fontSize: 12, fontWeight: "800", textTransform: "capitalize" },
  availBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12 },
  availDot: { width: 8, height: 8, borderRadius: 4 },
  availText: { fontSize: 12, fontWeight: "800" },

  statsRow: {
    backgroundColor: T.surface, borderRadius: 24, padding: 20,
    flexDirection: "row", alignItems: "center", justifyContent: "space-around",
    borderWidth: 1, borderColor: T.border, ...CARD_SHADOW,
  },
  statCard: { flex: 1, alignItems: "center", gap: 4 },
  statValue: { fontSize: 24, fontWeight: "800", color: T.text1 },
  statLabel: { fontSize: 12, fontWeight: "600", color: T.text3, textAlign: "center" },
  statsDivider: { width: 1, height: 48, backgroundColor: T.border },

  activeJobBanner: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: T.warning + "15", borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: T.warning + "30",
  },
  activeJobText: { fontSize: 14, fontWeight: "700", color: T.warning },

  card: {
    backgroundColor: T.surface, borderRadius: 24, padding: 24,
    borderWidth: 1, borderColor: T.border, gap: 20, ...CARD_SHADOW,
  },
  cardTitle: { fontSize: 16, fontWeight: "800", color: T.text1 },
  
  infoRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  infoIconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: T.blue + "10", alignItems: "center", justifyContent: "center" },
  infoLabelText: { fontSize: 12, fontWeight: "600", color: T.text3, marginBottom: 2, textTransform: "uppercase" },
  infoText: { fontSize: 15, fontWeight: "700", color: T.text1 },

  payoutCard: {
    backgroundColor: T.bg, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: T.border, gap: 16,
  },
  payoutRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  payoutAmount: { fontSize: 24, fontWeight: "800", color: T.accent },
  payoutMethod: { fontSize: 13, fontWeight: "700", color: T.text3, textTransform: "uppercase" },
  payoutActions: { flexDirection: "row", gap: 12 },
  payoutBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  payoutBtnReject: { backgroundColor: T.error + "15" },
  payoutBtnRejectText: { color: T.error, fontWeight: "800" },
  payoutBtnApprove: { backgroundColor: T.success },
  payoutBtnApproveText: { color: "#fff", fontWeight: "800" },

  timeOffCard: {
    flexDirection: "row", alignItems: "center", gap: 16,
    backgroundColor: T.error + "10", padding: 16, borderRadius: 16,
    borderWidth: 1, borderColor: T.error + "30"
  },
  timeOffIcon: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: T.error + "20",
    alignItems: "center", justifyContent: "center"
  },
  timeOffDate: { fontSize: 15, fontWeight: "800", color: T.error },
  timeOffText: { fontSize: 13, fontWeight: "600", color: T.error + "90", marginTop: 2 }
});
