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
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;

  const loadCompany = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const res = await api.get(`/api/companies/${id}`);
      const data = res?.data?.data || res?.data;
      setCompany(data);

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
  }, [id]);

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
  const reviewCount = company.ratingSummary?.totalReviews || 0;
  const completedJobs = company.completedJobs || 0;
  const isInsured = company.isInsured || false;
  const completionRate = company.completionRate !== undefined ? Number(company.completionRate).toFixed(0) : 100;
  const services = company.services ?? [];
  const lowestPrice = services.length > 0 ? Math.min(...services.map((s: any) => Number(s.basePrice))) : null;

  return (
    <View style={s.root}>
      {/* ── FLOATING OVERLAY HEADER ───────────────────────────────── */}
      <View style={[s.floatingHeader, { paddingTop: Math.max(insets.top, 12) }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.iconBtn}>
          <MaterialIcons name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity onPress={() => Share.share({ message: `Check out ${company?.name} on Service Finder!` })} style={s.iconBtn}>
            <MaterialIcons name="share" size={18} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSaveToggle} disabled={isSaving} style={s.iconBtn}>
            <MaterialCommunityIcons name={isSaved ? "heart" : "heart-outline"} size={20} color={isSaved ? "#EF4444" : "#FFFFFF"} />
          </TouchableOpacity>
        </View>
      </View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
        stickyHeaderIndices={[1]}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadCompany} colors={[T.primary]} tintColor={T.primary} />}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* INDEX 0: HERO & INFO */}
        <View style={{ paddingBottom: 16 }}>
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
              <Image source={{ uri: heroImage }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
            ) : (
              <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#0B132B', overflow: 'hidden' }]}>
                {/* Decorative ambient lighting elements */}
                <View style={{ position: 'absolute', top: -50, right: -50, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(59, 130, 246, 0.18)' }} />
                <View style={{ position: 'absolute', bottom: -30, left: -30, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(16, 185, 129, 0.12)' }} />
                <View style={{ position: 'absolute', top: 50, right: 30, opacity: 0.10 }}>
                  <MaterialCommunityIcons name="shield-star-outline" size={130} color="#FFFFFF" />
                </View>
              </View>
            )}
            <View style={s.heroOverlay} />
          </Animated.View>

          {/* Logo & Title Row */}
          <View style={s.headerInfoBox}>
            <View style={s.logoWrapper}>
              {logoImage ? (
                <Image source={{ uri: logoImage }} style={s.logoImg} />
              ) : (
                <InitialsAvatar name={company.name} size={74} radius={20} />
              )}
            </View>
            <View style={{ flex: 1, paddingBottom: 4 }}>
              <View style={s.titleRow}>
                <Text style={s.companyName} numberOfLines={1}>{company.name}</Text>
                {company.verificationStatus === 'verified' && (
                  <MaterialIcons name="verified" size={18} color={T.blue} />
                )}
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <MaterialCommunityIcons name="map-marker-outline" size={14} color={T.text3} />
                <Text style={s.locationText}>{company.city || "Local Service Provider"}</Text>
              </View>
            </View>
          </View>

          {/* Trust Metrics Bento Grid */}
          <View style={s.bentoContainer}>
            <View style={s.trustMetrics}>
              <View style={s.trustItem}>
                <View style={[s.metricIconWrap, { backgroundColor: "rgba(245, 158, 11, 0.08)" }]}>
                  <MaterialIcons name="star" size={18} color={T.gold} />
                </View>
                <Text style={s.trustVal}>{rating}</Text>
                <Text style={s.trustLabel}>{reviewCount > 0 ? `${reviewCount} reviews` : "Verified Pro"}</Text>
              </View>
              
              <View style={s.metricDivider} />

              <View style={s.trustItem}>
                <View style={[s.metricIconWrap, { backgroundColor: "rgba(10, 25, 47, 0.06)" }]}>
                  <MaterialIcons name="work" size={18} color={T.primary} />
                </View>
                <Text style={s.trustVal}>{completedJobs > 1000 ? `${(completedJobs / 1000).toFixed(1)}k+` : completedJobs}</Text>
                <Text style={s.trustLabel}>{completedJobs > 0 ? "Jobs done" : "Active & Ready"}</Text>
              </View>

              <View style={s.metricDivider} />

              <View style={s.trustItem}>
                <View style={[s.metricIconWrap, { backgroundColor: isInsured ? "rgba(16, 185, 129, 0.08)" : "rgba(37, 99, 235, 0.08)" }]}>
                  <MaterialIcons name={isInsured ? "shield" : "check-circle"} size={18} color={isInsured ? T.success : T.blue} />
                </View>
                <Text style={s.trustVal}>{isInsured ? "Insured" : `${completionRate}%`}</Text>
                <Text style={s.trustLabel}>{isInsured ? "Protected" : "Completion"}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* INDEX 1: STICKY TAB BAR */}
        <View style={s.stickyTabBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabsScroll}>
            {TABS.map((tab) => (
              <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={[s.tabItem, activeTab === tab && s.tabItemActive]}>
                <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* INDEX 2: TAB CONTENT */}
        <View style={s.tabContentWrapper}>

          {/* SERVICES TAB */}
          {activeTab === TABS[0] && (
            <View style={s.tabSection}>
              {services.length === 0 ? (
                <View style={s.emptyState}>
                  <Text style={s.emptyIcon}>🛠️</Text>
                  <Text style={s.emptyText}>No services available right now.</Text>
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
                      >
                        <View style={s.serviceInfo}>
                          <Text style={s.serviceTitle}>{service.name}</Text>
                          
                          <View style={s.serviceMetaRow}>
                            <View style={s.durationPill}>
                              <MaterialCommunityIcons name="clock-outline" size={11} color={T.text2} />
                              <Text style={s.durationText}>{service.durationMin} mins</Text>
                            </View>
                            <View style={s.pricePill}>
                              <Text style={s.pricePillText}>${Number(service.basePrice).toFixed(0)}</Text>
                            </View>
                          </View>

                          {service.description && (
                            <Text style={s.serviceDesc} numberOfLines={2}>{service.description}</Text>
                          )}

                          <View style={s.serviceFooterRow}>
                            <Text style={s.viewDetailsLink}>View Details</Text>
                            <MaterialIcons name="chevron-right" size={15} color={T.primary} />
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
              <View style={s.reviewsSummaryCard}>
                <View style={s.reviewsSummaryLeft}>
                  <Text style={s.ratingMassive}>{rating}</Text>
                  <View style={s.starsRow}>
                    {[1, 2, 3, 4, 5].map(i => <MaterialIcons key={i} name="star" size={14} color={T.gold} />)}
                  </View>
                  <Text style={s.reviewCountLabel}>Based on {reviewCount} reviews</Text>
                </View>
                <View style={s.reviewsSummaryRight}>
                  {[5, 4, 3, 2, 1].map((r) => (
                    <View key={r} style={s.barRow}>
                      <Text style={s.barLabel}>{r}</Text>
                      <View style={s.barTrack}>
                        <View style={[s.barFill, { width: `${r === 5 ? 80 : r === 4 ? 15 : r === 3 ? 4 : 1}%` }]} />
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              {reviewCount > 0 ? (
                <View style={s.reviewCard}>
                  <View style={s.reviewHeader}>
                    <InitialsAvatar name="John D." size={40} radius={14} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.reviewName}>John D. <Text style={{ fontSize: 11, color: T.success, fontWeight: "600" }}>(Verified)</Text></Text>
                      <View style={{ flexDirection: 'row', marginTop: 2 }}>
                        {[...Array(5)].map((_, i) => <MaterialIcons key={i} name="star" size={12} color={T.gold} />)}
                      </View>
                    </View>
                    <Text style={s.reviewDate}>2 weeks ago</Text>
                  </View>
                  <Text style={s.reviewBody}>"Absolutely fantastic service. They arrived exactly on time, were extremely professional, and finished the job perfectly. Highly recommend!"</Text>
                </View>
              ) : (
                <View style={s.emptyState}>
                  <Text style={s.emptyIcon}>⭐</Text>
                  <Text style={s.emptyText}>No reviews yet.</Text>
                </View>
              )}
            </View>
          )}

          {/* ABOUT TAB */}
          {activeTab === TABS[2] && (
            <View style={s.tabSection}>

              {/* Gallery Mini */}
              <Text style={s.aboutTitle}>Service Showcase</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 24 }}>
                {services.filter((s: any) => s.image).map((s: any) => (
                  <Image key={s.id} source={{ uri: s.image }} style={s.galleryImg} />
                ))}
                {heroImage && <Image source={{ uri: heroImage }} style={s.galleryImg} />}
              </ScrollView>

              <View style={s.divider} />

              {/* Company Info */}
              <Text style={s.aboutTitle}>About provider</Text>
              <Text style={s.aboutDesc}>
                {company.description || "A highly rated service provider dedicated to quality and customer satisfaction."}
              </Text>

              <View style={s.infoList}>
                <View style={s.infoRow}>
                  <View style={s.iconCircle}><MaterialIcons name="event" size={18} color={T.primary} /></View>
                  <Text style={s.infoText}>Established in {company.establishedYear || "2015"}</Text>
                </View>
                <View style={s.infoRow}>
                  <View style={s.iconCircle}><MaterialIcons name="location-on" size={18} color={T.primary} /></View>
                  <Text style={s.infoText}>{company.address ? `${company.address}, ${company.city}` : company.city}</Text>
                </View>
                {company.phone && (
                  <View style={s.infoRow}>
                    <View style={s.iconCircle}><MaterialIcons name="phone" size={18} color={T.primary} /></View>
                    <Text style={s.infoText}>{company.phone}</Text>
                  </View>
                )}
              </View>

              <View style={s.divider} />

              {/* Location/Map placeholder */}
              <Text style={s.aboutTitle}>Service Coverage Area</Text>
              <View style={s.mapPlaceholder}>
                <MaterialIcons name="map" size={28} color={T.primary} style={{ marginBottom: 4 }} />
                <Text style={s.mapText}>Serves up to 25 miles from {company.city}</Text>
              </View>

            </View>
          )}
        </View>
      </Animated.ScrollView>

      {/* ── STICKY FOOTER ─────────────────────────────────────── */}
      <View style={s.stickyFooter}>
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

  // Floating Overlaid Circular Action Buttons
  floatingHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 12, backgroundColor: 'transparent' },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: "rgba(10, 25, 47, 0.4)", borderWidth: 1, borderColor: "rgba(255,255,255,0.15)", ...CARD_SHADOW },

  // Hero Area
  heroContainer: { height: 240, backgroundColor: T.primary },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10, 25, 47, 0.15)' },

  // Overlapping Identity Box
  headerInfoBox: { paddingHorizontal: 24, flexDirection: 'row', alignItems: 'flex-end', gap: 16, marginTop: -36 },
  logoWrapper: { width: 80, height: 80, borderRadius: 20, backgroundColor: T.surface, borderWidth: 3, borderColor: T.surface, ...CARD_SHADOW, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  logoImg: { width: '100%', height: '100%' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  companyName: { fontSize: 22, fontWeight: '800', color: T.text1, flexShrink: 1, letterSpacing: -0.5 },
  locationText: { fontSize: 13, color: T.text2, fontWeight: '600' },

  // Bento Trust Box
  bentoContainer: { paddingHorizontal: 20, marginTop: 16 },
  trustMetrics: { flexDirection: 'row', backgroundColor: T.surface, borderRadius: 20, paddingVertical: 14, borderWidth: 1, borderColor: T.border, ...CARD_SHADOW, alignItems: 'center' },
  trustItem: { flex: 1, flexBasis: 0, minWidth: 0, alignItems: 'center' },
  metricDivider: { width: 1, height: 32, backgroundColor: T.border, alignSelf: 'center', opacity: 0.8 },
  metricIconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  trustVal: { fontSize: 15, fontWeight: '800', color: T.text1, letterSpacing: -0.3 },
  trustLabel: { fontSize: 10, color: T.text3, fontWeight: '600', textTransform: "uppercase", marginTop: 2 },

  // Sticky Tab Bar
  stickyTabBar: { backgroundColor: T.surface, borderBottomWidth: 1, borderBottomColor: T.border, zIndex: 10 },
  tabsScroll: { paddingHorizontal: 16 },
  tabItem: { paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabItemActive: { borderBottomColor: T.primary },
  tabText: { fontSize: 14, fontWeight: "700", color: T.text3 },
  tabTextActive: { color: T.primary },

  // Tab Content Wrapper
  tabContentWrapper: { minHeight: 600, backgroundColor: T.bg },
  tabSection: { padding: 20 },
  emptyState: { alignItems: "center", paddingVertical: 40 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 14, color: T.text3, fontWeight: "600" },

  // Services Cards
  serviceList: { gap: 14 },
  serviceCard: {
    flexDirection: 'row',
    backgroundColor: T.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: T.border,
    ...CARD_SHADOW,
    gap: 14,
    alignItems: 'center',
  },
  serviceInfo: { flex: 1 },
  serviceTitle: { fontSize: 16, fontWeight: '800', color: T.text1, marginBottom: 6, letterSpacing: -0.2 },
  serviceMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  durationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: T.bg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: T.border,
  },
  durationText: { fontSize: 11, fontWeight: '600', color: T.text2 },
  pricePill: {
    backgroundColor: 'rgba(10, 25, 47, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pricePillText: { fontSize: 12, fontWeight: '800', color: T.primary },
  serviceDesc: { fontSize: 12, color: T.text3, lineHeight: 16, marginBottom: 10 },
  serviceFooterRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewDetailsLink: { fontSize: 12, fontWeight: '700', color: T.primary },
  serviceImg: { width: 80, height: 80, borderRadius: 16, backgroundColor: T.bg },
  serviceIconBox: { width: 80, height: 80, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },

  // Reviews Summary
  reviewsSummaryCard: { backgroundColor: T.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: T.border, flexDirection: "row", gap: 24, marginBottom: 20, ...CARD_SHADOW },
  reviewsSummaryLeft: { alignItems: "center", justifyContent: "center" },
  ratingMassive: { fontSize: 40, fontWeight: "900", color: T.text1, letterSpacing: -1 },
  starsRow: { flexDirection: "row", gap: 2, marginVertical: 4 },
  reviewCountLabel: { fontSize: 11, fontWeight: "700", color: T.text3 },
  reviewsSummaryRight: { flex: 1, gap: 6, justifyContent: 'center' },
  barRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  barLabel: { fontSize: 11, fontWeight: "700", color: T.text3, width: 8 },
  barTrack: { flex: 1, height: 6, backgroundColor: T.bg, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: T.gold, borderRadius: 3 },

  // Review List
  reviewCard: { backgroundColor: T.surface, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: T.border, ...CARD_SHADOW },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  reviewName: { fontSize: 15, fontWeight: '800', color: T.text1 },
  reviewDate: { fontSize: 12, color: T.text3, fontWeight: '600' },
  reviewBody: { fontSize: 13, color: T.text2, lineHeight: 20 },

  // About Tab
  aboutTitle: { fontSize: 16, fontWeight: '800', color: T.text1, marginBottom: 16, letterSpacing: -0.3 },
  galleryImg: { width: 140, height: 100, borderRadius: 12, backgroundColor: T.bg, borderWidth: 1, borderColor: T.border },
  divider: { height: 1, backgroundColor: T.border, marginVertical: 20 },
  aboutDesc: { fontSize: 14, color: T.text2, lineHeight: 22, marginBottom: 20 },
  infoList: { gap: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconCircle: { width: 36, height: 36, borderRadius: 10, backgroundColor: T.inputBg, alignItems: 'center', justifyContent: 'center' },
  infoText: { fontSize: 14, fontWeight: '700', color: T.text1 },
  mapPlaceholder: { width: '100%', height: 120, backgroundColor: T.inputBg, borderRadius: 20, borderWidth: 1, borderColor: T.border, alignItems: 'center', justifyContent: 'center', gap: 4 },
  mapText: { fontSize: 13, fontWeight: '700', color: T.text2 },

  // Sticky Checkout Footer
  stickyFooter: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: T.surface, borderTopWidth: 1, borderTopColor: T.border, paddingHorizontal: 24, paddingTop: 16, paddingBottom: Platform.OS === 'ios' ? 34 : 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center", ...CARD_SHADOW },
  footerLabel: { fontSize: 10, fontWeight: "800", color: T.text3, letterSpacing: 0.8, textTransform: 'uppercase' },
  footerPrice: { fontSize: 24, fontWeight: "900", color: T.primary, letterSpacing: -0.5 },
  footerBtn: { backgroundColor: T.primary, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 16, ...CARD_SHADOW },
  footerBtnText: { fontSize: 16, fontWeight: "800", color: "#fff", letterSpacing: 0.5 },
});
