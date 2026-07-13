/**
 * Company Profile Screen — Premium Redesign
 *
 * Design principles applied:
 * ─ Pure StyleSheet (no className mix)
 * ─ 8pt grid spacing
 * ─ Skeleton loading state
 * ─ Type scale contrast
 * ─ PressCard micro-interactions
 * ─ Deep Navy Premium Theme
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Image } from "expo-image";
import { ScrollView, Text, View, TouchableOpacity, RefreshControl, ActivityIndicator, Alert, StyleSheet, Animated, Easing, Pressable, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import ScaleButton from "@/components/ScaleButton";
import { useRouter, useLocalSearchParams } from "expo-router";
import { api } from "@/store/authStore";
import { useTranslation } from "react-i18next";

// ─────────────────────────────────────────────────────────────
// DESIGN TOKENS (Deep Navy Theme)
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

const SHADOW = {};

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
interface ServiceArea { city: string; coverageRadiusKm: number; }
interface RatingSummary { averageRating: number; totalReviews: number; }
interface StaffMember { id: string; }

interface ServiceItem {
  id: string; name: string; description?: string; basePrice: number;
  durationMin: number; durationMax?: number; image?: string;
  isActive: boolean; features?: string[];
}

interface CompanyDetail {
  id: string; name: string; description?: string; address?: string; city?: string;
  phone?: string; email?: string; logoUrl?: string; coverImageUrl?: string;
  verificationStatus?: string; cardHighlights?: any; establishedYear?: number;
  ratingSummary?: RatingSummary; serviceAreas?: ServiceArea[];
  staff?: StaffMember[]; services?: ServiceItem[];
  _count?: { services: number; bookings: number; };
}

// ─────────────────────────────────────────────────────────────
// HELPER
// ─────────────────────────────────────────────────────────────
const extractData = (res: any): any => {
  const d = res?.data;
  if (!d) return res;
  if (d?.data && typeof d.data === "object" && !Array.isArray(d.data)) return d.data;
  if (d && typeof d === "object" && !Array.isArray(d) && (d.name || d.id)) return d;
  return d;
};

// ─────────────────────────────────────────────────────────────
// UI COMPONENTS
// ─────────────────────────────────────────────────────────────
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
function CompanyProfileSkeleton() {
  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      {/* Hero */}
      <Skeleton width="100%" height={320} radius={0} />
      {/* Tabs */}
      <View style={{ flexDirection: "row", padding: 16, gap: 16 }}>
        {[...Array(5)].map((_, i) => <Skeleton key={i} width={64} height={16} radius={8} />)}
      </View>
      {/* Services List */}
      <View style={{ padding: 24, gap: 16 }}>
        {[...Array(3)].map((_, i) => (
          <View key={i} style={[s.serviceCard, { opacity: 1 - i * 0.15 }]}>
            <View style={{ flex: 1, gap: 8 }}>
              <Skeleton width="70%" height={16} radius={8} />
              <Skeleton width="40%" height={12} radius={6} />
              <Skeleton width="90%" height={10} radius={4} />
            </View>
            <Skeleton width={80} height={80} radius={12} />
          </View>
        ))}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────
