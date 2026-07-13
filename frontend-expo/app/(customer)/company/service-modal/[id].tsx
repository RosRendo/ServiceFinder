import React, { useState, useEffect, useCallback, useRef } from "react";
import { Image } from "expo-image";
import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator, Alert, StyleSheet, Animated, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import ScaleButton from "@/components/ScaleButton";
import { useRouter, useLocalSearchParams } from "expo-router";
import { api } from "@/store/authStore";

// ——————————————————————————————————————————————————————————————————————————
// DESIGN TOKENS (Deep Navy Theme)
// ——————————————————————————————————————————————————————————————————————————
const T = {
  bg: "#FFFFFF", surface: "#FFFFFF", border: "#EBEBEB",
  accent: "#0A192F", accentLight: "#F7F7F7", accentMid: "#1E3A8A",
  text1: "#111827", text2: "#717171", text3: "#B0B0B0",
};

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  android: { elevation: 2 },
});

// ─── Types ─────────────────────────────────────────────────────────────────
interface ServiceDetail {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  basePrice: number;
  platformFee: number;
  durationMin?: number;
  durationMax?: number;
  image?: string;
  features?: string[] | string;
  isActive: boolean;
  company: {
    id: string;
    name: string;
    description?: string;
    city?: string;
    address?: string;
    phone?: string;
    verificationStatus: string;
    rating?: number;
    reviewCount: number;
  };
  serviceType: {
    name: string;
    category: { name: string };
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────
const parseFeatures = (features: string[] | string | undefined): string[] => {
  if (!features) return [];
  if (Array.isArray(features)) return features;
  try {
    const parsed = JSON.parse(features);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const formatDuration = (min?: number, max?: number) => {
  if (!min) return null;
  if (max && max !== min) return `${min}–${max} min`;
  return `${min} min`;
};

// ─── Fallback images by category ────────────────────────────────────────────
const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800",
  "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800",
  "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800",
];

// ─── Component ──────────────────────────────────────────────────────────────
export default function ServiceModalScreen() {
  const router = useRouter();
  const { id, companyId } = useLocalSearchParams<{ id: string; companyId?: string }>();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;

  const [service, setService] = useState<ServiceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);

  const loadService = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const res = await api.get(`/api/services/${id}`);
      const raw = res.data?.data ?? res.data;
      setService(raw);

      const checkRes = await api.get(`/api/saved-items/check`, { params: { itemType: 'service', itemIds: id } });
      const savedStatus = checkRes.data?.savedIds?.[0]?.saved;
      if (savedStatus) setIsSaved(true);
    } catch (e: any) {
      Alert.alert("Error", "Could not load service details.");
      router.back();
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadService();
  }, [loadService]);

  const handleBook = () => {
    const cId = companyId ?? service?.companyId;
    if (!cId) {
      Alert.alert("Error", "Company info not available.");
      return;
    }
    router.push(`/(customer)/booking/create?serviceId=${id}&companyId=${cId}` as any);
  };

