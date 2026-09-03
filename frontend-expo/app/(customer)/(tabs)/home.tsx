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
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/store/authStore";
import { useCustomerHomeStore, ServiceType } from "@/store/customerHomeStore";
import NotificationBell from "@/components/NotificationBell";
import FadeIn from "@/components/FadeIn";
import ScaleButton from "@/components/ScaleButton";
import { Theme } from "@/constants/theme";
import * as Location from "expo-location";

const { width } = Dimensions.get("window");

const T = Theme.colors;

const ICON_MAP: Record<string, any> = {
  Sparkles: "cleaning-services", Wind: "ac-unit", Droplets: "water-drop",
  Zap: "bolt", TreeDeciduous: "park", Car: "directions-car", Home: "home",
  Building2: "business", Wrench: "build", PlusCircle: "add-circle-outline",
  Filter: "format-paint", Cable: "cable", Lightbulb: "lightbulb",
  Scissors: "content-cut", Flower2: "local-florist", Fuel: "local-gas-station",
};
const mapIcon = (icon: string): any => ICON_MAP[icon] || "home-repair-service";

const getCategoryIcon = (text: string): any => {
  if (!text) return 'tools';
  const t = text.toLowerCase();
  if (t.includes('clean') || t.includes('maid') || t.includes('spark')) return 'broom';
  if (t.includes('plumb') || t.includes('pipe') || t.includes('water')) return 'pipe-wrench';
  if (t.includes('electric') || t.includes('wire') || t.includes('volt') || t.includes('zap')) return 'lightning-bolt';
  if (t.includes('ac') || t.includes('air') || t.includes('cool') || t.includes('wind')) return 'air-conditioner';
  if (t.includes('paint') || t.includes('color') || t.includes('brush')) return 'brush';
  if (t.includes('move') || t.includes('pack') || t.includes('truck')) return 'truck-delivery';
  if (t.includes('garden') || t.includes('lawn') || t.includes('yard') || t.includes('tree') || t.includes('landscap')) return 'tree';
  if (t.includes('pest') || t.includes('bug')) return 'bug';
  if (t.includes('build') || t.includes('construct') || t.includes('repair') || t.includes('wrench')) return 'hammer-wrench';
  return 'tools';
};

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
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        await fetchHomeData(loc.coords.latitude, loc.coords.longitude);
      } else {
        await fetchHomeData();
      }
    } catch (e) {
      console.warn("Failed to get location: ", e);
      await fetchHomeData();
    }
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

  const [selectedPopularCategory, setSelectedPopularCategory] = React.useState("All");

  const popularFilterChips = useMemo(() => {
    const base = ["All"];
    categories.slice(0, 4).forEach(c => base.push(c.name));
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
    if (h < 12) return t('home.goodMorning');
    if (h < 18) return t('home.goodAfternoon');
    return t('home.goodEvening');
  }, [t]);

  const carouselItems = useMemo(() => {
    // 1. If we have actual sponsored companies from the API, use them!
    if (sponsoredCompanies && sponsoredCompanies.length > 0) {
      return sponsoredCompanies.map((co) => ({
        id: co.id,
        title: co.name,
        subtitle: co.description || "Top-rated verified provider",
        image: co.coverImageUrl || co.logoUrl || "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=2070&auto=format&fit=crop",
        badge: "SPONSORED",
        route: `/(customer)/company/${co.id}`,
      }));
    }

    // 2. Fallback to top rated companies if no campaigns are active
    if (topCompanies && topCompanies.length > 0) {
      return topCompanies.slice(0, 3).map((co) => ({
        id: co.id,
        title: co.name,
        subtitle: co.description || "Top-rated verified provider",
        image: co.coverImageUrl || co.logoUrl || "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=2070&auto=format&fit=crop",
        badge: "FEATURED",
        route: `/(customer)/company/${co.id}`,
      }));
    }

    // 3. Fallback to mock data if DB is completely empty (for dev sandbox)
    return [
      {
        id: "mock-1",
        title: "Sparkle Cleaning Co.",
        subtitle: "Top-rated house cleaning in your area.",
        image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=2070&auto=format&fit=crop",
        badge: "SPONSORED",
        route: "/(customer)/(tabs)/explore",
      },
      {
        id: "mock-2",
        title: "Elite Plumbing Solutions",
        subtitle: "24/7 Emergency repairs. Call now.",
        image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?q=80&w=2069&auto=format&fit=crop",
        badge: "SPONSORED",
        route: "/(customer)/(tabs)/explore",
      },
      {
        id: "mock-3",
        title: "Urban Handyman",
        subtitle: "TV Mounting & Furniture Assembly.",
        image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=2070&auto=format&fit=crop",
        badge: "SPONSORED",
        route: "/(customer)/(tabs)/explore",
      },
    ];
  }, [sponsoredCompanies, topCompanies]);

  const carouselRef = useRef<ScrollView>(null);
  const [carouselIndex, React_setCarouselIndex] = React.useState(0);

  useEffect(() => {
    if (activeBooking || carouselItems.length === 0) return;
    const interval = setInterval(() => {
      React_setCarouselIndex((prev) => {
        const next = (prev + 1) % carouselItems.length;
        carouselRef.current?.scrollTo({ x: next * (width - 48 + 16), animated: true });
        return next;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [activeBooking, carouselItems]);

  return (
    <SafeAreaView style={s.root}>
      {/* ─── HEADER ──────────────────────────────────────────── */}
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.greetingText}>{greeting},</Text>
          <Text style={s.nameText} numberOfLines={1}>{firstName} 👋</Text>
          <View style={s.locationRow}>
            <MaterialIcons name="location-on" size={13} color={T.accentMid} />
            <Text style={s.locationText}>{locationLabel}</Text>
          </View>
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
        contentContainerStyle={{ paddingBottom: 64 }}
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
                <Text style={s.errorText}>{t('home.errorLoadData')}</Text>
              </View>
            ) : null}

            {/* ─── SEARCH BAR ──────────────────────────────────────── */}
            <View style={{ paddingHorizontal: 24, marginTop: 24 }}>
              <PressCard onPress={() => router.push("/(customer)/search" as any)}>
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

            {/* ─── INSTANT REQUEST & EXPLORE PATHS ─────────────────── */}
            <View style={{ paddingHorizontal: 24, marginTop: 20 }}>
              <View style={{ flexDirection: "row", gap: 12 }}>
                {/* Instant Request Option */}
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: T.accentLight,
                    borderRadius: 20,
                    padding: 18,
                    borderWidth: 1,
                    borderColor: T.accent + "15",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.04,
                    shadowRadius: 10,
                    elevation: 2,
                    position: "relative",
                    overflow: "hidden"
                  }}
                  onPress={() => router.push("/(customer)/map-view?mode=instant" as any)}
                >
                  <View style={{
                    position: "absolute",
                    top: -10,
                    right: -10,
                    backgroundColor: T.warning + "15",
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    <MaterialCommunityIcons name="flash" size={32} color={T.warning} style={{ opacity: 0.3, transform: [{ rotate: "15deg" }] }} />
                  </View>

                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <Text style={{ fontSize: 10, fontWeight: "900", color: T.warning, letterSpacing: 1, backgroundColor: "#FFF", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: T.warning + "20" }}>
                      POPULAR
                    </Text>
                  </View>
                  <Text style={{ fontSize: 18, fontWeight: "800", color: T.accent, fontFamily: "System" }}>Need Help Now?</Text>
                  <Text style={{ fontSize: 12, color: T.text2, marginTop: 4, lineHeight: 16 }}>Find nearby available service pros instantly.</Text>
                </TouchableOpacity>

                {/* Explore Services Option */}
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: "#FFF",
                    borderRadius: 20,
                    padding: 18,
                    borderWidth: 1,
                    borderColor: T.border,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.04,
                    shadowRadius: 10,
                    elevation: 2
                  }}
                  onPress={() => router.push("/(customer)/(tabs)/explore" as any)}
                >
                  <View style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    backgroundColor: T.accent + "10",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 10
                  }}>
                    <MaterialCommunityIcons name="map-search-outline" size={18} color={T.accent} />
                  </View>
                  <Text style={{ fontSize: 18, fontWeight: "800", color: T.text1 }}>Explore Catalog</Text>
                  <Text style={{ fontSize: 12, color: T.text2, marginTop: 4, lineHeight: 16 }}>Browse categories, services, & top companies.</Text>
                </TouchableOpacity>
              </View>
            </View>


            {/* ─── ACTIVE BOOKING DOMINANCE (ANXIETY MODE) ──────────── */}
            {activeBooking && (
              <View style={{ paddingHorizontal: 24, marginTop: 24 }}>
                <FadeIn delay={100}>
                  <PressCard onPress={() => router.push(`/(customer)/booking/${activeBooking.id}` as any)}>
                    <View style={s.activeBookingCard}>
                      <View style={s.activeBookingHeader}>
                        <View style={s.activePulse} />
                        <Text style={s.activeStatusText}>
                          {activeBooking.status === 'in_progress' ? 'YOUR STAFF IS ARRIVING' : 'BOOKING IN PROGRESS'}
                        </Text>
                      </View>
                      <Text style={s.activeTimeText}>
                        {activeBooking.status === 'in_progress' ? '15 MINS' : 'LIVE'}
                      </Text>
                      <Text style={s.activeServiceText}>{activeBooking.service?.name || "Service Active"}</Text>

                      <ScaleButton onPress={() => router.push(`/(customer)/booking/${activeBooking.id}` as any)}>
                        <View style={s.trackBtn}>
                          <Text style={s.trackBtnText}>TRACK NOW</Text>
                          <MaterialIcons name="chevron-right" size={20} color="#FFF" />
                        </View>
                      </ScaleButton>
                    </View>
                  </PressCard>
                </FadeIn>
              </View>
            )}

            {/* ─── CATEGORIES ──────────────────────────────────────── */}
            <View style={{ marginTop: 24 }}>
              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>{t('home.browseCategories')}</Text>
                <TouchableOpacity onPress={() => router.push("/(customer)/(tabs)/explore" as any)}>
                  <Text style={s.seeAll}>{t('home.seeAll')}</Text>
                </TouchableOpacity>
              </View>

              {isLoading && categories.length === 0 ? (
                <View style={{ marginTop: 16 }}><CategorySkeleton /></View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, gap: 16, paddingBottom: 4 }}>
                  {categories.map((cat, i) => (
                    <FadeIn key={cat.id} delay={i * 100}>
                      <PressCard onPress={() => router.push({ pathname: "/(customer)/category/[id]", params: { id: cat.slug } })}>
                        <View style={s.catItem}>
                          <View style={s.catIconBox}>
                            {cat.useImageAsBadge && cat.imageUrl ? (
                              <Image source={{ uri: cat.imageUrl }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
                            ) : (
                              <MaterialCommunityIcons name={(cat.icon as any) || getCategoryIcon(cat.name)} size={26} color={T.accent} style={{ zIndex: 1 }} />
                            )}
                          </View>
                          <Text style={s.catLabel} numberOfLines={1}>{cat.name.split(" ")[0]}</Text>
                        </View>
                      </PressCard>
                    </FadeIn>
                  ))}
                </ScrollView>
              )}
            </View>

            {/* ─── PROMO HERO BANNER CAROUSEL (Sponsors, now in middle) ────── */}
            {!activeBooking && carouselItems.length > 0 && (
              <View style={{ marginTop: 32 }}>
                <ScrollView
                  ref={carouselRef}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}
                  snapToInterval={width - 48 + 16}
                  decelerationRate="fast"
                  snapToAlignment="start"
                  onMomentumScrollEnd={(e) => {
                    const newIndex = Math.round(e.nativeEvent.contentOffset.x / (width - 48 + 16));
                    React_setCarouselIndex(newIndex);
                  }}
                >
                  {carouselItems.map((item) => (
                    <PressCard 
                      key={item.id.toString()} 
                      onPress={() => router.push(item.route as any)} 
                      style={{ width: width - 48, height: 160, borderRadius: 16, overflow: 'hidden' }}
                    >
                      <Image
                        source={{ uri: item.image }}
                        style={StyleSheet.absoluteFillObject}
                        contentFit="cover"
                      />
                      <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' }} />
                      <View style={{ position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                        <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 1 }}>{item.badge}</Text>
                      </View>
                      <View style={{ position: 'absolute', bottom: 16, left: 16, right: 16 }}>
                        <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800' }} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '500', marginTop: 4 }} numberOfLines={1}>
                          {item.subtitle}
                        </Text>
                      </View>
                    </PressCard>
                  ))}
                </ScrollView>
              </View>
            )}
            {/* ─── POPULAR NEAR YOU ──────────────────────────────────── */}
            <View style={{ marginTop: 32 }}>
              <View style={s.sectionHeader}>
                <View>
                  <Text style={s.sectionTitle}>Popular Near You</Text>
                  <Text style={{ fontSize: 12, color: T.text3, marginTop: 4 }}>
                    Services customers around {locationLabel} are booking
                  </Text>
                </View>
              </View>

              {/* Category Filters */}
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
                      style={[
                        {
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          borderRadius: 100,
                          backgroundColor: "#F3F4F6",
                          borderWidth: 1,
                          borderColor: "#E5E7EB",
                        },
                        active && {
                          backgroundColor: T.text1,
                          borderColor: T.text1,
                        },
                      ]}
                    >
                      <Text style={{ fontSize: 13, color: active ? "#FFF" : T.text2, fontWeight: "600" }}>
                        {chip}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {isLoading && trendingServices.length === 0 ? (
                <View style={{ marginTop: 16 }}><ServiceCardSkeleton /></View>
              ) : filteredPopularServices.length === 0 ? (
                <Text style={{ fontSize: 14, color: T.text3, paddingHorizontal: 24, paddingVertical: 12 }}>
                  No services found in this category.
                </Text>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 8, gap: 12, paddingBottom: 4 }}
                >
                  {filteredPopularServices.map((st, i) => (
                    <FadeIn key={st.id} delay={i * 100}>
                      <PressCard onPress={() => router.push(`/(customer)/service/${st.id}` as any)}>
                        <View style={s.serviceCard}>
                          <View style={s.serviceImgBox}>
                            {st.image ? (
                              <Image source={{ uri: st.image }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
                            ) : (
                              <View style={[StyleSheet.absoluteFillObject, { alignItems: "center", justifyContent: "center", backgroundColor: T.accentLight }]}>
                                <MaterialCommunityIcons name={getCategoryIcon(st.serviceType?.name || st.name)} size={36} color={T.accentMid} />
                              </View>
                            )}
                            <View style={s.priceBadge}>
                              <Text style={s.priceBadgeText}>${st.basePrice}</Text>
                            </View>
                            <View style={s.catBadge}>
                              {st.serviceType?.category?.useImageAsBadge && st.serviceType?.category?.imageUrl ? (
                                <Image source={{ uri: st.serviceType.category.imageUrl }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
                              ) : (
                                <MaterialCommunityIcons name={(st.serviceType?.category?.icon as any) || getCategoryIcon(st.serviceType?.category?.name || st.serviceType?.name || st.name)} size={18} color="#fff" />
                              )}
                            </View>
                            {(st.company as any)?.ratingSummary && (
                              <View style={s.ratingBadge}>
                                <MaterialIcons name="star" size={10} color={T.gold} />
                                <Text style={s.ratingBadgeText}>
                                  {Number((st.company as any).ratingSummary.averageRating).toFixed(1)}
                                </Text>
                              </View>
                            )}
                          </View>
                          <View style={s.serviceCardBody}>
                            <Text style={s.serviceCardTitle} numberOfLines={2}>{st.name}</Text>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                              <Text style={[s.serviceCardProvider, { flex: 1, marginTop: 0 }]} numberOfLines={1}>
                                {st.company?.name || 'Verified Provider'}
                              </Text>
                              {(st as any).distanceKm !== undefined && (st as any).distanceKm !== null && (
                                <Text style={{ fontSize: 11, color: T.accent, fontWeight: '700', marginLeft: 4 }}>
                                  {(st as any).distanceKm} km
                                </Text>
                              )}
                            </View>
                          </View>
                        </View>
                      </PressCard>
                    </FadeIn>
                  ))}
                </ScrollView>
              )}
            </View>

            {/* ─── TRENDING SERVICE TYPES ───────────────────────────── */}
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
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, gap: 12, paddingBottom: 4 }}>
                  {trendingServices.map((st, i) => (
                    <FadeIn key={st.id} delay={i * 100}>
                      <PressCard onPress={() => router.push(`/(customer)/service/${st.id}` as any)}>
                        <View style={s.serviceCard}>
                          <View style={s.serviceImgBox}>
                            {st.image ? (
                              <Image source={{ uri: st.image }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
                            ) : (
                              <View style={[StyleSheet.absoluteFillObject, { alignItems: "center", justifyContent: "center", backgroundColor: T.accentLight }]}>
                                <MaterialCommunityIcons name={getCategoryIcon(st.serviceType?.name || st.name)} size={36} color={T.accentMid} />
                              </View>
                            )}
                            <View style={s.priceBadge}>
                              <Text style={s.priceBadgeText}>${st.basePrice}</Text>
                            </View>
                            <View style={s.catBadge}>
                              {st.serviceType?.category?.useImageAsBadge && st.serviceType?.category?.imageUrl ? (
                                <Image source={{ uri: st.serviceType.category.imageUrl }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
                              ) : (
                                <MaterialCommunityIcons name={(st.serviceType?.category?.icon as any) || getCategoryIcon(st.serviceType?.category?.name || st.serviceType?.name || st.name)} size={18} color="#fff" />
                              )}
                            </View>
                            {(st.company as any)?.ratingSummary && (
                              <View style={s.ratingBadge}>
                                <MaterialIcons name="star" size={10} color={T.gold} />
                                <Text style={s.ratingBadgeText}>
                                  {Number((st.company as any).ratingSummary.averageRating).toFixed(1)}
                                </Text>
                              </View>
                            )}
                          </View>
                          <View style={s.serviceCardBody}>
                            <Text style={s.serviceCardTitle} numberOfLines={2}>{st.name}</Text>
                            <Text style={s.serviceCardProvider} numberOfLines={1}>{st.company?.name || 'Verified Provider'}</Text>
                          </View>
                        </View>
                      </PressCard>
                    </FadeIn>
                  ))}
                </ScrollView>
              )}
            </View>

            {/* ─── RECOMMENDED SERVICES ────────────────────────────── */}
            {recommendedServices.length > 0 && (
              <View style={{ marginTop: 40, paddingHorizontal: 24, paddingBottom: 16 }}>
                <Text style={s.sectionTitle}>{t('home.recommendedForYou')}</Text>
              </View>
            )}
          </>
        }
        renderItem={({ item, index }) => {
          const st = item as any; // Service
          return (
            <View style={{ paddingHorizontal: 24, paddingBottom: 12 }}>
              <FadeIn delay={index < 5 ? index * 100 : 0}>
                <PressCard onPress={() => router.push(`/(customer)/service/${st.id}` as any)}>
                  <View style={[s.providerCard, { padding: 12, borderRadius: 16 }]}>
                    <View style={{ width: 80, height: 80, position: 'relative' }}>
                      {st.image ? (
                        <Image
                          source={{ uri: st.image }}
                          style={{ width: 80, height: 80, borderRadius: 12, backgroundColor: T.accentLight }}
                          contentFit="cover"
                        />
                      ) : (
                        <View style={{ width: 80, height: 80, borderRadius: 12, backgroundColor: T.accentLight, alignItems: "center", justifyContent: "center" }}>
                          <MaterialCommunityIcons name={getCategoryIcon(st.serviceType?.name || st.name)} size={28} color={T.accentMid} />
                        </View>
                      )}
                      {st.company?.ratingSummary && (
                        <View style={s.ratingBadgeMini}>
                          <MaterialIcons name="star" size={9} color={T.gold} />
                          <Text style={s.ratingBadgeTextMini}>
                            {Number(st.company.ratingSummary.averageRating).toFixed(1)}
                          </Text>
                        </View>
                      )}
                      <View style={s.catBadgeMini}>
                        {st.serviceType?.category?.useImageAsBadge && st.serviceType?.category?.imageUrl ? (
                          <Image source={{ uri: st.serviceType.category.imageUrl }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
                        ) : (
                          <MaterialCommunityIcons name={(st.serviceType?.category?.icon as any) || getCategoryIcon(st.serviceType?.category?.name || st.serviceType?.name || st.name)} size={13} color="#fff" />
                        )}
                      </View>
                    </View>
                    <View style={{ flex: 1, paddingLeft: 12, justifyContent: "center" }}>
                      <Text style={[s.providerName, { fontSize: 15 }]} numberOfLines={1}>{st.name}</Text>
                      <Text style={s.providerCity} numberOfLines={1}>{st.company?.name || 'Verified Provider'}</Text>
                      <View style={[s.ratingRow, { marginTop: 8 }]}>
                        <Text style={{ fontSize: 14, fontWeight: '800', color: T.accent }}>${st.basePrice}</Text>
                      </View>
                    </View>
                    <MaterialIcons name="chevron-right" size={20} color={T.text3} />
                  </View>
                </PressCard>
              </FadeIn>
            </View>
          );
        }}
        ListFooterComponent={
          <View style={{ paddingBottom: 40 }}>
            {isLoadingMore && (
              <View style={{ paddingVertical: 20 }}>
                <ActivityIndicator color={T.accent} />
              </View>
            )}
            {topCompanies?.length > 0 && (
              <View style={{ marginTop: 24, paddingBottom: 24 }}>
                <View style={[s.sectionHeader, { marginBottom: 16 }]}>
                  <Text style={s.sectionTitle}>Elite Partners</Text>
                  <TouchableOpacity>
                    <Text style={s.seeAll}>View All</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}>
                  {topCompanies.map((company, i) => (
                    <FadeIn key={company.id} delay={i * 100}>
                      <PressCard onPress={() => router.push(`/(customer)/company/${company.id}` as any)}>
                        <View style={s.providerCard}>
                          <View style={{ position: 'relative' }}>
                            <Image
                              source={{ uri: company.logoUrl || `https://api.dicebear.com/9.x/initials/svg?seed=${company.name}` }}
                              style={s.providerLogo}
                              contentFit="cover"
                            />
                            {(() => {
                              const highlights = Array.isArray(company.cardHighlights) ? company.cardHighlights : (() => { try { return JSON.parse((company as any).cardHighlights || "[]"); } catch { return []; } })();
                              const primaryCat = highlights[0] || 'Services';
                              const matchedCat = categories.find(c => c.name.toLowerCase() === primaryCat.toLowerCase() || c.slug.toLowerCase() === primaryCat.toLowerCase());
                              return (
                                <View style={s.catBadgeMini}>
                                  {matchedCat?.useImageAsBadge && matchedCat?.imageUrl ? (
                                    <Image source={{ uri: matchedCat.imageUrl }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
                                  ) : (
                                    <MaterialCommunityIcons name={(matchedCat?.icon as any) || getCategoryIcon(primaryCat)} size={13} color="#fff" />
                                  )}
                                </View>
                              );
                            })()}
                          </View>
                          <View style={{ flex: 1 }}>
                            <View style={s.providerNameRow}>
                              <Text style={s.providerName} numberOfLines={1}>{company.name}</Text>
                              <MaterialIcons name="verified" size={14} color="#3B82F6" />
                            </View>
                            <Text style={s.providerCity} numberOfLines={1}>{company.city || 'Local Provider'}</Text>
                            <View style={[s.ratingRow, { marginTop: 6 }]}>
                              <MaterialIcons name="star" size={14} color="#F59E0B" />
                              <Text style={s.ratingValue}>{company.ratingSummary?.averageRating ? Number(company.ratingSummary.averageRating).toFixed(1) : "4.9"}</Text>
                              <Text style={s.ratingCount}>({company.ratingSummary?.totalReviews || '1.5k'} reviews)</Text>
                            </View>
                          </View>
                        </View>
                      </PressCard>
                    </FadeIn>
                  ))}
                </ScrollView>
              </View>
            )}

            <View style={{ paddingHorizontal: 24, marginTop: 16 }}>
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
  errorBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginHorizontal: 24, marginTop: 16, padding: 14,
    backgroundColor: "#FEF2F2", borderRadius: 12, borderWidth: 1, borderColor: "#FECACA",
  },
  errorText: { fontSize: 13, color: T.error, fontWeight: "500", flex: 1 },
  searchBar: {
    flexDirection: "row", alignItems: "center", height: 56,
    backgroundColor: "#F7F7F7", borderRadius: 100,
    paddingHorizontal: 12, gap: 12,
  },
  searchIconWrap: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: "#FFFFFF",
    alignItems: "center", justifyContent: "center"
  },
  searchPlaceholder: { flex: 1, fontSize: 16, color: T.text2, fontWeight: "500" },
  filterBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: "#FFFFFF",
    alignItems: "center", justifyContent: "center"
  },
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
  heroHeadline: { fontSize: 28, color: "#fff", fontWeight: "900", letterSpacing: -0.8, lineHeight: 32, marginTop: 8 },
  heroSubtitle: { fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 6, fontWeight: "400" },
  heroCode: { color: T.gold, fontWeight: "700" },
  heroCtaBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    alignSelf: "flex-end", zIndex: 2,
  },
  heroCtaText: { fontSize: 13, color: T.accent, fontWeight: "700" },
  activeBookingCard: {
    borderRadius: 20, backgroundColor: T.accent, padding: 24,
    ...HERO_SHADOW,
  },
  activeBookingHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  activePulse: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#10B981" },
  activeStatusText: { fontSize: 12, color: "rgba(255,255,255,0.8)", fontWeight: "700", letterSpacing: 1.2 },
  activeTimeText: { fontSize: 40, color: "#fff", fontWeight: "900", letterSpacing: -1.2, marginTop: 12 },
  activeServiceText: { fontSize: 16, color: "rgba(255,255,255,0.9)", fontWeight: "500", marginTop: 4 },
  trackBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 12, paddingHorizontal: 20, paddingVertical: 14,
    alignSelf: "flex-start", marginTop: 24,
  },
  trackBtnText: { fontSize: 14, color: "#fff", fontWeight: "800", letterSpacing: 1 },
  sectionHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 24,
  },
  sectionTitle: { fontSize: 18, color: T.text1, fontWeight: "800", letterSpacing: -0.4 },
  seeAll: { fontSize: 13, color: T.accent, fontWeight: "600" },
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
  providerCity: { fontSize: 12, color: T.text3, marginTop: 3, fontWeight: "400" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  ratingValue: { fontSize: 12, color: T.text1, fontWeight: "700" },
  ratingCount: { fontSize: 11, color: T.text3 },
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
  ratingBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.90)",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 2,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
      android: { elevation: 1 }
    })
  },
  ratingBadgeText: { fontSize: 10, fontWeight: "800", color: "#0F172A" },
  ratingBadgeMini: {
    position: "absolute",
    top: 4,
    right: 4,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.90)",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 1.5,
  },
  ratingBadgeTextMini: { fontSize: 8, fontWeight: "800", color: "#0F172A" },
  catBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: T.accent,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#FFFFFF",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 3 },
      android: { elevation: 3 }
    })
  },
  catBadgeMini: {
    position: "absolute",
    top: 4,
    left: 4,
    backgroundColor: T.accent,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 0.75,
    borderColor: "#FFFFFF",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
      android: { elevation: 2 }
    })
  },
});
