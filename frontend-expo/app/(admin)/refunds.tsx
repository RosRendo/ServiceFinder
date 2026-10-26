/**
 * Admin Refund & Financials — Premium Deep Navy Redesign
 */
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { Theme } from "@/constants/theme";
import api from "@/utils/api";
import ErrorState from "@/components/common/ErrorState";

const T = Theme.colors;

export default function RefundsScreen() {
  const router = useRouter();
  const [refundQueue, setRefundQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [activeRefund, setActiveRefund] = useState<any>(null);
  const [refundAmount, setRefundAmount] = useState<string>("");
  const [reasonModalVisible, setReasonModalVisible] = useState(false);
  const [refundReason, setRefundReason] = useState("");
  const [reasonError, setReasonError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchRefundQueue = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/admin/disputes", { params: { status: "resolved" } });
      const responseData = res.data?.data ?? res.data;
      const list = Array.isArray(responseData) ? responseData : (responseData?.data ?? []);
      const withRefunds = list.filter((d: any) => Number(d.refundAmount) > 0);
      setRefundQueue(withRefunds);
      if (withRefunds.length > 0) {
        setActiveRefund(withRefunds[0]);
        setRefundAmount(withRefunds[0].refundAmount?.toString() || "");
      }
      setHasError(false);
    } catch (err) {
      console.error("Error fetching refund queue", err);
      setHasError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRefundQueue(); }, []);

  useEffect(() => {
    if (activeRefund) {
      setRefundAmount(activeRefund.refundAmount?.toString() || activeRefund.amount?.toString() || "");
      setRefundReason("");
      setReasonError("");
    }
  }, [activeRefund]);

  const parsedAmount = parseFloat(refundAmount) || 0;
  const maxRefundable = Number(activeRefund?.refundAmount || 0);
  const isFullRefund = parsedAmount >= maxRefundable && maxRefundable > 0;
  const overSuperAdminThreshold = parsedAmount > 500;

  const requestRefund = () => {
    if (!activeRefund) return;
    if (parsedAmount <= 0) {
      Alert.alert("Invalid Amount", "Refund amount must be greater than $0.");
      return;
    }
    if (parsedAmount > maxRefundable) {
      Alert.alert(
        "Amount Exceeds Approved Refund",
        `The dispute resolution approved $${maxRefundable.toFixed(2)}. A larger refund cannot be issued here.`
      );
      return;
    }
    setRefundReason("");
    setReasonError("");
    setReasonModalVisible(true);
  };

  const findPaymentId = async (): Promise<string | null> => {
    const bookingId = activeRefund?.bookingId;
    if (!bookingId) return null;
    try {
      const res = await api.get(`/api/bookings/${bookingId}`);
      const booking = res.data?.data?.booking ?? res.data?.booking;
      const paymentId = booking?.payment?.id;
      return paymentId ? String(paymentId) : null;
    } catch {
      return null;
    }
  };

  const executeRefund = async () => {
    if (!refundReason.trim()) {
      setReasonError("A reason is required to process a refund.");
      return;
    }
    setIsProcessing(true);
    try {
      const paymentId = await findPaymentId();
      if (!paymentId) {
        setReasonModalVisible(false);
        setIsProcessing(false);
        Toast.show({
          type: "error",
          text1: "Refund Not Possible",
          text2: `No payment record was found for booking #${activeRefund?.bookingId}.`,
        });
        return;
      }
      const res = await api.post(`/api/admin/payments/${paymentId}/refund`, {
        amount: parsedAmount,
        reason: refundReason.trim(),
      });
      setReasonModalVisible(false);
      Toast.show({
        type: "success",
        text1: "Refund Recorded",
        text2:
          res.data?.message ||
          `Payment of $${parsedAmount.toFixed(2)} marked as refunded.`,
      });
      fetchRefundQueue();
    } catch (err: any) {
      const serverMsg =
        err?.response?.data?.message ||
        "The refund could not be processed. Nothing was changed.";
      Toast.show({
        type: "error",
        text1: "Refund Failed",
        text2: typeof serverMsg === "string" ? serverMsg : "Refund failed.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={s.root} edges={["top", "left", "right"]}>
      <View style={s.header}>
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.push("/(admin)/(tabs)/settings" as any);
          }}
          style={s.headerBtn}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={T.text1} />
        </TouchableOpacity>
        <View style={s.headerTitleBox}>
          <Text style={s.headerTitle}>Financial Control Center</Text>
          <Text style={s.headerSubtitle}>Refund Execution</Text>
        </View>
        <View style={s.shieldBadge}>
          <MaterialCommunityIcons name="shield-lock-outline" size={14} color={T.accent} />
          <Text style={s.shieldText}>Admin</Text>
        </View>
      </View>

      <View style={s.splitLayout}>
        {/* LEFT PANE: Queue */}
        <View style={s.leftPane}>
          <View style={s.paneHeader}>
            <Text style={s.paneTitle}>Pending Execution</Text>
            <View style={s.countBadge}>
              <Text style={s.countText}>{refundQueue.length}</Text>
            </View>
          </View>

          {loading ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator color={T.accent} />
            </View>
          ) : (
            hasError ? (
              <ErrorState onRetry={() => fetchRefundQueue()} />
            ) :
            refundQueue.length === 0 ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
                <MaterialCommunityIcons name="check-circle-outline" size={36} color={T.success} />
                <Text style={{ color: T.text2, textAlign: 'center', marginTop: 8, fontSize: 13 }}>No pending refunds in queue</Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.queueList}>
                {refundQueue.map((rf) => {
                  const isActive = activeRefund?.id === rf.id;
                  const refAmt = Number(rf.refundAmount || rf.booking?.totalPrice || 0);
                  return (
                    <TouchableOpacity
                      key={rf.id}
                      style={[s.queueItem, isActive && s.queueItemActive]}
                      onPress={() => setActiveRefund(rf)}
                      activeOpacity={0.8}
                    >
                      <View style={s.queueTopRow}>
                        <Text style={[s.queueId, isActive && { color: "#fff" }]}>#{rf.id}</Text>
                        <Text style={[s.queueAmount, isActive && { color: "#fff" }]}>${refAmt.toFixed(2)}</Text>
                      </View>
                      <Text style={[s.queueCompany, isActive && { color: "rgba(255,255,255,0.7)" }]}>{rf.company?.name ?? "—"}</Text>
                      <Text style={[s.queueCustomer, isActive && { color: "rgba(255,255,255,0.7)" }]}>Cust: {rf.customer?.fullName ?? "—"}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )
          )}
        </View>

        {/* RIGHT PANE: Action Center */}
        <View style={s.rightPane}>
          {!activeRefund ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="bank-transfer" size={40} color={T.text3} />
              <Text style={{ color: T.text3, marginTop: 8, fontSize: 14 }}>Select a refund to process</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.actionContent}>

              {/* Context Card */}
              <View style={s.contextCard}>
                <View style={s.contextHeader}>
                  <MaterialCommunityIcons name="scale-balance" size={24} color={T.text1} />
                  <Text style={s.contextTitle}>Dispute #{activeRefund.id}</Text>
                </View>
                <Text style={s.contextDesc}>
                  {activeRefund.adminDecision
                    ? `Approved decision: ${String(activeRefund.adminDecision).replace(/_/g, " ")}`
                    : "Refund approved by dispute resolution."}{" "}
                  Max refundable: ${maxRefundable.toFixed(2)}.
                </Text>
              </View>

              {/* Refund Amount */}
              <View style={s.card}>
                <Text style={s.cardTitle}>Refund Amount</Text>

                <Text style={s.inputLabel}>Amount (USD)</Text>
                <View style={s.inputWrap}>
                  <Text style={s.currencySymbol}>$</Text>
                  <TextInput
                    style={s.amountInput}
                    keyboardType="decimal-pad"
                    value={refundAmount}
                    onChangeText={setRefundAmount}
                    maxLength={10}
                  />
                  {isFullRefund && (
                    <View style={s.fullRefundBadge}>
                      <Text style={s.fullRefundText}>FULL</Text>
                    </View>
                  )}
                </View>

                {overSuperAdminThreshold && (
                  <View style={s.thresholdNote}>
                    <MaterialCommunityIcons name="shield-alert" size={16} color={T.warning} />
                    <Text style={s.thresholdNoteText}>
                      Refunds above $500 require elevated privileges — the server will reject this if your account is not authorized.
                    </Text>
                  </View>
                )}
              </View>

              {/* Execution Button */}
              <TouchableOpacity
                style={s.executeBtn}
                onPress={requestRefund}
                activeOpacity={0.8}
                disabled={isProcessing}
              >
                <MaterialCommunityIcons name="credit-card-refund" size={24} color="#fff" />
                <Text style={s.executeBtnText}>Execute Refund</Text>
              </TouchableOpacity>

            </ScrollView>
          )}
        </View>
      </View>

      {/* Confirm + Reason Modal */}
      <Modal visible={reasonModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={s.modalOverlay}>
          <View style={s.modalContainer}>
            <View style={s.modalIconBox}>
              <MaterialCommunityIcons name="credit-card-refund" size={32} color={T.warning} />
            </View>
            <Text style={s.modalTitle}>Confirm Refund</Text>
            <Text style={s.modalDesc}>
              Mark the payment for booking #{activeRefund?.bookingId} as refunded with ${parsedAmount.toFixed(2)} to {activeRefund?.customer?.fullName ?? "the customer"}. State a reason for the financial record:
            </Text>

            <TextInput
              style={[s.reasonInput, reasonError ? s.reasonInputError : null]}
              placeholder="Refund reason (required)"
              placeholderTextColor={T.text3}
              value={refundReason}
              onChangeText={(t) => {
                setRefundReason(t);
                if (reasonError) setReasonError("");
              }}
              multiline
              textAlignVertical="top"
            />
            {reasonError ? <Text style={s.reasonErrorText}>{reasonError}</Text> : null}

            <View style={s.modalActions}>
              <TouchableOpacity
                style={s.modalBtnSecondary}
                onPress={() => setReasonModalVisible(false)}
                disabled={isProcessing}
              >
                <Text style={s.modalBtnSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalBtnPrimary, isProcessing && { opacity: 0.7 }]}
                onPress={executeRefund}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={s.modalBtnPrimaryText}>Confirm</Text>
                )}
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

  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  headerBtn: { padding: 4, marginLeft: -8, marginRight: 8 },
  headerTitleBox: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  headerSubtitle: { fontSize: 12, color: "#64748B", marginTop: 2, fontWeight: "500" },
  shieldBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#F1F5F9", borderWidth: 1, borderColor: "#E2E8F0", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  shieldText: { fontSize: 12, fontWeight: "700", color: "#0F172A", textTransform: "uppercase" },

  splitLayout: { flex: 1, flexDirection: Platform.OS === 'web' ? "row" : "column" },

  leftPane: {
    width: Platform.OS === 'web' ? "35%" : "100%",
    minWidth: Platform.OS === 'web' ? 280 : undefined,
    maxHeight: Platform.OS === 'web' ? undefined : 220,
    backgroundColor: "#F8FAFC",
    borderRightWidth: Platform.OS === 'web' ? 1 : 0,
    borderBottomWidth: Platform.OS === 'web' ? 0 : 1,
    borderRightColor: "#E2E8F0",
    borderBottomColor: "#E2E8F0",
  },
  paneHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  paneTitle: { fontSize: 14, fontWeight: "700", color: "#475569", textTransform: "uppercase" },
  countBadge: { backgroundColor: "#0F172A", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  countText: { fontSize: 12, fontWeight: "700", color: "#fff" },

  queueList: { padding: 16, gap: 12 },
  queueItem: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#E2E8F0" },
  queueItemActive: { backgroundColor: "#F1F5F9", borderColor: "#0F172A" },
  queueTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  queueId: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  queueAmount: { fontSize: 16, fontWeight: "700", color: "#DC2626" },
  queueCompany: { fontSize: 13, fontWeight: "600", color: "#334155", marginBottom: 2 },
  queueCustomer: { fontSize: 12, color: "#64748B" },

  rightPane: { flex: 1, backgroundColor: "#F8FAFC" },
  actionContent: { padding: 20, gap: 20, paddingBottom: 120 },

  contextCard: { backgroundColor: "#FFFFFF", padding: 20, borderRadius: 16, borderWidth: 1, borderColor: "#E2E8F0" },
  contextHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
  contextTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
  contextDesc: { fontSize: 14, color: "#475569", lineHeight: 22 },

  card: { backgroundColor: "#FFFFFF", padding: 22, borderRadius: 16, borderWidth: 1, borderColor: "#E2E8F0" },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#0F172A", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 16 },

  inputLabel: { fontSize: 12, fontWeight: "700", color: "#64748B", textTransform: "uppercase", marginBottom: 8 },
  inputWrap: { flexDirection: "row", alignItems: "center", backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 14, paddingHorizontal: 16, height: 60, marginBottom: 20 },
  currencySymbol: { fontSize: 24, fontWeight: "700", color: "#475569", marginRight: 8 },
  amountInput: { flex: 1, fontSize: 30, fontWeight: "700", color: "#0F172A", height: "100%" },
  fullRefundBadge: { backgroundColor: "#F1F5F9", borderWidth: 1, borderColor: "#E2E8F0", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  fullRefundText: { fontSize: 12, fontWeight: "700", color: "#059669" },

  thresholdNote: { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: "#FEF3C7", borderWidth: 1, borderColor: "#FDE68A", borderRadius: 12, padding: 12 },
  thresholdNoteText: { flex: 1, fontSize: 12, color: "#92400E", lineHeight: 18 },

  executeBtn: { backgroundColor: "#0F172A", borderRadius: 14, height: 56, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12 },
  executeBtnText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF", letterSpacing: 0.3 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.7)", justifyContent: "center", alignItems: "center", padding: 24 },
  modalContainer: { width: "100%", maxWidth: 400, backgroundColor: "#FFFFFF", borderRadius: 24, padding: 28, alignItems: "center", borderWidth: 1, borderColor: "#E2E8F0" },
  modalIconBox: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0", alignItems: "center", justifyContent: "center", marginBottom: 18 },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A", marginBottom: 10, textAlign: "center" },
  modalDesc: { fontSize: 14, color: T.text2, lineHeight: 22, textAlign: "center", marginBottom: 20 },

  reasonInput: { width: "100%", minHeight: 80, maxHeight: 120, backgroundColor: T.bg, borderRadius: 12, borderWidth: 1.5, borderColor: "#E2E8F0", padding: 12, fontSize: 14, color: T.text1, marginBottom: 8 },
  reasonInputError: { borderColor: T.error },
  reasonErrorText: { fontSize: 12, fontWeight: "600", color: T.error, alignSelf: "flex-start", marginBottom: 8 },

  modalActions: { flexDirection: "row", gap: 12, width: "100%" },
  modalBtnSecondary: { flex: 1, height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: T.bg },
  modalBtnSecondaryText: { fontSize: 15, fontWeight: "700", color: T.text2 },
  modalBtnPrimary: { flex: 1, height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "#0F172A" },
  modalBtnPrimaryText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});
