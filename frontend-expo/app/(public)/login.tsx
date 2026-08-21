/**
 * Login Screen — Clean Layout for Android + iOS with Country Picker
 */
import React, { useState, useRef, useEffect } from "react";
import {
  ScrollView, View, Text, TextInput, TouchableOpacity, Pressable,
  ActivityIndicator, StyleSheet, Keyboard, Platform, Image, Modal, FlatList, Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuthStore, api } from "@/store/authStore";
import { useSocialAuth } from "@/hooks/useSocialAuth";
import { useTranslation } from "react-i18next";
import Toast from "react-native-toast-message";
import { Theme } from "@/constants/theme";
import { COUNTRIES } from "@/constants/countries";


const T = Theme.colors;

export default function Login() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t } = useTranslation();
  const verifyOtp = useAuthStore((s) => s.verifyOtp);
  const { promptGoogleAsync, promptFacebookAsync, promptAppleAsync, isGoogleReady, isFacebookReady, isAppleReady } = useSocialAuth();

  const [step, setStep] = useState<"phone" | "otp" | "email" | "mfa">("phone");
  const [confirm, setConfirm] = useState<any>(null);
  const [phone, setPhone] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0] || { name: 'Cambodia', code: '+855', flag: '🇰🇭' });
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCountries = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.code.includes(searchQuery)
  );

  const [otpCode, setOtpCode] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [tempMfaToken, setTempMfaToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [focusedOtp, setFocusedOtp] = useState(false);
  // Resend cooldown (seconds) — mirrors the backend's 60s OTP cooldown.
  const [resendCountdown, setResendCountdown] = useState(0);

  const otpRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const id = setTimeout(() => setResendCountdown((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [resendCountdown]);

  useEffect(() => {
    if (params.method === "google") handleSocialLogin("google");
    else if (params.method === "email") setStep("email");
  }, [params.method]);

  const navigateUser = (user: any) => {
    const role = user.role?.toLowerCase();
    setTimeout(() => {
      if (role === "customer") router.replace("/(customer)/(tabs)/home");
      else if (role === "company" || role === "company_admin") router.replace("/(company)/(tabs)/dashboard");
      else if (role === "staff") router.replace("/(staff)/(tabs)/today");
      else if (role === "admin") router.replace("/(admin)/(tabs)/dashboard");
      else setError(`Unknown role: ${role}. Contact support.`);
    }, 100);
  };

  const getFullPhone = () => {
    let cleanPhone = phone.trim();
    if (cleanPhone.startsWith("0")) cleanPhone = cleanPhone.substring(1);
    return `${selectedCountry.code}${cleanPhone}`;
  };

  const handleSendOtp = async () => {
    Keyboard.dismiss();
    const cleanPhone = phone.trim();
    // Client-side validation mirroring the backend: digits only, 7-14 digits
    // after removing separators (local Khmer numbers are 8-10 digits).
    const digits = cleanPhone.replace(/[\s\-().]/g, "");
    if (!/^\d{7,14}$/.test(digits))
      return setError("Please enter a valid phone number");
    setError(""); setIsLoading(true);
    try {
      const res = await api.post("/api/auth/request-otp", { phone: getFullPhone() });
      if (res.data?.success) {
        setStep("otp");
        setOtpCode("");
        setResendCountdown(60);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.message || "Failed to send OTP.");
    } finally { setIsLoading(false); }
  };

  const handleVerifyOtp = async () => {
    Keyboard.dismiss();
    const cleanOtp = otpCode.trim();
    if (!cleanOtp || cleanOtp.length < 6) return setError("Please enter a valid 6-digit OTP");

    setError(""); setIsLoading(true);
    try {
      await verifyOtp(getFullPhone(), cleanOtp);

      const user = useAuthStore.getState().user;
      if (!user) return setError("Login failed: No user data.");
      navigateUser(user);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.message || "Invalid OTP code.");
    } finally { setIsLoading(false); }
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
    } finally { setIsLoading(false); }
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
    } finally { setIsLoading(false); }
  };

  const handleSocialLogin = async (provider: "google" | "facebook" | "apple") => {
    if (provider === "apple") {
      if (isAppleReady) await promptAppleAsync();
      else if (Platform.OS !== 'ios') Toast.show({ type: 'info', text1: 'Apple Sign-In is only available on iOS.' });
      else Alert.alert("Apple Login Unavailable", "Please ensure Apple Sign-In is configured.");
    } else if (provider === "google") {
      if (isGoogleReady) await promptGoogleAsync();
      else Alert.alert("Google Login Unavailable", "Please add your Google Client IDs to the .env file.");
    } else if (provider === "facebook") {
      if (isFacebookReady) await promptFacebookAsync();
      else Alert.alert("Facebook Login Unavailable", "Please add your Facebook App ID to the .env file.");
    }
  };

  const stepTitle = step === "phone" ? "Welcome Back" : step === "email" ? "Login with Email" : step === "mfa" ? "Verification" : "Verify Number";
  const stepSubtitle = step === "phone" ? "Enter your phone number to receive an OTP code"
    : step === "otp" ? `We've sent a 6-digit code to\n${selectedCountry.code} ${phone}`
      : step === "email" ? "Log in with your email address"
        : "Enter the 6-digit code from your authenticator app";

  return (
    <SafeAreaView style={s.root}>
      {/* Country Picker Modal */}
      <Modal visible={showCountryModal} animationType="slide" transparent={true} onRequestClose={() => { setShowCountryModal(false); setSearchQuery(""); }}>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Select Country</Text>
              <TouchableOpacity onPress={() => { setShowCountryModal(false); setSearchQuery(""); }} style={s.modalClose} hitSlop={10}>
                <MaterialCommunityIcons name="close" size={24} color={T.text1} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={s.searchInput}
              placeholder="Search country or code..."
              placeholderTextColor={T.text3}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
            />
            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item.code + item.name}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={s.countryItem}
                  onPress={() => {
                    setSelectedCountry(item);
                    setShowCountryModal(false);
                    setSearchQuery("");
                  }}
                >
                  <Text style={s.countryItemFlag}>{item.flag}</Text>
                  <Text style={s.countryItemName}>{item.name}</Text>
                  <Text style={s.countryItemCode}>{item.code}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Back button — outside ScrollView to avoid touch conflicts */}
      <TouchableOpacity style={s.backBtn} onPress={() => {
        if (step === "otp") setStep("phone");
        else if (step === "mfa") setStep("email");
        else if (step === "email") { setStep("phone"); setError(""); }
        else if (router.canGoBack()) router.back();
        else router.replace("/");
      }}>
        <MaterialCommunityIcons name="chevron-left" size={32} color={T.text1} />
      </TouchableOpacity>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>{stepTitle}</Text>
          <Text style={s.subtitle}>{stepSubtitle}</Text>
        </View>

        {/* Error / success banners */}
        {!!error && (
          <View style={s.errorBox}>
            <MaterialCommunityIcons name="alert-circle" size={18} color={T.error} />
            <Text style={s.errorText}>{error}</Text>
          </View>
        )}
        {step === "otp" && !error && (
          <View style={[s.errorBox, { backgroundColor: T.successBg }]}>
            <MaterialCommunityIcons name="check-circle" size={18} color={T.success} />
            <Text style={[s.errorText, { color: T.success }]}>OTP successfully sent to your phone!</Text>
          </View>
        )}

        {/* ── PHONE STEP ── */}
        {step === "phone" && (
          <>
            <Text style={s.label}>{t("auth.phoneNumber").toUpperCase()}</Text>
            <View style={s.phoneRow}>
              <TouchableOpacity style={s.countryBtn} onPress={() => setShowCountryModal(true)} activeOpacity={0.7}>
                <Text style={s.countryFlag}>{selectedCountry.flag}</Text>
                <Text style={s.countryCode}>{selectedCountry.code}</Text>
                <MaterialCommunityIcons name="menu-down" size={20} color={T.text2} style={{ marginLeft: 2 }} />
              </TouchableOpacity>
              <TextInput
                style={s.phoneInput}
                placeholder="12 345 678"
                placeholderTextColor={T.text3}
                keyboardType="phone-pad"
                autoCorrect={false}
                returnKeyType="send"
                value={phone}
                onChangeText={(v) => { setPhone(v); setError(""); }}
                onSubmitEditing={handleSendOtp}
              />
            </View>
            <TouchableOpacity style={[s.btnPrimary, isLoading && { opacity: 0.7 }]} onPress={handleSendOtp} disabled={isLoading} activeOpacity={0.85}>
              {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnPrimaryText}>{t("auth.sendCode")}</Text>}
            </TouchableOpacity>
          </>
        )}

        {/* ── OTP STEP ── */}
        {step === "otp" && (
          <>
            <Text style={s.label}>{t("auth.verifyOtp").toUpperCase()}</Text>
            {/* Hidden real input */}
            <TextInput
              ref={otpRef}
              style={s.hiddenInput}
              keyboardType="number-pad"
              maxLength={6}
              returnKeyType="done"
              value={otpCode}
              onChangeText={(v) => { setOtpCode(v); setError(""); }}
              onFocus={() => setFocusedOtp(true)}
              onBlur={() => setFocusedOtp(false)}
              onSubmitEditing={handleVerifyOtp}
            />
            {/* Visual OTP boxes */}
            <Pressable style={s.otpContainer} onPress={() => otpRef.current?.focus()}>
              {Array.from({ length: 6 }).map((_, i) => {
                const active = focusedOtp && (otpCode.length === i || (otpCode.length === 6 && i === 5));
                return (
                  <View key={i} style={[s.otpBox, active && { borderColor: T.accent }]}>
                    <Text style={s.otpText}>{otpCode[i] || ""}</Text>
                  </View>
                );
              })}
            </Pressable>
            <TouchableOpacity style={[s.btnPrimary, isLoading && { opacity: 0.7 }]} onPress={handleVerifyOtp} disabled={isLoading} activeOpacity={0.85}>
              {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnPrimaryText}>Verify & Login</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.btnResend, (isLoading || resendCountdown > 0) && { opacity: 0.5 }]}
              onPress={handleSendOtp}
              disabled={isLoading || resendCountdown > 0}
              activeOpacity={0.8}
            >
              <Text style={s.btnResendText}>
                {resendCountdown > 0
                  ? `Resend code in ${resendCountdown}s`
                  : "Resend code"}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* ── EMAIL STEP ── */}
        {step === "email" && (
          <>
            <Text style={s.label}>{t("auth.email").toUpperCase()}</Text>
            <TextInput
              style={s.input}
              placeholder="name@example.com"
              placeholderTextColor={T.text3}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
              returnKeyType="next"
              value={email}
              onChangeText={(v) => { setEmail(v); setError(""); }}
              onSubmitEditing={() => passwordRef.current?.focus()}
            />

            <Text style={s.label}>{t("auth.password").toUpperCase()}</Text>
            <View style={s.passwordRow}>
              <TextInput
                ref={passwordRef}
                style={s.passwordInput}
                placeholder="••••••••"
                placeholderTextColor={T.text3}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                value={password}
                onChangeText={(v) => { setPassword(v); setError(""); }}
                onSubmitEditing={handleEmailLogin}
              />
              <TouchableOpacity onPress={() => setShowPassword((p) => !p)} style={s.eyeBtn}>
                <MaterialCommunityIcons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={T.text3} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={s.forgotBtn} onPress={() => router.push("/(public)/forgot-password")}>
              <Text style={s.forgotText}>{t("auth.forgotPassword")}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[s.btnPrimary, isLoading && { opacity: 0.7 }]} onPress={handleEmailLogin} disabled={isLoading} activeOpacity={0.85}>
              {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnPrimaryText}>{t("auth.login")}</Text>}
            </TouchableOpacity>
          </>
        )}

        {/* ── MFA STEP ── */}
        {step === "mfa" && (
          <>
            <Text style={s.label}>AUTHENTICATOR CODE</Text>
            <TextInput
              style={s.input}
              placeholder="000000"
              placeholderTextColor={T.text3}
              keyboardType="number-pad"
              maxLength={6}
              value={mfaCode}
              onChangeText={(v) => { setMfaCode(v); setError(""); }}
              onSubmitEditing={handleVerifyMfa}
            />
            <TouchableOpacity style={[s.btnPrimary, isLoading && { opacity: 0.7 }]} onPress={handleVerifyMfa} disabled={isLoading} activeOpacity={0.85}>
              {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnPrimaryText}>{t("auth.verifyOtp")}</Text>}
            </TouchableOpacity>
          </>
        )}

        {/* Social */}
        {step === "phone" && (
          <View style={s.socialRow}>
            <TouchableOpacity testID="google-login-btn" onPress={() => handleSocialLogin("google")} style={s.socialBtn} activeOpacity={0.7} disabled={isLoading}>
              <Image source={{ uri: "https://img.icons8.com/color/48/000000/google-logo.png" }} style={{ width: 26, height: 26 }} />
            </TouchableOpacity>

            <TouchableOpacity testID="apple-login-btn" onPress={() => handleSocialLogin("apple")} style={s.socialBtn} activeOpacity={0.7} disabled={isLoading}>
              <MaterialCommunityIcons name="apple" size={30} color={T.text1} />
            </TouchableOpacity>

            <TouchableOpacity testID="facebook-login-btn" onPress={() => handleSocialLogin("facebook")} style={s.socialBtn} activeOpacity={0.7} disabled={isLoading}>
              <MaterialCommunityIcons name="facebook" size={30} color="#1877F2" />
            </TouchableOpacity>

            <TouchableOpacity testID="email-login-btn" onPress={() => { setStep("email"); setError(""); }} style={s.socialBtn} activeOpacity={0.7}>
              <MaterialCommunityIcons name="email-outline" size={28} color={T.text1} />
            </TouchableOpacity>
          </View>
        )}

        {/* Email Social Options */}
        {step === "email" && (
          <>
            <View style={s.dividerBox}>
              <View style={s.dividerLine} />
              <Text style={s.dividerText}>{t("auth.orContinueWith", "OR CONTINUE WITH")}</Text>
              <View style={s.dividerLine} />
            </View>
            <View style={s.socialRow}>
              <TouchableOpacity testID="google-login-btn-email" onPress={() => handleSocialLogin("google")} style={s.socialBtn} activeOpacity={0.7} disabled={isLoading}>
                <Image source={{ uri: "https://img.icons8.com/color/48/000000/google-logo.png" }} style={{ width: 26, height: 26 }} />
              </TouchableOpacity>

              <TouchableOpacity testID="apple-login-btn-email" onPress={() => handleSocialLogin("apple")} style={s.socialBtn} activeOpacity={0.7} disabled={isLoading}>
                <MaterialCommunityIcons name="apple" size={30} color={T.text1} />
              </TouchableOpacity>

              <TouchableOpacity testID="facebook-login-btn-email" onPress={() => handleSocialLogin("facebook")} style={s.socialBtn} activeOpacity={0.7} disabled={isLoading}>
                <MaterialCommunityIcons name="facebook" size={30} color="#1877F2" />
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Footer */}
        <View style={s.footerContainer}>
          {step !== "mfa" && (
            <View style={[s.footerRow, { marginTop: 12 }]}>
              <Text style={s.footerText}>{t("auth.noAccount").split("?")[0]}?</Text>
              <TouchableOpacity onPress={() => router.push("/register")}>
                <Text style={s.footerLink}>{t("auth.signup")}</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity 
            onPress={() => {
              useAuthStore.getState().setGuestMode(true);
              router.replace("/(customer)/(tabs)/home");
            }}
            style={{ marginTop: 20, paddingVertical: 8, alignItems: 'center' }}
          >
            <Text style={{ color: T.accent, fontSize: 15, fontWeight: '700', letterSpacing: 0.3 }}>
              {t("auth.continueGuest", "CONTINUE AS GUEST")}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  backBtn: { padding: 12, paddingLeft: 16 },
  scroll: { flex: 1 },
  container: { paddingHorizontal: 24, paddingBottom: 40, flexGrow: 1, justifyContent: "center" },

  header: { marginBottom: 32, marginTop: 8 },
  title: { fontSize: 30, fontWeight: "700", color: T.text1, letterSpacing: -0.5, marginBottom: 8 },
  subtitle: { fontSize: 16, color: T.text2, lineHeight: 22 },

  errorBox: { backgroundColor: T.errorBg, padding: 14, borderRadius: 10, flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 20 },
  errorText: { color: T.error, fontWeight: "500", fontSize: 14, flex: 1 },

  label: { fontSize: 12, fontWeight: "600", color: T.text2, letterSpacing: 0.5, marginBottom: 8, marginTop: 4 },
  input: { backgroundColor: T.surface, borderRadius: 12, paddingHorizontal: 16, height: 54, fontSize: 16, color: T.text1, marginBottom: 20, borderWidth: 1, borderColor: T.border },
  passwordRow: { flexDirection: "row", alignItems: "center", backgroundColor: T.surface, borderRadius: 12, borderWidth: 1, borderColor: T.border, marginBottom: 8 },
  passwordInput: { flex: 1, paddingHorizontal: 16, height: 54, fontSize: 16, color: T.text1 },
  eyeBtn: { paddingHorizontal: 16 },

  phoneRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 20 },
  countryBtn: { flexDirection: "row", alignItems: "center", backgroundColor: T.surface, borderRadius: 12, height: 54, paddingHorizontal: 12, borderWidth: 1, borderColor: T.border },
  countryFlag: { fontSize: 20 },
  countryCode: { fontSize: 16, color: T.text1, fontWeight: "600", marginLeft: 6 },
  phoneInput: { flex: 1, backgroundColor: T.surface, borderRadius: 12, paddingHorizontal: 16, height: 54, fontSize: 16, color: T.text1, borderWidth: 1, borderColor: T.border },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: T.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: "70%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: "700", color: T.text1 },
  modalClose: { padding: 4 },
  searchInput: { backgroundColor: T.surface, borderRadius: 12, paddingHorizontal: 16, height: 48, fontSize: 16, color: T.text1, marginBottom: 16 },
  countryItem: { flexDirection: "row", alignItems: "center", paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: T.border },
  countryItemFlag: { fontSize: 24, marginRight: 16 },
  countryItemName: { flex: 1, fontSize: 16, color: T.text1, fontWeight: "500" },
  countryItemCode: { fontSize: 16, color: T.text2, fontWeight: "600" },

  forgotBtn: { alignSelf: "flex-end", marginBottom: 20 },
  forgotText: { fontSize: 14, fontWeight: "500", color: T.text2 },

  hiddenInput: { position: "absolute", opacity: 0, width: 1, height: 1 },
  otpContainer: { flexDirection: "row", gap: 8, marginBottom: 24 },
  otpBox: { flex: 1, height: 60, backgroundColor: T.surface, borderWidth: 1.5, borderColor: T.border, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  otpText: { fontSize: 26, fontWeight: "600", color: T.text1 },

  btnPrimary: { backgroundColor: T.accent, borderRadius: 14, paddingVertical: 17, alignItems: "center", marginTop: 4 },
  btnResend: { alignItems: "center", paddingVertical: 12, marginTop: 2 },
  btnResendText: { color: T.accent, fontWeight: "600", fontSize: 15 },
  btnPrimaryText: { fontSize: 16, fontWeight: "600", color: "#fff" },

  socialRow: { flexDirection: "row", justifyContent: "center", gap: 16, marginTop: 32 },
  socialBtn: {
    width: 60, height: 60, borderRadius: 16,
    backgroundColor: T.surface,
    borderWidth: 1, borderColor: T.border,
    alignItems: "center", justifyContent: "center",
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
      android: { elevation: 2 },
    })
  },

  dividerBox: { flexDirection: "row", alignItems: "center", marginVertical: 28 },
  dividerLine: { flex: 1, height: 1, backgroundColor: T.border },
  dividerText: { marginHorizontal: 14, fontSize: 11, fontWeight: "600", color: T.text3, letterSpacing: 1 },

  btnGoogle: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 10, backgroundColor: "#fff", borderWidth: 1, borderColor: T.border, borderRadius: 14, paddingVertical: 15 },
  btnGoogleText: { fontSize: 15, fontWeight: "600", color: T.text1 },
  btnApple: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 10, backgroundColor: "#000", borderRadius: 14, paddingVertical: 15 },
  btnAppleText: { fontSize: 15, fontWeight: "600", color: "#fff" },
  btnFacebook: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 10, backgroundColor: "#1877F2", borderRadius: 14, paddingVertical: 15 },
  btnFacebookText: { fontSize: 15, fontWeight: "600", color: "#fff" },

  footerContainer: { marginTop: 32, alignItems: "center" },
  footerRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6 },
  footerText: { fontSize: 15, color: T.text2 },
  footerLink: { fontSize: 15, fontWeight: "600", color: T.accent },
});
