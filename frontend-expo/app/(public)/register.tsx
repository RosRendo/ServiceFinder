/**
 * Register Screen — Premium Redesign
 */
import React, { useState, useRef, useEffect } from "react";
import {
  ScrollView, View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, StyleSheet, Keyboard, Platform, Animated, KeyboardAvoidingView
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/authStore";
import { useTranslation } from "react-i18next";

const T = {
  bg: "#FFFFFF", surface: "#F2F2F7", border: "#E5E5EA",
  accent: "#0A192F", accentLight: "#F5F5F5",
  text1: "#111827", text2: "#8E8E93", text3: "#C7C7CC",
  error: "#FF3B30", errorBg: "#FFE5E5",
};

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

export default function Register() {
  const router = useRouter();
  const { t } = useTranslation();
  const register = useAuthStore((s) => s.register);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
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
        <View style={s.header}>
          <Text style={s.title}>{t('auth.createAccount')}</Text>
          <Text style={s.subtitle}>{t('auth.joinSubtitle')}</Text>
        </View>

        {/* Error Banner */}
        <AnimatedErrorBanner error={error} />

        {/* Full Name */}
        <View style={s.fieldGroup}>
          <Text style={s.inputLabel}>{t('auth.fullName').toUpperCase()}</Text>
          <View style={[s.inputWrapper, focusedInput === "name" && s.inputWrapperFocused]}>
            <MaterialCommunityIcons name="account-outline" size={22} color={focusedInput === "name" ? T.accent : T.text3} />
            <TextInput
              style={s.input}
              placeholder="John Doe"
              placeholderTextColor={T.text3}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="next"
              value={name}
              onChangeText={(t) => { setName(t); setError(""); }}
              onFocus={() => setFocusedInput("name")}
              onBlur={() => setFocusedInput(null)}
              onSubmitEditing={() => emailRef.current?.focus()}
            />
          </View>
        </View>

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
              placeholder="At least 8 chars, 1 Upper, 1 Number, 1 Special"
              placeholderTextColor={T.text3}
              secureTextEntry={!showPassword}
              returnKeyType="done"
              value={password}
              onChangeText={(t) => { setPassword(t); setError(""); }}
              onFocus={() => setFocusedInput("password")}
              onBlur={() => setFocusedInput(null)}
              onSubmitEditing={handleRegister}
            />
            <TouchableOpacity onPress={() => setShowPassword(p => !p)} hitSlop={8}>
              <MaterialCommunityIcons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={T.text3} />
            </TouchableOpacity>
          </View>
          {/* Password strength hint */}
          {password.length > 0 && (
            <View style={s.strengthRow}>
              {[...Array(4)].map((_, i) => (
                <View
                  key={i}
                  style={[
                    s.strengthBar,
                    {
                      backgroundColor:
                        password.length > i * 2
                          ? password.length < 8 ? "#F59E0B"
                          : password.length < 10 ? "#3B82F6"
                          : "#10B981"
                          : T.border
                    }
                  ]}
                />
              ))}
              <Text style={s.strengthText}>
                {password.length < 8 ? "Too short" : password.length < 10 ? "Good" : "Strong"}
              </Text>
            </View>
          )}
        </View>

        {/* Sign Up Button */}
        <TouchableOpacity
          style={[s.btnPrimary, isLoading && { opacity: 0.7 }]}
          onPress={handleRegister}
          disabled={isLoading}
          activeOpacity={0.85}
        >
          {isLoading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.btnPrimaryText}>{t('auth.createAccount')}</Text>
          }
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
          <Text style={s.footerText}>{t('auth.alreadyAccount')}</Text>
          <TouchableOpacity onPress={() => router.push("/login")}>
            <Text style={s.footerLink}>{t('auth.login')}</Text>
          </TouchableOpacity>
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

  strengthRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10, paddingHorizontal: 4 },
  strengthBar: { flex: 1, height: 4, borderRadius: 2 },
  strengthText: { fontSize: 11, fontWeight: "600", color: T.text3, minWidth: 52 },

  btnPrimary: { width: "100%", backgroundColor: T.accent, borderRadius: 14, paddingVertical: 18, alignItems: "center", marginTop: 12, ...CARD_SHADOW },
  btnPrimaryText: { fontSize: 17, fontWeight: "600", color: "#fff", letterSpacing: 0.2 },

  terms: { fontSize: 13, color: T.text3, textAlign: "center", marginTop: 20, lineHeight: 20 },
  termsLink: { color: T.accent, fontWeight: "600" },

  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 40, gap: 6 },
  footerText: { fontSize: 16, fontWeight: "400", color: T.text2 },
  footerLink: { fontSize: 16, fontWeight: "600", color: T.accent },
});