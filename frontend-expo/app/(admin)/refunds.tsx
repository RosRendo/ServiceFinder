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
import ConfettiCannon from "react-native-confetti-cannon";

const T = Theme.colors;

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
  android: { elevation: 4 },
});

// Mock Data for escalated refund requests
const MOCK_REFUNDS = [
  { id: "RF-1029", disputeId: "DP-8821", company: "CleanPro Services", customer: "Sarah M.", amount: 850.00, status: "pending", date: "2026-07-25" },
  { id: "RF-1030", disputeId: "DP-8902", company: "Elite Plumbers", customer: "David K.", amount: 150.00, status: "pending", date: "2026-07-24" },
  { id: "RF-1031", disputeId: "DP-9011", company: "QuickFix HVAC", customer: "Elena R.", amount: 1200.00, status: "pending", date: "2026-07-23" },
];

export default function RefundsScreen() {
  const router = useRouter();
  const [activeRefund, setActiveRefund] = useState<any>(MOCK_REFUNDS[0]);
  const [refundAmount, setRefundAmount] = useState<string>(activeRefund.amount.toString());
  const [absorbFee, setAbsorbFee] = useState<boolean>(false);
  
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pin, setPin] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Math Logic
  const parsedAmount = parseFloat(refundAmount) || 0;
  const isFullRefund = parsedAmount >= activeRefund.amount;
  const stripeFee = (parsedAmount * 0.029) + 0.30;
  
  const companyDeduction = absorbFee ? parsedAmount : (parsedAmount + stripeFee);
  const platformLoss = absorbFee ? stripeFee : 0;
  const requiresSuperAdmin = parsedAmount > 500;

  useEffect(() => {
    setRefundAmount(activeRefund.amount.toString());
    setAbsorbFee(false);
    setPin("");
  }, [activeRefund]);

  const initiateRefund = () => {
    if (parsedAmount <= 0) {
      Alert.alert("Invalid Amount", "Refund amount must be greater than $0.");
      return;
    }
    if (parsedAmount > activeRefund.amount) {
      Alert.alert("Invalid Amount", "Cannot refund more than the original transaction amount.");
      return;
    }
    
    if (requiresSuperAdmin) {
      setPinModalVisible(true);
    } else {
      executeRefund();
    }
  };

  const executeRefund = () => {
    setPinModalVisible(false);
    setIsProcessing(true);

    // Simulate API Call to Stripe
    setTimeout(() => {
      setIsProcessing(false);
      setShowConfetti(true);
      
      Alert.alert(
        "Refund Successful", 
        `$${parsedAmount.toFixed(2)} has been successfully refunded to ${activeRefund.customer}.`,
        [{ text: "Done" }]
      );
    }, 1500);
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
        <TouchableOpacity onPress={() => router.back()} style={s.headerBtn}>
          <MaterialCommunityIcons name="chevron-left" size={32} color={T.text1} />
        </TouchableOpacity>
        <View style={s.headerTitleBox}>
          <Text style={s.headerTitle}>Financial Control Center</Text>
          <Text style={s.headerSubtitle}>Escrow & Refund Execution</Text>
        </View>
        <View style={s.shieldBadge}>
          <MaterialCommunityIcons name="shield-lock-outline" size={16} color={T.accent} />
          <Text style={s.shieldText}>Level 3 Auth</Text>
        </View>
      </View>

      <View style={s.splitLayout}>
        {/* LEFT PANE: Queue */}
        <View style={s.leftPane}>
          <View style={s.paneHeader}>
            <Text style={s.paneTitle}>Pending Execution</Text>
            <View style={s.countBadge}>
              <Text style={s.countText}>{MOCK_REFUNDS.length}</Text>
            </View>
          </View>
          
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.queueList}>
            {MOCK_REFUNDS.map((rf) => {
              const isActive = activeRefund.id === rf.id;
              return (
                <TouchableOpacity 
                  key={rf.id} 
                  style={[s.queueItem, isActive && s.queueItemActive]}
                  onPress={() => setActiveRefund(rf)}
                  activeOpacity={0.8}
                >
                  <View style={s.queueTopRow}>
                    <Text style={[s.queueId, isActive && { color: "#fff" }]}>{rf.id}</Text>
                    <Text style={[s.queueAmount, isActive && { color: "#fff" }]}>${rf.amount.toFixed(2)}</Text>
                  </View>
                  <Text style={[s.queueCompany, isActive && { color: "rgba(255,255,255,0.7)" }]}>{rf.company}</Text>
                  <Text style={[s.queueCustomer, isActive && { color: "rgba(255,255,255,0.7)" }]}>Cust: {rf.customer}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* RIGHT PANE: Action Center */}
        <View style={s.rightPane}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.actionContent}>
            
            {/* Context Card */}
            <View style={s.contextCard}>
              <View style={s.contextHeader}>
                <MaterialCommunityIcons name="scale-balance" size={24} color={T.text1} />
                <Text style={s.contextTitle}>Dispute Reference: {activeRefund.disputeId}</Text>
              </View>
              <Text style={s.contextDesc}>
                This refund was escalated from the dispute resolution center. Max refundable amount is ${activeRefund.amount.toFixed(2)}.
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
                  <Text style={s.toggleTitle}>Platform Absorbs Stripe Fee</Text>
                  <Text style={s.toggleDesc}>If checked, the platform pays the ${stripeFee.toFixed(2)} processing fee instead of deducting it from the company's escrow.</Text>
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
                <Text style={s.mathLabel}>Stripe Processing Fee (2.9% + 30¢)</Text>
                <Text style={[s.mathValue, { color: T.error }]}>+ ${stripeFee.toFixed(2)}</Text>
              </View>
              
              <View style={s.divider} />

              <View style={s.mathRow}>
                <Text style={[s.mathLabel, { fontWeight: "800", color: T.text1 }]}>Deducted from Company Escrow</Text>
                <Text style={[s.mathValue, { fontWeight: "800", color: T.error }]}>
                  ${companyDeduction.toFixed(2)}
                </Text>
              </View>
              
              {absorbFee && (
                <View style={[s.mathRow, { marginTop: 8 }]}>
                  <Text style={[s.mathLabel, { fontWeight: "800", color: T.text1 }]}>Platform Net Loss</Text>
                  <Text style={[s.mathValue, { fontWeight: "800", color: T.error }]}>
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
  root: { flex: 1, backgroundColor: T.bg },
  
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: T.surface, borderBottomWidth: 1, borderBottomColor: T.border },
  headerBtn: { padding: 4, marginLeft: -8, marginRight: 8 },
  headerTitleBox: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: T.text1 },
  headerSubtitle: { fontSize: 12, color: T.text3, marginTop: 2, fontWeight: "500" },
  shieldBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: T.accent + "15", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  shieldText: { fontSize: 12, fontWeight: "800", color: T.accent, textTransform: "uppercase" },

  splitLayout: { flex: 1, flexDirection: "row" },
  
  /* Left Pane */
  leftPane: { width: "35%", minWidth: 280, backgroundColor: T.bg, borderRightWidth: 1, borderRightColor: T.border },
  paneHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1, borderBottomColor: T.border },
  paneTitle: { fontSize: 14, fontWeight: "800", color: T.text2, textTransform: "uppercase" },
  countBadge: { backgroundColor: T.blue, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  countText: { fontSize: 12, fontWeight: "800", color: "#fff" },
  
  queueList: { padding: 16, gap: 12 },
  queueItem: { backgroundColor: T.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: T.border, ...CARD_SHADOW },
  queueItemActive: { backgroundColor: T.accent, borderColor: T.accent },
  queueTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  queueId: { fontSize: 14, fontWeight: "800", color: T.text1 },
  queueAmount: { fontSize: 16, fontWeight: "800", color: T.error },
  queueCompany: { fontSize: 13, fontWeight: "600", color: T.text2, marginBottom: 2 },
  queueCustomer: { fontSize: 12, color: T.text3 },

  /* Right Pane */
  rightPane: { flex: 1, backgroundColor: T.bg },
  actionContent: { padding: 24, gap: 24, paddingBottom: 60 },
  
  contextCard: { backgroundColor: T.surface, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: T.border },
  contextHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
  contextTitle: { fontSize: 16, fontWeight: "800", color: T.text1 },
  contextDesc: { fontSize: 14, color: T.text2, lineHeight: 22 },

  card: { backgroundColor: T.surface, padding: 24, borderRadius: 24, borderWidth: 1, borderColor: T.border, ...CARD_SHADOW },
  cardTitle: { fontSize: 16, fontWeight: "800", color: T.text1, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 16 },
  
  inputLabel: { fontSize: 12, fontWeight: "800", color: T.text3, textTransform: "uppercase", marginBottom: 8 },
  inputWrap: { flexDirection: "row", alignItems: "center", backgroundColor: T.bg, borderWidth: 1, borderColor: T.border, borderRadius: 16, paddingHorizontal: 16, height: 64, marginBottom: 20 },
  currencySymbol: { fontSize: 24, fontWeight: "800", color: T.text2, marginRight: 8 },
  amountInput: { flex: 1, fontSize: 32, fontWeight: "800", color: T.text1, height: "100%" },
  fullRefundBadge: { backgroundColor: T.success + "20", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  fullRefundText: { fontSize: 12, fontWeight: "800", color: T.success },

  toggleRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, backgroundColor: T.bg, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: T.border },
  checkbox: { width: 24, height: 24, borderRadius: 8, borderWidth: 2, borderColor: T.border, alignItems: "center", justifyContent: "center", marginTop: 2 },
  checkboxActive: { backgroundColor: T.accent, borderColor: T.accent },
  toggleTitle: { fontSize: 15, fontWeight: "800", color: T.text1, marginBottom: 4 },
  toggleDesc: { fontSize: 13, color: T.text3, lineHeight: 18 },

  mathCard: { backgroundColor: T.surface, padding: 24, borderRadius: 24, borderWidth: 1, borderColor: T.border, ...CARD_SHADOW },
  mathRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  mathLabel: { fontSize: 14, fontWeight: "600", color: T.text2 },
  mathValue: { fontSize: 15, fontWeight: "700", color: T.text1 },
  divider: { height: 1, backgroundColor: T.border, marginVertical: 12 },

  executeBtn: { backgroundColor: T.error, borderRadius: 20, height: 64, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, ...CARD_SHADOW },
  executeBtnText: { fontSize: 18, fontWeight: "800", color: "#fff", letterSpacing: 0.5 },

  /* Modal */
  modalOverlay: { flex: 1, backgroundColor: "rgba(10, 25, 47, 0.7)", justifyContent: "center", alignItems: "center", padding: 24 },
  modalContainer: { width: "100%", maxWidth: 400, backgroundColor: T.surface, borderRadius: 32, padding: 32, alignItems: "center", ...CARD_SHADOW },
  modalIconBox: { width: 64, height: 64, borderRadius: 32, backgroundColor: T.warning + "15", alignItems: "center", justifyContent: "center", marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: "800", color: T.text1, marginBottom: 12, textAlign: "center" },
  modalDesc: { fontSize: 14, color: T.text2, lineHeight: 22, textAlign: "center", marginBottom: 24 },
  pinInput: { width: 160, height: 64, backgroundColor: T.bg, borderRadius: 16, borderWidth: 2, borderColor: T.warning, fontSize: 32, fontWeight: "800", color: T.text1, textAlign: "center", letterSpacing: 8, marginBottom: 32 },
  
  modalActions: { flexDirection: "row", gap: 12, width: "100%" },
  modalBtnSecondary: { flex: 1, height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: T.bg },
  modalBtnSecondaryText: { fontSize: 15, fontWeight: "800", color: T.text2 },
  modalBtnPrimary: { flex: 1, height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: T.warning },
  modalBtnPrimaryText: { fontSize: 15, fontWeight: "800", color: "#fff" },
});
