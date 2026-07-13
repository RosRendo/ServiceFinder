/**
 * Reset Password Screen — Premium UI
 */
import React, { useState, useEffect, useRef } from "react";
import { ScrollView, View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, Keyboard, Animated, Platform, Easing, KeyboardAvoidingView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { api } from "@/store/authStore";
import { useTranslation } from "react-i18next";

const T = {
  bg: "#FFFFFF", surface: "#F7F8FC", border: "#EAECF5",
  accent: "#0A192F", accentLight: "#F0F4F8",
  text1: "#111827", text2: "#4B5563", text3: "#9CA3AF",
  error: "#EF4444", errorBg: "#FEF2F2",
  success: "#10B981", successBg: "#ECFDF5",
};

// Must match the backend regex: minimum 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character
const PASSWORD_REGEX = /((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/;

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

export default function ResetPassword() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const initialIdentifier = typeof params.identifier === 'string' ? params.identifier : '';

  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const handleReset = async () => {
    Keyboard.dismiss();
    
    if (!code.trim() || code.length !== 6) {
      setError(`Please enter the valid 6-character ${initialIdentifier.includes("@") ? "code" : "OTP"}`);
      return;
    }
    
    if (!newPassword || newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    
    if (!PASSWORD_REGEX.test(newPassword)) {
      setError("Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const isEmail = initialIdentifier.includes("@");
      const payload = isEmail ? { email: initialIdentifier } : { phone: initialIdentifier };
      await api.post("/api/auth/reset", { 
        ...payload, 
        code: code.trim(), 
        newPassword 
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to reset password. The code may be invalid or expired.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.root}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={s.container}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
        {/* Back Button */}
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="chevron-left" size={32} color={T.text1} />
        </TouchableOpacity>

        {/* Header */}
        <AnimatedHeroIcon icon="key-variant" />
        <View style={s.header}>
          <Text style={s.title}>{t('auth.createNewPassword')}</Text>
          <Text style={s.subtitle}>
            {t('auth.createNewSubtitle1')}<Text style={{ fontWeight: '800' }}>{initialIdentifier}</Text>{t('auth.createNewSubtitle2')}
          </Text>
        </View>

        {/* Error Banner */}
        <AnimatedErrorBanner error={error} />

        {/* Success Banner */}
        {success ? (
          <View style={s.successBox}>
            <View style={s.successIconWrap}>
               <MaterialCommunityIcons name="shield-check" size={32} color={T.success} />
            </View>
            <Text style={s.successTitle}>{t('auth.passwordResetTitle')}</Text>
            <Text style={s.successText}>
              {t('auth.passwordResetDesc')}
            </Text>
            
            <TouchableOpacity 
              style={[s.btnPrimary, { marginTop: 24 }]}
              onPress={() => router.replace('/login')}
            >
              <Text style={s.btnPrimaryText}>{t('auth.goToLogin')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ width: "100%" }}>
            
            {/* Code Field */}
            <View style={s.fieldGroup}>
              <Text style={s.inputLabel}>{t('auth.verificationCode').toUpperCase()}</Text>
              <View style={[s.inputWrapper, focusedInput === "code" && s.inputWrapperFocused]}>
                <MaterialCommunityIcons name="form-textbox-password" size={22} color={focusedInput === "code" ? T.accent : T.text3} />
                <TextInput
                  style={[s.input, { letterSpacing: 2, fontSize: 18 }]}
                  placeholder="------"
                  placeholderTextColor={T.text3}
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={6}
                  value={code}
                  onChangeText={(t) => { setCode(t); setError(""); }}
                  onFocus={() => setFocusedInput("code")}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>
            </View>

            {/* New Password */}
            <View style={s.fieldGroup}>
              <Text style={s.inputLabel}>{t('auth.newPassword').toUpperCase()}</Text>
              <View style={[s.inputWrapper, focusedInput === "newPass" && s.inputWrapperFocused]}>
                <MaterialCommunityIcons name="lock-outline" size={22} color={focusedInput === "newPass" ? T.accent : T.text3} />
                <TextInput
                  style={s.input}
                  placeholder="Enter new password"
                  placeholderTextColor={T.text3}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  value={newPassword}
                  onChangeText={(t) => { setNewPassword(t); setError(""); }}
                  onFocus={() => setFocusedInput("newPass")}
                  onBlur={() => setFocusedInput(null)}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                  <MaterialCommunityIcons name={showPassword ? "eye-off-outline" : "eye-outline"} size={22} color={T.text3} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password */}
            <View style={s.fieldGroup}>
              <Text style={s.inputLabel}>{t('auth.confirmPassword').toUpperCase()}</Text>
              <View style={[s.inputWrapper, focusedInput === "confirmPass" && s.inputWrapperFocused]}>
                <MaterialCommunityIcons name="lock-check-outline" size={22} color={focusedInput === "confirmPass" ? T.accent : T.text3} />
                <TextInput
                  style={s.input}
                  placeholder="Confirm new password"
                  placeholderTextColor={T.text3}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  value={confirmPassword}
                  onChangeText={(t) => { setConfirmPassword(t); setError(""); }}
                  onFocus={() => setFocusedInput("confirmPass")}
                  onBlur={() => setFocusedInput(null)}
                  onSubmitEditing={handleReset}
                  returnKeyType="done"
                />
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity 
              style={[s.btnPrimary, isLoading && { opacity: 0.7 }, { marginTop: 8 }]}
              onPress={handleReset}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.btnPrimaryText}>{t('auth.updatePassword')}</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  container: { flexGrow: 1, paddingHorizontal: 24, justifyContent: "center", paddingTop: 60, paddingBottom: 40 },
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
});
