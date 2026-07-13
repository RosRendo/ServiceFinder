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

const T = {
  bg: "#FFFFFF", surface: "#FFFFFF", border: "#EBEBEB",
  accent: "#0A192F", text1: "#111827", text2: "#717171", text3: "#B0B0B0",
  inputBg: "#F9FAFB", inputBgDisabled: "#F3F4F6",
  successBg: "#D1FAE5", successText: "#065F46"
};

const HERO_CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#0A192F', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 16 },
  android: { elevation: 8 },
});

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  android: { elevation: 2 },
});

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
          <MaterialCommunityIcons name="arrow-left" size={24} color={T.accent} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Change Password</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={{ flex: 1 }}
      >
        <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled">
          
          <View style={s.infoBox}>
            <MaterialCommunityIcons name="shield-lock-outline" size={32} color={T.accent} />
            <Text style={s.infoText}>
              For your security, we require verification before changing your password.
            </Text>
          </View>

          {/* Read-Only Email */}
          <View style={s.fieldGroup}>
            <Text style={s.fieldLabel}>Account {verificationMethod === "email" ? "Email" : "Phone"}</Text>
            <View style={[s.inputWrap, s.inputWrapDisabled]}>
              <MaterialCommunityIcons name={verificationMethod === "email" ? "email-outline" : "phone-outline"} size={20} color={T.text3} />
              <Text style={s.inputTextDisabled}>{identifierValue}</Text>
            </View>
          </View>

          {step === "request" && (
            <TouchableOpacity
              onPress={handleRequestOtp}
              disabled={isSubmitting}
              style={[s.saveBtn, isSubmitting && s.saveBtnDisabled, { marginTop: 24 }]}
              activeOpacity={0.85}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.saveBtnText}>
                  {verificationMethod === "email" ? "Send Verification Code" : "Send OTP"}
                </Text>
              )}
            </TouchableOpacity>
          )}

          {step === "verify" && (
            <>
              <View style={[s.infoBox, { backgroundColor: T.successBg, marginTop: 16 }]}>
                <Text style={[s.infoText, { color: T.successText }]}>
                  {verificationMethod === "email" 
                    ? "We've sent a 6-digit code verification to your email. Enter it below to proceed."
                    : "We've sent a 6-digit OTP to your phone. Enter it below to proceed."}
                </Text>
              </View>

              <View style={s.fieldGroup}>
                <Text style={s.fieldLabel}>
                  {verificationMethod === "email" ? "Verification Code" : "OTP"}
                </Text>
                <View style={s.inputWrap}>
                  <MaterialCommunityIcons name="key-variant" size={20} color={T.text2} />
                  <TextInput
                    style={s.input}
                    placeholder={verificationMethod === "email" ? "Enter 6-digit code" : "Enter 6-digit OTP"}
                    placeholderTextColor={T.text3}
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
                  <MaterialCommunityIcons name="lock-outline" size={20} color={T.text2} />
                  <TextInput
                    style={s.input}
                    placeholder="Enter new password"
                    placeholderTextColor={T.text3}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                  />
                </View>
              </View>

              <TouchableOpacity
                onPress={handleResetPassword}
                disabled={isSubmitting}
                style={[s.saveBtn, isSubmitting && s.saveBtnDisabled, { marginTop: 24 }]}
                activeOpacity={0.85}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={s.saveBtnText}>Change Password</Text>
                )}
              </TouchableOpacity>
            </>
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
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: T.surface, borderBottomWidth: 1, borderBottomColor: T.border,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: T.text1 },

  scroll: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 60 },

  infoBox: {
    alignItems: "center", backgroundColor: T.surface, 
    padding: 20, borderRadius: 16, marginBottom: 32,
    borderWidth: 1, borderColor: T.border, gap: 12
  },
  infoText: { fontSize: 14, color: T.text2, textAlign: "center", lineHeight: 20, fontWeight: "500" },

  fieldGroup: { marginBottom: 24 },
  fieldLabel: { fontSize: 13, fontWeight: "700", color: T.text2, marginBottom: 8 },
  
  inputWrap: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: T.inputBg, borderWidth: 1, borderColor: T.border,
    borderRadius: 14, paddingHorizontal: 16, height: 56,
  },
  inputWrapDisabled: { backgroundColor: T.inputBgDisabled, borderColor: T.inputBgDisabled },
  
  input: { flex: 1, marginLeft: 12, fontSize: 16, color: T.text1, height: "100%" },
  inputTextDisabled: { marginLeft: 12, fontSize: 16, color: T.text2 },

  saveBtn: {
    backgroundColor: T.accent, borderRadius: 16, height: 56,
    alignItems: "center", justifyContent: "center", ...CARD_SHADOW,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 16, fontWeight: "800", color: "#fff" },
});
