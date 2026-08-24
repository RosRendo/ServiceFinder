import React, { useEffect } from "react";
import { View, ActivityIndicator, Alert, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { api } from "@/store/authStore";
import { Theme } from "@/constants/theme";

const T = Theme.colors;

/**
 * This screen is a redirect-only screen for STAFF.
 * It calls POST /api/conversations to get-or-create a conversation
 * with the target company/customer, then navigates to the chat screen.
 */
export default function StaffNewConversationScreen() {
  const router = useRouter();
  // Using companyId here as the backend conversations endpoint expects companyId or userId
  const { companyId, companyName } = useLocalSearchParams<{
    companyId: string;
    companyName?: string;
  }>();

  useEffect(() => {
    if (!companyId) {
      Alert.alert("Error", "No company specified.");
      router.back();
      return;
    }
    (async () => {
      try {
        const res = await api.post("/api/conversations", { companyId: companyId.toString() });
        const responseData = res.data?.data || res.data;
        const conversation = responseData?.data || responseData;
        router.replace(
          `/(staff)/messages/${conversation.id}?otherName=${encodeURIComponent(
            companyName ?? conversation.otherUser?.fullName ?? "Provider"
          )}` as any
        );
      } catch (e: any) {
        const msg = e?.response?.data?.message ?? "Could not start conversation.";
        Alert.alert("Error", Array.isArray(msg) ? msg.join(", ") : msg);
        router.back();
      }
    })();
  }, [companyId]);

  return (
    <SafeAreaView style={s.root}>
      <ActivityIndicator size="large" color={T.primary} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: T.bg,
    alignItems: "center",
    justifyContent: "center",
  },
});
