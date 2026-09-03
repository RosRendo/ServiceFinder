/**
 * Category Screen — Premium Redesign
 *
 * Design principles applied:
 * ─ Pure StyleSheet (no className mix)
 * ─ 8pt grid spacing
 * ─ Skeleton loading state
 * ─ Type scale contrast
 * ─ PressCard micro-interactions
 * ─ Premium filter modal layout
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { Image } from "expo-image";
import { Text, View, TextInput, TouchableOpacity, Modal, RefreshControl, StyleSheet, Animated, Easing, Pressable, Platform, FlatList, ActivityIndicator, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import FadeIn from "@/components/FadeIn";
import { useRouter, useLocalSearchParams } from "expo-router";
import { api } from "@/store/authStore";
import { Theme } from "@/constants/theme";
import MapView, { Marker } from "react-native-maps";
import { MAP_PROVIDER, centerMapCamera } from "@/utils/mapHelper";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";

// ─────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────
const T = Theme.colors;

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  android: { elevation: 2 },
});

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
interface CategoryItem { id: string; name: string; slug: string; icon: string; imageUrl?: string; useImageAsBadge?: boolean; }
interface ServiceItem {
  id: string; name: string; description?: string; basePrice: number;
  durationMin: number; image?: string;
  company: { id: string; name: string; city: string; logoUrl?: string };
  serviceType?: {
    imageUrl?: string;
    category?: {
      imageUrl?: string;
    }
  }
}
interface CompanyItem {
  id: string; name: string; city: string; logoUrl?: string; description?: string;
  verificationStatus?: string; cardHighlights?: any;
  ratingSummary?: { averageRating: number; totalReviews: number };
}

const extractArray = (data: any): any[] => {
  if (Array.isArray(data)) return data;
  const inner = data?.data;
  if (inner) {
    if (Array.isArray(inner)) return inner;
    if (Array.isArray(inner.data)) return inner.data;
    if (Array.isArray(inner.companies)) return inner.companies;
    if (Array.isArray(inner.services)) return inner.services;
  }
  if (Array.isArray(data?.companies)) return data.companies;
  return [];
};

const getCategoryIcon = (text: string): any => {
  if (!text) return 'tools';
  const t = text.toLowerCase();
  if (t.includes('clean') || t.includes('maid') || t.includes('spark')) return 'broom';
  if (t.includes('plumb') || t.includes('pipe') || t.includes('water')) return 'pipe-wrench';
  if (t.includes('electric') || t.includes('wire') || t.includes('volt') || t.includes('zap')) return 'lightning-bolt';
  if (t.includes('ac') || t.includes('air') || t.includes('cool') || t.includes('wind')) return 'air-conditioner';
  if (t.includes('paint') || t.includes('color') || t.includes('brush')) return 'brush';
  if (t.includes('move') || t.includes('pack') || t.includes('truck')) return 'truck-delivery';
  if (t.includes('garden') || t.includes('lawn') || t.includes('yard') || t.includes('tree')) return 'leaf';
  if (t.includes('pest') || t.includes('bug')) return 'bug';
  if (t.includes('build') || t.includes('construct') || t.includes('repair') || t.includes('wrench')) return 'hammer-wrench';
  return 'tools';
};

function Skeleton({ width, height, radius = 8, style }: { width: number | string; height: number; radius?: number; style?: any; }) {
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
  return <Animated.View style={[{ width, height, borderRadius: radius, backgroundColor: "#D1D5DB", opacity }, style]} />;
}

function PressCard({ onPress, style, children }: { onPress: () => void; style?: any; children: React.ReactNode; }) {
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
// SKELETON LOADERS
// ─────────────────────────────────────────────────────────────
function CategoryScreenSkeleton() {
  return (
    <View style={{ gap: 24, marginTop: 16 }}>
      {/* Companies */}
      <View style={{ paddingHorizontal: 24, gap: 12 }}>
        {[...Array(3)].map((_, i) => (
          <View key={i} style={[s.companyCard, { opacity: 1 - i * 0.15 }]}>
            <Skeleton width={64} height={64} radius={12} />
            <View style={{ flex: 1, gap: 8 }}>
              <Skeleton width="60%" height={14} radius={6} />
              <Skeleton width="40%" height={12} radius={6} />
              <Skeleton width="80%" height={10} radius={4} />
            </View>
          </View>
        ))}
      </View>
      {/* Featured Service */}
      <View style={{ paddingHorizontal: 24 }}>
        <Skeleton width="100%" height={240} radius={24} />
      </View>
      {/* Services List */}
      <View style={{ paddingHorizontal: 24, gap: 12 }}>
        {[...Array(2)].map((_, i) => (
          <View key={i} style={[s.companyCard, { opacity: 1 - i * 0.15 }]}>
            <Skeleton width={64} height={64} radius={12} />
            <View style={{ flex: 1, gap: 8 }}>
              <Skeleton width="60%" height={14} radius={6} />
              <Skeleton width="40%" height={12} radius={6} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────
export default function CategoryScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  // Filter / modal state
  const [showFilter, setShowFilter] = useState(false);
  const [minPrice, setMinPrice] = useState("25");
  const [maxPrice, setMaxPrice] = useState("150");
  const [selectedRating, setSelectedRating] = useState(4.5);
  const [selectedDistance, setSelectedDistance] = useState("5");
  const [serviceTypes, setServiceTypes] = useState({
    residential: true, moveOut: true, commercial: false, postConstruction: false, ecoFriendly: false,
  });
  const [availability, setAvailability] = useState({ today: false, weekends: true });

  // View mode: list vs map
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [selectedMapCompany, setSelectedMapCompany] = useState<any | null>(null);
  const { location: userLoc } = useCurrentLocation();
  const mapRef = useRef<MapView>(null);

  // API data state
  const [allCategories, setAllCategories] = useState<CategoryItem[]>([]);
  const [activeSlug, setActiveSlug] = useState<string>(typeof id === "string" ? id : "cleaning");
  const [activeCategory, setActiveCategory] = useState<CategoryItem | null>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await api.get("/api/categories");
        const cats = extractArray(res.data);
        setAllCategories(cats);
        const found = cats.find((c: CategoryItem) => c.slug === id || c.id === id);
        if (found) {
          setActiveSlug(found.slug);
          setActiveCategory(found);
        } else if (cats.length > 0) {
          setActiveSlug(cats[0].slug);
          setActiveCategory(cats[0]);
        }
      } catch (e) {
        console.error("[Category] failed to load categories", e);
      }
    };
    loadCategories();
  }, [id]);

  const loadCategoryData = useCallback(async (pageNumber = 1) => {
    if (!activeSlug) return;
    if (pageNumber === 1) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const [companiesRes, servicesRes] = await Promise.all([
        pageNumber === 1 ? api.get("/api/companies", { params: { categoryId: activeCategory?.id || id } }) : Promise.resolve({ data: [] }),
        api.get("/api/services", { params: { limit: 20, page: pageNumber, categoryId: activeCategory?.id || id } }),
      ]);

      const newServices = extractArray(servicesRes.data);
      if (pageNumber === 1) {
        setCompanies(extractArray(companiesRes.data));
        setServices(newServices);
      } else {
        setServices(prev => [...prev, ...newServices]);
      }
      setPage(pageNumber);
      setHasMore(newServices.length === 20);
    } catch (e) {
      console.error("[Category] failed to load data", e);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [activeSlug, activeCategory, id]);

  useEffect(() => {
    loadCategoryData();
  }, [loadCategoryData]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!searchQuery.trim()) { loadCategoryData(); return; }
      setIsSearching(true);
      try {
        const res = await api.get("/api/services", {
          params: { search: searchQuery, categoryId: activeCategory?.id || id },
        });
        setServices(extractArray(res.data));
      } finally { setIsSearching(false); }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const switchCategory = (cat: CategoryItem) => {
    setActiveSlug(cat.slug);
    setActiveCategory(cat);
  };

  const featuredService = services[0];
  const handleApplyFilter = () => { setShowFilter(false); loadCategoryData(); };

  return (
    <View style={s.root}>
      <SafeAreaView edges={["top"]} style={s.appBar}>
        <View style={s.appBarContent}>
          <TouchableOpacity onPress={() => router.back()} style={s.iconBtn}>
            <MaterialIcons name="arrow-back" size={24} color={T.text1} />
          </TouchableOpacity>

          <Text style={s.appBarTitle} numberOfLines={1}>
            {activeCategory?.name || "Category"}
          </Text>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <TouchableOpacity
              onPress={() => router.push(`/(customer)/map-view?categorySlug=${activeSlug}` as any)}
              style={s.iconBtn}
            >
              <MaterialIcons name="map" size={22} color={T.text1} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowFilter(true)} style={s.iconBtn}>
              <MaterialIcons name="tune" size={22} color={T.text1} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <FlatList
        data={services.slice(1)} // Everything except featured service
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => loadCategoryData(1)} colors={[T.accent]} tintColor={T.accent} />}
        onEndReached={() => {
          if (!isSearching && hasMore && !isLoadingMore) {
            loadCategoryData(page + 1);
          }
        }}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={
          <>
            {/* Category Tabs */}
            {allCategories.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.tabsScrollContent}
              >
                {allCategories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => switchCategory(cat)}
                    style={[s.tabBtn, activeSlug === cat.slug && s.tabBtnActive]}
                  >
                    <Text style={[s.tabBtnText, activeSlug === cat.slug && s.tabBtnTextActive]}>
                      {cat.name.split(" ")[0]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Search Bar */}
            <View style={s.searchSection}>
              <View style={s.searchBox}>
                <MaterialIcons name="search" size={20} color={T.text3} />
                <TextInput
                  placeholder="Search for professionals..."
                  placeholderTextColor={T.text3}
                  style={s.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {isSearching ? (
                  <Skeleton width={16} height={16} radius={8} />
                ) : searchQuery.length > 0 ? (
                  <TouchableOpacity onPress={() => setSearchQuery("")}>
                    <MaterialIcons name="cancel" size={20} color={T.text3} />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            {isLoading ? (
              <CategoryScreenSkeleton />
            ) : (
              <>
                {/* Services list follows directly below */}

                {/* Featured Service */}
                {featuredService && (
                  <View style={[s.section, { marginTop: 32 }]}>
                    <View style={s.sectionHeader}>
                      <Text style={s.sectionTitle}>Featured Service</Text>
                      <Text style={s.limitedBadge}>LIMITED TIME</Text>
                    </View>

                    <PressCard onPress={() => router.push(`/(customer)/service/${featuredService.id}` as any)}>
                      <View style={s.featuredCard}>
                        <View style={{ width: '100%', height: 160, position: 'relative' }}>
                          {(() => {
                            const featuredImageUrl = featuredService.image || featuredService.serviceType?.imageUrl || featuredService.serviceType?.category?.imageUrl || activeCategory?.imageUrl || featuredService.company?.logoUrl;
                            return featuredImageUrl ? (
                              <Image
                                source={{ uri: featuredImageUrl }}
                                style={s.featuredImg}
                                contentFit="cover"
                              />
                            ) : (
                              <View style={[s.featuredImg, { backgroundColor: T.border, alignItems: 'center', justifyContent: 'center' }]}>
                                <MaterialCommunityIcons name="image-off" size={32} color={T.text3} />
                              </View>
                            );
                          })()}
                          <View style={s.catBadge}>
                            {activeCategory?.useImageAsBadge && activeCategory?.imageUrl ? (
                              <Image source={{ uri: activeCategory.imageUrl }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
                            ) : (
                              <MaterialCommunityIcons name={(activeCategory?.icon as any) || getCategoryIcon(activeCategory?.name || '')} size={18} color="#fff" />
                            )}
                          </View>
                          {(featuredService.company as any)?.ratingSummary && (
                            <View style={s.ratingBadge}>
                              <MaterialIcons name="star" size={11} color={T.gold} />
                              <Text style={s.ratingBadgeText}>
                                {Number((featuredService.company as any).ratingSummary.averageRating).toFixed(1)}
                              </Text>
                            </View>
                          )}
                        </View>
                        <View style={s.featuredBody}>
                          <View style={s.featuredTopRow}>
                            <View style={{ flex: 1 }}>
                              <Text style={s.featuredTitle}>{featuredService.name}</Text>
                              <Text style={s.featuredDesc} numberOfLines={2}>
                                {featuredService.description || `Professional ${featuredService.name} by ${featuredService.company?.name}`}
                              </Text>
                            </View>
                            <View style={s.featuredPriceBox}>
                              <Text style={s.featuredPrice}>${featuredService.basePrice}+</Text>
                            </View>
                          </View>

                          <View style={s.featuredBottomRow}>
                            <View style={s.featuredMetaItem}>
                              <MaterialIcons name="storefront" size={16} color={T.text2} />
                              <Text style={s.featuredMetaText} numberOfLines={1}>{featuredService.company?.name}</Text>
                            </View>
                            <View style={s.featuredMetaItem}>
                              <MaterialIcons name="schedule" size={16} color={T.text2} />
                              <Text style={s.featuredMetaText}>{featuredService.durationMin} min</Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    </PressCard>
                  </View>
                )}

                {/* All Services List Header */}
                {services.length > 1 && (
                  <View style={[s.section, { marginTop: 32, paddingBottom: 12 }]}>
                    <Text style={s.sectionTitle}>All Services</Text>
                  </View>
                )}
              </>
            )}
          </>
        }
        renderItem={({ item: service, index: i }) => (
          <View style={{ paddingHorizontal: 24, paddingBottom: 12 }}>
            <FadeIn delay={i < 10 ? i * 100 : 0}>
              <PressCard
                onPress={() => router.push(`/(customer)/service/${service.id}` as any)}
              >
                <View style={s.companyCard}>
                  <View style={{ position: 'relative' }}>
                    <Image
                      source={{ uri: service.image || service.serviceType?.imageUrl || service.serviceType?.category?.imageUrl || activeCategory?.imageUrl || service.company?.logoUrl || `https://api.dicebear.com/9.x/shapes/svg?seed=${service.id}` }}
                      style={s.companyImg}
                      contentFit="cover"
                    />
                    <View style={s.catBadgeMini}>
                      {activeCategory?.useImageAsBadge && activeCategory?.imageUrl ? (
                        <Image source={{ uri: activeCategory.imageUrl }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
                      ) : (
                        <MaterialCommunityIcons name={(activeCategory?.icon as any) || getCategoryIcon(activeCategory?.name || '')} size={13} color="#fff" />
                      )}
                    </View>
                  </View>
                  <View style={s.companyInfo}>
                    <Text style={s.companyName} numberOfLines={1}>{service.name}</Text>
                    <Text style={s.companyCity} numberOfLines={1}>{service.company?.name}</Text>
                    <View style={[s.companyMetaRow, { marginTop: 6 }]}>
                      <Text style={s.servicePrice}>${service.basePrice}</Text>
                      <Text style={s.metaDot}>•</Text>
                      <MaterialIcons name="schedule" size={12} color={T.text2} />
                      <Text style={s.companyCity}>{service.durationMin} min</Text>
                    </View>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color={T.text3} />
                </View>
              </PressCard>
            </FadeIn>
          </View>
        )}
        ListFooterComponent={
          isLoadingMore ? (
            <View style={{ paddingVertical: 24, alignItems: "center" }}>
              <ActivityIndicator size="small" color={T.accent} />
            </View>
          ) : (
            <View style={{ height: 24 }} />
          )
        }
      />

      {/* ── FILTER MODAL ────────────────────────────────────── */}
      <Modal visible={showFilter} transparent animationType="slide" onRequestClose={() => setShowFilter(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHandle} />

            <View style={s.modalHeader}>
              <TouchableOpacity onPress={() => setShowFilter(false)}>
                <MaterialIcons name="close" size={24} color={T.text1} />
              </TouchableOpacity>
              <Text style={s.modalTitle}>Filters</Text>
              <TouchableOpacity onPress={() => {
                setMinPrice("25"); setMaxPrice("150"); setSelectedRating(4.5); setSelectedDistance("5");
              }}>
                <Text style={s.modalReset}>Reset</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
              {/* Price */}
              <View style={s.filterSection}>
                <Text style={s.filterTitle}>Price Range</Text>
                <View style={s.filterRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.filterLabel}>MIN PRICE</Text>
                    <View style={s.filterInputBox}>
                      <Text style={s.filterInputPrefix}>$</Text>
                      <TextInput value={minPrice} onChangeText={setMinPrice} keyboardType="numeric" style={s.filterInput} />
                    </View>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.filterLabel}>MAX PRICE</Text>
                    <View style={s.filterInputBox}>
                      <Text style={s.filterInputPrefix}>$</Text>
                      <TextInput value={maxPrice} onChangeText={setMaxPrice} keyboardType="numeric" style={s.filterInput} />
                    </View>
                  </View>
                </View>
              </View>

              {/* Rating */}
              <View style={s.filterSection}>
                <Text style={s.filterTitle}>Rating</Text>
                <View style={s.filterRow}>
                  {[4.5, 4.0, 3.5].map((rating) => (
                    <TouchableOpacity
                      key={rating}
                      onPress={() => setSelectedRating(rating)}
                      style={[s.ratingBtn, selectedRating === rating && s.ratingBtnActive]}
                    >
                      <MaterialIcons name="star" size={16} color={selectedRating === rating ? T.accent : T.text3} />
                      <Text style={[s.ratingBtnText, selectedRating === rating && s.ratingBtnTextActive]}>
                        {rating}+
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Distance */}
              <View style={s.filterSection}>
                <Text style={s.filterTitle}>Distance</Text>
                <View style={s.distanceWrap}>
                  {["5", "10", "25"].map((dist) => (
                    <TouchableOpacity
                      key={dist}
                      onPress={() => setSelectedDistance(dist)}
                      style={[s.distBtn, selectedDistance === dist && s.distBtnActive]}
                    >
                      <Text style={[s.distBtnText, selectedDistance === dist && s.distBtnTextActive]}>
                        {dist === "5" ? "Within 5" : `${dist} miles`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={s.modalFooter}>
              <TouchableOpacity onPress={() => setShowFilter(false)} style={s.modalBtnSecondary}>
                <Text style={s.modalBtnSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleApplyFilter} style={s.modalBtnPrimary}>
                <Text style={s.modalBtnPrimaryText}>Show {companies.length} Results</Text>
                <MaterialIcons name="arrow-forward" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },

  // App bar
  appBar: { backgroundColor: T.surface, borderBottomWidth: 1, borderBottomColor: T.border },
  appBarContent: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, height: 56 },
  appBarTitle: { fontSize: 18, fontWeight: "800", color: T.text1, letterSpacing: -0.3, flex: 1, textAlign: "center", marginHorizontal: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },

  // Tabs
  tabsScrollContent: { paddingHorizontal: 24, paddingVertical: 16, gap: 12 },
  tabBtn: { paddingHorizontal: 20, height: 36, borderRadius: 18, backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, justifyContent: "center" },
  tabBtnActive: { backgroundColor: T.text1, borderColor: T.text1 },
  tabBtnText: { fontSize: 14, fontWeight: "700", color: T.text2 },
  tabBtnTextActive: { color: "#fff" },

  // Search
  searchSection: { paddingHorizontal: 24, marginBottom: 16 },
  searchBox: { flexDirection: "row", alignItems: "center", backgroundColor: T.surface, borderRadius: 14, height: 48, paddingHorizontal: 12, gap: 8, borderWidth: 1, borderColor: T.border, ...CARD_SHADOW },
  searchInput: { flex: 1, fontSize: 15, color: T.text1, fontWeight: "500" },

  // Sections
  section: { paddingHorizontal: 24 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: T.text1, letterSpacing: -0.5 },
  sectionAction: { fontSize: 14, fontWeight: "700", color: T.accent },
  limitedBadge: { fontSize: 10, fontWeight: "800", color: T.gold, letterSpacing: 1 },

  // Company Card List
  companyCard: { flexDirection: "row", alignItems: "center", backgroundColor: T.surface, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: T.border, ...CARD_SHADOW, gap: 12 },
  companyImg: { width: 64, height: 64, borderRadius: 12, backgroundColor: T.accentLight },
  companyInfo: { flex: 1, justifyContent: "center" },
  companyNameRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 },
  companyName: { fontSize: 15, fontWeight: "700", color: T.text1 },
  companyMetaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  companyRating: { fontSize: 13, fontWeight: "700", color: T.text1 },
  metaDot: { fontSize: 12, color: T.text3 },
  companyCity: { fontSize: 13, color: T.text2 },
  companyReviews: { fontSize: 12, color: T.text3 },
  servicePrice: { fontSize: 15, fontWeight: "800", color: T.accent },

  // Tags
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  tag: { backgroundColor: T.tag, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  tagText: { fontSize: 9, fontWeight: "800", color: T.text2, letterSpacing: 0.5 },

  // Featured Service Card
  featuredCard: { backgroundColor: T.surface, borderRadius: 24, overflow: "hidden", borderWidth: 1, borderColor: T.border, ...CARD_SHADOW },
  featuredImg: { width: "100%", height: 160, backgroundColor: T.accentLight },
  featuredBody: { padding: 20 },
  featuredTopRow: { flexDirection: "row", alignItems: "flex-start", gap: 16, marginBottom: 16 },
  featuredTitle: { fontSize: 18, fontWeight: "800", color: T.text1, marginBottom: 4 },
  featuredDesc: { fontSize: 13, color: T.text2, lineHeight: 18 },
  featuredPriceBox: { backgroundColor: T.accentLight, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  featuredPrice: { fontSize: 15, fontWeight: "800", color: T.accent },
  featuredBottomRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  featuredMetaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  featuredMetaText: { fontSize: 13, fontWeight: "600", color: T.text2 },

  // Empty State
  emptyState: { alignItems: "center", paddingVertical: 40 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyBody: { fontSize: 14, color: T.text3 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: T.surface, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 24, paddingTop: 12, height: "85%" },
  modalHandle: { width: 40, height: 4, backgroundColor: T.border, borderRadius: 2, alignSelf: "center", marginBottom: 24 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: "800", color: T.text1 },
  modalReset: { fontSize: 15, fontWeight: "700", color: T.text3 },

  filterSection: { paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: T.border },
  filterTitle: { fontSize: 16, fontWeight: "800", color: T.text1, marginBottom: 16 },
  filterRow: { flexDirection: "row", gap: 12 },
  filterLabel: { fontSize: 11, fontWeight: "800", color: T.text3, marginBottom: 8, letterSpacing: 0.5 },
  filterInputBox: { flexDirection: "row", alignItems: "center", backgroundColor: T.bg, borderRadius: 12, paddingHorizontal: 12, height: 44, borderWidth: 1, borderColor: T.border },
  filterInputPrefix: { fontSize: 15, fontWeight: "700", color: T.text3, marginRight: 8 },
  filterInput: { flex: 1, fontSize: 15, fontWeight: "700", color: T.text1 },

  ratingBtn: { flex: 1, height: 48, borderRadius: 14, backgroundColor: T.bg, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 4, borderWidth: 1, borderColor: T.border },
  ratingBtnActive: { backgroundColor: T.accentLight, borderColor: T.accent },
  ratingBtnText: { fontSize: 14, fontWeight: "700", color: T.text2 },
  ratingBtnTextActive: { color: T.accent },

  distanceWrap: { flexDirection: "row", backgroundColor: T.bg, borderRadius: 14, padding: 4, borderWidth: 1, borderColor: T.border },
  distBtn: { flex: 1, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 10 },
  distBtnActive: { backgroundColor: T.surface, borderWidth: 1, borderColor: T.border },
  distBtnText: { fontSize: 13, fontWeight: "700", color: T.text3 },
  distBtnTextActive: { color: T.text1 },

  modalFooter: { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32, backgroundColor: T.surface, borderTopWidth: 1, borderTopColor: T.border, flexDirection: "row", gap: 12 },
  modalBtnSecondary: { flex: 1, height: 56, borderRadius: 16, borderWidth: 2, borderColor: T.text1, alignItems: "center", justifyContent: "center" },
  modalBtnSecondaryText: { fontSize: 16, fontWeight: "800", color: T.text1 },
  modalBtnPrimary: { flex: 1.5, height: 56, borderRadius: 16, backgroundColor: T.text1, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  modalBtnPrimaryText: { fontSize: 16, fontWeight: "800", color: "#fff" },
  ratingBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.90)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 3,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
      android: { elevation: 1 }
    })
  },
  ratingBadgeText: { fontSize: 11, fontWeight: "800", color: T.text1 },
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

  // ── View Mode Toggle ─────────────────────────
  togglePill: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    padding: 3,
    gap: 2,
    borderWidth: 1,
    borderColor: T.border,
  },
  toggleBtn: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleBtnActive: {
    backgroundColor: T.accent,
  },

  // ── Map View Overlay ─────────────────────────
  mapCategoryTabsOverlay: {
    position: "absolute",
    top: 12,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  mapMarkerPin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: T.accent,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  mapMarkerPinActive: {
    backgroundColor: "#10B981",
    transform: [{ scale: 1.15 }],
  },
  mapMarkerPinLetter: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "900",
  },
  mapMarkerRating: {
    position: "absolute",
    top: -6,
    right: -10,
    backgroundColor: "#FFF",
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: T.border,
  },
  mapMarkerRatingText: {
    fontSize: 9,
    fontWeight: "800",
    color: T.text1,
  },

  // ── Floating Selected Company Card on Map ───
  mapCompanyCard: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    zIndex: 20,
  },
  mapCompanyClose: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  mapCompanyAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: T.accentLight,
    alignItems: "center",
    justifyContent: "center",
  },
  mapCompanyAvatarText: {
    fontSize: 18,
    fontWeight: "800",
    color: T.accent,
  },
  mapCompanyName: {
    fontSize: 15,
    fontWeight: "800",
    color: T.text1,
  },
  mapCompanyRating: {
    fontSize: 12,
    fontWeight: "700",
    color: T.text1,
  },
  mapCompanyCity: {
    fontSize: 12,
    color: T.text2,
    fontWeight: "500",
  },
  mapCompanyProfileBtn: {
    flex: 1.2,
    height: 40,
    borderRadius: 12,
    backgroundColor: T.accent,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    shadowColor: T.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  mapCompanyProfileText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFF",
  },
  mapCompanyListBtn: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  mapCompanyListText: {
    fontSize: 13,
    fontWeight: "700",
    color: T.text1,
  },
});
