/**
 * Explore Screen — Premium Redesign
 *
 * Design principles applied:
 * ─ All className removed → pure StyleSheet (no mixed paradigms)
 * ─ 8pt grid: 8 / 16 / 24 / 32 / 48 spacing throughout
 * ─ Type scale contrast: 24px section title → 15px body → 11px metadata
 * ─ 60-30-10 color: #F7F8FC bg / #FFFFFF cards / #1D4ED8 accent sparingly
 * ─ Skeleton loaders replace every ActivityIndicator
 * ─ PressCard scale micro-interaction on every tappable element
 * ─ Proximity: 8px related elements, 32px section gaps
 * ─ Beautiful empty states (never just blank space)
 * ─ Progressive disclosure: highlights capped at 2 tags per card
 */

import React, { useEffect, useCallback, useState, useRef } from "react";
import { Image } from "expo-image";
import { ScrollView, Text, View, TextInput, TouchableOpacity, RefreshControl, StyleSheet, Animated, Easing, Pressable, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useExploreStore, ExploreService, ExploreCompany } from "@/store/exploreStore";
import FadeIn from "@/components/FadeIn";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
// ─────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────
const T = {
  bg: "#FFFFFF",
  surface: "#FFFFFF",
  border: "#EBEBEB",
  accent: "#0A192F",
  accentLight: "#F7F7F7",
  accentMid: "#1E3A8A",
  text1: "#111827",
  text2: "#717171",
  text3: "#B0B0B0",
  gold: "#FFB800",
  success: "#00A699",
  tag: "#F7F7F7",
};

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  android: { elevation: 2 },
});

// ─────────────────────────────────────────────────────────────
// ICON MAP
// ─────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, string> = {
  Sparkles: "silverware-clean", Wind: "air-conditioner", Droplets: "water",
  Zap: "lightning-bolt", TreeDeciduous: "tree", Car: "car", Home: "home",
  Building2: "office-building", Wrench: "wrench", Filter: "format-paint",
  Cable: "cable-data", Lightbulb: "lightbulb-on", Scissors: "scissors-cutting",
  Flower2: "flower",
};
const mapIcon = (icon: string): any => ICON_MAP[icon] || "tools";

// ─────────────────────────────────────────────────────────────
// SKELETON COMPONENT
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
    <Animated.View style={[{ width, height, borderRadius: radius, backgroundColor: "#D1D5DB", opacity }, style]} />
  );
}

// ─────────────────────────────────────────────────────────────
// PRESSABLE CARD (scale micro-interaction)
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
      <Animated.View style={[{ transform: [{ scale }] }, style]}>{children}</Animated.View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────
// SKELETON PLACEHOLDERS
// ─────────────────────────────────────────────────────────────
function AnimatedExploreEmpty({ icon, title, body }: { icon: string; title: string; body: string }) {
  const floatAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -8, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <View style={s.emptyState}>
      <Animated.Text style={[s.emptyIcon, { transform: [{ translateY: floatAnim }] }]}>{icon}</Animated.Text>
      <Text style={s.emptyTitle}>{title}</Text>
      <Text style={s.emptyBody}>{body}</Text>
    </View>
  );
}

function CompanyCardsSkeleton() {
  return (
    <View style={{ flexDirection: "row", paddingHorizontal: 24, gap: 12 }}>
      {[...Array(3)].map((_, i) => (
        <View key={i} style={{ width: 200, gap: 8 }}>
          <Skeleton width={200} height={120} radius={16} />
          <Skeleton width={120} height={13} radius={6} />
          <Skeleton width={80} height={11} radius={5} />
        </View>
      ))}
    </View>
  );
}

