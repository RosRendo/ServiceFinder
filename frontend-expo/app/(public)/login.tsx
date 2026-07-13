/**
 * Login Screen — Phone & OTP Auth
 */
import React, { useState, useRef, useEffect } from "react";
import {
  ScrollView, View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, StyleSheet, Animated, Keyboard, Platform, Pressable, Image, KeyboardAvoidingView
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuthStore, api } from "@/store/authStore";
import { useSocialAuth } from "@/hooks/useSocialAuth";
import { useTranslation } from "react-i18next";

import { Theme } from "@/constants/theme";

const T = {
  bg: Theme.colors.bg,
  surface: Theme.colors.surface,
  border: Theme.colors.border,
  accent: Theme.colors.primary,
  accentLight: Theme.colors.primaryLight,
  text1: Theme.colors.text,
  text2: Theme.colors.textMuted,
  text3: Theme.colors.textMuted,
  error: Theme.colors.error,
  errorBg: Theme.colors.errorBg,
  success: Theme.colors.success,
  successBg: Theme.colors.successBg,
};

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  android: { elevation: 2 },
});

// ─── Animated Error Banner ───────────────────────────────────
function AnimatedErrorBanner({ error }: { error: string }) {
  const slideAnim = useRef(new Animated.Value(-20)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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

export default function Login() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t } = useTranslation();
  const verifyOtp = useAuthStore((s) => s.verifyOtp);
  const { promptGoogleAsync, promptFacebookAsync, isGoogleReady, isFacebookReady } = useSocialAuth();

  const [step, setStep] = useState<"phone" | "otp" | "email" | "mfa">("phone");
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [tempMfaToken, setTempMfaToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const phoneRef = useRef<TextInput>(null);
  const otpRef = useRef<TextInput>(null);
  const mfaRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  useEffect(() => {
    if (params.method === 'google') {
      handleSocialLogin("google");
    } else if (params.method === 'email') {
      setStep("email");
    }
  }, [params.method]);

  const navigateUser = (user: any) => {
    const role = user.role?.toLowerCase();
    setTimeout(() => {
      if (role === "customer") router.replace("/(customer)/(tabs)/home");
      else if (role === "company" || role === "company_admin") router.replace("/(company)/(tabs)/dashboard");
      else if (role === "staff") router.replace("/(staff)/(tabs)/dashboard");
      else if (role === "admin") router.replace("/(admin)/(tabs)/dashboard");
      else setError(`Unknown role: ${role}. Contact support.`);
    }, 100);
  };

  const handleSendOtp = async () => {
    Keyboard.dismiss();
    const cleanPhone = phone.trim();
    if (!cleanPhone || cleanPhone.length < 8) {
      return setError("Please enter a valid phone number");
    }
    setError(""); setIsLoading(true);
    try {
      await api.post('/api/auth/send-otp', { phone: cleanPhone });
      setStep("otp");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to send OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    Keyboard.dismiss();
    const cleanPhone = phone.trim();
    const cleanOtp = otpCode.trim();
    
    if (!cleanOtp || cleanOtp.length < 6) {
      return setError("Please enter a valid 6-digit OTP");
    }
    
    setError(""); setIsLoading(true);
    try {
      await verifyOtp(cleanPhone, cleanOtp);
      const user = useAuthStore.getState().user;
      if (!user) return setError("Login failed: No user data.");
      navigateUser(user);
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid OTP code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    Keyboard.dismiss();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) return setError("Please enter both email and password");
    setError(""); setIsLoading(true);
    try {
      const result: any = await useAuthStore.getState().login(cleanEmail, password);
      
      if (result?.requiresMfa) {
        setTempMfaToken(result.tempMfaToken);
        setStep("mfa");
        setIsLoading(false);
        return;
      }

      const user = useAuthStore.getState().user;
      if (!user) return setError("Login failed: No user data.");
      navigateUser(user);
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyMfa = async () => {
    Keyboard.dismiss();
    const cleanCode = mfaCode.trim();
    if (!cleanCode || cleanCode.length < 6) return setError("Please enter a valid 6-digit MFA code");
    
    setError(""); setIsLoading(true);
    try {
      await useAuthStore.getState().verifyMfa(tempMfaToken, cleanCode);
      const user = useAuthStore.getState().user;
      if (!user) return setError("Login failed: No user data.");
      navigateUser(user);
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid MFA code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: "google" | "facebook") => {
    if (provider === 'google' && isGoogleReady) {
      await promptGoogleAsync();
    } else if (provider === 'facebook' && isFacebookReady) {
      await promptFacebookAsync();
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
        <TouchableOpacity style={s.backBtn} onPress={() => {
          if (step === "otp") setStep("phone");
          else if (step === "mfa") setStep("email");
          else router.back();
        }}>
          <MaterialCommunityIcons name="chevron-left" size={32} color={T.text1} />
        </TouchableOpacity>

        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>
            {step === "phone" ? "Welcome Back" : step === "email" ? "Login with Email" : step === "mfa" ? "Verification" : "Verify Number"}
          </Text>
          <Text style={s.subtitle}>
            {step === "phone" && "Enter your phone number to receive an OTP code"}
            {step === "otp" && `We've sent a 6-digit code to\n${phone}`}
            {step === "email" && "Log in with your email address"}
            {step === "mfa" && "Enter the 6-digit code from your authenticator app"}
          </Text>
        </View>

        {/* Error Banner */}
        <AnimatedErrorBanner error={error} />
        
        {step === "otp" && !error && (
          <View style={[s.errorBox, { backgroundColor: T.successBg, borderColor: "rgba(16,185,129,0.2)" }]}>
            <MaterialCommunityIcons name="check-circle" size={20} color={T.success} />
            <Text style={[s.errorText, { color: T.success }]}>OTP Sent! For testing, use: 123456</Text>
          </View>
        )}

        {step === "phone" ? (
          <>
            {/* Phone */}
            <View style={s.fieldGroup}>
              <Text style={s.inputLabel}>{t('auth.phoneNumber').toUpperCase()}</Text>
              <View style={[s.inputWrapper, focusedInput === "phone" && s.inputWrapperFocused]}>
                <MaterialCommunityIcons name="phone-outline" size={22} color={focusedInput === "phone" ? T.accent : T.text3} />
                <TextInput
                  ref={phoneRef}
                  style={s.input}
                  placeholder="+1 (555) 000-0000"
                  placeholderTextColor={T.text3}
                  keyboardType="phone-pad"
                  autoCorrect={false}
                  returnKeyType="send"
                  value={phone}
                  onChangeText={(t) => { setPhone(t); setError(""); }}
                  onFocus={() => setFocusedInput("phone")}
                  onBlur={() => setFocusedInput(null)}
                  onSubmitEditing={handleSendOtp}
                />
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[s.btnPrimary, isLoading && { opacity: 0.7 }]}
              onPress={handleSendOtp}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.btnPrimaryText}>{t('auth.sendCode')}</Text>
              }
            </TouchableOpacity>
          </>
        ) : step === "email" ? (
          <>
            {/* Email */}
            <View style={s.fieldGroup}>
              <Text style={s.inputLabel}>{t('auth.email').toUpperCase()}</Text>
              <View style={[s.inputWrapper, focusedInput === "email" && s.inputWrapperFocused]}>
                <MaterialCommunityIcons name="email-outline" size={22} color={focusedInput === "email" ? T.accent : T.text3} />
                <TextInput
                  ref={emailRef}
                  style={s.input}
                  placeholder="name@example.com"
                  placeholderTextColor={T.text3}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoCorrect={false}
                  returnKeyType="next"
                  value={email}
                  onChangeText={(t) => { setEmail(t); setError(""); }}
                  onFocus={() => setFocusedInput("email")}
                  onBlur={() => setFocusedInput(null)}
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />
              </View>
            </View>

            {/* Password */}
            <View style={s.fieldGroup}>
              <Text style={s.inputLabel}>{t('auth.password').toUpperCase()}</Text>
              <View style={[s.inputWrapper, focusedInput === "password" && s.inputWrapperFocused]}>
                <MaterialCommunityIcons name="lock-outline" size={22} color={focusedInput === "password" ? T.accent : T.text3} />
                <TextInput
                  ref={passwordRef}
                  style={s.input}
                  placeholder="••••••••"
                  placeholderTextColor={T.text3}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  value={password}
                  onChangeText={(t) => { setPassword(t); setError(""); }}
                  onFocus={() => setFocusedInput("password")}
                  onBlur={() => setFocusedInput(null)}
                  onSubmitEditing={handleEmailLogin}
                />
                <TouchableOpacity onPress={() => setShowPassword(p => !p)} hitSlop={8}>
                  <MaterialCommunityIcons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={T.text3} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={s.forgotBtn} onPress={() => router.push("/(public)/forgot-password")}>
                <Text style={s.forgotText}>{t('auth.forgotPassword')}</Text>
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[s.btnPrimary, isLoading && { opacity: 0.7 }]}
              onPress={handleEmailLogin}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.btnPrimaryText}>{t('auth.login')}</Text>
              }
            </TouchableOpacity>
          </>
        ) : step === "mfa" ? (
          <>
            <View style={s.fieldGroup}>
              <Text style={s.inputLabel}>AUTHENTICATOR CODE</Text>
              <View style={[s.inputWrapper, focusedInput === "mfa" && s.inputWrapperFocused]}>
                <MaterialCommunityIcons name="shield-check-outline" size={22} color={focusedInput === "mfa" ? T.accent : T.text3} />
                <TextInput
                  ref={mfaRef}
                  style={s.input}
                  placeholder="000000"
                  placeholderTextColor={T.text3}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={mfaCode}
                  onChangeText={(t) => { setMfaCode(t); setError(""); }}
                  onFocus={() => setFocusedInput("mfa")}
                  onBlur={() => setFocusedInput(null)}
                  onSubmitEditing={handleVerifyMfa}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[s.btnPrimary, isLoading && { opacity: 0.7 }]}
              onPress={handleVerifyMfa}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.btnPrimaryText}>{t('auth.verifyOtp')}</Text>
              }
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* OTP Code */}
            <View style={s.fieldGroup}>
              <Text style={s.inputLabel}>{t('auth.verifyOtp').toUpperCase()}</Text>
              
              {/* Hidden Input */}
              <TextInput
                ref={otpRef}
                style={s.hiddenInput}
                keyboardType="number-pad"
                maxLength={6}
                returnKeyType="done"
                value={otpCode}
                onChangeText={(t) => { setOtpCode(t); setError(""); }}
                onFocus={() => setFocusedInput("otp")}
                onBlur={() => setFocusedInput(null)}
                onSubmitEditing={handleVerifyOtp}
              />

              {/* Visible OTP Boxes */}
              <Pressable style={s.otpContainer} onPress={() => otpRef.current?.focus()}>
                {Array.from({ length: 6 }).map((_, index) => {
                  const isFocused = focusedInput === "otp" && (otpCode.length === index || (otpCode.length === 6 && index === 5));
                  return (
                    <View key={index} style={[s.otpBox, isFocused && s.otpBoxFocused]}>
                      <Text style={s.otpText}>{otpCode[index] || ""}</Text>
                    </View>
                  );
                })}
              </Pressable>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[s.btnPrimary, isLoading && { opacity: 0.7 }]}
              onPress={handleVerifyOtp}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.btnPrimaryText}>Verify & Login</Text>
              }
            </TouchableOpacity>
          </>
        )}

        {/* Divider */}
        {step !== "mfa" && (
          <View style={s.dividerBox}>
            <View style={s.dividerLine} />
            <Text style={s.dividerText}>{t('auth.orContinueWith', 'OR CONTINUE WITH')}</Text>
            <View style={s.dividerLine} />
          </View>
        )}

        {/* Social Logins */}
        {step !== "mfa" && (
          <View style={s.socialGroup}>
            <TouchableOpacity
              style={s.btnSocialGoogle}
              onPress={() => handleSocialLogin("google")}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              <Image source={{ uri: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/120px-Google_%22G%22_logo.svg.png" }} style={{ width: 20, height: 20 }} />
              <Text style={s.btnSocialGoogleText}>{t('auth.continueGoogle')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.btnSocialFacebook}
              onPress={() => handleSocialLogin("facebook")}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="facebook" size={20} color="#fff" />
              <Text style={s.btnSocialFacebookText}>{t('auth.continueFacebook')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Footer Links */}
        <View style={s.footerContainer}>
          {step === "phone" ? (
            <View style={s.footerRow}>
              <Text style={s.footerText}>Prefer using a password?</Text>
              <TouchableOpacity onPress={() => { setStep("email"); setError(""); }}>
                <Text style={s.footerLink}>Login with Email</Text>
              </TouchableOpacity>
            </View>
          ) : step === "email" ? (
            <View style={s.footerRow}>
              <Text style={s.footerText}>Want to go passwordless?</Text>
              <TouchableOpacity onPress={() => { setStep("phone"); setError(""); }}>
                <Text style={s.footerLink}>Login with Phone</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {step !== "mfa" && (
            <View style={[s.footerRow, { marginTop: 12 }]}>
              <Text style={s.footerText}>{t('auth.noAccount').split('?')[0]}?</Text>
              <TouchableOpacity onPress={() => router.push("/register")}>
                <Text style={s.footerLink}>{t('auth.signup')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  container: { flexGrow: 1, paddingHorizontal: 24, justifyContent: "center", paddingTop: 80, paddingBottom: 40 },
  backBtn: { position: "absolute", top: Platform.OS === 'ios' ? 50 : 20, left: 16, zIndex: 10, padding: 8, backgroundColor: T.surface, borderRadius: 20 },
  header: { marginBottom: 40, marginTop: 20 },
  title: { fontSize: 34, fontWeight: "700", color: T.text1, letterSpacing: -0.8, marginBottom: 10 },
  subtitle: { fontSize: 17, color: T.text2, fontWeight: "400", lineHeight: 22 },

  errorBox: { backgroundColor: T.errorBg, padding: 16, borderRadius: 12, flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 24 },
  errorText: { color: T.error, fontWeight: "500", fontSize: 15, flex: 1 },

  fieldGroup: { marginBottom: 24 },
  inputLabel: { fontSize: 12, fontWeight: "600", color: T.text2, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8, marginLeft: 4 },
  inputWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: T.surface, borderRadius: 12, paddingHorizontal: 16, height: 56, borderWidth: 1, borderColor: "transparent", gap: 12 },
  inputWrapperFocused: { borderColor: T.accent, backgroundColor: "#fff", ...CARD_SHADOW },
  input: { flex: 1, fontSize: 17, color: T.text1, fontWeight: "400" },

  btnPrimary: { width: "100%", backgroundColor: T.accent, borderRadius: 14, paddingVertical: 18, alignItems: "center", marginTop: 12, ...CARD_SHADOW },
  btnPrimaryText: { fontSize: 17, fontWeight: "600", color: "#fff", letterSpacing: 0.2 },

  hiddenInput: { position: "absolute", width: 1, height: 1, opacity: 0 },
  otpContainer: { flexDirection: "row", justifyContent: "space-between", width: "100%", marginTop: 8 },
  otpBox: { flex: 1, height: 64, marginHorizontal: 4, backgroundColor: T.surface, borderWidth: 1, borderColor: "transparent", borderRadius: 12, justifyContent: "center", alignItems: "center" },
  otpBoxFocused: { borderColor: T.accent, backgroundColor: "#fff", ...CARD_SHADOW },
  otpText: { fontSize: 28, fontWeight: "600", color: T.text1 },

  dividerBox: { flexDirection: "row", alignItems: "center", marginVertical: 32 },
  dividerLine: { flex: 1, height: 1, backgroundColor: T.border },
  dividerText: { marginHorizontal: 16, fontSize: 12, fontWeight: "600", color: T.text3, letterSpacing: 1 },

  socialGroup: { flexDirection: "row", gap: 12 },
  btnSocialGoogle: { flex: 1, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 10, backgroundColor: "#fff", borderWidth: 1, borderColor: T.border, borderRadius: 14, paddingVertical: 16, ...CARD_SHADOW },
  btnSocialGoogleText: { fontSize: 16, fontWeight: "600", color: T.text1 },
  btnSocialFacebook: { flex: 1, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 10, backgroundColor: "#1877F2", borderRadius: 14, paddingVertical: 16, ...CARD_SHADOW },
  btnSocialFacebookText: { fontSize: 16, fontWeight: "600", color: "#fff" },

  forgotBtn: { alignSelf: "flex-end", marginTop: 16 },
  forgotText: { fontSize: 15, fontWeight: "500", color: T.text2 },

  footerContainer: { marginTop: 40, alignItems: "center" },
  footerRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6 },
  footerText: { fontSize: 16, fontWeight: "400", color: T.text2 },
  footerLink: { fontSize: 16, fontWeight: "600", color: T.accent },
});
