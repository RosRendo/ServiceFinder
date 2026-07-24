/**
 * Customer Home Screen — Premium Redesign
 *
 * Design System Applied:
 * ─ 8pt Grid: every spacing value is 8 / 16 / 24 / 32 / 48
 * ─ Type Scale: 30px title → 16px body → 12px metadata (extreme contrast)
 * ─ 60-30-10 color: #F7F8FC bg / #FFFFFF cards / #1D4ED8 accent (sparingly)
 * ─ Proximity: 8px related, 24px card padding, 32px section gap
 * ─ Skeleton loaders instead of spinners
 * ─ Scale + opacity micro-interactions on press
 * ─ Premium shadows: large blur, tiny opacity
 * ─ Mathematically correct nested border radii
 */

import React, { useEffect, useCallback, useMemo, useRef } from "react";
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
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/store/authStore";
import { useCustomerHomeStore } from "@/store/customerHomeStore";
import NotificationBell from "@/components/NotificationBell";
import FadeIn from "@/components/FadeIn";
import ScaleButton from "@/components/ScaleButton";
import { Theme } from "@/constants/theme";

// ─────────────────────────────────────────────────────────────
// DESIGN TOKENS  (60-30-10 rule enforced)
// ─────────────────────────────────────────────────────────────
const T = Theme.colors;

// ─────────────────────────────────────────────────────────────
// ICON MAP
// ─────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, any> = {
  Sparkles: "cleaning-services", Wind: "ac-unit", Droplets: "water-drop",
  Zap: "bolt", TreeDeciduous: "park", Car: "directions-car", Home: "home",
  Building2: "business", Wrench: "build", PlusCircle: "add-circle-outline",
  Filter: "format-paint", Cable: "cable", Lightbulb: "lightbulb",
  Scissors: "content-cut", Flower2: "local-florist", Fuel: "local-gas-station",
};
const mapIcon = (icon: string): any => ICON_MAP[icon] || "home-repair-service";

// ─────────────────────────────────────────────────────────────
// SKELETON LOADER  (premium — no spinning circle)
// ─────────────────────────────────────────────────────────────
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
  }, []);

  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.75] });

  return (
    <Animated.View
      style={[{ width, height, borderRadius: radius, backgroundColor: "#D1D5DB", opacity }, style]}
    />
  );
}

// ─────────────────────────────────────────────────────────────
// PRESSABLE CARD  (scale micro-interaction)
// ─────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────
// SKELETON SCREENS for each section
// ─────────────────────────────────────────────────────────────
function CategorySkeleton() {
  return (
    <View style={{ flexDirection: "row", paddingHorizontal: 24, gap: 16 }}>
      {[...Array(5)].map((_, i) => (
        <View key={i} style={{ alignItems: "center", gap: 8 }}>
          <Skeleton width={60} height={60} radius={18} />
          <Skeleton width={40} height={10} radius={5} />
        </View>
      ))}
    </View>
  );
}

function ServiceCardSkeleton() {
  return (
    <View style={{ flexDirection: "row", paddingHorizontal: 24, gap: 12 }}>
      {[...Array(3)].map((_, i) => (
        <View key={i} style={{ width: 152, gap: 8 }}>
          <Skeleton width={152} height={130} radius={16} />
          <Skeleton width={100} height={12} radius={6} />
          <Skeleton width={70} height={10} radius={5} />
        </View>
      ))}
    </View>
  );
}

