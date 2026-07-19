import React, { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, StyleSheet, Animated, Easing } from "react-native";
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

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  android: { elevation: 2 },
});

// ─── Animated Hero Icon ──────────────────────────────────────
function AnimatedHeroIcon({ icon }: { icon: string }) {
  const floatAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
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

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { email } = useLocalSearchParams<{ email?: string }>();
  
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (code.length === 6) {
      handleVerify();
    }
  }, [code]);

  const handleVerify = async () => {
    if (code.length !== 6) {
      Alert.alert("Error", "Please enter the 6-digit verification code");
      return;
    }

    setLoading(true);
    try {
      await api.post("/api/auth/verify-email", { email, code });
      
      Alert.alert(
        "Success",
        "Your email has been verified! You can now access your account.",
        [{ text: "Continue", onPress: () => router.replace("/(customer)/(tabs)/home") }]
      );
    } catch (error: any) {
      const msg = error.response?.data?.message || "Invalid or expired verification code.";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      Alert.alert("Error", "No email provided. Please restart the registration process.");
      return;
    }
    
    setResending(true);
    try {
      await api.post("/api/auth/resend-verification", { email });
      Alert.alert("Sent", "A new verification code has been sent to your email.");
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.message || "Failed to resend code.");
    } finally {
      setResending(false);
    }
  };

  return (
    <SafeAreaView style={s.root}>
      <View style={s.container}>
        
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="chevron-left" size={32} color={T.text1} />
        </TouchableOpacity>

        <View style={s.content}>
          <View style={s.header}>
            <AnimatedHeroIcon icon="email-check-outline" />
            <Text style={s.title}>{t('auth.verifyEmailTitle')}</Text>
            <Text style={s.subtitle}>
              {t('auth.verifyEmailDesc')}
              <Text style={{ fontWeight: "800", color: T.text1 }}> {email || t('auth.yourEmail')}</Text>
            </Text>
          </View>

          <View style={s.fieldGroup}>
            <Text style={s.inputLabel}>{t('auth.verificationCode').toUpperCase()}</Text>
            <View style={[s.inputWrapper, focused && s.inputWrapperFocused]}>
              <TextInput
                style={[s.input, { letterSpacing: 8, fontSize: 24, textAlign: 'center' }]}
                placeholder="------"
                placeholderTextColor={T.text3}
                keyboardType="number-pad"
                maxLength={6}
                value={code}
                onChangeText={setCode}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                autoFocus
              />
            </View>
          </View>

          <TouchableOpacity 
            style={[s.btnPrimary, (loading || code.length !== 6) && { opacity: 0.7 }]}
            onPress={handleVerify}
            disabled={loading || code.length !== 6}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.btnPrimaryText}>{t('auth.verifyEmailBtn')}</Text>
            )}
          </TouchableOpacity>

          <View style={s.footer}>
            <Text style={s.footerText}>{t('auth.didntReceiveCode')} </Text>
            <TouchableOpacity onPress={handleResend} disabled={resending}>
              {resending ? (
                <ActivityIndicator size="small" color={T.accent} />
              ) : (
                <Text style={s.footerLink}>{t('auth.resend')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  container: { flex: 1 },
  backBtn: { position: "absolute", top: 16, left: 16, zIndex: 10, padding: 8 },
  content: { flex: 1, justifyContent: "center", paddingHorizontal: 24 },
  header: { alignItems: "center", marginBottom: 40 },
  heroIconWrap: { width: 80, height: 80, borderRadius: 24, backgroundColor: T.surface, alignItems: "center", justifyContent: "center", marginBottom: 20, ...CARD_SHADOW },
  title: { fontSize: 32, fontWeight: "800", color: T.text1, letterSpacing: -0.5, marginBottom: 12, textAlign: "center" },
  subtitle: { fontSize: 16, color: T.text2, fontWeight: "500", lineHeight: 24, textAlign: "center", paddingHorizontal: 16 },
  
  fieldGroup: { marginBottom: 24 },
  inputLabel: { fontSize: 11, fontWeight: "800", color: T.text2, letterSpacing: 1, marginBottom: 8, marginLeft: 4, textAlign: 'center' },
  inputWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: T.surface, borderRadius: 14, paddingHorizontal: 16, height: 64, borderWidth: 1.5, borderColor: T.border, justifyContent: 'center' },
  inputWrapperFocused: { borderColor: T.accent, backgroundColor: "#fff", ...CARD_SHADOW },
  input: { flex: 1, fontSize: 16, color: T.text1, fontWeight: "500" },

  btnPrimary: { width: "100%", backgroundColor: T.accent, borderRadius: 16, paddingVertical: 18, alignItems: "center", ...CARD_SHADOW },
  btnPrimaryText: { fontSize: 16, fontWeight: "800", color: "#fff", letterSpacing: 0.5 },

  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 24 },
  footerText: { fontSize: 15, color: T.text2, fontWeight: "500" },
  footerLink: { fontSize: 15, color: T.accent, fontWeight: "800" },
});
