import React, { useState, useEffect } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import api from "@/utils/api";
import { Theme } from "@/constants/theme";

const T = Theme.colors;

const HERO_SHADOW = Platform.select({
  ios: { shadowColor: '#0A192F', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 16 },
  android: { elevation: 8 },
});

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  android: { elevation: 2 },
});

interface BankAccount {
  id: number;
  type: string;
  accountName: string;
  accountNumber: string;
  isDefault: boolean;
  isVerified: boolean;
}

export default function CompanyBankAccountScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  
  // Form State
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bankType, setBankType] = useState("ABA Bank");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/company/payment-methods");
      setAccounts(res.data?.methods || res.data || []);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleAddAccount = async () => {
    if (!accountName.trim() || !accountNumber.trim()) {
      Alert.alert("Missing Info", "Please enter both account name and number.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/api/company/payment-methods", {
        type: bankType,
        accountName,
        accountNumber,
        isDefault: accounts.length === 0, // make default if it's the first one
      });
      
      Alert.alert("Success", "Bank account added successfully!");
      setAccountName("");
      setAccountNumber("");
      setShowForm(false);
      fetchAccounts();
    } catch (error) {
      console.error("Failed to add account", error);
      Alert.alert("Error", "Could not save the account. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    Alert.alert("Delete Account", "Are you sure you want to remove this bank account?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Delete", 
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/api/company/payment-methods/${id}`);
            setAccounts(accounts.filter(a => a.id !== id));
          } catch (e) {
            Alert.alert("Error", "Could not delete account.");
          }
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={s.root} edges={["top", "bottom"]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={T.text1} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Payout Methods</Text>
        <View style={s.backBtn} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView style={s.scroll} contentContainerStyle={s.content}>
          <View style={s.infoBox}>
            <MaterialCommunityIcons name="shield-check" size={20} color={T.success} />
            <Text style={s.infoText}>Your bank details are securely stored. Payouts are manually processed by platform administrators.</Text>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={T.accent} style={{ marginTop: 40 }} />
          ) : showForm ? (
            <View style={s.formCard}>
              <Text style={s.formTitle}>Add Bank Account</Text>
              
              <View style={s.inputGroup}>
                <Text style={s.label}>Bank Name</Text>
                <TextInput
                  style={s.input}
                  value={bankType}
                  onChangeText={setBankType}
                  placeholder="e.g. ABA Bank, Acleda"
                  placeholderTextColor={T.text3}
                />
              </View>

              <View style={s.inputGroup}>
                <Text style={s.label}>Account Name</Text>
                <TextInput
                  style={s.input}
                  value={accountName}
                  onChangeText={setAccountName}
                  placeholder="e.g. Sok San"
                  placeholderTextColor={T.text3}
                />
              </View>

              <View style={s.inputGroup}>
                <Text style={s.label}>Account Number</Text>
                <TextInput
                  style={s.input}
                  value={accountNumber}
                  onChangeText={setAccountNumber}
                  placeholder="e.g. 000 123 456"
                  placeholderTextColor={T.text3}
                  keyboardType="numeric"
                />
              </View>

              <View style={s.formActions}>
                <TouchableOpacity 
                  style={[s.btn, s.btnOutline]} 
                  onPress={() => setShowForm(false)}
                  disabled={submitting}
                >
                  <Text style={s.btnOutlineText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[s.btn, s.btnPrimary]} 
                  onPress={handleAddAccount}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={s.btnPrimaryText}>Save Account</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={s.listContainer}>
              {accounts.length > 0 ? (
                <>
                  {accounts.map(acc => (
                    <View key={acc.id} style={s.accountCard}>
                      <View style={[s.accountIconBox, { backgroundColor: T.accentLight }]}>
                        <MaterialCommunityIcons name="bank" size={24} color={T.accent} />
                      </View>
                      <View style={s.accountInfo}>
                        <Text style={s.accountName}>{acc.type}</Text>
                        <Text style={s.accountNumber}>{acc.accountNumber}</Text>
                        <Text style={s.accountNameSub}>{acc.accountName}</Text>
                      </View>
                      <TouchableOpacity onPress={() => handleDelete(acc.id)} style={s.deleteBtn}>
                        <MaterialCommunityIcons name="trash-can-outline" size={22} color={T.error} />
                      </TouchableOpacity>
                    </View>
                  ))}
                  
                  {accounts.length < 3 && (
                    <TouchableOpacity
                      style={s.addBtn}
                      onPress={() => setShowForm(true)}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons name="plus" size={20} color="#fff" />
                      <Text style={s.addBtnText}>Add Another Account</Text>
                    </TouchableOpacity>
                  )}
                </>
              ) : (
                <View style={s.emptyState}>
                  <View style={s.emptyIconBox}>
                    <MaterialCommunityIcons name="bank-transfer" size={40} color={T.accent} />
                  </View>
                  <Text style={s.emptyTitle}>No Bank Account Found</Text>
                  <Text style={s.emptyBody}>
                    Add your local bank account details to receive payouts from the platform.
                  </Text>
                  
                  <TouchableOpacity
                    style={s.addBtn}
                    onPress={() => setShowForm(true)}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons name="plus" size={20} color="#fff" />
                    <Text style={s.addBtnText}>Add Bank Account</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, height: 56, backgroundColor: T.surface,
    borderBottomWidth: 1, borderBottomColor: T.border,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: T.text1 },
  
  scroll: { flex: 1 },
  content: { padding: 24, paddingBottom: 60 },

  infoBox: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#ECFDF5", padding: 16, borderRadius: 12,
    borderWidth: 1, borderColor: "#A7F3D0", marginBottom: 24,
  },
  infoText: { flex: 1, fontSize: 13, color: "#065F46", fontWeight: "500", lineHeight: 20 },

  // List State
  listContainer: { gap: 16 },
  accountCard: {
    flexDirection: "row", alignItems: "center", gap: 16,
    backgroundColor: T.surface, padding: 16, borderRadius: 16,
    borderWidth: 1, borderColor: T.border,
  },
  accountIconBox: {
    width: 48, height: 48, borderRadius: 12,
    backgroundColor: T.accentLight, alignItems: "center", justifyContent: "center",
  },
  accountInfo: { flex: 1 },
  accountName: { fontSize: 16, fontWeight: "700", color: T.text1, marginBottom: 2 },
  accountNumber: { fontSize: 14, color: T.accent, fontWeight: "600", marginBottom: 2 },
  accountNameSub: { fontSize: 13, color: T.text3 },
  deleteBtn: { padding: 8 },

  emptyState: {
    alignItems: "center", paddingVertical: 40,
    backgroundColor: T.surface, borderRadius: 16, borderWidth: 1, borderColor: T.border,
  },
  emptyIconBox: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: T.accentLight,
    alignItems: "center", justifyContent: "center", marginBottom: 16,
  },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: T.text1, marginBottom: 8 },
  emptyBody: { fontSize: 14, color: T.text3, textAlign: "center", paddingHorizontal: 32 },

  addBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: T.accent, height: 52, borderRadius: 16, marginTop: 16, borderWidth: 1, borderColor: T.border,
  },
  addBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },

  // Form State
  formCard: {
    backgroundColor: T.surface, borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: T.border,
  },
  formTitle: { fontSize: 18, fontWeight: "800", color: T.text1, marginBottom: 20 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "600", color: T.text2, marginBottom: 8 },
  input: {
    height: 48, borderWidth: 1, borderColor: T.border, borderRadius: 12,
    paddingHorizontal: 16, fontSize: 15, color: T.text1, backgroundColor: T.bg,
  },
  formActions: { flexDirection: "row", gap: 12, marginTop: 16 },
  btn: { flex: 1, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  btnOutline: { borderWidth: 1, borderColor: T.border, backgroundColor: T.surface },
  btnOutlineText: { color: T.text2, fontSize: 15, fontWeight: "600" },
  btnPrimary: { backgroundColor: T.accent },
  btnPrimaryText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
