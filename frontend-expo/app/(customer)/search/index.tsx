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

type Filter = "all" | "service" | "company";

interface ServiceResult {
  id: string;
  name: string;
  basePrice: number;
  durationMin?: number;
  image?: string;
  companyId: string;
  company: { id: string; name: string; city?: string; rating?: number; verified?: boolean };
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
}

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
  gold: "#F59E0B",
  success: "#00A699",
  tag: "#F3F4F6",
};

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
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const search = useCallback(async (q: string, f: Filter) => {
    const qTrim = q.trim();
    if (!qTrim) { setServices([]); setCompanies([]); return; }
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

  const totalResults = services.length + companies.length;
  const showEmptySearch = !loading && query.length === 0;
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
              onPress={() => { setQuery(""); setServices([]); setCompanies([]); }}
              style={{ opacity: query.length > 0 ? 1 : 0 }}
              disabled={query.length === 0}
            >
              <MaterialIcons name="cancel" size={20} color={T.text3} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Filters */}
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
      </View>

      {/* ── RESULTS ────────────────────────────────────────── */}
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Loading State */}
        {loading && <SearchResultsSkeleton />}

        {/* Empty / Initial State */}
        {showEmptySearch && (
          <View style={s.emptyState}>
            <Text style={s.emptyIcon}>🔍</Text>
            <Text style={s.emptyTitle}>Find anything you need</Text>
            <Text style={s.emptyBody}>Search for cleaning, repairs, or specific professionals near you.</Text>
          </View>
        )}

        {/* No Results State */}
        {showNoResults && (
          <View style={s.emptyState}>
            <Text style={s.emptyIcon}>👻</Text>
            <Text style={s.emptyTitle}>No results found</Text>
            <Text style={s.emptyBody}>We couldn't find anything matching "{query}". Try a different term or check your spelling.</Text>
          </View>
        )}

        {/* Services Results */}
        {!loading && services.length > 0 && (
          <View style={s.resultsSection}>
            <Text style={s.sectionTitle}>Services ({services.length})</Text>
            <View style={{ gap: 12 }}>
              {services.map(sItem => (
                <PressCard 
                  key={sItem.id}
                  onPress={() => router.push(`/(customer)/company/service-modal/${sItem.id}` as any)}
                >
                  <View style={s.resultRow}>
                    <View style={s.resultImgBox}>
                      {sItem.image ? (
                        <Image source={{ uri: sItem.image }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
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
                            {(sItem.company?.rating ?? 0) > 0 ? (sItem.company.rating!).toFixed(1) : "New"}
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
        {!loading && companies.length > 0 && (
          <View style={[s.resultsSection, services.length > 0 && { marginTop: 32 }]}>
            <Text style={s.sectionTitle}>Companies ({companies.length})</Text>
            <View style={{ gap: 12 }}>
              {companies.map(cItem => (
                <PressCard 
                  key={cItem.id}
                  onPress={() => router.push(`/(customer)/company/${cItem.id}` as any)}
                >
                  <View style={s.resultRow}>
                    <View style={s.resultImgBox}>
                      <Image 
                        source={{ uri: cItem.logoUrl || `https://api.dicebear.com/9.x/initials/svg?seed=${cItem.name}` }} 
                        style={StyleSheet.absoluteFillObject} 
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
                            {(cItem.rating ?? 0) > 0 ? Number(cItem.rating).toFixed(1) : "New"}
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
    backgroundColor: T.bg,
    borderRadius: 12,
    height: 44,
    paddingHorizontal: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: T.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: T.text1,
    fontWeight: "500",
  },
  
  // Filters
  filtersRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: T.border,
    backgroundColor: T.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  filterChipActive: {
    backgroundColor: T.accent,
    borderColor: T.accent,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: T.text2,
  },
  filterChipTextActive: {
    color: "#fff",
  },

  // Content
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    paddingBottom: 40,
  },
  
  // Empty states
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: T.text1,
    letterSpacing: -0.5,
  },
  emptyBody: {
    fontSize: 14,
    color: T.text3,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },

  // Results
  resultsSection: {},
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: T.text1,
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  resultRow: {
    flexDirection: "row",
    backgroundColor: T.surface,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: T.border,
    ...CARD_SHADOW,
    gap: 12,
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
    marginBottom: 2,
  },
  resultSub: {
    fontSize: 12,
    color: T.text3,
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
    gap: 3,
  },
  resultRating: {
    fontSize: 12,
    fontWeight: "700",
    color: T.text1,
  },
  resultDuration: {
    fontSize: 12,
    color: T.text3,
  },
  resultPrice: {
    fontSize: 14,
    fontWeight: "800",
    color: T.accent,
  },
});