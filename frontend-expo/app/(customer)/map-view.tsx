import React, { useState, useEffect, useRef } from "react";
import { Image } from "expo-image";
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, Animated, Easing, Platform, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import MapView, { Marker } from "react-native-maps";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { api } from "@/store/authStore";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ExpoLocation from "expo-location";

// Default map center (fallback if no company has coords)
const DEFAULT_LAT = 3.147;
const DEFAULT_LNG = 101.6938; // Kuala Lumpur

const T = {
  bg: "#FFFFFF", surface: "#FFFFFF", border: "#EBEBEB",
  accent: "#0A192F", accentLight: "#F7F7F7",
  text1: "#111827", text2: "#717171", text3: "#B0B0B0",
  error: "#E31C5F", success: "#00A699", warning: "#FFB800",
  blueBg: "#F7F7F7", blueText: "#1D4ED8",
};

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  android: { elevation: 2 },
});

interface CompanyPin {
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
}

export default function MapViewScreen() {
  const router = useRouter();
  const { categoryId, categorySlug } = useLocalSearchParams<{ categoryId?: string; categorySlug?: string }>();

  const [companies, setCompanies] = useState<CompanyPin[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<CompanyPin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userLoc, setUserLoc] = useState<{lat: number, lng: number} | null>(null);
  const [locStatus, setLocStatus] = useState<'pending' | 'resolved'>('pending');
  const webviewRef = useRef<WebView>(null);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await ExpoLocation.getCurrentPositionAsync({ accuracy: ExpoLocation.Accuracy.Balanced });
          setUserLoc({ lat: loc.coords.latitude, lng: loc.coords.longitude });
        }
      } catch (e) {
      } finally {
        setLocStatus('resolved');
      }
    })();
  }, []);

  useEffect(() => {
    if (locStatus === 'pending') return;

    const loadCompanies = async () => {
      setIsLoading(true);
      try {
        const params: any = { limit: 50, categoryId: categoryId || categorySlug || undefined };
        if (userLoc) {
          params.lat = userLoc.lat;
          params.lng = userLoc.lng;
        }

        const res = await api.get("/api/companies", { params });
        const raw: any[] = res.data?.data?.companies ?? res.data?.companies ?? res.data?.data ?? res.data ?? [];
        const pins: CompanyPin[] = raw
          .filter((c: any) => c.latitude != null && c.longitude != null && !isNaN(Number(c.latitude)) && !isNaN(Number(c.longitude)))
          .map((c: any) => ({
            id: c.id.toString(),
            name: c.name,
            lat: Number(c.latitude),
            lng: Number(c.longitude),
            rating: Number(c.rating ?? c.ratingSummary?.averageRating ?? 0),
            reviewCount: Number(c.reviewCount ?? c.ratingSummary?.totalReviews ?? 0),
            description: c.description,
            logoUrl: c.logoUrl,
            city: c.city,
            verified: c.verificationStatus === "verified" || c.verified,
          }));
        setCompanies(pins);
      } catch (e) {
        // If the request fails, show empty map (graceful degradation)
      } finally {
        setIsLoading(false);
      }
    };
    loadCompanies();
  }, [categoryId, categorySlug, locStatus]);

  // Build Leaflet HTML with dynamic markers injected
  const buildMapHTML = (pins: CompanyPin[]) => {
    const centerLat = pins.length > 0 ? pins[0].lat : DEFAULT_LAT;
    const centerLng = pins.length > 0 ? pins[0].lng : DEFAULT_LNG;

    const markersJS = pins
      .map(
        (p) => `
        {
          id: ${JSON.stringify(p.id)},
          lat: ${p.lat},
          lng: ${p.lng},
          label: ${JSON.stringify(p.name.charAt(0).toUpperCase())}
        }
      `
      )
      .join(",");

    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: 100%; height: 100%; overflow: hidden; background: ${T.bg}; }
      #map { width: 100%; height: 100%; }
      .pin-marker {
        width: 36px; height: 36px;
        background: ${T.accent};
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        display: flex; align-items: center; justify-content: center;
        font-size: 14px; font-weight: bold; color: white;
        font-family: -apple-system, system-ui, sans-serif;
      }
      .pin-inner { transform: rotate(45deg); }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script>
      const map = L.map('map', { zoomControl: false }).setView([${centerLat}, ${centerLng}], 13);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors',
        subdomains: 'abcd', maxZoom: 20
      }).addTo(map);

      function send(type, payload) {
        try {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type, payload }));
          }
        } catch(e) {}
      }

      let suppressMapClick = false;

      map.on('click', () => {
        if (!suppressMapClick) send('mapPress', null);
      });

      const pins = [${markersJS}];
      const bounds = [];

      ${userLoc ? `
        const userIcon = L.divIcon({
          className: '',
          html: '<div style="width:16px;height:16px;background:#1D4ED8;border-radius:50%;border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,0.3);"></div>',
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });
        L.marker([${userLoc.lat}, ${userLoc.lng}], { icon: userIcon, zIndexOffset: 1000 }).addTo(map).bindPopup("You are here");
        bounds.push([${userLoc.lat}, ${userLoc.lng}]);
      ` : ''}

      pins.forEach(p => {
        const icon = L.divIcon({
          className: '',
          html: '<div class="pin-marker"><span class="pin-inner">' + p.label + '</span></div>',
          iconSize: [36, 36],
          iconAnchor: [18, 36],
          popupAnchor: [0, -36],
        });

        const marker = L.marker([p.lat, p.lng], { icon }).addTo(map);
        bounds.push([p.lat, p.lng]);
        marker.on('click', e => {
          L.DomEvent.stopPropagation(e);
          suppressMapClick = true;
          setTimeout(() => { suppressMapClick = false; }, 400);
          map.flyTo([p.lat, p.lng], 16, { animate: true, duration: 0.8 });
          send('markerPress', p.id);
        });
      });
      
      if (${userLoc ? 'true' : 'false'}) {
        map.setView([${userLoc?.lat || DEFAULT_LAT}, ${userLoc?.lng || DEFAULT_LNG}], 13);
      } else if (bounds.length > 1) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      } else if (bounds.length === 1) {
        map.setView(bounds[0], 13);
      }
    </script>
  </body>
