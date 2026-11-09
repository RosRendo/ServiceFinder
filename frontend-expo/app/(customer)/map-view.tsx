import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Animated,
  Easing,
  Platform,
  StyleSheet,
  ScrollView,
  TextInput,
  FlatList,
  Dimensions,
  Modal,
  Pressable,
  ActivityIndicator,
  Linking,
  KeyboardAvoidingView,
} from "react-native";
import { Image } from "expo-image";
import MapView, { Marker, Polyline } from "react-native-maps";
import { MAP_PROVIDER, fitDualCoordinates, centerMapCamera } from "@/utils/mapHelper";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { api } from "@/store/authStore";
import { SafeAreaView } from "react-native-safe-area-context";
import { io, Socket } from "socket.io-client";
import { Theme } from "@/constants/theme";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";
import { API_URL, SOCKET_URL } from "@/lib/apiConfig";

const T = Theme.colors;
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
  android: { elevation: 4 },
});

const HEAVY_SHADOW = Platform.select({
  ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.14, shadowRadius: 20 },
  android: { elevation: 10 },
});

export interface CompanyPin {
  id: string;
  name: string;
  lat: number;
  lng: number;
  rating: number;
  reviewCount: number;
  description?: string;
  logoUrl?: string;
  city?: string;
  verified: boolean;
  categorySlugs?: string[];
  categorySlug?: string;
  serviceTypes?: any[];
  services?: { id: string; name: string; basePrice?: number }[];
}

const CATEGORIES = [
  { id: "all",        label: "All Services", icon: "apps",            slug: null,         color: "#0A192F" },
  { id: "cleaning",   label: "Cleaning",     icon: "broom",           slug: "cleaning",   color: "#3b82f6" },
  { id: "plumbing",   label: "Plumbing",     icon: "pipe-wrench",     slug: "plumbing",   color: "#06b6d4" },
  { id: "electrical", label: "Electrical",   icon: "lightning-bolt",  slug: "electrical", color: "#eab308" },
  { id: "ac",         label: "AC Repair",    icon: "air-conditioner", slug: "ac",         color: "#f97316" },
  { id: "repair",     label: "Repair",       icon: "hammer-wrench",   slug: "repair",     color: "#10b981" },
  { id: "home",       label: "Home Service", icon: "home-outline",    slug: "home",       color: "#8b5cf6" },
];

interface MatchResult {
  bookingId: string;
  companyId: string;
  companyName: string;
  rating: number;
  etaMinutes: number;
  distanceKm: number | null;
  totalPrice: number;
  companyLatitude: number | null;
  companyLongitude: number | null;
}

function PulsingDriverMarker({ color = '#2563EB', etaText }: { color?: string; etaText?: string }) {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const scale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.2],
  });

  const opacity = pulseAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.6, 0.3, 0],
  });

  return (
    <View style={s.markerWrap}>
      {etaText ? (
        <View style={s.etaPill}>
          <MaterialCommunityIcons name="lightning-bolt" size={12} color="#FFF" style={{ marginRight: 2 }} />
          <Text style={s.etaPillText}>{etaText}</Text>
        </View>
      ) : null}
      <View style={s.markerCoreWrap}>
        <Animated.View style={[s.pulseGlow, { backgroundColor: color, transform: [{ scale }], opacity }]} />
        <View style={[s.driverMarkerBadge, { backgroundColor: color }]}>
          <MaterialCommunityIcons name="car-sports" size={18} color="#FFF" />
        </View>
      </View>
    </View>
  );
}

function CustomerDestinationMarker({ label }: { label?: string }) {
  return (
    <View style={s.markerWrap}>
      <View style={s.destPill}>
        <MaterialCommunityIcons name="map-marker" size={13} color="#EF4444" style={{ marginRight: 3 }} />
        <Text style={s.destPillText} numberOfLines={1}>{label || "Your Location"}</Text>
      </View>
      <View style={s.destPinIconWrap}>
        <MaterialCommunityIcons name="home-circle" size={32} color="#EF4444" />
      </View>
    </View>
  );
}
function CompanyMapMarker({ company, isSelected, getPinColor }: { company: any; isSelected: boolean; getPinColor: (slug: string) => string }) {
  const slug = company.categorySlug || "";
  const found = CATEGORIES.find((c) => slug?.includes(c.id));
  const pinBg = found?.color || getPinColor(slug);
  const iconName = (found?.icon || "briefcase-outline") as any;

  return (
    <View style={s.companyMarkerWrap}>
      {/* Top Name & Rating Badge (Only visible when selected) */}
      {isSelected && (
        <View style={s.companyPillActive}>
          <Text style={s.companyPillNameActive} numberOfLines={1}>
            {company.name}
          </Text>
          {company.rating > 0 && (
            <View style={s.companyRatingTag}>
              <MaterialCommunityIcons name="star" size={10} color="#F59E0B" />
              <Text style={s.companyRatingText}>{company.rating.toFixed(1)}</Text>
            </View>
          )}
        </View>
      )}

      {/* Core Category Icon / Logo Pin */}
      <View 
        style={[
          s.companyLogoBadge, 
          isSelected ? s.companyLogoBadgeActive : null
        ]}
      >
        {company.logoUrl ? (
          <Image source={{ uri: company.logoUrl }} style={s.companyLogoImage} contentFit="cover" />
        ) : (
          <View style={[s.companyLetterCore, { backgroundColor: pinBg }]}>
            <MaterialCommunityIcons name={iconName} size={isSelected ? 22 : 18} color="#FFFFFF" />
          </View>
        )}
      </View>
    </View>
  );
}

