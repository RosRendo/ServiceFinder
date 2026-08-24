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
  Image,
  StyleSheet,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import * as ImagePicker from 'expo-image-picker';
import { api, useAuthStore } from "@/store/authStore";
import { Theme } from "@/constants/theme";

const T = Theme.colors;

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  android: { elevation: 2 },
});

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
  pending:    { bg: "#FFFBEB", color: "#F59E0B", icon: "clock-outline" },
  processing: { bg: "#DBEAFE", color: "#2563EB", icon: "progress-clock" },
  completed:  { bg: "#ECFDF5", color: "#10B981", icon: "check-circle" },
  failed:     { bg: "#FEF2F2", color: "#EF4444", icon: "close-circle" },
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
  
  const { user } = useAuthStore();
  const [khqrImage, setKhqrImage] = useState<string | null>(null);
  const [isQrModalVisible, setIsQrModalVisible] = useState(false);
  const [isUploadingKhqr, setIsUploadingKhqr] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) { setRefreshing(true); } else { setLoading(true); }
    try {
      const res = await api.get("/api/company/payouts");
      const data = res.data?.data ?? res.data;
      setBalance(Number(data?.availableBalance ?? 0));
      if (data?.khqrImageUrl) {
        setKhqrImage(data.khqrImageUrl);
      }
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

  const handleUploadKHQR = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIsUploadingKhqr(true);
        const uri = result.assets[0].uri;
        
        const formData = new FormData();
        const filename = uri.split('/').pop() || 'khqr.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;

        formData.append('file', {
          uri,
          name: filename,
          type,
        } as any);

        const uploadRes = await api.post('/api/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        const uploadedUrl = uploadRes.data?.url || uploadRes.data?.data?.url;
        
        if (uploadedUrl) {
          await api.post('/api/wallets/my-company/khqr', { khqrImageUrl: uploadedUrl });
          setKhqrImage(uploadedUrl);
          Alert.alert("Success", "Company KHQR image uploaded successfully!");
        }
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not upload KHQR image.");
    } finally {
      setIsUploadingKhqr(false);
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
    <SafeAreaView style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={T.primary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Payouts</Text>
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={s.requestBtn}
        >
          <Text style={s.requestBtnText}>Request</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={T.primary} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={T.primary} />}
          contentContainerStyle={s.scrollContent}
        >
          {/* Balance Cards */}
          <View style={s.balanceRow}>
            <View style={s.balanceCardLeft}>
              <MaterialCommunityIcons name="cash-multiple" size={24} color="#86a0cd" />
              <Text style={s.balanceLabel}>Available Balance</Text>
              <Text style={s.balanceValue}>{fmt(balance)}</Text>
              <View style={s.withdrawBtnRow}>
                <TouchableOpacity
                  onPress={() => setModalVisible(true)}
                  style={s.withdrawBtn}
                >
                  <Text style={s.withdrawBtnText}>Withdraw</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setIsQrModalVisible(true)}
                  style={s.withdrawBtn}
                >
                  <MaterialCommunityIcons name="qrcode" size={14} color="#fff" style={s.qrIcon} />
                  <Text style={s.withdrawBtnText}>My KHQR</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={s.balanceCardRight}>
              <MaterialCommunityIcons name="bank-transfer-out" size={24} color={T.success} />
              <Text style={[s.balanceLabel, { color: T.success }]}>Total Paid Out</Text>
              <Text style={[s.balanceValue, { color: T.success }]}>{fmt(totalPaid)}</Text>
              <Text style={s.balanceSubtitle}>Lifetime earnings</Text>
            </View>
          </View>

          {/* Payout History */}
          <Text style={s.historyLabel}>
            Payout History
          </Text>

          {payouts.length === 0 ? (
            <View style={s.emptyState}>
              <MaterialCommunityIcons name="bank-transfer-out" size={48} color={T.text3} />
              <Text style={s.emptyTitle}>No payouts yet</Text>
              <Text style={s.emptyDesc}>
                Request a payout when your balance is ready
              </Text>
            </View>
          ) : (
            payouts.map((payout) => {
              const st = STATUS_STYLE[payout.status] ?? STATUS_STYLE.pending;
              return (
                <View key={payout.id} style={s.payoutCard}>
                  <View style={[s.payoutIconWrap, { backgroundColor: st.bg }]}>
                    <MaterialCommunityIcons name={st.icon as any} size={20} color={st.color} />
                  </View>
                  <View style={s.payoutTextWrap}>
                    <Text style={s.payoutAmount}>{fmt(payout.amount)}</Text>
                    <Text style={s.payoutMeta}>
                      {METHOD_LABELS[payout.method]} · {new Date(payout.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </Text>
                    {payout.reference && (
                      <Text style={s.payoutRef}>Ref: {payout.reference}</Text>
                    )}
                  </View>
                  <View style={[s.payoutBadge, { backgroundColor: st.bg }]}>
                    <Text style={[s.payoutBadgeText, { color: st.color }]}>{payout.status}</Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Request Payout Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Request Payout</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={s.modalCloseBtn}>
                <MaterialCommunityIcons name="close" size={24} color={T.text2} />
              </TouchableOpacity>
            </View>

            {/* Balance reminder */}
            <View style={s.infoBanner}>
              <MaterialCommunityIcons name="information" size={18} color={T.info} />
              <Text style={s.infoBannerText}>
                Available balance: <Text style={s.boldText}>{fmt(balance)}</Text>
              </Text>
            </View>

            {/* Amount input */}
            <Text style={s.inputLabel}>Amount</Text>
            <View style={s.inputWrap}>
              <Text style={s.inputPrefix}>$</Text>
              <TextInput
                style={s.textInput}
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={reqAmount}
                onChangeText={setReqAmount}
              />
              <TouchableOpacity onPress={() => setReqAmount(balance.toFixed(2))} style={s.maxBtn}>
                <Text style={s.maxBtnText}>MAX</Text>
              </TouchableOpacity>
            </View>

            {/* Method selection */}
            <Text style={s.inputLabel}>Payout Method</Text>
            <View style={s.methodList}>
              {METHODS.map((m) => (
                <TouchableOpacity
                  key={m.id}
                  onPress={() => setReqMethod(m.id)}
                  style={[
                    s.methodCard,
                    reqMethod === m.id ? s.methodCardActive : s.methodCardInactive
                  ]}
                >
                  <View style={[
                    s.methodIconWrap,
                    reqMethod === m.id ? s.methodIconWrapActive : s.methodIconWrapInactive
                  ]}>
                    <MaterialCommunityIcons name={m.icon as any} size={18} color={reqMethod === m.id ? "white" : T.text2} />
                  </View>
                  <View style={s.methodTextWrap}>
                    <Text style={[
                      s.methodLabel,
                      reqMethod === m.id ? s.methodLabelActive : s.methodLabelInactive
                    ]}>{m.label}</Text>
                    <Text style={s.methodSublabel}>{m.sublabel}</Text>
                  </View>
                  {reqMethod === m.id && <MaterialCommunityIcons name="check-circle" size={20} color={T.primary} />}
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={handleRequestPayout}
              disabled={submitting || !reqAmount}
              style={[
                s.confirmBtn,
                reqAmount && !submitting ? s.confirmBtnActive : s.confirmBtnInactive
              ]}
            >
              {submitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={[
                  s.confirmBtnText,
                  { color: reqAmount ? "white" : T.text2 }
                ]}>
                  Confirm Payout Request
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* KHQR Modal */}
      <Modal visible={isQrModalVisible} transparent animationType="fade" onRequestClose={() => setIsQrModalVisible(false)}>
        <View style={s.qrModalOverlay}>
          <View style={s.qrModalContent}>
            <TouchableOpacity 
              onPress={() => setIsQrModalVisible(false)}
              style={s.qrModalCloseBtn}
            >
              <MaterialCommunityIcons name="close" size={20} color={T.primary} />
            </TouchableOpacity>
            
            <Text style={s.qrModalTitle}>Company KHQR</Text>
            <Text style={s.qrModalDesc}>
              Upload your company KHQR so admins can transfer your payouts directly.
            </Text>

            <View style={s.qrCard}>
              <Text style={s.qrCardLabel}>
                Your KHQR Image
              </Text>
              
              {khqrImage ? (
                <View style={s.qrImageWrap}>
                  <Image 
                    source={{ uri: khqrImage }}
                    style={s.qrImage}
                    resizeMode="contain"
                  />
                </View>
              ) : (
                <View style={s.qrPlaceholder}>
                  <MaterialCommunityIcons name="qrcode-scan" size={48} color={T.text3} />
                  <Text style={s.qrPlaceholderText}>No KHQR Uploaded</Text>
                </View>
              )}
              
              <Text style={s.qrCompName}>{user?.fullName || 'Company Name'}</Text>
              <Text style={s.qrCompPhone}>{user?.phone || '012345678'}</Text>
              
              <TouchableOpacity 
                onPress={handleUploadKHQR} 
                disabled={isUploadingKhqr}
                style={s.qrUploadBtn}
              >
                {isUploadingKhqr ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <View style={s.qrUploadBtnRow}>
                    <MaterialCommunityIcons name="upload" size={16} color="#fff" />
                    <Text style={s.qrUploadBtnText}>
                      {khqrImage ? 'Replace KHQR' : 'Upload KHQR'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              onPress={() => setIsQrModalVisible(false)}
              style={s.qrCloseBtn}
            >
              <Text style={s.qrCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    backgroundColor: T.surface,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: T.primary,
  },
  requestBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: T.primary,
    borderRadius: 20,
  },
  requestBtnText: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 60,
  },
  balanceRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  balanceCardLeft: {
    flex: 1,
    backgroundColor: T.primary,
    borderRadius: 16,
    padding: 16,
    ...CARD_SHADOW,
  },
  balanceCardRight: {
    flex: 1,
    backgroundColor: T.successBg,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
    borderRadius: 16,
    padding: 16,
    ...CARD_SHADOW,
  },
  balanceLabel: {
    color: "#86a0cd",
    fontSize: 12,
    marginTop: 12,
    marginBottom: 4,
    fontWeight: "600",
  },
  balanceValue: {
    color: "white",
    fontSize: 22,
    fontWeight: "900",
  },
  withdrawBtnRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },
  withdrawBtn: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 16,
    paddingVertical: 8,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  withdrawBtnText: {
    color: "white",
    fontSize: 11,
    fontWeight: "700",
  },
  qrIcon: {
    marginRight: 4,
  },
  balanceSubtitle: {
    color: T.success,
    fontSize: 11,
    marginTop: 16,
    fontWeight: "600",
  },
  historyLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: T.text3,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
  },
  emptyTitle: {
    color: T.text2,
    fontWeight: "700",
    marginTop: 12,
    fontSize: 15,
  },
  emptyDesc: {
    color: T.text3,
    fontSize: 13,
    marginTop: 4,
    textAlign: "center",
  },
  payoutCard: {
    backgroundColor: T.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: T.border,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
    ...CARD_SHADOW,
  },
  payoutIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  payoutTextWrap: {
    flex: 1,
  },
  payoutAmount: {
    fontWeight: "700",
    color: T.text1,
    fontSize: 15,
  },
  payoutMeta: {
    fontSize: 12,
    color: T.text2,
    marginTop: 2,
    fontWeight: "500",
  },
  payoutRef: {
    fontSize: 10,
    color: T.text3,
    marginTop: 2,
    fontWeight: "600",
  },
  payoutBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  payoutBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: T.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: T.primary,
  },
  modalCloseBtn: {
    padding: 4,
  },
  infoBanner: {
    backgroundColor: T.blueBg,
    borderWidth: 1,
    borderColor: T.blueBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  infoBannerText: {
    fontSize: 14,
    color: T.blueText,
    flex: 1,
    fontWeight: "600",
  },
  boldText: {
    fontWeight: "700",
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: T.text3,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: T.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    backgroundColor: T.bg,
  },
  inputPrefix: {
    color: T.text1,
    fontWeight: "700",
    fontSize: 18,
    marginRight: 4,
  },
  textInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: T.text1,
  },
  maxBtn: {
    backgroundColor: T.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  maxBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: T.primary,
  },
  methodList: {
    gap: 8,
    marginBottom: 24,
  },
  methodCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  methodCardActive: {
    borderColor: T.primary,
    backgroundColor: T.accentLight,
  },
  methodCardInactive: {
    borderColor: T.border,
    backgroundColor: T.surface,
  },
  methodIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  methodIconWrapActive: {
    backgroundColor: T.primary,
  },
  methodIconWrapInactive: {
    backgroundColor: T.bg,
  },
  methodTextWrap: {
    flex: 1,
  },
  methodLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
  methodLabelActive: {
    color: T.primary,
  },
  methodLabelInactive: {
    color: T.text1,
  },
  methodSublabel: {
    fontSize: 12,
    color: T.text2,
    marginTop: 2,
  },
  confirmBtn: {
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    ...CARD_SHADOW,
  },
  confirmBtnActive: {
    backgroundColor: T.primary,
  },
  confirmBtnInactive: {
    backgroundColor: T.border,
  },
  confirmBtnText: {
    fontWeight: "700",
    fontSize: 16,
  },
  qrModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  qrModalContent: {
    backgroundColor: T.surface,
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
    position: "relative",
    ...CARD_SHADOW,
  },
  qrModalCloseBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    backgroundColor: T.bg,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  qrModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: T.primary,
    marginBottom: 4,
    marginTop: 8,
  },
  qrModalDesc: {
    fontSize: 12,
    color: T.text2,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 18,
  },
  qrCard: {
    width: "100%",
    borderWidth: 2,
    borderColor: "#00A699",
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    backgroundColor: T.surface,
    marginBottom: 20,
  },
  qrCardLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#00A699",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  qrImageWrap: {
    width: 160,
    height: 160,
    borderRadius: 12,
    overflow: "hidden",
  },
  qrImage: {
    width: "100%",
    height: "100%",
  },
  qrPlaceholder: {
    width: 160,
    height: 160,
    borderRadius: 12,
    backgroundColor: T.bg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: T.border,
  },
  qrPlaceholderText: {
    fontSize: 11,
    fontWeight: "600",
    color: T.text3,
    marginTop: 8,
  },
  qrCompName: {
    fontSize: 14,
    fontWeight: "700",
    color: T.text1,
    marginTop: 16,
  },
  qrCompPhone: {
    fontSize: 12,
    color: T.text3,
    marginTop: 2,
    fontWeight: "600",
  },
  qrUploadBtn: {
    marginTop: 16,
    backgroundColor: "#00A699",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  qrUploadBtnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  qrUploadBtnText: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
  },
  qrCloseBtn: {
    width: "100%",
    backgroundColor: T.primary,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: "center",
  },
  qrCloseBtnText: {
    color: "white",
    fontWeight: "700",
    fontSize: 15,
  },
});