function CompanyRowSkeleton() {
  return (
    <View style={{ paddingHorizontal: 24, gap: 12 }}>
      {[...Array(3)].map((_, i) => (
        <View key={i} style={[s.providerCard, { gap: 12 }]}>
          <Skeleton width={64} height={64} radius={16} />
          <View style={{ gap: 8, flex: 1 }}>
            <Skeleton width="60%" height={14} radius={7} />
            <Skeleton width="40%" height={11} radius={5} />
            <Skeleton width="30%" height={10} radius={5} />
          </View>
        </View>
      ))}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────
export default function Home() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { categories, trendingServices, featuredCompanies, recommendedServices, isLoading, isLoadingMore, hasMore, error, fetchHomeData, loadMoreServices } =
    useCustomerHomeStore();

  useEffect(() => { fetchHomeData(); }, []);
  const onRefresh = useCallback(() => { fetchHomeData(); }, []);

  const firstName = user?.name?.split(" ")[0] || "there";
  // Dynamic location: prefer user profile city, fallback to generic
  const locationLabel = (user as any)?.city
    ? `${(user as any).city}${(user as any).state ? ", " + (user as any).state : ""}`
    : "Nearby Services";

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return t('home.goodMorning');
    if (h < 18) return t('home.goodAfternoon');
    return t('home.goodEvening');
  }, [t]);

  return (
    <SafeAreaView style={s.root}>
      {/* ─── HEADER ──────────────────────────────────────────── */}
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          {/* Greeting — whispered metadata size */}
          <Text style={s.greetingText}>{greeting},</Text>
          {/* Name — massive, commanding, title level */}
          <Text style={s.nameText} numberOfLines={1}>{firstName} 👋</Text>
          {/* Location — body level with icon */}
          <View style={s.locationRow}>
            <MaterialIcons name="location-on" size={13} color={T.accentMid} />
            <Text style={s.locationText}>{locationLabel}</Text>
          </View>
        </View>

        <View style={s.headerActions}>
          <PressCard onPress={() => router.push("/(customer)/(tabs)/messages" as any)}>
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
        contentContainerStyle={{ paddingBottom: 64 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} colors={[T.accent]} tintColor={T.accent} />
        }
        onEndReached={() => {
          if (hasMore && !isLoadingMore) {
            loadMoreServices();
          }
        }}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={
          <>
        {/* ─── ERROR STATE ─────────────────────────────────────── */}
        {error ? (
          <View style={s.errorBanner}>
            <MaterialIcons name="wifi-off" size={18} color={T.error} />
            <Text style={s.errorText}>{t('home.errorLoadData')}</Text>
          </View>
        ) : null}

        {/* ─── SEARCH BAR ──────────────────────────────────────── */}
        {/* 24px from header, 24px horizontal padding */}
        <View style={{ paddingHorizontal: 24, marginTop: 24 }}>
          <PressCard onPress={() => router.push("/search" as any)}>
            <View style={s.searchBar}>
              <View style={s.searchIconWrap}>
                <MaterialIcons name="search" size={20} color={T.accent} />
              </View>
              <Text style={s.searchPlaceholder}>{t('home.searchPlaceholder')}</Text>
              <View style={s.filterBtn}>
                <MaterialIcons name="tune" size={16} color={T.accent} />
              </View>
            </View>
          </PressCard>
        </View>

        {/* ─── PROMO HERO BANNER ───────────────────────────────── */}
        {/* 24px below search bar, full bleed to 24px edges */}
        <View style={{ paddingHorizontal: 24, marginTop: 24 }}>
          <PressCard onPress={() => {}}>
            <View style={s.heroBanner}>
              {/* Decorative circles — depth, not distraction */}
              <View style={s.heroCircle1} />
              <View style={s.heroCircle2} />
              <View style={{ zIndex: 2 }}>
                <View style={s.heroBadge}>
                  <Text style={s.heroBadgeText}>{t('home.limitedOffer')}</Text>
                </View>
                {/* 30px — commanding hero headline */}
                <Text style={s.heroHeadline}>{t('home.heroHeadline')}</Text>
                {/* 14px — secondary info */}
                <Text style={s.heroSubtitle}>
                  {t('home.heroSubtitle')}<Text style={s.heroCode}>{t('home.heroCode', 'FIRST30')}</Text>{t('home.heroAtCheckout')}
                </Text>
              </View>
              <ScaleButton onPress={() => {}}>
                <View style={s.heroCtaBtn}>
                  <Text style={s.heroCtaText}>{t('home.bookNow')}</Text>
                  <MaterialIcons name="arrow-forward" size={14} color={T.accent} />
                </View>
              </ScaleButton>
            </View>
          </PressCard>
        </View>

        {/* ─── CATEGORIES ──────────────────────────────────────── */}
        {/* 32px gap between sections — clear visual separation */}
        <View style={{ marginTop: 32 }}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>{t('home.browseCategories')}</Text>
            <TouchableOpacity onPress={() => router.push("/(customer)/(tabs)/explore" as any)}>
              <Text style={s.seeAll}>{t('home.seeAll')}</Text>
            </TouchableOpacity>
          </View>

          {isLoading && categories.length === 0 ? (
            <View style={{ marginTop: 16 }}><CategorySkeleton /></View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, gap: 16, paddingBottom: 4 }}
            >
              {categories.map((cat, i) => (
                <FadeIn key={cat.id} delay={i * 100}>
                  <PressCard
                    onPress={() => router.push({ pathname: "/(customer)/category/[id]", params: { id: cat.slug } })}
                  >
                    <View style={s.catItem}>
                      {/* Outer radius 18px, inner image clips to 18px too */}
                      <View style={s.catIconBox}>
                        {cat.imageUrl ? (
                          <Image source={{ uri: cat.imageUrl }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
                        ) : (
                          <MaterialIcons name={mapIcon(cat.icon)} size={26} color={T.accent} style={{ zIndex: 1 }} />
                        )}
                      </View>
                      {/* 8px gap between icon and label — tight relationship */}
                      <Text style={s.catLabel} numberOfLines={1}>{cat.name.split(" ")[0]}</Text>
                    </View>
                  </PressCard>
                </FadeIn>
              ))}
            </ScrollView>
          )}
        </View>

        {/* ─── TRENDING SERVICES ───────────────────────────────── */}
        <View style={{ marginTop: 32 }}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>{t('home.trendingServices')}</Text>
            <TouchableOpacity onPress={() => router.push("/(customer)/(tabs)/explore" as any)}>
              <Text style={s.seeAll}>{t('home.seeAll')}</Text>
            </TouchableOpacity>
          </View>

          {isLoading && trendingServices.length === 0 ? (
            <View style={{ marginTop: 16 }}><ServiceCardSkeleton /></View>
          ) : trendingServices.length === 0 ? (
            <View style={s.emptyState}>
              <Text style={s.emptyIcon}>🔍</Text>
              <Text style={s.emptyTitle}>{t('home.noServicesYet')}</Text>
              <Text style={s.emptyBody}>{t('home.checkBackSoonServices')}</Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, gap: 12, paddingBottom: 4 }}
            >
              {trendingServices.map((service, i) => (
                <FadeIn key={service.id} delay={i * 100}>
                  <PressCard
                    onPress={() => router.push(`/(customer)/company/service-modal/${service.id}` as any)}
                  >
                    <View style={s.serviceCard}>
                      {/* Image area — 16px outer, 0px inner (flush) */}
                      <View style={s.serviceImgBox}>
                        {service.image || service.serviceType?.imageUrl || service.serviceType?.category?.imageUrl || service.company?.logoUrl ? (
                          <Image source={{ uri: service.image || service.serviceType?.imageUrl || service.serviceType?.category?.imageUrl || service.company?.logoUrl }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
                        ) : (
                          <View style={[StyleSheet.absoluteFillObject, { alignItems: "center", justifyContent: "center", backgroundColor: T.accentLight }]}>
                            <MaterialIcons name={mapIcon("")} size={36} color={T.accentMid} />
                          </View>
                        )}
                        {/* Price badge — accent color, bottom right, small */}
                        <View style={s.priceBadge}>
                          <Text style={s.priceBadgeText}>${service.basePrice}</Text>
                        </View>
                      </View>
                      {/* Card body — 12px horizontal, 10px vertical padding */}
                      <View style={s.serviceCardBody}>
                        {/* 14px title — clear, not huge */}
                        <Text style={s.serviceCardTitle} numberOfLines={2}>{service.name}</Text>
                        {/* 8px gap — tight relationship to title */}
                        <Text style={s.serviceCardProvider} numberOfLines={1}>
                          {service.company?.name || t('home.verifiedPro')}
                        </Text>
                      </View>
                    </View>
                  </PressCard>
                </FadeIn>
              ))}
            </ScrollView>
          )}
        </View>

        {/* ─── TOP PROVIDERS ───────────────────────────────────── */}
        <View style={{ marginTop: 32 }}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>{t('home.topProviders')}</Text>
            <TouchableOpacity onPress={() => router.push("/(customer)/map-view" as any)}>
              <Text style={s.seeAll}>{t('home.mapView')}</Text>
            </TouchableOpacity>
          </View>

          <View style={{ paddingHorizontal: 24, marginTop: 16, gap: 12 }}>
            {isLoading && featuredCompanies.length === 0 ? (
              <CompanyRowSkeleton />
            ) : featuredCompanies.length === 0 ? (
              <View style={s.emptyState}>
                <Text style={s.emptyIcon}>🏢</Text>
                <Text style={s.emptyTitle}>{t('home.noProvidersYet')}</Text>
                <Text style={s.emptyBody}>{t('home.checkBackSoonProviders')}</Text>
              </View>
            ) : (
              featuredCompanies.slice(0, 4).map((company, i) => (
                <FadeIn key={company.id} delay={i * 100}>
                  <PressCard
                    onPress={() => router.push(`/company/${company.id}` as any)}
                  >
                    <View style={[s.providerCard, { padding: 12, borderRadius: 16 }]}>
                      {/* Logo — 80px to match Recommended */}
                      <Image
                        source={{ uri: company.logoUrl || `https://api.dicebear.com/9.x/initials/svg?seed=${company.name}` }}
                        style={[s.providerLogo, { width: 80, height: 80, borderRadius: 12 }]}
                      />
                      <View style={{ flex: 1, paddingLeft: 12, justifyContent: "center" }}>
                        <View style={s.providerNameRow}>
                          <Text style={[s.providerName, { fontSize: 15 }]} numberOfLines={1}>{company.name}</Text>
                          <MaterialIcons name="verified" size={15} color={T.accentMid} />
                        </View>
                        <Text style={s.providerCity} numberOfLines={1}>{company.city}</Text>
                        <View style={[s.ratingRow, { marginTop: 8 }]}>
                          <MaterialIcons name="star" size={13} color={T.gold} />
                          <Text style={s.ratingValue}>
                            {company.ratingSummary?.averageRating ?? t('home.newRating')}
                          </Text>
                          {company.ratingSummary?.totalReviews ? (
                            <Text style={s.ratingCount}>({company.ratingSummary.totalReviews})</Text>
                          ) : null}
                        </View>
                      </View>
                      <MaterialIcons name="chevron-right" size={20} color={T.text3} />
                    </View>
                  </PressCard>
                </FadeIn>
              ))
            )}
          </View>
        </View>


        {/* ─── RECOMMENDED SERVICES ────────────────────────────── */}
        {recommendedServices.length > 0 && (
          <View style={{ marginTop: 40, paddingHorizontal: 24, paddingBottom: 16 }}>
            <Text style={s.sectionTitle}>{t('home.recommendedForYou')}</Text>
          </View>
        )}
        </>
      }
      renderItem={({ item: service, index: i }) => (
        <View style={{ paddingHorizontal: 24, paddingBottom: 12 }}>
          <FadeIn delay={i < 5 ? i * 100 : 0}>
            <PressCard
              onPress={() => router.push(`/(customer)/company/service-modal/${service.id}` as any)}
            >
              <View style={[s.providerCard, { padding: 12, borderRadius: 16 }]}>
                <Image
                  source={{ uri: service.image || service.serviceType?.imageUrl || service.serviceType?.category?.imageUrl || service.company?.logoUrl || `https://api.dicebear.com/9.x/shapes/svg?seed=${service.id}` }}
                  style={{ width: 80, height: 80, borderRadius: 12, backgroundColor: T.accentLight }}
                  contentFit="cover"
                />
                <View style={{ flex: 1, paddingLeft: 12, justifyContent: "center" }}>
                  <Text style={[s.providerName, { fontSize: 15 }]} numberOfLines={1}>{service.name}</Text>
                  <Text style={s.providerCity} numberOfLines={1}>{service.company?.name || t('home.verifiedPro')}</Text>
                  <View style={[s.ratingRow, { marginTop: 8 }]}>
                    <Text style={[s.priceBadgeText, { color: T.accent, fontSize: 14 }]}>${service.basePrice}</Text>
                    <Text style={{ marginHorizontal: 6, color: T.text3 }}>•</Text>
                    <MaterialIcons name="schedule" size={12} color={T.text2} />
                    <Text style={s.providerCity}>{service.serviceType?.durationMin || 60} {t('home.min')}</Text>
                  </View>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={T.text3} />
              </View>
            </PressCard>
          </FadeIn>
        </View>
      )}
      ListFooterComponent={
        <View style={{ paddingBottom: 40 }}>
          {isLoadingMore && (
            <View style={{ paddingVertical: 20 }}>
              <ActivityIndicator color={T.accent} />
            </View>
          )}

          {/* ─── MOVED FROM HEADER: TRUST STRIP ─────────────────────────────────────── */}
          <View style={{ paddingHorizontal: 24, marginTop: 40 }}>
            <View style={s.trustStrip}>
              {[
                { icon: "verified-user", label: t('home.verifiedPros') },
                { icon: "lock", label: t('home.securePayments') },
                { icon: "support-agent", label: t('home.support247') },
              ].map((item) => (
                <View key={item.label} style={s.trustItem}>
                  <View style={s.trustIconBox}>
                    <MaterialIcons name={item.icon as any} size={18} color={T.accent} />
                  </View>
                  <Text style={s.trustLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      }
    />
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────
// STYLES  (8pt grid enforced throughout)
// ─────────────────────────────────────────────────────────────
const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  android: { elevation: 2 },
});

const HERO_SHADOW = Platform.select({
  ios: { shadowColor: '#0A192F', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 16 },
  android: { elevation: 8 },
});
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },

  // Header
  header: {
    flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between",
    paddingHorizontal: 24, paddingTop: 8, paddingBottom: 0,
  },
  greetingText: { fontSize: 13, color: T.text2, fontWeight: "500", letterSpacing: 0.2 },
  nameText: { fontSize: 28, color: T.text1, fontWeight: "700", letterSpacing: -0.8, marginTop: 2 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  locationText: { fontSize: 14, color: T.text2, fontWeight: "500" },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 4 },
  headerIconBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: T.surface,
    alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: T.border,
  },
  avatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: T.border },

  // Error
  errorBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginHorizontal: 24, marginTop: 16, padding: 14,
    backgroundColor: "#FEF2F2", borderRadius: 12, borderWidth: 1, borderColor: "#FECACA",
  },
  errorText: { fontSize: 13, color: T.error, fontWeight: "500", flex: 1 },

  // Search
  searchBar: {
    flexDirection: "row", alignItems: "center", height: 56,
    backgroundColor: "#F7F7F7", borderRadius: 100, // Pill shape
    paddingHorizontal: 12, gap: 12,
  },
  searchIconWrap: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: "#FFFFFF",
    alignItems: "center", justifyContent: "center"},
  searchPlaceholder: { flex: 1, fontSize: 16, color: T.text2, fontWeight: "500" },
  filterBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: "#FFFFFF",
    alignItems: "center", justifyContent: "center"},

  // Hero Banner
  heroBanner: {
    borderRadius: 20, backgroundColor: T.accent, padding: 24,
    overflow: "hidden", minHeight: 140,
    flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between",
    ...HERO_SHADOW,
  },
  heroCircle1: {
    position: "absolute", width: 200, height: 200, borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.06)", right: -60, top: -60,
  },
  heroCircle2: {
    position: "absolute", width: 120, height: 120, borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.06)", right: 60, bottom: -50,
  },
  heroBadge: {
    alignSelf: "flex-start", borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.18)", paddingHorizontal: 10, paddingVertical: 4,
  },
  heroBadgeText: { fontSize: 10, color: "#fff", fontWeight: "800", letterSpacing: 1.4 },
  // 30px — commanding, extreme contrast vs 10px badge above
  heroHeadline: { fontSize: 28, color: "#fff", fontWeight: "900", letterSpacing: -0.8, lineHeight: 32, marginTop: 8 },
  heroSubtitle: { fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 6, fontWeight: "400" },
  heroCode: { color: T.gold, fontWeight: "700" },
  heroCtaBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    alignSelf: "flex-end", zIndex: 2,
  },
  heroCtaText: { fontSize: 13, color: T.accent, fontWeight: "700" },

  // Section header
  sectionHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 24,
  },
  // 20px — secondary hierarchy, not as big as hero, clearly a label
  sectionTitle: { fontSize: 18, color: T.text1, fontWeight: "800", letterSpacing: -0.4 },
  seeAll: { fontSize: 13, color: T.accent, fontWeight: "600" },

  // Categories
  catItem: { alignItems: "center", gap: 8 },
  catIconBox: {
    width: 60, height: 60, borderRadius: 18, backgroundColor: T.accentLight,
    alignItems: "center", justifyContent: "center", overflow: "hidden",
    borderWidth: 1, borderColor: T.border,
  },
  catLabel: { fontSize: 11, color: T.text2, fontWeight: "600", maxWidth: 60, textAlign: "center" },

  serviceCard: {
    width: 152, backgroundColor: T.surface, borderRadius: 16,
    overflow: "hidden", borderWidth: 1, borderColor: T.border,
    ...CARD_SHADOW,
  },
  serviceImgBox: { width: 152, height: 130, backgroundColor: T.accentLight },
  priceBadge: {
    position: "absolute", bottom: 8, right: 8,
    backgroundColor: T.accent, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
  },
  priceBadgeText: { fontSize: 11, color: "#fff", fontWeight: "800" },
  serviceCardBody: { padding: 12 },
  // 14px — clear reading size with good line-height for small cards
  serviceCardTitle: { fontSize: 13, color: T.text1, fontWeight: "700", lineHeight: 18 },
  serviceCardProvider: { fontSize: 11, color: T.text3, marginTop: 4, fontWeight: "500" },

  providerCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: T.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: T.border,
    ...CARD_SHADOW,
  },
  providerLogo: { width: 56, height: 56, borderRadius: 14, backgroundColor: T.accentLight },
  providerNameRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  providerName: { fontSize: 14, color: T.text1, fontWeight: "700", flex: 1 },
  // 12px city — clear secondary, readable
  providerCity: { fontSize: 12, color: T.text3, marginTop: 3, fontWeight: "400" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  ratingValue: { fontSize: 12, color: T.text1, fontWeight: "700" },
  ratingCount: { fontSize: 11, color: T.text3 },

  // Empty states — beautiful, not just blank
  emptyState: { alignItems: "center", paddingVertical: 32, paddingHorizontal: 24 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 16, color: T.text1, fontWeight: "700" },
  emptyBody: { fontSize: 13, color: T.text3, textAlign: "center", marginTop: 6, lineHeight: 20 },

  trustStrip: {
    flexDirection: "row", justifyContent: "space-around",
    backgroundColor: T.surface, borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: T.border,
    ...CARD_SHADOW,
  },
  trustItem: { alignItems: "center", gap: 8 },
  trustIconBox: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: T.accentLight,
    alignItems: "center", justifyContent: "center",
  },
  trustLabel: { fontSize: 11, color: T.text2, fontWeight: "600", textAlign: "center" },

  // Stats row
  statsRow: {
    flexDirection: "row", backgroundColor: T.surface, borderRadius: 16,
    paddingVertical: 24, paddingHorizontal: 16,
    borderWidth: 1, borderColor: T.border, alignItems: "center"
  },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 24, color: T.text1, fontWeight: "800", letterSpacing: -0.5 },
  statLabel: { fontSize: 11, color: T.text2, fontWeight: "600", marginTop: 4, textAlign: "center" },
  statDivider: { width: 1, height: 32, backgroundColor: T.border },
});