export default function MasterMapViewScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{
    categoryId?: string;
    categorySlug?: string;
    mode?: "explore" | "instant" | "tracking";
    bookingId?: string;
  }>();

  const { location: userLoc, loadingLocation } = useCurrentLocation();
  const mapViewRef = useRef<MapView>(null);

  // App Modes: "explore" | "instant" | "tracking"
  const [appMode, setAppMode] = useState<"explore" | "instant" | "tracking">(() => {
    if (params.bookingId || params.mode === "tracking") return "tracking";
    if (params.mode === "instant") return "instant";
    return "explore";
  });

  // Explore Mode State
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(params.categorySlug || null);
  const [companies, setCompanies] = useState<CompanyPin[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<CompanyPin | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Instant Request Stage State (1: Pick & Describe | 4: Auto-match radar | 5: Matched)
  const [instantStage, setInstantStage] = useState<number>(1);
  const [instantService, setInstantService] = useState<{ id: string; label: string } | null>(null);
  const [instantDesc, setInstantDesc] = useState("");
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [matched, setMatched] = useState<MatchResult | null>(null);
  const [noMatch, setNoMatch] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);

  // Radar matching animations
  const [radarStatusText, setRadarStatusText] = useState("Scanning 3km radius...");
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.8)).current;

  // Tracking State
  const [activeBookingId, setActiveBookingId] = useState<string | null>(params.bookingId || null);
  const [booking, setBooking] = useState<any>(null);
  const [providerLoc, setProviderLoc] = useState({ latitude: 11.5615, longitude: 104.9310 });
  const [etaVal, setEtaVal] = useState<string>("8-12 mins");
  const [trackStatus, setTrackStatus] = useState<"confirmed" | "on_the_way" | "arrived" | "in_progress" | "completed">("on_the_way");
  const [realRoutePoints, setRealRoutePoints] = useState<{ latitude: number; longitude: number }[]>([]);
  // Effective Customer Location (uses booking address coordinates in tracking mode)
  const targetCustomerLoc = React.useMemo(() => {
    if (appMode === "tracking" && booking?.latitude && booking?.longitude) {
      return {
        latitude: parseFloat(booking.latitude),
        longitude: parseFloat(booking.longitude),
      };
    }
    return userLoc;
  }, [appMode, booking?.latitude, booking?.longitude, userLoc]);

  // Fetch real street road driving route via OSRM
  useEffect(() => {
    if (appMode !== "tracking") return;
    let isMounted = true;

    async function getRealRoadRoute() {
      try {
        const start = providerLoc;
        const end = targetCustomerLoc;
        const url = `https://router.project-osrm.org/route/v1/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();
        const coords = data?.routes?.[0]?.geometry?.coordinates;
        if (coords && Array.isArray(coords) && coords.length > 0 && isMounted) {
          const mapped = coords.map((pt: [number, number]) => ({
            latitude: pt[1],
            longitude: pt[0],
          }));
          setRealRoutePoints(mapped);
          const durSec = data.routes[0]?.duration;
          if (durSec) {
            const mins = Math.max(1, Math.ceil(durSec / 60));
            setEtaVal(`${mins} mins`);
          }
        }
      } catch (err) {
        console.warn("OSRM road routing fallback:", err);
      }
    }

    getRealRoadRoute();
    return () => { isMounted = false; };
  }, [appMode, providerLoc.latitude, providerLoc.longitude, targetCustomerLoc.latitude, targetCustomerLoc.longitude]);

  // Route Coordinates along actual city streets
  const effectiveRouteCoordinates = React.useMemo(() => {
    if (appMode !== "tracking") return [];
    if (realRoutePoints.length > 1) return realRoutePoints;
    return [providerLoc, targetCustomerLoc];
  }, [appMode, realRoutePoints, providerLoc, targetCustomerLoc]);

  // 1. Load Unified Company Directory Once
  useEffect(() => {
    async function loadDirectory() {
      setIsLoading(true);
      try {
        const res = await api.get("/api/companies", {
          params: {
            lat: userLoc.latitude,
            lng: userLoc.longitude,
            limit: 50,
          },
        });
        const raw: any[] = res.data?.data?.companies ?? res.data?.companies ?? res.data?.data ?? res.data ?? [];
        const pins: CompanyPin[] = raw.map((c: any, idx: number) => {
          const slugs: string[] = [];
          if (Array.isArray(c.services)) {
            c.services.forEach((s: any) => {
              const slug = s.serviceType?.category?.slug;
              if (slug && !slugs.includes(slug)) slugs.push(slug);
            });
          }
          if (Array.isArray(c.serviceTypes)) {
            c.serviceTypes.forEach((st: any) => {
              if (st.slug && !slugs.includes(st.slug)) slugs.push(st.slug);
            });
          }
          return {
            id: c.id.toString(),
            name: c.name,
            lat: c.latitude ? parseFloat(c.latitude) : userLoc.latitude + Math.sin(idx * 1.2) * 0.018,
            lng: c.longitude ? parseFloat(c.longitude) : userLoc.longitude + Math.cos(idx * 1.2) * 0.018,
            rating: Number(c.rating ?? c.ratingSummary?.averageRating ?? 4.8),
            reviewCount: Number(c.reviewCount ?? c.ratingSummary?.totalReviews ?? 12),
            description: c.description,
            logoUrl: c.logoUrl,
            city: c.city,
            verified: c.verificationStatus === "verified" || c.verified,
            categorySlugs: slugs,
            categorySlug: slugs[0] || "other",
            services: Array.isArray(c.services)
              ? c.services
                  .filter((sv: any) => sv.isActive !== false)
                  .map((sv: any) => ({
                    id: sv.id?.toString(),
                    name: sv.name,
                    basePrice: sv.basePrice != null ? Number(sv.basePrice) : undefined,
                  }))
                  .filter((sv: any) => sv.id && sv.name)
              : [],
          };
        });
        setCompanies(pins);
      } catch (err) {
        console.warn("Failed to load directory:", err);
      } finally {
        setIsLoading(false);
      }
    }
    if (!loadingLocation) loadDirectory();
  }, [loadingLocation]);

  // 2. Center Camera to User on mount
  useEffect(() => {
    if (!loadingLocation && userLoc && mapViewRef.current && appMode !== "tracking") {
      centerMapCamera(mapViewRef, userLoc, 0.035, 1000);
    }
  }, [loadingLocation, userLoc.latitude, userLoc.longitude, appMode]);

  // 3. Radar Pulse Animation in Instant Mode (Stage 4)
  useEffect(() => {
    if (appMode === "instant" && instantStage === 4) {
      const pulseLoop = Animated.loop(
        Animated.parallel([
          Animated.timing(pulseAnim, { toValue: 2.8, duration: 2000, useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 0, duration: 2000, useNativeDriver: true }),
        ])
      );
      pulseLoop.start();
      return () => {
        pulseLoop.stop();
        pulseAnim.setValue(1);
        pulseOpacity.setValue(0.8);
      };
    }
  }, [appMode, instantStage]);

  // 4. Radar status rotation + safety timeout while waiting for auto-match
  useEffect(() => {
    if (appMode !== "instant" || instantStage !== 4) return;

    const stages = [
      { time: 0, text: "Scanning nearest verified pros..." },
      { time: 3000, text: "Matching the closest available pro..." },
      { time: 7000, text: "Still searching — expanding radius..." },
    ];
    const timers = stages.map((st) => setTimeout(() => setRadarStatusText(st.text), st.time));
    const timeout = setTimeout(() => setNoMatch(true), 12000);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(timeout);
    };
  }, [appMode, instantStage, activeRequestId]);

  // 5. Live Tracking WebSocket & Status Polling
  useEffect(() => {
    if (appMode !== "tracking" || !activeBookingId) return;

    let socket: Socket | null = null;
    let pollTimer: any = null;

    async function loadBooking() {
      try {
        const res = await api.get(`/api/bookings/${activeBookingId}`);
        const b = res.data.data.booking ?? res.data.data;
        setBooking(b);
        const cLoc = (b.latitude && b.longitude)
          ? { latitude: parseFloat(b.latitude), longitude: parseFloat(b.longitude) }
          : userLoc;

        if (b.company?.latitude && b.company?.longitude) {
          const pCoord = {
            latitude: parseFloat(b.staffStartLatitude || b.company.latitude),
            longitude: parseFloat(b.staffStartLongitude || b.company.longitude),
          };
          setProviderLoc(pCoord);
          fitDualCoordinates(mapViewRef, cLoc, pCoord);
        }
      } catch (err) {
        console.warn("Tracking fetch error:", err);
      }
    }

    loadBooking();
    pollTimer = setInterval(loadBooking, 30000);

    try {
      socket = io(SOCKET_URL || API_URL, { transports: ["websocket"] });
      socket.on("connect", () => {
        socket?.emit("join_booking", String(activeBookingId));
      });

      socket.on("staff_location_updated", (data: any) => {
        const newPLoc = { latitude: data.latitude, longitude: data.longitude };
        setProviderLoc(newPLoc);
        fitDualCoordinates(mapViewRef, userLoc, newPLoc);

        const latDiff = Math.abs(userLoc.latitude - data.latitude);
        const lngDiff = Math.abs(userLoc.longitude - data.longitude);
        if (latDiff < 0.001 && lngDiff < 0.001) {
          setTrackStatus("arrived");
          setEtaVal("Arrived");
        } else {
          setTrackStatus("on_the_way");
          setEtaVal("Live tracking...");
        }
      });
    } catch (e) {
      console.warn("Socket.io connect error:", e);
    }

    return () => {
      if (socket) {
        socket?.emit?.("leave_booking", String(activeBookingId));
        socket.disconnect?.();
      }
      clearInterval(pollTimer);
    };
  }, [appMode, activeBookingId]);

  // Filtered Companies by Search & Category & Instant Service Selection
  const activeInstantCat = instantService?.id;
  const filteredCompanies = companies.filter((c) => {
    if (appMode === "instant" && activeInstantCat && activeInstantCat !== "all") {
      return (
        c.categorySlugs?.some((s) => s.toLowerCase().includes(activeInstantCat.toLowerCase())) ||
        (c.categorySlug || "").toLowerCase().includes(activeInstantCat.toLowerCase())
      );
    }
    if (selectedCategorySlug && !c.categorySlugs?.some((s) => s.toLowerCase().includes(selectedCategorySlug.toLowerCase()))) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return c.name.toLowerCase().includes(q) || (c.city || "").toLowerCase().includes(q);
    }
    return true;
  });

  // 1-Click Direct Company Dispatch
  const handleDirectCompanyDispatch = async (company: CompanyPin) => {
    try {
      setIsDispatching(true);
      setSelectedCompany(company);
      setAppMode("instant");
      setInstantStage(4);
      const catId = company.categorySlug || "cleaning";
      const found = CATEGORIES.find((c) => catId.includes(c.id)) || CATEGORIES[1];
      setInstantService({ id: found.id, label: found.label });

      const response = await api.post("/api/instant-requests", {
        serviceCategory: found.label,
        description: `Direct urgent request for ${company.name}`,
        preferredTime: "now",
        latitude: userLoc.latitude,
        longitude: userLoc.longitude,
        companyId: company.id,
      });

      const responseData = response.data?.data || response.data;
      const reqId = responseData?.request?.id;
      if (!reqId) throw new Error("Invalid request response");
      setActiveRequestId(String(reqId));

      const m: MatchResult | null = responseData?.matched ?? null;
      if (m) {
        setMatched(m);
        setActiveBookingId(m.bookingId);
        setInstantStage(5);
        centerMapCamera(
          mapViewRef,
          { latitude: m.companyLatitude ?? company.lat, longitude: m.companyLongitude ?? company.lng },
          0.02,
          800,
        );
      }
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message || err.message || "Failed to dispatch request");
      setInstantStage(1);
    } finally {
      setIsDispatching(false);
    }
  };

  // Launch Instant Request — server auto-matches the nearest pro
  const handleLaunchInstantRequest = async () => {
    if (!instantService) return;
    const finalDesc = instantDesc.trim() || `Urgent ${instantService.label} request`;
    try {
      setIsDispatching(true);
      setNoMatch(false);
      const response = await api.post("/api/instant-requests", {
        serviceCategory: instantService.label,
        description: finalDesc,
        preferredTime: "now",
        latitude: userLoc.latitude,
        longitude: userLoc.longitude,
      });

      const responseData = response.data?.data || response.data;
      const reqId = responseData?.request?.id;
      if (!reqId) throw new Error("Invalid request response");
      setActiveRequestId(String(reqId));
      setInstantStage(4);

      const m: MatchResult | null = responseData?.matched ?? null;
      if (m) {
        setMatched(m);
        setActiveBookingId(m.bookingId);
        setInstantStage(5);
        const mLat = m.companyLatitude ?? userLoc.latitude;
        const mLng = m.companyLongitude ?? userLoc.longitude;
        if (m.companyLatitude != null && m.companyLongitude != null) {
          centerMapCamera(mapViewRef, { latitude: mLat, longitude: mLng }, 0.02, 800);
        } else {
          centerMapCamera(mapViewRef, userLoc, 0.018, 800);
        }
      }
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message || err.message || "Failed to submit request");
      setInstantStage(1);
    } finally {
      setIsDispatching(false);
    }
  };

  // Cancel the matched instant request (booking not paid yet)
  const handleCancelInstant = async () => {
    if (!matched) {
      setInstantStage(1);
      return;
    }
    try {
      setIsDispatching(true);
      await api.patch(`/api/bookings/${matched.bookingId}/cancel`, {
        reason: "Customer cancelled the instant request before payment",
      });
      setMatched(null);
      setActiveBookingId(null);
      setActiveRequestId(null);
      setInstantDesc("");
      setInstantStage(1);
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message || err.message || "Could not cancel the request");
    } finally {
      setIsDispatching(false);
    }
  };

  // Continue matched booking to escrow checkout
  const handleMatchedContinue = () => {
    if (!matched) return;
    router.push({
      pathname: "/(customer)/checkout" as any,
      params: { bookingId: matched.bookingId, isInstant: "true" },
    });
  };

  // ── Schedule a visit with a pinned company (from the map) ──
  const fmtLocalDate = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const scheduleDates = useMemo(() => {
    const arr: { label: string; value: string }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      arr.push({
        label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString("en-US", { weekday: "short", day: "numeric" }),
        value: fmtLocalDate(d),
      });
    }
    return arr;
  }, []);

  const scheduleTimes = useMemo(() => {
    const arr: { label: string; value: string }[] = [];
    for (let h = 8; h <= 18; h += 2) {
      const ampm = h >= 12 ? "PM" : "AM";
      const hour = h > 12 ? h - 12 : h;
      arr.push({ label: `${hour}:00 ${ampm}`, value: `${String(h).padStart(2, "0")}:00` });
    }
    return arr;
  }, []);

  const [scheduleVisible, setScheduleVisible] = useState(false);
  const [scheduleServiceIdx, setScheduleServiceIdx] = useState(0);
  const [scheduleDateIdx, setScheduleDateIdx] = useState(0);
  const [scheduleTimeIdx, setScheduleTimeIdx] = useState(1); // default 10:00 AM

  const scheduleCompany = selectedCompany;
  const scheduleService = scheduleCompany?.services?.[scheduleServiceIdx] || null;

  const openScheduleFor = (company: CompanyPin) => {
    const svc = company.services || [];
    if (svc.length === 0) {
      Alert.alert(
        "No listed services",
        "This pro hasn't listed bookable services yet — book them instantly instead, or view their profile.",
        [
          { text: "View Profile", onPress: () => router.push(`/(customer)/company/${company.id}` as any) },
          { text: "Cancel", style: "cancel" },
        ]
      );
      return;
    }
    setScheduleServiceIdx(0);
    setScheduleDateIdx(0);
    setScheduleTimeIdx(1);
    setScheduleVisible(true);
  };

  const handleScheduleConfirm = () => {
    if (!scheduleCompany || !scheduleService) return;
    setScheduleVisible(false);
    router.push({
      pathname: "/(customer)/checkout" as any,
      params: {
        serviceId: scheduleService.id,
        companyId: scheduleCompany.id,
        date: scheduleDates[scheduleDateIdx].label,
        dateISO: scheduleDates[scheduleDateIdx].value,
        time: scheduleTimes[scheduleTimeIdx].label,
        timeISO: scheduleTimes[scheduleTimeIdx].value,
        price: scheduleService.basePrice != null ? String(scheduleService.basePrice) : "",
      },
    });
  };

  const getPinColor = (slug: string) => {
    const found = CATEGORIES.find((c) => slug?.includes(c.id));
    return found?.color ?? "#6366f1";
  };

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      {/* ── TOP HEADER / APP BAR ──────────────────────────────── */}
      <View style={s.header}>
        <TouchableOpacity
          onPress={() => {
            if (appMode === "tracking") {
              router.replace("/(customer)/(tabs)/home");
            } else if (appMode === "instant") {
              if (instantStage === 1) setAppMode("explore");
              else setInstantStage(1);
            } else {
              router.back();
            }
          }}
          style={s.backBtn}
        >
          <MaterialIcons name={appMode === "tracking" ? "home" : "arrow-back"} size={22} color={T.text1} />
        </TouchableOpacity>

        {appMode === "explore" ? (
          <View style={s.searchWrap}>
            <MaterialIcons name="search" size={18} color={T.text3} />
            <TextInput
              placeholder="Search companies, services..."
              placeholderTextColor={T.text3}
              style={s.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <MaterialIcons name="close" size={16} color={T.text3} />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <Text style={s.headerTitle}>
            {appMode === "tracking" ? "Live Staff Tracking" : `${t("instantBooking.urgentProTitle", "ហៅជាងបន្ទាន់")} • Urgent Help`}
          </Text>
        )}

        {appMode === "explore" && (
          <View style={s.toggleWrap}>
            <TouchableOpacity
              style={[s.toggleBtn, viewMode === "map" && s.toggleActive]}
              onPress={() => setViewMode("map")}
            >
              <MaterialIcons name="map" size={18} color={viewMode === "map" ? "#FFF" : T.text2} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.toggleBtn, viewMode === "list" && s.toggleActive]}
              onPress={() => setViewMode("list")}
            >
              <MaterialIcons name="format-list-bulleted" size={18} color={viewMode === "list" ? "#FFF" : T.text2} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ── CATEGORY FILTER CHIPS (In Explore Mode) ───────────── */}
      {appMode === "explore" && viewMode === "map" && (
        <View style={s.categoryBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
            {CATEGORIES.map((cat) => {
              const active = selectedCategorySlug === cat.slug;
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setSelectedCategorySlug(cat.slug)}
                  style={[s.chip, active && { backgroundColor: cat.color, borderColor: cat.color }]}
                >
                  <MaterialCommunityIcons name={cat.icon as any} size={14} color={active ? "#FFF" : cat.color} />
                  <Text style={[s.chipText, active && { color: "#FFF" }]}>{cat.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* ── BODY: MAP OR LIST ─────────────────────────────────── */}
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        {viewMode === "list" && appMode === "explore" ? (
          /* ── LIST VIEW MODE ── */
          <FlatList
            data={filteredCompanies}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={s.listCard}
                activeOpacity={0.85}
                onPress={() => router.push(`/(customer)/company/${item.id}` as any)}
              >
                <View style={s.listAvatar}>
                  <Text style={s.listAvatarText}>{item.name.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1, paddingLeft: 12 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={s.listTitle} numberOfLines={1}>{item.name}</Text>
                    {item.verified && <MaterialCommunityIcons name="shield-check" size={15} color={T.success} />}
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                    <MaterialIcons name="star" size={14} color="#f59e0b" />
                    <Text style={s.listRating}>{item.rating.toFixed(1)}</Text>
                    <Text style={s.listMeta}>({item.reviewCount} reviews) · {item.city || "Local Pro"}</Text>
                  </View>
                </View>
                <MaterialIcons name="chevron-right" size={22} color={T.text3} />
              </TouchableOpacity>
            )}
          />
        ) : (
          /* ── MAP VIEW MODE ── */
          <View style={s.mapContainer}>
            <MapView
              ref={mapViewRef}
              provider={MAP_PROVIDER}
              style={StyleSheet.absoluteFill}
              showsUserLocation={true}
              initialRegion={{
                latitude: userLoc.latitude,
                longitude: userLoc.longitude,
                latitudeDelta: 0.035,
                longitudeDelta: 0.035,
              }}
            >
              {/* Customer / Destination Pin */}
              <Marker coordinate={targetCustomerLoc} title="Your Service Destination">
                <CustomerDestinationMarker label="Your Location" />
              </Marker>
              {/* Provider Pins (Explore & Instant stages 1-4) */}
              {(appMode === "explore" || (appMode === "instant" && instantStage <= 4)) &&
                filteredCompanies.map((c) => {
                  const isSelected = selectedCompany?.id === c.id;
                  return (
                    <Marker
                      key={c.id}
                      coordinate={{ latitude: c.lat, longitude: c.lng }}
                      title={c.name}
                      onPress={(e) => {
                        e.stopPropagation();
                        setSelectedCompany(c);
                        centerMapCamera(mapViewRef, { latitude: c.lat, longitude: c.lng }, 0.018, 600);
                      }}
                    >
                      <CompanyMapMarker company={c} isSelected={isSelected} getPinColor={getPinColor} />
                    </Marker>
                  );
                })}

              {/* Matched pro marker (Instant stage 5 — auto-dispatch winner) */}
              {appMode === "instant" && instantStage === 5 && matched && (
                <Marker
                  coordinate={{
                    latitude: matched.companyLatitude ?? userLoc.latitude,
                    longitude: matched.companyLongitude ?? userLoc.longitude,
                  }}
                  title={matched.companyName}
                >
                  <View style={s.matchedPinWrap}>
                    <View style={s.matchedPin}>
                      <MaterialCommunityIcons name="lightning-bolt" size={17} color="#FFF" />
                    </View>
                    <View style={s.matchedPinLabel}>
                      <Text style={s.matchedPinText}>{matched.etaMinutes} min</Text>
                    </View>
                  </View>
                </Marker>
              )}

              {/* Turn-by-Turn Road Route Polyline in Tracking Mode */}
              {appMode === "tracking" && effectiveRouteCoordinates.length > 1 && (
                <>
                  <Polyline
                    coordinates={effectiveRouteCoordinates}
                    strokeColor="rgba(37, 99, 235, 0.25)"
                    strokeWidth={8}
                  />
                  <Polyline
                    coordinates={effectiveRouteCoordinates}
                    strokeColor={T.accent}
                    strokeWidth={4}
                  />
                </>
              )}

              {/* Vehicle Marker in Tracking Mode */}
              {appMode === "tracking" && (
                <Marker coordinate={providerLoc} title={booking?.company?.name || "Service Staff"}>
                  <PulsingDriverMarker 
                    color={trackStatus === "arrived" ? T.success : "#2563EB"}
                    etaText={trackStatus === "arrived" ? "Arrived!" : etaVal || "On the way"} 
                  />
                </Marker>
              )}
            </MapView>

            {/* ── Tracking Route HUD Overlay (Top Floating Banner) ── */}
            {appMode === "tracking" && (
              <View style={s.trackingHud}>
                <View style={[s.hudLiveDot, trackStatus === "arrived" && { backgroundColor: T.success }]} />
                <View style={{ flex: 1 }}>
                  <Text style={s.hudTitle}>
                    {trackStatus === "arrived" ? "Staff Arrived at Your Location" : "Staff En Route"}
                  </Text>
                  <Text style={s.hudSubtitle}>
                    {booking?.company?.name || "Verified Professional"} · {trackStatus === "arrived" ? "Ready to begin" : "Live GPS navigation"}
                  </Text>
                </View>
                <View style={s.hudEtaBox}>
                  <Text style={s.hudEtaText}>{trackStatus === "arrived" ? "0m" : etaVal}</Text>
                  <Text style={s.hudEtaLabel}>{trackStatus === "arrived" ? "ARRIVED" : "ETA"}</Text>
                </View>
              </View>
            )}

            {/* Radar Pulse in Instant Request Mode (Stage 4) */}
            {appMode === "instant" && instantStage === 4 && (
              <View style={s.radarContainer} pointerEvents="none">
                <Animated.View style={[s.radarCircle, { transform: [{ scale: pulseAnim }], opacity: pulseOpacity }]} />
                <View style={s.radarCenterDot}>
                  <MaterialCommunityIcons name="radar" size={28} color={T.accent} />
                </View>
              </View>
            )}

            {/* ── Floating Company Preview Card (Universal Pin Tap) ── */}
            {selectedCompany && appMode !== "tracking" && (
              <View style={s.previewCard}>
                <TouchableOpacity style={s.previewClose} onPress={() => setSelectedCompany(null)}>
                  <MaterialIcons name="close" size={18} color={T.text2} />
                </TouchableOpacity>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View style={s.previewAvatar}>
                    <Text style={s.previewAvatarText}>{selectedCompany.name.charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1, paddingLeft: 12 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={s.previewName} numberOfLines={1}>{selectedCompany.name}</Text>
                      {selectedCompany.verified && <MaterialCommunityIcons name="shield-check" size={15} color={T.success} />}
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                      <MaterialIcons name="star" size={13} color="#f59e0b" />
                      <Text style={s.previewRating}>{selectedCompany.rating.toFixed(1)}</Text>
                      <Text style={s.previewMeta}>({selectedCompany.reviewCount} reviews) · {selectedCompany.city || "Local Pro"}</Text>
                    </View>
                  </View>
                </View>

                <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                  <TouchableOpacity
                    style={s.previewNowBtn}
                    onPress={() => handleDirectCompanyDispatch(selectedCompany)}
                    disabled={isDispatching}
                  >
                    {isDispatching ? (
                      <ActivityIndicator size="small" color="#92400E" />
                    ) : (
                      <>
                        <MaterialCommunityIcons name="lightning-bolt" size={15} color="#92400E" />
                        <Text style={s.previewNowText}>Book Now</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={s.previewScheduleBtn}
                    onPress={() => openScheduleFor(selectedCompany)}
                  >
                    <MaterialCommunityIcons name="calendar-clock" size={15} color="#FFFFFF" />
                    <Text style={s.previewScheduleText}>Schedule</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={s.previewProfileLink}
                  onPress={() => router.push(`/(customer)/company/${selectedCompany.id}` as any)}
                >
                  <Text style={s.previewProfileLinkText}>View full profile & packages</Text>
                  <MaterialIcons name="chevron-right" size={14} color={T.text3} />
                </TouchableOpacity>
              </View>
            )}

            {/* ── Schedule-a-visit Sheet (Date & Time booking from the map) ── */}
            <Modal visible={scheduleVisible && !!scheduleCompany} animationType="slide" transparent>
              <View style={s.scheduleOverlay}>
                <TouchableOpacity style={s.scheduleBackdrop} activeOpacity={1} onPress={() => setScheduleVisible(false)} />
                <ScrollView style={s.scheduleSheet} contentContainerStyle={{ paddingBottom: 32 }} bounces={false}>
                  <View style={s.scheduleHandle} />
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.scheduleTitle}>Schedule a Visit</Text>
                      <Text style={s.scheduleSubtitle} numberOfLines={1}>
                        {scheduleCompany?.name} · ★ {scheduleCompany?.rating.toFixed(1)}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => setScheduleVisible(false)} style={s.scheduleCloseBtn}>
                      <MaterialIcons name="close" size={20} color={T.text2} />
                    </TouchableOpacity>
                  </View>

                  <Text style={s.scheduleLabel}>1 · What do you need?</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 6 }}>
                    {(scheduleCompany?.services || []).map((sv, i) => {
                      const active = i === scheduleServiceIdx;
                      return (
                        <TouchableOpacity
                          key={sv.id}
                          style={[s.schedServiceCard, active && s.schedCardActive]}
                          onPress={() => setScheduleServiceIdx(i)}
                        >
                          <Text style={[s.schedServiceName, active && s.schedCardTextActive]} numberOfLines={2}>
                            {sv.name}
                          </Text>
                          {sv.basePrice != null && (
                            <Text style={[s.schedServicePrice, active && s.schedCardTextActive]}>
                              from ${sv.basePrice.toFixed(2)}
                            </Text>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  <Text style={s.scheduleLabel}>2 · When?</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                    {scheduleDates.map((d, i) => {
                      const active = i === scheduleDateIdx;
                      return (
                        <TouchableOpacity
                          key={d.value}
                          style={[s.schedChip, active && s.schedChipActive]}
                          onPress={() => setScheduleDateIdx(i)}
                        >
                          <Text style={[s.schedChipText, active && s.schedChipTextActive]}>{d.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4, marginTop: 4 }}>
                    {scheduleTimes.map((tm, i) => {
                      const active = i === scheduleTimeIdx;
                      return (
                        <TouchableOpacity
                          key={tm.value}
                          style={[s.schedChip, active && s.schedChipActive]}
                          onPress={() => setScheduleTimeIdx(i)}
                        >
                          <Text style={[s.schedChipText, active && s.schedChipTextActive]}>{tm.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  <TouchableOpacity style={s.schedConfirmBtn} onPress={handleScheduleConfirm}>
                    <Text style={s.schedConfirmText}>
                      Continue{scheduleService?.basePrice != null ? ` • $${scheduleService.basePrice.toFixed(2)}` : ""}
                    </Text>
                    <MaterialIcons name="arrow-forward" size={18} color="#FFF" />
                  </TouchableOpacity>
                  <Text style={s.schedFootnote}>
                    The company confirms your request and sends a staff member. Pay safely in escrow after the visit.
                  </Text>
                </ScrollView>
              </View>
            </Modal>

            {/* ── Floating "Need Help Now" FAB Button (In Explore Mode) ── */}
            {appMode === "explore" && !selectedCompany && (
              <TouchableOpacity
                style={s.instantFab}
                activeOpacity={0.9}
                onPress={() => {
                  setAppMode("instant");
                  setInstantStage(1);
                }}
              >
                <MaterialCommunityIcons name="lightning-bolt" size={20} color="#FFF" />
                <Text style={s.instantFabText}>{t("instantBooking.urgentProTitle", "ហៅជាងបន្ទាន់")}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── INSTANT REQUEST / TRACKING BOTTOM SHEET ───────────── */}
        {appMode !== "explore" && (
          <View style={s.bottomSheet}>
            <View style={s.dragIndicator} />

            {/* ── Visual 3-Step Walkthrough for Cambodian Users ── */}
            {appMode === "instant" && (
              <View style={s.stepGuideRow}>
                <View style={[s.stepChip, instantStage >= 1 && s.stepChipActive]}>
                  <MaterialCommunityIcons name="tools" size={12} color={instantStage >= 1 ? T.accent : T.text3} />
                  <Text style={[s.stepChipText, instantStage >= 1 && s.stepChipTextActive]}>
                    1. {t("instantBooking.step1", "រើសសេវា")}
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={14} color={T.text3} />
                <View style={[s.stepChip, instantStage >= 4 && s.stepChipActive]}>
                  <MaterialCommunityIcons name="map-marker-radius" size={12} color={instantStage >= 4 ? T.accent : T.text3} />
                  <Text style={[s.stepChipText, instantStage >= 4 && s.stepChipTextActive]}>
                    2. {t("instantBooking.step2", "រកជាងជិតបំផុត")}
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={14} color={T.text3} />
                <View style={[s.stepChip, instantStage >= 5 && s.stepChipActive]}>
                  <MaterialCommunityIcons name="credit-card-check-outline" size={12} color={instantStage >= 5 ? T.accent : T.text3} />
                  <Text style={[s.stepChipText, instantStage >= 5 && s.stepChipTextActive]}>
                    3. {t("instantBooking.step3", "បញ្ជាក់និងបង់")}
                  </Text>
                </View>
              </View>
            )}

            {/* ── INSTANT STAGE 1: PICK SERVICE + DESCRIBE (merged) ── */}
            {appMode === "instant" && instantStage === 1 && (
              <View style={{ gap: 12 }}>
                <View>
                  <Text style={s.sheetTitle}>
                    {t("instantBooking.urgentProTitle", "ហៅជាងបន្ទាន់")} • {t("instantBooking.step1", "ជ្រើសរើសសេវាកម្ម")}
                  </Text>
                  <Text style={s.sheetSubtitle}>
                    {t("instantBooking.urgentProDesc", "ជាងនៅជិតអ្នកមកដល់លឿន • មិនទាន់គិតលុយទេ")}
                  </Text>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 6 }}>
                  {CATEGORIES.filter((c) => c.id !== "all").map((cat) => {
                    const active = instantService?.id === cat.id;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[s.serviceCard, active && s.serviceCardActive]}
                        onPress={() => setInstantService({ id: cat.id, label: cat.label })}
                      >
                        <View style={[s.serviceIconBox, active && { backgroundColor: cat.color }]}>
                          <MaterialCommunityIcons name={cat.icon as any} size={28} color={active ? "#FFF" : cat.color} />
                        </View>
                        <Text style={[s.serviceCardLabel, active && { color: cat.color, fontWeight: "800" }]}>{cat.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <TextInput
                  style={s.textArea}
                  placeholder="e.g. Pipe leaking under kitchen sink, AC not cooling (optional)..."
                  placeholderTextColor={T.text3}
                  multiline
                  numberOfLines={2}
                  value={instantDesc}
                  onChangeText={setInstantDesc}
                />

                <TouchableOpacity
                  style={[s.primaryBtn, (!instantService || isDispatching) && { backgroundColor: T.border }]}
                  onPress={handleLaunchInstantRequest}
                  disabled={!instantService || isDispatching}
                >
                  {isDispatching ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <Text style={s.primaryBtnText}>
                        {t("instantBooking.findNearbyPros", "ស្វែងរកជាងឥឡូវនេះ (Find Available Pros)")}
                      </Text>
                      <MaterialIcons name="arrow-forward" size={18} color="#FFF" style={{ marginLeft: 6 }} />
                    </>
                  )}
                </TouchableOpacity>

                {/* Reassurance Banner for Cambodia Users */}
                <View style={s.reassuranceBanner}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <MaterialCommunityIcons name="shield-check" size={15} color="#059669" />
                    <Text style={s.reassuranceText}>
                      {t("instantBooking.freeToRequest", "មិនទាន់កាត់ប្រាក់ទេ • ពិនិត្យតម្លៃសិន")}
                    </Text>
                  </View>
                  <Text style={s.reassuranceSubText}>
                    {t("instantBooking.khqrCashAccepted", "ទទួល KHQR និង សាច់ប្រាក់")} • {t("instantBooking.arrivalEstimate", "មកដល់ក្នុង ១៥-៣០ នាទី")}
                  </Text>
                </View>
              </View>
            )}

            {/* ── INSTANT STAGE 4: AUTO-MATCH RADAR (waiting / no-match) ── */}
            {appMode === "instant" && instantStage === 4 && (
              <View style={{ alignItems: "center", paddingVertical: 12, gap: 8 }}>
                {noMatch ? (
                  <>
                    <MaterialCommunityIcons name="map-search-outline" size={30} color={T.text3} />
                    <Text style={s.sheetTitle}>No pro available right now</Text>
                    <Text style={s.radarText}>
                      All nearby {instantService?.label?.toLowerCase() || ""} pros are busy. Try again in a moment, or browse the map and schedule with a specific pro.
                    </Text>
                    <TouchableOpacity
                      style={s.primaryBtn}
                      onPress={() => {
                        setNoMatch(false);
                        setInstantStage(1);
                      }}
                    >
                      <Text style={s.primaryBtnText}>Try again</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={s.cancelBtn}
                      onPress={() => {
                        setNoMatch(false);
                        setAppMode("explore");
                        setInstantStage(1);
                        setSelectedCompany(null);
                      }}
                    >
                      <Text style={s.cancelText}>Browse pros on map</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <ActivityIndicator size="small" color={T.accent} />
                    <Text style={s.sheetTitle}>Finding your nearest pro...</Text>
                    <Text style={s.radarText}>{radarStatusText}</Text>
                    <TouchableOpacity style={s.cancelBtn} onPress={() => setInstantStage(1)}>
                      <Text style={s.cancelText}>Cancel search</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}

            {/* ── INSTANT STAGE 5: MATCHED PRO (auto-dispatch winner) ── */}
            {appMode === "instant" && instantStage === 5 && matched && (
              <View style={{ gap: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <Text style={s.sheetTitle} numberOfLines={1}>Pro Matched</Text>
                  <View style={s.matchedFlag}>
                    <MaterialCommunityIcons name="handshake" size={13} color="#059669" />
                    <Text style={s.matchedFlagText}>AUTO-DISPATCH</Text>
                  </View>
                </View>

                <View style={s.matchedCard}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View style={s.matchedAvatar}>
                      <Text style={s.matchedAvatarText}>{matched.companyName.charAt(0)}</Text>
                    </View>
                    <View style={{ flex: 1, paddingLeft: 12 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Text style={s.matchedName} numberOfLines={1}>{matched.companyName}</Text>
                        <MaterialCommunityIcons name="shield-check" size={14} color={T.success} />
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
                        <MaterialIcons name="star" size={12} color="#f59e0b" />
                        <Text style={s.matchedMeta}>{matched.rating.toFixed(1)} · nearest available pro</Text>
                      </View>
                    </View>
                  </View>

                  <View style={s.matchedChipsRow}>
                    <View style={s.matchedChip}>
                      <MaterialIcons name="timer" size={13} color={T.accent} />
                      <Text style={s.matchedChipText}>ETA {matched.etaMinutes} min</Text>
                    </View>
                    {matched.distanceKm != null && (
                      <View style={s.matchedChip}>
                        <MaterialIcons name="near-me" size={13} color={T.accent} />
                        <Text style={s.matchedChipText}>
                          {matched.distanceKm < 1 ? `${Math.round(matched.distanceKm * 1000)} m` : `${matched.distanceKm.toFixed(1)} km`}
                        </Text>
                      </View>
                    )}
                    <View style={s.matchedChip}>
                      <MaterialIcons name="payments" size={13} color={T.accent} />
                      <Text style={s.matchedChipText}>${matched.totalPrice.toFixed(2)}</Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity style={s.primaryBtn} onPress={handleMatchedContinue} disabled={isDispatching}>
                  {isDispatching ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <Text style={s.primaryBtnText}>{t("instantBooking.payAfterDone", "ជ្រើសរើស • ទូទាត់ក្រោយពេលធ្វើរួច")}</Text>
                      <MaterialIcons name="arrow-forward" size={18} color="#FFF" style={{ marginLeft: 6 }} />
                    </>
                  )}
                </TouchableOpacity>
                <TouchableOpacity style={s.cancelBtn} onPress={handleCancelInstant} disabled={isDispatching}>
                  <Text style={s.cancelText}>Cancel request</Text>
                </TouchableOpacity>

                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5 }}>
                  <MaterialCommunityIcons name="shield-check" size={14} color="#059669" />
                  <Text style={{ fontSize: 11, color: "#059669", fontWeight: "600" }}>
                    {t("instantBooking.freeToRequest", "មិនទាន់កាត់ប្រាក់ទេ • បញ្ជាក់តម្លៃផ្ទាល់")}
                  </Text>
                </View>
              </View>
            )}

            {/* ── TRACKING MODE ── */}
            {appMode === "tracking" && (
              <View style={{ gap: 10 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View>
                    <Text style={s.sheetTitle}>{booking?.company?.name || "Technician Assigned"}</Text>
                    <Text style={s.sheetSubtitle}>{trackStatus === "arrived" ? "Staff has arrived!" : `En route • ETA: ${etaVal}`}</Text>
                  </View>
                  <View style={[s.trackBadge, trackStatus === "arrived" && { backgroundColor: T.success }]}>
                    <Text style={s.trackBadgeText}>{trackStatus.toUpperCase()}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
                  <TouchableOpacity
                    style={s.trackActionBtn}
                    onPress={() => {
                      const phone = booking?.company?.phone;
                      if (phone) Linking.openURL(`tel:${phone}`);
                      else Alert.alert("Provider Phone", "Phone contact available upon arrival.");
                    }}
                  >
                    <MaterialIcons name="phone" size={18} color={T.accent} />
                    <Text style={s.trackActionText}>Call</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={s.trackActionBtn}
                    onPress={() => router.push({ pathname: "/(customer)/chat" as any, params: { bookingId: activeBookingId } })}
                  >
                    <MaterialIcons name="chat" size={18} color={T.accent} />
                    <Text style={s.trackActionText}>Message</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.trackActionBtn, { borderColor: "#ef4444" }]}
                    onPress={() => {
                      Alert.alert("Cancel Booking?", "Free cancellation until staff arrives.", [
                        { text: "No", style: "cancel" },
                        { text: "Cancel Request", style: "destructive", onPress: () => router.replace("/(customer)/(tabs)/home") },
                      ]);
                    }}
                  >
                    <MaterialIcons name="close" size={18} color="#ef4444" />
                    <Text style={[s.trackActionText, { color: "#ef4444" }]}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── STYLES ──────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8FAFC" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
    gap: 10,
    zIndex: 20,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 16, fontWeight: "800", color: T.text1 },
  searchWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 38,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  searchInput: { flex: 1, fontSize: 13, color: T.text1, fontWeight: "500" },
  toggleWrap: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
    padding: 3,
    gap: 2,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  toggleBtn: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  toggleActive: { backgroundColor: T.accent },

  categoryBar: { backgroundColor: "#FFF", paddingVertical: 10, borderBottomWidth: 1, borderColor: "#E2E8F0" },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  chipText: { fontSize: 12, fontWeight: "700", color: T.text2 },

  mapContainer: { flex: 1, position: "relative" },

  // Markers
  customerMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: T.accent,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFF",
    elevation: 4,
  },
  providerPin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: T.accent,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFF",
    elevation: 4,
  },
  providerPinActive: { transform: [{ scale: 1.2 }], borderColor: "#10B981" },
  providerPinLetter: { color: "#FFF", fontSize: 13, fontWeight: "900" },
  providerPinRating: {
    position: "absolute",
    top: -6,
    right: -10,
    backgroundColor: "#FFF",
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: T.border,
  },
  providerPinRatingText: { fontSize: 9, fontWeight: "800", color: T.text1 },
  vehicleMarker: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: T.accent,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFF",
    elevation: 5,
  },

  // Floating Company Preview Card
  previewCard: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 16,
    ...HEAVY_SHADOW,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    zIndex: 30,
  },
  previewClose: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  previewAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: T.accentLight,
    alignItems: "center",
    justifyContent: "center",
  },
  previewAvatarText: { fontSize: 18, fontWeight: "800", color: T.accent },
  previewName: { fontSize: 15, fontWeight: "800", color: T.text1 },
  previewRating: { fontSize: 12, fontWeight: "700", color: T.text1 },
  previewMeta: { fontSize: 12, color: T.text2, fontWeight: "500" },
  previewNowBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FDE68A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  previewNowText: { fontSize: 13, fontWeight: "800", color: "#92400E" },
  previewScheduleBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#0A192F",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  previewScheduleText: { fontSize: 13, fontWeight: "800", color: "#FFFFFF" },
  previewProfileLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    paddingVertical: 4,
  },
  previewProfileLinkText: { fontSize: 12, fontWeight: "600", color: T.text3 },

  // Schedule-a-visit Sheet
  scheduleOverlay: { flex: 1, justifyContent: "flex-end" },
  scheduleBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },
  scheduleSheet: {
    maxHeight: "82%",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
  },
  scheduleHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E2E8F0",
    alignSelf: "center",
    marginBottom: 16,
  },
  scheduleTitle: { fontSize: 20, fontWeight: "800", color: T.text1, letterSpacing: -0.3 },
  scheduleSubtitle: { fontSize: 12, color: T.text3, marginTop: 2, fontWeight: "600" },
  scheduleCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  scheduleLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: T.text3,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 18,
    marginBottom: 6,
  },
  schedServiceCard: {
    width: 150,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
  },
  schedServiceName: { fontSize: 13, fontWeight: "800", color: T.text1, lineHeight: 18 },
  schedServicePrice: { fontSize: 12, fontWeight: "700", color: T.accent, marginTop: 6 },
  schedCardActive: { borderColor: "#0A192F", backgroundColor: "#F0F4F8" },
  schedCardTextActive: { color: "#0A192F" },
  schedChip: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
  },
  schedChipActive: { backgroundColor: "#0A192F", borderColor: "#0A192F" },
  schedChipText: { fontSize: 12, fontWeight: "700", color: T.text2 },
  schedChipTextActive: { color: "#FFFFFF" },
  schedConfirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#0A192F",
    borderRadius: 16,
    padding: 18,
    marginTop: 20,
  },
  schedConfirmText: { fontSize: 15, fontWeight: "800", color: "#FFFFFF" },
  schedFootnote: { fontSize: 11, color: T.text3, textAlign: "center", marginTop: 12, lineHeight: 16 },

  // Instant FAB
  instantFab: {
    position: "absolute",
    bottom: 24,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: T.accent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    ...HEAVY_SHADOW,
    elevation: 8,
  },
  instantFabText: { color: "#FFF", fontSize: 14, fontWeight: "800" },

  // Bottom Sheet in Instant/Tracking
  bottomSheet: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 28 : 20,
    ...HEAVY_SHADOW,
    borderTopWidth: 1,
    borderColor: "#F1F5F9",
  },
  dragIndicator: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#CBD5E1",
    alignSelf: "center",
    marginBottom: 10,
  },
  // Step Guide Row
  stepGuideRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  stepChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  stepChipActive: {
    backgroundColor: T.accentLight,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  stepChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: T.text3,
  },
  stepChipTextActive: {
    color: T.accent,
    fontWeight: "800",
  },
  // Reassurance Banner
  reassuranceBanner: {
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 4,
    gap: 3,
  },
  reassuranceText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#166534",
  },
  reassuranceSubText: {
    fontSize: 10,
    color: "#15803D",
    fontWeight: "500",
  },
  sheetTitle: { fontSize: 16, fontWeight: "800", color: T.text1 },
  sheetSubtitle: { fontSize: 12, color: T.text2, marginTop: 2, lineHeight: 16 },

  // Service Cards
  serviceCard: {
    alignItems: "center",
    width: 80,
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  serviceCardActive: { borderWidth: 2, borderColor: T.accent, paddingVertical: 9 },
  serviceIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  serviceCardLabel: { fontSize: 11, fontWeight: "700", color: T.text1, textAlign: "center" },

  // Form & Buttons
  textArea: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    color: T.text1,
    height: 70,
    textAlignVertical: "top",
  },
  primaryBtn: {
    backgroundColor: T.accent,
    height: 46,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: { color: "#FFF", fontSize: 14, fontWeight: "800" },

  // Radar in Stage 4
  radarContainer: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center" },
  radarCircle: { width: 160, height: 160, borderRadius: 80, backgroundColor: "rgba(99, 102, 241, 0.2)", borderWidth: 2, borderColor: T.accent },
  radarCenterDot: { position: "absolute", width: 44, height: 44, borderRadius: 22, backgroundColor: "#FFF", alignItems: "center", justifyContent: "center", elevation: 5 },
  radarText: { fontSize: 13, color: T.accent, fontWeight: "700" },
  cancelBtn: { height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "#FEE2E2", width: "100%", marginTop: 4 },
  cancelText: { color: "#EF4444", fontSize: 13, fontWeight: "700" },

  // Matched pro (Stage 5 auto-dispatch)
  matchedPinWrap: { alignItems: "center", elevation: 6 },
  matchedPin: { width: 38, height: 38, borderRadius: 19, backgroundColor: T.accent, alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: "#FFF" },
  matchedPinLabel: { backgroundColor: "#0F172A", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, marginTop: 4 },
  matchedPinText: { color: "#FFF", fontSize: 11, fontWeight: "800" },
  matchedFlag: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#ECFDF5", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  matchedFlagText: { fontSize: 10, fontWeight: "900", color: "#059669", letterSpacing: 0.5 },
  matchedCard: { backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 16, padding: 12 },
  matchedAvatar: { width: 42, height: 42, borderRadius: 12, backgroundColor: T.accent, alignItems: "center", justifyContent: "center" },
  matchedAvatarText: { color: "#FFF", fontSize: 16, fontWeight: "900" },
  matchedName: { fontSize: 14, fontWeight: "800", color: T.text1, flex: 1 },
  matchedMeta: { fontSize: 11, color: T.text2, fontWeight: "600" },
  matchedChipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  matchedChip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#FFF", paddingHorizontal: 9, paddingVertical: 5, borderRadius: 9, borderWidth: 1, borderColor: "#E2E8F0" },
  matchedChipText: { fontSize: 12, fontWeight: "800", color: T.text1 },

  // Tracking Action Row
  trackBadge: { backgroundColor: T.accent, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  trackBadgeText: { color: "#FFF", fontSize: 10, fontWeight: "800" },
  trackActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  trackActionText: { fontSize: 12, fontWeight: "700", color: T.text1 },

  // List View Cards
  listCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "#E2E8F0", ...CARD_SHADOW },
  listAvatar: { width: 44, height: 44, borderRadius: 12, backgroundColor: T.accentLight, alignItems: "center", justifyContent: "center" },
  listAvatarText: { fontSize: 18, fontWeight: "800", color: T.accent },
  listTitle: { fontSize: 15, fontWeight: "800", color: T.text1 },
  listRating: { fontSize: 13, fontWeight: "700", color: T.text1 },
  listMeta: { fontSize: 12, color: T.text2, fontWeight: "500" },

  // Tracking HUD Overlay
  trackingHud: {
    position: "absolute",
    top: 14,
    left: 16,
    right: 16,
    backgroundColor: "#FFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    ...HEAVY_SHADOW,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    zIndex: 30,
  },
  hudLiveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#EF4444",
  },
  hudTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: T.text1,
  },
  hudSubtitle: {
    fontSize: 11,
    color: T.text2,
    marginTop: 2,
  },
  hudEtaBox: {
    backgroundColor: T.accentLight,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: "center",
  },
  hudEtaText: {
    fontSize: 13,
    fontWeight: "900",
    color: T.accent,
  },
  hudEtaLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: T.accent,
    letterSpacing: 0.5,
  },

  // Custom Map Marker Pill & Pulsing Styles
  markerWrap: { alignItems: "center", justifyContent: "center" },
  etaPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0F172A",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "#334155",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  etaPillText: { fontSize: 11, fontWeight: "800", color: "#FFFFFF" },
  markerCoreWrap: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  pulseGlow: { position: "absolute", width: 28, height: 28, borderRadius: 14 },
  driverMarkerBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  destPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0F172A",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginBottom: 2,
    borderWidth: 1,
    borderColor: "#334155",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  destPillText: { fontSize: 11, fontWeight: "800", color: "#FFFFFF" },
  destPinIconWrap: { alignItems: "center", justifyContent: "center" },

  // Company Brand Marker Styles
  companyMarkerWrap: { alignItems: "center", justifyContent: "center" },
  companyPillActive: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0F172A",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: T.accent,
    gap: 6,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  companyPillNameActive: { fontSize: 12, fontWeight: "800", color: "#FFFFFF", maxWidth: 120 },
  companyRatingTag: { flexDirection: "row", alignItems: "center", gap: 2, backgroundColor: "rgba(255,255,255,0.15)", paddingHorizontal: 5, paddingVertical: 1, borderRadius: 6 },
  companyRatingText: { fontSize: 10, fontWeight: "800", color: "#FFFFFF" },
  companyLogoBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  companyLogoBadgeActive: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 3,
    borderColor: T.accent,
    elevation: 8,
    shadowOpacity: 0.35,
    shadowRadius: 5,
  },
  companyLogoImage: { width: "100%", height: "100%" },
  companyLetterCore: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center" },
  companyLetterText: { fontSize: 16, fontWeight: "900", color: "#FFFFFF" },
});
