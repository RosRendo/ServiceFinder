import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Theme } from "@/constants/theme";

const T = Theme.colors;

export interface DisputeCaseSummary {
  id: string;
  bookingId?: string;
  type?: string;
  status?: string;
  reason?: string;
  description?: string;
  escrowAmount?: number | string;
  amount?: number | string;
  customer?: { fullName?: string; name?: string; email?: string };
  company?: { name?: string };
  booking?: { totalPrice?: number | string; company?: { name?: string } };
}

export type DisputeResolutionType = "REFUND" | "SPLIT" | "RELEASE";

export interface DisputeResolutionSheetProps {
  visible: boolean;
  dispute: DisputeCaseSummary | null;
  onClose: () => void;
  onSubmitResolution: (resolution: DisputeResolutionType, note: string) => Promise<void>;
  isLoading?: boolean;
}

const RESOLUTION_OPTIONS: {
  type: DisputeResolutionType;
  title: string;
  description: string;
  icon: string;
  color: string;
}[] = [
  {
    type: "REFUND",
    title: "Full Customer Refund",
    description: "Return 100% of escrow funds back to customer payment method.",
    icon: "cash-refund",
    color: "#EF4444",
  },
  {
    type: "SPLIT",
    title: "50 / 50 Escrow Split",
    description: "Apportion half to customer refund and half to service provider.",
    icon: "scale-balance",
    color: "#F59E0B",
  },
  {
    type: "RELEASE",
    title: "Release to Provider",
    description: "Dismiss customer claim and disburse escrow funds to provider.",
    icon: "bank-transfer",
    color: "#10B981",
  },
];

