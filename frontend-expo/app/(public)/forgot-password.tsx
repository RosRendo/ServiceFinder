/**
 * Forgot Password Screen — Premium Redesign
 */
import React, { useState, useRef, useEffect } from "react";
import { ScrollView, View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, StyleSheet, Keyboard, Platform, Animated, Easing, KeyboardAvoidingView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { api } from "@/store/authStore";
import { useTranslation } from "react-i18next";
import { Theme } from "@/constants/theme";

const T = Theme.colors;

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  android: { elevation: 2 },
});

// ─── Animated Error Banner ───────────────────────────────────
function AnimatedErrorBanner({ error }: { error: string }) {
  const slideAnim = useRef(new Animated.Value(-20)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 8, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true })
    ]).start();
  }, [error]);

  if (!error) return null;

  return (
    <Animated.View style={[s.errorBox, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <MaterialCommunityIcons name="alert-circle" size={20} color={T.error} />
      <Text style={s.errorText}>{error}</Text>
    </Animated.View>
  );
}

// ─── Animated Hero Icon ──────────────────────────────────────
function AnimatedHeroIcon({ icon }: { icon: string }) {
  const floatAnim = useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -8, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={[s.heroIconWrap, { transform: [{ translateY: floatAnim }] }]}>
      <MaterialCommunityIcons name={icon as any} size={40} color={T.accent} />
    </Animated.View>
  );
}

export default function ForgotPassword() {
  const router = useRouter();
  const { t } = useTranslation();
  const [identifier, setIdentifier] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  // Resend cooldown (seconds) — mirrors the backend OTP cooldown.
  const [resendCountdown, setResendCountdown] = useState(0);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const id = setTimeout(() => setResendCountdown((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [resendCountdown]);

  const handleReset = async () => {
    Keyboard.dismiss();
    const cleanId = identifier.trim();
    if (!cleanId) {
      setError("Please enter your email or phone number");
      return;
    }
    // Client-side validation mirroring the backend: email format, or
    // 7-14 digits for a phone number (Khmer numbers are 8-10 digits).
    const isEmail = cleanId.includes("@");
    if (isEmail) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanId)) {
        setError("Please enter a valid email address");
        return;
      }
    } else if (!/^\d{7,14}$/.test(cleanId.replace(/[\s\-().]/g, ""))) {
      setError("Please enter a valid phone number (e.g. 012 345 678)");
      return;
    }
    setError("");
    setIsLoading(true);

    try {
      const payload = isEmail ? { email: cleanId } : { phone: cleanId };
      await api.post("/api/auth/request", payload);
      setSuccess(true);
      setResendCountdown(60);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to send reset code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.root}>
      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={s.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
        <View style={{ flex: 1, justifyContent: "center" }}>
        {/* Back Button */}
        <TouchableOpacity style={s.backBtn} onPress={() => { if (router.canGoBack()) router.back(); else router.replace("/"); }}>
          <MaterialCommunityIcons name="chevron-left" size={32} color={T.text1} />
        </TouchableOpacity>

        {/* Header */}
        <AnimatedHeroIcon icon="lock-reset" />
        <View style={s.header}>
          <Text style={s.title}>{t('auth.resetPassword')}</Text>
          <Text style={s.subtitle}>{t('auth.resetSubtitle')}</Text>
        </View>

        {/* Error Banner */}
        <AnimatedErrorBanner error={error} />

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
              style={[s.btnResend, (isLoading || resendCountdown > 0) && { opacity: 0.5 }]}
              onPress={handleReset}
              disabled={isLoading || resendCountdown > 0}
              activeOpacity={0.8}
            >
              <Text style={s.btnResendText}>
                {resendCountdown > 0
                  ? `Resend code in ${resendCountdown}s`
                  : "Resend code"}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[s.btnSecondary, { marginTop: 4 }]}
              onPress={() => { if (router.canGoBack()) router.back(); else router.replace("/"); }}
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
        </View>
      </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  container: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 80, paddingBottom: 40 },
  backBtn: { position: "absolute", top: 16, left: 8, zIndex: 10, padding: 8 },
  heroIconWrap: { width: 80, height: 80, borderRadius: 24, backgroundColor: T.surface, alignItems: "center", justifyContent: "center", marginBottom: 20, ...CARD_SHADOW },
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
  inputWrapperFocused: { borderColor: T.accent, backgroundColor: "#fff", ...CARD_SHADOW },
  input: { flex: 1, fontSize: 16, color: T.text1, fontWeight: "500" },

  btnPrimary: { width: "100%", backgroundColor: T.accent, borderRadius: 16, paddingVertical: 18, alignItems: "center", ...CARD_SHADOW },
  btnPrimaryText: { fontSize: 16, fontWeight: "800", color: "#fff", letterSpacing: 0.5 },

  btnResend: { alignItems: "center", paddingVertical: 14 },
  btnResendText: { fontSize: 15, fontWeight: "700", color: T.accent },

  btnSecondary: { width: "100%", backgroundColor: "transparent", borderRadius: 16, paddingVertical: 18, alignItems: "center" },
  btnSecondaryText: { fontSize: 16, fontWeight: "800", color: T.text2, letterSpacing: 0.5 },
});