function ServiceListSkeleton() {
  return (
    <View style={{ paddingHorizontal: 24, gap: 12 }}>
      {[...Array(4)].map((_, i) => (
        <View key={i} style={[s.serviceRow, { opacity: 1 - i * 0.15 }]}>
          <Skeleton width={72} height={72} radius={14} />
          <View style={{ flex: 1, gap: 8 }}>
            <Skeleton width="70%" height={13} radius={6} />
            <Skeleton width="45%" height={11} radius={5} />
            <Skeleton width="30%" height={10} radius={5} />
          </View>
        </View>
      ))}
    </View>
  );
}

function CategoryChipsSkeleton() {
  return (
    <View style={{ flexDirection: "row", paddingHorizontal: 24, gap: 8, marginTop: 12 }}>
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} width={70 + i * 10} height={32} radius={20} />
      ))}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// COMPANY CARD (Featured Companies horizontal scroll)
// ─────────────────────────────────────────────────────────────
function CompanyCard({ company, onPress }: { company: ExploreCompany; onPress: () => void }) {
  const { t } = useTranslation();
  const highlights: string[] = (() => {
    if (!company.cardHighlights) return [];
    if (Array.isArray(company.cardHighlights)) return company.cardHighlights;
    try { return JSON.parse(company.cardHighlights as any); } catch { return []; }
  })();

  return (
    <PressCard onPress={onPress}>
      <View style={s.companyCard}>
        {/* Cover / logo image */}
        <Image
          source={{ uri: company.coverImageUrl || company.logoUrl || `https://api.dicebear.com/9.x/initials/svg?seed=${company.name}` }}
          style={s.companyCover}
          contentFit="cover"
        />
        {/* Rating badge — top right, glassmorphism pill */}
        {company.ratingSummary && (
          <View style={s.ratingBadge}>
            <MaterialIcons name="star" size={11} color={T.gold} />
            <Text style={s.ratingBadgeText}>
              {Number(company.ratingSummary.averageRating).toFixed(1)}
            </Text>
          </View>
        )}
        {/* Card body */}
        <View style={s.companyCardBody}>
          <View style={s.companyNameRow}>
            <Text style={s.companyName} numberOfLines={1}>{company.name}</Text>
            {company.verificationStatus === "verified" && (
              <MaterialIcons name="verified" size={14} color={T.accentMid} />
            )}
          </View>
          {/* City — metadata gray, 4px below name */}
          <Text style={s.companyCity} numberOfLines={1}>
            {company.city}
            {company.description ? ` · ${company.description}` : ""}
          </Text>
          {/* Highlight tags — progressive disclosure: max 2 */}
          {highlights.length > 0 && (
            <View style={s.tagsRow}>
              {highlights.slice(0, 2).map((tag, idx) => (
                <View key={idx} style={s.tag}>
                  <Text style={s.tagText}>{tag.toUpperCase()}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </PressCard>
  );
}

// ─────────────────────────────────────────────────────────────
// SERVICE ROW (Popular Services list)
// ─────────────────────────────────────────────────────────────
function ServiceRow({ service, onPress }: { service: ExploreService; onPress: () => void }) {
  const { t } = useTranslation();
  return (
    <PressCard onPress={onPress}>
      <View style={s.serviceRow}>
        {/* Service image / icon */}
        <View style={s.serviceImgBox}>
          {service.image || service.serviceType?.imageUrl || service.serviceType?.category?.imageUrl || service.company?.logoUrl ? (
            <Image 
              source={{ uri: service.image || service.serviceType?.imageUrl || service.serviceType?.category?.imageUrl || service.company?.logoUrl }} 
              style={StyleSheet.absoluteFillObject} 
              contentFit="cover" 
            />
          ) : (
            <MaterialIcons name="home-repair-service" size={28} color={T.accentMid} />
          )}
        </View>
        {/* Info */}
        <View style={{ flex: 1 }}>
          <Text style={s.serviceName} numberOfLines={2}>{service.name}</Text>
          <Text style={s.serviceProvider} numberOfLines={1}>{t('explore.by')}{service.company.name}</Text>
          <View style={s.serviceMeta}>
            {/* Duration chip */}
            <View style={s.metaChip}>
              <MaterialIcons name="schedule" size={11} color={T.text2} />
              <Text style={s.metaChipText}>{service.durationMin} {t('home.min')}</Text>
            </View>
            {/* Verified chip */}
            {service.company.verified && (
              <View style={[s.metaChip, { backgroundColor: "#ECFDF5" }]}>
                <MaterialIcons name="verified" size={11} color={T.success} />
                <Text style={[s.metaChipText, { color: T.success }]}>{t('explore.verified')}</Text>
              </View>
            )}
          </View>
        </View>
        {/* Price — right side, accent color */}
        <View style={{ alignItems: "flex-end" }}>
          <Text style={s.servicePrice}>${service.basePrice}</Text>
          <Text style={s.servicePriceLabel}>{t('explore.starting')}</Text>
        </View>
      </View>
    </PressCard>
  );
}

// ─────────────────────────────────────────────────────────────
// NEARBY COMPANY ROW
// ─────────────────────────────────────────────────────────────
function NearbyRow({ company, onPress }: { company: ExploreCompany; onPress: () => void }) {
  const { t } = useTranslation();
  const highlights: string[] = (() => {
    if (!company.cardHighlights) return [];
    if (Array.isArray(company.cardHighlights)) return company.cardHighlights;
    try { return JSON.parse(company.cardHighlights as any); } catch { return []; }
  })();

  return (
    <PressCard onPress={onPress}>
      <View style={s.nearbyRow}>
        <Image
          source={{ uri: company.logoUrl || `https://api.dicebear.com/9.x/initials/svg?seed=${company.name}` }}
          style={s.nearbyLogo}
          contentFit="cover"
        />
        <View style={{ flex: 1 }}>
          <View style={s.nearbyNameRow}>
            <Text style={s.nearbyName} numberOfLines={1}>{company.name}</Text>
            {company.verificationStatus === "verified" && (
              <MaterialIcons name="verified" size={13} color={T.accentMid} />
            )}
          </View>
          <Text style={s.nearbyCity}>
            {company.city}
            {company.verificationStatus === "verified" ? ` · ${t('explore.licensedAndVerified')}` : ""}
          </Text>
          {highlights.length > 0 && (
            <View style={[s.tagsRow, { marginTop: 6 }]}>
              {highlights.slice(0, 2).map((tag, idx) => (
                <View key={idx} style={s.tag}>
                  <Text style={s.tagText}>{tag.toUpperCase()}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
        {/* Rating on the right */}
        <View style={s.nearbyRating}>
          <MaterialIcons name="star" size={13} color={T.gold} />
          <Text style={s.nearbyRatingText}>
            {company.ratingSummary ? Number(company.ratingSummary.averageRating).toFixed(1) : t('explore.newRating')}
          </Text>
        </View>
      </View>
    </PressCard>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────
export default function Explore() {
  const router = useRouter();
  const { t } = useTranslation();
  const searchRef = useRef<TextInput>(null);
  const [searchInput, setSearchInput] = useState("");

  const {
    categories, services, companies,
    activeCategory, isLoading, isSearching,
    fetchExploreData, searchServices, setActiveCategory,
  } = useExploreStore();

  useEffect(() => { fetchExploreData(); }, []);
  const onRefresh = useCallback(() => { fetchExploreData(); }, []);

  // Debounced search — 400ms after last keystroke
  useEffect(() => {
    const timer = setTimeout(() => { searchServices(searchInput); }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const filteredServices = activeCategory
    ? services.filter((s) => s.serviceType?.category?.slug === activeCategory)
    : services;

  const isSearchMode = searchInput.length > 0;

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      {/* ── STICKY HEADER: Search + Filters ─────────────────── */}
      <View style={s.stickyHeader}>
        {/* Page Title & Map Action */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, marginBottom: 12 }}>
          <Text style={[s.pageTitle, { paddingHorizontal: 0, marginBottom: 0 }]}>{t('explore.title')}</Text>
          <TouchableOpacity 
            onPress={() => router.push("/(customer)/map-view" as any)}
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: T.accentLight, alignItems: "center", justifyContent: "center" }}
          >
            <MaterialIcons name="map" size={20} color={T.accent} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={s.searchBar}>
          <View style={s.searchIconBox}>
            <MaterialIcons name="search" size={18} color={T.accent} />
          </View>
          <TextInput
            ref={searchRef}
            placeholder={t('explore.searchPlaceholder')}
            placeholderTextColor={T.text3}
            style={s.searchInput}
            value={searchInput}
            onChangeText={setSearchInput}
            returnKeyType="search"
          />
          {/* Right action — clear */}
          {isSearchMode && (
            <TouchableOpacity
              onPress={() => { setSearchInput(""); fetchExploreData(); }}
              style={s.searchActionBtn}
            >
              <MaterialIcons name="close" size={18} color={T.text3} />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Filter Chips — horizontal scroll */}
        {isLoading && categories.length === 0 ? (
          <CategoryChipsSkeleton />
        ) : categories.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, gap: 8, paddingVertical: 12 }}
          >
            {/* "All" chip */}
            <TouchableOpacity
              onPress={() => setActiveCategory(null)}
              style={[s.chip, activeCategory === null && s.chipActive]}
            >
              <Text style={[s.chipText, activeCategory === null && s.chipTextActive]}>{t('explore.all')}</Text>
            </TouchableOpacity>
            {categories.map((cat, i) => (
              <FadeIn key={cat.id} delay={i * 50}>
                <TouchableOpacity
                  onPress={() => setActiveCategory(activeCategory === cat.slug ? null : cat.slug)}
                  style={[s.chip, activeCategory === cat.slug && s.chipActive]}
                >
                  {cat.imageUrl ? (
                    <Image source={{ uri: cat.imageUrl }} style={{ width: 14, height: 14, borderRadius: 7 }} />
                  ) : (
                    <MaterialCommunityIcons
                      name={mapIcon(cat.icon)}
                      size={13}
                      color={activeCategory === cat.slug ? "#fff" : T.text2}
                    />
                  )}
                  <Text style={[s.chipText, activeCategory === cat.slug && s.chipTextActive]}>
                    {cat.name.split(" ")[0]}
                  </Text>
                </TouchableOpacity>
              </FadeIn>
            ))}
          </ScrollView>
        ) : null}
      </View>

      {/* ── SCROLLABLE CONTENT ──────────────────────────────── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} colors={[T.accent]} tintColor={T.accent} />
        }
      >
        {/* ─── FEATURED COMPANIES ───────────────────────────── */}
        {!isSearchMode && (
          <View style={{ marginTop: 8 }}>
            <View style={s.sectionHeader}>
              <View>
                <Text style={s.sectionTitle}>{t('explore.featuredCompanies')}</Text>
                <Text style={s.sectionSubtitle}>{t('explore.featuredSubtitle')}</Text>
              </View>
            </View>

            {isLoading && companies.length === 0 ? (
              <View style={{ marginTop: 16 }}><CompanyCardsSkeleton /></View>
            ) : companies.length === 0 ? (
              <AnimatedExploreEmpty 
                  icon="🔍" 
                  title={t('explore.noResultsFound')} 
                  body={t('explore.tryAdjustingFilters')} 
                />
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 24, gap: 12, paddingTop: 16, paddingBottom: 4 }}
              >
                {companies.map((company, i) => (
                  <FadeIn key={company.id} delay={i * 100}>
                    <CompanyCard
                      company={company}
                      onPress={() => router.push(`/company/${company.id}` as any)}
                    />
                  </FadeIn>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {/* ─── POPULAR / SEARCH RESULTS SERVICES ───────────── */}
        <View style={{ marginTop: isSearchMode ? 8 : 32 }}>
          <View style={s.sectionHeader}>
            <View>
              <Text style={s.sectionTitle}>
                {isSearchMode ? t('explore.resultsFor', { term: searchInput }) : t('explore.popularServices')}
              </Text>
              {!isSearchMode && (
                <Text style={s.sectionSubtitle}>{t('explore.vettedProfessionals')}</Text>
              )}
            </View>
          </View>

          <View style={{ marginTop: 16 }}>
            {isLoading || isSearching ? (
              <ServiceListSkeleton />
            ) : filteredServices.length === 0 ? (
              <View style={s.emptyState}>
                <Text style={s.emptyIcon}>🔍</Text>
                <Text style={s.emptyTitle}>{t('explore.noServicesFound')}</Text>
                <Text style={s.emptyBody}>
                  {isSearchMode
                    ? t('explore.tryDifferentSearch')
                    : t('explore.checkBackSoonServicesExplore')}
                </Text>
              </View>
            ) : (
              <View style={{ paddingHorizontal: 24, gap: 12 }}>
                {filteredServices.map((service, i) => (
                  <FadeIn key={service.id} delay={i * 100}>
                    <ServiceRow
                      service={service}
                      onPress={() => router.push(`/(customer)/company/service-modal/${service.id}` as any)}
                    />
                  </FadeIn>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* ─── NEARBY PROVIDERS ─────────────────────────────── */}
        {!isSearchMode && (
          <View style={{ marginTop: 32 }}>
            <View style={s.sectionHeader}>
              <View>
                <Text style={s.sectionTitle}>{t('explore.nearYou')}</Text>
                <Text style={s.sectionSubtitle}>{t('explore.providersInArea')}</Text>
              </View>
              <TouchableOpacity onPress={() => router.push("/(customer)/map-view" as any)}>
                <Text style={s.seeAll}>{t('home.mapView')}</Text>
              </TouchableOpacity>
            </View>

            <View style={{ marginTop: 16, paddingHorizontal: 24, gap: 10 }}>
              {isLoading && companies.length === 0 ? (
                <ServiceListSkeleton />
              ) : companies.length === 0 ? (
                <AnimatedExploreEmpty 
                  icon="📍" 
                  title={t('explore.noNearbyProviders')} 
                  body={t('explore.tryExpandingSearch')} 
                />
              ) : (
                companies.slice(0, 5).map((company, i) => (
                  <FadeIn key={company.id} delay={i * 100}>
                    <NearbyRow
                      company={company}
                      onPress={() => router.push(`/company/${company.id}` as any)}
                    />
                  </FadeIn>
                ))
              )}
            </View>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────
// STYLES  (8pt grid enforced)
// ─────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },

  // Sticky header
  stickyHeader: {
    backgroundColor: T.bg,
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    paddingBottom: 0,
  },
  pageTitle: {
    fontSize: 28, fontWeight: "800", color: T.text1,
    letterSpacing: -0.8, paddingHorizontal: 24, marginBottom: 12,
  },

  // Search bar
  searchBar: {
    flexDirection: "row", alignItems: "center", height: 56,
    marginHorizontal: 24, backgroundColor: "#F7F7F7",
    borderRadius: 100, // Pill
    paddingHorizontal: 12, gap: 12,
  },
  searchIconBox: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: "#FFFFFF",
    alignItems: "center", justifyContent: "center"},
  searchInput: { flex: 1, fontSize: 16, color: T.text1, fontWeight: "500" },
  searchActionBtn: {
    width: 32, height: 32, borderRadius: 8,
    alignItems: "center", justifyContent: "center",
  },

  // Filter chips
  chip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 14, height: 32, borderRadius: 20,
    backgroundColor: T.surface, borderWidth: 1, borderColor: T.border,
  },
  chipActive: { backgroundColor: T.accent, borderColor: T.accent },
  chipText: { fontSize: 13, fontWeight: "600", color: T.text2 },
  chipTextActive: { color: "#fff" },

  // Section headers
  sectionHeader: {
    flexDirection: "row", alignItems: "flex-start",
    justifyContent: "space-between", paddingHorizontal: 24,
  },
  sectionTitle: { fontSize: 20, fontWeight: "800", color: T.text1, letterSpacing: -0.5 },
  sectionSubtitle: { fontSize: 13, color: T.text3, marginTop: 3, fontWeight: "400" },
  seeAll: { fontSize: 13, color: T.accent, fontWeight: "600", marginTop: 4 },

  // Company cards (horizontal scroll)
  companyCard: {
    width: 200, backgroundColor: T.surface, borderRadius: 16,
    overflow: "hidden", borderWidth: 1, borderColor: T.border,
    ...CARD_SHADOW,
  },
  companyCover: { width: 200, height: 116, backgroundColor: T.accentLight },
  ratingBadge: {
    position: "absolute", top: 8, right: 8,
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: "rgba(255,255,255,0.92)", borderRadius: 8,
    paddingHorizontal: 7, paddingVertical: 4,
  },
  ratingBadgeText: { fontSize: 11, fontWeight: "800", color: T.text1 },
  companyCardBody: { padding: 12 },
  companyNameRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  companyName: { fontSize: 14, fontWeight: "700", color: T.text1, flex: 1 },
  companyCity: { fontSize: 11, color: T.text3, marginTop: 3 },

  // Tag chips (inside cards)
  tagsRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  tag: { backgroundColor: T.tag, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  tagText: { fontSize: 9, fontWeight: "700", color: T.text2, letterSpacing: 0.4 },

  // Service rows
  serviceRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: T.surface, borderRadius: 16, padding: 12,
    borderWidth: 1, borderColor: T.border,
    ...CARD_SHADOW,
  },
  serviceImgBox: {
    width: 80, height: 80, borderRadius: 12, backgroundColor: T.accentLight,
    alignItems: "center", justifyContent: "center", overflow: "hidden",
  },
  serviceName: { fontSize: 14, fontWeight: "700", color: T.text1, lineHeight: 20 },
  serviceProvider: { fontSize: 12, color: T.text3, marginTop: 3 },
  serviceMeta: { flexDirection: "row", gap: 6, marginTop: 8 },
  metaChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: T.tag, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3,
  },
  metaChipText: { fontSize: 10, fontWeight: "600", color: T.text2 },
  servicePrice: { fontSize: 16, fontWeight: "800", color: T.accent },
  servicePriceLabel: { fontSize: 10, color: T.text3, marginTop: 2 },

  // Nearby rows
  nearbyRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: T.surface, borderRadius: 16, padding: 12,
    borderWidth: 1, borderColor: T.border,
    ...CARD_SHADOW,
  },
  nearbyLogo: { width: 80, height: 80, borderRadius: 12, backgroundColor: T.accentLight },
  nearbyNameRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  nearbyName: { fontSize: 14, fontWeight: "700", color: T.text1, flex: 1 },
  nearbyCity: { fontSize: 12, color: T.text3, marginTop: 3 },
  nearbyRating: { alignItems: "center", gap: 2 },
  nearbyRatingText: { fontSize: 13, fontWeight: "700", color: T.text1 },

  // Empty states
  emptyState: { alignItems: "center", paddingVertical: 40, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 44, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: T.text1 },
  emptyBody: { fontSize: 13, color: T.text3, textAlign: "center", marginTop: 8, lineHeight: 20 },

  // Map CTA
  mapCtaBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: T.accent, borderRadius: 16, paddingVertical: 16,
  },
  mapCtaText: { fontSize: 15, fontWeight: "700", color: "#fff", flex: 1, textAlign: "center" },
});
