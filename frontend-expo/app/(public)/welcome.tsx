/**
 * Welcome Screen — Visual-First Onboarding with Interactive UI Mockups
 */
import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ScrollView,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
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
  ios: { shadowColor: "#0F172A", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 20 },
  android: { elevation: 6 },
});

const POP_SHADOW = Platform.select({
  ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 10 },
  android: { elevation: 4 },
});

// ─── VISUAL CARD 1: Verified Pro Discovery ─────────────────────────────
function VisualProCard() {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const chipAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -8, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(chipAnim, { toValue: 5, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(chipAnim, { toValue: -3, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, [floatAnim, chipAnim]);

  return (
    <View style={v.visualWrapper}>
      <View style={[v.glowOrb, { backgroundColor: T.accent + "18" }]} />

      <Animated.View style={[v.cardMain, CARD_SHADOW, { transform: [{ translateY: floatAnim }] }]}>
        <View style={v.cardHeaderRow}>
          <View style={v.avatarContainer}>
            <View style={v.proAvatar}>
              <MaterialCommunityIcons name="account-hard-hat" size={32} color="#FFFFFF" />
            </View>
            <View style={v.onlineDot} />
          </View>

          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Text style={v.proName}>Sovan Pro Services</Text>
              <MaterialCommunityIcons name="check-decagram" size={16} color={T.accent} />
            </View>
            <Text style={v.proCategory}>Master AC & Electrician</Text>
            <View style={v.ratingRow}>
              <MaterialCommunityIcons name="star" size={14} color="#F59E0B" />
              <Text style={v.ratingText}>4.9</Text>
              <Text style={v.reviewCount}>(142 reviews)</Text>
            </View>
          </View>
        </View>

        <View style={v.proDivider} />

        <View style={v.proStatsRow}>
          <View style={v.proStat}>
            <Text style={v.proStatValue}>99%</Text>
            <Text style={v.proStatLabel}>On Time</Text>
          </View>
          <View style={v.statSep} />
          <View style={v.proStat}>
            <Text style={v.proStatValue}>500+</Text>
            <Text style={v.proStatLabel}>Jobs Done</Text>
          </View>
          <View style={v.statSep} />
          <View style={v.proStat}>
            <Text style={v.proStatPrice}>$20/hr</Text>
            <Text style={v.proStatLabel}>Starting</Text>
          </View>
        </View>
      </Animated.View>

      <Animated.View style={[v.orbitChipTopLeft, POP_SHADOW, { transform: [{ translateY: chipAnim }] }]}>
        <Text style={v.chipEmoji}>❄️</Text>
        <Text style={v.chipText}>AC Repair</Text>
      </Animated.View>

      <Animated.View style={[v.orbitChipBottomRight, POP_SHADOW, { transform: [{ translateY: floatAnim }] }]}>
        <MaterialCommunityIcons name="shield-check" size={16} color={T.success} />
        <Text style={[v.chipText, { color: T.success, fontWeight: "700" }]}>Verified Pro</Text>
      </Animated.View>
    </View>
  );
}

// ─── VISUAL CARD 2: Live Radar Dispatch ────────────────────────────────
function VisualDispatchRadar() {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const bikeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(bikeAnim, { toValue: -6, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(bikeAnim, { toValue: 6, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, [pulseAnim, bikeAnim]);

  return (
    <View style={v.visualWrapper}>
      <View style={[v.glowOrb, { backgroundColor: (T.blue || "#2563EB") + "18" }]} />

      <View style={v.radarContainer}>
        <Animated.View style={[v.radarRingOuter, { transform: [{ scale: pulseAnim }] }]} />
        <View style={v.radarRingMiddle} />
        <View style={v.radarRingInner} />

        <View style={v.userPin}>
          <MaterialCommunityIcons name="home-map-marker" size={24} color="#FFFFFF" />
          <View style={v.pinPulse} />
        </View>

        <Animated.View style={[v.techPin, { transform: [{ translateX: bikeAnim }] }]}>
          <View style={v.techBadge}>
            <MaterialCommunityIcons name="moped" size={20} color="#FFFFFF" />
          </View>
          <View style={v.etaTag}>
            <Text style={v.etaTagText}>18 min</Text>
          </View>
        </Animated.View>
      </View>

      <View style={[v.dispatchBottomCard, CARD_SHADOW]}>
        <View style={v.dispatchHeader}>
          <View style={v.dispatchLiveBadge}>
            <View style={v.blinkingGreenDot} />
            <Text style={v.dispatchLiveText}>LIVE DISPATCH</Text>
          </View>
          <Text style={v.distanceText}>1.4 km away</Text>
        </View>

        <View style={v.driverRow}>
          <View style={v.driverAvatar}>
            <MaterialCommunityIcons name="account-wrench" size={22} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={v.driverName}>Chanthy Plumber</Text>
            <Text style={v.driverVehicle}>En route • Moto #2A-9812</Text>
          </View>
          <View style={v.quickActionBtns}>
            <View style={v.actionIconCircle}>
              <MaterialCommunityIcons name="phone" size={16} color={T.accent} />
            </View>
            <View style={v.actionIconCircle}>
              <MaterialCommunityIcons name="chat" size={16} color={T.accent} />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── VISUAL CARD 3: Bakong KHQR Escrow Vault ───────────────────────────
function VisualEscrowVault() {
  const lockAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(lockAnim, { toValue: -8, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(lockAnim, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, [lockAnim]);

  return (
    <View style={v.visualWrapper}>
      <View style={[v.glowOrb, { backgroundColor: (T.success || "#10B981") + "18" }]} />

      <Animated.View style={[v.vaultCard, CARD_SHADOW, { transform: [{ translateY: lockAnim }] }]}>
        <View style={v.khqrTopBar}>
          <Text style={v.khqrLogoText}>KHQR</Text>
          <Text style={v.khqrSubText}>BAKONG ESCROW</Text>
        </View>

        <View style={v.qrContainer}>
          <MaterialCommunityIcons name="qrcode" size={110} color="#0F172A" />
          <View style={v.qrCenterShield}>
            <MaterialCommunityIcons name="shield-lock" size={22} color="#FFFFFF" />
          </View>
        </View>

        <View style={v.paymentStatusPill}>
          <MaterialCommunityIcons name="lock-check" size={14} color={T.success} />
          <Text style={v.paymentStatusText}>Funds Held in Safe Escrow</Text>
        </View>
      </Animated.View>

      <View style={[v.orbitChipTopLeft, POP_SHADOW]}>
        <Text style={v.chipEmoji}>🛡️</Text>
        <Text style={v.chipText}>$1,000 Guarantee</Text>
      </View>

      <View style={[v.orbitChipBottomRight, POP_SHADOW]}>
        <Text style={v.chipEmoji}>💳</Text>
        <Text style={[v.chipText, { color: T.accent, fontWeight: "700" }]}>Pay After Service</Text>
      </View>
    </View>
  );
}

// ─── MAIN ONBOARDING SCREEN ───────────────────────────────────────────
export default function WelcomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);
  const isKhmer = i18n.language?.startsWith("km");

  const toggleLanguage = () => {
    const nextLang = isKhmer ? "en" : "km";
    i18n.changeLanguage(nextLang);
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = e.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(scrollPosition / width);
    if (currentIndex !== activeIndex && currentIndex >= 0 && currentIndex < 3) {
      setActiveIndex(currentIndex);
    }
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
      {/* Top Header: Brand + 1-Tap Language + Skip */}
      <View style={s.topBar}>
        <View style={s.brandWrap}>
          <View style={s.brandLogo}>
            <MaterialCommunityIcons name="wrench" size={16} color="#FFFFFF" />
          </View>
          <Text style={s.brandText}>ServiceFinder</Text>
        </View>

        <View style={s.topActions}>
          <TouchableOpacity onPress={toggleLanguage} style={s.langPill} activeOpacity={0.8}>
            <Text style={s.langFlag}>{isKhmer ? "🇰🇭" : "🇺🇸"}</Text>
            <Text style={s.langText}>{isKhmer ? "ភាសាខ្មែរ" : "English"}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleGetStarted} style={s.skipBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={s.skipText}>{t("welcome.skip", "Skip")}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Visual Carousel Slides */}
      <View style={s.carouselWrapper}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
        >
          {/* SLIDE 1 */}
          <View style={s.slide}>
            <VisualProCard />
            <Text style={s.title}>{t("welcome.findServices", "Trusted Pros Nearby")}</Text>
            <Text style={s.subtitle}>{t("welcome.findServicesDesc", "Verified local experts ready for any home need.")}</Text>
          </View>

          {/* SLIDE 2 */}
          <View style={s.slide}>
            <VisualDispatchRadar />
            <Text style={s.title}>{t("welcome.bookInstantly", "Fast Live Dispatch")}</Text>
            <Text style={s.subtitle}>{t("welcome.bookInstantlyDesc", "Track your technician in real time on the map.")}</Text>
          </View>

          {/* SLIDE 3 */}
          <View style={s.slide}>
            <VisualEscrowVault />
            <Text style={s.title}>{t("welcome.absoluteConfidence", "Safe Escrow & KHQR")}</Text>
            <Text style={s.subtitle}>{t("welcome.absoluteConfidenceDesc", "Pay securely only after the job is completed.")}</Text>
          </View>
        </ScrollView>
      </View>

      {/* Pagination Indicator */}
      <View style={s.pagination}>
        {[0, 1, 2].map((idx) => (
          <View
            key={idx}
            style={[
              s.dot,
              activeIndex === idx && s.dotActive,
            ]}
          />
        ))}
      </View>

      {/* Clean Bottom CTAs */}
      <View style={s.bottomArea}>
        <TouchableOpacity
          onPress={handleGetStarted}
          style={s.primaryBtn}
          activeOpacity={0.88}
        >
          <Text style={s.primaryBtnText}>{t("welcome.getStarted", "Get Started")}</Text>
          <MaterialCommunityIcons name="arrow-right" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
        </TouchableOpacity>

        <View style={s.loginRow}>
          <Text style={s.loginPrompt}>{t("welcome.alreadyAccount", "Already have an account?")} </Text>
          <TouchableOpacity onPress={handleSignIn} hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}>
            <Text style={s.loginLink}>{t("welcome.logIn", "Log In")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ─── VISUAL ELEMENTS STYLES ───────────────────────────────────────────
const v = StyleSheet.create({
  visualWrapper: {
    width: width - 48,
    height: 250,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  glowOrb: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  cardMain: {
    width: width - 80,
    backgroundColor: T.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: T.border,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
  },
  proAvatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: T.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  onlineDot: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#10B981",
    borderWidth: 2,
    borderColor: T.surface,
  },
  proName: {
    fontSize: 15,
    fontWeight: "700",
    color: T.text1,
  },
  proCategory: {
    fontSize: 12,
    color: T.text2,
    marginTop: 1,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 3,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "700",
    color: T.text1,
  },
  reviewCount: {
    fontSize: 11,
    color: T.text3,
  },
  proDivider: {
    height: 1,
    backgroundColor: T.border,
    marginVertical: 12,
  },
  proStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  proStat: {
    alignItems: "center",
  },
  proStatValue: {
    fontSize: 14,
    fontWeight: "800",
    color: T.text1,
  },
  proStatPrice: {
    fontSize: 14,
    fontWeight: "800",
    color: T.accent,
  },
  proStatLabel: {
    fontSize: 10,
    color: T.text3,
    marginTop: 2,
  },
  statSep: {
    width: 1,
    height: 20,
    backgroundColor: T.border,
  },
  orbitChipTopLeft: {
    position: "absolute",
    top: 6,
    left: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: T.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: T.border,
  },
  orbitChipBottomRight: {
    position: "absolute",
    bottom: 8,
    right: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: T.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: T.border,
  },
  chipEmoji: {
    fontSize: 14,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
    color: T.text1,
  },

  // RADAR STYLES
  radarContainer: {
    width: 180,
    height: 180,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  radarRingOuter: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1,
    borderColor: (T.blue || "#2563EB") + "30",
    backgroundColor: (T.blue || "#2563EB") + "08",
  },
  radarRingMiddle: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: (T.blue || "#2563EB") + "40",
  },
  radarRingInner: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: (T.blue || "#2563EB") + "15",
  },
  userPin: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: T.accent,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    ...POP_SHADOW,
  },
  pinPulse: {
    position: "absolute",
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: T.accent + "40",
    zIndex: -1,
  },
  techPin: {
    position: "absolute",
    top: 15,
    right: 15,
    alignItems: "center",
    zIndex: 3,
  },
  techBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: T.blue || "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    ...POP_SHADOW,
  },
  etaTag: {
    backgroundColor: "#0F172A",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 3,
  },
  etaTagText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
  },
  dispatchBottomCard: {
    width: width - 80,
    backgroundColor: T.surface,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: T.border,
  },
  dispatchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  dispatchLiveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: "#10B98118",
    borderRadius: 10,
  },
  blinkingGreenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  dispatchLiveText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#10B981",
  },
  distanceText: {
    fontSize: 11,
    fontWeight: "600",
    color: T.text3,
  },
  driverRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  driverAvatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: T.blue || "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },
  driverName: {
    fontSize: 13,
    fontWeight: "700",
    color: T.text1,
  },
  driverVehicle: {
    fontSize: 11,
    color: T.text2,
  },
  quickActionBtns: {
    flexDirection: "row",
    gap: 6,
  },
  actionIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: T.accent + "15",
    alignItems: "center",
    justifyContent: "center",
  },

  // ESCROW VAULT STYLES
  vaultCard: {
    width: width - 110,
    backgroundColor: T.surface,
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: T.border,
  },
  khqrTopBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    marginBottom: 8,
  },
  khqrLogoText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#D9222A",
    letterSpacing: 1,
  },
  khqrSubText: {
    fontSize: 9,
    fontWeight: "800",
    color: T.text3,
    letterSpacing: 0.5,
  },
  qrContainer: {
    position: "relative",
    padding: 4,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  qrCenterShield: {
    position: "absolute",
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: T.success || "#10B981",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  paymentStatusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#10B98115",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginTop: 10,
  },
  paymentStatusText: {
    fontSize: 11,
    fontWeight: "700",
    color: T.success || "#10B981",
  },
});

