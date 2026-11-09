import React, { useState, useEffect, useCallback, useRef } from "react";
import { ScrollView, Text, View, TouchableOpacity, RefreshControl, ActivityIndicator, Alert, StyleSheet, Animated, Pressable, Platform, Dimensions, Share } from "react-native";
import { Image } from "expo-image";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { api, useAuthStore } from "@/store/authStore";
import { useTranslation } from "react-i18next";
import { Theme } from "@/constants/theme";
import ScaleButton from "@/components/ScaleButton";
import InitialsAvatar from "@/components/common/InitialsAvatar";

const T = Theme.colors;
const { width } = Dimensions.get('window');

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 },
  android: { elevation: 3 },
});

const getServiceIconInfo = (name: string) => {
  const n = (name || '').toLowerCase();
  if (n.includes('clean') || n.includes('maid') || n.includes('wash') || n.includes('sanitize')) {
    return { icon: 'sparkles', color: '#059669', bg: '#ECFDF5' };
  }
  if (n.includes('ac') || n.includes('air') || n.includes('cool') || n.includes('vent')) {
    return { icon: 'fan', color: '#0284C7', bg: '#F0F9FF' };
  }
  if (n.includes('plumb') || n.includes('pipe') || n.includes('leak') || n.includes('water')) {
    return { icon: 'pipe-wrench', color: '#2563EB', bg: '#EFF6FF' };
  }
  if (n.includes('electr') || n.includes('wire') || n.includes('light') || n.includes('power')) {
    return { icon: 'lightning-bolt', color: '#D97706', bg: '#FFFBEB' };
  }
  if (n.includes('paint') || n.includes('decor')) {
    return { icon: 'format-paint', color: '#7C3AED', bg: '#F5F3FF' };
  }
  if (n.includes('car') || n.includes('auto')) {
    return { icon: 'car-wash', color: '#DC2626', bg: '#FEF2F2' };
  }
  if (n.includes('garden') || n.includes('lawn') || n.includes('tree')) {
    return { icon: 'tree', color: '#16A34A', bg: '#F0FDF4' };
  }
  if (n.includes('pest') || n.includes('bug')) {
    return { icon: 'shield-bug-outline', color: '#EA580C', bg: '#FFF7ED' };
  }
  return { icon: 'hammer-wrench', color: T.primary, bg: '#F1F5F9' };
};

