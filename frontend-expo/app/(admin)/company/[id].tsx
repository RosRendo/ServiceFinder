/**
 * Admin Company Details — Obsidian Executive Bento Standard
 */
import React, { useState, useEffect } from "react";
import { Image } from "expo-image";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Platform,
  Modal,
  Image as RNImage,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import api from "@/utils/api";
import { Theme } from "@/constants/theme";
import ErrorState from "@/components/common/ErrorState";
import InitialsAvatar from "@/components/common/InitialsAvatar";
import CredentialInspectionCard from "@/components/admin/CredentialInspectionCard";

const T = Theme.colors;

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: "#0F172A", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 10 },
  android: { elevation: 3 },
});

export default function CompanyDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [company, setCompany] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);
  const [rejectSheetVisible, setRejectSheetVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectReasonError, setRejectReasonError] = useState("");
  const [rejectError, setRejectError] = useState("");

  const fetchCompany = async () => {
    try {
      const response = await api.get(`/api/companies/${id}`);
      const companyData = response.data.data || response.data;
      setCompany(companyData);
    } catch (error) {
      console.error("Failed to fetch company details:", error);
      Alert.alert("Error", "Could not load company details");
      router.back();
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompany();
  }, [id]);

  const handleUpdateStatus = async (status: "verified" | "rejected") => {
    if (status === "verified") {
      Alert.alert(
        "Verify Business",
        `Approve ${company?.name || "this company"}? This marks the business as verified.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Approve",
            onPress: () => submitStatus("verified"),
          },
        ]
      );
      return;
    }
    setRejectReason("");
    setRejectReasonError("");
    setRejectError("");
    setRejectSheetVisible(true);
  };

  const submitStatus = async (status: "verified" | "rejected", reason?: string) => {
    setIsUpdating(true);
    try {
      if (status === "verified") {
        await api.post(`/api/admin/companies/${id}/verify`);
        setRejectSheetVisible(false);
        Toast.show({ type: "success", text1: "Company Verified", text2: `${company?.name || "The company"} is now approved.` });
        router.back();
      } else {
        const res = await api.post(`/api/admin/companies/${id}/reject`, { reason: reason!.trim() });
        setRejectSheetVisible(false);
        Toast.show({
          type: "success",
          text1: "Company Rejected",
          text2: res.data?.message || `${company?.name || "The company"} was rejected.`,
        });
        router.back();
      }
    } catch (error: any) {
      const serverMsg = error.response?.data?.message || `Failed to update company status`;
      if (status === "rejected") {
        setRejectError(typeof serverMsg === "string" ? serverMsg : "Rejection failed.");
      } else {
        Toast.show({
          type: "error",
          text1: "Approve Failed",
          text2: typeof serverMsg === "string" ? serverMsg : "Approval failed.",
        });
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const confirmReject = () => {
    if (!rejectReason.trim()) {
      setRejectReasonError("A rejection reason is required.");
      return;
    }
    submitStatus("rejected", rejectReason.trim());
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return { dotColor: "#059669", label: "VERIFIED ACTIVE" };
      case "reviewing":
        return { dotColor: "#2563EB", label: "UNDER REVIEW" };
      case "rejected":
        return { dotColor: "#DC2626", label: "REJECTED" };
      case "pending":
      default:
        return { dotColor: "#D97706", label: "PENDING REVIEW" };
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={s.centerArea} edges={["top", "left", "right"]}>
        <ActivityIndicator size="large" color="#0F172A" />
      </SafeAreaView>
    );
  }

  if (hasError) {
    return (
      <SafeAreaView style={s.centerArea} edges={["top", "left", "right"]}>
        <ErrorState onRetry={fetchCompany} />
      </SafeAreaView>
    );
  }

  if (!company) return null;

  const isPending = company.verificationStatus === "pending";
  const badge = getStatusBadge(company.verificationStatus);
  const documentUrl =
    company.verificationDocumentUrl || company.businessLicenseUrl || company.logoUrl || "";

  return (
    <View style={s.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.contentScroll}>
        {/* Cover Image & Header Nav */}
        <View style={s.coverArea}>
          {company.coverImageUrl ? (
            <Image source={{ uri: company.coverImageUrl }} style={s.coverImage} contentFit="cover" />
          ) : (
            <View style={s.coverPlaceholder} />
          )}
          <View style={s.coverOverlay} />

          <SafeAreaView edges={["top"]}>
            <View style={s.headerNav}>
              <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                <MaterialCommunityIcons name="arrow-left" size={20} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={s.statusBadge}>
                <View style={[s.statusDot, { backgroundColor: badge.dotColor }]} />
                <Text style={s.statusText}>{badge.label}</Text>
              </View>
            </View>
          </SafeAreaView>
        </View>

        {/* Floating Identity Bento Profile */}
        <View style={s.profileHeader}>
          <View style={s.logoWrap}>
            {company.logoUrl ? (
              <Image source={{ uri: company.logoUrl }} style={s.logoImg} contentFit="cover" />
            ) : (
              <MaterialCommunityIcons name="domain" size={40} color="#64748B" />
            )}
          </View>

          <Text style={s.companyName}>{company.name}</Text>
          <Text style={s.companyReg}>Registration No: {company.registrationNumber || "Unregistered"}</Text>

          {/* Quick Stats Grid Bento */}
          <View style={s.statsRow}>
            <View style={s.statBox}>
              <View style={s.statIconWrap}>
                <MaterialCommunityIcons name="briefcase-outline" size={18} color="#0F172A" />
              </View>
              <Text style={s.statValue}>{company.staff?.length || 0}</Text>
              <Text style={s.statLabel}>Staff</Text>
            </View>
            <View style={s.statBox}>
              <View style={s.statIconWrap}>
                <MaterialCommunityIcons name="cog-outline" size={18} color="#0F172A" />
              </View>
              <Text style={s.statValue}>{company.services?.length || 0}</Text>
              <Text style={s.statLabel}>Services</Text>
            </View>
            <View style={s.statBox}>
              <View style={s.statIconWrap}>
                <MaterialCommunityIcons name="map-marker-distance" size={18} color="#0F172A" />
              </View>
              <Text style={s.statValue}>{company.serviceAreas?.length || 0}</Text>
              <Text style={s.statLabel}>Areas</Text>
            </View>
          </View>
        </View>

        {/* Description Section */}
        {company.description && (
          <View style={s.card}>
            <Text style={s.cardTitle}>About Business</Text>
            <Text style={s.descText}>{company.description}</Text>
          </View>
        )}

        {/* Owner Details Bento Card */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Business Ownership</Text>
          <View style={s.ownerRow}>
            <InitialsAvatar name={company.owner?.fullName || "Company Owner"} size={44} radius={14} />
            <View style={{ flex: 1 }}>
              <Text style={s.ownerName}>{company.owner?.fullName || "Not Specified"}</Text>
              <Text style={s.ownerEmail}>{company.owner?.email || "No email available"}</Text>
            </View>
          </View>
        </View>

        {/* Contact & Business Info */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Business Information</Text>
          <View style={s.infoGrid}>
            <View style={s.infoCell}>
              <View style={s.iconCircle}>
                <MaterialCommunityIcons name="phone-outline" size={18} color="#475569" />
              </View>
              <View>
                <Text style={s.infoLabelText}>Business Hotline</Text>
                <Text style={s.infoText}>{company.phone || company.owner?.phone || "N/A"}</Text>
              </View>
            </View>
            <View style={[s.infoCell, { marginTop: 8 }]}>
              <View style={s.iconCircle}>
                <MaterialCommunityIcons name="map-marker-outline" size={18} color="#475569" />
              </View>
              <View>
                <Text style={s.infoLabelText}>Primary City Location</Text>
                <Text style={s.infoText}>{company.city || "National"}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Verification Credentials Card */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Verification Documents</Text>
          {documentUrl ? (
            <CredentialInspectionCard
              item={{
                companyId: company.id,
                companyName: company.name,
                category: company.businessType || "BUSINESS_LICENSE",
                documentUrl: documentUrl,
                submittedDate: new Date(company.createdAt).toLocaleDateString(),
                status:
                  company.verificationStatus === "verified"
                    ? "VERIFIED"
                    : company.verificationStatus === "rejected"
                    ? "REJECTED"
                    : "PENDING",
              }}
              onVerify={() => handleUpdateStatus("verified")}
              onReject={() => handleUpdateStatus("rejected")}
              onPreview={(url) => setPreviewDocUrl(url)}
            />
          ) : (
            <Text style={s.noneText}>No verification credentials uploaded.</Text>
          )}
        </View>

        <View style={{ height: isPending ? 120 : 40 }} />
      </ScrollView>

      {/* Sticky Bottom Action Bar for Pending */}
      {isPending && (
        <View style={s.bottomActionBar}>
          <SafeAreaView edges={["bottom"]}>
            <View style={s.actionRow}>
              <TouchableOpacity
                style={[s.actionBtn, s.rejectBtn]}
                onPress={() => handleUpdateStatus("rejected")}
                disabled={isUpdating}
                activeOpacity={0.8}
              >
                {isUpdating ? (
                  <ActivityIndicator color="#DC2626" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="close-circle-outline" size={18} color="#DC2626" />
                    <Text style={s.rejectText}>Reject</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.actionBtn, s.approveBtn]}
                onPress={() => handleUpdateStatus("verified")}
                disabled={isUpdating}
                activeOpacity={0.8}
              >
                {isUpdating ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="shield-check-outline" size={18} color="#FFFFFF" />
                    <Text style={s.approveText}>Verify Business</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      )}

      {/* Full Screen Image Preview Modal */}
      <Modal visible={!!previewDocUrl} transparent={true} animationType="fade" onRequestClose={() => setPreviewDocUrl(null)}>
        <View style={s.modalBackdrop}>
          <SafeAreaView style={s.modalSafe}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Credential Document Preview</Text>
              <TouchableOpacity onPress={() => setPreviewDocUrl(null)} style={s.modalCloseBtn}>
                <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <View style={s.modalBody}>
              {previewDocUrl && (
                <RNImage source={{ uri: previewDocUrl }} style={s.modalImage} resizeMode="contain" />
              )}
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  centerArea: { flex: 1, backgroundColor: "#F8FAFC", alignItems: "center", justifyContent: "center" },
  root: { flex: 1, backgroundColor: "#F8FAFC" },
  contentScroll: { paddingBottom: 120 },

  coverArea: { width: "100%", height: 180, position: "relative" },
  coverImage: { width: "100%", height: "100%", position: "absolute" },
  coverPlaceholder: { width: "100%", height: "100%", backgroundColor: "#0F172A", position: "absolute" },
  coverOverlay: { position: "absolute", width: "100%", height: "100%", backgroundColor: "rgba(15, 23, 42, 0.45)" },

  headerNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...CARD_SHADOW,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: "800", color: "#334155", letterSpacing: 0.3 },

  profileHeader: { marginTop: -45, paddingHorizontal: 16, alignItems: "center" },
  logoWrap: {
    width: 80,
    height: 80,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "#F8FAFC",
    marginBottom: 10,
    ...CARD_SHADOW,
  },
  logoImg: { width: "100%", height: "100%" },
  companyName: { fontSize: 22, fontWeight: "800", color: "#0F172A", marginBottom: 3, textAlign: "center", letterSpacing: -0.4 },
  companyReg: { fontSize: 12, fontWeight: "600", color: "#64748B", marginBottom: 16, textAlign: "center" },

  statsRow: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 14,
    width: "100%",
    justifyContent: "space-around",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...CARD_SHADOW,
  },
  statBox: { alignItems: "center", flex: 1 },
  statValue: { fontSize: 18, fontWeight: "800", color: "#0F172A", letterSpacing: -0.5, marginTop: 4 },
  statLabel: { fontSize: 10, fontWeight: "700", color: "#64748B", textTransform: "uppercase", marginTop: 2 },
  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...CARD_SHADOW,
  },
  cardTitle: { fontSize: 12, fontWeight: "800", color: "#64748B", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 },
  descText: { fontSize: 13, color: "#334155", lineHeight: 20 },

  ownerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  ownerName: { fontSize: 14, fontWeight: "700", color: "#0F172A", marginBottom: 2 },
  ownerEmail: { fontSize: 12, color: "#64748B" },

  infoGrid: { gap: 10 },
  infoCell: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconCircle: { width: 34, height: 34, borderRadius: 8, backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0", alignItems: "center", justifyContent: "center" },
  infoLabelText: { fontSize: 10, fontWeight: "700", color: "#94A3B8", marginBottom: 2, textTransform: "uppercase" },
  infoText: { fontSize: 13, fontWeight: "700", color: "#0F172A" },

  noneText: { fontSize: 13, color: "#94A3B8", fontStyle: "italic", textAlign: "center", paddingVertical: 12 },

  bottomActionBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 34 : 16,
    ...CARD_SHADOW,
  },
  actionRow: { flexDirection: "row", gap: 10 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  rejectBtn: {
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
  },
  approveBtn: {
    backgroundColor: "#0F172A",
  },
  rejectText: { fontSize: 13, fontWeight: "700", color: "#DC2626" },
  approveText: { fontSize: 13, fontWeight: "700", color: "#FFFFFF" },

  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.92)" },
  modalSafe: { flex: 1 },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  modalTitle: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  modalCloseBtn: { padding: 4 },
  modalBody: { flex: 1, justifyContent: "center", alignItems: "center", padding: 16 },
  modalImage: { width: "100%", height: "100%" },
});