// ─── SCREEN LAYOUT STYLES ─────────────────────────────────────────────
const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: T.bg,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 12 : 6,
    paddingBottom: 4,
  },
  brandWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  brandLogo: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: T.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  brandText: {
    fontSize: 16,
    fontWeight: "800",
    color: T.text1,
    letterSpacing: -0.3,
  },
  topActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  langPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.border,
  },
  langFlag: {
    fontSize: 13,
  },
  langText: {
    fontSize: 11,
    fontWeight: "700",
    color: T.text2,
  },
  skipBtn: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  skipText: {
    fontSize: 14,
    fontWeight: "600",
    color: T.text3,
  },

  carouselWrapper: {
    flex: 1,
    justifyContent: "center",
  },
  slide: {
    width,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: T.text1,
    letterSpacing: -0.5,
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "400",
    color: T.text2,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 24,
    maxWidth: 320,
  },

  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 14,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: T.border,
  },
  dotActive: {
    width: 26,
    backgroundColor: T.accent,
  },

  bottomArea: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 12,
  },
  primaryBtn: {
    flexDirection: "row",
    width: "100%",
    backgroundColor: T.accent,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: T.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },

  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 2,
  },
  loginPrompt: {
    fontSize: 13,
    color: T.text3,
    fontWeight: "500",
  },
  loginLink: {
    fontSize: 13,
    color: T.accent,
    fontWeight: "700",
  },
});
