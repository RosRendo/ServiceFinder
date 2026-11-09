import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Dimensions, Platform, Animated, Alert } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { api, useAuthStore } from '@/store/authStore';
import { Theme } from '@/constants/theme';
import ScaleButton from '@/components/ScaleButton';
import BookingBottomSheet from '@/components/BookingBottomSheet';
import FadeIn from '@/components/FadeIn';
import { SatisfactionShieldSvg, FreeCancelClockSvg, DamageCoverUmbrellaSvg } from '@/components/svg';

const T = Theme.colors;
const { width } = Dimensions.get('window');

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 },
  android: { elevation: 3 },
});

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isGuest } = useAuthStore();
  
  const [service, setService] = useState<any>(null);
  const [crossSells, setCrossSells] = useState<any[]>([]);
  const [otherProviders, setOtherProviders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Animation State
  const scrollY = useRef(new Animated.Value(0)).current;

  // Booking Sheet State
  const [sheetVisible, setSheetVisible] = useState(false);
  
  // Save State
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
        const srvRes = await api.get(`/api/services/${id}`);
        const serviceData = srvRes.data.data || srvRes.data;
        setService(serviceData);
        
        const trendsRes = await api.get(`/api/services`);
        const trendsData = Array.isArray(trendsRes.data.data) ? trendsRes.data.data : (trendsRes.data?.data?.data || []);
        // Exclude current service
        const others = trendsData.filter((s: any) => s.id !== id).slice(0, 4);
        setCrossSells(others);
        
        // Fetch other providers for THIS specific service type
        if (serviceData?.serviceType?.slug) {
          const recRes = await api.get(`/api/service-types/${serviceData.serviceType.slug}/providers`);
          const recData = Array.isArray(recRes.data) ? recRes.data : (recRes.data?.data || []);
          const otherProv = recData.filter((r: any) => r.company.id !== serviceData.company.id);
          setOtherProviders(otherProv);
        }

        if (!isGuest) {
          try {
            const checkRes = await api.get(`/api/saved-items/check`, { params: { itemType: 'service', itemIds: id } });
            const savedStatus = checkRes.data?.savedIds?.[0]?.saved;
            if (savedStatus) setIsSaved(true);
          } catch (checkErr: any) {
            console.warn("Could not check saved status:", checkErr?.message);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [id]);

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
        await api.delete('/api/saved-items', { data: { itemType: 'service', itemId: id } });
        setIsSaved(false);
      } else {
        await api.post('/api/saved-items', { itemType: 'service', itemId: id });
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
      <SafeAreaView style={s.centerRoot}>
        <ActivityIndicator size="large" color={T.accent} />
      </SafeAreaView>
    );
  }

  if (!service) {
    return (
      <SafeAreaView style={s.centerRoot}>
        <Text style={s.errorText}>Service not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: T.accent, fontWeight: '600' }}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      {/* FLOATING OVERLAY ACTIONS */}
      <View style={s.floatingHeader}>
        <TouchableOpacity onPress={() => router.back()} style={s.actionBtn} accessibilityRole="button" accessibilityLabel="Go back">
          <MaterialIcons name="arrow-back" size={20} color={T.text1} />
        </TouchableOpacity>
        <Text style={s.floatingKicker}>{service.serviceType?.name || 'Service'}</Text>
        <TouchableOpacity onPress={handleSaveToggle} disabled={isSaving} style={s.actionBtn} accessibilityRole="button" accessibilityLabel={isSaved ? "Remove from saved" : "Save service"}>
          <MaterialCommunityIcons name={isSaved ? "heart" : "heart-outline"} size={20} color={isSaved ? "#EF4444" : T.text1} />
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        contentContainerStyle={{ paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* EDGE-TO-EDGE PARALLAX HERO */}
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
          {service.image ? (
            <Image
              source={{ uri: service.image }}
              style={s.heroImage}
              contentFit="cover"
            />
          ) : (
            <View style={[s.heroImage, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#E2E8F0' }]}>
              <MaterialCommunityIcons name="image-outline" size={44} color="#94A3B8" />
            </View>
          )}
          <View style={s.heroScrim} />
          {/* Price anchored on the hero */}
          <View style={s.heroPricePill}>
            <View>
              <Text style={s.heroPriceLabel}>from</Text>
              <Text style={s.heroPriceValue}>${service.basePrice}</Text>
            </View>
          </View>
          {service.isActive && (
            <View style={s.heroAvailability}>
              <MaterialIcons name="bolt" size={12} color="#16A34A" />
              <Text style={s.heroAvailabilityText}>Available Today</Text>
            </View>
          )}
        </Animated.View>

        {/* TITLE BLOCK */}
        <View style={s.infoSection}>
          <Text style={s.serviceKicker} numberOfLines={1}>{service.serviceType?.name || ''}</Text>
          <Text style={s.serviceTitle}>{service.name}</Text>
          <View style={s.metaRow}>
            {service.durationMin ? (
              <View style={s.metaItem}>
                <MaterialCommunityIcons name="clock-outline" size={14} color={T.text3} />
                <Text style={s.metaItemText}>{service.durationMin} mins</Text>
              </View>
            ) : null}
            <View style={s.metaItem}>
              <MaterialIcons name="star" size={14} color="#F59E0B" />
              <Text style={s.metaItemText}>
                {service.company?.rating ? Number(service.company.rating).toFixed(1) : "New"}
                {service.company?.reviewCount ? ` (${service.company.reviewCount})` : ""}
              </Text>
            </View>
          </View>

          {/* Trust chips */}
          <View style={s.trustBadgesContainer}>
            {service.company?.verificationStatus === 'verified' && (
              <View style={[s.trustBadge, { backgroundColor: '#EFF6FF' }]}>
                <MaterialIcons name="verified" size={13} color="#3B82F6" />
                <Text style={[s.trustBadgeText, { color: '#1D4ED8' }]}>Verified Provider</Text>
              </View>
            )}
            {service.company?.completionRate !== undefined && (
              <View style={[s.trustBadge, { backgroundColor: '#ECFDF5' }]}>
                <MaterialIcons name="check-circle" size={13} color="#10B981" />
                <Text style={[s.trustBadgeText, { color: '#047857' }]}>{Number(service.company.completionRate).toFixed(0)}% Completion</Text>
              </View>
            )}
            {service.company?.completedJobs > 0 && (
              <View style={[s.trustBadge, { backgroundColor: '#F1F5F9' }]}>
                <MaterialIcons name="work" size={13} color="#475569" />
                <Text style={[s.trustBadgeText, { color: '#475569' }]}>{service.company.completedJobs}+ Jobs</Text>
              </View>
            )}
            {service.company?.isInsured && (
              <View style={[s.trustBadge, { backgroundColor: '#FEF2F2' }]}>
                <MaterialIcons name="shield" size={13} color="#EF4444" />
                <Text style={[s.trustBadgeText, { color: '#B91C1C' }]}>Insured</Text>
              </View>
            )}
          </View>
        </View>

        <View style={s.divider} />

        {/* 3. WHAT'S INCLUDED? */}
        {service.checklist && service.checklist.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>What's Included?</Text>
            <View style={s.featureList}>
              {service.checklist.map((feature: any, i: number) => (
                <View key={i} style={s.featureItem}>
                  <View style={s.featureCheckDisc}>
                    <MaterialIcons name="check" size={13} color="#0A192F" />
                  </View>
                  <Text style={s.featureText}>{feature.text || feature}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={s.divider} />

        {/* 4. WHO IS PROVIDING IT? */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Provided By</Text>
          <TouchableOpacity
            style={s.providerCard}
            onPress={() => router.push(`/(customer)/company/${service.company.id}` as any)}
            accessibilityRole="button"
            accessibilityLabel={`View provider ${service.company.name}`}
          >
            <Image
              source={{ uri: service.company.logoUrl || `https://api.dicebear.com/9.x/initials/svg?seed=${service.company.name}` }}
              style={s.companyLogo}
            />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={s.companyName} numberOfLines={1}>{service.company.name}</Text>
                {service.company.verificationStatus === 'verified' && <MaterialIcons name="verified" size={15} color="#3B82F6" />}
              </View>
              <Text style={s.companyMeta} numberOfLines={1}>
                {service.company.city || "Local Area"} · {service.company.rating ? `${Number(service.company.rating).toFixed(1)} ★ (${service.company.reviewCount || 0})` : 'New'}
              </Text>
            </View>
            <View style={s.viewChip}>
              <Text style={s.viewChipText}>View profile</Text>
              <MaterialIcons name="chevron-right" size={14} color={T.text2} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={s.divider} />

        {/* 5. PEACE OF MIND GUARANTEE (Unified Trust Card) */}
        <View style={s.guaranteeSection}>
          <View style={s.guaranteeUnifiedCard}>
            <View style={s.guaranteeHeader}>
              <MaterialIcons name="verified-user" size={17} color="#059669" />
              <Text style={s.guaranteeHeaderTitle}>Peace of Mind Guarantee</Text>
            </View>

            <View style={s.guaranteeRow}>
              {/* 1: 100% Refund */}
              <View style={s.guaranteeCol}>
                <SatisfactionShieldSvg size={28} />
                <Text style={s.guaranteeCardTitle} numberOfLines={1}>100% Refund</Text>
                <Text style={s.guaranteeCardSub} numberOfLines={1}>Satisfaction</Text>
              </View>

              <View style={s.guaranteeColDivider} />

              {/* 2: Free Cancel */}
              <View style={s.guaranteeCol}>
                <FreeCancelClockSvg size={28} />
                <Text style={s.guaranteeCardTitle} numberOfLines={1}>Free Cancel</Text>
                <Text style={s.guaranteeCardSub} numberOfLines={1}>Up to 24h</Text>
              </View>

              <View style={s.guaranteeColDivider} />

              {/* 3: Insured */}
              <View style={s.guaranteeCol}>
                <DamageCoverUmbrellaSvg size={28} />
                <Text style={s.guaranteeCardTitle} numberOfLines={1}>$1k Cover</Text>
                <Text style={s.guaranteeCardSub} numberOfLines={1}>Protected</Text>
              </View>
            </View>
          </View>
        </View>

        {/* OTHER PROVIDERS */}
        {otherProviders.length > 0 && (
          <>
            <View style={s.divider} />
            <View style={s.section}>
              <Text style={s.sectionTitle}>Other Providers</Text>
              <View style={{ gap: 12 }}>
                {otherProviders.map((prov, i) => (
                  <TouchableOpacity 
                    key={prov.serviceId} 
                    style={s.otherProviderCard}
                    onPress={() => router.push(`/(customer)/service/${prov.serviceId}` as any)}
                  >
                    <Image source={{ uri: prov.company.logoUrl || `https://api.dicebear.com/9.x/initials/svg?seed=${prov.company.name}` }} style={s.otherLogo} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.otherName} numberOfLines={1}>{prov.company.name}</Text>
                      
                      {/* Comparison Metrics Grid */}
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                        {/* Rating/Reviews chip */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFBEB', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 0.5, borderColor: '#FDE68A' }}>
                          <MaterialIcons name="star" size={12} color="#F59E0B" />
                          <Text style={{ fontSize: 10, fontWeight: '700', color: '#B45309', marginLeft: 2 }}>
                            {prov.facts?.rating || 'New'} ({prov.facts?.jobsCompleted || 0})
                          </Text>
                        </View>

                        {prov.facts?.responseTimeMin != null && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 0.5, borderColor: '#BBF7D0' }}>
                            <MaterialCommunityIcons name="clock-fast" size={12} color="#16A34A" />
                            <Text style={{ fontSize: 10, fontWeight: '700', color: '#15803D', marginLeft: 2 }}>
                              {prov.facts.responseTimeMin}m response
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end', justifyContent: 'center', minWidth: 60 }}>
                      <Text style={s.otherPrice}>${prov.price}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                        <Text style={{ fontSize: 10, color: T.text3, fontWeight: '600' }}>View</Text>
                        <MaterialIcons name="chevron-right" size={14} color={T.text3} />
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}

        <View style={s.divider} />

        {/* CROSS SELLING (Frequently Booked Together) */}
        {crossSells.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Frequently Booked Together</Text>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 16, gap: 16 }}>
              {crossSells.map((cs, i) => {
                // Derive icon from service name keywords
                const nameL = (cs.name || '').toLowerCase();
                const icon = nameL.includes('clean') ? 'broom' :
                  nameL.includes('plumb') ? 'pipe-wrench' :
                  nameL.includes('electric') ? 'lightning-bolt' :
                  nameL.includes('ac') || nameL.includes('air') ? 'air-conditioner' :
                  nameL.includes('repair') || nameL.includes('fix') ? 'hammer-wrench' :
                  nameL.includes('paint') ? 'brush' :
                  nameL.includes('garden') ? 'flower' :
                  'home-outline';
                const iconColor = nameL.includes('clean') ? '#3b82f6' :
                  nameL.includes('plumb') ? '#06b6d4' :
                  nameL.includes('electric') ? '#eab308' :
                  nameL.includes('ac') || nameL.includes('air') ? '#f97316' :
                  '#10b981';
                return (
                  <FadeIn key={cs.id} delay={i * 100}>
                    <TouchableOpacity 
                      style={s.crossSellCard} 
                      onPress={() => router.push(`/(customer)/service/${cs.id}` as any)}
                    >
                      <View style={[s.crossSellIconBox, { backgroundColor: iconColor + '12' }]}>
                        <MaterialCommunityIcons name={icon as any} size={28} color={iconColor} />
                      </View>
                      <View style={s.crossSellBody}>
                        <Text style={s.crossSellTitle} numberOfLines={2}>{cs.name}</Text>
                        <Text style={s.crossSellPrice}>+ ${cs.basePrice}</Text>
                      </View>
                    </TouchableOpacity>
                  </FadeIn>
                );
              })}
            </ScrollView>
          </View>
        )}
      </Animated.ScrollView>

      {/* FLOATING ACTION BAR (navy pill, matching company detail) */}
      <View style={s.fabContainer} pointerEvents="box-none">
        <View style={s.fabBar}>
          <View style={{ paddingLeft: 4 }}>
            <Text style={s.fabPriceLabel}>from</Text>
            <Text style={s.fabPrice}>${service.basePrice}</Text>
          </View>
          <ScaleButton onPress={() => setSheetVisible(true)}>
            <View style={s.fabBtn}>
              <Text style={s.fabBtnText}>Book Now</Text>
            </View>
          </ScaleButton>
        </View>
      </View>

      {/* BOTTOM SHEET MODAL */}
      <BookingBottomSheet 
        visible={sheetVisible} 
        onClose={() => setSheetVisible(false)} 
        serviceId={service.id} 
        price={service.basePrice} 
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  centerRoot: { flex: 1, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center' },
  root: { flex: 1, backgroundColor: T.bg },

  // Floating overlay actions
  floatingHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 8 : 12, paddingBottom: 10, backgroundColor: 'transparent' },
  actionBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, ...CARD_SHADOW },
  floatingKicker: { fontSize: 12, fontWeight: '800', color: T.text2, textTransform: 'uppercase', letterSpacing: 0.4 },

  // Edge-to-edge hero
  heroContainer: { height: 270, backgroundColor: '#E2E8F0', overflow: 'hidden' },
  heroImage: { ...StyleSheet.absoluteFill },
  heroScrim: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(10, 25, 47, 0.28)' },
  heroPricePill: { position: 'absolute', left: 20, bottom: 20, backgroundColor: 'rgba(255,255,255,0.97)', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 8, ...CARD_SHADOW },
  heroPriceLabel: { fontSize: 9.5, fontWeight: '800', color: T.text3, textTransform: 'uppercase', letterSpacing: 0.6 },
  heroPriceValue: { fontSize: 19, fontWeight: '900', color: T.text1, letterSpacing: -0.5, lineHeight: 22 },
  heroAvailability: { position: 'absolute', right: 20, bottom: 20, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 },
  heroAvailabilityText: { fontSize: 11, fontWeight: '800', color: '#15803D' },

  // Title block
  infoSection: { padding: 24, paddingTop: 20 },
  serviceKicker: { fontSize: 11, fontWeight: '800', color: T.primaryMid, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  serviceTitle: { fontSize: 26, fontWeight: '900', color: T.text1, lineHeight: 32, letterSpacing: -0.6, marginBottom: 10 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaItemText: { fontSize: 13.5, fontWeight: '700', color: T.text2 },

  // Trust Badges
  trustBadgesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  trustBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  trustBadgeText: { fontSize: 12, fontWeight: '700' },

  divider: { height: 1, backgroundColor: T.border, marginHorizontal: 24 },

  section: { padding: 24 },
  sectionTitle: { fontSize: 19, fontWeight: '800', color: T.text1, marginBottom: 16, letterSpacing: -0.4 },

  // Features
  featureList: { gap: 12 },
  featureItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  featureCheckDisc: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  featureText: { flex: 1, fontSize: 15.5, color: T.text1, fontWeight: '500', lineHeight: 22 },

  // Provider
  providerCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, backgroundColor: T.surface, borderRadius: 16, borderWidth: 1, borderColor: T.border, ...CARD_SHADOW },
  companyLogo: { width: 52, height: 52, borderRadius: 13, backgroundColor: T.surface, borderWidth: 1, borderColor: T.border },
  companyName: { fontSize: 15.5, fontWeight: '800', color: T.text1 },
  companyMeta: { fontSize: 12.5, color: T.text2, marginTop: 3, fontWeight: '500' },
  viewChip: { flexDirection: 'row', alignItems: 'center', gap: 1, backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10 },
  viewChipText: { fontSize: 12, fontWeight: '700', color: T.text2 },

  // Guarantee
  guaranteeSection: {
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  guaranteeUnifiedCard: {
    backgroundColor: T.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: T.border,
    paddingVertical: 14,
    paddingHorizontal: 8,
    ...CARD_SHADOW,
  },
  guaranteeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 12,
  },
  guaranteeHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: T.text1,
    letterSpacing: -0.2,
  },
  guaranteeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  guaranteeCol: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  guaranteeColDivider: {
    width: 1,
    height: 36,
    backgroundColor: T.border,
    opacity: 0.8,
  },
  guaranteeCardTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: T.text1,
    marginTop: 6,
    textAlign: 'center',
  },
  guaranteeCardSub: {
    fontSize: 10,
    color: T.text2,
    marginTop: 1,
    textAlign: 'center',
    fontWeight: '500',
  },

  // Other Providers
  otherProviderCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, backgroundColor: T.surface, borderRadius: 14, borderWidth: 1, borderColor: T.border },
  otherLogo: { width: 40, height: 40, borderRadius: 10, backgroundColor: T.bg },
  otherName: { fontSize: 15, fontWeight: '700', color: T.text1 },
  otherMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  otherMeta: { fontSize: 12, color: T.text2, fontWeight: '500' },
  otherDot: { fontSize: 12, color: T.text3 },
  otherPrice: { fontSize: 16, fontWeight: '800', color: T.accent, marginBottom: 2 },

  // Cross Sell
  crossSellCard: { width: 148, backgroundColor: T.surface, borderRadius: 16, borderWidth: 1, borderColor: T.border, overflow: 'hidden' },
  crossSellIconBox: { width: '100%', height: 88, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: T.border },
  crossSellBody: { padding: 12 },
  crossSellTitle: { fontSize: 13, fontWeight: '700', color: T.text1, marginBottom: 8, lineHeight: 18, height: 36 },
  crossSellPrice: { fontSize: 14, fontWeight: '800', color: T.accent },

  // Floating navy action bar
  fabContainer: { position: 'absolute', left: 16, right: 16, bottom: Platform.OS === 'ios' ? 12 : 10 },
  fabBar: { backgroundColor: T.primary, borderRadius: 18, paddingVertical: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', ...CARD_SHADOW },
  fabPriceLabel: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: 0.6 },
  fabPrice: { fontSize: 20, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5, lineHeight: 24 },
  fabBtn: { backgroundColor: '#FFFFFF', borderRadius: 14, paddingHorizontal: 28, paddingVertical: 13, alignItems: 'center' },
  fabBtnText: { color: T.primary, fontSize: 15, fontWeight: '800', letterSpacing: 0.2 },

  errorText: { color: T.error, fontSize: 16, fontWeight: '600' }
});