export default function DisputeResolutionSheet({
  visible,
  dispute,
  onClose,
  onSubmitResolution,
  isLoading = false,
}: DisputeResolutionSheetProps) {
  const [selectedResolution, setSelectedResolution] = useState<DisputeResolutionType | null>(null);
  const [auditNote, setAuditNote] = useState("");
  const [step, setStep] = useState<1 | 2>(1); // Step 1: Decision & Note, Step 2: Binding Safeguard Confirmation
  const [errorMsg, setErrorMsg] = useState("");

  if (!visible || !dispute) return null;

  const escrowTotal = Number(
    dispute.escrowAmount || dispute.amount || dispute.booking?.totalPrice || 0
  ).toFixed(2);

  const handleNextStep = () => {
    if (!selectedResolution) {
      setErrorMsg("Please select a settlement decision.");
      return;
    }
    if (!auditNote.trim() || auditNote.trim().length < 5) {
      setErrorMsg("A brief audit reason (minimum 5 characters) is required.");
      return;
    }
    setErrorMsg("");
    setStep(2);
  };

  const handleConfirm = async () => {
    if (!selectedResolution) return;
    try {
      await onSubmitResolution(selectedResolution, auditNote.trim());
      // Reset state on successful submission
      setStep(1);
      setSelectedResolution(null);
      setAuditNote("");
    } catch (e) {
      console.error(e);
    }
  };

  const handleClose = () => {
    setStep(1);
    setSelectedResolution(null);
    setAuditNote("");
    setErrorMsg("");
    onClose();
  };

  const selectedOpt = RESOLUTION_OPTIONS.find((r) => r.type === selectedResolution);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={s.backdrop}>
        <SafeAreaView style={s.safeWrap} edges={["bottom"]}>
          <View style={s.sheet}>
            {/* Sheet Handle */}
            <View style={s.handleBar} />

            {/* Header */}
            <View style={s.header}>
              <View>
                <Text style={s.title}>
                  {step === 1 ? "Arbitrate Dispute" : "Confirm Settlement Safeguard"}
                </Text>
                <Text style={s.caseId}>Case #{dispute.id} • Escrow: ${escrowTotal}</Text>
              </View>
              <TouchableOpacity onPress={handleClose} style={s.closeBtn}>
                <MaterialCommunityIcons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.body}>
              {step === 1 ? (
                <>
                  <Text style={s.sectionLabel}>CHOOSE SETTLEMENT ACTION</Text>
                  <View style={s.optionsList}>
                    {RESOLUTION_OPTIONS.map((opt) => {
                      const isSelected = selectedResolution === opt.type;
                      return (
                        <TouchableOpacity
                          key={opt.type}
                          style={[s.optionCard, isSelected && s.optionCardSelected]}
                          onPress={() => {
                            setSelectedResolution(opt.type);
                            setErrorMsg("");
                          }}
                          activeOpacity={0.8}
                        >
                          <View style={s.optionIconBox}>
                            <MaterialCommunityIcons name={opt.icon as any} size={20} color="#0F172A" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                              <View style={[s.statusDotSmall, { backgroundColor: opt.color }]} />
                              <Text style={[s.optionTitle, isSelected && { color: "#0F172A", fontWeight: "800" }]}>
                                {opt.title}
                              </Text>
                            </View>
                            <Text style={s.optionDesc}>{opt.description}</Text>
                          </View>
                          <View style={[s.radioCircle, isSelected && s.radioCircleSelected]}>
                            {isSelected && <View style={s.radioInner} />}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <Text style={[s.sectionLabel, { marginTop: 14 }]}>ADMIN AUDIT NOTE (REQUIRED)</Text>
                  <View style={s.noteInputWrap}>
                    <TextInput
                      style={s.noteInput}
                      placeholder="Specify rationale for financial audit logging..."
                      placeholderTextColor="#94A3B8"
                      multiline
                      value={auditNote}
                      onChangeText={(t) => {
                        setAuditNote(t);
                        if (errorMsg) setErrorMsg("");
                      }}
                      textAlignVertical="top"
                    />
                  </View>

                  {errorMsg ? <Text style={s.errorText}>{errorMsg}</Text> : null}
                </>
              ) : (
                /* Step 2: Two-Step Confirmation Safeguard */
                <View style={s.confirmContainer}>
                  {/* Warning banner */}
                  <View style={s.warningBanner}>
                    <View style={[s.statusDotSmall, { backgroundColor: "#DC2626", marginTop: 4 }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.warningTitle}>Binding Financial Transaction</Text>
                      <Text style={s.warningText}>
                        This mediation decision immediately releases held platform escrow funds and logs an immutable audit trail.
                      </Text>
                    </View>
                  </View>

                  {/* Summary Breakdown */}
                  <View style={s.summaryCard}>
                    <View style={s.summaryRow}>
                      <Text style={s.summaryLabel}>Resolution Action</Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                        <View style={[s.statusDotSmall, { backgroundColor: selectedOpt?.color || "#0F172A" }]} />
                        <Text style={s.summaryValue}>
                          {selectedOpt?.title}
                        </Text>
                      </View>
                    </View>
                    <View style={s.divider} />
                    <View style={s.summaryRow}>
                      <Text style={s.summaryLabel}>Escrow Held</Text>
                      <Text style={s.summaryValue}>${escrowTotal}</Text>
                    </View>
                    <View style={s.divider} />
                    <View style={s.summaryRow}>
                      <Text style={s.summaryLabel}>Claimant</Text>
                      <Text style={s.summaryValue}>
                        {dispute.customer?.fullName || dispute.customer?.name || "Customer"}
                      </Text>
                    </View>
                    <View style={s.divider} />
                    <View style={s.summaryRow}>
                      <Text style={s.summaryLabel}>Provider</Text>
                      <Text style={s.summaryValue}>
                        {dispute.company?.name || dispute.booking?.company?.name || "Provider"}
                      </Text>
                    </View>
                    <View style={s.divider} />
                    <View style={{ paddingTop: 8 }}>
                      <Text style={s.summaryLabel}>Audit Justification</Text>
                      <Text style={s.noteReviewText}>{auditNote}</Text>
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Footer Actions */}
            <View style={s.footer}>
              {step === 1 ? (
                <TouchableOpacity
                  style={[s.primaryBtn, (!selectedResolution || !auditNote.trim()) && s.disabledBtn]}
                  onPress={handleNextStep}
                  activeOpacity={0.8}
                >
                  <Text style={s.primaryBtnText}>Review & Verify Safeguard</Text>
                  <MaterialCommunityIcons name="arrow-right" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              ) : (
                <View style={s.step2BtnRow}>
                  <TouchableOpacity
                    style={s.backStepBtn}
                    onPress={() => setStep(1)}
                    disabled={isLoading}
                    activeOpacity={0.8}
                  >
                    <Text style={s.backStepBtnText}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={s.confirmBtn}
                    onPress={handleConfirm}
                    disabled={isLoading}
                    activeOpacity={0.8}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
                        <Text style={s.confirmBtnText}>Execute Settlement</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(10, 25, 47, 0.65)",
    justifyContent: "flex-end",
  },
  safeWrap: {
    maxHeight: "90%",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
    maxHeight: "100%",
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#CBD5E1",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 6,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.3,
  },
  caseId: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },

  body: {
    padding: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  optionsList: {
    gap: 10,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  optionCardSelected: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#0F172A",
  },
  optionIconBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  statusDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
  },
  radioCircleSelected: {
    borderColor: "#0F172A",
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#0F172A",
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 2,
  },
  optionDesc: {
    fontSize: 12,
    color: "#64748B",
    lineHeight: 16,
  },

  noteInputWrap: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
  },
  noteInput: {
    fontSize: 13,
    color: "#0F172A",
    minHeight: 70,
  },
  errorText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#DC2626",
    marginTop: 8,
  },

  confirmContainer: {
    gap: 14,
  },
  warningBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  warningTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 2,
  },
  warningText: {
    fontSize: 12,
    color: "#475569",
    lineHeight: 16,
  },

  summaryCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
  },
  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 8,
  },
  noteReviewText: {
    fontSize: 13,
    color: "#1E293B",
    fontStyle: "italic",
    marginTop: 4,
    lineHeight: 18,
  },

  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#0F172A",
    borderRadius: 12,
    paddingVertical: 14,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  disabledBtn: {
    opacity: 0.5,
  },
  step2BtnRow: {
    flexDirection: "row",
    gap: 10,
  },
  backStepBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingVertical: 14,
  },
  backStepBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
  },
  confirmBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 12,
    backgroundColor: "#0F172A",
    paddingVertical: 14,
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
