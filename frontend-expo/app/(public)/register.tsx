/**
 * Register Screen — Clean Layout for Android + iOS
 */
import React, { useState, useRef } from "react";
import {
  ScrollView, View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, StyleSheet, Keyboard, Platform, Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/authStore";
import { useTranslation } from "react-i18next";
import { useSocialAuth } from "@/hooks/useSocialAuth";
import { Theme } from "@/constants/theme";

const T = Theme.colors;

export default function Register() {
  const router = useRouter();
  const { t } = useTranslation();
  const register = useAuthStore((s) => s.register);
  const { promptGoogleAsync, promptFacebookAsync, isGoogleReady, isFacebookReady } = useSocialAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const handleRegister = async () => {
    Keyboard.dismiss();
    const cleanEmail = email.trim().toLowerCase();
    if (!name || !cleanEmail || !password) return setError("Please fill in all fields");
    if (password.length < 8) return setError("Password must be at least 8 characters");
    setError(""); setIsLoading(true);
    try {
      await register(name, cleanEmail, password, "customer");
      router.replace("/(customer)/(tabs)/home");
    } catch (err: any) {
      setError(err.formattedMessage || "Registration failed. Please check your details.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: "google" | "facebook") => {
    if (provider === "google" && isGoogleReady) await promptGoogleAsync();
    else if (provider === "facebook" && isFacebookReady) await promptFacebookAsync();
  };

  const strengthColor = password.length < 8 ? "#F59E0B" : password.length < 10 ? "#3B82F6" : "#10B981";
  const strengthLabel = password.length < 8 ? "Too short" : password.length < 10 ? "Good" : "Strong";

  return (
    <SafeAreaView style={s.root}>
      {/* Back button — outside ScrollView so no touch conflict */}
      <TouchableOpacity style={s.backBtn} onPress={() => { if (router.canGoBack()) router.back(); else router.replace("/"); }}>
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
          <Text style={s.title}>{t("auth.createAccount")}</Text>
          <Text style={s.subtitle}>{t("auth.joinSubtitle")}</Text>
        </View>

        {/* Error */}
        {!!error && (
          <View style={s.errorBox}>
            <MaterialCommunityIcons name="alert-circle" size={18} color={T.error} />
            <Text style={s.errorText}>{error}</Text>
          </View>
        )}

        {/* Full Name */}
        <Text style={s.label}>{t("auth.fullName").toUpperCase()}</Text>
        <TextInput
          style={s.input}
          placeholder="John Doe"
          placeholderTextColor={T.text3}
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="next"
          value={name}
          onChangeText={(v) => { setName(v); setError(""); }}
          onSubmitEditing={() => emailRef.current?.focus()}
        />

        {/* Email */}
        <Text style={s.label}>{t("auth.email").toUpperCase()}</Text>
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
          onChangeText={(v) => { setEmail(v); setError(""); }}
          onSubmitEditing={() => passwordRef.current?.focus()}
        />

        {/* Password */}
        <Text style={s.label}>{t("auth.password").toUpperCase()}</Text>
        <View style={s.passwordRow}>
          <TextInput
            ref={passwordRef}
            style={s.passwordInput}
            placeholder="Min 8 characters"
            placeholderTextColor={T.text3}
            secureTextEntry={!showPassword}
            returnKeyType="done"
            value={password}
            onChangeText={(v) => { setPassword(v); setError(""); }}
            onSubmitEditing={handleRegister}
          />
          <TouchableOpacity onPress={() => setShowPassword((p) => !p)} style={s.eyeBtn}>
            <MaterialCommunityIcons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={T.text3} />
          </TouchableOpacity>
        </View>
        {password.length > 0 && (
          <View style={s.strengthRow}>
            {[...Array(4)].map((_, i) => (
              <View key={i} style={[s.strengthBar, { backgroundColor: password.length > i * 2 ? strengthColor : T.border }]} />
            ))}
            <Text style={[s.strengthText, { color: strengthColor }]}>{strengthLabel}</Text>
          </View>
        )}

        {/* Create Account */}
        <TouchableOpacity style={[s.btnPrimary, isLoading && { opacity: 0.7 }]} onPress={handleRegister} disabled={isLoading} activeOpacity={0.85}>
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnPrimaryText}>{t("auth.createAccount")}</Text>}
        </TouchableOpacity>

        {/* Divider */}
        <View style={s.dividerBox}>
          <View style={s.dividerLine} />
          <Text style={s.dividerText}>{t("auth.orContinueWith", "OR CONTINUE WITH")}</Text>
          <View style={s.dividerLine} />
        </View>

        {/* Social */}
        <TouchableOpacity style={s.btnGoogle} onPress={() => handleSocialLogin("google")} disabled={isLoading} activeOpacity={0.85}>
          <Image source={{ uri: "https://img.icons8.com/color/48/000000/google-logo.png" }} style={{ width: 22, height: 22 }} />
          <Text style={s.btnGoogleText}>{t("auth.continueGoogle", "Continue with Google")}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.btnFacebook} onPress={() => handleSocialLogin("facebook")} disabled={isLoading} activeOpacity={0.85}>
          <MaterialCommunityIcons name="facebook" size={20} color="#fff" />
          <Text style={s.btnFacebookText}>{t("auth.continueFacebook", "Continue with Facebook")}</Text>
        </TouchableOpacity>

        {/* Terms */}
        <Text style={s.terms}>
          By creating an account, you agree to our{" "}
          <Text style={s.termsLink}>Terms of Service</Text>
          {" "}and{" "}
          <Text style={s.termsLink}>Privacy Policy</Text>
        </Text>

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.footerText}>{t("auth.alreadyAccount")}</Text>
          <TouchableOpacity onPress={() => router.push("/login")}>
            <Text style={s.footerLink}>{t("auth.login")}</Text>
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
  container: { paddingHorizontal: 24, paddingBottom: 40 },

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

  strengthRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 20 },
  strengthBar: { flex: 1, height: 4, borderRadius: 2 },
  strengthText: { fontSize: 11, fontWeight: "600", minWidth: 52 },

  btnPrimary: { backgroundColor: T.accent, borderRadius: 14, paddingVertical: 17, alignItems: "center", marginTop: 8 },
  btnPrimaryText: { fontSize: 16, fontWeight: "600", color: "#fff" },

  dividerBox: { flexDirection: "row", alignItems: "center", marginVertical: 28 },
  dividerLine: { flex: 1, height: 1, backgroundColor: T.border },
  dividerText: { marginHorizontal: 14, fontSize: 11, fontWeight: "600", color: T.text3, letterSpacing: 1 },

  btnGoogle: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 10, backgroundColor: "#fff", borderWidth: 1, borderColor: T.border, borderRadius: 14, paddingVertical: 15, marginBottom: 12 },
  btnGoogleText: { fontSize: 15, fontWeight: "600", color: T.text1 },
  btnFacebook: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 10, backgroundColor: "#1877F2", borderRadius: 14, paddingVertical: 15 },
  btnFacebookText: { fontSize: 15, fontWeight: "600", color: "#fff" },

  terms: { fontSize: 12, color: T.text3, textAlign: "center", marginTop: 24, lineHeight: 18 },
  termsLink: { color: T.accent, fontWeight: "600" },

  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 32, gap: 6 },
  footerText: { fontSize: 15, color: T.text2 },
  footerLink: { fontSize: 15, fontWeight: "600", color: T.accent },
});