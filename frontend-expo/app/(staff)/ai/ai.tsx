import React from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Theme } from "@/constants/theme";

const T = Theme.colors;

const Fonts = { headline: "System" };

const CARD_SHADOW = {
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
  android: { elevation: 1 },
};

export default function AIToolsScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={T.primary} />
        </TouchableOpacity>
        <View style={s.headerInfo}>
          <View style={s.robotBadge}>
            <MaterialCommunityIcons name="robot" size={22} color="white" />
          </View>
          <View>
            <Text style={s.headerTitle}>{t('staffProfile.aiAssistant')}</Text>
            <Text style={s.statusText}>{t('staffProfile.aiPendingStatus')}</Text>
          </View>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={s.body}>
        <View style={[s.pendingCard, Platform.OS === 'ios' ? CARD_SHADOW.ios : CARD_SHADOW.android]}>
          <View style={s.pendingIconWrap}>
            <MaterialCommunityIcons name="clock-outline" size={40} color={T.text3} />
          </View>
          <Text style={s.pendingTitle}>{t('staffProfile.aiPendingTitle')}</Text>
          <Text style={s.pendingBody}>{t('staffProfile.aiPendingBody')}</Text>
          <View style={s.pendingDivider} />
          <View style={s.pendingRow}>
            <MaterialCommunityIcons name="information-outline" size={16} color={T.text3} />
            <Text style={s.pendingNote}>{t('staffProfile.aiComposerDisabledHint')}</Text>
          </View>
        </View>
      </View>

      <View style={s.inputBar}>
        <TextInput
          style={s.textInput}
          editable={false}
          pointerEvents="none"
          placeholder={t('staffProfile.aiComposerDisabledHint')}
          placeholderTextColor={T.text3}
          accessibilityLabel={t('staffProfile.aiComposerDisabledHint')}
        />
        <View style={[s.sendBtn, s.sendBtnDisabled]} pointerEvents="none">
          <MaterialCommunityIcons name="send" size={18} color={T.text3} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    backgroundColor: T.surface,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: T.bg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: T.border,
  },
  headerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    marginLeft: 8,
  },
  robotBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: T.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: Fonts?.headline || "System",
    fontWeight: "800",
    color: T.text1,
    fontSize: 16,
  },
  statusText: {
    fontSize: 11,
    color: T.text3,
    fontWeight: "600",
    marginTop: 2,
  },
  body: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
  },
  pendingCard: {
    backgroundColor: T.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: T.border,
    padding: 28,
    alignItems: "center",
  },
  pendingIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: T.bg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  pendingTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: T.text1,
    textAlign: "center",
  },
  pendingBody: {
    fontSize: 14,
    color: T.text2,
    textAlign: "center",
    lineHeight: 21,
    marginTop: 8,
  },
  pendingDivider: {
    height: 1,
    backgroundColor: T.border,
    alignSelf: "stretch",
    marginVertical: 18,
  },
  pendingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pendingNote: {
    fontSize: 12,
    color: T.text3,
    fontWeight: "600",
    flexShrink: 1,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: T.border,
    backgroundColor: T.surface,
  },
  textInput: {
    flex: 1,
    backgroundColor: T.bg,
    borderWidth: 1.5,
    borderColor: T.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: T.text3,
    maxHeight: 100,
    textAlignVertical: "top",
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: T.border,
    backgroundColor: T.bg,
  },
  sendBtnDisabled: {
    opacity: 1,
  },
});
