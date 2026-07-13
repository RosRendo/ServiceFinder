import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import api from "@/utils/api";
import { useTranslation } from "react-i18next";

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { email } = useLocalSearchParams<{ email?: string }>();
  
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  // Focus the input automatically if we want, or handle automatic submission on 6 digits
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
      // POST to verify email API
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
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View className="flex-1 px-6 justify-center pb-12">
          
          <TouchableOpacity 
            className="absolute top-12 left-4 z-10 w-12 h-12 items-center justify-center"
            onPress={() => router.back()}
          >
            <MaterialCommunityIcons name="chevron-left" size={32} color="#007AFF" />
          </TouchableOpacity>

          <View className="mb-10 items-center mt-8">
            <View className="w-20 h-20 bg-primary-container rounded-full items-center justify-center mb-6">
              <MaterialCommunityIcons name="email-check-outline" size={40} color="#007AFF" />
            </View>
            <Text className="text-3xl font-bold tracking-tight text-on-surface mb-2 text-center">
              {t('auth.verifyEmailTitle')}
            </Text>
            <Text className="text-on-surface-variant text-base text-center px-4 leading-6">
              {t('auth.verifyEmailDesc')}
              <Text className="font-semibold text-on-surface">{email || t('auth.yourEmail')}</Text>
            </Text>
          </View>

          <View className="gap-6">
            <View className="items-center">
              <TextInput
                className="w-full h-16 bg-surface-container-low rounded-xl border border-outline-variant focus:border-primary text-center text-3xl font-bold tracking-[10px] text-on-surface"
                placeholder="------"
                placeholderTextColor="#C6C6C8"
                keyboardType="number-pad"
                maxLength={6}
                value={code}
                onChangeText={setCode}
                autoFocus
              />
            </View>

            <TouchableOpacity 
              className={`w-full rounded-xl py-4 mt-4 flex-row justify-center items-center ${loading ? 'bg-primary/70' : 'bg-primary'}`}
              onPress={handleVerify}
              disabled={loading || code.length !== 6}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white font-semibold text-lg">{t('auth.verifyEmailBtn')}</Text>
              )}
            </TouchableOpacity>

            <View className="flex-row justify-center mt-4">
              <Text className="text-on-surface-variant font-medium text-base">{t('auth.didntReceiveCode')}</Text>
              <TouchableOpacity onPress={handleResend} disabled={resending}>
                {resending ? (
                  <ActivityIndicator size="small" color="#007AFF" />
                ) : (
                  <Text className="text-primary font-semibold text-base">{t('auth.resend')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
