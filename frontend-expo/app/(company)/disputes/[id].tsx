/**
 * Company Dispute Resolution Dossier — Executive Provider Cockpit
 */
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
  StyleSheet,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { api } from "@/store/authStore";
import ErrorState from "@/components/common/ErrorState";

type DisputeStatus = "open" | "responded" | "investigating" | "resolved" | "closed";

const STATUS_CONFIG: Record<DisputeStatus, { label: string; dotColor: string }> = {
  open:          { label: "Action Required", dotColor: "#D97706" },
  responded:     { label: "Responded",       dotColor: "#0284C7" },
  investigating: { label: "Under Review",    dotColor: "#334155" },
  resolved:      { label: "Resolved",        dotColor: "#059669" },
  closed:        { label: "Closed",          dotColor: "#94A3B8" },
};

export default function CompanyDisputeDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [dispute, setDispute] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [responseText, setResponseText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchDispute = useCallback(async (isRefresh = false) => {
    if (!id) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await api.get(`/api/disputes/${id}`);
      const payload = res.data?.data ?? res.data;
      setDispute(payload?.dispute || payload);
      setHasError(false);
    } catch (err) {
      console.error("Failed to load dispute dossier", err);
      setHasError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDispute();
  }, [fetchDispute]);

  const handleSubmitResponse = async () => {
    if (!responseText.trim()) {
      return Alert.alert("Required", "Please provide a formal counter-statement or explanation.");
    }

    setSubmitting(true);
    try {
      await api.post(`/api/company/disputes/${id}/response`, {
        response: responseText.trim(),
      });
      Alert.alert("Response Submitted", "Your explanation has been recorded and submitted to platform arbitration.");
      setResponseText("");
      fetchDispute(true);
    } catch (err: any) {
      Alert.alert("Submission Failed", err.response?.data?.message || "Could not submit response. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={s.root} edges={["top", "left", "right"]}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Claim Dossier</Text>
        </View>
        <View style={s.centerBox}>
          <ActivityIndicator size="large" color="#0F172A" />
        </View>
      </SafeAreaView>
    );
  }

  if (hasError || !dispute) {
    return (
      <SafeAreaView style={s.root} edges={["top", "left", "right"]}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Claim Dossier</Text>
        </View>
        <ErrorState onRetry={() => fetchDispute()} />
      </SafeAreaView>
    );
  }

  const sCfg = STATUS_CONFIG[dispute.status as DisputeStatus] ?? { label: dispute.status || "Unknown", dotColor: "#94A3B8" };
  const dateFormatted = dispute.createdAt
    ? new Date(dispute.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "Recent";

  let photos: string[] = [];
  try {
    if (dispute.photos) {
      photos = typeof dispute.photos === "string" ? JSON.parse(dispute.photos) : (Array.isArray(dispute.photos) ? dispute.photos : []);
    }
  } catch {
    photos = [];
  }

  const hasResponded = !!dispute.companyResponse || dispute.status !== "open";

  return (
    <SafeAreaView style={s.root} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#0F172A" />
          </TouchableOpacity>
          <View>
            <Text style={s.headerTitle}>DSP-{dispute.id}</Text>
            <Text style={s.headerSubTitle}>Arbitration File</Text>
          </View>
        </View>
        <View style={s.statusTag}>
          <View style={[s.statusDot, { backgroundColor: sCfg.dotColor }]} />
          <Text style={s.statusText}>{sCfg.label}</Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchDispute(true)}
            tintColor="#0F172A"
          />
        }
      >
        {/* Escrow Custody Banner */}
        <View style={s.escrowBanner}>
          <MaterialCommunityIcons name="shield-lock-outline" size={20} color="#D97706" />
          <View style={{ flex: 1 }}>
            <Text style={s.escrowBannerTitle}>Dispute Open</Text>
            <Text style={s.escrowBannerDesc}>
              This booking's payment status is managed by platform support during mediation. Final escrow outcome will be confirmed on resolution.
            </Text>
          </View>
        </View>

        {/* Claim Summary Card */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Client Claim Summary</Text>

          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Claim Category</Text>
            <Text style={s.infoValueBold}>
              {dispute.type ? dispute.type.replace(/_/g, " ").toUpperCase() : "GENERAL COMPLAINT"}
            </Text>
          </View>
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Filing Timestamp</Text>
            <Text style={s.infoValue}>{dateFormatted}</Text>
          </View>
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Claimant Client</Text>
            <Text style={s.infoValue}>{dispute.customer?.fullName || dispute.customer?.name || "Client"}</Text>
          </View>

          {dispute.bookingId && (
            <TouchableOpacity
              style={s.bookingLinkBtn}
              onPress={() => router.push(`/(company)/booking/${dispute.bookingId}` as any)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="calendar-check" size={16} color="#0F172A" />
              <Text style={s.bookingLinkText}>Inspect Order Desk #{dispute.bookingId}</Text>
              <MaterialCommunityIcons name="arrow-top-right" size={16} color="#64748B" />
            </TouchableOpacity>
          )}

          <Text style={s.claimStatementLabel}>Client Stated Reason:</Text>
          <View style={s.claimTextBox}>
            <Text style={s.claimText}>{dispute.description || "No detailed description provided."}</Text>
          </View>

          {/* Evidence Photos */}
          {photos.length > 0 && (
            <View style={s.photosSection}>
              <Text style={s.photosLabel}>Claimant Photo Evidence ({photos.length})</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.photosRow}>
                {photos.map((uri, idx) => (
                  <Image key={idx} source={{ uri }} style={s.photoThumb} />
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Provider Official Response */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Company Defense & Counter-Evidence</Text>

          {hasResponded ? (
            <View style={s.respondedBox}>
              <View style={s.respondedHeader}>
                <MaterialCommunityIcons name="check-circle" size={16} color="#059669" />
                <Text style={s.respondedTitle}>Formal Response Filed</Text>
              </View>
              <Text style={s.respondedBody}>
                {dispute.companyResponse || "Your official statement has been submitted to mediation officers."}
              </Text>
              <Text style={s.respondedNote}>
                Platform administrators are reviewing statements and evidence from both parties.
              </Text>
            </View>
          ) : (
            <View style={s.responseForm}>
              <Text style={s.formHelp}>
                Provide an objective statement explaining your crew's deliverables, work timeline, or any extenuating factors.
              </Text>

              <TextInput
                style={s.responseInput}
                placeholder="Type your official explanation / counter-evidence summary..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={4}
                value={responseText}
                onChangeText={setResponseText}
                textAlignVertical="top"
              />

              <TouchableOpacity
                style={s.submitBtn}
                onPress={handleSubmitResponse}
                disabled={submitting}
                activeOpacity={0.85}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="send" size={16} color="#FFFFFF" />
                    <Text style={s.submitBtnText}>Submit Defense to Arbitration</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Administrative Resolution (if decided) */}
        {dispute.adminDecision && (
          <View style={s.resolutionCard}>
            <View style={s.resolutionHeader}>
              <MaterialCommunityIcons name="gavel" size={18} color="#0F172A" />
              <Text style={s.resolutionTitle}>Official Arbitration Ruling</Text>
            </View>
            <Text style={s.resolutionDecision}>
              Ruling: {dispute.adminDecision.replace(/_/g, " ").toUpperCase()}
            </Text>
            {dispute.refundAmount ? (
              <Text style={s.resolutionRefund}>
                Refund Amount Mandated: ${parseFloat(dispute.refundAmount).toFixed(2)}
              </Text>
            ) : null}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  backBtn: { marginLeft: -6, padding: 6 },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#0F172A", letterSpacing: -0.2 },
  headerSubTitle: { fontSize: 11, color: "#64748B", fontWeight: "500" },
  statusTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: "600", color: "#334155" },

  centerBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  scrollContent: { padding: 16, paddingBottom: 120, gap: 14 },

  escrowBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderRadius: 12,
    padding: 14,
  },
  escrowBannerTitle: { fontSize: 13, fontWeight: "700", color: "#92400E", marginBottom: 2 },
  escrowBannerDesc: { fontSize: 12, color: "#78350F", lineHeight: 17 },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardTitle: { fontSize: 14, fontWeight: "700", color: "#0F172A", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.3 },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  infoLabel: { fontSize: 13, color: "#64748B", fontWeight: "500" },
  infoValue: { fontSize: 13, color: "#0F172A", fontWeight: "600" },
  infoValueBold: { fontSize: 13, color: "#0F172A", fontWeight: "700" },

  bookingLinkBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 10,
    marginBottom: 12,
  },
  bookingLinkText: { flex: 1, fontSize: 13, fontWeight: "600", color: "#0F172A" },

  claimStatementLabel: { fontSize: 12, fontWeight: "700", color: "#475569", textTransform: "uppercase", marginBottom: 6 },
  claimTextBox: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  claimText: { fontSize: 13, color: "#334155", lineHeight: 19 },

  photosSection: { marginTop: 6 },
  photosLabel: { fontSize: 12, fontWeight: "700", color: "#475569", textTransform: "uppercase", marginBottom: 8 },
  photosRow: { gap: 8 },
  photoThumb: { width: 90, height: 90, borderRadius: 8, borderWidth: 1, borderColor: "#E2E8F0" },

  respondedBox: {
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    borderRadius: 8,
    padding: 12,
  },
  respondedHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  respondedTitle: { fontSize: 13, fontWeight: "700", color: "#166534" },
  respondedBody: { fontSize: 13, color: "#14532D", lineHeight: 18, marginBottom: 8 },
  respondedNote: { fontSize: 11, color: "#15803D", fontStyle: "italic" },

  responseForm: { gap: 10 },
  formHelp: { fontSize: 12, color: "#64748B", lineHeight: 17 },
  responseInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    padding: 12,
    fontSize: 13,
    color: "#0F172A",
    minHeight: 90,
    textAlignVertical: "top",
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#0F172A",
    borderRadius: 8,
    height: 44,
  },
  submitBtnText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },

  resolutionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  resolutionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  resolutionTitle: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  resolutionDecision: { fontSize: 13, fontWeight: "600", color: "#334155", marginTop: 2 },
  resolutionRefund: { fontSize: 13, fontWeight: "700", color: "#DC2626", marginTop: 4 },
});
