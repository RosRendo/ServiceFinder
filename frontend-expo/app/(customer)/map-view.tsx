import React, { useState, useEffect, useRef, useCallback } from "react";
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

interface Bid {
  id: string;
  companyName: string;
  rating: number;
  priceEstimate: string;
  eta: string;
  distance: string;
  latitude?: number;
  longitude?: number;
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

  // Instant Request Stage State (1: Pick Service | 2: Problem | 3: Confirm | 4: Radar | 5: Bids)
  const [instantStage, setInstantStage] = useState<number>(1);
  const [instantService, setInstantService] = useState<{ id: string; label: string } | null>(null);
  const [instantDesc, setInstantDesc] = useState("");
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [selectedBidIdx, setSelectedBidIdx] = useState(0);
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

  // 4. WebSocket Listener for Instant Request Bids
  useEffect(() => {
    if (appMode !== "instant" || (instantStage !== 4 && instantStage !== 5)) return;
    if (!activeRequestId) return;

    let socket: Socket | null = null;
    let timers: any[] = [];

    socket = io(SOCKET_URL || API_URL, { transports: ["websocket"] });
    socket.on("connect", () => {
      socket?.emit("join_instant_request", { requestId: activeRequestId });
    });

    socket.on("bid_received", (newBid: any) => {
      setBids((prev) => {
        if (prev.some((b) => b.id === newBid.id)) return prev;
        const updated = [...prev, newBid];
        return updated.sort((a, b) => (parseInt(a.eta) || 999) - (parseInt(b.eta) || 999));
      });
      setInstantStage(5);
    });

    if (instantStage === 4) {
      const stages = [
        { time: 0, text: "Scanning 3km radius..." },
        { time: 4000, text: "Expanding search to 5km..." },
        { time: 8000, text: "Contacting top-rated pros within 10km..." },
      ];
      timers = stages.map((st) => setTimeout(() => setRadarStatusText(st.text), st.time));
    }

    return () => {
      if (socket) {
        socket.emit("leave_instant_request", { requestId: activeRequestId });
        socket.disconnect();
      }
      timers.forEach(clearTimeout);
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
        socket.emit("leave_booking", String(activeBookingId));
        socket.disconnect();
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
      const catId = company.categorySlug || "cleaning";
      const found = CATEGORIES.find((c) => catId.includes(c.id)) || CATEGORIES[1];
      setInstantService({ id: found.id, label: found.label });
      setAppMode("instant");
      setInstantStage(4);
      setSelectedCompany(company);

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

      setActiveRequestId(reqId);
      centerMapCamera(mapViewRef, { latitude: company.lat, longitude: company.lng }, 0.018, 800);
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message || err.message || "Failed to dispatch request");
      setInstantStage(1);
    } finally {
      setIsDispatching(false);
    }
  };

