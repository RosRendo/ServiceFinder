/**
 * Admin Approvals Queue — Quiet Luxury Executive Standard
 */
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Platform,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Image as RNImage,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { Image } from "expo-image";
import Toast from "react-native-toast-message";
import api from "@/utils/api";
import { useSidebarStore } from "@/store/sidebarStore";
import { FlashList as ShopifyFlashList } from "@shopify/flash-list";
import { useTranslation } from "react-i18next";
import ErrorState from "@/components/common/ErrorState";
import { Theme } from "@/constants/theme";
import CredentialInspectionCard from "@/components/admin/CredentialInspectionCard";

const FlashList = ShopifyFlashList as any;
const T = Theme.colors;

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: "#0F172A", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 10 },
  android: { elevation: 3 },
});

export default function Queue() {
  const router = useRouter();
  const openSidebar = useSidebarStore((s) => s.setAdminOpen);
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState("pending");
  const [companies, setCompanies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);
  const [expandedCompanyId, setExpandedCompanyId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectReasonError, setRejectReasonError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchQueue = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const response = await api.get(`/api/admin/companies?status=${activeTab}`);
      const data = response.data?.data ?? [];
      setCompanies(Array.isArray(data) ? data : []);
      setHasError(false);
    } catch (error) {
      console.error("Failed to fetch queue:", error);
      setHasError(true);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchQueue();
    }, [fetchQueue])
  );

  const handleApprove = useCallback(
    async (companyId: string, companyName?: string) => {
      Alert.alert(
        "Verify Business",
        `Approve ${companyName || "this company"}? This marks the business as verified.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Approve",
            style: "default",
            onPress: async () => {
              setActionLoading(true);
              try {
                await api.post(`/api/admin/companies/${companyId}/verify`);
                Toast.show({ type: "success", text1: "Company Verified", text2: `${companyName || "The company"} is now approved.` });
                fetchQueue();
              } catch (error: any) {
                const serverMsg = error?.response?.data?.message || "Approve failed.";
                Toast.show({
                  type: "error",
                  text1: "Approve Failed",
                  text2: typeof serverMsg === "string" ? serverMsg : "Approval failed.",
                });
              } finally {
                setActionLoading(false);
              }
            },
          },
        ]
      );
    },
    [fetchQueue]
  );

  const openReject = useCallback(
    (companyId: string) => {
      const company = companies.find((c) => c.id === companyId);
      setRejectReason("");
      setRejectReasonError("");
      setRejectTarget(company || { id: companyId });
    },
    [companies]
  );

  const confirmReject = useCallback(async () => {
    if (!rejectTarget) return;
    if (!rejectReason.trim()) {
      setRejectReasonError("A rejection reason is required.");
      return;
    }
    setActionLoading(true);
    try {
      const res = await api.post(`/api/admin/companies/${rejectTarget.id}/reject`, {
        reason: rejectReason.trim(),
      });
      Toast.show({
        type: "success",
        text1: "Company Rejected",
        text2: res.data?.message || `${rejectTarget.name || "The company"} was rejected.`,
      });
      setRejectTarget(null);
      fetchQueue();
    } catch (error: any) {
      const serverMsg = error?.response?.data?.message || "Reject failed.";
      Toast.show({
        type: "error",
        text1: "Reject Failed",
        text2: typeof serverMsg === "string" ? serverMsg : "Rejection failed.",
      });
    } finally {
      setActionLoading(false);
    }
  }, [rejectTarget, rejectReason, fetchQueue]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "verified":
        return { dotColor: "#059669", label: "VERIFIED" };
      case "reviewing":
        return { dotColor: "#2563EB", label: "REVIEWING" };
      case "pending":
        return { dotColor: "#D97706", label: "PENDING" };
      case "rejected":
        return { dotColor: "#DC2626", label: "REJECTED" };
      default:
        return { dotColor: "#64748B", label: status?.toUpperCase() || "UNKNOWN" };
    }
  };

  const tabs = [
    { id: "pending", label: "Pending" },
    { id: "reviewing", label: "Reviewing" },
    { id: "verified", label: "Approved" },
    { id: "rejected", label: "Rejected" },
  ];

  return (
    <SafeAreaView style={s.root} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <TouchableOpacity
            onPress={() => openSidebar(true)}
            style={s.menuBtn}
            accessibilityRole="button"
            accessibilityLabel={t("common.openMenu")}
          >
            <MaterialCommunityIcons name="menu" size={26} color="#0F172A" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>KYC & Approvals</Text>
        </View>
        <View style={s.badge}>
          <Text style={s.badgeText}>{!isLoading ? companies.length : "—"}</Text>
        </View>
      </View>

      {/* Segmented Status Tabs (Ergonomic Single-Axis Scrolling) */}
      <View style={s.tabWrapper}>
        <View style={s.tabContainer}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={[s.tabButton, isActive && s.tabButtonActive]}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
              >
                <Text style={[s.tabText, isActive && s.tabTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Queue Items List */}
      {isLoading && !refreshing ? (
        <View style={s.loadingBox}>
          <ActivityIndicator size="large" color="#0F172A" />
        </View>
      ) : hasError && companies.length === 0 ? (
        <ErrorState onRetry={() => fetchQueue()} />
      ) : (
        <FlashList
          data={companies}
          keyExtractor={(item: any) => item.id}
          estimatedItemSize={260}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchQueue(true)} tintColor="#0F172A" />
          }
          contentContainerStyle={s.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.emptyBox}>
              <View style={s.emptyIconCircle}>
                <MaterialCommunityIcons name="shield-check" size={36} color="#0F172A" />
              </View>
              <Text style={s.emptyText}>All Clear in {tabs.find((t) => t.id === activeTab)?.label}</Text>
              <Text style={s.emptySubText}>Zero applications currently waiting in this status category.</Text>
            </View>
          }
          renderItem={({ item: company }: any) => {
            const sStyle = getStatusConfig(company.verificationStatus);
            const createdTime = new Date(company.createdAt).getTime();
            const elapsedHours = Math.max(0, (Date.now() - createdTime) / 3600000);
            const remainingHours = Math.max(0, 24 - elapsedHours);
            const isCritical = remainingHours <= 4;
            const isWarning = remainingHours > 4 && remainingHours <= 12;
            const slaColor = isCritical ? "#DC2626" : isWarning ? "#D97706" : "#059669";
            const slaLabel = remainingHours === 0 ? "SLA Breached" : `${Math.round(remainingHours)}h SLA`;
            const slaPercent = Math.min(100, Math.round((remainingHours / 24) * 100));

            const isExpanded = expandedCompanyId === company.id;
            const documentUrl = company.verificationDocumentUrl || company.businessLicenseUrl || company.logoUrl || "";

            return (
              <View style={[s.companyCard, CARD_SHADOW]}>
                {/* SLA Urgency Bar for Pending */}
                {activeTab === "pending" && (
                  <View style={s.slaBarWrap}>
                    <View style={s.slaHeader}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                        <View style={[s.statusDotSmall, { backgroundColor: slaColor }]} />
                        <Text style={[s.slaText, { color: "#0F172A" }]}>{slaLabel}</Text>
                      </View>
                      <Text style={s.slaWindowText}>{slaPercent}% remaining</Text>
                    </View>
                    <View style={s.slaTrack}>
                      <View style={[s.slaFill, { width: `${slaPercent}%`, backgroundColor: slaColor }]} />
                    </View>
                  </View>
                )}

                {/* Company Main Header */}
                <TouchableOpacity
                  style={s.cardHeader}
                  onPress={() => router.push(`/(admin)/company/${company.id}` as any)}
                  activeOpacity={0.8}
                >
                  <View style={s.logoWrap}>
                    {company.logoUrl ? (
                      <Image source={{ uri: company.logoUrl }} style={s.logo} contentFit="cover" />
                    ) : (
                      <MaterialCommunityIcons name="domain" size={22} color="#64748B" />
                    )}
                  </View>
                  <View style={s.cardHeaderInfo}>
                    <Text style={s.companyName} numberOfLines={1}>
                      {company.name}
                    </Text>
                    <Text style={s.regNumber} numberOfLines={1}>
                      {company.registrationNumber ? `REG: ${company.registrationNumber}` : "Pending Registration"}
                    </Text>
                  </View>
                  <View style={s.statusBadge}>
                    <View style={[s.statusDot, { backgroundColor: sStyle.dotColor }]} />
                    <Text style={s.statusText}>{sStyle.label}</Text>
                  </View>
                </TouchableOpacity>

                {/* Structured Two-Column Business Ledger */}
                <View style={s.ledgerCard}>
                  <View style={s.ledgerRow}>
                    <View style={s.ledgerCol}>
                      <Text style={s.ledgerLabel}>OWNER / PRINCIPAL</Text>
                      <Text style={s.ledgerValue} numberOfLines={1}>
                        {company.owner?.fullName || "Not Specified"}
                      </Text>
                    </View>
                    <View style={s.ledgerDividerVert} />
                    <View style={s.ledgerCol}>
                      <Text style={s.ledgerLabel}>CONTACT</Text>
                      <Text style={s.ledgerValue} numberOfLines={1}>
                        {company.phone || company.email || "No contact"}
                      </Text>
                    </View>
                  </View>

                  <View style={s.ledgerDividerHoriz} />

                  <View style={s.ledgerRow}>
                    <View style={s.ledgerCol}>
                      <Text style={s.ledgerLabel}>LOCATION / CITY</Text>
                      <Text style={s.ledgerValue} numberOfLines={1}>
                        {company.city || company.address || "Unspecified"}
                      </Text>
                    </View>
                    <View style={s.ledgerDividerVert} />
                    <View style={s.ledgerCol}>
                      <Text style={s.ledgerLabel}>SUBMISSION DATE</Text>
                      <Text style={s.ledgerValue} numberOfLines={1}>
                        {new Date(company.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Document Inspection Drawer Trigger */}
                {documentUrl ? (
                  <View style={{ marginBottom: 10 }}>
                    <TouchableOpacity
                      style={s.inspectTriggerBtn}
                      onPress={() => setExpandedCompanyId(isExpanded ? null : company.id)}
                      activeOpacity={0.8}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <MaterialCommunityIcons name="file-certificate-outline" size={15} color="#0F172A" />
                        <Text style={s.inspectTriggerText}>
                          {isExpanded ? "Collapse Inspection Ledger" : "Inspect Business Credentials"}
                        </Text>
                      </View>
                      <MaterialCommunityIcons
                        name={isExpanded ? "chevron-up" : "chevron-down"}
                        size={16}
                        color="#0F172A"
                      />
                    </TouchableOpacity>

                    {/* Inline Credential Inspection Card Component */}
                    {isExpanded && (
                      <View style={{ marginTop: 8 }}>
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
                          onVerify={(id) => handleApprove(id, company.name)}
                          onReject={(id) => openReject(id)}
                          onPreview={(url) => setPreviewDocUrl(url)}
                        />
                      </View>
                    )}
                  </View>
                ) : null}

                {/* Action Buttons for Pending / Reviewing */}
                {(activeTab === "pending" || activeTab === "reviewing") && !isExpanded && (
                  <View style={s.actionRow}>
                    <TouchableOpacity
                      style={[s.actionBtn, s.rejectBtn]}
                      onPress={() => openReject(company.id)}
                      activeOpacity={0.8}
                      disabled={actionLoading}
                    >
                      <MaterialCommunityIcons name="close" size={15} color="#DC2626" />
                      <Text style={s.rejectText}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[s.actionBtn, s.approveBtn]}
                      onPress={() => handleApprove(company.id, company.name)}
                      activeOpacity={0.8}
                      disabled={actionLoading}
                    >
                      <MaterialCommunityIcons name="check" size={15} color="#FFFFFF" />
                      <Text style={s.approveText}>Verify Business</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          }}
        />
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

      {/* Reject Reason Modal */}
      <Modal visible={!!rejectTarget} transparent animationType="fade" onRequestClose={() => setRejectTarget(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={s.rejectModalOverlay}>
          <View style={s.rejectModalContainer}>
            <MaterialCommunityIcons name="close-circle-outline" size={32} color="#DC2626" />
            <Text style={s.rejectModalTitle}>Reject Application</Text>
            <Text style={s.rejectModalDesc}>
              Reject the verification of {rejectTarget?.name || "this company"}. The reason you enter is
              sent to the server and shown to the applicant.
            </Text>
            <TextInput
              style={[s.rejectReasonInput, rejectReasonError ? s.rejectReasonInputError : null]}
              placeholder="Rejection reason (required)"
              placeholderTextColor="#94A3B8"
              value={rejectReason}
              onChangeText={(t) => {
                setRejectReason(t);
                if (rejectReasonError) setRejectReasonError("");
              }}
              multiline
              textAlignVertical="top"
            />
            {rejectReasonError ? <Text style={s.rejectReasonErrorText}>{rejectReasonError}</Text> : null}
            <View style={s.rejectModalActions}>
              <TouchableOpacity
                style={s.rejectModalBtnSecondary}
                onPress={() => setRejectTarget(null)}
                disabled={actionLoading}
              >
                <Text style={s.rejectModalBtnSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.rejectModalBtnPrimary, actionLoading && { opacity: 0.7 }]}
                onPress={confirmReject}
                disabled={actionLoading}
              >
                <Text style={s.rejectModalBtnPrimaryText}>{actionLoading ? "Rejecting…" : "Reject"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  menuBtn: { marginLeft: -6, padding: 6 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#0F172A", letterSpacing: -0.3 },
  badge: {
    backgroundColor: "#0F172A",
    minWidth: 28,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  badgeText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },

  tabWrapper: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#F8FAFC" },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#E2E8F0",
    borderRadius: 12,
    padding: 3,
  },
  tabButton: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 9 },
  tabButtonActive: {
    backgroundColor: "#0F172A",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: { fontSize: 12, fontWeight: "700", color: "#64748B" },
  tabTextActive: { color: "#FFFFFF" },

  // paddingBottom: 120 guarantees content does not hide behind the floating tab bar
  listContent: { padding: 16, paddingBottom: 120 },
  loadingBox: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyBox: { alignItems: "center", paddingVertical: 80 },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyText: { fontSize: 16, fontWeight: "800", color: "#0F172A", marginBottom: 6 },
  emptySubText: { fontSize: 13, color: "#64748B", textAlign: "center", paddingHorizontal: 32 },

  companyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  slaBarWrap: {
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  slaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  statusDotSmall: { width: 6, height: 6, borderRadius: 3 },
  slaText: { fontSize: 11, fontWeight: "800" },
  slaWindowText: { fontSize: 10, color: "#94A3B8" },
  slaTrack: { height: 4, backgroundColor: "#F1F5F9", borderRadius: 2, overflow: "hidden" },
  slaFill: { height: "100%", borderRadius: 2 },

  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  logoWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  logo: { width: "100%", height: "100%" },
  cardHeaderInfo: { flex: 1 },
  companyName: { fontSize: 15, fontWeight: "700", color: "#0F172A", marginBottom: 2 },
  regNumber: { fontSize: 11, fontWeight: "600", color: "#64748B" },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignSelf: "flex-start",
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: "800", color: "#334155", letterSpacing: 0.4 },

  ledgerCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  ledgerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  ledgerCol: {
    flex: 1,
  },
  ledgerLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  ledgerValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
  },
  ledgerDividerVert: {
    width: 1,
    height: 28,
    backgroundColor: "#E2E8F0",
    marginHorizontal: 12,
  },
  ledgerDividerHoriz: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 8,
  },

  inspectTriggerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  inspectTriggerText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
  },

  actionRow: { flexDirection: "row", gap: 10 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
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
  rejectText: { fontSize: 12, fontWeight: "700", color: "#DC2626" },
  approveText: { fontSize: 12, fontWeight: "700", color: "#FFFFFF" },

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

  rejectModalOverlay: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.7)", justifyContent: "center", alignItems: "center", padding: 24 },
  rejectModalContainer: { width: "100%", maxWidth: 400, backgroundColor: "#FFFFFF", borderRadius: 20, padding: 24, alignItems: "center", borderWidth: 1, borderColor: "#E2E8F0" },
  rejectModalTitle: { fontSize: 17, fontWeight: "800", color: "#0F172A", marginTop: 10 },
  rejectModalDesc: { fontSize: 13, color: "#64748B", textAlign: "center", lineHeight: 18, marginTop: 6, marginBottom: 16 },
  rejectReasonInput: { width: "100%", minHeight: 70, maxHeight: 110, backgroundColor: "#F8FAFC", borderRadius: 10, borderWidth: 1.5, borderColor: "#E2E8F0", padding: 10, fontSize: 13, color: "#0F172A", marginBottom: 6 },
  rejectReasonInputError: { borderColor: "#DC2626" },
  rejectReasonErrorText: { fontSize: 11, fontWeight: "600", color: "#DC2626", alignSelf: "flex-start", marginBottom: 6 },
  rejectModalActions: { flexDirection: "row", gap: 12, width: "100%" },
  rejectModalBtnSecondary: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center", backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0" },
  rejectModalBtnSecondaryText: { fontSize: 13, fontWeight: "700", color: "#64748B" },
  rejectModalBtnPrimary: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center", backgroundColor: "#DC2626" },
  rejectModalBtnPrimaryText: { fontSize: 13, fontWeight: "700", color: "#FFFFFF" },
});
