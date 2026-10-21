import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuthStore, api } from "@/store/authStore";
import { Theme } from "@/constants/theme";

const T = Theme.colors;

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [step, setStep] = useState<"request" | "verify">("request");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const verificationMethod = user?.email ? "email" : "phone";
  const identifierValue = verificationMethod === "email" ? user?.email : user?.phone;

  const handleRequestOtp = async () => {
    if (!identifierValue) {
      Alert.alert("Error", "No email or phone associated with this account.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/api/auth/request", { [verificationMethod]: identifierValue });
      setStep("verify");
      Alert.alert(
        verificationMethod === "email" ? "Code Sent" : "OTP Sent", 
        verificationMethod === "email" 
          ? `A verification code has been sent to your email.` 
          : `An OTP has been sent to your phone.`
      );
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Failed to send verification code.";
      Alert.alert("Error", Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!code.trim() || !newPassword.trim()) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/api/auth/reset", {
        [verificationMethod]: identifierValue,
        code: code.trim(),
        newPassword: newPassword.trim(),
      });
      Alert.alert("Success", "Password changed successfully.");
      router.back();
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Failed to reset password.";
      Alert.alert("Error", Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={s.root} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.8}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Security Credentials</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={{ flex: 1 }}
      >
        <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled">
          
          <View style={s.infoBox}>
            <MaterialCommunityIcons name="shield-check-outline" size={24} color="#0F172A" />
            <Text style={s.infoText}>
              Two-factor challenge required. A verification challenge will be dispatched to your registered credentials before password alteration.
            </Text>
          </View>

          {/* Form Card */}
          <View style={s.card}>
            {/* Read-Only Account Target */}
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>Registered {verificationMethod === "email" ? "Email Address" : "Phone Number"}</Text>
              <View style={[s.inputWrap, s.inputWrapDisabled]}>
                <MaterialCommunityIcons name={verificationMethod === "email" ? "email-outline" : "phone-outline"} size={18} color="#64748B" />
                <Text style={s.inputTextDisabled}>{identifierValue}</Text>
              </View>
            </View>

            {step === "request" && (
              <TouchableOpacity
                onPress={handleRequestOtp}
                disabled={isSubmitting}
                style={[s.saveBtn, isSubmitting && s.saveBtnDisabled, { marginTop: 12 }]}
                activeOpacity={0.85}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={s.saveBtnText}>
                    {verificationMethod === "email" ? "Dispatch Verification Code" : "Dispatch OTP Code"}
                  </Text>
                )}
              </TouchableOpacity>
            )}

            {step === "verify" && (
              <>
                <View style={s.noticeBox}>
                  <Text style={s.noticeText}>
                    {verificationMethod === "email" 
                      ? "A 6-digit verification code was transmitted to your corporate email. Enter it below."
                      : "A 6-digit OTP code was transmitted to your corporate device. Enter it below."}
                  </Text>
                </View>

                <View style={s.fieldGroup}>
                  <Text style={s.fieldLabel}>
                    {verificationMethod === "email" ? "Security Code" : "OTP Code"}
                  </Text>
                  <View style={s.inputWrap}>
                    <MaterialCommunityIcons name="key-variant" size={18} color="#64748B" />
                    <TextInput
                      style={s.input}
                      placeholder={verificationMethod === "email" ? "Enter 6-digit code" : "Enter 6-digit OTP"}
                      placeholderTextColor="#94A3B8"
                      value={code}
                      onChangeText={setCode}
                      keyboardType="number-pad"
                      maxLength={6}
                    />
                  </View>
                </View>

                <View style={s.fieldGroup}>
                  <Text style={s.fieldLabel}>New Password</Text>
                  <View style={s.inputWrap}>
                    <MaterialCommunityIcons name="lock-outline" size={18} color="#64748B" />
                    <TextInput
                      style={s.input}
                      placeholder="Enter new strong password"
                      placeholderTextColor="#94A3B8"
                      value={newPassword}
                      onChangeText={setNewPassword}
                      secureTextEntry
                    />
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleResetPassword}
                  disabled={isSubmitting}
                  style={[s.saveBtn, isSubmitting && s.saveBtnDisabled, { marginTop: 12 }]}
                  activeOpacity={0.85}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={s.saveBtnText}>Commit New Password</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8FAFC" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backBtn: { width: 36, height: 36, borderRadius: 8, alignItems: "center", justifyContent: "center", marginLeft: -4 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A", letterSpacing: -0.3 },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 120 },

  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFFFFF", 
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 12,
  },
  infoText: { flex: 1, fontSize: 13, color: "#475569", lineHeight: 18, fontWeight: "500" },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  fieldGroup: { marginBottom: 16 },
  fieldLabel: { fontSize: 12, fontWeight: "700", color: "#475569", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.3 },
  
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 46,
  },
  inputWrapDisabled: { backgroundColor: "#F8FAFC" },
  
  input: { flex: 1, marginLeft: 10, fontSize: 14, color: "#0F172A", height: "100%" },
  inputTextDisabled: { marginLeft: 10, fontSize: 14, color: "#64748B", fontWeight: "600" },

  noticeBox: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  noticeText: { fontSize: 12, color: "#475569", lineHeight: 17, fontWeight: "500" },

  saveBtn: {
    backgroundColor: "#0F172A",
    borderRadius: 8,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
});
