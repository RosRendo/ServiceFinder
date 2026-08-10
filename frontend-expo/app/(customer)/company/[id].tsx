import React, { useState, useEffect, useCallback, useRef } from "react";
import { ScrollView, Text, View, TouchableOpacity, RefreshControl, ActivityIndicator, Alert, StyleSheet, Animated, Easing, Pressable, Platform, Dimensions } from "react-native";
import { Image } from "expo-image";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { api, useAuthStore } from "@/store/authStore";
import { useTranslation } from "react-i18next";
import { Theme } from "@/constants/theme";
import ScaleButton from "@/components/ScaleButton";
import { Share } from "react-native";

const T = Theme.colors;
const { width } = Dimensions.get('window');

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 },
  android: { elevation: 3 },
});

interface ServiceItem {
  id: string; name: string; description?: string; basePrice: number;
  durationMin: number; durationMax?: number; image?: string; features?: string[];
}

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
          // Ignore 401 errors for unauthenticated users
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
        <ActivityIndicator size="large" color={T.accent} />
      </View>
    );
  }

  if (!company) {
    return (
      <SafeAreaView style={s.centerRoot}>
        <MaterialIcons name="storefront" size={64} color={T.text3} />
        <Text style={s.errorText}>Provider not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: T.accent, fontWeight: '600' }}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const heroImage = company.coverImageUrl || `https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800`;
  const logoImage = company.logoUrl || `https://api.dicebear.com/9.x/initials/svg?seed=${company.name}`;
  const rating = company.ratingSummary?.averageRating ? Number(company.ratingSummary.averageRating).toFixed(1) : "New";
  const reviewCount = company.ratingSummary?.totalReviews || 0;
  const completedJobs = company.completedJobs || 0;
  const isInsured = company.isInsured || false;
  const completionRate = company.completionRate !== undefined ? Number(company.completionRate).toFixed(0) : 100;
  const services = company.services ?? [];
  const lowestPrice = services.length > 0 ? Math.min(...services.map((s: any) => Number(s.basePrice))) : null;

  return (
    <View style={s.root}>
      {/* ── FLOATING HEADER ───────────────────────────────────────── */}
      <View style={[s.floatingHeader, { paddingTop: Math.max(insets.top, 16) }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.iconBtn}>
          <MaterialIcons name="arrow-back" size={24} color={T.text1} />
        </TouchableOpacity>
        
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity onPress={() => Share.share({ message: `Check out ${company?.name} on Service Finder!` })} style={s.iconBtn}>
            <MaterialIcons name="share" size={20} color={T.text1} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSaveToggle} disabled={isSaving} style={s.iconBtn}>
            <MaterialCommunityIcons name={isSaved ? "heart" : "heart-outline"} size={22} color={isSaved ? "#ED6B6B" : T.text1} />
          </TouchableOpacity>
        </View>
      </View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }} // Space for sticky footer
        stickyHeaderIndices={[1]} // Makes the Tab Bar (index 1) sticky!
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadCompany} colors={[T.accent]} tintColor={T.accent} />}
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
            <Image source={{ uri: heroImage }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
            <View style={s.heroOverlay} />
          </Animated.View>

          {/* Logo & Title Row (Overlapping the hero image slightly) */}
          <View style={s.headerInfoBox}>
            <View style={s.logoWrapper}>
              <Image source={{ uri: logoImage }} style={s.logoImg} />
            </View>
            <View style={{ flex: 1, paddingBottom: 4 }}>
              <View style={s.titleRow}>
                <Text style={s.companyName} numberOfLines={1}>{company.name}</Text>
                {company.verificationStatus === 'verified' && (
                  <MaterialIcons name="verified" size={20} color="#3B82F6" />
                )}
              </View>
              <Text style={s.locationText}>{company.city || "Local Service Provider"}</Text>
            </View>
          </View>

          {/* Trust Metrics (ZERO ANXIETY) */}
          <View style={s.trustMetrics}>
            <View style={s.trustItem}>
              <View style={s.trustValRow}>
                <MaterialIcons name="star" size={16} color="#F59E0B" />
                <Text style={s.trustVal}>{rating}</Text>
              </View>
              <Text style={s.trustLabel}>{reviewCount} reviews</Text>
            </View>
            <View style={s.trustDivider} />
            <View style={s.trustItem}>
              <View style={s.trustValRow}>
                <MaterialIcons name="work" size={16} color={T.text2} />
                <Text style={s.trustVal}>{completedJobs > 1000 ? `${(completedJobs/1000).toFixed(1)}k+` : completedJobs}</Text>
              </View>
              <Text style={s.trustLabel}>Jobs done</Text>
            </View>
            <View style={s.trustDivider} />
            <View style={s.trustItem}>
              <View style={s.trustValRow}>
                {isInsured ? (
                  <>
                    <MaterialIcons name="shield" size={16} color="#10B981" />
                    <Text style={s.trustVal}>Insured</Text>
                  </>
                ) : (
                  <>
                    <MaterialIcons name="check-circle" size={16} color="#3B82F6" />
                    <Text style={s.trustVal}>{completionRate}%</Text>
                  </>
                )}
              </View>
              <Text style={s.trustLabel}>{isInsured ? "Protected" : "Completion"}</Text>
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
                  <Text style={s.emptyText}>No services available.</Text>
                </View>
              ) : (
                <View style={s.serviceList}>
                  {services.map((service: any, idx: number) => (
                    <TouchableOpacity 
                      key={service.id} 
                      style={s.serviceCard}
                      onPress={() => router.push(`/(customer)/service/${service.id}` as any)}
                    >
                      <View style={s.serviceInfo}>
                        <Text style={s.serviceTitle}>{service.name}</Text>
                        <Text style={s.serviceMeta}>
                          {service.durationMin} mins • Starting at ${service.basePrice}
                        </Text>
                        {service.description && (
                          <Text style={s.serviceDesc} numberOfLines={2}>{service.description}</Text>
                        )}
                        <View style={s.bookBtnSm}>
                          <Text style={s.bookBtnSmText}>View Details</Text>
                        </View>
                      </View>
                      {service.image ? (
                        <Image source={{ uri: service.image }} style={s.serviceImg} />
                      ) : (
                        <View style={s.serviceImgPlaceholder}>
                          <MaterialIcons name="image" size={24} color={T.text3} />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
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
                    {[1, 2, 3, 4, 5].map(i => <MaterialIcons key={i} name="star" size={14} color="#F59E0B" />)}
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
                    <View style={s.reviewAvatar}><Text style={s.reviewAvatarText}>J</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.reviewName}>John D. (Verified)</Text>
                      <View style={{ flexDirection: 'row', marginTop: 2 }}>
                        {[...Array(5)].map((_, i) => <MaterialIcons key={i} name="star" size={12} color="#F59E0B" />)}
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
              <Text style={s.aboutTitle}>Gallery</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 24 }}>
                {services.filter((s:any)=>s.image).map((s:any) => (
                  <Image key={s.id} source={{ uri: s.image }} style={s.galleryImg} />
                ))}
                <Image source={{ uri: heroImage }} style={s.galleryImg} />
                <Image source={{ uri: logoImage }} style={s.galleryImg} />
              </ScrollView>

              <View style={s.divider} />

              {/* Company Info */}
              <Text style={s.aboutTitle}>About {company.name}</Text>
              <Text style={s.aboutDesc}>
                {company.description || "A highly rated service provider dedicated to quality and customer satisfaction."}
              </Text>
              
              <View style={s.infoList}>
                <View style={s.infoRow}>
                  <MaterialIcons name="event" size={20} color={T.accent} />
                  <Text style={s.infoText}>Established in {company.establishedYear || "2015"}</Text>
                </View>
                <View style={s.infoRow}>
                  <MaterialIcons name="location-on" size={20} color={T.accent} />
                  <Text style={s.infoText}>{company.address ? `${company.address}, ${company.city}` : company.city}</Text>
                </View>
                {company.phone && (
                  <View style={s.infoRow}>
                    <MaterialIcons name="phone" size={20} color={T.accent} />
                    <Text style={s.infoText}>{company.phone}</Text>
                  </View>
                )}
              </View>

              <View style={s.divider} />
              
              {/* Location/Map placeholder */}
              <Text style={s.aboutTitle}>Service Area</Text>
              <View style={s.mapPlaceholder}>
                <MaterialIcons name="map" size={32} color={T.accent} />
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
          <Text style={s.footerPrice}>{lowestPrice !== null ? `$${lowestPrice.toFixed(2)}` : 'Free Quote'}</Text>
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
  
  // Floating Header
  floatingHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 12, backgroundColor: 'rgba(255,255,255,0.95)', borderBottomWidth: 1, borderColor: T.border },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, ...CARD_SHADOW },
  
  // Hero
  heroContainer: { height: 220, backgroundColor: T.border },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.05)' },
  
  // Header Info
  headerInfoBox: { paddingHorizontal: 24, flexDirection: 'row', alignItems: 'flex-end', gap: 16, marginTop: -32 },
  logoWrapper: { width: 80, height: 80, borderRadius: 16, backgroundColor: T.surface, borderWidth: 3, borderColor: T.surface, ...CARD_SHADOW, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  logoImg: { width: '100%', height: '100%' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  companyName: { fontSize: 22, fontWeight: '900', color: T.text1, flexShrink: 1, letterSpacing: -0.5 },
  locationText: { fontSize: 13, color: T.text2, fontWeight: '600' },

  // Trust Metrics
  trustMetrics: { flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center', paddingVertical: 20, paddingHorizontal: 24, marginTop: 8 },
  trustItem: { alignItems: 'center', gap: 4 },
  trustValRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trustVal: { fontSize: 15, fontWeight: '800', color: T.text1 },
  trustLabel: { fontSize: 12, color: T.text3, fontWeight: '600' },
  trustDivider: { width: 1, height: 24, backgroundColor: T.border },

  // Sticky Tab Bar
  stickyTabBar: { backgroundColor: T.surface, borderBottomWidth: 1, borderColor: T.border, zIndex: 10 },
  tabsScroll: { paddingHorizontal: 16 },
  tabItem: { paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabItemActive: { borderBottomColor: T.accent },
  tabText: { fontSize: 14, fontWeight: "700", color: T.text3 },
  tabTextActive: { color: T.accent },

  // Tab Content
  tabContentWrapper: { minHeight: 600, backgroundColor: T.bg },
  tabSection: { padding: 24 },
  emptyState: { alignItems: "center", paddingVertical: 40 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 14, color: T.text3 },

  // Services
  serviceList: { gap: 16 },
  serviceCard: { flexDirection: 'row', backgroundColor: T.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: T.border, ...CARD_SHADOW, gap: 16 },
  serviceInfo: { flex: 1, justifyContent: 'space-between' },
  serviceTitle: { fontSize: 16, fontWeight: '800', color: T.text1, marginBottom: 4 },
  serviceMeta: { fontSize: 12, fontWeight: '600', color: T.text2, marginBottom: 8 },
  serviceDesc: { fontSize: 13, color: T.text3, lineHeight: 18, marginBottom: 12 },
  bookBtnSm: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, backgroundColor: T.bg, borderRadius: 8, borderWidth: 1, borderColor: T.border },
  bookBtnSmText: { fontSize: 12, fontWeight: '700', color: T.text1 },
  serviceImg: { width: 88, height: 88, borderRadius: 12, backgroundColor: T.bg },
  serviceImgPlaceholder: { width: 88, height: 88, borderRadius: 12, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: T.border },

  // Reviews
  reviewsSummaryCard: { backgroundColor: T.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: T.border, flexDirection: "row", gap: 24, marginBottom: 24 },
  reviewsSummaryLeft: { alignItems: "center", justifyContent: "center" },
  ratingMassive: { fontSize: 40, fontWeight: "900", color: T.text1, letterSpacing: -1 },
  starsRow: { flexDirection: "row", gap: 2, marginVertical: 4 },
  reviewCountLabel: { fontSize: 10, fontWeight: "700", color: T.text3 },
  reviewsSummaryRight: { flex: 1, gap: 6, justifyContent: 'center' },
  barRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  barLabel: { fontSize: 11, fontWeight: "700", color: T.text3, width: 8 },
  barTrack: { flex: 1, height: 6, backgroundColor: T.bg, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: '#F59E0B', borderRadius: 3 },
  
  reviewCard: { backgroundColor: T.surface, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: T.border, ...CARD_SHADOW },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  reviewAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: T.border },
  reviewAvatarText: { fontSize: 18, fontWeight: '800', color: T.text2 },
  reviewName: { fontSize: 15, fontWeight: '800', color: T.text1 },
  reviewDate: { fontSize: 12, color: T.text3, fontWeight: '600' },
  reviewBody: { fontSize: 14, color: T.text2, lineHeight: 22 },

  // About
  aboutTitle: { fontSize: 18, fontWeight: '900', color: T.text1, marginBottom: 16, letterSpacing: -0.5 },
  galleryImg: { width: 140, height: 100, borderRadius: 12, backgroundColor: T.bg, borderWidth: 1, borderColor: T.border },
  divider: { height: 1, backgroundColor: T.border, marginVertical: 24 },
  aboutDesc: { fontSize: 15, color: T.text2, lineHeight: 24, marginBottom: 24 },
  infoList: { gap: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoText: { fontSize: 14, fontWeight: '600', color: T.text1 },
  mapPlaceholder: { width: '100%', height: 140, backgroundColor: T.bg, borderRadius: 16, borderWidth: 1, borderColor: T.border, alignItems: 'center', justifyContent: 'center', gap: 8 },
  mapText: { fontSize: 13, fontWeight: '600', color: T.text2 },

  // Sticky Footer
  stickyFooter: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "rgba(255,255,255,0.98)", borderTopWidth: 1, borderTopColor: T.border, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  footerLabel: { fontSize: 10, fontWeight: "800", color: T.text3, letterSpacing: 1, textTransform: 'uppercase' },
  footerPrice: { fontSize: 24, fontWeight: "900", color: T.accent, letterSpacing: -0.5 },
  footerBtn: { backgroundColor: T.accent, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 12, ...CARD_SHADOW },
  footerBtnText: { fontSize: 16, fontWeight: "800", color: "#fff", letterSpacing: 0.5 },
});
