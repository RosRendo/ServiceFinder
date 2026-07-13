import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { api } from "@/store/authStore";
import { useTranslation } from "react-i18next";

/**
 * This screen is a redirect-only screen.
 * It calls POST /api/conversations to get-or-create a conversation
 * with the target company, then navigates to the chat screen.
 */
export default function NewConversationScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { companyId, companyName } = useLocalSearchParams<{
    companyId: string;
    companyName?: string;
  }>();

  useEffect(() => {
    if (!companyId) {
      Alert.alert(t('messages.errorTitle'), t('messages.noCompanySpecified'));
      router.back();
      return;
    }
    (async () => {
      try {
        const res = await api.post("/api/conversations", { companyId: companyId.toString() });
        const responseData = res.data?.data || res.data;
        const conversation = responseData?.data || responseData;
        router.replace(
          `/(customer)/messages/${conversation.id}?otherName=${encodeURIComponent(
            companyName ?? conversation.otherUser?.fullName ?? t('messages.provider')
          )}` as any
        );
      } catch (e: any) {
        const msg = e?.response?.data?.message ?? t('messages.couldNotStart');
        Alert.alert(t('messages.errorTitle'), Array.isArray(msg) ? msg.join(", ") : msg);
        router.back();
      }
    })();
  }, [companyId]);

  return (
    <SafeAreaView className="flex-1 bg-surface items-center justify-center">
      <ActivityIndicator size="large" color="#002045" />
    </SafeAreaView>
  );
}
