/**
 * Admin Dispute Case Detail & Escrow Mediation — Quiet Luxury Standard
 * Integrates DisputeResolutionSheet two-step safeguard.
 */
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import api from "@/utils/api";
import { Theme } from "@/constants/theme";
import ErrorState from "@/components/common/ErrorState";
import DisputeResolutionSheet, {
  DisputeResolutionType,
} from "@/components/admin/DisputeResolutionSheet";

const T = Theme.colors;

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: "#0F172A", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  android: { elevation: 2 },
});

export default function DisputeDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [dispute, setDispute] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [resolutionSheetVisible, setResolutionSheetVisible] = useState(false);
  const [submittingResolution, setSubmittingResolution] = useState(false);

  const fetchDispute = async () => {
    try {
      const res = await api.get(`/api/disputes/${id}`);
      setDispute(res.data?.data ?? res.data);
      setHasError(false);
    } catch {
      console.error("Failed to fetch dispute:", id);
      setHasError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDispute();
  }, [id]);

  const handleSubmitResolution = async (
    resolution: DisputeResolutionType,
    note: string
  ) => {
    setSubmittingResolution(true);
    try {
      const mappedDecision =
        resolution === "REFUND"
          ? "accept_claim"
          : resolution === "RELEASE"
          ? "accept_company"
          : "mediation";

      const totalHeld = Number(dispute?.booking?.totalPrice || dispute?.amount || 0);
      const refundAmount =
        resolution === "REFUND"
          ? totalHeld
          : resolution === "SPLIT"
          ? totalHeld / 2
          : 0;

      await api.put(`/api/admin/disputes/${id}/resolve`, {
        decision: mappedDecision,
        refundAmount: refundAmount,
      });

      setResolutionSheetVisible(false);
      Alert.alert(
        "Resolution Recorded",
        `Decision [${mappedDecision}] with refund $${refundAmount.toFixed(2)} was saved.`,
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (err: any) {
      console.error("Resolution submit failed:", err);
      const serverMsg =
        err?.response?.data?.message ||
        err?.message ||
        "The resolution could not be saved. Nothing was changed.";
      Alert.alert("Resolution Failed", serverMsg, [
        { text: "Keep Editing", style: "cancel" },
        {
          text: "Retry",
          onPress: () =>
            handleSubmitResolution(resolution, note),
        },
      ]);
    } finally {
      setSubmittingResolution(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={s.centerWrap}>
        <ActivityIndicator size="large" color="#0A192F" />
      </SafeAreaView>
    );
  }

  if (hasError) {
    return (
      <SafeAreaView style={s.centerWrap}>
        <ErrorState onRetry={fetchDispute} />
      </SafeAreaView>
    );
  }

  const isResolved = dispute?.status === "resolved";
  const escrowTotal = Number(
    dispute?.booking?.totalPrice || dispute?.amount || 0
  ).toFixed(2);

  return (
    <SafeAreaView style={s.root} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#0F172A" />
        </TouchableOpacity>
        <View style={s.headerTitleBox}>
          <Text style={s.headerTitle}>Dispute Case #{dispute?.id}</Text>
          <Text style={s.headerSubtitle}>Booking Ref: #{dispute?.bookingId || "N/A"}</Text>
        </View>
        <View style={s.statusBadge}>
          <View
            style={[
              s.statusDotSmall,
              { backgroundColor: isResolved ? "#059669" : "#DC2626" },
            ]}
          />
          <Text style={s.statusBadgeText}>
            {dispute?.status?.toUpperCase() || "PENDING"}
          </Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchDispute();
            }}
            tintColor="#0F172A"
          />
        }
      >
        {/* Escrow Value Ribbon */}
        <View style={s.escrowRibbon}>
          <View style={s.escrowLeft}>
            <View style={s.escrowIconBox}>
              <MaterialCommunityIcons name="shield-lock-outline" size={18} color="#94A3B8" />
            </View>
            <View>
              <Text style={s.escrowLabel}>ESCROW FUNDS IN CUSTODY</Text>
              <Text style={s.escrowValue}>${escrowTotal}</Text>
            </View>
          </View>
          <View style={s.escrowStatusPill}>
            <View
              style={[
                s.statusDotSmall,
                { backgroundColor: isResolved ? "#059669" : "#D97706" },
              ]}
            />
            <Text style={s.escrowStatusText}>{isResolved ? "SETTLED" : "ON HOLD"}</Text>
          </View>
        </View>

        {/* Claimant vs Provider Comparison */}
        <View style={s.partiesCard}>
          <Text style={s.sectionTitle}>PARTIES IN DISPUTE</Text>
          <View style={s.partiesRow}>
            <View style={s.partyBlock}>
              <View style={s.partyTagRow}>
                <View style={[s.statusDotSmall, { backgroundColor: "#DC2626" }]} />
                <Text style={s.partyRole}>CLAIMANT</Text>
              </View>
              <Text style={s.partyName}>{dispute?.customer?.fullName || "Customer"}</Text>
              <Text style={s.partyContact}>{dispute?.customer?.email || "No contact"}</Text>
            </View>

            <View style={s.partyDivider} />

            <View style={s.partyBlock}>
              <View style={s.partyTagRow}>
                <View style={[s.statusDotSmall, { backgroundColor: "#334155" }]} />
                <Text style={s.partyRole}>PROVIDER</Text>
              </View>
              <Text style={s.partyName}>
                {dispute?.company?.name || dispute?.booking?.company?.name || "Service Company"}
              </Text>
              <Text style={s.partyContact}>Assigned Service Partner</Text>
            </View>
          </View>
        </View>

        {/* Claim Details */}
        <View style={[s.card, CARD_SHADOW]}>
          <Text style={s.sectionTitle}>CLAIM DETAILS</Text>
          <View style={s.detailRow}>
            <Text style={s.detailLabel}>Dispute Category</Text>
            <Text style={s.detailValue}>
              {dispute?.type?.replace(/_/g, " ")?.toUpperCase() || "SERVICE QUALITY"}
            </Text>
          </View>
          <View style={s.detailRow}>
            <Text style={s.detailLabel}>Filing Date</Text>
            <Text style={s.detailValue}>
              {new Date(dispute?.createdAt).toLocaleDateString([], {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </Text>
          </View>
          <View style={s.divider} />
          <Text style={s.detailLabel}>Stated Issue</Text>
          <Text style={s.claimReasonText}>
            {dispute?.reason || dispute?.description || "No formal statement entered."}
          </Text>
        </View>

        {/* Response Thread (real dispute fields only) */}
        <View style={[s.card, CARD_SHADOW]}>
          <Text style={s.sectionTitle}>RESPONSE THREAD</Text>
          <View style={[s.msgBubble, s.msgCustomer]}>
            <View style={s.msgHeader}>
              <Text style={s.msgSender}>Customer Claim</Text>
              <Text style={s.msgTime}>
                {new Date(dispute?.createdAt).toLocaleDateString([], {
                  month: "short",
                  day: "numeric",
                })}
              </Text>
            </View>
            <Text style={s.msgText}>
              {dispute?.description || "No statement entered."}
            </Text>
          </View>
          {dispute?.companyResponse ? (
            <View style={[s.msgBubble, s.msgProvider]}>
              <View style={s.msgHeader}>
                <Text style={s.msgSender}>Provider Response</Text>
              </View>
              <Text style={s.msgText}>{dispute.companyResponse}</Text>
            </View>
          ) : (
            <Text style={s.noMessagesText}>
              No provider response submitted yet.
            </Text>
          )}
          {dispute?.adminDecision ? (
            <View style={[s.msgBubble, s.msgProvider]}>
              <View style={s.msgHeader}>
                <Text style={s.msgSender}>Admin Decision</Text>
              </View>
              <Text style={s.msgText}>
                {dispute.adminDecision.replace(/_/g, " ")}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Floating Bottom Action Bar */}
      {!isResolved && (
        <View style={s.bottomActionBar}>
          <TouchableOpacity
            style={s.arbitrateBtn}
            onPress={() => setResolutionSheetVisible(true)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="scale-balance" size={18} color="#FFFFFF" />
            <Text style={s.arbitrateBtnText}>Open Settlement Safeguard</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Two-Step Confirmation Dispute Resolution Sheet */}
      <DisputeResolutionSheet
        visible={resolutionSheetVisible}
        dispute={dispute}
        onClose={() => setResolutionSheetVisible(false)}
        onSubmitResolution={handleSubmitResolution}
        isLoading={submittingResolution}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  centerWrap: { flex: 1, backgroundColor: "#F8FAFC", alignItems: "center", justifyContent: "center" },
  root: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backBtn: { padding: 6, marginLeft: -4, marginRight: 8 },
  headerTitleBox: { flex: 1 },
  headerTitle: { fontSize: 17, fontWeight: "800", color: "#0F172A" },
  headerSubtitle: { fontSize: 12, color: "#64748B", marginTop: 2 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  statusDotSmall: { width: 6, height: 6, borderRadius: 3 },
  statusBadgeText: { fontSize: 10, fontWeight: "800", color: "#334155", letterSpacing: 0.4 },

  content: { padding: 16, gap: 14 },

  escrowRibbon: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#0F172A",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  escrowLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  escrowIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#1E293B",
    alignItems: "center",
    justifyContent: "center",
  },
  escrowLabel: { fontSize: 10, fontWeight: "800", color: "#94A3B8", letterSpacing: 0.6 },
  escrowValue: { fontSize: 22, fontWeight: "900", color: "#FFFFFF", letterSpacing: -0.5 },
  escrowStatusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  escrowStatusText: { fontSize: 10, fontWeight: "800", color: "#FFFFFF", letterSpacing: 0.5 },

  partiesCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sectionTitle: { fontSize: 11, fontWeight: "800", color: "#64748B", letterSpacing: 0.6, marginBottom: 12 },
  partiesRow: { flexDirection: "row", gap: 12 },
  partyBlock: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  partyTagRow: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 4 },
  partyRole: { fontSize: 9, fontWeight: "800", color: "#94A3B8", letterSpacing: 0.4 },
  partyName: { fontSize: 13, fontWeight: "700", color: "#0F172A", marginBottom: 2 },
  partyContact: { fontSize: 11, color: "#64748B" },
  partyDivider: { width: 1, backgroundColor: "#E2E8F0" },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  detailRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  detailLabel: { fontSize: 12, color: "#64748B", fontWeight: "600" },
  detailValue: { fontSize: 13, fontWeight: "700", color: "#0F172A" },
  divider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 10 },
  claimReasonText: { fontSize: 13, color: "#334155", lineHeight: 20, marginTop: 4 },

  msgBubble: { borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1 },
  msgCustomer: { backgroundColor: "#FFFFFF", borderColor: "#E2E8F0" },
  msgProvider: { backgroundColor: "#F8FAFC", borderColor: "#E2E8F0" },
  msgHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  msgSender: { fontSize: 11, fontWeight: "800", color: "#0F172A" },
  msgTime: { fontSize: 10, color: "#64748B" },
  msgText: { fontSize: 13, color: "#334155", lineHeight: 18 },
  noMessagesText: { fontSize: 13, color: "#94A3B8", fontStyle: "italic", textAlign: "center", paddingVertical: 12 },

  bottomActionBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 34 : 16,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    ...CARD_SHADOW,
  },
  arbitrateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#0F172A",
    borderRadius: 12,
    paddingVertical: 14,
  },
  arbitrateBtnText: { fontSize: 14, fontWeight: "800", color: "#FFFFFF" },
});
