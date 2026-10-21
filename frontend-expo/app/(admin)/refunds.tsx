/**
 * Admin Refund & Financials — Premium Deep Navy Redesign
 */
import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, Modal, StyleSheet, Platform, KeyboardAvoidingView
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Theme } from "@/constants/theme";
import api from "@/utils/api";
import ErrorState from "@/components/common/ErrorState";
import ConfettiCannon from "react-native-confetti-cannon";

const T = Theme.colors;

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
  android: { elevation: 4 },
});

export default function RefundsScreen() {
  const router = useRouter();
  const [refundQueue, setRefundQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [activeRefund, setActiveRefund] = useState<any>(null);
  const [refundAmount, setRefundAmount] = useState<string>("");
  const [absorbFee, setAbsorbFee] = useState<boolean>(false);
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pin, setPin] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Fetch resolved disputes that have a refundAmount set (i.e., pending refund execution)
  const fetchRefundQueue = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/admin/disputes", { params: { status: "resolved" } });
      const responseData = res.data?.data ?? res.data;
      const list = Array.isArray(responseData) ? responseData : (responseData?.data ?? []);
      // Only show disputes where a refund amount was set
      const withRefunds = list.filter((d: any) => Number(d.refundAmount) > 0);
      setRefundQueue(withRefunds);
      if (withRefunds.length > 0) {
        setActiveRefund(withRefunds[0]);
        setRefundAmount(withRefunds[0].refundAmount?.toString() || "");
      }
    } catch (err) {
      console.error("Error fetching refund queue", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRefundQueue(); }, []);

  useEffect(() => {
    if (activeRefund) {
      setRefundAmount(activeRefund.refundAmount?.toString() || activeRefund.amount?.toString() || "");
      setAbsorbFee(false);
      setPin("");
    }
  }, [activeRefund]);


  // Math Logic
  const parsedAmount = parseFloat(refundAmount) || 0;
  const isFullRefund = activeRefund ? parsedAmount >= Number(activeRefund.refundAmount || activeRefund.amount || 0) : false;
  const khqrFee = parsedAmount * 0.01; // 1% approximate for KHQR gateway
  const companyDeduction = absorbFee ? parsedAmount : (parsedAmount + khqrFee);
  const platformLoss = absorbFee ? khqrFee : 0;
  const requiresSuperAdmin = parsedAmount > 500;

  const initiateRefund = () => {
    if (!activeRefund) return;
    if (parsedAmount <= 0) {
      Alert.alert("Invalid Amount", "Refund amount must be greater than $0.");
      return;
    }
    if (requiresSuperAdmin) {
      setPinModalVisible(true);
    } else {
      executeRefund();
    }
  };

  const executeRefund = async () => {
    setPinModalVisible(false);
    setIsProcessing(true);
    try {
      // Resolve the dispute and mark the payment as refunded via KHQR
      await api.patch(`/api/admin/disputes/${activeRefund.id}`, {
        status: "closed",
        adminDecision: `KHQR refund of $${parsedAmount.toFixed(2)} initiated.`,
        refundAmount: parsedAmount,
      });
      setShowConfetti(true);
      Alert.alert(
        "Refund Initiated",
        `$${parsedAmount.toFixed(2)} KHQR refund has been recorded. Please complete the bank transfer manually via Bakong/ABA.`,
        [{ text: "Done", onPress: () => { setShowConfetti(false); fetchRefundQueue(); } }]
      );
    } catch (err) {
      Alert.alert("Error", "Failed to process refund.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePinSubmit = () => {
    if (pin === "1234") {
      executeRefund();
    } else {
      Alert.alert("Access Denied", "Incorrect Super Admin PIN.");
      setPin("");
    }
  };


  return (
    <SafeAreaView style={s.root} edges={["top", "left", "right"]}>
      {showConfetti && <ConfettiCannon count={100} origin={{x: -10, y: 0}} autoStart={true} fadeOut={true} />}
      
      {/* Header */}
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
          <Text style={s.headerSubtitle}>Escrow & Refund Execution</Text>
        </View>
        <View style={s.shieldBadge}>
          <MaterialCommunityIcons name="shield-lock-outline" size={14} color={T.accent} />
          <Text style={s.shieldText}>Level 3 Auth</Text>
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
          ) : refundQueue.length === 0 ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
              <MaterialCommunityIcons name="check-circle-outline" size={36} color={T.success} />
              <Text style={{ color: T.text2, textAlign: 'center', marginTop: 8, fontSize: 13 }}>No pending refunds in queue</Text>
            </View>
          ) : (
            hasError ? (
              <ErrorState onRetry={() => fetchRefundQueue()} />
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
          ))}

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
                {activeRefund.description || "Refund escalated from dispute resolution."} Max refundable: ${Number(activeRefund.refundAmount || 0).toFixed(2)}.
              </Text>
            </View>

            {/* Refund Configuration */}
            <View style={s.card}>
              <Text style={s.cardTitle}>Refund Configuration</Text>
              
              <Text style={s.inputLabel}>Refund Amount (USD)</Text>
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

              <TouchableOpacity 
                style={s.toggleRow} 
                onPress={() => setAbsorbFee(!absorbFee)}
                activeOpacity={0.7}
              >
                <View style={[s.checkbox, absorbFee && s.checkboxActive]}>
                  {absorbFee && <MaterialCommunityIcons name="check" size={16} color="#fff" />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.toggleTitle}>Platform Absorbs KHQR Fee</Text>
                  <Text style={s.toggleDesc}>If checked, the platform pays the ${khqrFee.toFixed(2)} KHQR gateway fee instead of deducting it from the company's escrow.</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Financial Breakdown */}
            <View style={s.mathCard}>
              <Text style={s.cardTitle}>Financial Execution Breakdown</Text>
              
              <View style={s.mathRow}>
                <Text style={s.mathLabel}>Net Refund to Customer</Text>
                <Text style={s.mathValue}>${parsedAmount.toFixed(2)}</Text>
              </View>
              <View style={s.mathRow}>
                <Text style={s.mathLabel}>KHQR Gateway Fee (1%)</Text>
                <Text style={[s.mathValue, { color: T.error }]}>+ ${khqrFee.toFixed(2)}</Text>
              </View>
              
              <View style={s.divider} />

              <View style={s.mathRow}>
                <Text style={[s.mathLabel, { fontWeight: "700", color: T.text1 }]}>Deducted from Company Escrow</Text>
                <Text style={[s.mathValue, { fontWeight: "700", color: T.error }]}>
                  ${companyDeduction.toFixed(2)}
                </Text>
              </View>
              
              {absorbFee && (
                <View style={[s.mathRow, { marginTop: 8 }]}>
                  <Text style={[s.mathLabel, { fontWeight: "700", color: T.text1 }]}>Platform Net Loss</Text>
                  <Text style={[s.mathValue, { fontWeight: "700", color: T.error }]}>
                    ${platformLoss.toFixed(2)}
                  </Text>
                </View>
              )}
            </View>

            {/* Execution Button */}
            <TouchableOpacity 
              style={[s.executeBtn, requiresSuperAdmin && { backgroundColor: T.warning }]} 
              onPress={initiateRefund}
              activeOpacity={0.8}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MaterialCommunityIcons name={requiresSuperAdmin ? "shield-lock" : "credit-card-refund"} size={24} color="#fff" />
                  <Text style={s.executeBtnText}>
                    {requiresSuperAdmin ? "Requires Super Admin PIN" : "Execute Refund"}
                  </Text>
                </>
              )}
            </TouchableOpacity>

          </ScrollView>
          )}
        </View>
      </View>

      {/* Super Admin PIN Modal */}
      <Modal visible={pinModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={s.modalOverlay}>
          <View style={s.modalContainer}>
            <View style={s.modalIconBox}>
              <MaterialCommunityIcons name="shield-lock-outline" size={32} color={T.warning} />
            </View>
            <Text style={s.modalTitle}>Super Admin Auth Required</Text>
            <Text style={s.modalDesc}>
              Any refund exceeding $500 requires secondary authorization. Enter PIN to execute a ${parsedAmount.toFixed(2)} refund.
            </Text>
            
            <TextInput
              style={s.pinInput}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={4}
              value={pin}
              onChangeText={setPin}
              placeholder="••••"
              placeholderTextColor={T.text3}
              autoFocus
            />

            <View style={s.modalActions}>
              <TouchableOpacity style={s.modalBtnSecondary} onPress={() => setPinModalVisible(false)}>
                <Text style={s.modalBtnSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.modalBtnPrimary} onPress={handlePinSubmit}>
                <Text style={s.modalBtnPrimaryText}>Authorize</Text>
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
  
  /* Left Pane */
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

  /* Right Pane */
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

  toggleRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, backgroundColor: "#F8FAFC", padding: 16, borderRadius: 14, borderWidth: 1, borderColor: "#E2E8F0" },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: "#CBD5E1", alignItems: "center", justifyContent: "center", marginTop: 2 },
  checkboxActive: { backgroundColor: "#0F172A", borderColor: "#0F172A" },
  toggleTitle: { fontSize: 14, fontWeight: "700", color: "#0F172A", marginBottom: 4 },
  toggleDesc: { fontSize: 12, color: "#64748B", lineHeight: 18 },

  mathCard: { backgroundColor: "#FFFFFF", padding: 22, borderRadius: 16, borderWidth: 1, borderColor: "#E2E8F0" },
  mathRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  mathLabel: { fontSize: 14, fontWeight: "600", color: "#475569" },
  mathValue: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  divider: { height: 1, backgroundColor: "#E2E8F0", marginVertical: 12 },

  executeBtn: { backgroundColor: "#0F172A", borderRadius: 14, height: 56, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12 },
  executeBtnText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF", letterSpacing: 0.3 },

  /* Modal */
  modalOverlay: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.7)", justifyContent: "center", alignItems: "center", padding: 24 },
  modalContainer: { width: "100%", maxWidth: 400, backgroundColor: "#FFFFFF", borderRadius: 24, padding: 28, alignItems: "center", borderWidth: 1, borderColor: "#E2E8F0" },
  modalIconBox: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0", alignItems: "center", justifyContent: "center", marginBottom: 18 },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A", marginBottom: 10, textAlign: "center" },
  modalDesc: { fontSize: 14, color: T.text2, lineHeight: 22, textAlign: "center", marginBottom: 24 },
  pinInput: { width: 160, height: 64, backgroundColor: T.bg, borderRadius: 16, borderWidth: 2, borderColor: T.warning, fontSize: 32, fontWeight: "700", color: T.text1, textAlign: "center", letterSpacing: 8, marginBottom: 32 },
  
  modalActions: { flexDirection: "row", gap: 12, width: "100%" },
  modalBtnSecondary: { flex: 1, height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: T.bg },
  modalBtnSecondaryText: { fontSize: 15, fontWeight: "700", color: T.text2 },
  modalBtnPrimary: { flex: 1, height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: T.warning },
  modalBtnPrimaryText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});
