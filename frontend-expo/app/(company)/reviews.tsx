/**
 * Reviews — Premium Deep Navy Redesign with Filtering
 */
import React, { useState, useCallback, useMemo } from "react";
import {
  ScrollView, Text, View, TouchableOpacity,
  ActivityIndicator, RefreshControl, StyleSheet, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { api, useAuthStore } from "@/store/authStore";
import { Theme } from "@/constants/theme";

const T = Theme.colors;

const HERO_SHADOW = Platform.select({
  ios: { shadowColor: '#0A192F', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 16 },
  android: { elevation: 8 },
});

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  android: { elevation: 2 },
});

type FilterType = "All" | "Highest" | "Lowest" | "Newest";

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <View style={{ flexDirection: "row", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <MaterialCommunityIcons
          key={star}
          name={star <= Math.round(rating ?? 0) ? "star" : "star-outline"}
          size={size}
          color={star <= Math.round(rating ?? 0) ? T.warning : T.border}
        />
      ))}
    </View>
  );
}

function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  const initials = (name ?? "?").split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  const palette = ["#1E3A8A", "#065F46", "#7C3AED", "#B45309", "#BE185D"];
  const color = palette[(name ?? "").length % palette.length];
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontSize: size * 0.33, fontWeight: "700", color: "#fff" }}>{initials}</Text>
    </View>
  );
}

