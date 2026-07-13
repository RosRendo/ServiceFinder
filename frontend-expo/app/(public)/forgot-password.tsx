/**
 * Forgot Password Screen — Premium Redesign
 */
import React, { useState, useRef } from "react";
import { ScrollView, View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, StyleSheet, Keyboard } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { api } from "@/store/authStore";
import { useTranslation } from "react-i18next";

const T = {
  bg: "#FFFFFF", surface: "#F7F8FC", border: "#EAECF5",
  accent: "#0A192F", accentLight: "#F0F4F8",
  text1: "#111827", text2: "#4B5563", text3: "#9CA3AF",
  error: "#EF4444", errorBg: "#FEF2F2",
  success: "#10B981", successBg: "#ECFDF5",
};

export default function ForgotPassword() {
  const router = useRouter();
  const { t } = useTranslation();
  const [identifier, setIdentifier] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const handleReset = async () => {
    Keyboard.dismiss();
    const cleanId = identifier.trim().toLowerCase();
    if (!cleanId) {
      setError("Please enter your email or phone number");
      return;
    }
    setError("");
    setIsLoading(true);

    try {
      const isEmail = cleanId.includes("@");
      const payload = isEmail ? { email: cleanId } : { phone: cleanId };
      await api.post("/api/auth/request", payload);
      setSuccess(true);
    } catch (err: any) {
      // In a real app, you might not want to reveal if an email exists for security reasons.
      // But for UX, we show the error.
      setError(err.response?.data?.message || "Failed to send reset email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.root}>
      <ScrollView
        contentContainerStyle={s.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Back Button */}
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="chevron-left" size={32} color={T.text1} />
        </TouchableOpacity>

        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>{t('auth.resetPassword')}</Text>
          <Text style={s.subtitle}>{t('auth.resetSubtitle')}</Text>
        </View>

        {/* Error Banner */}
        {!!error && (
          <View style={s.errorBox}>
            <MaterialCommunityIcons name="alert-circle" size={20} color={T.error} />
            <Text style={s.errorText}>{error}</Text>
          </View>
        )}

        {/* Success Banner */}
        {success ? (
          <View style={s.successBox}>
            <View style={s.successIconWrap}>
              <MaterialCommunityIcons name="email-check-outline" size={32} color={T.success} />
            </View>
            <Text style={s.successTitle}>{identifier.includes("@") ? "Check your email" : "Check your phone"}</Text>
            <Text style={s.successText}>
              We've sent {identifier.includes("@") ? "a verification code" : "an OTP"} to <Text style={{ fontWeight: "800" }}>{identifier}</Text>.
            </Text>
            
            <TouchableOpacity 
              style={[s.btnPrimary, { marginTop: 24 }]}
              onPress={() => router.push({ pathname: '/reset-password', params: { identifier } })}
            >
              <Text style={s.btnPrimaryText}>{t('auth.enterResetCode')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[s.btnSecondary, { marginTop: 12 }]}
              onPress={() => router.back()}
            >
              <Text style={s.btnSecondaryText}>{t('auth.backToLogin')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ width: "100%" }}>
            {/* Email Field */}
            <View style={s.fieldGroup}>
              <Text style={s.inputLabel}>{t('auth.emailOrPhone').toUpperCase()}</Text>
              <View style={[s.inputWrapper, focusedInput === "identifier" && s.inputWrapperFocused]}>
                <MaterialCommunityIcons name="account-outline" size={22} color={focusedInput === "identifier" ? T.accent : T.text3} />
                <TextInput
                  style={s.input}
                  placeholder="Email or Phone Number"
                  placeholderTextColor={T.text3}
                  autoCapitalize="none"
                  keyboardType="default"
                  autoCorrect={false}
                  value={identifier}
                  onChangeText={(t) => { setIdentifier(t); setError(""); }}
                  onFocus={() => setFocusedInput("identifier")}
                  onBlur={() => setFocusedInput(null)}
                  onSubmitEditing={handleReset}
                  returnKeyType="send"
                />
              </View>
            </View>

            {/* Reset Button */}
            <TouchableOpacity 
              style={[s.btnPrimary, isLoading && { opacity: 0.7 }]}
              onPress={handleReset}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.btnPrimaryText}>{t('auth.sendCode')}</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  container: { flexGrow: 1, paddingHorizontal: 24, justifyContent: "center", paddingTop: 60, paddingBottom: 40 },
  backBtn: { position: "absolute", top: 16, left: 8, zIndex: 10, padding: 8 },
  header: { marginBottom: 32 },
  title: { fontSize: 32, fontWeight: "800", color: T.text1, letterSpacing: -0.5, marginBottom: 12 },
  subtitle: { fontSize: 16, color: T.text2, fontWeight: "500", lineHeight: 24 },

  errorBox: { backgroundColor: T.errorBg, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: "rgba(239,68,68,0.2)", flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 24 },
  errorText: { color: T.error, fontWeight: "600", fontSize: 13, flex: 1 },

  successBox: { alignItems: "center", paddingVertical: 24, backgroundColor: T.surface, borderRadius: 24, borderWidth: 1, borderColor: T.border, paddingHorizontal: 20 },
  successIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: T.successBg, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  successTitle: { fontSize: 20, fontWeight: "800", color: T.text1, marginBottom: 8 },
  successText: { fontSize: 15, color: T.text2, textAlign: "center", lineHeight: 22 },

  fieldGroup: { marginBottom: 24 },
  inputLabel: { fontSize: 11, fontWeight: "800", color: T.text2, letterSpacing: 1, marginBottom: 8, marginLeft: 4 },
  inputWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: T.surface, borderRadius: 14, paddingHorizontal: 16, height: 56, borderWidth: 1.5, borderColor: T.border, gap: 12 },
  inputWrapperFocused: { borderColor: T.accent, backgroundColor: "#fff" },
  input: { flex: 1, fontSize: 16, color: T.text1, fontWeight: "500" },

  btnPrimary: { width: "100%", backgroundColor: T.accent, borderRadius: 16, paddingVertical: 18, alignItems: "center" },
  btnPrimaryText: { fontSize: 16, fontWeight: "800", color: "#fff", letterSpacing: 0.5 },

  btnSecondary: { width: "100%", backgroundColor: "transparent", borderRadius: 16, paddingVertical: 18, alignItems: "center" },
  btnSecondaryText: { fontSize: 16, fontWeight: "800", color: T.text2, letterSpacing: 0.5 },
});