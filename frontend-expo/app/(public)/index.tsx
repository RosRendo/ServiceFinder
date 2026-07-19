/**
 * Language Selection Screen — Dedicated First Screen
 */
import React, { useRef, useEffect, useState } from "react";
import { View, Text, StyleSheet, Animated, Pressable, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import i18n from "@/utils/i18n";

const T = {
  bg: "#FFFFFF", surface: "#FFFFFF", border: "#E5E5EA",
  accent: "#0A192F", accentLight: "#F5F5F5",
  text1: "#111827", text2: "#8E8E93", text3: "#C7C7CC",
};

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  android: { elevation: 2 },
});

const HERO_SHADOW = Platform.select({
  ios: { shadowColor: '#0A192F', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 16 },
  android: { elevation: 8 },
});

function LangBtn({ title, subtitle, icon, onPress }: { title: string, subtitle: string, icon: string, onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.timing(scale, { toValue: 0.96, duration: 100, useNativeDriver: true }).start();
  const pressOut = () => Animated.timing(scale, { toValue: 1, duration: 100, useNativeDriver: true }).start();
  
  return (
    <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut}>
      <Animated.View style={[s.langCard, { transform: [{ scale }] }, CARD_SHADOW]}>
        <View style={s.langIconWrapper}>
          <Text style={s.flagIcon}>{icon}</Text>
        </View>
        <View style={s.langTextWrapper}>
          <Text style={s.langTitle}>{title}</Text>
          <Text style={s.langSubtitle}>{subtitle}</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color={T.text3} />
      </Animated.View>
    </Pressable>
  );
}

export default function LanguageSelectionScreen() {
  const router = useRouter();

  const handleSelectLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    router.push("/welcome");
  };

  const floatAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -8, duration: 2000, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <SafeAreaView style={s.root}>
      <View style={s.container}>
        <View style={s.headerWrapper}>
          <Animated.View style={[s.iconWrapper, { transform: [{ translateY: floatAnim }] }, HERO_SHADOW]}>
            <MaterialCommunityIcons name="translate" size={48} color={T.surface} />
          </Animated.View>
          <Text style={s.title}>Choose your language</Text>
          <Text style={s.subtitle}>ជ្រើសរើសភាសារបស់អ្នក</Text>
        </View>

        <View style={s.optionsWrapper}>
          <LangBtn 
            title="English" 
            subtitle="English" 
            icon="🇬🇧" 
            onPress={() => handleSelectLanguage("en")} 
          />
          <LangBtn 
            title="ភាសាខ្មែរ" 
            subtitle="Khmer" 
            icon="🇰🇭" 
            onPress={() => handleSelectLanguage("km")} 
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  container: { flex: 1, justifyContent: "center", paddingHorizontal: 24 },
  
  headerWrapper: { alignItems: "center", marginBottom: 48 },
  iconWrapper: { width: 80, height: 80, borderRadius: 24, backgroundColor: T.accent, alignItems: "center", justifyContent: "center", marginBottom: 24 },
  title: { fontSize: 28, fontWeight: "700", color: T.text1, letterSpacing: -0.5, marginBottom: 8, textAlign: "center" },
  subtitle: { fontSize: 18, fontWeight: "500", color: T.text2, textAlign: "center" },

  optionsWrapper: { gap: 16 },
  
  langCard: { 
    flexDirection: "row", 
    alignItems: "center", 
    backgroundColor: T.surface, 
    borderWidth: 2, 
    borderColor: "transparent", 
    borderRadius: 20, 
    padding: 16,
  },
  langIconWrapper: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    backgroundColor: T.accentLight, 
    alignItems: "center", 
    justifyContent: "center",
    marginRight: 16
  },
  flagIcon: { fontSize: 24 },
  langTextWrapper: { flex: 1 },
  langTitle: { fontSize: 18, fontWeight: "700", color: T.text1, marginBottom: 2 },
  langSubtitle: { fontSize: 14, fontWeight: "400", color: T.text2 },
});
