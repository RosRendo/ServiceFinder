/**
 * Welcome Screen — Onboarding Carousel
 */
import React, { useRef, useState } from "react";
import { View, Text, StyleSheet, Animated, Pressable, ScrollView, Dimensions, NativeSyntheticEvent, NativeScrollEvent } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const T = {
  bg: "#FFFFFF", surface: "#FFFFFF", border: "#E5E5EA",
  accent: "#0A192F", accentLight: "#F5F5F5",
  text1: "#111827", text2: "#8E8E93", text3: "#C7C7CC",
  googleRed: "#DB4437",
};

const SLIDES_KEYS = [
  {
    icon: "magnify",
    titleKey: "welcome.findServices",
    subtitleKey: "welcome.findServicesDesc"
  },
  {
    icon: "calendar-check",
    titleKey: "welcome.bookInstantly",
    subtitleKey: "welcome.bookInstantlyDesc"
  },
  {
    icon: "shield-star",
    titleKey: "welcome.absoluteConfidence",
    subtitleKey: "welcome.absoluteConfidenceDesc"
  }
];

function PressBtn({ onPress, style, children }: { onPress: () => void, style?: any, children: React.ReactNode }) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.timing(scale, { toValue: 0.96, duration: 100, useNativeDriver: true }).start();
  const pressOut = () => Animated.timing(scale, { toValue: 1, duration: 100, useNativeDriver: true }).start();
  return (
    <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut}>
      <Animated.View style={[{ transform: [{ scale }] }, style]}>{children}</Animated.View>
    </Pressable>
  );
}

export default function WelcomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = e.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(scrollPosition / width);
    if (currentIndex !== activeIndex) {
      setActiveIndex(currentIndex);
    }
  };

  return (
    <SafeAreaView style={s.root}>
      <View style={s.container}>
        {/* Carousel Section */}
        <View style={s.carouselWrapper}>
          <ScrollView 
            horizontal 
            pagingEnabled 
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
          >
            {SLIDES_KEYS.map((slide, idx) => (
              <View key={idx} style={s.slide}>
                <View style={s.iconWrapper}>
                  <MaterialCommunityIcons name={slide.icon as any} size={56} color={T.surface} />
                </View>
                <Text style={s.title}>{t(slide.titleKey)}</Text>
                <Text style={s.subtitle}>{t(slide.subtitleKey)}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Pagination Dots */}
        <View style={s.pagination}>
          {SLIDES_KEYS.map((_, idx) => (
            <View key={idx} style={[s.dot, activeIndex === idx && s.dotActive]} />
          ))}
        </View>

        {/* Bottom Actions */}
        <View style={s.actionsWrapper}>
          <PressBtn onPress={() => router.push("/login")} style={s.btnPrimary}>
            <MaterialCommunityIcons name="cellphone-message" size={24} color={T.surface} style={{ marginRight: 8 }} />
            <Text style={s.btnPrimaryText}>{t('welcome.continuePhone')}</Text>
          </PressBtn>

          <PressBtn onPress={() => router.push("/login?method=email")} style={s.btnGoogle}>
            <MaterialCommunityIcons name="email-outline" size={24} color={T.text1} style={{ marginRight: 8 }} />
            <Text style={s.btnGoogleText}>{t('welcome.continueEmail')}</Text>
          </PressBtn>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  container: { flex: 1, justifyContent: "space-between" },
  carouselWrapper: { flex: 1 },
  slide: { width, flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 24 },
  iconWrapper: { width: 100, height: 100, borderRadius: 32, backgroundColor: T.accent, alignItems: "center", justifyContent: "center", marginBottom: 36 },
  title: { fontSize: 34, fontWeight: "700", color: T.text1, letterSpacing: -0.8, marginBottom: 16, textAlign: "center" },
  subtitle: { fontSize: 17, fontWeight: "400", color: T.text2, textAlign: "center", lineHeight: 24, paddingHorizontal: 16 },
  
  pagination: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginVertical: 32, gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: T.border },
  dotActive: { width: 24, backgroundColor: T.accent },

  actionsWrapper: { gap: 14, paddingHorizontal: 24, paddingBottom: 32 },
  btnPrimary: { flexDirection: "row", width: "100%", backgroundColor: T.accent, borderRadius: 14, paddingVertical: 18, alignItems: "center", justifyContent: "center" },
  btnPrimaryText: { fontSize: 17, fontWeight: "600", color: T.surface, letterSpacing: 0.2 },
  
  btnGoogle: { flexDirection: "row", width: "100%", backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, borderRadius: 14, paddingVertical: 18, alignItems: "center", justifyContent: "center" },
  btnGoogleText: { fontSize: 17, fontWeight: "600", color: T.text1, letterSpacing: 0.2 },
});
