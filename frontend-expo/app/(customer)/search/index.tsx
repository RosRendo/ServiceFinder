/**
 * Search Screen — Premium Redesign
 *
 * Design principles applied:
 * ─ Pure StyleSheet (no className mix)
 * ─ 8pt grid spacing (8/12/16/24)
 * ─ Type scale contrast
 * ─ Premium shadows & colors (60-30-10 rule)
 * ─ PressCard micro-interactions
 * ─ Skeleton loading state
 * ─ Beautiful empty states
 */

import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Animated,
  Easing,
  Pressable,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { api } from "@/store/authStore";
import { Theme } from "@/constants/theme";
import { SearchDiscoverySvg } from "@/components/svg";

type Filter = "all" | "service" | "company";

interface ServiceResult {
  id: string;
  name: string;
  basePrice: number;
  durationMin?: number;
  image?: string;
  companyId: string;
  company: { id: string; name: string; city?: string; rating?: number; verified?: boolean; ratingSummary?: { averageRating?: number | string; totalReviews?: number } };
  serviceType?: { name: string; category?: { name: string } };
}

interface CompanyResult {
  id: string;
  name: string;
  description?: string;
  city?: string;
  logoUrl?: string;
  rating?: number;
  reviewCount?: number;
  verified?: boolean;
  verificationStatus?: string;
  ratingSummary?: { averageRating?: number | string; totalReviews?: number };
}

const getRating = (item?: { rating?: number; ratingSummary?: { averageRating?: number | string } } | null): number | undefined => {
  if (!item) return undefined;
  if (typeof item.rating === "number") return item.rating;
  const avg = item.ratingSummary?.averageRating;
  if (avg != null && Number(avg) > 0) return Number(avg);
  return undefined;
};

const extractArray = (data: any): any[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  const inner = data?.data;
  if (inner) {
    if (Array.isArray(inner)) return inner;
    if (Array.isArray(inner.data)) return inner.data;
    if (Array.isArray(inner.companies)) return inner.companies;
    if (Array.isArray(inner.services)) return inner.services;
    if (Array.isArray(inner.items)) return inner.items;
  }
  if (Array.isArray(data?.companies)) return data.companies;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

// ─────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────
const T = Theme.colors;

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  android: { elevation: 2 },
});

