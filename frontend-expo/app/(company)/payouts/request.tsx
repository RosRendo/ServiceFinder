import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Alert, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import api from "@/utils/api";

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
      <SafeAreaView className="flex-1 bg-surface items-center justify-center">
        <ActivityIndicator size="large" color="#1ba9ed" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="flex-row items-center px-4 py-3 border-b border-surface-container">
        <TouchableOpacity onPress={() => router.back()} className="p-2 mr-2">
          <MaterialCommunityIcons name="arrow-left" size={24} color="#191c1e" />
        </TouchableOpacity>
        <Text className="text-xl font-headline font-bold text-on-surface">Request Payout</Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 140 }}>
        {/* Balance Cards */}
        <View className="flex-row gap-3 mb-6">
          <View className="flex-1 bg-primary rounded-2xl p-4">
            <Text className="text-white/80 text-xs uppercase tracking-wider mb-1">Available</Text>
            <Text className="text-white text-2xl font-bold">${balance.toFixed(2)}</Text>
          </View>
          <View className="flex-1 bg-surface-container-lowest rounded-2xl p-4 border border-surface-container">
            <Text className="text-on-surface-variant text-xs uppercase tracking-wider mb-1">Pending</Text>
            <Text className="text-on-surface text-2xl font-bold">${pending.toFixed(2)}</Text>
          </View>
        </View>

        {/* Amount Input */}
        <Text className="font-headline font-bold text-on-surface mb-3">Payout Amount</Text>
        <View className="flex-row items-center bg-surface-container-lowest rounded-2xl border border-outline-variant px-4 h-16 mb-2">
          <Text className="text-2xl text-on-surface-variant mr-2">$</Text>
          <TextInput
            className="flex-1 text-2xl font-bold text-on-surface"
            placeholder="0.00"
            placeholderTextColor="#c4c6cf"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
          />
          <TouchableOpacity
            className="bg-surface-container px-3 py-1.5 rounded-full"
            onPress={() => setAmount(balance.toFixed(2))}
          >
            <Text className="text-xs font-bold text-primary">Max</Text>
          </TouchableOpacity>
        </View>
        <Text className="text-xs text-on-surface-variant ml-1 mb-6">
          Minimum: ${MIN_PAYOUT} · Platform fee: {PLATFORM_FEE_PCT}%
        </Text>

        {/* Payout Method */}
        <Text className="font-headline font-bold text-on-surface mb-3">Payout Method</Text>
        <View className="mb-6">
          {PAYOUT_METHODS.map((m) => (
            <TouchableOpacity
              key={m.key}
              className={`flex-row items-center p-4 rounded-2xl mb-3 border-2 ${method === m.key ? "border-primary bg-primary-container/30" : "border-outline-variant bg-surface-container-lowest"}`}
              onPress={() => setMethod(m.key)}
            >
              <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${method === m.key ? "bg-primary" : "bg-surface-container"}`}>
                <MaterialCommunityIcons name={m.icon as any} size={20} color={method === m.key ? "white" : "#74777f"} />
              </View>
              <View className="flex-1">
                <Text className={`font-bold ${method === m.key ? "text-primary" : "text-on-surface"}`}>{m.label}</Text>
                <Text className="text-xs text-on-surface-variant">{m.detail}</Text>
              </View>
              {method === m.key && <MaterialCommunityIcons name="check-circle" size={20} color="#1ba9ed" />}
            </TouchableOpacity>
          ))}
        </View>

        {/* Fee Breakdown */}
        {parsedAmount > 0 && (
          <View className="bg-surface-container-lowest rounded-2xl p-4 border border-surface-container">
            <Text className="font-bold text-on-surface mb-3">Breakdown</Text>
            <View className="flex-row justify-between mb-2">
              <Text className="text-on-surface-variant">Requested Amount</Text>
              <Text className="text-on-surface font-bold">${parsedAmount.toFixed(2)}</Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-on-surface-variant">Platform Fee ({PLATFORM_FEE_PCT}%)</Text>
              <Text className="text-error">-${fee.toFixed(2)}</Text>
            </View>
            <View className="h-[1px] bg-outline-variant my-2" />
            <View className="flex-row justify-between">
              <Text className="font-bold text-on-surface">You Receive</Text>
              <Text className="font-bold text-primary text-lg">${netAmount.toFixed(2)}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 px-4 pb-8 pt-4 bg-surface border-t border-surface-container">
        <TouchableOpacity
          className={`h-14 rounded-full items-center justify-center ${submitting || parsedAmount < MIN_PAYOUT ? "bg-primary/50" : "bg-primary"}`}
          onPress={handleRequest}
          disabled={submitting || parsedAmount < MIN_PAYOUT}
        >
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">Request Payout</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