export default function CompanyDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const TABS = [t('companyProfile.tabs.services'), t('companyProfile.tabs.reviews'), t('companyProfile.tabs.gallery'), t('companyProfile.tabs.location'), t('companyProfile.tabs.about')];

  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);

  const loadCompany = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const res = await api.get(`/api/companies/${id}`);
      setCompany(extractData(res));
      
      const checkRes = await api.get(`/api/saved-items/check`, { params: { itemType: 'company', itemIds: id } });
      const savedStatus = checkRes.data?.savedIds?.[0]?.saved;
      if (savedStatus) setIsSaved(true);
    } catch (e: any) {
      console.error("[CompanyDetail] failed:", e?.message);
      Alert.alert("Error", "Could not load company details.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { loadCompany(); }, [loadCompany]);

  const handleSaveToggle = async () => {
    if (isSaving) return;
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

  const handleStartChat = async () => {
    if (isStartingChat) return;
    setIsStartingChat(true);
    try {
      const res = await api.post("/api/conversations", { companyId: id });
      const conversationId = res.data?.data?.id ?? res.data?.id;
      if (conversationId) {
        router.push(`/(customer)/messages/${conversationId}?otherName=${encodeURIComponent(company?.name ?? "Company")}` as any);
      }
    } catch (e: any) {
      Alert.alert("Error", "Could not start conversation.");
    } finally {
      setIsStartingChat(false);
    }
  };

  if (isLoading) return <CompanyProfileSkeleton />;

  if (!company) {
    return (
      <SafeAreaView style={s.centerRoot}>
        <MaterialIcons name="storefront" size={64} color={T.text3} />
        <Text style={s.notFoundTitle}>{t('companyProfile.notFoundTitle')}</Text>
        <TouchableOpacity onPress={() => router.back()} style={s.goBackBtn}>
          <Text style={s.goBackBtnText}>{t('companyProfile.goBack')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const heroImage = company.coverImageUrl || company.logoUrl || `https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800`;
  const logoImage = company.logoUrl || `https://api.dicebear.com/9.x/initials/svg?seed=${company.name}`;
  const rating = company.ratingSummary ? Number(company.ratingSummary.averageRating).toFixed(1) : "New";
  const reviewCount = company.ratingSummary?.totalReviews ?? 0;
  const services = company.services ?? [];
  const lowestPrice = services.length > 0 ? Math.min(...services.map((s) => Number(s.basePrice))) : null;

  let highlights: string[] = [];
  try {
    if (Array.isArray(company.cardHighlights)) highlights = company.cardHighlights;
    else if (typeof company.cardHighlights === "string") highlights = JSON.parse(company.cardHighlights);
  } catch {}

  return (
    <SafeAreaView style={s.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadCompany} colors={[T.accent]} tintColor={T.accent} />}
      >
        {/* ── TOP APP BAR ───────────────────────────────────────── */}
        <View style={s.appBar}>
          <TouchableOpacity onPress={() => router.back()} style={s.iconBtn}>
            <MaterialIcons name="arrow-back" size={24} color={T.text1} />
          </TouchableOpacity>
          <Text style={s.appBarTitle}>{t('companyProfile.appBarTitle')}</Text>
          <TouchableOpacity onPress={handleSaveToggle} disabled={isSaving} style={s.iconBtn}>
            <MaterialCommunityIcons 
              name={isSaved ? "heart" : "heart-outline"} 
              size={24} 
              color={isSaved ? "#ED6B6B" : T.text1} 
            />
          </TouchableOpacity>
        </View>

        {/* ── HERO SECTION ──────────────────────────────────────── */}
        <View style={s.heroBox}>
          <Image source={{ uri: heroImage }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
          <View style={s.heroOverlay} />
          
          <View style={s.heroContent}>
            <View style={s.heroLogoBox}>
              <Image source={{ uri: logoImage }} style={s.heroLogo} contentFit="cover" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={s.heroNameRow}>
                <Text style={s.heroName} numberOfLines={1}>{company.name}</Text>
                {company.verificationStatus === "verified" && (
                  <MaterialIcons name="verified" size={18} color="#60A5FA" />
                )}
              </View>
              <View style={s.heroMetaRow}>
                <MaterialIcons name="star" size={14} color={T.gold} />
                <Text style={s.heroMetaText}>{rating} ({reviewCount} reviews)</Text>
              </View>
              <View style={s.heroMetaRow}>
                <MaterialIcons name="location-on" size={14} color="#93C5FD" />
                <Text style={s.heroMetaTextSub}>{company.city || t('companyProfile.cityNotListed')}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── HIGHLIGHTS CHIPS ──────────────────────────────────── */}
        {highlights.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.highlightsScroll}>
            {highlights.map((tag, i) => (
              <View key={i} style={s.highlightChip}>
                <Text style={s.highlightChipText}>{tag.toUpperCase()}</Text>
              </View>
            ))}
          </ScrollView>
        )}

        {/* ── ACTION BUTTONS ────────────────────────────────────── */}
        <View style={s.actionsRow}>
          <ScaleButton
            style={{ flex: 1 }}
            onPress={() => {
              if (services.length === 0) { Alert.alert("No services", "This company has no active services."); return; }
              const first = services[0];
              router.push(`/(customer)/company/service-modal/${first.id}?companyId=${company.id}` as any);
            }}
          >
            <View style={s.btnPrimary}>
              <Text style={s.btnPrimaryText}>{t('companyProfile.bookNow')}</Text>
            </View>
          </ScaleButton>
          <ScaleButton
            style={{ flex: 1 }}
            onPress={handleStartChat}
            disabled={isStartingChat}
          >
            <View style={s.btnSecondary}>
              {isStartingChat ? (
                <ActivityIndicator size="small" color={T.accent} />
              ) : (
                <Text style={s.btnSecondaryText}>{t('companyProfile.message')}</Text>
              )}
            </View>
          </ScaleButton>
        </View>

        {/* ── TAB NAVIGATION ────────────────────────────────────── */}
        <View style={s.tabsWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabsScroll}>
            {TABS.map((tab) => (
              <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={[s.tabItem, activeTab === tab && s.tabItemActive]}>
                <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── TAB CONTENT: SERVICES ─────────────────────────────── */}
        {activeTab === t('companyProfile.tabs.services') && (
          <View style={s.tabContent}>
            {services.length === 0 ? (
              <View style={s.emptyTabState}>
                <Text style={s.emptyIcon}>🛠️</Text>
                <Text style={s.emptyText}>{t('companyProfile.noServicesListed')}</Text>
              </View>
            ) : (
              <View style={{ gap: 16 }}>
                {services.map((service, idx) => {
                  const isFeatured = false;
                  return (
                    <PressCard
                      key={service.id}
                      onPress={() => router.push(`/(customer)/company/service-modal/${service.id}?companyId=${company.id}` as any)}
                    >
                      <View style={[s.serviceCard, isFeatured && s.serviceCardFeatured]}>
                        <View style={{ flex: 1 }}>
                          <Text style={[s.serviceTitle, isFeatured && s.serviceTitleFeatured]}>
                            {service.name}
                            {isFeatured && <Text style={s.featuredLabel}>  {t('companyProfile.featured')}</Text>}
                          </Text>
                          
                          <View style={s.serviceMetaRow}>
                            <MaterialIcons name="schedule" size={13} color={isFeatured ? "#93C5FD" : T.text2} />
                            <Text style={[s.serviceMetaText, isFeatured && { color: "#93C5FD" }]}>
                              {service.durationMin}{service.durationMax ? `–${service.durationMax}` : ""} {t('companyProfile.min')}
                            </Text>
                            <Text style={[s.serviceMetaText, isFeatured && { color: "#93C5FD" }]}>
                              • ${Number(service.basePrice).toFixed(2)}+
                            </Text>
                          </View>
                          
                          {service.description && (
                            <Text style={[s.serviceDesc, isFeatured && s.serviceDescFeatured]} numberOfLines={2}>
                              {service.description}
                            </Text>
                          )}
                          
                          {service.features && service.features.length > 0 && (
                            <View style={s.featureTagsRow}>
                              {service.features.slice(0, 3).map((f, fi) => (
                                <View key={fi} style={[s.featureTag, isFeatured && s.featureTagFeatured]}>
                                  <Text style={[s.featureTagText, isFeatured && s.featureTagTextFeatured]}>{f}</Text>
                                </View>
                              ))}
                            </View>
                          )}

                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation?.();
                              router.push(`/(customer)/company/service-modal/${service.id}?companyId=${company.id}` as any);
                            }}
                            style={[s.bookBtnSm, isFeatured && s.bookBtnSmFeatured]}
                          >
                            <Text style={[s.bookBtnSmText, isFeatured && s.bookBtnSmTextFeatured]}>{t('companyProfile.book')} · ${Number(service.basePrice).toFixed(2)}</Text>
                          </TouchableOpacity>
                        </View>
                        
                        {service.image && (
                          <Image source={{ uri: service.image }} style={s.serviceImg} contentFit="cover" />
                        )}
                      </View>
                    </PressCard>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* ── TAB CONTENT: REVIEWS ──────────────────────────────── */}
        {activeTab === t('companyProfile.tabs.reviews') && (
          <View style={s.tabContent}>
            <View style={s.reviewsSummaryCard}>
              <View style={s.reviewsSummaryLeft}>
                <Text style={s.ratingMassive}>{rating}</Text>
                <View style={s.starsRow}>
                  {[1,2,3,4,5].map(i => <MaterialIcons key={i} name="star" size={14} color={T.gold} />)}
                </View>
                <Text style={s.reviewCountLabel}>{reviewCount} {t('companyProfile.reviewsLabel')}</Text>
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
              <View style={s.reviewItemCard}>
                <View style={s.reviewItemHeader}>
                  <View style={s.reviewerAvatar}>
                    <MaterialIcons name="person" size={20} color={T.text3} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <Text style={s.reviewerName}>{t('companyProfile.verifiedCustomer')}</Text>
                      <View style={s.starsRow}>
                        {[1,2,3,4,5].map(i => <MaterialIcons key={i} name="star" size={10} color={T.gold} />)}
                      </View>
                    </View>
                    <Text style={s.reviewTime}>{t('companyProfile.recentBooking')}</Text>
                  </View>
                </View>
                <Text style={s.reviewBody}>{t('companyProfile.sampleReview')}</Text>
              </View>
            ) : (
              <View style={s.emptyTabState}>
                <Text style={s.emptyIcon}>⭐</Text>
                <Text style={s.emptyText}>{t('companyProfile.noReviewsYet')}</Text>
              </View>
            )}
          </View>
        )}

        {/* ── TAB CONTENT: GALLERY ──────────────────────────────── */}
        {activeTab === t('companyProfile.tabs.gallery') && (
          <View style={s.tabContent}>
            {services.length === 0 ? (
              <View style={s.emptyTabState}>
                <Text style={s.emptyIcon}>🖼️</Text>
                <Text style={s.emptyText}>{t('companyProfile.noGalleryImages')}</Text>
              </View>
            ) : (
              <View style={s.galleryGrid}>
                {services.filter(srv => srv.image).map(srv => (
                  <Image key={srv.id} source={{ uri: srv.image! }} style={s.galleryImg} contentFit="cover" />
                ))}
                {[heroImage, logoImage].filter(Boolean).map((uri, i) => (
                  <Image key={`ph-${i}`} source={{ uri }} style={s.galleryImg} contentFit="cover" />
                ))}
              </View>
            )}
          </View>
        )}

        {/* ── TAB CONTENT: LOCATION ─────────────────────────────── */}
        {activeTab === t('companyProfile.tabs.location') && (
          <View style={s.tabContent}>
            <View style={s.infoCard}>
              <View style={s.infoRow}>
                <MaterialIcons name="location-on" size={24} color={T.accent} />
                <View style={{ flex: 1 }}>
                  <Text style={s.infoTitle}>{company.name}</Text>
                  <Text style={s.infoDesc}>{company.address ? `${company.address}, ${company.city}` : company.city || t('companyProfile.addressNotListed')}</Text>
                </View>
              </View>
              
              {company.serviceAreas && company.serviceAreas.length > 0 && (
                <View style={s.serviceAreasBox}>
                  <Text style={s.serviceAreasTitle}>{t('companyProfile.serviceAreasTitle')}</Text>
                  <View style={s.serviceAreasTags}>
                    {company.serviceAreas.map((area, i) => (
                      <View key={i} style={s.areaTag}>
                        <Text style={s.areaTagText}>{area.city} ({area.coverageRadiusKm}{t('companyProfile.km')})</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              
              {company.phone && (
                <View style={s.contactRow}>
                  <MaterialIcons name="phone" size={18} color={T.accent} />
                  <Text style={s.contactText}>{company.phone}</Text>
                </View>
              )}
              
              {company.email && (
                <View style={s.contactRow}>
                  <MaterialIcons name="email" size={18} color={T.accent} />
                  <Text style={s.contactText}>{company.email}</Text>
                </View>
              )}
              
              <TouchableOpacity style={s.directionsBtn}>
                <Text style={s.directionsBtnText}>{t('companyProfile.getDirections')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── TAB CONTENT: ABOUT ────────────────────────────────── */}
        {activeTab === t('companyProfile.tabs.about') && (
          <View style={s.tabContent}>
            <View style={s.infoCard}>
              <View style={s.infoRow}>
                <MaterialIcons name="info" size={20} color={T.accent} />
                <Text style={s.infoTitle}>{t('companyProfile.aboutCompany', { name: company.name })}</Text>
              </View>
              <Text style={s.infoDescLg}>{company.description || t('companyProfile.noDescription')}</Text>
              {company.establishedYear && (
                <View style={[s.contactRow, { marginTop: 12, borderTopWidth: 0 }]}>
                  <MaterialIcons name="event" size={16} color={T.text3} />
                  <Text style={s.contactTextSub}>{t('companyProfile.establishedIn', { year: company.establishedYear })}</Text>
                </View>
              )}
            </View>

            <View style={s.infoCard}>
              <View style={s.infoRow}>
                <MaterialIcons name="schedule" size={20} color={T.accent} />
                <Text style={s.infoTitle}>{t('companyProfile.operatingHours')}</Text>
              </View>
              <Text style={s.infoDescLg}>{t('companyProfile.hoursDetails')}</Text>
              <View style={s.statusRow}>
                <View style={s.statusDot} />
                <Text style={s.contactTextSub}>{t('companyProfile.openNow')}</Text>
              </View>
            </View>

            {company.staff && company.staff.length > 0 && (
              <View style={s.infoCard}>
                <Text style={s.infoTitle}>{t('companyProfile.teamSize')}</Text>
                <View style={s.teamRow}>
                  <View style={s.avatarsStack}>
                    {[...Array(Math.min(company.staff.length, 4))].map((_, i) => (
                      <View key={i} style={s.avatarCircle}>
                        <MaterialIcons name="person" size={16} color={T.text3} />
                      </View>
                    ))}
                  </View>
                  <Text style={s.teamText}>{t(company.staff.length === 1 ? 'companyProfile.teamMember_one' : 'companyProfile.teamMember_other', { count: company.staff.length })}</Text>
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* ── STICKY FOOTER ─────────────────────────────────────── */}
      <View style={s.stickyFooter}>
        <View>
          <Text style={s.footerLabel}>{t('companyProfile.startingAt')}</Text>
          <Text style={s.footerPrice}>{lowestPrice !== null ? `$${lowestPrice.toFixed(2)}` : t('companyProfile.freeQuote')}</Text>
        </View>
        <TouchableOpacity
          style={s.footerBtn}
          onPress={() => {
            if (services.length === 0) return;
            const first = services[0];
            router.push(`/(customer)/company/service-modal/${first.id}?companyId=${company.id}` as any);
          }}
        >
          <Text style={s.footerBtnText}>{t('companyProfile.bookService')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  centerRoot: { flex: 1, backgroundColor: T.bg, alignItems: "center", justifyContent: "center", gap: 12 },
  
  // App bar
  appBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, height: 56, backgroundColor: T.surface, borderBottomWidth: 1, borderBottomColor: T.border },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  appBarTitle: { fontSize: 16, fontWeight: "800", color: T.text1, letterSpacing: -0.3 },

  // Hero
  heroBox: { width: "100%", height: 260, position: "relative" },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)" }, // Dark overlay matching Deep Navy
  heroContent: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 24, flexDirection: "row", alignItems: "flex-end", gap: 16 },
  heroLogoBox: { width: 72, height: 72, borderRadius: 16, backgroundColor: T.surface, padding: 2, borderWidth: 1, borderColor: T.border },
  heroLogo: { width: "100%", height: "100%", borderRadius: 14 },
  heroNameRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  heroName: { fontSize: 24, fontWeight: "800", color: "#fff", letterSpacing: -0.5 },
  heroMetaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  heroMetaText: { fontSize: 13, fontWeight: "700", color: "#fff" },
  heroMetaTextSub: { fontSize: 13, fontWeight: "500", color: "#93C5FD" },

  // Highlights
  highlightsScroll: { paddingHorizontal: 24, paddingVertical: 16, gap: 8 },
  highlightChip: { backgroundColor: T.accentLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  highlightChipText: { fontSize: 10, fontWeight: "800", color: T.accent, letterSpacing: 0.5 },

  // Actions
  actionsRow: { flexDirection: "row", paddingHorizontal: 24, paddingBottom: 16, gap: 12 },
  btnPrimary: { flex: 1, backgroundColor: T.accent, paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  btnPrimaryText: { fontSize: 15, fontWeight: "700", color: "#fff" },
  btnSecondary: { flex: 1, backgroundColor: T.accentLight, paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  btnSecondaryText: { fontSize: 15, fontWeight: "700", color: T.accent },

  // Tabs
  tabsWrapper: { backgroundColor: T.surface, borderBottomWidth: 1, borderBottomColor: T.border },
  tabsScroll: { paddingHorizontal: 16 },
  tabItem: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabItemActive: { borderBottomColor: T.accent },
  tabText: { fontSize: 14, fontWeight: "700", color: T.text3 },
  tabTextActive: { color: T.accent },

  // Tab Content Layout
  tabContent: { paddingHorizontal: 24, paddingVertical: 24 },
  
  emptyTabState: { alignItems: "center", paddingVertical: 40 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 14, color: T.text3 },

  // Services
  serviceCard: { backgroundColor: T.surface, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: T.border, ...SHADOW, flexDirection: "row", gap: 16 },
  serviceCardFeatured: { backgroundColor: T.accent, borderColor: T.accent },
  serviceTitle: { fontSize: 16, fontWeight: "800", color: T.text1, marginBottom: 6 },
  serviceTitleFeatured: { color: "#fff" },
  featuredLabel: { fontSize: 11, fontWeight: "600" },
  serviceMetaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  serviceMetaText: { fontSize: 12, fontWeight: "500", color: T.text2 },
  serviceDesc: { fontSize: 13, color: T.text2, lineHeight: 18, marginBottom: 12 },
  serviceDescFeatured: { color: "#93C5FD" },
  featureTagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 16 },
  featureTag: { backgroundColor: T.tag, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  featureTagFeatured: { backgroundColor: "rgba(255,255,255,0.15)" },
  featureTagText: { fontSize: 10, fontWeight: "700", color: T.text1 },
  featureTagTextFeatured: { color: "#fff" },
  bookBtnSm: { backgroundColor: T.accent, alignSelf: "flex-start", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  bookBtnSmFeatured: { backgroundColor: "#fff" },
  bookBtnSmText: { fontSize: 12, fontWeight: "800", color: "#fff" }, // wait text color for featured needs to be accent
  bookBtnSmTextFeatured: { color: T.accent },
  
  serviceImg: { width: 88, height: 88, borderRadius: 12, backgroundColor: T.accentLight },

  // Reviews
  reviewsSummaryCard: { backgroundColor: T.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: T.border, ...SHADOW, flexDirection: "row", gap: 24, marginBottom: 16 },
  reviewsSummaryLeft: { alignItems: "center", justifyContent: "center" },
  ratingMassive: { fontSize: 36, fontWeight: "800", color: T.text1 },
  starsRow: { flexDirection: "row", gap: 2, marginVertical: 4 },
  reviewCountLabel: { fontSize: 9, fontWeight: "800", color: T.text3, letterSpacing: 0.5 },
  reviewsSummaryRight: { flex: 1, gap: 4 },
  barRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  barLabel: { fontSize: 10, fontWeight: "700", color: T.text3, width: 8 },
  barTrack: { flex: 1, height: 6, backgroundColor: T.border, borderRadius: 3 },
  barFill: { height: 6, backgroundColor: T.accent, borderRadius: 3 },

  reviewItemCard: { backgroundColor: T.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: T.border, ...SHADOW },
  reviewItemHeader: { flexDirection: "row", gap: 12, marginBottom: 12 },
  reviewerAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: T.tag, alignItems: "center", justifyContent: "center" },
  reviewerName: { fontSize: 13, fontWeight: "700", color: T.text1 },
  reviewTime: { fontSize: 11, color: T.text3 },
  reviewBody: { fontSize: 13, color: T.text2, lineHeight: 20 },

  // Gallery
  galleryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  galleryImg: { width: "31.5%", aspectRatio: 1, borderRadius: 12, backgroundColor: T.accentLight },

  // Info Cards (Location & About)
  infoCard: { backgroundColor: T.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: T.border, ...SHADOW, marginBottom: 16 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  infoTitle: { fontSize: 15, fontWeight: "800", color: T.text1, flex: 1 },
  infoDesc: { fontSize: 13, color: T.text2, marginTop: 4 },
  infoDescLg: { fontSize: 14, color: T.text2, lineHeight: 22 },
  serviceAreasBox: { marginTop: 16 },
  serviceAreasTitle: { fontSize: 10, fontWeight: "800", color: T.text3, letterSpacing: 0.5, marginBottom: 8 },
  serviceAreasTags: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  areaTag: { backgroundColor: T.accentLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  areaTagText: { fontSize: 11, fontWeight: "700", color: T.accent },
  contactRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: T.border },
  contactText: { fontSize: 13, fontWeight: "600", color: T.text1 },
  contactTextSub: { fontSize: 13, color: T.text2 },
  directionsBtn: { backgroundColor: T.accent, borderRadius: 12, paddingVertical: 12, alignItems: "center", marginTop: 16 },
  directionsBtnText: { fontSize: 14, fontWeight: "700", color: "#fff" },

  statusRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: T.border },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: T.success },
  teamRow: { flexDirection: "row", alignItems: "center", gap: 16, marginTop: 12 },
  avatarsStack: { flexDirection: "row", marginLeft: 8 },
  avatarCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: T.tag, borderWidth: 2, borderColor: T.surface, alignItems: "center", justifyContent: "center", marginLeft: -8 },
  teamText: { fontSize: 14, fontWeight: "700", color: T.accent },

  // Sticky Footer
  stickyFooter: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "rgba(255,255,255,0.95)", borderTopWidth: 1, borderTopColor: T.border, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  footerLabel: { fontSize: 9, fontWeight: "800", color: T.text3, letterSpacing: 1 },
  footerPrice: { fontSize: 20, fontWeight: "800", color: T.accent },
  footerBtn: { backgroundColor: T.accent, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
  footerBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
  
  notFoundTitle: { fontSize: 18, fontWeight: "800", color: T.text1 },
  goBackBtn: { backgroundColor: T.accent, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  goBackBtnText: { fontSize: 14, fontWeight: "700", color: "#fff" },
});