export default function CompanyDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { isGuest } = useAuthStore();

  const TABS = [t('companyProfile.tabs.services', 'Services'), t('companyProfile.tabs.reviews', 'Reviews'), t('companyProfile.tabs.about', 'About')];

  const [company, setCompany] = useState<any>(null);
  const [companyReviews, setCompanyReviews] = useState<any[]>([]);
  const [totalReviews, setTotalReviews] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;

  const loadCompanyReviews = useCallback(async () => {
    if (!id) return;
    try {
      const res = await api.get(`/api/reviews/company/${id}`, { params: { page: 1, limit: 10 } });
      let payload = res.data;
      if (payload && payload.success) payload = payload.data;
      let reviewList: any[] = [];
      if (Array.isArray(payload)) reviewList = payload;
      else if (Array.isArray(payload?.data)) reviewList = payload.data;
      else if (Array.isArray(payload?.reviews)) reviewList = payload.reviews;
      setCompanyReviews(reviewList);
      setTotalReviews(payload?.total ?? payload?.meta?.total ?? reviewList.length);
    } catch (e: any) {
      setCompanyReviews([]);
    }
  }, [id]);

  const loadCompany = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const res = await api.get(`/api/companies/${id}`);
      const data = res?.data?.data || res?.data;
      setCompany(data);
      loadCompanyReviews();

      if (!isGuest) {
        try {
          const checkRes = await api.get(`/api/saved-items/check`, { params: { itemType: 'company', itemIds: id } });
          const savedStatus = checkRes.data?.savedIds?.[0]?.saved;
          if (savedStatus) setIsSaved(true);
        } catch (checkErr: any) {
          console.warn("Could not check saved status:", checkErr?.message);
        }
      }
    } catch (e: any) {
      console.error("[CompanyDetail] failed:", e?.message);
      Alert.alert("Error", "Could not load company details.");
    } finally {
      setIsLoading(false);
    }
  }, [id, loadCompanyReviews]);

  useEffect(() => {
    loadCompany();
  }, [loadCompany]);

  const requireLogin = () => {
    Alert.alert(
      "Login Required",
      "Please log in or create an account to use this feature.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log In",
          onPress: () => {
            useAuthStore.getState().setGuestMode(false);
            router.replace("/(public)/login");
          }
        }
      ]
    );
  };

  const handleSaveToggle = async () => {
    if (useAuthStore.getState().isGuest) return requireLogin();
    if (isSaving || !id) return;
    setIsSaving(true);
    try {
      if (isSaved) {
        await api.delete('/api/saved-items', { data: { itemType: 'company', itemId: id } });
        setIsSaved(false);
      } else {
        await api.post('/api/saved-items', { itemType: 'company', itemId: id });
        setIsSaved(true);
      }
    } catch (e: any) {
      console.error("[SaveToggle] failed:", e?.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={s.centerRoot}>
        <ActivityIndicator size="large" color={T.primary} />
      </View>
    );
  }

  if (!company) {
    return (
      <SafeAreaView style={s.centerRoot}>
        <MaterialIcons name="storefront" size={64} color={T.text3} />
        <Text style={s.errorText}>Provider not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: T.primary, fontWeight: '600' }}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const heroImage = company.coverImageUrl;
  const logoImage = company.logoUrl;
  const rating = company.ratingSummary?.averageRating ? Number(company.ratingSummary.averageRating).toFixed(1) : "New";
  const reviewCount = totalReviews || company.ratingSummary?.totalReviews || 0;
  const completedJobs = company.completedJobs || 0;
  const isInsured = company.isInsured || false;
  const completionRate = company.completionRate !== undefined ? Number(company.completionRate).toFixed(0) : 100;
  const services = company.services ?? [];
  const lowestPrice = services.length > 0 ? Math.min(...services.map((s: any) => Number(s.basePrice))) : null;
  const ratingCounts = [5, 4, 3, 2, 1].map((r) => ({
    star: r,
    count: companyReviews.filter((rev: any) => Math.round(rev.companyRating ?? rev.rating ?? 0) === r).length,
  }));

  return (
    <View style={s.root}>
      {/* ── FLOATING OVERLAY HEADER ───────────────────────────────── */}
      <View style={s.floatingHeaderRow}>
        <Animated.View
          style={[s.floatingHeaderBg, {
            backgroundColor: scrollY.interpolate({
              inputRange: [130, 190],
              outputRange: ['rgba(10, 25, 47, 0)', 'rgba(10, 25, 47, 1)'],
              extrapolate: 'clamp',
            }),
          }, { paddingTop: Math.max(insets.top, 12) }]}
        >
          <Animated.Text
            style={[s.floatingHeaderTitle, {
              opacity: scrollY.interpolate({
                inputRange: [140, 180],
                outputRange: [0, 1],
                extrapolate: 'clamp',
              }),
            }]}
            numberOfLines={1}
          >
            {company.name}
          </Animated.Text>
        </Animated.View>
        <View style={[s.floatingHeaderContent, { paddingTop: Math.max(insets.top, 12) }]}>
          <TouchableOpacity onPress={() => router.back()} style={s.iconBtn} accessibilityRole="button" accessibilityLabel="Go back">
            <MaterialIcons name="arrow-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity onPress={() => Share.share({ message: `Check out ${company?.name} on Service Finder!` })} style={s.iconBtn} accessibilityRole="button" accessibilityLabel="Share">
              <MaterialIcons name="share" size={18} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSaveToggle} disabled={isSaving} style={s.iconBtn} accessibilityRole="button" accessibilityLabel={isSaved ? "Remove from saved" : "Save provider"}>
              <MaterialCommunityIcons name={isSaved ? "heart" : "heart-outline"} size={20} color={isSaved ? "#EF4444" : "#FFFFFF"} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 150 }}
        stickyHeaderIndices={[1]}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadCompany} colors={[T.primary]} tintColor={T.primary} />}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* INDEX 0: HERO & IDENTITY */}
        <View style={{ paddingBottom: 8 }}>
          {/* Parallax Hero Image */}
          <Animated.View style={[s.heroContainer, {
            transform: [{
              translateY: scrollY.interpolate({
                inputRange: [-100, 0, 100],
                outputRange: [-50, 0, 0],
                extrapolate: 'clamp'
              })
            }, {
              scale: scrollY.interpolate({
                inputRange: [-100, 0, 100],
                outputRange: [1.5, 1, 1],
                extrapolate: 'clamp'
              })
            }]
          }]}>
            {heroImage ? (
              <Image source={{ uri: heroImage }} style={StyleSheet.absoluteFill} contentFit="cover" />
            ) : (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0B132B', overflow: 'hidden' }]}>
                <View style={{ position: 'absolute', top: -50, right: -50, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(59, 130, 246, 0.18)' }} />
                <View style={{ position: 'absolute', bottom: -30, left: -30, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(16, 185, 129, 0.12)' }} />
                <View style={{ position: 'absolute', top: 50, right: 30, opacity: 0.10 }}>
                  <MaterialCommunityIcons name="shield-star-outline" size={130} color="#FFFFFF" />
                </View>
              </View>
            )}
            {/* Reading scrim */}
            <View style={s.heroScrim} />
            {/* Identity over hero */}
            <View style={s.heroIdentity}>
              <View style={s.heroNameRow}>
                <Text style={s.heroName} numberOfLines={2}>{company.name}</Text>
                {company.verificationStatus === 'verified' && (
                  <View style={s.verifiedChip}>
                    <MaterialIcons name="verified" size={13} color="#93C5FD" />
                    <Text style={s.verifiedChipText}>Verified</Text>
                  </View>
                )}
              </View>
              <View style={s.heroMetaRow}>
                <MaterialCommunityIcons name="map-marker-outline" size={14} color="rgba(255,255,255,0.75)" />
                <Text style={s.heroMetaText}>
                  {company.city || "Local Service Provider"}
                  {company.establishedYear ? ` · Since ${company.establishedYear}` : ""}
                  {isInsured ? " · Insured" : ""}
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Overlapping logo */}
          <View style={s.logoRow}>
            <View style={s.logoWrapper}>
              {logoImage ? (
                <Image source={{ uri: logoImage }} style={s.logoImg} />
              ) : (
                <InitialsAvatar name={company.name} size={76} radius={22} />
              )}
            </View>
          </View>

          {/* Trust Metrics Band */}
          <View style={s.bentoContainer}>
            <View style={s.trustMetrics}>
              <View style={s.trustItem}>
                <View style={s.trustIconRow}>
                  <MaterialIcons name="star" size={16} color={T.gold} />
                  <Text style={s.trustVal}>{rating}</Text>
                </View>
                <Text style={s.trustLabel}>{reviewCount > 0 ? `${reviewCount} reviews` : "Verified Pro"}</Text>
              </View>

              <View style={s.metricDivider} />

              <View style={s.trustItem}>
                <View style={s.trustIconRow}>
                  <MaterialIcons name="work" size={16} color={T.primaryMid} />
                  <Text style={s.trustVal}>{completedJobs > 1000 ? `${(completedJobs / 1000).toFixed(1)}k+` : completedJobs}</Text>
                </View>
                <Text style={s.trustLabel}>{completedJobs > 0 ? "Jobs done" : "Active & Ready"}</Text>
              </View>

              <View style={s.metricDivider} />

              <View style={s.trustItem}>
                <View style={s.trustIconRow}>
                  <MaterialIcons name={isInsured ? "shield" : "check-circle"} size={16} color={isInsured ? T.success : T.primaryMid} />
                  <Text style={s.trustVal}>{isInsured ? "Insured" : `${completionRate}%`}</Text>
                </View>
                <Text style={s.trustLabel}>{isInsured ? "Protected" : "Completion"}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* INDEX 1: STICKY SEGMENTED TABS */}
        <View style={s.stickyTabBar}>
          <View style={s.segmentWrap}>
            {TABS.map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[s.segmentItem, activeTab === tab && s.segmentItemActive]}
                accessibilityRole="tab"
                accessibilityState={{ selected: activeTab === tab }}
              >
                <Text style={[s.segmentText, activeTab === tab && s.segmentTextActive]}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* INDEX 2: TAB CONTENT */}
        <View style={s.tabContentWrapper}>

          {/* SERVICES TAB */}
          {activeTab === TABS[0] && (
            <View style={s.tabSection}>
              {services.length === 0 ? (
                <View style={s.emptyState}>
                  <View style={s.emptyIconCircle}>
                    <MaterialCommunityIcons name="tools" size={30} color={T.text3} />
                  </View>
                  <Text style={s.emptyText}>No services available right now.</Text>
                  <Text style={s.emptySubText}>Check back soon or try another provider.</Text>
                </View>
              ) : (
                <View style={s.serviceList}>
                  {services.map((service: any) => {
                    const iconInfo = getServiceIconInfo(service.name);
                    return (
                      <TouchableOpacity
                        key={service.id}
                        style={s.serviceCard}
                        activeOpacity={0.7}
                        onPress={() => router.push(`/(customer)/service/${service.id}` as any)}
                        accessibilityRole="button"
                        accessibilityLabel={`View ${service.name}, from $${Number(service.basePrice).toFixed(0)}`}
                      >
                        <View style={s.serviceInfo}>
                          <Text style={s.serviceTitle} numberOfLines={2}>{service.name}</Text>
                          <View style={s.serviceMetaRow}>
                            <MaterialCommunityIcons name="clock-outline" size={12} color={T.text3} />
                            <Text style={s.serviceMetaText}>{service.durationMin} mins</Text>
                            {service.isActive && (
                              <>
                                <View style={s.metaDot} />
                                <Text style={s.serviceMetaGreen}>Available</Text>
                              </>
                            )}
                          </View>
                          {service.description ? (
                            <Text style={s.serviceDesc} numberOfLines={2}>{service.description}</Text>
                          ) : null}
                          <View style={s.serviceFooterRow}>
                            <View>
                              <Text style={s.serviceFromLabel}>from</Text>
                              <Text style={s.servicePrice}>${Number(service.basePrice).toFixed(0)}</Text>
                            </View>
                            <View style={s.viewChip}>
                              <Text style={s.viewChipText}>View</Text>
                              <MaterialIcons name="chevron-right" size={14} color={T.text2} />
                            </View>
                          </View>
                        </View>

                        {service.image ? (
                          <Image source={{ uri: service.image }} style={s.serviceImg} contentFit="cover" />
                        ) : (
                          <View style={[s.serviceIconBox, { backgroundColor: iconInfo.bg }]}>
                            <MaterialCommunityIcons name={iconInfo.icon as any} size={30} color={iconInfo.color} />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          )}

          {/* REVIEWS TAB */}
          {activeTab === TABS[1] && (
            <View style={s.tabSection}>
              {reviewCount > 0 && (
                <View style={s.reviewsSummaryCard}>
                  <View style={s.reviewsSummaryLeft}>
                    <Text style={s.ratingMassive}>{rating}</Text>
                    <View style={s.starsRow}>
                      {[1, 2, 3, 4, 5].map(i => (
                        <MaterialIcons
                          key={i}
                          name={i <= Math.round(Number(rating)) ? "star" : "star-outline"}
                          size={14}
                          color={T.gold}
                        />
                      ))}
                    </View>
                    <Text style={s.reviewCountLabel}>Based on {reviewCount} verified bookings</Text>
                  </View>
                  <View style={s.reviewsSummaryRight}>
                    {ratingCounts.map(({ star, count }) => (
                      <View key={star} style={s.barRow}>
                        <Text style={s.barLabel}>{star}</Text>
                        <View style={s.barTrack}>
                          <View style={[s.barFill, { width: reviewCount > 0 ? `${Math.round((count / reviewCount) * 100)}%` : '0%' }]} />
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {companyReviews.length > 0 ? (
                companyReviews.map((review: any) => {
                  const stars = Math.round(review.companyRating ?? review.rating ?? 0);
                  return (
                    <View key={review.id} style={[s.reviewCard, { marginBottom: 14 }]}>
                      <View style={s.reviewHeader}>
                        <InitialsAvatar name={review.customer?.fullName || "Customer"} size={40} radius={13} />
                        <View style={{ flex: 1 }}>
                          <Text style={s.reviewName} numberOfLines={1}>{review.customer?.fullName || "Customer"}</Text>
                          <View style={s.reviewStarsRow}>
                            {[...Array(5)].map((_, i) => <MaterialIcons key={i} name={i < stars ? "star" : "star-outline"} size={12} color={T.gold} />)}
                            <Text style={s.reviewVerified}>· Verified booking</Text>
                          </View>
                        </View>
                        <Text style={s.reviewDate}>{new Date(review.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</Text>
                      </View>
                      {review.companyComment && (
                        <Text style={s.reviewBody}>{review.companyComment}</Text>
                      )}
                    </View>
                  );
                })
              ) : (
                <View style={s.emptyState}>
                  <View style={s.emptyIconCircle}>
                    <MaterialCommunityIcons name="star-outline" size={30} color={T.text3} />
                  </View>
                  <Text style={s.emptyText}>No reviews yet.</Text>
                  <Text style={s.emptySubText}>Be the first to book and rate this provider.</Text>
                </View>
              )}
            </View>
          )}

          {/* ABOUT TAB */}
          {activeTab === TABS[2] && (
            <View style={s.tabSection}>

              {/* Gallery */}
              <Text style={s.aboutTitle}>Service Showcase</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 24 }}>
                {services.filter((s: any) => s.image).map((s: any) => (
                  <Image key={s.id} source={{ uri: s.image }} style={s.galleryImg} />
                ))}
                {heroImage && <Image source={{ uri: heroImage }} style={s.galleryImg} />}
              </ScrollView>

              {/* Company Info */}
              <Text style={s.aboutTitle}>About provider</Text>
              <Text style={s.aboutDesc}>
                {company.description || "A highly rated service provider dedicated to quality and customer satisfaction."}
              </Text>

              <View style={s.infoListCard}>
                {company.establishedYear && (
                  <View style={[s.infoRow, s.infoRowBordered]}>
                    <View style={s.iconCircle}><MaterialIcons name="event" size={16} color={T.primaryMid} /></View>
                    <Text style={s.infoText}>Established in {company.establishedYear}</Text>
                  </View>
                )}
                <View style={[s.infoRow, s.infoRowBordered]}>
                  <View style={s.iconCircle}><MaterialIcons name="location-on" size={16} color={T.primaryMid} /></View>
                  <Text style={s.infoText}>{company.address ? `${company.address}, ${company.city}` : company.city}</Text>
                </View>
                {company.phone && (
                  <View style={s.infoRow}>
                    <View style={s.iconCircle}><MaterialIcons name="phone" size={16} color={T.primaryMid} /></View>
                    <Text style={s.infoText}>{company.phone}</Text>
                  </View>
                )}
              </View>

              {/* Location/Map placeholder */}
              {company.coverageRadiusKm ? (
                <>
                  <Text style={[s.aboutTitle, { marginTop: 24 }]}>Service Coverage Area</Text>
                  <View style={s.mapPlaceholder}>
                    <MaterialIcons name="map" size={26} color={T.primaryMid} style={{ marginBottom: 4 }} />
                    <Text style={s.mapText}>Serves up to {company.coverageRadiusKm} km from {company.city}</Text>
                  </View>
                </>
              ) : null}

            </View>
          )}
        </View>
      </Animated.ScrollView>

      {/* ── STICKY FOOTER (floating navy bar) ───────────────────── */}
      <View pointerEvents="box-none" style={[s.stickyFooter, { bottom: Platform.OS === 'ios' ? 10 : 10 }]}>
        <View>
          <Text style={s.footerLabel}>Starting at</Text>
          <Text style={s.footerPrice}>{lowestPrice !== null ? `$${lowestPrice.toFixed(0)}` : 'Free Quote'}</Text>
        </View>
        <ScaleButton
          onPress={() => {
            if (useAuthStore.getState().isGuest) return requireLogin();
            if (services.length === 0) return;
            const first = services[0];
            router.push(`/(customer)/service/${first.id}` as any);
          }}
        >
          <View style={s.footerBtn}>
            <Text style={s.footerBtnText}>Book Service</Text>
          </View>
        </ScaleButton>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  centerRoot: { flex: 1, backgroundColor: T.bg, alignItems: "center", justifyContent: "center", gap: 12 },
  errorText: { color: T.error, fontSize: 16, fontWeight: '600', marginTop: 12 },

  // Floating header that fills navy on scroll
  floatingHeaderRow: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20 },
  floatingHeaderBg: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(10, 25, 47, 0)' },
  floatingHeaderTitle: { position: 'absolute', bottom: 0, left: 0, right: 0, textAlign: 'center', fontSize: 16, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.3 },
  floatingHeaderContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 12, backgroundColor: 'transparent' },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: "rgba(10, 25, 47, 0.42)", borderWidth: 1, borderColor: "rgba(255,255,255,0.16)", ...CARD_SHADOW },

  // Hero
  heroContainer: { height: 250, backgroundColor: T.primary },
  heroScrim: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(10, 25, 47, 0.45)' },
  heroIdentity: { position: 'absolute', left: 24, right: 24, bottom: 0, paddingBottom: 58 },
  heroNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  heroName: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', flexShrink: 1, letterSpacing: -0.6, textShadowColor: 'rgba(0,0,0,0.35)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6 },
  verifiedChip: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  verifiedChipText: { fontSize: 10, fontWeight: '800', color: '#BFDBFE', letterSpacing: 0.3 },
  heroMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heroMetaText: { fontSize: 12.5, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },

  // Overlapping logo
  logoRow: { paddingHorizontal: 24, marginTop: -38, marginBottom: 4 },
  logoWrapper: { width: 76, height: 76, borderRadius: 22, backgroundColor: T.surface, borderWidth: 3, borderColor: T.surface, ...CARD_SHADOW, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  logoImg: { width: '100%', height: '100%' },

  // Trust band
  bentoContainer: { paddingHorizontal: 20, marginTop: 10 },
  trustMetrics: { flexDirection: 'row', backgroundColor: T.surface, borderRadius: 18, paddingVertical: 16, borderWidth: 1, borderColor: T.border, ...CARD_SHADOW, alignItems: 'center' },
  trustItem: { flex: 1, flexBasis: 0, minWidth: 0, alignItems: 'center' },
  trustIconRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2 },
  metricDivider: { width: 1, height: 30, backgroundColor: T.border, alignSelf: 'center', opacity: 0.8 },
  trustVal: { fontSize: 18, fontWeight: '800', color: T.text1, letterSpacing: -0.4 },
  trustLabel: { fontSize: 10, color: T.text3, fontWeight: '600', textTransform: "uppercase", letterSpacing: 0.4, marginTop: 2 },

  // Sticky segmented tabs
  stickyTabBar: { backgroundColor: T.surface, borderBottomWidth: 1, borderBottomColor: T.border, zIndex: 10, paddingVertical: 10, paddingHorizontal: 16 },
  segmentWrap: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 14, padding: 4 },
  segmentItem: { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  segmentItemActive: { backgroundColor: T.primary },
  segmentText: { fontSize: 13.5, fontWeight: '700', color: T.text2 },
  segmentTextActive: { color: '#FFFFFF' },

  // Tab Content Wrapper
  tabContentWrapper: { minHeight: 600, backgroundColor: T.bg },
  tabSection: { padding: 20 },
  emptyState: { alignItems: "center", paddingVertical: 44 },
  emptyIconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyText: { fontSize: 15, color: T.text2, fontWeight: "800" },
  emptySubText: { fontSize: 13, color: T.text3, fontWeight: "500", marginTop: 4 },

  // Services Cards
  serviceList: { gap: 14 },
  serviceCard: {
    flexDirection: 'row',
    backgroundColor: T.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: T.border,
    ...CARD_SHADOW,
    gap: 14,
    alignItems: 'center',
  },
  serviceInfo: { flex: 1 },
  serviceTitle: { fontSize: 16, fontWeight: '800', color: T.text1, marginBottom: 6, letterSpacing: -0.2, lineHeight: 21 },
  serviceMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  serviceMetaText: { fontSize: 12, fontWeight: '600', color: T.text3 },
  metaDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: T.text3 },
  serviceMetaGreen: { fontSize: 12, fontWeight: '700', color: T.success },
  serviceDesc: { fontSize: 13, color: T.text3, lineHeight: 18, marginBottom: 12 },
  serviceFooterRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  serviceFromLabel: { fontSize: 10, fontWeight: '700', color: T.text3, textTransform: 'uppercase', letterSpacing: 0.5 },
  servicePrice: { fontSize: 20, fontWeight: '900', color: T.text1, letterSpacing: -0.5, marginTop: 1 },
  viewChip: { flexDirection: 'row', alignItems: 'center', gap: 1, backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10 },
  viewChipText: { fontSize: 12.5, fontWeight: '700', color: T.text2 },
  serviceImg: { width: 88, height: 88, borderRadius: 14, backgroundColor: T.bg },
  serviceIconBox: { width: 88, height: 88, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },

  // Reviews Summary
  reviewsSummaryCard: { backgroundColor: T.surface, borderRadius: 18, padding: 20, borderWidth: 1, borderColor: T.border, flexDirection: "row", gap: 24, marginBottom: 20, ...CARD_SHADOW },
  reviewsSummaryLeft: { alignItems: "center", justifyContent: "center" },
  ratingMassive: { fontSize: 40, fontWeight: "900", color: T.text1, letterSpacing: -1 },
  starsRow: { flexDirection: "row", gap: 2, marginVertical: 4 },
  reviewCountLabel: { fontSize: 11, fontWeight: "700", color: T.text3, textAlign: 'center', width: 110 },
  reviewsSummaryRight: { flex: 1, gap: 6, justifyContent: 'center' },
  barRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  barLabel: { fontSize: 11, fontWeight: "700", color: T.text3, width: 8 },
  barTrack: { flex: 1, height: 6, backgroundColor: T.bg, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: T.gold, borderRadius: 3 },

  // Review List
  reviewCard: { backgroundColor: T.surface, padding: 18, borderRadius: 18, borderWidth: 1, borderColor: T.border, ...CARD_SHADOW },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  reviewName: { fontSize: 14.5, fontWeight: '800', color: T.text1 },
  reviewStarsRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  reviewVerified: { fontSize: 10.5, fontWeight: '600', color: T.text3 },
  reviewDate: { fontSize: 11.5, color: T.text3, fontWeight: '600' },
  reviewBody: { fontSize: 13.5, color: T.text2, lineHeight: 20 },

  // About Tab
  aboutTitle: { fontSize: 16, fontWeight: '800', color: T.text1, marginBottom: 16, letterSpacing: -0.3 },
  galleryImg: { width: 140, height: 100, borderRadius: 12, backgroundColor: T.bg, borderWidth: 1, borderColor: T.border },
  aboutDesc: { fontSize: 14, color: T.text2, lineHeight: 22, marginBottom: 20 },
  infoListCard: { backgroundColor: T.surface, borderRadius: 18, borderWidth: 1, borderColor: T.border, ...CARD_SHADOW, paddingHorizontal: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13 },
  infoRowBordered: { borderBottomWidth: 1, borderBottomColor: T.border },
  iconCircle: { width: 34, height: 34, borderRadius: 10, backgroundColor: T.inputBg, alignItems: 'center', justifyContent: 'center' },
  infoText: { fontSize: 13.5, fontWeight: '700', color: T.text1, flex: 1 },
  mapPlaceholder: { width: '100%', height: 110, backgroundColor: T.surface, borderRadius: 18, borderWidth: 1, borderColor: T.border, alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 20, ...CARD_SHADOW },
  mapText: { fontSize: 13, fontWeight: '700', color: T.text2 },

  // Sticky Checkout Footer — floating navy bar
  stickyFooter: { position: "absolute", bottom: 12, left: 16, right: 16, backgroundColor: T.primary, borderRadius: 18, paddingHorizontal: 20, paddingVertical: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center", ...CARD_SHADOW },
  footerLabel: { fontSize: 10, fontWeight: "800", color: 'rgba(255,255,255,0.65)', letterSpacing: 0.8, textTransform: 'uppercase' },
  footerPrice: { fontSize: 22, fontWeight: "900", color: '#FFFFFF', letterSpacing: -0.5 },
  footerBtn: { backgroundColor: '#FFFFFF', paddingHorizontal: 26, paddingVertical: 13, borderRadius: 14 },
  footerBtnText: { fontSize: 15, fontWeight: "800", color: T.primary, letterSpacing: 0.2 },
});