</html>`;
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "markerPress") {
        const company = companies.find((c) => c.id === data.payload);
        if (company) setSelectedCompany(company);
      } else if (data.type === "mapPress") {
        setSelectedCompany(null);
      }
    } catch {}
  };

  return (
    <View style={s.root}>
      {/* Top App Bar */}
      <SafeAreaView edges={["top"]} style={[s.header, CARD_SHADOW]}>
        <View style={s.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.8}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={T.accent} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Nearby Services</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      {/* Map Container */}
      <View style={s.mapContainer}>
        {isLoading ? (
          <View style={s.loadingBox}>
            <ActivityIndicator size="large" color={T.accent} />
            <Text style={s.loadingText}>Loading map...</Text>
          </View>
        ) : process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ? (
          <MapView
            style={s.webview}
            showsUserLocation={true}
            initialRegion={{
              latitude: (userLoc && !isNaN(userLoc.lat)) ? userLoc.lat : (companies.length > 0 && !isNaN(companies[0].lat) ? companies[0].lat : DEFAULT_LAT),
              longitude: (userLoc && !isNaN(userLoc.lng)) ? userLoc.lng : (companies.length > 0 && !isNaN(companies[0].lng) ? companies[0].lng : DEFAULT_LNG),
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
            ref={(ref) => {
              if (ref && companies.length > 0 && (!userLoc || isNaN(userLoc.lat))) {
                // Fit map to show all pins only if we don't have user location
                setTimeout(() => {
                  ref.fitToCoordinates(
                    companies.map(c => ({ latitude: c.lat, longitude: c.lng })),
                    { edgePadding: { top: 50, right: 50, bottom: 50, left: 50 }, animated: false }
                  );
                }, 100);
              }
            }}
            onPress={() => setSelectedCompany(null)}
          >
            {companies.map(p => (
              <Marker
                key={p.id}
                coordinate={{ latitude: p.lat, longitude: p.lng }}
                onPress={(e) => {
                  e.stopPropagation();
                  setSelectedCompany(p);
                }}
              >
                <View style={s.nativeMarkerBox}>
                  <Text style={s.nativeMarkerText}>{p.name.charAt(0).toUpperCase()}</Text>
                </View>
              </Marker>
            ))}
          </MapView>
        ) : (
          <WebView
            ref={webviewRef}
            originWhitelist={["*"]}
            source={{ html: buildMapHTML(companies) }}
            onMessage={handleWebViewMessage}
            javaScriptEnabled
            domStorageEnabled
            style={s.webview}
            onError={() => Alert.alert("Map Error", "Could not load map.")}
          />
        )}

        {/* Floating info pill */}
        {!isLoading && companies.length > 0 && (
          <View style={s.pillOverlay} pointerEvents="none">
            <View style={[s.infoPill, CARD_SHADOW]}>
              <MaterialCommunityIcons name="map-marker-multiple" size={16} color={T.accent} />
              <Text style={s.infoPillText}>
                {companies.length} provider{companies.length !== 1 ? "s" : ""} nearby
              </Text>
            </View>
          </View>
        )}

        {/* No-data overlay */}
        {!isLoading && companies.length === 0 && (
          <View style={s.emptyOverlay}>
            <View style={[s.emptyCard, CARD_SHADOW]}>
              <View style={s.emptyIconBox}>
                <MaterialCommunityIcons name="map-marker-off" size={32} color={T.text3} />
              </View>
              <Text style={s.emptyTitle}>No providers with location</Text>
              <Text style={s.emptyDesc}>
                Companies with coordinates will appear as pins on the map.
              </Text>
            </View>
          </View>
        )}

        {/* Selected Company Card */}
        {selectedCompany && (
          <AnimatedCard company={selectedCompany} onClose={() => setSelectedCompany(null)} onNavigate={(id) => router.push(`/(customer)/company/${id}` as any)} />
        )}
      </View>
    </View>
  );
}

function AnimatedCard({ company, onClose, onNavigate }: { company: CompanyPin; onClose: () => void; onNavigate: (id: string) => void }) {
  const anim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 0,
      duration: 350,
      easing: Easing.out(Easing.exp),
      useNativeDriver: true,
    }).start();
  }, [company.id]);

  return (
    <Animated.View style={[s.cardOverlay, CARD_SHADOW, { transform: [{ translateY: anim }] }]}>
      <TouchableOpacity onPress={onClose} style={s.closeBtn} activeOpacity={0.8}>
        <MaterialCommunityIcons name="close" size={18} color={T.text1} />
      </TouchableOpacity>

            <View style={s.cardBody}>
              {/* Logo / Avatar */}
              <View style={s.logoBox}>
                {company.logoUrl ? (
                  <Image source={{ uri: company.logoUrl }} style={s.logoImg} contentFit="cover" />
                ) : (
                  <Text style={s.logoFallback}>{company.name.charAt(0)}</Text>
                )}
              </View>

              {/* Info */}
              <View style={s.infoCol}>
                <View style={s.nameRow}>
                  <Text style={s.companyName} numberOfLines={1}>{company.name}</Text>
                  {company.verified && (
                    <MaterialCommunityIcons name="shield-check" size={16} color={T.success} />
                  )}
                </View>

                <View style={s.metaRow}>
                  <MaterialCommunityIcons name="star" size={14} color={T.warning} />
                  <Text style={s.ratingText}>
                    {company.rating > 0 ? company.rating.toFixed(1) : "New"}
                  </Text>
                  {company.reviewCount > 0 && (
                    <Text style={s.metaText}>({company.reviewCount})</Text>
                  )}
                  {company.city && (
                    <Text style={s.metaText}> · {company.city}</Text>
                  )}
                </View>

                {company.description && (
                  <Text style={s.descText} numberOfLines={2}>{company.description}</Text>
                )}
              </View>
            </View>

            {/* Action Buttons */}
            <View style={s.actionRow}>
              <TouchableOpacity
                onPress={() => onNavigate(company.id)}
                style={s.viewBtn}
                activeOpacity={0.85}
              >
                <Text style={s.viewBtnText}>View Details</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onClose}
                style={s.dismissBtn}
                activeOpacity={0.85}
              >
                <Text style={s.dismissBtnText}>Dismiss</Text>
              </TouchableOpacity>
            </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },

  // Header
  header: { backgroundColor: T.surface, borderBottomWidth: 1, borderBottomColor: T.border },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "800", color: T.text1 },

  // Map
  mapContainer: { flex: 1, position: "relative" },
  webview: { flex: 1, backgroundColor: T.bg },
  
  loadingBox: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: T.bg },
  loadingText: { marginTop: 12, fontSize: 15, color: T.text2, fontWeight: "500" },

  // Overlays
  pillOverlay: { position: "absolute", top: 16, left: 0, right: 0, alignItems: "center", zIndex: 10 },
  infoPill: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.95)", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: T.border },
  infoPillText: { fontSize: 13, fontWeight: "800", color: T.accent },

  emptyOverlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", zIndex: 10, paddingHorizontal: 32 },
  emptyCard: { backgroundColor: T.surface, borderRadius: 24, padding: 24, alignItems: "center", width: "100%", borderWidth: 1, borderColor: T.border },
  emptyIconBox: { width: 64, height: 64, borderRadius: 32, backgroundColor: T.bg, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  emptyTitle: { fontSize: 17, fontWeight: "800", color: T.text1, marginBottom: 8, textAlign: "center" },
  emptyDesc: { fontSize: 14, color: T.text3, textAlign: "center", lineHeight: 20 },

  // Bottom Card
  cardOverlay: {
    position: "absolute", bottom: 24, left: 16, right: 16, zIndex: 20,
    backgroundColor: T.surface, borderRadius: 24, padding: 16, borderWidth: 1, borderColor: T.border
  },
  closeBtn: { position: "absolute", top: 12, right: 12, zIndex: 30, width: 28, height: 28, borderRadius: 14, backgroundColor: T.bg, alignItems: "center", justifyContent: "center" },
  cardBody: { flexDirection: "row", gap: 16, marginTop: 4 },
  logoBox: { width: 64, height: 64, borderRadius: 16, backgroundColor: T.accentLight, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  logoImg: { width: "100%", height: "100%" },
  logoFallback: { fontSize: 24, fontWeight: "900", color: T.accent },
  
  infoCol: { flex: 1, paddingRight: 24 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  companyName: { fontSize: 17, fontWeight: "800", color: T.text1, flexShrink: 1 },
  
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4, flexWrap: "wrap" },
  ratingText: { fontSize: 14, fontWeight: "800", color: T.text1 },
  metaText: { fontSize: 13, color: T.text3, fontWeight: "500" },
  
  descText: { fontSize: 13, color: T.text2, marginTop: 6, lineHeight: 18 },

  actionRow: { flexDirection: "row", gap: 12, marginTop: 20 },
  viewBtn: { flex: 1, backgroundColor: T.accent, borderRadius: 14, height: 48, alignItems: "center", justifyContent: "center" },
  viewBtnText: { fontSize: 15, fontWeight: "800", color: "#fff" },
  dismissBtn: { flex: 1, backgroundColor: T.surface, borderRadius: 14, height: 48, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: T.border },
  dismissBtnText: { fontSize: 15, fontWeight: "800", color: T.text1 },

  // Native Markers
  nativeMarkerBox: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: T.accent,
    borderWidth: 2, borderColor: '#fff', alignItems: 'center', justifyContent: 'center'
  },
  nativeMarkerText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
});
