import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Theme } from "@/constants/theme";
import { OfflineErrorSvg } from "@/components/svg";

const T = Theme.colors;

interface ErrorStateProps {
  /** Shown under the title; defaults to the generic error message. */
  message?: string;
  /** When provided, renders a retry button wired to this callback. */
  onRetry?: () => void;
}

/** Shared fetch-failure state with optional retry — replaces silent empty lists. */
export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  const { t } = useTranslation();
  return (
    <View style={s.box}>
      <OfflineErrorSvg size={110} />
      <Text style={s.title}>{t("common.errorTitle")}</Text>
      <Text style={s.message}>{message ?? t("common.errorMessage")}</Text>
      {onRetry ? (
        <TouchableOpacity
          onPress={onRetry}
          style={s.retryBtn}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={t("common.retry")}
        >
          <MaterialCommunityIcons name="refresh" size={18} color="#fff" />
          <Text style={s.retryText}>{t("common.retry")}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  box: { alignItems: "center", paddingVertical: 64, paddingHorizontal: 32 },
  iconCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: T.errorBg,
    alignItems: "center", justifyContent: "center", marginBottom: 20,
  },
  title: { fontSize: 18, fontWeight: "700", color: T.text1, marginBottom: 6 },
  message: { fontSize: 14, fontWeight: "500", color: T.text2, textAlign: "center", lineHeight: 20 },
  retryBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    marginTop: 20, paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 12, backgroundColor: T.primary,
  },
  retryText: { fontSize: 14, fontWeight: "700", color: "#fff" },
});