  const handleSave = async () => {
    if (!service || isSaving) return;
    setIsSaving(true);
    try {
      if (isSaved) {
        await api.delete(`/api/saved-items`, { data: { itemType: 'service', itemId: id } });
        setIsSaved(false);
      } else {
        await api.post("/api/saved-items", { itemType: 'service', itemId: id });
        setIsSaved(true);
      }
    } catch {
      // Silently fail — saving is non-critical
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[s.container, { alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={T.accent} />
        <Text style={{ marginTop: 12, color: T.text3, fontWeight: "500" }}>Loading premium service...</Text>
      </View>
    );
  }

  if (!service) return null;

  const features = parseFeatures(service.features);
  const duration = formatDuration(service.durationMin, service.durationMax);
  const total = service.basePrice + service.platformFee;

  const heroImg = service.image || (service as any)?.serviceType?.imageUrl || (service as any)?.serviceType?.category?.imageUrl || (service?.company as any)?.logoUrl || FALLBACK_IMAGES[0];
  const images = [heroImg];

  // Animations
  const headerOpacity = scrollY.interpolate({ inputRange: [0, 200], outputRange: [0, 1], extrapolate: 'clamp' });
  const imageScale = scrollY.interpolate({ inputRange: [-100, 0], outputRange: [1.3, 1], extrapolateRight: 'clamp' });
  const imageTranslateY = scrollY.interpolate({ inputRange: [0, 200], outputRange: [0, -50], extrapolate: 'clamp' });

  return (
    <View style={s.container}>
      {/* Floating Header Bar (Visible on Scroll) */}
      <Animated.View style={[s.floatingHeader, { paddingTop: insets.top, opacity: headerOpacity }]}>
        <Text style={s.floatingTitle} numberOfLines={1}>{service.name}</Text>
      </Animated.View>

      {/* Floating Action Buttons */}
      <View style={[s.actionsTop, { top: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.actionBtn}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={T.text1} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSave} style={s.actionBtn}>
          <MaterialCommunityIcons name={isSaved ? "cards-heart" : "heart-outline"} size={24} color={isSaved ? "#E11D48" : T.text1} />
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
      >
        {/* Full Bleed Image */}
        <Animated.View style={[s.heroWrapper, { transform: [{ scale: imageScale }, { translateY: imageTranslateY }] }]}>
          <Image source={{ uri: images[currentImageIdx] }} style={s.heroImg} contentFit="cover" />
          <View style={s.heroOverlay} />
        </Animated.View>

        {/* Content Sheet */}
        <View style={s.sheet}>
          {/* Main Info */}
          <View style={s.headerBox}>
            <View style={s.badgeRow}>
              <View style={s.chip}>
                <Text style={s.chipText}>{service.serviceType?.category?.name ?? service.serviceType?.name}</Text>
              </View>
              {service.company.verificationStatus === "verified" && (
                <View style={s.verifiedChip}>
                  <MaterialCommunityIcons name="shield-check" size={14} color="#059669" />
                  <Text style={s.verifiedText}>Verified</Text>
                </View>
              )}
            </View>

            <Text style={s.title}>{service.name}</Text>
            
            <View style={s.priceRow}>
              <Text style={s.price}>${service.basePrice.toFixed(2)}</Text>
              {duration && (
                <View style={s.durationBox}>
                  <MaterialCommunityIcons name="clock-outline" size={16} color={T.text2} />
                  <Text style={s.durationText}>{duration}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Provider Card */}
          <TouchableOpacity onPress={() => router.push(`/(customer)/company/${service.companyId}` as any)} style={s.providerCard}>
            <View style={s.providerIconBox}>
              <MaterialCommunityIcons name="storefront-outline" size={24} color={T.accentMid} />
            </View>
            <View style={s.providerInfo}>
              <Text style={s.providerName}>{service.company.name}</Text>
              <View style={s.providerRatingRow}>
                <MaterialCommunityIcons name="star" size={16} color="#F59E0B" />
                <Text style={s.providerRatingText}>
                  {service.company.rating?.toFixed(1) ?? "New"} <Text style={{ color: T.text3 }}>({service.company.reviewCount} reviews)</Text>
                </Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={T.text3} />
          </TouchableOpacity>

          <View style={s.divider} />

          {/* About */}
          {service.description && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>About this service</Text>
              <Text style={s.descriptionText}>{service.description}</Text>
            </View>
          )}

          {/* Availability & Location */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Availability & Details</Text>
            <View style={s.infoGrid}>
              <View style={s.infoRow}>
                <View style={[s.infoIconBox, { backgroundColor: "#ECFDF5" }]}>
                  <MaterialCommunityIcons name="check-circle" size={18} color="#059669" />
                </View>
                <Text style={s.infoText}>{service.isActive ? "Available for booking" : "Currently unavailable"}</Text>
              </View>
              {duration && (
                <View style={s.infoRow}>
                  <View style={[s.infoIconBox, { backgroundColor: T.accentLight }]}>
                    <MaterialCommunityIcons name="clock-outline" size={18} color={T.accentMid} />
                  </View>
                  <Text style={s.infoText}>Typical duration: {duration}</Text>
                </View>
              )}
              {service.company.city && (
                <View style={s.infoRow}>
                  <View style={[s.infoIconBox, { backgroundColor: "#FFF7ED" }]}>
                    <MaterialCommunityIcons name="map-marker-outline" size={18} color="#EA580C" />
                  </View>
                  <Text style={s.infoText}>Serves {service.company.city}</Text>
                </View>
              )}
            </View>
          </View>

          {/* What's Included */}
          {features.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>What's included</Text>
              <View style={s.featuresList}>
                {features.map((item, index) => (
                  <View key={index} style={s.featureItem}>
                    <View style={s.featureIconBox}>
                      <MaterialCommunityIcons name="check" size={14} color={T.surface} />
                    </View>
                    <Text style={s.featureText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={s.divider} />

          {/* Features / Guarantees Grid */}
          <View style={s.guaranteesGrid}>
            <View style={s.guaranteeCard}>
              <MaterialCommunityIcons name="shield-check-outline" size={24} color={T.accentMid} />
              <Text style={s.guaranteeTitle}>ServiceFinder Guarantee</Text>
              <Text style={s.guaranteeSub}>Quality assured or money back</Text>
            </View>
            <View style={s.guaranteeCard}>
              <MaterialCommunityIcons name="calendar-check-outline" size={24} color={T.accentMid} />
              <Text style={s.guaranteeTitle}>Instant Booking</Text>
              <Text style={s.guaranteeSub}>Schedule instantly</Text>
            </View>
          </View>
        </View>
      </Animated.ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={[s.bottomBar, CARD_SHADOW, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={s.bottomPriceInfo}>
          <Text style={s.bottomPrice}>${total.toFixed(2)}</Text>
          <Text style={s.bottomSub}>Total (incl. taxes)</Text>
        </View>
        <ScaleButton onPress={handleBook} disabled={!service.isActive}>
          <View style={s.bookBtn}>
            <Text style={s.bookBtnText}>{service.isActive ? "Book Now" : "Unavailable"}</Text>
          </View>
        </ScaleButton>
      </View>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  
  // Hero
  heroWrapper: { width: "100%", height: 340, zIndex: 0 },
  heroImg: { width: "100%", height: "100%" },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.15)" },
  
  // Floating Header
  floatingHeader: {
    position: "absolute", top: 0, left: 0, right: 0, zIndex: 10,
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingBottom: 16, borderBottomWidth: 1, borderColor: T.border,
    alignItems: "center", justifyContent: "flex-end"
  },
  floatingTitle: { fontSize: 16, fontWeight: "700", color: T.text1, maxWidth: "60%" },
  
  // Floating Actions
  actionsTop: {
    position: "absolute", left: 16, right: 16, zIndex: 20,
    flexDirection: "row", justifyContent: "space-between"
  },
  actionBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: T.border
  },
  
  // Sheet
  sheet: {
    marginTop: -40, backgroundColor: T.bg,
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    paddingTop: 24, zIndex: 5, minHeight: 600,
  },
  
  // Header Box
  headerBox: { paddingHorizontal: 20, marginBottom: 24 },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  chip: { backgroundColor: T.accentLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100 },
  chipText: { fontSize: 12, fontWeight: "700", color: T.accentMid, textTransform: "uppercase", letterSpacing: 0.5 },
  verifiedChip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#ECFDF5", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 100 },
  verifiedText: { fontSize: 12, fontWeight: "700", color: "#059669" },
  
  title: { fontSize: 28, fontWeight: "800", color: T.text1, marginBottom: 16, lineHeight: 34 },
  
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 16 },
  price: { fontSize: 32, fontWeight: "800", color: T.accent },
  durationBox: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: T.surface, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: T.border },
  durationText: { fontSize: 14, fontWeight: "600", color: T.text2 },
  
  // Provider Card
  providerCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: T.surface, marginHorizontal: 20, padding: 16,
    borderRadius: 16, borderWidth: 1, borderColor: T.border, marginBottom: 24
  },
  providerIconBox: { width: 48, height: 48, borderRadius: 12, backgroundColor: T.accentLight, alignItems: "center", justifyContent: "center", marginRight: 16 },
  providerInfo: { flex: 1 },
  providerName: { fontSize: 16, fontWeight: "700", color: T.text1, marginBottom: 4 },
  providerRatingRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  providerRatingText: { fontSize: 14, fontWeight: "600", color: T.text1 },
  
  divider: { height: 1, backgroundColor: T.border, marginHorizontal: 20, marginVertical: 8 },
  
  // Sections
  section: { paddingHorizontal: 20, paddingVertical: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: T.text1, marginBottom: 12 },
  descriptionText: { fontSize: 15, color: T.text2, lineHeight: 24 },
  
  infoGrid: { gap: 12, marginTop: 4 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  infoIconBox: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  infoText: { fontSize: 15, color: T.text1, fontWeight: "500" },
  
  featuresList: { gap: 12 },
  featureItem: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  featureIconBox: { width: 22, height: 22, borderRadius: 11, backgroundColor: T.accent, alignItems: "center", justifyContent: "center", marginTop: 2 },
  featureText: { flex: 1, fontSize: 15, color: T.text2, lineHeight: 22 },
  
  guaranteesGrid: { flexDirection: "row", paddingHorizontal: 20, gap: 16, paddingVertical: 16 },
  guaranteeCard: { flex: 1, backgroundColor: T.surface, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: T.border, gap: 8 },
  guaranteeTitle: { fontSize: 14, fontWeight: "700", color: T.text1, lineHeight: 20 },
  guaranteeSub: { fontSize: 12, color: T.text3, lineHeight: 18 },
  
  // Bottom Bar
  bottomBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: T.surface, borderTopWidth: 1, borderColor: T.border,
    flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 16
  },
  bottomPriceInfo: { flex: 1 },
  bottomPrice: { fontSize: 24, fontWeight: "800", color: T.text1 },
  bottomSub: { fontSize: 13, color: T.text3, marginTop: 2 },
  bookBtn: {
    backgroundColor: T.accent, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 100
  },
  bookBtnText: { fontSize: 16, fontWeight: "700", color: T.surface },
});