export default function Reviews() {
  const router = useRouter();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>("All");
  const { user, isLoading: authLoading } = useAuthStore();

  const loadReviews = useCallback(async (isRefresh = false) => {
    if (authLoading || !user) return;
    
    if (isRefresh) { setRefreshing(true); } else { setLoading(true); }
    try {
      const companyRes = await api.get("/api/companies/my-company");
      let compData = companyRes.data;
      if (compData && compData.success) compData = compData.data;
      const companyId = compData?.id;

      if (!companyId) { setReviews([]); return; }

      const reviewsRes = await api.get(`/api/reviews/company/${companyId}`);
      let payload = reviewsRes.data;
      if (payload && payload.success) payload = payload.data;
      
      let reviewList = [];
      if (Array.isArray(payload)) {
        reviewList = payload;
      } else if (payload && Array.isArray(payload.reviews)) {
        reviewList = payload.reviews;
      } else if (payload && Array.isArray(payload.data)) {
        reviewList = payload.data;
      }

      setReviews(reviewList);
    } catch (error) {
      console.error("Failed to load reviews", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authLoading, user]);

  useFocusEffect(useCallback(() => { loadReviews(); }, [loadReviews]));

  const avgRating = reviews.length > 0
    ? reviews.reduce((acc, r) => acc + (r.companyRating ?? r.rating ?? 0), 0) / reviews.length
    : 0;

  const ratingCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => Math.round(r.companyRating ?? r.rating ?? 0) === star).length,
  }));

  const filteredAndSortedReviews = useMemo(() => {
    let sorted = [...reviews];
    
    switch (filter) {
      case "Highest":
        sorted.sort((a, b) => (b.companyRating ?? b.rating ?? 0) - (a.companyRating ?? a.rating ?? 0));
        break;
      case "Lowest":
        sorted.sort((a, b) => (a.companyRating ?? a.rating ?? 0) - (b.companyRating ?? b.rating ?? 0));
        break;
      case "Newest":
      case "All":
      default:
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }
    
    return sorted;
  }, [reviews, filter]);

  const FilterPill = ({ label }: { label: FilterType }) => {
    const isActive = filter === label;
    return (
      <TouchableOpacity 
        style={[s.filterPill, isActive && s.filterPillActive]} 
        onPress={() => setFilter(label)}
      >
        <Text style={[s.filterPillText, isActive && s.filterPillTextActive]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={s.root} edges={["top", "left", "right"]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <MaterialCommunityIcons name="chevron-left" size={32} color={T.text1} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Customer Reviews</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadReviews(true)} tintColor={T.accent} />}
      >
        {loading ? (
          <View style={s.loadingBox}><ActivityIndicator size="large" color={T.accent} /></View>
        ) : (
          <>
            {/* Summary Card */}
            {reviews.length > 0 && (
              <View style={s.summaryCard}>
                <View style={s.summaryLeft}>
                  <Text style={s.avgRatingBig}>{avgRating.toFixed(1)}</Text>
                  <Stars rating={avgRating} size={18} />
                  <Text style={s.totalReviews}>{reviews.length} review{reviews.length !== 1 ? "s" : ""}</Text>
                </View>
                <View style={s.summaryRight}>
                  {ratingCounts.map(({ star, count }) => (
                    <View key={star} style={s.barRow}>
                      <Text style={s.barLabel}>{star}</Text>
                      <MaterialCommunityIcons name="star" size={12} color={T.warning} />
                      <View style={s.barTrack}>
                        <View style={[s.barFill, { width: reviews.length > 0 ? `${(count / reviews.length) * 100}%` as any : "0%" }]} />
                      </View>
                      <Text style={s.barCount}>{count}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Filters Row */}
            {reviews.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filtersContainer}>
                <FilterPill label="All" />
                <FilterPill label="Newest" />
                <FilterPill label="Highest" />
                <FilterPill label="Lowest" />
              </ScrollView>
            )}

            {/* Reviews List */}
            {reviews.length === 0 ? (
              <View style={s.emptyBox}>
                <View style={s.emptyIconContainer}>
                  <MaterialCommunityIcons name="star-outline" size={48} color={T.accentMid} />
                </View>
                <Text style={s.emptyTitle}>No Reviews Yet</Text>
                <Text style={s.emptySubtitle}>Your first customer review will appear here once you complete a booking.</Text>
              </View>
            ) : (
              <View style={s.reviewsList}>
                {filteredAndSortedReviews.map((review) => {
                  const rating = review.companyRating ?? review.rating ?? 0;
                  const comment = review.companyComment ?? review.comment;
                  const serviceName = review.booking?.service?.name ?? review.serviceName;
                  return (
                    <View key={review.id} style={s.reviewCard}>
                      <View style={s.reviewHeader}>
                        <Avatar name={review.customer?.fullName ?? review.user?.fullName ?? "User"} size={44} />
                        <View style={{ flex: 1 }}>
                          <Text style={s.reviewerName}>
                            {review.customer?.fullName ?? review.user?.fullName ?? "Anonymous Customer"}
                          </Text>
                          <View style={s.reviewMeta}>
                            <Stars rating={rating} size={14} />
                            <View style={s.metaDot} />
                            <Text style={s.reviewDate}>
                              {new Date(review.createdAt).toLocaleDateString("en-US", {
                                month: "short", day: "numeric", year: "numeric"
                              })}
                            </Text>
                          </View>
                        </View>
                        <View style={s.ratingPill}>
                          <Text style={s.ratingPillText}>{rating.toFixed(1)}</Text>
                          <MaterialCommunityIcons name="star" size={12} color="#92400E" style={{ marginLeft: 2 }} />
                        </View>
                      </View>

                      {comment ? (
                        <Text style={s.reviewComment}>{comment}</Text>
                      ) : null}

                      {serviceName && (
                        <View style={s.servicePill}>
                          <MaterialCommunityIcons name="briefcase-outline" size={12} color={T.accentMid} />
                          <Text style={s.servicePillText}>{serviceName}</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: T.surface, borderBottomWidth: 1, borderBottomColor: T.border,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center", marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: T.text1 },

  scrollContent: { padding: 20, gap: 20, paddingBottom: 60 },
  loadingBox: { paddingVertical: 80, alignItems: "center" },

  summaryCard: {
    backgroundColor: T.accent, borderRadius: 20, padding: 24,
    flexDirection: "row", gap: 24, borderWidth: 1, borderColor: T.border,
  },
  summaryLeft: { alignItems: "center", justifyContent: "center", gap: 6, minWidth: 80 },
  avgRatingBig: { fontSize: 48, fontWeight: "700", color: "#fff", lineHeight: 52 },
  totalReviews: { fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,0.5)", marginTop: 4 },
  summaryRight: { flex: 1, justifyContent: "center", gap: 6 },
  barRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  barLabel: { fontSize: 12, fontWeight: "700", color: "rgba(255,255,255,0.7)", width: 10 },
  barTrack: { flex: 1, height: 6, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 3, overflow: "hidden" },
  barFill: { height: "100%", backgroundColor: T.warning, borderRadius: 3 },
  barCount: { fontSize: 11, fontWeight: "600", color: "rgba(255,255,255,0.5)", width: 16, textAlign: "right" },

  filtersContainer: { flexDirection: "row", gap: 8, paddingBottom: 4 },
  filterPill: { 
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, 
    backgroundColor: T.surface, borderWidth: 1, borderColor: T.border 
  },
  filterPillActive: { backgroundColor: T.accentMid, borderColor: T.accentMid },
  filterPillText: { fontSize: 13, fontWeight: "700", color: T.text2 },
  filterPillTextActive: { color: "#fff" },

  emptyBox: { paddingVertical: 60, alignItems: "center", gap: 12, backgroundColor: T.surface, borderRadius: 24, borderWidth: 1, borderColor: T.border, marginTop: 20, paddingHorizontal: 20 },
  emptyIconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: T.accentLight, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: T.text1 },
  emptySubtitle: { fontSize: 14, color: T.text3, textAlign: "center", lineHeight: 22 },

  reviewsList: { gap: 16 },
  reviewCard: {
    backgroundColor: T.surface, borderRadius: 20, padding: 20,
    
  },
  reviewHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  reviewerName: { fontSize: 15, fontWeight: "700", color: T.text1, marginBottom: 4 },
  reviewMeta: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: T.border },
  reviewDate: { fontSize: 12, fontWeight: "600", color: T.text3 },
  ratingPill: { flexDirection: "row", alignItems: "center", backgroundColor: T.warning + "20", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  ratingPillText: { fontSize: 13, fontWeight: "700", color: "#92400E" },
  reviewComment: { fontSize: 15, lineHeight: 24, color: T.text2, fontWeight: "500" },
  servicePill: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: T.accentLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignSelf: "flex-start" },
  servicePillText: { fontSize: 12, fontWeight: "700", color: T.accentMid },
});