  // Launch Instant Request Dispatch
  const handleLaunchInstantRequest = async () => {
    if (!instantService) return;
    const finalDesc = instantDesc.trim() || `Urgent ${instantService.label} request`;
    try {
      setIsDispatching(true);
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

      setActiveRequestId(reqId);
      setInstantStage(4);
      centerMapCamera(mapViewRef, userLoc, 0.018, 800);
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message || err.message || "Failed to submit request");
    } finally {
      setIsDispatching(false);
    }
  };

  // Select Bid Offer & Route to Checkout
  const handleSelectBid = async () => {
    if (bids.length === 0) return;
    const selected = bids[selectedBidIdx];
    try {
      setIsDispatching(true);
      const res = await api.post(`/api/instant-requests/${activeRequestId}/select`, {
        bidId: selected.id,
      });
      const bId = res.data?.data?.bookingId || res.data?.bookingId;
      if (bId) {
        setActiveBookingId(bId);
        router.push({
          pathname: "/(customer)/checkout" as any,
          params: { bookingId: bId, isInstant: "true" },
        });
      }
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message || err.message || "Failed to select provider");
    } finally {
      setIsDispatching(false);
    }
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

              {/* Provider Pins in Explore & Instant Mode (Stages 1-4) */}
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
                        if (appMode === "instant") {
                          const catId = c.categorySlug || "cleaning";
                          const found = CATEGORIES.find((cat) => catId.includes(cat.id)) || CATEGORIES[1];
                          setInstantService({ id: found.id, label: found.label });
                          setInstantStage(2);
                        }
                        centerMapCamera(mapViewRef, { latitude: c.lat, longitude: c.lng }, 0.018, 600);
                      }}
                    >
                      <CompanyMapMarker company={c} isSelected={isSelected} getPinColor={getPinColor} />
                    </Marker>
                  );
                })}

              {/* Bid Pins in Instant Request Mode (Stage 5) */}
              {appMode === "instant" &&
                instantStage === 5 &&
                bids.map((b, i) => {
                  const bLat = b.latitude ?? (userLoc.latitude + 0.006 * (i + 1));
                  const bLng = b.longitude ?? (userLoc.longitude + 0.004 * (i + 1));
                  const isSelected = selectedBidIdx === i;
                  return (
                    <Marker key={b.id} coordinate={{ latitude: bLat, longitude: bLng }} onPress={() => setSelectedBidIdx(i)}>
                      <View style={[s.bidBadge, isSelected && s.bidBadgeActive]}>
                        <Text style={[s.bidPrice, isSelected && { color: "#FFF" }]}>{b.priceEstimate}</Text>
                        <Text style={[s.bidEta, isSelected && { color: "rgba(255,255,255,0.85)" }]}>{b.eta}m</Text>
                      </View>
                    </Marker>
                  );
                })}

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
                    style={s.previewProfileBtn}
                    onPress={() => router.push(`/(customer)/company/${selectedCompany.id}` as any)}
                  >
                    <Text style={s.previewProfileText}>View Profile</Text>
                    <MaterialIcons name="arrow-forward" size={14} color="#FFF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={s.previewUrgentBtn}
                    onPress={() => handleDirectCompanyDispatch(selectedCompany)}
                    disabled={isDispatching}
                  >
                    {isDispatching ? (
                      <ActivityIndicator size="small" color={T.accent} />
                    ) : (
                      <>
                        <MaterialCommunityIcons name="lightning-bolt" size={16} color={T.accent} />
                        <Text style={s.previewUrgentText}>{t("instantBooking.requestThisPro", "ហៅជាងនេះភ្លាម")}</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

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
                  <MaterialCommunityIcons name="chat-processing-outline" size={12} color={instantStage >= 5 ? T.accent : T.text3} />
                  <Text style={[s.stepChipText, instantStage >= 5 && s.stepChipTextActive]}>
                    3. {t("instantBooking.step3", "ជជែក/ខល")}
                  </Text>
                </View>
              </View>
            )}

            {/* ── INSTANT STAGE 1: PICK URGENT SERVICE ── */}
            {appMode === "instant" && instantStage === 1 && (
              <View style={{ gap: 12 }}>
                {selectedCompany ? (
                  <View style={{ backgroundColor: T.accentLight, padding: 12, borderRadius: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: T.accent, alignItems: "center", justifyContent: "center" }}>
                        <Text style={{ color: "#FFF", fontWeight: "900" }}>{selectedCompany.name.charAt(0)}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: "800", color: T.text1 }} numberOfLines={1}>Direct: {selectedCompany.name}</Text>
                        <Text style={{ fontSize: 11, color: T.text2 }}>★ {selectedCompany.rating.toFixed(1)} · {selectedCompany.city || "Local Pro"}</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={{ backgroundColor: T.accent, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}
                      onPress={() => handleDirectCompanyDispatch(selectedCompany)}
                      disabled={isDispatching}
                    >
                      <Text style={{ color: "#FFF", fontSize: 12, fontWeight: "800" }}>{t("instantBooking.requestThisPro", "ហៅជាង")}</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View>
                    <Text style={s.sheetTitle}>
                      {t("instantBooking.urgentProTitle", "ហៅជាងបន្ទាន់")} • {t("instantBooking.step1", "ជ្រើសរើសសេវាកម្ម")}
                    </Text>
                    <Text style={s.sheetSubtitle}>
                      {t("instantBooking.urgentProDesc", "ជាងនៅជិតអ្នកមកដល់លឿន • មិនទាន់គិតលុយទេ")}
                    </Text>
                  </View>
                )}

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 6 }}>
                  {CATEGORIES.filter((c) => c.id !== "all").map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={s.serviceCard}
                      onPress={() => {
                        setInstantService({ id: cat.id, label: cat.label });
                        setInstantStage(2);
                      }}
                    >
                      <View style={[s.serviceIconBox, { backgroundColor: cat.color + "15" }]}>
                        <MaterialCommunityIcons name={cat.icon as any} size={28} color={cat.color} />
                      </View>
                      <Text style={s.serviceCardLabel}>{cat.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

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

            {/* ── INSTANT STAGE 2: PROBLEM DETAILS ── */}
            {appMode === "instant" && instantStage === 2 && (
              <View style={{ gap: 12 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View>
                    <Text style={s.sheetTitle}>Describe the issue</Text>
                    <Text style={s.sheetSubtitle}>{selectedCompany ? `Direct to ${selectedCompany.name}` : `Category: ${instantService?.label}`}</Text>
                  </View>
                  {selectedCompany && (
                    <View style={{ backgroundColor: T.accentLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                      <Text style={{ color: T.accent, fontSize: 11, fontWeight: "800" }}>Direct Pro</Text>
                    </View>
                  )}
                </View>
                <TextInput
                  style={s.textArea}
                  placeholder={selectedCompany ? `e.g. Urgent help needed from ${selectedCompany.name}...` : "e.g. Pipe leaking under kitchen sink, AC not cooling..."}
                  placeholderTextColor={T.text3}
                  multiline
                  numberOfLines={3}
                  value={instantDesc}
                  onChangeText={setInstantDesc}
                />
                <TouchableOpacity
                  style={s.primaryBtn}
                  onPress={() => {
                    if (selectedCompany) {
                      handleDirectCompanyDispatch(selectedCompany);
                    } else {
                      setInstantStage(3);
                    }
                  }}
                  disabled={isDispatching}
                >
                  {isDispatching ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <Text style={s.primaryBtnText}>
                        {selectedCompany ? `${t("instantBooking.requestThisPro", "ហៅជាងនេះភ្លាម")} (Direct)` : `${t("common.continue", "បន្ត • Continue")}`}
                      </Text>
                      <MaterialIcons name="arrow-forward" size={18} color="#FFF" style={{ marginLeft: 6 }} />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* ── INSTANT STAGE 3: CONFIRM DISPATCH ── */}
            {appMode === "instant" && instantStage === 3 && (
              <View style={{ gap: 12 }}>
                <View>
                  <Text style={s.sheetTitle}>{t("instantBooking.findNearbyPros", "ស្វែងរកជាងនៅជិតអ្នក • Find Nearby Pros")}</Text>
                  <Text style={s.sheetSubtitle}>{t("instantBooking.broadcastSub", "យើងនឹងស្វែងរក និងជូនដំណឹងដល់ជាងជំនាញនៅជិតអ្នក 5-10km")}</Text>
                </View>
                <View style={s.summaryCard}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <MaterialCommunityIcons name="toolbox-outline" size={18} color={T.accent} />
                    <Text style={s.summaryText}>{instantService?.label}</Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <MaterialCommunityIcons name="clock-fast" size={18} color={T.success} />
                    <Text style={s.summaryText}>{t("instantBooking.arrivalEstimate", "មកដល់ក្នុង 15-30 នាទី (Arrives in 15-30 mins)")}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[s.primaryBtn, isDispatching && { backgroundColor: T.border }]}
                  onPress={handleLaunchInstantRequest}
                  disabled={isDispatching}
                >
                  {isDispatching ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={s.primaryBtnText}>{t("instantBooking.findNearbyPros", "ស្វែងរកជាងឥឡូវនេះ (Find Available Pros)")}</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* ── INSTANT STAGE 4: RADAR MATCHING ── */}
            {appMode === "instant" && instantStage === 4 && (
              <View style={{ alignItems: "center", paddingVertical: 12, gap: 8 }}>
                <ActivityIndicator size="small" color={T.accent} />
                <Text style={s.sheetTitle}>Broadcasting Request...</Text>
                <Text style={s.radarText}>{radarStatusText}</Text>
                <TouchableOpacity style={s.cancelBtn} onPress={() => setInstantStage(1)}>
                  <Text style={s.cancelText}>Cancel Search</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ── INSTANT STAGE 5: BID SELECTION ── */}
            {appMode === "instant" && instantStage === 5 && (
              <View style={{ gap: 10 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={s.sheetTitle}>Offers Received ({bids.length})</Text>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: T.accent }}>Fastest ETA</Text>
                </View>

                {bids.length === 0 ? (
                  <View style={{ paddingVertical: 20, alignItems: "center" }}>
                    <ActivityIndicator size="small" color={T.accent} />
                    <Text style={{ color: T.text2, marginTop: 8 }}>Waiting for provider bids...</Text>
                  </View>
                ) : (
                  <>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingVertical: 4 }}>
                      {bids.map((b, idx) => {
                        const isSelected = selectedBidIdx === idx;
                        return (
                          <TouchableOpacity
                            key={b.id}
                            style={[s.bidCard, isSelected && s.bidCardSelected]}
                            onPress={() => setSelectedBidIdx(idx)}
                          >
                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                              <Text style={s.bidCardName} numberOfLines={1}>{b.companyName}</Text>
                              <Text style={s.bidCardPrice}>{b.priceEstimate}</Text>
                            </View>
                            <View style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
                              <View style={s.bidTag}>
                                <MaterialIcons name="star" size={12} color="#f59e0b" />
                                <Text style={s.bidTagText}>{b.rating}</Text>
                              </View>
                              <View style={s.bidTag}>
                                <MaterialIcons name="timer" size={12} color={T.accent} />
                                <Text style={s.bidTagText}>{b.eta} mins</Text>
                              </View>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                    <TouchableOpacity style={s.primaryBtn} onPress={handleSelectBid} disabled={isDispatching}>
                      {isDispatching ? <ActivityIndicator color="#FFF" /> : <Text style={s.primaryBtnText}>{t("instantBooking.payAfterDone", "ជ្រើសរើស • ទូទាត់ក្រោយពេលធ្វើរួច")}</Text>}
                    </TouchableOpacity>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, marginTop: 4 }}>
                      <MaterialCommunityIcons name="shield-check" size={14} color="#059669" />
                      <Text style={{ fontSize: 11, color: "#059669", fontWeight: "600" }}>
                        {t("instantBooking.freeToRequest", "មិនទាន់កាត់ប្រាក់ទេ • បញ្ជាក់តម្លៃផ្ទាល់")}
                      </Text>
                    </View>
                  </>
                )}
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
  previewProfileBtn: {
    flex: 1.2,
    height: 40,
    borderRadius: 12,
    backgroundColor: T.accent,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  previewProfileText: { fontSize: 13, fontWeight: "800", color: "#FFF" },
  previewUrgentBtn: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  previewUrgentText: { fontSize: 13, fontWeight: "700", color: T.accent },

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
  summaryCard: { backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 14, padding: 12, gap: 6 },
  summaryText: { fontSize: 13, color: T.text1, fontWeight: "600" },

  // Radar in Stage 4
  radarContainer: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center" },
  radarCircle: { width: 160, height: 160, borderRadius: 80, backgroundColor: "rgba(99, 102, 241, 0.2)", borderWidth: 2, borderColor: T.accent },
  radarCenterDot: { position: "absolute", width: 44, height: 44, borderRadius: 22, backgroundColor: "#FFF", alignItems: "center", justifyContent: "center", elevation: 5 },
  radarText: { fontSize: 13, color: T.accent, fontWeight: "700" },
  cancelBtn: { height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "#FEE2E2", width: "100%", marginTop: 4 },
  cancelText: { color: "#EF4444", fontSize: 13, fontWeight: "700" },

  // Bid Badges
  bidBadge: { backgroundColor: "#FFF", borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1.5, borderColor: T.accent, flexDirection: "row", gap: 4, elevation: 3 },
  bidBadgeActive: { backgroundColor: T.accent },
  bidPrice: { fontSize: 12, fontWeight: "800", color: T.accent },
  bidEta: { fontSize: 10, fontWeight: "700", color: T.text3 },
  bidCard: { width: 180, backgroundColor: "#F8FAFC", borderRadius: 14, padding: 12, borderWidth: 1.5, borderColor: "#E2E8F0" },
  bidCardSelected: { borderColor: T.accent, backgroundColor: T.accent + "08" },
  bidCardName: { fontSize: 13, fontWeight: "800", color: T.text1, flex: 1 },
  bidCardPrice: { fontSize: 14, fontWeight: "900", color: T.accent, marginLeft: 6 },
  bidTag: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "#FFF", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: "#E2E8F0" },
  bidTagText: { fontSize: 11, fontWeight: "700", color: T.text1 },

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
