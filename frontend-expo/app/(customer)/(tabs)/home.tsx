import React, { useEffect, useCallback, useMemo, useRef, useState } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Animated,
  Easing,
  Pressable,
  Platform,
  FlatList,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/store/authStore";
import { useCustomerHomeStore } from "@/store/customerHomeStore";
import NotificationBell from "@/components/NotificationBell";
import FadeIn from "@/components/FadeIn";
import ScaleButton from "@/components/ScaleButton";
import { Theme } from "@/constants/theme";
import * as Location from "expo-location";
import {
  AirconCategorySvg,
  PlumbingCategorySvg,
  CleaningCategorySvg,
  ElectricianCategorySvg,
  HandymanCategorySvg,
  MovingCategorySvg,
} from "@/components/svg/CategoryMarks";

const { width } = Dimensions.get("window");
const T = Theme.colors;

// ─── TRADE THEMES (Pastel Plates & Semantic Telemetry) ─────────────────
interface TradeTheme {
  bg: string;
  border: string;
  badgeBg: string;
  badgeText: string;
  accent: string;
  icon: string;
  tag: string;
}

const TRADE_THEMES: Record<string, TradeTheme> = {
  ac: {
    bg: "#EFF6FF",
    border: "#DBEAFE",
    badgeBg: "#DBEAFE",
    badgeText: "#1E40AF",
    accent: "#2563EB",
    icon: "air-conditioner",
    tag: "15m arrival",
  },
  air: {
    bg: "#EFF6FF",
    border: "#DBEAFE",
    badgeBg: "#DBEAFE",
    badgeText: "#1E40AF",
    accent: "#2563EB",
    icon: "air-conditioner",
    tag: "15m arrival",
  },
  cool: {
    bg: "#EFF6FF",
    border: "#DBEAFE",
    badgeBg: "#DBEAFE",
    badgeText: "#1E40AF",
    accent: "#2563EB",
    icon: "air-conditioner",
    tag: "15m arrival",
  },
  clean: {
    bg: "#ECFDF5",
    border: "#A7F3D0",
    badgeBg: "#D1FAE5",
    badgeText: "#065F46",
    accent: "#059669",
    icon: "broom",
    tag: "Same day",
  },
  maid: {
    bg: "#ECFDF5",
    border: "#A7F3D0",
    badgeBg: "#D1FAE5",
    badgeText: "#065F46",
    accent: "#059669",
    icon: "broom",
    tag: "Same day",
  },
  spark: {
    bg: "#ECFDF5",
    border: "#A7F3D0",
    badgeBg: "#D1FAE5",
    badgeText: "#065F46",
    accent: "#059669",
    icon: "broom",
    tag: "Same day",
  },
  plumb: {
    bg: "#ECFEFF",
    border: "#BAE6FD",
    badgeBg: "#CFFAFE",
    badgeText: "#0E7490",
    accent: "#0891B2",
    icon: "pipe-wrench",
    tag: "20m arrival",
  },
  pipe: {
    bg: "#ECFEFF",
    border: "#BAE6FD",
    badgeBg: "#CFFAFE",
    badgeText: "#0E7490",
    accent: "#0891B2",
    icon: "pipe-wrench",
    tag: "20m arrival",
  },
  water: {
    bg: "#ECFEFF",
    border: "#BAE6FD",
    badgeBg: "#CFFAFE",
    badgeText: "#0E7490",
    accent: "#0891B2",
    icon: "water-pump",
    tag: "20m arrival",
  },
  electric: {
    bg: "#FFFBEB",
    border: "#FDE68A",
    badgeBg: "#FEF3C7",
    badgeText: "#92400E",
    accent: "#D97706",
    icon: "lightning-bolt",
    tag: "Live dispatch",
  },
  wire: {
    bg: "#FFFBEB",
    border: "#FDE68A",
    badgeBg: "#FEF3C7",
    badgeText: "#92400E",
    accent: "#D97706",
    icon: "lightning-bolt",
    tag: "Live dispatch",
  },
  zap: {
    bg: "#FFFBEB",
    border: "#FDE68A",
    badgeBg: "#FEF3C7",
    badgeText: "#92400E",
    accent: "#D97706",
    icon: "lightning-bolt",
    tag: "Live dispatch",
  },
  move: {
    bg: "#F8FAFC",
    border: "#E2E8F0",
    badgeBg: "#F1F5F9",
    badgeText: "#334155",
    accent: "#475569",
    icon: "truck-delivery",
    tag: "Book ahead",
  },
  truck: {
    bg: "#F8FAFC",
    border: "#E2E8F0",
    badgeBg: "#F1F5F9",
    badgeText: "#334155",
    accent: "#475569",
    icon: "truck-delivery",
    tag: "Book ahead",
  },
  paint: {
    bg: "#FDF4FF",
    border: "#F5D0FE",
    badgeBg: "#FAE8FF",
    badgeText: "#86198F",
    accent: "#A21CAF",
    icon: "brush",
    tag: "Custom quote",
  },
};