// ─────────────────────────────────────────────────────────────
// UI COMPONENTS
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
// SKELETON LOADERS
// ─────────────────────────────────────────────────────────────
function SearchResultsSkeleton() {
  return (
    <View style={{ gap: 12 }}>
      {[...Array(5)].map((_, i) => (
        <View key={i} style={[s.resultRow, { opacity: 1 - i * 0.15 }]}>
          <Skeleton width={64} height={64} radius={12} />
          <View style={{ flex: 1, gap: 8 }}>
            <Skeleton width="60%" height={14} radius={6} />
            <Skeleton width="40%" height={12} radius={6} />
          </View>
        </View>
      ))}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────
export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [services, setServices] = useState<ServiceResult[]>([]);
  const [companies, setCompanies] = useState<CompanyResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<"relevance" | "price_asc" | "price_desc">("relevance");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<any>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 400);
    // Fetch initial default data
    search("", filter);
    return () => clearTimeout(timer);
  }, []);

  const search = useCallback(async (q: string, f: Filter) => {
    const qTrim = q.trim();
    setLoading(true);
    try {
      const [sRes, cRes] = await Promise.all([
        (f === "all" || f === "service")
          ? api.get("/api/services", { params: { search: qTrim, limit: 20 } })
          : Promise.resolve(null),
        (f === "all" || f === "company")
          ? api.get("/api/companies", { params: { search: qTrim, limit: 20 } })
          : Promise.resolve(null),
      ]);
      
      const sArr = sRes ? extractArray(sRes.data) : [];
      const cArr = cRes ? extractArray(cRes.data) : [];
      
      
      setServices(sArr);
      setCompanies(cArr);
    } catch (err) {
      console.error("Search API Error:", err);
      setServices([]); setCompanies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(text, filter), 450);
  };

  const handleFilterChange = (f: Filter) => {
    setFilter(f);
    search(query, f);
  };

  const filteredServices = services
    .filter(s => {
      if (minRating === 0) return true;
      const r = s.company ? getRating(s.company) : undefined;
      return r == null || r >= minRating;
    })
    .sort((a, b) => {
      if (sortBy === "price_asc") return a.basePrice - b.basePrice;
      if (sortBy === "price_desc") return b.basePrice - a.basePrice;
      return 0; // relevance
    });

  const filteredCompanies = companies
    .filter(c => {
      if (minRating === 0) return true;
      const r = getRating(c);
      return r == null || r >= minRating;
    });

  const totalResults = filteredServices.length + filteredCompanies.length;
  const showNoResults = !loading && query.length > 0 && totalResults === 0;

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      {/* ── HEADER ─────────────────────────────────────────── */}
      <View style={s.header}>
        <View style={s.headerTopRow}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <MaterialIcons name="arrow-back" size={24} color={T.text1} />
          </TouchableOpacity>
          
          <View style={s.searchBox}>
            <MaterialIcons name="search" size={20} color={T.text3} />
            <TextInput
              ref={inputRef}
              value={query}
              onChangeText={handleChange}
              placeholder="Search services or companies..."
              placeholderTextColor={T.text3}
              style={s.searchInput}
              returnKeyType="search"
              onSubmitEditing={() => search(query, filter)}
            />
            <TouchableOpacity 
              onPress={() => { setQuery(""); search("", filter); }}
              style={{ opacity: query.length > 0 ? 1 : 0 }}
              disabled={query.length === 0}
            >
              <MaterialIcons name="cancel" size={20} color={T.text3} />
            </TouchableOpacity>
            <View style={{ width: 1, height: 24, backgroundColor: T.border, marginHorizontal: 4 }} />
            <TouchableOpacity onPress={() => setShowFilters(!showFilters)}>
              <MaterialIcons name="tune" size={20} color={showFilters ? T.accent : T.text3} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Filters Panel */}
        {showFilters && (
          <View style={s.advancedFiltersContainer}>
            <Text style={s.filterLabel}>Type</Text>
            <View style={s.filtersRow}>
              {(["all", "service", "company"] as Filter[]).map(f => (
                <TouchableOpacity 
                  key={f} 
                  onPress={() => handleFilterChange(f)}
                  style={[s.filterChip, filter === f && s.filterChipActive]}
                >
                  <Text style={[s.filterChipText, filter === f && s.filterChipTextActive]}>
                    {f === "all" ? "All" : f === "service" ? "Services" : "Companies"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.filterLabel}>Minimum Rating</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filtersRow}>
              {[{label: "Any", val: 0}, {label: "4.0+", val: 4}, {label: "4.5+", val: 4.5}, {label: "5.0", val: 5}].map(r => (
                <TouchableOpacity 
                  key={r.label} 
                  onPress={() => setMinRating(r.val)}
                  style={[s.filterChip, minRating === r.val && s.filterChipActive]}
                >
                  <Text style={[s.filterChipText, minRating === r.val && s.filterChipTextActive]}>
                    <MaterialIcons name="star" size={12} color={minRating === r.val ? T.accent : T.text3} style={{marginRight: 4}} />
                    {r.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {filter !== "company" && (
              <>
                <Text style={s.filterLabel}>Sort Services By Price</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filtersRow}>
                  {[
                    {label: "Relevance", val: "relevance"}, 
                    {label: "Low to High", val: "price_asc"}, 
                    {label: "High to Low", val: "price_desc"}
                  ].map(srt => (
                    <TouchableOpacity 
                      key={srt.val} 
                      onPress={() => setSortBy(srt.val as any)}
                      style={[s.filterChip, sortBy === srt.val && s.filterChipActive]}
                    >
                      <Text style={[s.filterChipText, sortBy === srt.val && s.filterChipTextActive]}>
                        {srt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}
          </View>
        )}
      </View>

      {/* ── RESULTS ────────────────────────────────────────── */}
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Loading State */}
        {loading && <SearchResultsSkeleton />}

        {/* Suggested Searches & Quick Actions (Only when query is empty) */}
        {!loading && query.length === 0 && (
          <View style={s.initialStateContainer}>
            <Text style={s.initialStateTitle}>Suggested Searches</Text>
            <View style={s.suggestionPillsRow}>
              {["Deep Cleaning", "AC Repair", "Plumbing", "Electrical", "Moving", "Pest Control"].map(tag => (
                <TouchableOpacity 
                  key={tag} 
                  style={s.suggestionPill}
                  onPress={() => {
                    setQuery(tag);
                    search(tag, filter);
                  }}
                >
                  <MaterialIcons name="search" size={14} color={T.text2} />
                  <Text style={s.suggestionPillText}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={[s.initialStateTitle, { marginTop: 32 }]}>Quick Actions</Text>
            <View style={s.quickActionsRow}>
              <TouchableOpacity style={s.quickActionCard} onPress={() => router.push("/(customer)/(tabs)/explore" as any)}>
                <View style={[s.quickActionIconBox, { backgroundColor: '#EFF6FF' }]}>
                  <MaterialIcons name="category" size={24} color="#3B82F6" />
                </View>
                <Text style={s.quickActionText}>Browse All</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.quickActionCard} onPress={() => router.push("/(customer)/map-view" as any)}>
                <View style={[s.quickActionIconBox, { backgroundColor: '#ECFDF5' }]}>
                  <MaterialIcons name="map" size={24} color="#10B981" />
                </View>
                <Text style={s.quickActionText}>Map View</Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: 1, backgroundColor: T.border, marginVertical: 32 }} />
          </View>
        )}

        {/* No Results State */}
        {showNoResults && (
          <View style={s.emptyState}>
            <View style={{ marginBottom: 12 }}>
              <SearchDiscoverySvg size={105} />
            </View>
            <Text style={s.emptyTitle}>No results found</Text>
            <Text style={s.emptyBody}>We couldn't find anything matching "{query}". Try a different term or check your spelling.</Text>
          </View>
        )}

        {/* Services Results */}
        {!loading && filteredServices.length > 0 && (
          <View style={s.resultsSection}>
            <Text style={s.sectionTitle}>Services ({filteredServices.length})</Text>
            <View style={{ gap: 12 }}>
              {filteredServices.map(sItem => (
                <PressCard 
                  key={sItem.id}
                  onPress={() => router.push(`/(customer)/service/${sItem.id}` as any)}
                >
                  <View style={s.resultRow}>
                    <View style={s.resultImgBox}>
                      {sItem.image ? (
                        <Image source={{ uri: sItem.image }} style={StyleSheet.absoluteFill} contentFit="cover" />
                      ) : (
                        <MaterialIcons name="home-repair-service" size={24} color={T.accentMid} />
                      )}
                    </View>
                    <View style={s.resultInfo}>
                      <Text style={s.resultName} numberOfLines={1}>{sItem.name}</Text>
                      <Text style={s.resultSub} numberOfLines={1}>by {sItem.company?.name}</Text>
                      <View style={s.resultMetaRow}>
                        <View style={s.resultMetaLeft}>
                          <MaterialIcons name="star" size={13} color={T.gold} />
                          <Text style={s.resultRating}>
                            {getRating(sItem.company) ? getRating(sItem.company)!.toFixed(1) : "New"}
                          </Text>
                          {sItem.durationMin && <Text style={s.resultDuration}> · {sItem.durationMin}min</Text>}
                        </View>
                        <View style={{ alignItems: "flex-end" }}>
                          <Text style={s.resultPrice}>${Number(sItem.basePrice).toFixed(2)}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </PressCard>
              ))}
            </View>
          </View>
        )}

        {/* Companies Results */}
        {!loading && filteredCompanies.length > 0 && (
          <View style={[s.resultsSection, filteredServices.length > 0 && { marginTop: 32 }]}>
            <Text style={s.sectionTitle}>Companies ({filteredCompanies.length})</Text>
            <View style={{ gap: 12 }}>
              {filteredCompanies.map(cItem => (
                <PressCard 
                  key={cItem.id}
                  onPress={() => router.push(`/(customer)/company/${cItem.id}` as any)}
                >
                  <View style={s.resultRow}>
                    <View style={s.resultImgBox}>
                      <Image 
                        source={{ uri: cItem.logoUrl || `https://api.dicebear.com/9.x/initials/svg?seed=${cItem.name}` }} 
                        style={StyleSheet.absoluteFill} 
                        contentFit="cover" 
                      />
                    </View>
                    <View style={s.resultInfo}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <Text style={s.resultName} numberOfLines={1}>{cItem.name}</Text>
                        {(cItem.verificationStatus === "verified" || cItem.verified) && (
                          <MaterialIcons name="verified" size={14} color={T.accentMid} />
                        )}
                      </View>
                      <Text style={s.resultSub} numberOfLines={1}>
                        {cItem.city || "Unknown City"}
                      </Text>
                      <View style={s.resultMetaRow}>
                        <View style={s.resultMetaLeft}>
                          <MaterialIcons name="star" size={13} color={T.gold} />
                          <Text style={s.resultRating}>
                            {getRating(cItem) ? getRating(cItem)!.toFixed(1) : "New"}
                          </Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={20} color={T.text3} />
                      </View>
                    </View>
                  </View>
                </PressCard>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  
  // Header
  header: {
    backgroundColor: T.surface,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -8, // optical alignment
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 16,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: T.text1,
  },
  filtersRow: {
    flexDirection: "row",
    gap: 8,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "transparent",
  },
  filterChipActive: {
    backgroundColor: "#EFF6FF",
    borderColor: T.accent,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: T.text2,
  },
  filterChipTextActive: {
    color: T.accent,
  },
  advancedFiltersContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: T.border,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: T.text1,
    marginBottom: 8,
    marginTop: 12,
  },

  // Results Layout
  scrollContent: {
    paddingVertical: 24,
    paddingBottom: 80, // tab bar padding
  },
  resultsSection: {
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: T.text1,
    marginBottom: 16,
    letterSpacing: -0.5,
  },

  // Result Cards
  resultRow: {
    flexDirection: "row",
    backgroundColor: T.surface,
    borderRadius: 16,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: T.border,
    ...CARD_SHADOW,
  },
  resultImgBox: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: T.accentLight,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  resultInfo: {
    flex: 1,
    justifyContent: "center",
  },
  resultName: {
    fontSize: 15,
    fontWeight: "700",
    color: T.text1,
    lineHeight: 20,
  },
  resultSub: {
    fontSize: 13,
    color: T.text3,
    marginTop: 2,
  },
  resultMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  resultMetaLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  resultRating: {
    fontSize: 13,
    fontWeight: "700",
    color: T.text2,
  },
  resultDuration: {
    fontSize: 12,
    color: T.text3,
  },
  resultPrice: {
    fontSize: 15,
    fontWeight: "800",
    color: T.accent,
  },

  // Empty States
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: T.text1,
    marginBottom: 8,
  },
  emptyBody: {
    fontSize: 14,
    color: T.text3,
    textAlign: "center",
    lineHeight: 22,
  },

  // Initial State Additions
  initialStateContainer: { paddingHorizontal: 24, paddingTop: 16 },
  initialStateTitle: { fontSize: 16, fontWeight: "700", color: T.text1, marginBottom: 12 },
  suggestionPillsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  suggestionPill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: T.surface, paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 8, borderWidth: 1, borderColor: T.border,
  },
  suggestionPillText: { fontSize: 13, fontWeight: "500", color: T.text2 },
  quickActionsRow: { flexDirection: "row", gap: 12 },
  quickActionCard: {
    flex: 1, backgroundColor: T.surface, borderRadius: 12, padding: 16,
    alignItems: "center", borderWidth: 1, borderColor: T.border,
  },
  quickActionIconBox: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  quickActionText: { fontSize: 13, fontWeight: "600", color: T.text1 },
});