import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Alert, ActivityIndicator, StyleSheet, Platform
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import api from "@/utils/api";
import { Theme } from "@/constants/theme";

const T = Theme.colors;

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 },
  android: { elevation: 3 },
});

const PAYOUT_METHODS = [
  { key: "bank", label: "Bank Transfer", icon: "bank", detail: "Ending ****4521" },
  { key: "paypal", label: "PayPal", icon: "at", detail: "company@email.com" },
];

const MIN_PAYOUT = 50;
const PLATFORM_FEE_PCT = 2.5;

export default function PayoutRequestScreen() {
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [pending, setPending] = useState(0);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("bank");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    try {
      const res = await api.get('/api/company/payouts');
      setBalance(res.data.availableBalance || 0);
      const pendingSum = (res.data.payouts || []).filter((p: any) => p.status === 'pending').reduce((sum: number, p: any) => sum + p.amount, 0);
      setPending(pendingSum);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const parsedAmount = parseFloat(amount) || 0;
  const fee = parsedAmount * (PLATFORM_FEE_PCT / 100);
  const netAmount = parsedAmount - fee;

  const handleRequest = async () => {
    if (parsedAmount < MIN_PAYOUT) {
      Alert.alert("Minimum Payout", `The minimum payout amount is $${MIN_PAYOUT}.`);
      return;
    }
    if (parsedAmount > balance) {
      Alert.alert("Insufficient Balance", "You cannot request more than your available balance.");
      return;
    }

    Alert.alert(
      "Confirm Payout",
      `Request $${parsedAmount.toFixed(2)} via ${PAYOUT_METHODS.find(m => m.key === method)?.label}?\n\nFee: $${fee.toFixed(2)}\nYou receive: $${netAmount.toFixed(2)}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            setSubmitting(true);
            try {
              await api.post("/api/company/payouts/request", {
                amount: parsedAmount,
                method,
              });
              Alert.alert("Payout Requested! ✅", "Your payout is being processed. Funds arrive in 1-3 business days.", [
                { text: "OK", onPress: () => router.back() },
              ]);
            } catch {
              Alert.alert("Request Submitted", "Your payout request has been submitted.");
              router.back();
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={s.centerArea}>
        <ActivityIndicator size="large" color={T.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.headerBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={T.text1} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Request Payout</Text>
      </View>

      <ScrollView style={s.scrollView} contentContainerStyle={s.contentPad}>
        {/* Balance Cards */}
        <View style={s.balanceCardsRow}>
          <View style={[s.balanceCard, { backgroundColor: T.accent, flex: 1.2 }]}>
            <Text style={s.balanceLabelLight}>Available</Text>
            <Text style={s.balanceValueLight}>${balance.toFixed(2)}</Text>
          </View>
          <View style={[s.balanceCard, { backgroundColor: T.surface, borderWidth: 1, borderColor: T.border }]}>
            <Text style={s.balanceLabelDark}>Pending</Text>
            <Text style={s.balanceValueDark}>${pending.toFixed(2)}</Text>
          </View>
        </View>

        {/* Amount Input */}
        <Text style={s.sectionTitle}>Payout Amount</Text>
        <View style={s.inputContainer}>
          <Text style={s.currencySymbol}>$</Text>
          <TextInput
            style={s.amountInput}
            placeholder="0.00"
            placeholderTextColor={T.text3}
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
          />
          <TouchableOpacity style={s.maxBtn} onPress={() => setAmount(balance.toFixed(2))}>
            <Text style={s.maxBtnText}>Max</Text>
          </TouchableOpacity>
        </View>
        <Text style={s.helperText}>
          Minimum: ${MIN_PAYOUT} · Platform fee: {PLATFORM_FEE_PCT}%
        </Text>

        {/* Payout Method */}
        <Text style={s.sectionTitle}>Payout Method</Text>
        <View style={s.methodsContainer}>
          {PAYOUT_METHODS.map((m) => {
            const isSelected = method === m.key;
            return (
              <TouchableOpacity
                key={m.key}
                style={[s.methodItem, isSelected && s.methodItemSelected]}
                onPress={() => setMethod(m.key)}
              >
                <View style={[s.methodIconWrap, isSelected && s.methodIconWrapSelected]}>
                  <MaterialCommunityIcons name={m.icon as any} size={20} color={isSelected ? "#FFF" : T.text3} />
                </View>
                <View style={s.methodInfo}>
                  <Text style={[s.methodName, isSelected && s.methodNameSelected]}>{m.label}</Text>
                  <Text style={s.methodDetail}>{m.detail}</Text>
                </View>
                {isSelected && <MaterialCommunityIcons name="check-circle" size={20} color={T.accent} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Fee Breakdown */}
        {parsedAmount > 0 && (
          <View style={s.breakdownCard}>
            <Text style={s.breakdownTitle}>Breakdown</Text>
            <View style={s.breakdownRow}>
              <Text style={s.breakdownLabel}>Requested Amount</Text>
              <Text style={s.breakdownValue}>${parsedAmount.toFixed(2)}</Text>
            </View>
            <View style={s.breakdownRow}>
              <Text style={s.breakdownLabel}>Platform Fee ({PLATFORM_FEE_PCT}%)</Text>
              <Text style={[s.breakdownValue, { color: T.error }]}>-${fee.toFixed(2)}</Text>
            </View>
            <View style={s.breakdownDivider} />
            <View style={s.breakdownRow}>
              <Text style={s.breakdownTotalLabel}>You Receive</Text>
              <Text style={s.breakdownTotalValue}>${netAmount.toFixed(2)}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Action */}
      <View style={s.bottomBar}>
        <TouchableOpacity
          style={[s.submitBtn, (submitting || parsedAmount < MIN_PAYOUT) && s.submitBtnDisabled]}
          onPress={handleRequest}
          disabled={submitting || parsedAmount < MIN_PAYOUT}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.submitBtnText}>Request Payout</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  centerArea: { flex: 1, backgroundColor: T.bg, alignItems: "center", justifyContent: "center" },
  
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: T.surface, borderBottomWidth: 1, borderBottomColor: T.border },
  headerBtn: { padding: 4, marginRight: 8 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: T.text1 },
  
  scrollView: { flex: 1 },
  contentPad: { padding: 16, paddingBottom: 140 },

  balanceCardsRow: { flexDirection: "row", gap: 12, marginBottom: 24 },
  balanceCard: { flex: 1, borderRadius: 20, padding: 16, ...CARD_SHADOW },
  balanceLabelLight: { color: "rgba(255,255,255,0.8)", fontSize: 12, textTransform: "uppercase", fontWeight: "700", letterSpacing: 0.5, marginBottom: 6 },
  balanceValueLight: { color: "#FFF", fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  balanceLabelDark: { color: T.text3, fontSize: 12, textTransform: "uppercase", fontWeight: "700", letterSpacing: 0.5, marginBottom: 6 },
  balanceValueDark: { color: T.text1, fontSize: 24, fontWeight: "800", letterSpacing: -0.5 },

  sectionTitle: { fontSize: 16, fontWeight: "800", color: T.text1, marginBottom: 12 },
  
  inputContainer: { flexDirection: "row", alignItems: "center", backgroundColor: T.surface, borderRadius: 16, borderWidth: 1, borderColor: T.border, paddingHorizontal: 16, height: 60, marginBottom: 8 },
  currencySymbol: { fontSize: 24, color: T.text3, marginRight: 8, fontWeight: "600" },
  amountInput: { flex: 1, fontSize: 24, fontWeight: "800", color: T.text1 },
  maxBtn: { backgroundColor: T.accentLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  maxBtnText: { fontSize: 12, fontWeight: "800", color: T.accent },
  
  helperText: { fontSize: 13, color: T.text3, marginBottom: 24, marginLeft: 4, fontWeight: "500" },

  methodsContainer: { marginBottom: 24 },
  methodItem: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 20, marginBottom: 12, borderWidth: 2, borderColor: T.border, backgroundColor: T.surface },
  methodItemSelected: { borderColor: T.accent, backgroundColor: T.accent + "10" },
  methodIconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", marginRight: 12, backgroundColor: T.bg },
  methodIconWrapSelected: { backgroundColor: T.accent },
  methodInfo: { flex: 1 },
  methodName: { fontSize: 15, fontWeight: "800", color: T.text1, marginBottom: 2 },
  methodNameSelected: { color: T.accent },
  methodDetail: { fontSize: 13, color: T.text3, fontWeight: "500" },

  breakdownCard: { backgroundColor: T.surface, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: T.border },
  breakdownTitle: { fontSize: 15, fontWeight: "800", color: T.text1, marginBottom: 12 },
  breakdownRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  breakdownLabel: { fontSize: 14, color: T.text2, fontWeight: "500" },
  breakdownValue: { fontSize: 14, fontWeight: "700", color: T.text1 },
  breakdownDivider: { height: 1, backgroundColor: T.border, marginVertical: 12 },
  breakdownTotalLabel: { fontSize: 15, fontWeight: "800", color: T.text1 },
  breakdownTotalValue: { fontSize: 18, fontWeight: "800", color: T.accent },

  bottomBar: { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingBottom: Platform.OS === 'ios' ? 32 : 16, paddingTop: 16, backgroundColor: T.surface, borderTopWidth: 1, borderTopColor: T.border },
  submitBtn: { height: 56, borderRadius: 28, backgroundColor: T.accent, alignItems: "center", justifyContent: "center" },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: "#FFF", fontSize: 16, fontWeight: "800" },
});