function getTradeTheme(name: string): TradeTheme {
  const n = (name || "").toLowerCase();
  for (const [key, theme] of Object.entries(TRADE_THEMES)) {
    if (n.includes(key)) return theme;
  }
  return {
    bg: "#F8FAFC",
    border: "#E2E8F0",
    badgeBg: "#F1F5F9",
    badgeText: "#334155",
    accent: "#475569",
    icon: "tools",
    tag: "Verified pro",
  };
}

function CategoryMarkRenderer({ name, size = 48 }: { name: string; size?: number }) {
  const n = (name || "").toLowerCase();
  if (n.includes("ac") || n.includes("air") || n.includes("cool")) return <AirconCategorySvg size={size} />;
  if (n.includes("plumb") || n.includes("pipe") || n.includes("water")) return <PlumbingCategorySvg size={size} />;
  if (n.includes("clean") || n.includes("maid") || n.includes("spark")) return <CleaningCategorySvg size={size} />;
  if (n.includes("electric") || n.includes("wire") || n.includes("volt") || n.includes("zap")) return <ElectricianCategorySvg size={size} />;
  if (n.includes("move") || n.includes("truck") || n.includes("pack")) return <MovingCategorySvg size={size} />;
  return <HandymanCategorySvg size={size} />;
}

// ─── SKELETON LOADERS ──────────────────────────────────────────────────
function Skeleton({ width, height, radius = 8, style }: {
  width: number | string; height: number; radius?: number; style?: any;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 900, easing: Easing.ease, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 900, easing: Easing.ease, useNativeDriver: true }),
      ])
    ).start();
  }, [anim]);

  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.75] });

  return (
    <Animated.View
      style={[{ width, height, borderRadius: radius, backgroundColor: "#E2E8F0", opacity }, style]}
    />
  );
}

function CategorySkeleton() {
  return (
    <View style={{ flexDirection: "row", paddingHorizontal: 24, gap: 14 }}>
      {[...Array(5)].map((_, i) => (
        <View key={i} style={{ alignItems: "center", gap: 8 }}>
          <Skeleton width={64} height={64} radius={20} />
          <Skeleton width={48} height={10} radius={5} />
        </View>
      ))}
    </View>
  );
}

function ServiceCardSkeleton() {
  return (
    <View style={{ flexDirection: "row", paddingHorizontal: 24, gap: 12 }}>
      {[...Array(3)].map((_, i) => (
        <View key={i} style={{ width: 168, gap: 10 }}>
          <Skeleton width={168} height={110} radius={18} />
          <Skeleton width={120} height={12} radius={6} />
          <Skeleton width={80} height={10} radius={5} />
        </View>
      ))}
    </View>
  );
}

