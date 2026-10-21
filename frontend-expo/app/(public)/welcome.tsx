/**
 * ServiceFinder Mobile Welcome & Onboarding
 * Visual-First Hero: Home + People + Services + Resolution
 * Warm, trustworthy, premium, and calm motion storytelling.
 */
import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
  Easing,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Theme } from "@/constants/theme";
import { useAuthStore } from "@/store/authStore";
import i18n from "@/utils/i18n";

const { width } = Dimensions.get("window");
const T = Theme.colors;

const CARD_SHADOW = Platform.select({
  ios: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  android: { elevation: 4 },
});

export default function WelcomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [storyStage, setStoryStage] = useState<0 | 1 | 2>(0);
  const isKhmer = i18n.language?.startsWith("km");

  // ─── MOTION STORYTELLING CONTROLLERS ─────────────────────────────────
  // 1. Home gentle breathing float
  const homeFloatAnim = useRef(new Animated.Value(0)).current;
  // 2. Floating location pin
  const pinFloatAnim = useRef(new Animated.Value(0)).current;
  // 3. Service cards orbiting motion
  const card1Anim = useRef(new Animated.Value(0)).current;
  const card2Anim = useRef(new Animated.Value(0)).current;
  const card3Anim = useRef(new Animated.Value(0)).current;
  // 4. Pro arrival glide (starts offset, glides smoothly toward the home)
  const proGlideAnim = useRef(new Animated.Value(0)).current;
  // 5. Resolved checkmark emergence
  const resolvedScale = useRef(new Animated.Value(0.85)).current;
  const resolvedOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Home continuous calm float
    Animated.loop(
      Animated.sequence([
        Animated.timing(homeFloatAnim, {
          toValue: -6,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(homeFloatAnim, {
          toValue: 0,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 2. Location pin gentle float
    Animated.loop(
      Animated.sequence([
        Animated.timing(pinFloatAnim, {
          toValue: -4,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pinFloatAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 3. Orbiting service cards staggered breathing
    Animated.loop(
      Animated.sequence([
        Animated.timing(card1Anim, { toValue: -6, duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(card1Anim, { toValue: 0, duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(card2Anim, { toValue: 5, duration: 2800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(card2Anim, { toValue: -2, duration: 2800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(card3Anim, { toValue: -5, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(card3Anim, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    // 4. Storyline Cycle: Home ➔ Pro Arrives ➔ Resolved
    const storyInterval = setInterval(() => {
      setStoryStage((prev) => {
        const next = ((prev + 1) % 3) as 0 | 1 | 2;
        animateStoryStage(next);
        return next;
      });
    }, 3800);

    // Initial animation trigger
    animateStoryStage(0);

    return () => clearInterval(storyInterval);
  }, [homeFloatAnim, pinFloatAnim, card1Anim, card2Anim, card3Anim]);

  const animateStoryStage = (stage: 0 | 1 | 2) => {
    if (stage === 0) {
      // Stage 0: Calm Home & Needs
      Animated.parallel([
        Animated.timing(proGlideAnim, { toValue: 0, duration: 800, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(resolvedOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(resolvedScale, { toValue: 0.85, duration: 400, useNativeDriver: true }),
      ]).start();
    } else if (stage === 1) {
      // Stage 1: Pro Glides to Home
      Animated.parallel([
        Animated.timing(proGlideAnim, { toValue: 1, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(resolvedOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    } else if (stage === 2) {
      // Stage 2: Resolved & Complete
      Animated.parallel([
        Animated.timing(resolvedOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(resolvedScale, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
      ]).start();
    }
  };

  const toggleLanguage = () => {
    const nextLang = isKhmer ? "en" : "km";
    i18n.changeLanguage(nextLang);
  };

  const handleGetStarted = async () => {
    await useAuthStore.getState().setHasSeenOnboarding(true);
    useAuthStore.getState().setGuestMode(true);
    router.replace("/(customer)/(tabs)/home");
  };

  const handleSignIn = () => {
    router.push("/(public)/login");
  };

  return (
    <SafeAreaView style={s.root} edges={["top", "left", "right", "bottom"]}>
      {/* ─── 1. TOP HEADER: BRAND + LANGUAGE SWITCHER ─────────────────── */}
      <View style={s.topBar}>
        <View style={s.brandWrap}>
          <View style={s.brandLogo}>
            <MaterialCommunityIcons name="home-heart" size={18} color="#FFFFFF" />
          </View>
          <Text style={s.brandText}>ServiceFinder</Text>
        </View>

        <TouchableOpacity onPress={toggleLanguage} style={s.langPill} activeOpacity={0.8}>
          <Text style={s.langFlag}>{isKhmer ? "🇰🇭" : "🇺🇸"}</Text>
          <Text style={s.langText}>{isKhmer ? "ភាសាខ្មែរ" : "English"}</Text>
        </TouchableOpacity>
      </View>

      {/* ─── 2. CENTERPIECE: WARM LIVING HOME ECOSYSTEM ─────────────── */}
      <View style={s.sceneContainer}>
        {/* Soft Warm Ambient Aura (Non-distracting) */}
        <View style={s.ambientGlow} />

        {/* Orbiting Card 1: Cleaning (Top Left) */}
        <Animated.View
          style={[
            s.serviceChip,
            CARD_SHADOW,
            {
              top: 14,
              left: 10,
              transform: [{ translateY: card1Anim }],
            },
          ]}
        >
          <View style={[s.chipIconWrap, { backgroundColor: "#F0FDF4" }]}>
            <MaterialCommunityIcons name="broom" size={15} color="#16A34A" />
          </View>
          <Text style={s.chipTitle}>{isKhmer ? "សម្អាត" : "Cleaning"}</Text>
        </Animated.View>

        {/* Orbiting Card 2: AC Overhaul (Top Right) */}
        <Animated.View
          style={[
            s.serviceChip,
            CARD_SHADOW,
            {
              top: 28,
              right: 12,
              transform: [{ translateY: card2Anim }],
            },
          ]}
        >
          <View style={[s.chipIconWrap, { backgroundColor: "#EFF6FF" }]}>
            <MaterialCommunityIcons name="air-conditioner" size={15} color="#2563EB" />
          </View>
          <Text style={s.chipTitle}>{isKhmer ? "ម៉ាស៊ីនត្រជាក់" : "AC Repair"}</Text>
        </Animated.View>

        {/* The House at the Heart of the Scene */}
        <Animated.View
          style={[
            s.homeHouseBadge,
            CARD_SHADOW,
            { transform: [{ translateY: homeFloatAnim }] },
          ]}
        >
          {/* Gentle Floating Location Pin on Roof */}
          <Animated.View
            style={[
              s.pinPill,
              { transform: [{ translateY: pinFloatAnim }] },
            ]}
          >
            <MaterialCommunityIcons name="map-marker" size={12} color="#EF4444" />
            <Text style={s.pinText}>Phnom Penh</Text>
          </Animated.View>

          {/* Warm Home Illustration Structure */}
          <View style={s.houseIconCircle}>
            <MaterialCommunityIcons name="home-variant" size={48} color="#0F172A" />
          </View>

          {/* Subtle Warm House Foundation Bar */}
          <View style={s.houseFloorBar} />
        </Animated.View>

        {/* Orbiting Card 3: Electrician / Repair (Bottom Left) */}
        <Animated.View
          style={[
            s.serviceChip,
            CARD_SHADOW,
            {
              bottom: 40,
              left: 16,
              transform: [{ translateY: card3Anim }],
            },
          ]}
        >
          <View style={[s.chipIconWrap, { backgroundColor: "#FFFBEB" }]}>
            <MaterialCommunityIcons name="lightning-bolt" size={15} color="#D97706" />
          </View>
          <Text style={s.chipTitle}>{isKhmer ? "ប្រព័ន្ធភ្លើង" : "Electrical"}</Text>
        </Animated.View>

        {/* Service Pro Arriving Badge (Glides into scene) */}
        <Animated.View
          style={[
            s.proArrivalCard,
            CARD_SHADOW,
            {
              opacity: proGlideAnim.interpolate({
                inputRange: [0, 0.4, 1],
                outputRange: [0.3, 0.8, 1],
              }),
              transform: [
                {
                  translateX: proGlideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [40, 0],
                  }),
                },
                {
                  scale: proGlideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.92, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={s.proAvatarMini}>
            <MaterialCommunityIcons name="account-hard-hat" size={16} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.proArrivalName}>Dara C. (Pro Tech)</Text>
            <Text style={s.proArrivalSub}>{isKhmer ? "កំពុងធ្វើដំណើរមកដល់" : "Arriving in 12m"}</Text>
          </View>
          <MaterialCommunityIcons name="shield-check" size={15} color="#16A34A" />
        </Animated.View>

        {/* Emergent Reassurance Badge: Resolved Checkmark */}
        <Animated.View
          style={[
            s.resolvedBadge,
            CARD_SHADOW,
            {
              opacity: resolvedOpacity,
              transform: [{ scale: resolvedScale }],
            },
          ]}
        >
          <View style={s.resolvedCheckCircle}>
            <MaterialCommunityIcons name="check" size={14} color="#FFFFFF" />
          </View>
          <Text style={s.resolvedText}>
            {isKhmer ? "ការងារបានសម្រេច ✓" : "Resolved 5.0 ★"}
          </Text>
        </Animated.View>
      </View>

      {/* ─── 3. MINIMALIST HUMAN STORY COPY ─────────────────────────── */}
      <View style={s.copySection}>
        <Text style={s.heroTitle}>
          {t("welcome.heroTitle", "Help is closer than you think.")}
        </Text>
        <Text style={s.heroSubtitle}>
          {t("welcome.heroSubtitle", "Trusted people for the things you need.")}
        </Text>

        {/* Subtle Story Step Indicator */}
        <View style={s.storyIndicatorRow}>
          {[0, 1, 2].map((idx) => (
            <View
              key={idx}
              style={[
                s.storyDot,
                storyStage === idx && s.storyDotActive,
              ]}
            />
          ))}
        </View>
      </View>

      {/* ─── 4. ONE STRONG CTA & SUBTLE LOGIN ─────────────────────────── */}
      <View style={s.bottomArea}>
        <TouchableOpacity
          onPress={handleGetStarted}
          style={s.primaryBtn}
          activeOpacity={0.88}
        >
          <Text style={s.primaryBtnText}>
            {t("welcome.getStarted", "Get Started")}
          </Text>
          <MaterialCommunityIcons name="arrow-right" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
        </TouchableOpacity>

        <View style={s.loginRow}>
          <Text style={s.loginPrompt}>
            {t("welcome.alreadyAccount", "Already have an account?")}{" "}
          </Text>
          <TouchableOpacity onPress={handleSignIn} hitSlop={{ top: 10, bottom: 10, left: 6, right: 10 }}>
            <Text style={s.loginLink}>
              {t("welcome.logIn", "Log In")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ─── STYLES: WARM, CALM, AND INTENTIONAL ─────────────────────────────
const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F8FAFC", // Clean, warm slate-50
    justifyContent: "space-between",
  },

  // 1. Top Bar
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    paddingTop: Platform.OS === "android" ? 14 : 8,
    paddingBottom: 6,
  },
  brandWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  brandLogo: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
  },
  brandText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.4,
  },
  langPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  langFlag: {
    fontSize: 12,
  },
  langText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#334155",
  },

  // 2. Centerpiece Scene
  sceneContainer: {
    width: width - 40,
    height: 260,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginVertical: 10,
  },
  ambientGlow: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "#FEF3C7", // Gentle warm amber tint
    opacity: 0.35,
  },

  // Home Badge
  homeHouseBadge: {
    width: 124,
    height: 124,
    borderRadius: 36,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  houseIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  houseFloorBar: {
    position: "absolute",
    bottom: 12,
    width: 44,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#CBD5E1",
  },

  // Floating Location Pin
  pinPill: {
    position: "absolute",
    top: -12,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  pinText: {
    fontSize: 9.5,
    fontWeight: "700",
    color: "#0F172A",
  },

  // Orbiting Service Chips
  serviceChip: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  chipIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  chipTitle: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#0F172A",
  },

  // Pro Arrival Card
  proArrivalCard: {
    position: "absolute",
    bottom: 2,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    width: 168,
  },
  proAvatarMini: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
  },
  proArrivalName: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#0F172A",
  },
  proArrivalSub: {
    fontSize: 9,
    color: "#64748B",
  },

  // Emergent Resolved Badge
  resolvedBadge: {
    position: "absolute",
    bottom: 60,
    right: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  resolvedCheckCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
  },
  resolvedText: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#065F46",
  },

  // 3. Human Story Copy
  copySection: {
    paddingHorizontal: 26,
    alignItems: "center",
    textAlign: "center",
    marginTop: 4,
  },
  heroTitle: {
    fontSize: 27,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    letterSpacing: -0.6,
    lineHeight: 34,
  },
  heroSubtitle: {
    fontSize: 14.5,
    fontWeight: "500",
    color: "#64748B",
    textAlign: "center",
    lineHeight: 22,
    marginTop: 8,
    maxWidth: 290,
  },

  // Story Dots Indicator
  storyIndicatorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 18,
  },
  storyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#CBD5E1",
  },
  storyDotActive: {
    width: 18,
    backgroundColor: "#0F172A",
  },

  // 4. Bottom CTAs
  bottomArea: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === "android" ? 22 : 12,
    paddingTop: 10,
  },
  primaryBtn: {
    backgroundColor: "#0F172A",
    borderRadius: 18,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  loginRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },
  loginPrompt: {
    fontSize: 13,
    color: "#64748B",
  },
  loginLink: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
});
