/**
 * Welcome Screen — Onboarding Carousel
 */
import React, { useRef, useState, useEffect } from "react";
import { View, Text, StyleSheet, Animated, Pressable, ScrollView, Dimensions, NativeSyntheticEvent, NativeScrollEvent, Platform, Easing, Image, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Theme } from "@/constants/theme";
import { useAuthStore } from "@/store/authStore";

const { width } = Dimensions.get("window");

const T = Theme.colors;

const HERO_SHADOW = Platform.select({
  ios: { shadowColor: '#0A192F', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 16 },
  android: { elevation: 8 },
});

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  android: { elevation: 2 },
});

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

// ─── Animated Floating Icon ───────────────────────────────────
function AnimatedFloatIcon({ icon }: { icon: string }) {
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
    <Animated.View style={[s.iconWrapper, { transform: [{ translateY: floatAnim }] }]}>
      <MaterialCommunityIcons name={icon as any} size={56} color={T.surface} />
    </Animated.View>
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
                <AnimatedFloatIcon icon={slide.icon} />
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
          <PressBtn 
            onPress={async () => {
              await useAuthStore.getState().setHasSeenOnboarding(true);
              useAuthStore.getState().setGuestMode(true);
              router.replace("/(customer)/(tabs)/home");
            }} 
            style={s.btnPrimary}
          >
            <Text style={s.btnPrimaryText}>{t('welcome.getStarted', 'Get Started')}</Text>
            <MaterialCommunityIcons name="arrow-right" size={24} color={T.surface} style={{ marginLeft: 8 }} />
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
  iconWrapper: { width: 100, height: 100, borderRadius: 32, backgroundColor: T.accent, alignItems: "center", justifyContent: "center", marginBottom: 36, ...HERO_SHADOW },
  title: { fontSize: 34, fontWeight: "700", color: T.text1, letterSpacing: -0.8, marginBottom: 16, textAlign: "center" },
  subtitle: { fontSize: 17, fontWeight: "400", color: T.text2, textAlign: "center", lineHeight: 24, paddingHorizontal: 16 },
  
  pagination: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginVertical: 32, gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: T.border },
  dotActive: { width: 24, backgroundColor: T.accent },

  actionsWrapper: { gap: 14, paddingHorizontal: 24, paddingBottom: 32 },
  btnPrimary: { flexDirection: "row", width: "100%", backgroundColor: T.accent, borderRadius: 14, paddingVertical: 18, alignItems: "center", justifyContent: "center" },
  btnPrimaryText: { fontSize: 17, fontWeight: "600", color: T.surface, letterSpacing: 0.2 },
  
  btnSecondary: { flexDirection: "row", width: "100%", backgroundColor: T.surface, borderRadius: 14, paddingVertical: 18, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: T.border },
  btnSecondaryText: { fontSize: 17, fontWeight: "600", color: T.text2, letterSpacing: 0.2 },
  
  btnGoogle: { flexDirection: "row", width: "100%", backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, borderRadius: 14, paddingVertical: 18, alignItems: "center", justifyContent: "center", ...CARD_SHADOW },
  btnGoogleText: { fontSize: 17, fontWeight: "600", color: T.text1, letterSpacing: 0.2 },
});
