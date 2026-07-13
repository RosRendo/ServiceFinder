import React, { useState, useCallback } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { api } from "@/store/authStore";

type PayoutStatus = "pending" | "processing" | "completed" | "failed";
type Method = "bank_transfer" | "mobile_wallet" | "check";

interface PayoutRequest {
  id: string;
  amount: number;
  status: PayoutStatus;
  method: Method;
  createdAt: string;
  processedAt?: string;
  reference?: string;
}

const STATUS_STYLE: Record<PayoutStatus, { bg: string; color: string; icon: string }> = {
  pending:    { bg: "#fef3c7", color: "#d97706", icon: "clock-outline" },
  processing: { bg: "#dbeafe", color: "#1d4ed8", icon: "progress-clock" },
  completed:  { bg: "#d1fae5", color: "#059669", icon: "check-circle" },
  failed:     { bg: "#fee2e2", color: "#dc2626", icon: "close-circle" },
};

const METHOD_LABELS: Record<Method, string> = {
  bank_transfer:  "Bank Transfer",
  mobile_wallet:  "Mobile Wallet",
  check:          "Check",
};

export default function CompanyPayoutsScreen() {
  const router = useRouter();

  const [balance, setBalance] = useState<number>(0);
  const [totalPaid, setTotalPaid] = useState<number>(0);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Request payout modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [reqAmount, setReqAmount] = useState("");
  const [reqMethod, setReqMethod] = useState<Method>("bank_transfer");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) { setRefreshing(true); } else { setLoading(true); }
    try {
      const res = await api.get("/api/company/payouts");
      const data = res.data?.data ?? res.data;
      setBalance(Number(data?.availableBalance ?? 0));
      const payoutsArr = Array.isArray(data?.payouts) ? data.payouts : [];
      setPayouts(payoutsArr);
      setTotalPaid(payoutsArr.filter((p: any) => p.status === 'completed').reduce((sum: number, p: any) => sum + Number(p.amount), 0));
    } catch (e) {
      console.error("Failed to load payouts", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleRequestPayout = async () => {
    const amount = parseFloat(reqAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount.");
      return;
    }
    if (amount > balance) {
      Alert.alert("Insufficient Balance", `Maximum available is $${balance.toFixed(2)}.`);
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/api/company/payouts/request", {
        amount,
        method: reqMethod,
      });
      setModalVisible(false);
      setReqAmount("");
      Alert.alert("✅ Request Submitted", "Your payout request has been submitted and will be processed within 1-3 business days.");
      await load();
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.message ?? "Failed to submit payout request.");
    } finally {
      setSubmitting(false);
    }
  };

  const fmt = (n: number) =>
    `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const METHODS: { id: Method; label: string; icon: string; sublabel: string }[] = [
    { id: "bank_transfer", label: "Bank Transfer",  icon: "bank",   sublabel: "2-3 business days" },
    { id: "mobile_wallet", label: "Mobile Wallet",  icon: "wallet", sublabel: "Instant" },
    { id: "check",         label: "Check",           icon: "checkbook", sublabel: "5-7 business days" },
  ];

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4 border-b border-surface-container bg-surface-container-lowest">
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 rounded-full items-center justify-center">
          <MaterialCommunityIcons name="arrow-left" size={24} color="#002045" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-primary">Payouts</Text>
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          className="px-3 py-1.5 bg-[#002045] rounded-full"
        >
          <Text className="text-white text-xs font-bold">Request</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#002045" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
          contentContainerStyle={{ padding: 16, paddingBottom: 60, gap: 16 }}
        >
          {/* Balance Cards */}
          <View className="flex-row gap-3">
            <View className="flex-1 bg-[#002045] rounded-2xl p-5">
              <MaterialCommunityIcons name="cash-multiple" size={24} color="#86a0cd" />
              <Text className="text-blue-300 text-xs mt-3 mb-1">Available Balance</Text>
              <Text className="text-white text-2xl font-extrabold">{fmt(balance)}</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(true)}
                className="mt-3 bg-white/10 rounded-full py-2 items-center"
              >
                <Text className="text-white text-xs font-bold">Withdraw</Text>
              </TouchableOpacity>
            </View>
            <View className="flex-1 bg-green-50 border border-green-200 rounded-2xl p-5">
              <MaterialCommunityIcons name="bank-transfer-out" size={24} color="#059669" />
              <Text className="text-green-600 text-xs mt-3 mb-1">Total Paid Out</Text>
              <Text className="text-green-700 text-2xl font-extrabold">{fmt(totalPaid)}</Text>
              <Text className="text-green-500 text-xs mt-3">Lifetime earnings</Text>
            </View>
          </View>

          {/* Payout History */}
          <Text className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
            Payout History
          </Text>

          {payouts.length === 0 ? (
            <View className="items-center justify-center py-16">
              <MaterialCommunityIcons name="bank-transfer-out" size={48} color="#9CA3AF" />
              <Text className="text-on-surface-variant font-semibold mt-3">No payouts yet</Text>
              <Text className="text-on-surface-variant text-sm mt-1 text-center">
                Request a payout when your balance is ready
              </Text>
            </View>
          ) : (
            payouts.map((payout) => {
              const st = STATUS_STYLE[payout.status] ?? STATUS_STYLE.pending;
              return (
                <View
                  key={payout.id}
                  className="bg-surface-container-lowest rounded-xl border border-surface-container p-4 flex-row items-center gap-4"
                >
                  <View style={{ backgroundColor: st.bg }} className="w-11 h-11 rounded-full items-center justify-center flex-shrink-0">
                    <MaterialCommunityIcons name={st.icon as any} size={20} color={st.color} />
                  </View>
                  <View className="flex-1">
                    <Text className="font-bold text-on-surface text-sm">{fmt(payout.amount)}</Text>
                    <Text className="text-xs text-on-surface-variant mt-0.5">
                      {METHOD_LABELS[payout.method]} · {new Date(payout.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </Text>
                    {payout.reference && (
                      <Text className="text-[10px] text-on-surface-variant mt-0.5">Ref: {payout.reference}</Text>
                    )}
                  </View>
                  <View style={{ backgroundColor: st.bg }} className="px-2.5 py-1 rounded-full">
                    <Text style={{ color: st.color }} className="text-[10px] font-bold capitalize">{payout.status}</Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Request Payout Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View className="flex-1 bg-black/40 justify-end">
          <View className="bg-white rounded-t-3xl px-6 pt-6 pb-10">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-primary">Request Payout</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Balance reminder */}
            <View className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-5 flex-row items-center gap-3">
              <MaterialCommunityIcons name="information" size={18} color="#1d4ed8" />
              <Text className="text-sm text-blue-700 flex-1">
                Available balance: <Text className="font-bold">{fmt(balance)}</Text>
              </Text>
            </View>

            {/* Amount input */}
            <Text className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-2">Amount</Text>
            <View className="flex-row items-center border border-surface-container rounded-xl px-4 py-3 mb-5 bg-surface-container-lowest">
              <Text className="text-on-surface-variant font-bold text-lg mr-1">$</Text>
              <TextInput
                className="flex-1 text-xl font-bold text-on-surface"
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={reqAmount}
                onChangeText={setReqAmount}
              />
              <TouchableOpacity onPress={() => setReqAmount(balance.toFixed(2))} className="bg-surface-container px-3 py-1.5 rounded-lg">
                <Text className="text-xs font-bold text-primary">MAX</Text>
              </TouchableOpacity>
            </View>

            {/* Method selection */}
            <Text className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-3">Payout Method</Text>
            <View className="gap-2 mb-6">
              {METHODS.map((m) => (
                <TouchableOpacity
                  key={m.id}
                  onPress={() => setReqMethod(m.id)}
                  className={`flex-row items-center p-3 rounded-xl border ${reqMethod === m.id ? "border-[#002045] bg-blue-50" : "border-surface-container bg-surface-container-lowest"}`}
                >
                  <View className={`w-9 h-9 rounded-full items-center justify-center mr-3 ${reqMethod === m.id ? "bg-[#002045]" : "bg-surface-container"}`}>
                    <MaterialCommunityIcons name={m.icon as any} size={18} color={reqMethod === m.id ? "white" : "#6B7280"} />
                  </View>
                  <View className="flex-1">
                    <Text className={`text-sm font-bold ${reqMethod === m.id ? "text-primary" : "text-on-surface"}`}>{m.label}</Text>
                    <Text className="text-xs text-on-surface-variant">{m.sublabel}</Text>
                  </View>
                  {reqMethod === m.id && <MaterialCommunityIcons name="check-circle" size={20} color="#002045" />}
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={handleRequestPayout}
              disabled={submitting || !reqAmount}
              className={`py-4 rounded-full items-center justify-center ${reqAmount && !submitting ? "bg-[#002045]" : "bg-surface-container-high"}`}
            >
              {submitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className={`font-bold text-base ${reqAmount ? "text-white" : "text-on-surface-variant"}`}>
                  Confirm Payout Request
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