function PressCard({ onPress, style, children }: {
  onPress: () => void; style?: any; children: React.ReactNode;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const press = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    onPress();
  };
  return (
    <Pressable onPress={press}>
      <Animated.View style={[{ transform: [{ scale }] }, style]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

export default function Home() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const {
    categories,
    trendingServices,
    recommendedServices,
    activeBooking,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    fetchHomeData,
    loadMoreServices,
    topCompanies,
    sponsoredCompanies,
  } = useCustomerHomeStore();

  const fetchLocationAndData = useCallback(async () => {
    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync().catch(() => false);
      if (servicesEnabled) {
        const { status } = await Location.requestForegroundPermissionsAsync().catch(() => ({ status: 'denied' }));
        if (status === 'granted') {
          let loc = await Location.getLastKnownPositionAsync().catch(() => null);
          if (!loc) {
            loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).catch(() => null);
          }
          if (loc?.coords) {
            await fetchHomeData(loc.coords.latitude, loc.coords.longitude);
            return;
          }
        }
      }
    } catch {
      // Graceful fallback to default Phnom Penh location
    }
    await fetchHomeData(11.5564, 104.9282);
  }, [fetchHomeData]);

  useEffect(() => {
    fetchLocationAndData();
  }, [fetchLocationAndData]);

  const onRefresh = useCallback(() => {
    fetchLocationAndData();
  }, [fetchLocationAndData]);

  const firstName = user?.name?.split(" ")[0] || "there";
  const locationLabel = (user as any)?.city
    ? `${(user as any).city}${(user as any).state ? ", " + (user as any).state : ""}`
    : "Phnom Penh";

  const [selectedPopularCategory, setSelectedPopularCategory] = useState("All");

  const popularFilterChips = useMemo(() => {
    const base = ["All"];
    categories.slice(0, 4).forEach((c) => base.push(c.name));
    return base;
  }, [categories]);

  const filteredPopularServices = useMemo(() => {
    if (selectedPopularCategory === "All") return trendingServices;
    return trendingServices.filter((st) => {
      const catName = (st.serviceType?.category?.name || "").toLowerCase();
      const typeName = (st.serviceType?.name || "").toLowerCase();
      const serviceName = (st.name || "").toLowerCase();
      const target = selectedPopularCategory.toLowerCase();
      return catName.includes(target) || typeName.includes(target) || serviceName.includes(target);
    });
  }, [selectedPopularCategory, trendingServices]);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return t('home.goodMorning', 'Good morning');
    if (h < 18) return t('home.goodAfternoon', 'Good afternoon');
    return t('home.goodEvening', 'Good evening');
  }, [t]);

  // Spotlight carousel items (clean, light verified partners)
  const spotlightItems = useMemo(() => {
    if (sponsoredCompanies && sponsoredCompanies.length > 0) {
      return sponsoredCompanies.map((co) => ({
        id: co.id,
        title: co.name,
        subtitle: co.description || "Top-rated verified provider in Phnom Penh",
        image: co.coverImageUrl || co.logoUrl || "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=600&auto=format&fit=crop",
        badge: "VERIFIED ELITE",
        rating: co.ratingSummary?.averageRating ? Number(co.ratingSummary.averageRating).toFixed(1) : "4.9",
        reviews: co.ratingSummary?.totalReviews || "120+",
        route: `/(customer)/company/${co.id}`,
      }));
    }

    if (topCompanies && topCompanies.length > 0) {
      return topCompanies.slice(0, 3).map((co) => ({
        id: co.id,
        title: co.name,
        subtitle: co.description || "Top-rated verified provider in Phnom Penh",
        image: co.coverImageUrl || co.logoUrl || "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=600&auto=format&fit=crop",
        badge: "FEATURED PARTNER",
        rating: co.ratingSummary?.averageRating ? Number(co.ratingSummary.averageRating).toFixed(1) : "4.9",
        reviews: co.ratingSummary?.totalReviews || "85+",
        route: `/(customer)/company/${co.id}`,
      }));
    }

    return [
      {
        id: "mock-1",
        title: "Sparkle Cleaning Co.",
        subtitle: "Deep cleaning & certified sanitized housekeeping.",
        image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=600&auto=format&fit=crop",
        badge: "VERIFIED ELITE",
        rating: "4.9",
        reviews: "320+",
        route: "/(customer)/(tabs)/explore",
      },
      {
        id: "mock-2",
        title: "Elite Aircon Solutions",
        subtitle: "24/7 HVAC repairs, gas refill & deep chemical wash.",
        image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?q=80&w=600&auto=format&fit=crop",
        badge: "EXPRESS DISPATCH",
        rating: "5.0",
        reviews: "210+",
        route: "/(customer)/(tabs)/explore",
      },
    ];
  }, [sponsoredCompanies, topCompanies]);

  const spotlightRef = useRef<ScrollView>(null);
  const [spotlightIndex, setSpotlightIndex] = useState(0);

  useEffect(() => {
    if (activeBooking || spotlightItems.length === 0) return;
    const interval = setInterval(() => {
      setSpotlightIndex((prev) => {
        const next = (prev + 1) % spotlightItems.length;
        spotlightRef.current?.scrollTo({ x: next * (width - 48 + 12), animated: true });
        return next;
      });
    }, 4500);
    return () => clearInterval(interval);
  }, [activeBooking, spotlightItems]);

  return (
    <SafeAreaView style={s.root}>
      {/* ─── HEADER ──────────────────────────────────────────── */}
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <View style={s.locationRow}>
            <View style={s.locationDot} />
            <Text style={s.locationText}>{locationLabel}</Text>
            <MaterialIcons name="keyboard-arrow-down" size={16} color={T.text2} />
          </View>
          <Text style={s.nameText} numberOfLines={1}>{greeting}, {firstName} 👋</Text>
        </View>

        <View style={s.headerActions}>
          <PressCard onPress={() => router.push("/(customer)/notifications" as any)}>
            <View style={s.headerIconBtn}>
              <NotificationBell color={T.text1} />
            </View>
          </PressCard>
          <PressCard onPress={() => router.push("/(customer)/(tabs)/profile" as any)}>
            <Image
              source={{ uri: user?.avatarUrl || `https://api.dicebear.com/9.x/initials/svg?seed=${user?.name || "Guest"}` }}
              style={s.avatar}
            />
          </PressCard>
        </View>
      </View>

      <FlatList
        data={recommendedServices}
        keyExtractor={(item, idx) => item.id || idx.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} colors={[T.accent]} tintColor={T.accent} />
        }
        onEndReached={() => {
          if (hasMore && !isLoadingMore) loadMoreServices();
        }}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={
          <>
            {error ? (
              <View style={s.errorBanner}>
                <MaterialIcons name="wifi-off" size={18} color={T.error} />
                <Text style={s.errorText}>{t('home.errorLoadData', 'Unable to reach service network.')}</Text>
              </View>
            ) : null}

            {/* ─── SECTION 1: SEARCH & FILTER BAR ──────────────────── */}
            <View style={{ paddingHorizontal: 24, marginTop: 18 }}>
              <PressCard onPress={() => router.push("/(customer)/search" as any)}>
                <View style={s.searchBar}>
                  <View style={s.searchIconWrap}>
                    <MaterialIcons name="search" size={20} color="#0A192F" />
                  </View>
                  <Text style={s.searchPlaceholder}>
                    {t('home.searchPlaceholder', 'Find aircon, plumber, cleaner...')}
                  </Text>
                  <View style={s.filterBtn}>
                    <MaterialIcons name="tune" size={16} color="#0A192F" />
                  </View>
                </View>
              </PressCard>
            </View>

            {/* ─── SECTION 2: DUAL SPEED-DIAL (URGENT VS SCHEDULED) ── */}
            <View style={{ paddingHorizontal: 24, marginTop: 18 }}>
              <View style={{ flexDirection: "row", gap: 12 }}>
                {/* 1. Live Urgent Pro */}
                <TouchableOpacity
                  style={s.urgentActionCard}
                  activeOpacity={0.88}
                  onPress={() => router.push("/(customer)/map-view?mode=instant" as any)}
                >
                  <View style={s.urgentBadgeRow}>
                    <View style={s.urgentPulseDot} />
                    <Text style={s.urgentBadgeText}>
                      {t("instantBooking.urgentProBadge", "15–30M ARRIVAL")}
                    </Text>
                  </View>
                  <Text style={s.actionCardTitle}>Urgent Pro</Text>
                  <Text style={s.actionCardSubtitle}>Nearest tech arrives on live map</Text>
                  <View style={s.actionPillAmber}>
                    <MaterialCommunityIcons name="lightning-bolt" size={13} color="#D97706" />
                    <Text style={s.actionPillAmberText}>Live Dispatch</Text>
                    <MaterialIcons name="chevron-right" size={14} color="#D97706" />
                  </View>
                </TouchableOpacity>

                {/* 2. Schedule Ahead */}
                <TouchableOpacity
                  style={s.scheduleActionCard}
                  activeOpacity={0.88}
                  onPress={() => router.push("/(customer)/(tabs)/explore" as any)}
                >
                  <View style={s.scheduleBadgeRow}>
                    <MaterialCommunityIcons name="calendar-month-outline" size={12} color="#0284C7" />
                    <Text style={s.scheduleBadgeText}>
                      {t("instantBooking.exploreProBadge", "APPOINTMENT")}
                    </Text>
                  </View>
                  <Text style={s.actionCardTitle}>Schedule Ahead</Text>
                  <Text style={s.actionCardSubtitle}>Pick date, pro & custom package</Text>
                  <View style={s.actionPillSlate}>
                    <MaterialCommunityIcons name="calendar-check" size={13} color="#0F172A" />
                    <Text style={s.actionPillSlateText}>Browse Catalog</Text>
                    <MaterialIcons name="chevron-right" size={14} color="#0F172A" />
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* ─── SECTION 3: ACTIVE BOOKING LIVE PULSE (IF ACTIVE) ─── */}
            {activeBooking && (
              <View style={{ paddingHorizontal: 24, marginTop: 20 }}>
                <FadeIn delay={100}>
                  <PressCard onPress={() => router.push(`/(customer)/booking/${activeBooking.id}` as any)}>
                    <View style={s.activeBookingCard}>
                      <View style={s.activeHeaderRow}>
                        <View style={s.activePulseBadge}>
                          <View style={s.liveGreenDot} />
                          <Text style={s.activeStatusTitle}>
                            {activeBooking.status === 'in_progress' ? 'STAFF EN ROUTE' : 'DISPATCH ACTIVE'}
                          </Text>
                        </View>
                        <Text style={s.activeEtaValue}>
                          {activeBooking.status === 'in_progress' ? '12 MINS' : 'LIVE'}
                        </Text>
                      </View>

                      <View style={s.activeBodyRow}>
                        <View style={s.activeGlyphBox}>
                          <MaterialCommunityIcons name="tools" size={20} color="#0A192F" />
                        </View>
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text style={s.activeServiceName} numberOfLines={1}>
                            {activeBooking.service?.name || "Service In Progress"}
                          </Text>
                          <Text style={s.activeSubtext}>
                            Verified technician is traveling to your location
                          </Text>
                        </View>
                      </View>

                      <ScaleButton onPress={() => router.push(`/(customer)/booking/${activeBooking.id}` as any)}>
                        <View style={s.activeTrackBtn}>
                          <Text style={s.activeTrackText}>LIVE TRACKING</Text>
                          <MaterialIcons name="chevron-right" size={16} color="#FFF" />
                        </View>
                      </ScaleButton>
                    </View>
                  </PressCard>
                </FadeIn>
              </View>
            )}

            {/* ─── SECTION 4: TACTILE CATEGORIES RAIL ────────────────── */}
            <View style={{ marginTop: 28 }}>
              <View style={s.sectionHeader}>
                <View>
                  <Text style={s.sectionTitle}>{t('home.browseCategories', 'Categories')}</Text>
                  <Text style={s.sectionSubtitle}>Tap to explore trade specialists</Text>
                </View>
                <TouchableOpacity onPress={() => router.push("/(customer)/(tabs)/explore" as any)}>
                  <Text style={s.seeAllLink}>{t('home.seeAll', 'See all')}</Text>
                </TouchableOpacity>
              </View>

              {isLoading && categories.length === 0 ? (
                <View style={{ marginTop: 14 }}><CategorySkeleton /></View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 14, gap: 14, paddingBottom: 4 }}
                >
                  {categories.map((cat, i) => {
                    const theme = getTradeTheme(cat.name);
                    return (
                      <FadeIn key={cat.id} delay={i * 60}>
                        <PressCard onPress={() => router.push({ pathname: "/(customer)/category/[id]", params: { id: cat.slug } })}>
                          <View style={s.catItem}>
                            <View style={[s.catPlate, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                              {cat.useImageAsBadge && cat.imageUrl ? (
                                <Image source={{ uri: cat.imageUrl }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
                              ) : (
                                <CategoryMarkRenderer name={cat.name} size={48} />
                              )}
                            </View>
                            <Text style={s.catLabel} numberOfLines={1}>{cat.name}</Text>
                          </View>
                        </PressCard>
                      </FadeIn>
                    );
                  })}
                </ScrollView>
              )}
            </View>

            {/* ─── SECTION 5: SPOTLIGHT PARTNER (Clean Branded Showcase) ── */}
            {!activeBooking && spotlightItems.length > 0 && (
              <View style={{ marginTop: 28 }}>
                <View style={s.sectionHeader}>
                  <View>
                    <Text style={s.sectionTitle}>Featured Partner</Text>
                    <Text style={s.sectionSubtitle}>Vetted top-tier company in your district</Text>
                  </View>
                </View>

                <ScrollView
                  ref={spotlightRef}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 12, gap: 12 }}
                  snapToInterval={width - 48 + 12}
                  decelerationRate="fast"
                  snapToAlignment="start"
                  onMomentumScrollEnd={(e) => {
                    const newIndex = Math.round(e.nativeEvent.contentOffset.x / (width - 48 + 12));
                    setSpotlightIndex(newIndex);
                  }}
                >
                  {spotlightItems.map((item) => (
                    <PressCard
                      key={item.id.toString()}
                      onPress={() => router.push(item.route as any)}
                      style={{ width: width - 48 }}
                    >
                      <View style={s.spotlightCard}>
                        <View style={s.spotlightTopRow}>
                          <View style={s.spotlightBadge}>
                            <MaterialIcons name="verified" size={12} color="#2563EB" />
                            <Text style={s.spotlightBadgeText}>{item.badge}</Text>
                          </View>
                          <View style={s.spotlightResponsePill}>
                            <View style={s.onlineDotSmall} />
                            <Text style={s.spotlightResponseText}>&lt; 5m response</Text>
                          </View>
                        </View>

                        <View style={s.spotlightBodyRow}>
                          <Image
                            source={{ uri: item.image }}
                            style={s.spotlightImage}
                            contentFit="cover"
                          />
                          <View style={{ flex: 1, marginLeft: 14, justifyContent: "center" }}>
                            <Text style={s.spotlightTitle} numberOfLines={1}>{item.title}</Text>
                            <Text style={s.spotlightSubtitle} numberOfLines={2}>{item.subtitle}</Text>
                            <View style={s.spotlightRatingRow}>
                              <MaterialIcons name="star" size={13} color="#F59E0B" />
                              <Text style={s.spotlightRatingText}>{item.rating}</Text>
                              <Text style={s.spotlightReviewsText}>({item.reviews} completed)</Text>
                            </View>
                          </View>
                        </View>

                        <View style={s.spotlightFooterRow}>
                          <Text style={s.spotlightFooterHint}>Bakong KHQR escrow protected</Text>
                          <View style={s.spotlightActionBtn}>
                            <Text style={s.spotlightActionText}>View Profile</Text>
                            <MaterialIcons name="chevron-right" size={14} color="#0A192F" />
                          </View>
                        </View>
                      </View>
                    </PressCard>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* ─── SECTION 6: POPULAR SERVICES (Tactile Visual Cards) ─── */}
            <View style={{ marginTop: 32 }}>
              <View style={s.sectionHeader}>
                <View>
                  <Text style={s.sectionTitle}>Popular Services</Text>
                  <Text style={s.sectionSubtitle}>Top requested trades around {locationLabel}</Text>
                </View>
                <TouchableOpacity onPress={() => router.push("/(customer)/(tabs)/explore" as any)}>
                  <Text style={s.seeAllLink}>{t('home.seeAll', 'See all')}</Text>
                </TouchableOpacity>
              </View>

              {/* Filter Chips */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 24, marginVertical: 12, gap: 8 }}
              >
                {popularFilterChips.map((chip) => {
                  const active = selectedPopularCategory === chip;
                  return (
                    <TouchableOpacity
                      key={chip}
                      onPress={() => setSelectedPopularCategory(chip)}
                      style={[s.filterChip, active && s.filterChipActive]}
                    >
                      <Text style={[s.filterChipText, active && s.filterChipTextActive]}>
                        {chip}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {isLoading && trendingServices.length === 0 ? (
                <View style={{ marginTop: 10 }}><ServiceCardSkeleton /></View>
              ) : filteredPopularServices.length === 0 ? (
                <Text style={s.emptyFilterText}>
                  No active services found in this category.
                </Text>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 6, gap: 14, paddingBottom: 6 }}
                >
                  {filteredPopularServices.map((st, i) => {
                    const theme = getTradeTheme(st.serviceType?.name || st.name);
                    return (
                      <FadeIn key={st.id} delay={i * 80}>
                        <PressCard onPress={() => router.push(`/(customer)/service/${st.id}` as any)}>
                          <View style={s.tactileCard}>
                            {/* Visual Media Header */}
                            <View style={[s.tactileMediaBox, { backgroundColor: theme.bg }]}>
                              {st.image ? (
                                <Image source={{ uri: st.image }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
                              ) : (
                                <View style={s.tactileGlyphWrap}>
                                  <MaterialCommunityIcons name={theme.icon as any} size={32} color={theme.accent} />
                                </View>
                              )}

                              {/* Telemetry Chip */}
                              <View style={s.tactileTelemetryPill}>
                                <View style={[s.telemetryDotSmall, { backgroundColor: theme.accent }]} />
                                <Text style={s.tactileTelemetryText}>{theme.tag}</Text>
                              </View>

                              {/* Rating Badge */}
                              {(st.company as any)?.ratingSummary && (
                                <View style={s.tactileRatingPill}>
                                  <MaterialIcons name="star" size={10} color="#F59E0B" />
                                  <Text style={s.tactileRatingText}>
                                    {Number((st.company as any).ratingSummary.averageRating).toFixed(1)}
                                  </Text>
                                </View>
                              )}
                            </View>

                            {/* Card Body */}
                            <View style={s.tactileBody}>
                              <Text style={[s.tactileCatTag, { color: theme.accent }]} numberOfLines={1}>
                                {(st.serviceType?.category?.name || "Service").toUpperCase()}
                              </Text>
                              <Text style={s.tactileTitle} numberOfLines={2}>{st.name}</Text>
                              <Text style={s.tactileCompany} numberOfLines={1}>
                                {st.company?.name || 'Verified Provider'}
                              </Text>

                              <View style={s.tactileFooterRow}>
                                <View>
                                  <Text style={s.tactileFromText}>From</Text>
                                  <Text style={s.tactilePriceText}>${st.basePrice}</Text>
                                </View>
                                <View style={s.tactileArrowBtn}>
                                  <MaterialIcons name="arrow-forward" size={14} color="#0A192F" />
                                </View>
                              </View>
                            </View>
                          </View>
                        </PressCard>
                      </FadeIn>
                    );
                  })}
                </ScrollView>
              )}
            </View>

            {/* ─── SECTION 7: RECOMMENDED SERVICES (Vertical Feed) ───── */}
            {recommendedServices.length > 0 && (
              <View style={{ marginTop: 36, paddingHorizontal: 24, paddingBottom: 14 }}>
                <View style={s.sectionHeaderNoPad}>
                  <View>
                    <Text style={s.sectionTitle}>{t('home.recommendedForYou', 'Recommended For You')}</Text>
                    <Text style={s.sectionSubtitle}>Handpicked based on your home location</Text>
                  </View>
                </View>
              </View>
            )}
          </>
        }
        renderItem={({ item, index }) => {
          const st = item as any;
          const theme = getTradeTheme(st.serviceType?.name || st.name);
          return (
            <View style={{ paddingHorizontal: 24, paddingBottom: 12 }}>
              <FadeIn delay={index < 5 ? index * 70 : 0}>
                <PressCard onPress={() => router.push(`/(customer)/service/${st.id}` as any)}>
                  <View style={s.recRowCard}>
                    {/* Thumbnail */}
                    <View style={[s.recThumbBox, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                      {st.image ? (
                        <Image source={{ uri: st.image }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
                      ) : (
                        <MaterialCommunityIcons name={theme.icon as any} size={28} color={theme.accent} />
                      )}
                    </View>

                    {/* Meta */}
                    <View style={s.recMetaWrap}>
                      <View style={s.recHeaderRow}>
                        <Text style={[s.recCatTag, { color: theme.accent }]}>
                          {(st.serviceType?.category?.name || "Service").toUpperCase()}
                        </Text>
                        {(st.company as any)?.ratingSummary && (
                          <View style={s.recRatingRow}>
                            <MaterialIcons name="star" size={11} color="#F59E0B" />
                            <Text style={s.recRatingValue}>
                              {Number((st.company as any).ratingSummary.averageRating).toFixed(1)}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={s.recTitle} numberOfLines={1}>{st.name}</Text>
                      <Text style={s.recProvider} numberOfLines={1}>{st.company?.name || 'Verified Provider'}</Text>
                      <View style={s.recBottomRow}>
                        <Text style={s.recPriceText}>${st.basePrice}</Text>
                        <View style={s.recBookPill}>
                          <Text style={s.recBookText}>Book</Text>
                          <MaterialIcons name="arrow-forward" size={12} color="#0A192F" />
                        </View>
                      </View>
                    </View>
                  </View>
                </PressCard>
              </FadeIn>
            </View>
          );
        }}
        ListFooterComponent={
          <View style={{ paddingBottom: 32 }}>
            {isLoadingMore && (
              <View style={{ paddingVertical: 20 }}>
                <ActivityIndicator color={T.accent} />
              </View>
            )}

            {/* Elite Partners Rail */}
            {topCompanies?.length > 0 && (
              <View style={{ marginTop: 24, paddingBottom: 24 }}>
                <View style={s.sectionHeader}>
                  <View>
                    <Text style={s.sectionTitle}>Elite Partners</Text>
                    <Text style={s.sectionSubtitle}>Licensed and background-checked businesses</Text>
                  </View>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 14, gap: 12 }}
                >
                  {topCompanies.map((company, i) => (
                    <FadeIn key={company.id} delay={i * 80}>
                      <PressCard onPress={() => router.push(`/(customer)/company/${company.id}` as any)}>
                        <View style={s.elitePartnerCard}>
                          <Image
                            source={{ uri: company.logoUrl || `https://api.dicebear.com/9.x/initials/svg?seed=${company.name}` }}
                            style={s.eliteLogo}
                            contentFit="cover"
                          />
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                              <Text style={s.eliteName} numberOfLines={1}>{company.name}</Text>
                              <MaterialIcons name="verified" size={13} color="#2563EB" />
                            </View>
                            <Text style={s.eliteCity} numberOfLines={1}>{company.city || 'Phnom Penh'}</Text>
                            <View style={s.eliteRatingRow}>
                              <MaterialIcons name="star" size={12} color="#F59E0B" />
                              <Text style={s.eliteRatingNum}>
                                {company.ratingSummary?.averageRating ? Number(company.ratingSummary.averageRating).toFixed(1) : "4.9"}
                              </Text>
                              <Text style={s.eliteRatingCount}>({company.ratingSummary?.totalReviews || '1.2k'})</Text>
                            </View>
                          </View>
                        </View>
                      </PressCard>
                    </FadeIn>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Trust & Guarantee Strip */}
            <View style={{ paddingHorizontal: 24, marginTop: 16 }}>
              <View style={s.trustStripCard}>
                <View style={s.trustCol}>
                  <View style={[s.trustIconRound, { backgroundColor: "#EFF6FF" }]}>
                    <MaterialIcons name="verified-user" size={18} color="#2563EB" />
                  </View>
                  <Text style={s.trustItemTitle}>{t('home.verifiedPros', 'Verified Pros')}</Text>
                  <Text style={s.trustItemSub}>100% vetted</Text>
                </View>

                <View style={s.trustDivider} />

                <View style={s.trustCol}>
                  <View style={[s.trustIconRound, { backgroundColor: "#ECFDF5" }]}>
                    <MaterialIcons name="lock" size={18} color="#059669" />
                  </View>
                  <Text style={s.trustItemTitle}>{t('home.securePayments', 'Bakong Escrow')}</Text>
                  <Text style={s.trustItemSub}>Hold till done</Text>
                </View>

                <View style={s.trustDivider} />

                <View style={s.trustCol}>
                  <View style={[s.trustIconRound, { backgroundColor: "#FFFBEB" }]}>
                    <MaterialIcons name="support-agent" size={18} color="#D97706" />
                  </View>
                  <Text style={s.trustItemTitle}>{t('home.support247', '24/7 Support')}</Text>
                  <Text style={s.trustItemSub}>Phnom Penh</Text>
                </View>
              </View>
            </View>
          </View>
        }
      />
    </SafeAreaView>
  );
}

// ─── STYLESHEET ────────────────────────────────────────────────────────
const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  android: { elevation: 2 },
});

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8FAFC" },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 4,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  locationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  locationText: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
  },
  nameText: {
    fontSize: 22,
    color: "#0F172A",
    fontWeight: "800",
    letterSpacing: -0.5,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...CARD_SHADOW,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
    backgroundColor: "#E2E8F0",
  },

  // Error Banner
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 24,
    marginTop: 14,
    padding: 12,
    backgroundColor: "#FEF2F2",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorText: { fontSize: 13, color: "#DC2626", fontWeight: "600", flex: 1 },

  // Search Bar
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    backgroundColor: "#FFFFFF",
    borderRadius: 100,
    paddingHorizontal: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...CARD_SHADOW,
  },
  searchIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  filterBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },

  // Dual Action Cards
  urgentActionCard: {
    flex: 1,
    backgroundColor: "#FFFBEB",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FDE68A",
    ...CARD_SHADOW,
  },
  urgentBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  urgentPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#D97706",
  },
  urgentBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#92400E",
    letterSpacing: 0.5,
  },
  scheduleActionCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...CARD_SHADOW,
  },
  scheduleBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F0F9FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  scheduleBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#0369A1",
    letterSpacing: 0.5,
  },
  actionCardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.2,
  },
  actionCardSubtitle: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 3,
    lineHeight: 15,
  },
  actionPillAmber: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 12,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
    borderWidth: 0.5,
    borderColor: "#FDE68A",
  },
  actionPillAmberText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#D97706",
  },
  actionPillSlate: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 12,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
    borderWidth: 0.5,
    borderColor: "#E2E8F0",
  },
  actionPillSlateText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0F172A",
  },

  // Active Booking Live Pulse
  activeBookingCard: {
    borderRadius: 22,
    backgroundColor: "#0A192F",
    padding: 20,
    ...Platform.select({
      ios: { shadowColor: '#0A192F', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 16 },
      android: { elevation: 6 },
    }),
  },
  activeHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  activePulseBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },
  liveGreenDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#10B981",
  },
  activeStatusTitle: {
    fontSize: 11,
    color: "#E2E8F0",
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  activeEtaValue: {
    fontSize: 26,
    color: "#FFFFFF",
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  activeBodyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    padding: 12,
    borderRadius: 14,
  },
  activeGlyphBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  activeServiceName: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  activeSubtext: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 2,
  },
  activeTrackBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 16,
  },
  activeTrackText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "800",
    letterSpacing: 0.8,
  },

  // Section Headers
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 24,
  },
  sectionHeaderNoPad: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 18,
    color: "#0F172A",
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  seeAllLink: {
    fontSize: 13,
    color: "#2563EB",
    fontWeight: "700",
  },

  // Category Item
  catItem: {
    alignItems: "center",
    gap: 6,
    width: 68,
  },
  catPlate: {
    width: 62,
    height: 62,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    overflow: "hidden",
    ...CARD_SHADOW,
  },
  catLabel: {
    fontSize: 11,
    color: "#334155",
    fontWeight: "700",
    textAlign: "center",
  },

  // Spotlight Partner Card
  spotlightCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...CARD_SHADOW,
  },
  spotlightTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  spotlightBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: "#DBEAFE",
  },
  spotlightBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#1E40AF",
    letterSpacing: 0.5,
  },
  spotlightResponsePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
  },
  onlineDotSmall: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#10B981",
  },
  spotlightResponseText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#065F46",
  },
  spotlightBodyRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  spotlightImage: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: "#EFF6FF",
  },
  spotlightTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  spotlightSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
    lineHeight: 16,
  },
  spotlightRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 4,
  },
  spotlightRatingText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0F172A",
  },
  spotlightReviewsText: {
    fontSize: 11,
    color: "#94A3B8",
  },
  spotlightFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  spotlightFooterHint: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "500",
  },
  spotlightActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  spotlightActionText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0A192F",
  },

  // Popular Filters
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 100,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  filterChipActive: {
    backgroundColor: "#0A192F",
    borderColor: "#0A192F",
  },
  filterChipText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  emptyFilterText: {
    fontSize: 13,
    color: "#94A3B8",
    paddingHorizontal: 24,
    paddingVertical: 14,
  },

  // Tactile Service Card (Horizontal)
  tactileCard: {
    width: 172,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...CARD_SHADOW,
  },
  tactileMediaBox: {
    width: 172,
    height: 108,
    position: "relative",
  },
  tactileGlyphWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tactileTelemetryPill: {
    position: "absolute",
    bottom: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  telemetryDotSmall: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  tactileTelemetryText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: 0.2,
  },
  tactileRatingPill: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tactileRatingText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#0F172A",
  },
  tactileBody: {
    padding: 12,
  },
  tactileCatTag: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  tactileTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
    lineHeight: 18,
    marginTop: 3,
  },
  tactileCompany: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  tactileFooterRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  tactileFromText: {
    fontSize: 9,
    color: "#94A3B8",
    fontWeight: "600",
  },
  tactilePriceText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0A192F",
    letterSpacing: -0.3,
  },
  tactileArrowBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },

  // Recommended Row Card (Vertical Feed)
  recRowCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...CARD_SHADOW,
  },
  recThumbBox: {
    width: 76,
    height: 76,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
  },
  recMetaWrap: {
    flex: 1,
    paddingLeft: 12,
    justifyContent: "center",
  },
  recHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  recCatTag: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  recRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  recRatingValue: {
    fontSize: 11,
    fontWeight: "800",
    color: "#0F172A",
  },
  recTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 2,
  },
  recProvider: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },
  recBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },
  recPriceText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0A192F",
  },
  recBookPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  recBookText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0A192F",
  },

  // Elite Partners Rail
  elitePartnerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    width: 220,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...CARD_SHADOW,
  },
  eliteLogo: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
  },
  eliteName: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
    flex: 1,
  },
  eliteCity: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },
  eliteRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 4,
  },
  eliteRatingNum: {
    fontSize: 11,
    fontWeight: "800",
    color: "#0F172A",
  },
  eliteRatingCount: {
    fontSize: 10,
    color: "#94A3B8",
  },

  // Trust Strip Card
  trustStripCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...CARD_SHADOW,
  },
  trustCol: {
    flex: 1,
    alignItems: "center",
  },
  trustIconRound: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  trustItemTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
  },
  trustItemSub: {
    fontSize: 10,
    color: "#94A3B8",
    marginTop: 1,
    textAlign: "center",
  },
  trustDivider: {
    width: 1,
    height: 36,
    backgroundColor: "#F1F5F9",
  },
});
