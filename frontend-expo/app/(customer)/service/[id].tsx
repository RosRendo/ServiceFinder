import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Dimensions, Platform, Animated } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { api } from '@/store/authStore';
import { Theme } from '@/constants/theme';
import ScaleButton from '@/components/ScaleButton';
import BookingBottomSheet from '@/components/BookingBottomSheet';
import FadeIn from '@/components/FadeIn';

const T = Theme.colors;
const { width } = Dimensions.get('window');

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 },
  android: { elevation: 3 },
});

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  
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
          const recData = Array.isArray(recRes.data.data) ? recRes.data.data : (recRes.data?.data?.data || []);
          const otherProv = recData.filter((r: any) => r.company.id !== serviceData.company.id);
          setOtherProviders(otherProv);
        }

        try {
          const checkRes = await api.get(`/api/saved-items/check`, { params: { itemType: 'service', itemIds: id } });
          const savedStatus = checkRes.data?.savedIds?.[0]?.saved;
          if (savedStatus) setIsSaved(true);
        } catch (checkErr: any) {
          console.warn("Could not check saved status:", checkErr?.message);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleSaveToggle = async () => {
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
      {/* HEADER */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={T.text1} />
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>{service.serviceType?.name || 'Service Details'}</Text>
        <TouchableOpacity onPress={handleSaveToggle} disabled={isSaving} style={s.backBtn}>
          <MaterialCommunityIcons name={isSaved ? "heart" : "heart-outline"} size={22} color={isSaved ? "#ED6B6B" : T.text1} />
        </TouchableOpacity>
      </View>

      <Animated.ScrollView 
        contentContainerStyle={{ paddingBottom: 120 }} 
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* PARALLAX HERO IMAGE */}
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
          <Image 
            source={{ uri: service.image || "https://picsum.photos/800/600" }} 
            style={s.heroImage} 
            contentFit="cover" 
          />
        </Animated.View>

        {/* 1 & 2. WHAT AM I BUYING & HOW MUCH? */}
        <View style={s.infoSection}>
          <View style={s.titleRow}>
            <Text style={s.serviceTitle}>{service.name}</Text>
          </View>
          
          <View style={s.keyMetricsRow}>
            <View style={s.metricPill}>
              <Text style={s.metricPrice}>${service.basePrice}</Text>
            </View>
            <View style={s.metricPillLight}>
              <MaterialIcons name="star" size={16} color="#F59E0B" />
              <Text style={s.metricText}>
                {service.company?.rating ? Number(service.company.rating).toFixed(1) : "New"} 
                {service.company?.reviewCount ? ` (${service.company.reviewCount} reviews)` : ""}
              </Text>
            </View>
            {service.durationMin ? (
              <View style={s.metricPillLight}>
                <MaterialCommunityIcons name="clock-outline" size={16} color={T.text2} />
                <Text style={s.metricText}>{service.durationMin} mins</Text>
              </View>
            ) : null}
          </View>

          {/* 6. WHY SHOULD I TRUST IT? (Trust Badges) */}
          <View style={s.trustBadgesContainer}>
            {service.company?.verificationStatus === 'verified' && (
              <View style={[s.trustBadge, { backgroundColor: '#EFF6FF' }]}>
                <MaterialIcons name="verified" size={14} color="#3B82F6" />
                <Text style={[s.trustBadgeText, { color: '#1D4ED8' }]}>Verified Provider</Text>
              </View>
            )}
            {service.company?.completionRate !== undefined && (
              <View style={[s.trustBadge, { backgroundColor: '#ECFDF5' }]}>
                <MaterialIcons name="check-circle" size={14} color="#10B981" />
                <Text style={[s.trustBadgeText, { color: '#047857' }]}>{Number(service.company.completionRate).toFixed(0)}% Completion</Text>
              </View>
            )}
            {service.company?.completedJobs > 0 && (
              <View style={[s.trustBadge, { backgroundColor: '#F3F4F6' }]}>
                <MaterialIcons name="work" size={14} color={T.text2} />
                <Text style={[s.trustBadgeText, { color: T.text2 }]}>{service.company.completedJobs}+ Jobs</Text>
              </View>
            )}
            {service.company?.isInsured && (
              <View style={[s.trustBadge, { backgroundColor: '#FEF2F2' }]}>
                <MaterialIcons name="shield" size={14} color="#EF4444" />
                <Text style={[s.trustBadgeText, { color: '#B91C1C' }]}>Insured</Text>
              </View>
            )}
            {service.isActive && (
              <View style={[s.trustBadge, { backgroundColor: '#F0FDF4' }]}>
                <MaterialIcons name="bolt" size={14} color="#16A34A" />
                <Text style={[s.trustBadgeText, { color: '#15803D' }]}>Available Today</Text>
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
                  <MaterialIcons name="check" size={20} color={T.text1} />
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
          <View style={s.providerCard}>
            <Image 
              source={{ uri: service.company.logoUrl || `https://api.dicebear.com/9.x/initials/svg?seed=${service.company.name}` }} 
              style={s.companyLogo} 
            />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={s.companyName}>{service.company.name}</Text>
                {service.company.verificationStatus === 'verified' && <MaterialIcons name="verified" size={16} color="#3B82F6" />}
              </View>
              <Text style={s.companyMeta}>
                {service.company.city || "Local Area"} • {service.company.rating ? `${service.company.rating} ★ (${service.company.reviewCount})` : 'New'}
              </Text>
            </View>
            <TouchableOpacity 
              style={s.viewCompanyBtn}
              onPress={() => router.push(`/(customer)/company/${service.company.id}` as any)}
            >
              <Text style={s.viewCompanyText}>VIEW</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={s.divider} />

        {/* 5. AM I PROTECTED? (Peace of Mind Guarantee) */}
        <View style={s.section}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <MaterialIcons name="shield" size={24} color="#10B981" />
            <Text style={s.sectionTitle}>Peace of Mind Guarantee</Text>
          </View>
          
          <View style={s.policyList}>
            <View style={s.policyItem}>
              <MaterialCommunityIcons name="calendar-remove" size={20} color={T.text2} />
              <View style={{ flex: 1 }}>
                <Text style={s.policyTitle}>Free Cancellation</Text>
                <Text style={s.policyDesc}>Cancel up to 24 hours before the service for a full refund.</Text>
              </View>
            </View>
            
            <View style={s.policyItem}>
              <MaterialCommunityIcons name="cash-refund" size={20} color={T.text2} />
              <View style={{ flex: 1 }}>
                <Text style={s.policyTitle}>100% Satisfaction Refund</Text>
                <Text style={s.policyDesc}>If you're not satisfied, we will re-do it or refund you completely.</Text>
              </View>
            </View>
            
            <View style={s.policyItem}>
              <MaterialCommunityIcons name="file-document-check-outline" size={20} color={T.text2} />
              <View style={{ flex: 1 }}>
                <Text style={s.policyTitle}>Insured & Protected</Text>
                <Text style={s.policyDesc}>Property damage and dispute protection included up to $1,000.</Text>
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
                      <View style={s.otherMetaRow}>
                        <MaterialIcons name="star" size={14} color="#F59E0B" />
                        <Text style={s.otherMeta}>{prov.facts?.rating || 'New'}</Text>
                        <Text style={s.otherDot}>•</Text>
                        <Text style={s.otherMeta}>{prov.facts?.jobsCompleted || 0} jobs</Text>
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={s.otherPrice}>${prov.price}</Text>
                      <MaterialIcons name="chevron-right" size={20} color={T.text3} />
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
              {crossSells.map((cs, i) => (
                <FadeIn key={cs.id} delay={i * 100}>
                  <TouchableOpacity 
                    style={s.crossSellCard} 
                    onPress={() => router.push(`/(customer)/service/${cs.id}` as any)}
                  >
                    <Image source={{ uri: cs.image || "https://picsum.photos/200/200" }} style={s.crossSellImg} />
                    <View style={s.crossSellBody}>
                      <Text style={s.crossSellTitle} numberOfLines={2}>{cs.name}</Text>
                      <Text style={s.crossSellPrice}>+ ${cs.basePrice}</Text>
                    </View>
                  </TouchableOpacity>
                </FadeIn>
              ))}
            </ScrollView>
          </View>
        )}
      </Animated.ScrollView>

      {/* FLOATING ACTION BAR */}
      <View style={s.fabContainer}>
        <ScaleButton onPress={() => setSheetVisible(true)}>
          <View style={s.fabBtn}>
            <Text style={s.fabBtnText}>BOOK NOW</Text>
          </View>
        </ScaleButton>
      </View>

      {/* BOTTOM SHEET MODAL */}
      <BookingBottomSheet 
        visible={sheetVisible} 
        onClose={() => setSheetVisible(false)} 
        serviceId={service.id} 
        price={service.basePrice} 
        companyId={service.companyId}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  centerRoot: { flex: 1, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center' },
  root: { flex: 1, backgroundColor: T.bg },
  
  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: T.surface, borderWidth: 1, borderColor: T.border },
  headerTitle: { fontSize: 16, fontWeight: '700', color: T.text1 },
  
  // Hero
  heroContainer: { marginHorizontal: 20, marginTop: 8, height: 220, borderRadius: 16, overflow: 'hidden', backgroundColor: T.surface },
  heroImage: { ...StyleSheet.absoluteFillObject },
  
  // Info Section
  infoSection: { padding: 24, paddingTop: 20 },
  titleRow: { marginBottom: 12 },
  serviceTitle: { fontSize: 26, fontWeight: '900', color: T.text1, lineHeight: 32 },
  
  keyMetricsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  metricPill: { backgroundColor: T.text1, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  metricPrice: { color: T.surface, fontSize: 16, fontWeight: '800' },
  metricPillLight: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  metricText: { fontSize: 14, fontWeight: '700', color: T.text1 },

  // Trust Badges
  trustBadgesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  trustBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  trustBadgeText: { fontSize: 12, fontWeight: '700' },

  divider: { height: 8, backgroundColor: '#F3F4F6' },
  
  section: { padding: 24 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: T.text1, marginBottom: 16 },
  
  // Features
  featureList: { gap: 16 },
  featureItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  featureText: { flex: 1, fontSize: 16, color: T.text1, fontWeight: '500', lineHeight: 22 },

  // Provider
  providerCard: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  companyLogo: { width: 48, height: 48, borderRadius: 12, backgroundColor: T.surface, borderWidth: 1, borderColor: T.border },
  companyName: { fontSize: 16, fontWeight: '800', color: T.text1 },
  companyMeta: { fontSize: 13, color: T.text2, marginTop: 4, fontWeight: '500' },
  viewCompanyBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: T.surface, borderWidth: 1, borderColor: T.border },
  viewCompanyText: { fontSize: 12, fontWeight: '700', color: T.text1 },

  // Policies
  policyList: { gap: 20 },
  policyItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  policyTitle: { fontSize: 16, fontWeight: '700', color: T.text1, marginBottom: 4 },
  policyDesc: { fontSize: 14, color: T.text2, lineHeight: 20 },

  // Other Providers
  otherProviderCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, backgroundColor: T.surface, borderRadius: 12, borderWidth: 1, borderColor: T.border },
  otherLogo: { width: 40, height: 40, borderRadius: 8, backgroundColor: T.bg },
  otherName: { fontSize: 15, fontWeight: '700', color: T.text1 },
  otherMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  otherMeta: { fontSize: 12, color: T.text2, fontWeight: '500' },
  otherDot: { fontSize: 12, color: T.text3 },
  otherPrice: { fontSize: 16, fontWeight: '800', color: T.accent, marginBottom: 2 },

  // Cross Sell
  crossSellCard: { width: 160, backgroundColor: T.surface, borderRadius: 16, borderWidth: 1, borderColor: T.border, overflow: 'hidden' },
  crossSellImg: { width: '100%', height: 100, backgroundColor: T.border },
  crossSellBody: { padding: 12 },
  crossSellTitle: { fontSize: 14, fontWeight: '700', color: T.text1, marginBottom: 8, height: 38 },
  crossSellPrice: { fontSize: 14, fontWeight: '800', color: T.accent },

  // FAB
  fabContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, backgroundColor: T.surface, borderTopWidth: 1, borderColor: T.border, ...CARD_SHADOW },
  fabBtn: { backgroundColor: T.accent, borderRadius: 16, paddingVertical: 18, alignItems: 'center' },
  fabBtnText: { color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  
  errorText: { color: T.error, fontSize: 16, fontWeight: '600' }
});
