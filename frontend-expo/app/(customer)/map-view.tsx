import React, { useState, useEffect, useRef, useCallback } from "react";
import { Image } from "expo-image";
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
} from "react-native";
import { WebView } from "react-native-webview";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import { MAP_PROVIDER } from "@/utils/mapHelper";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { api } from "@/store/authStore";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ExpoLocation from "expo-location";
import { Theme } from "@/constants/theme";

const { width: SCREEN_W } = Dimensions.get("window");
const DEFAULT_LAT = 3.147;
const DEFAULT_LNG = 101.6938;
const T = Theme.colors;

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
  android: { elevation: 4 },
});

const HEAVY_SHADOW = Platform.select({
  ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.14, shadowRadius: 20 },
  android: { elevation: 10 },
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

type ViewMode = "map" | "list";
type SortMode = "rating" | "distance" | "reviews";

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const ratingColor = (r: number) => {
  if (r >= 4.5) return "#10B981";
  if (r >= 4.0) return "#3B82F6";
  if (r >= 3.0) return "#F59E0B";
  return "#EF4444";
};

export default function MapViewScreen() {
  const router = useRouter();
  const { categoryId, categorySlug } = useLocalSearchParams<{ categoryId?: string; categorySlug?: string }>();
  const [companies, setCompanies] = useState<CompanyPin[]>([]);
  const [filtered, setFiltered] = useState<CompanyPin[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<CompanyPin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [locStatus, setLocStatus] = useState<"pending" | "resolved">("pending");
  const [viewMode, setViewMode] = useState<ViewMode>("map");
  const [sortMode, setSortMode] = useState<SortMode>("rating");
  const [searchQuery, setSearchQuery] = useState("");
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const webviewRef = useRef<WebView>(null);
  const mapViewRef = useRef<MapView>(null);

  const headerAnim = useRef(new Animated.Value(-80)).current;
  const pillAnim = useRef(new Animated.Value(0)).current;
  const listAnim = useRef(new Animated.Value(0)).current;
  const filterBarOpacity = useRef(new Animated.Value(0)).current;
  const filterBarY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(headerAnim, { toValue: 0, duration: 450, easing: Easing.out(Easing.exp), useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(filterBarOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(filterBarY, { toValue: 0, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
    ]).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pillAnim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pillAnim, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const loc = await ExpoLocation.getCurrentPositionAsync({ accuracy: ExpoLocation.Accuracy.Balanced });
          setUserLoc({ lat: loc.coords.latitude, lng: loc.coords.longitude });
        }
      } catch {
      } finally {
        setLocStatus("resolved");
      }
    })();
  }, []);

  useEffect(() => {
    if (locStatus === "pending") return;
    const loadCompanies = async () => {
      setIsLoading(true);
      try {
        const params: any = { limit: 50, categoryId: categoryId || categorySlug || undefined };
        if (userLoc) { params.lat = userLoc.lat; params.lng = userLoc.lng; }
        const res = await api.get("/api/companies", { params });
        const raw: any[] = res.data?.data?.companies ?? res.data?.companies ?? res.data?.data ?? res.data ?? [];
        const pins: CompanyPin[] = raw
          .filter((c: any) => c.latitude != null && c.longitude != null && !isNaN(Number(c.latitude)) && !isNaN(Number(c.longitude)))
          .map((c: any) => ({
            id: c.id.toString(), name: c.name,
            lat: Number(c.latitude), lng: Number(c.longitude),
            rating: Number(c.rating ?? c.ratingSummary?.averageRating ?? 0),
            reviewCount: Number(c.reviewCount ?? c.ratingSummary?.totalReviews ?? 0),
            description: c.description, logoUrl: c.logoUrl, city: c.city,
            verified: c.verificationStatus === "verified" || c.verified,
          }));
        setCompanies(pins);
      } catch {
      } finally {
        setIsLoading(false);
      }
    };
    loadCompanies();
  }, [categoryId, categorySlug, locStatus]);

  useEffect(() => {
    let out = [...companies];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      out = out.filter(c => c.name.toLowerCase().includes(q) || (c.city || "").toLowerCase().includes(q));
    }
    if (showVerifiedOnly) out = out.filter(c => c.verified);
    if (minRating > 0) out = out.filter(c => c.rating >= minRating);
    out.sort((a, b) => {
      if (sortMode === "rating") return b.rating - a.rating;
      if (sortMode === "reviews") return b.reviewCount - a.reviewCount;
      if (sortMode === "distance" && userLoc)
        return haversine(userLoc.lat, userLoc.lng, a.lat, a.lng) - haversine(userLoc.lat, userLoc.lng, b.lat, b.lng);
      return 0;
    });
    setFiltered(out);
  }, [companies, searchQuery, showVerifiedOnly, minRating, sortMode, userLoc]);

  useEffect(() => {
    if (viewMode === "list") {
      Animated.timing(listAnim, { toValue: 1, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    } else {
      Animated.timing(listAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start();
    }
  }, [viewMode]);

  const focusCompanyOnMap = useCallback((p: CompanyPin) => {
    setSelectedCompany(p);
    if (process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY && mapViewRef.current) {
      mapViewRef.current.animateToRegion({ latitude: p.lat, longitude: p.lng, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 800);
    } else if (webviewRef.current) {
      webviewRef.current.injectJavaScript(
        "if(typeof map!=='undefined'){map.flyTo([" + p.lat + "," + p.lng + "],16,{animate:true,duration:1});} true;"
      );
    }
  }, []);

  const buildMapHTML = (pins: CompanyPin[]) => {
    const centerLat = userLoc?.lat ?? (pins[0]?.lat ?? DEFAULT_LAT);
    const centerLng = userLoc?.lng ?? (pins[0]?.lng ?? DEFAULT_LNG);
    const accentHex = T.accent || "#6366F1";
    const pinsJSON = JSON.stringify(pins.map(p => ({
      id: p.id, name: p.name, lat: p.lat, lng: p.lng,
      label: p.name.charAt(0).toUpperCase(), rating: p.rating,
      verified: p.verified, city: p.city || "",
    })));
    const userLocStr = userLoc ? "true" : "false";
    const userLatStr = userLoc ? String(userLoc.lat) : String(DEFAULT_LAT);
    const userLngStr = userLoc ? String(userLoc.lng) : String(DEFAULT_LNG);
    const userMarker = userLoc
      ? "L.marker([" + userLoc.lat + "," + userLoc.lng + "],{icon:L.divIcon({className:'',iconSize:[18,18],iconAnchor:[9,9],html:'<div class=\"user-dot\"></div>'}),zIndexOffset:2000}).addTo(map).bindPopup('<div class=\"popup-inner\"><div class=\"popup-name\">You are here</div></div>');"
      : "";
    const boundsInit = userLoc ? "[[" + userLoc.lat + "," + userLoc.lng + "]]" : "[]";

    return "<!DOCTYPE html><html><head><meta charset=\"utf-8\"/><meta name=\"viewport\" content=\"width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no\"/><link rel=\"stylesheet\" href=\"https://unpkg.com/leaflet@1.9.4/dist/leaflet.css\"/><script src=\"https://unpkg.com/leaflet@1.9.4/dist/leaflet.js\"></script><style>*{margin:0;padding:0;box-sizing:border-box;}html,body{width:100%;height:100%;overflow:hidden;background:#F0F2F5;font-family:-apple-system,system-ui,sans-serif;}#map{width:100%;height:100%;}.leaflet-control-attribution{display:none!important;}.leaflet-control-zoom{border:none!important;border-radius:14px!important;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.12)!important;margin-right:12px!important;margin-bottom:12px!important;}.leaflet-control-zoom a{background:rgba(255,255,255,0.95)!important;color:#1E293B!important;border:none!important;width:40px!important;height:40px!important;line-height:40px!important;font-size:18px!important;font-weight:700!important;}.pin-wrap{display:flex;flex-direction:column;align-items:center;animation:pinDrop 0.45s cubic-bezier(0.34,1.56,0.64,1) both;}@keyframes pinDrop{from{opacity:0;transform:translateY(-24px) scale(0.4);}to{opacity:1;transform:translateY(0) scale(1);}}.pin-body{width:44px;height:44px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;border:3px solid #fff;box-shadow:0 4px 16px rgba(0,0,0,0.22);transition:box-shadow 0.2s;}.pin-body.selected{box-shadow:0 0 0 5px rgba(99,102,241,0.3),0 6px 18px rgba(0,0,0,0.25)!important;}.pin-inner{transform:rotate(45deg);display:flex;align-items:center;}.pin-letter{font-size:16px;font-weight:900;color:white;line-height:1;}.pin-badge{position:absolute;top:-5px;right:-5px;background:#10B981;width:13px;height:13px;border-radius:50%;border:2px solid white;transform:rotate(45deg);}.pin-rating{position:absolute;bottom:-20px;background:rgba(255,255,255,0.96);border-radius:8px;padding:1px 5px;font-size:9px;font-weight:800;color:#1E293B;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.14);transform:rotate(45deg);}.user-dot{width:18px;height:18px;background:#3B82F6;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(59,130,246,0.5);animation:pulse 2s ease-out infinite;}@keyframes pulse{0%{box-shadow:0 0 0 0 rgba(59,130,246,0.4),0 2px 8px rgba(59,130,246,0.5);}70%{box-shadow:0 0 0 12px rgba(59,130,246,0),0 2px 8px rgba(59,130,246,0.5);}100%{box-shadow:0 0 0 0 rgba(59,130,246,0),0 2px 8px rgba(59,130,246,0.5);}}.leaflet-popup-content-wrapper{border-radius:16px!important;padding:0!important;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.15)!important;}.leaflet-popup-tip-container{display:none;}.popup-inner{padding:10px 14px;min-width:150px;}.popup-name{font-weight:800;font-size:13px;color:#1E293B;margin-bottom:3px;}.popup-meta{font-size:11px;color:#64748B;}</style></head><body><div id=\"map\"></div><script>var map=L.map('map',{zoomControl:true,zoomAnimation:true,fadeAnimation:true}).setView([" + centerLat + "," + centerLng + "],13);L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',{maxZoom:20,subdomains:'abcd'}).addTo(map);function send(type,payload){try{window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify({type:type,payload:payload}));}catch(e){}}var suppressMapClick=false;var selectedMarkerId=null;var markerMap={};map.on('click',function(){if(!suppressMapClick){send('mapPress',null);if(selectedMarkerId&&markerMap[selectedMarkerId]&&markerMap[selectedMarkerId].el){markerMap[selectedMarkerId].el.classList.remove('selected');}selectedMarkerId=null;}});" + userMarker + "var accentColors=['" + accentHex + "','#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899'];var pins=" + pinsJSON + ";var bounds=" + boundsInit + ";pins.forEach(function(p,idx){var color=accentColors[idx%accentColors.length];var rLabel=p.rating>0?'* '+p.rating.toFixed(1):'New';var vBadge=p.verified?'<div class=\"pin-badge\"></div>':'';var html='<div class=\"pin-wrap\" style=\"animation-delay:'+(idx*55)+'ms\"><div class=\"pin-body\" id=\"pin-'+p.id+'\" style=\"background:'+color+'\"><div class=\"pin-inner\"><span class=\"pin-letter\">'+p.label+'</span></div>'+vBadge+'<div class=\"pin-rating\">'+rLabel+'</div></div></div>';var icon=L.divIcon({className:'',iconSize:[44,64],iconAnchor:[22,64],popupAnchor:[0,-68],html:html});var marker=L.marker([p.lat,p.lng],{icon:icon,zIndexOffset:100+idx}).addTo(map);markerMap[p.id]={marker:marker,el:null};marker.on('add',function(){markerMap[p.id].el=document.getElementById('pin-'+p.id);});marker.bindPopup('<div class=\"popup-inner\"><div class=\"popup-name\">'+p.name+'</div><div class=\"popup-meta\">&#9733; '+(p.rating>0?p.rating.toFixed(1)+' &middot; ':'New &middot; ')+p.city+'</div></div>',{closeButton:false,autoClose:true,maxWidth:200});marker.on('click',function(e){L.DomEvent.stopPropagation(e);suppressMapClick=true;setTimeout(function(){suppressMapClick=false;},400);if(selectedMarkerId&&markerMap[selectedMarkerId]&&markerMap[selectedMarkerId].el){markerMap[selectedMarkerId].el.classList.remove('selected');}selectedMarkerId=p.id;if(markerMap[p.id].el)markerMap[p.id].el.classList.add('selected');map.flyTo([p.lat,p.lng],16,{animate:true,duration:0.9,easeLinearity:0.25});send('markerPress',p.id);});bounds.push([p.lat,p.lng]);});if(" + userLocStr + "){map.setView([" + userLatStr + "," + userLngStr + "],13);}else if(bounds.length>1){map.fitBounds(bounds,{padding:[60,60],maxZoom:14,animate:true});}else if(bounds.length===1){map.setView(bounds[0],14);}</script></body></html>";
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "markerPress") {
        const company = companies.find(c => c.id === data.payload);
        if (company) setSelectedCompany(company);
      } else if (data.type === "mapPress") {
        setSelectedCompany(null);
      }
    } catch {}
  };

  const pillScale = pillAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] });
  const hasFilters = showVerifiedOnly || minRating > 0 || !!searchQuery;

  return (
    <View style={s.root}>
      <Animated.View style={{ transform: [{ translateY: headerAnim }] }}>
        <SafeAreaView edges={["top"]} style={[s.header, HEAVY_SHADOW]}>
          <View style={s.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.75}>
              <MaterialCommunityIcons name="arrow-left" size={22} color={T.accent} />
            </TouchableOpacity>
            <View style={s.searchWrap}>
              <MaterialIcons name="search" size={18} color={T.text3} />
              <TextInput
                style={s.searchInput}
                placeholder="Search providers, cities..."
                placeholderTextColor={T.text3}
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <MaterialIcons name="close" size={16} color={T.text3} />
                </TouchableOpacity>
              )}
            </View>
            <View style={s.toggleWrap}>
              <TouchableOpacity onPress={() => setViewMode("map")} style={[s.toggleBtn, viewMode === "map" && s.toggleActive]}>
                <MaterialCommunityIcons name="map" size={16} color={viewMode === "map" ? "#fff" : T.text2} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setViewMode("list")} style={[s.toggleBtn, viewMode === "list" && s.toggleActive]}>
                <MaterialCommunityIcons name="format-list-bulleted" size={16} color={viewMode === "list" ? "#fff" : T.text2} />
              </TouchableOpacity>
            </View>
          </View>
          <Animated.View style={{ opacity: filterBarOpacity, transform: [{ translateY: filterBarY }] }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingBottom: 12 }}>
              {(["rating", "distance", "reviews"] as SortMode[]).map(mode => (
                <TouchableOpacity key={mode} onPress={() => setSortMode(mode)} style={[s.chip, sortMode === mode && s.chipActive]} activeOpacity={0.8}>
                  <MaterialCommunityIcons
                    name={mode === "rating" ? "star" : mode === "distance" ? "map-marker-distance" : "comment-text"}
                    size={13} color={sortMode === mode ? "#fff" : T.text2}
                  />
                  <Text style={[s.chipText, sortMode === mode && s.chipTextActive]}>
                    {mode === "rating" ? "Top Rated" : mode === "distance" ? "Nearest" : "Most Reviews"}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity onPress={() => setShowVerifiedOnly(v => !v)} style={[s.chip, showVerifiedOnly && s.chipActive]} activeOpacity={0.8}>
                <MaterialCommunityIcons name="shield-check" size={13} color={showVerifiedOnly ? "#fff" : T.text2} />
                <Text style={[s.chipText, showVerifiedOnly && s.chipTextActive]}>Verified</Text>
              </TouchableOpacity>
              {[4.5, 4.0, 3.0].map(r => (
                <TouchableOpacity key={r} onPress={() => setMinRating(minRating === r ? 0 : r)} style={[s.chip, minRating === r && s.chipActive]} activeOpacity={0.8}>
                  <MaterialCommunityIcons name="star" size={13} color={minRating === r ? "#fff" : T.text2} />
                  <Text style={[s.chipText, minRating === r && s.chipTextActive]}>{r}+</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        </SafeAreaView>
      </Animated.View>

      <View style={s.body}>
        {isLoading ? (
          <LoadingScreen />
        ) : (
          <>
            <View style={StyleSheet.absoluteFill} pointerEvents={viewMode === "list" ? "none" : "auto"}>
              {Platform.OS === 'ios' || (process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY && process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY !== 'AIza_placeholder_for_maps') ? (
                <MapView
                  ref={mapViewRef}
                  provider={MAP_PROVIDER}
                  style={{ flex: 1 }}
                  showsUserLocation
                  showsMyLocationButton={false}
                  showsCompass
                  initialRegion={{
                    latitude: userLoc?.lat ?? (filtered[0]?.lat ?? DEFAULT_LAT),
                    longitude: userLoc?.lng ?? (filtered[0]?.lng ?? DEFAULT_LNG),
                    latitudeDelta: 0.06, longitudeDelta: 0.06,
                  }}
                  onPress={() => setSelectedCompany(null)}
                >
                  {filtered.map((p, idx) => (
                    <Marker key={p.id} coordinate={{ latitude: p.lat, longitude: p.lng }}
                      onPress={e => { e.stopPropagation(); focusCompanyOnMap(p); }}>
                      <View style={[s.nativePin, { backgroundColor: ["#6366F1","#3B82F6","#10B981","#F59E0B","#EF4444"][idx % 5] }]}>
                        <Text style={s.nativePinLetter}>{p.name.charAt(0)}</Text>
                        {p.rating > 0 && <View style={s.nativePinRating}><Text style={s.nativePinRatingText}>★ {p.rating.toFixed(1)}</Text></View>}
                        {p.verified && <View style={s.nativePinVerified} />}
                      </View>
                    </Marker>
                  ))}
                </MapView>
              ) : (
                <WebView
                  ref={webviewRef}
                  originWhitelist={["*"]}
                  source={{ html: buildMapHTML(filtered) }}
                  onMessage={handleWebViewMessage}
                  javaScriptEnabled domStorageEnabled
                  style={{ flex: 1 }}
                  onError={() => Alert.alert("Map Error", "Could not load map.")}
                />
              )}
              {filtered.length > 0 && (
                <Animated.View style={[s.pillWrap, { transform: [{ scale: pillScale }] }]} pointerEvents="none">
                  <View style={[s.pill, CARD_SHADOW]}>
                    <MaterialCommunityIcons name="map-marker-multiple" size={14} color={T.accent} />
                    <Text style={s.pillText}>{filtered.length} provider{filtered.length !== 1 ? "s" : ""}</Text>
                    {userLoc && <><View style={s.pillDivider} /><MaterialCommunityIcons name="crosshairs-gps" size={13} color="#3B82F6" /><Text style={[s.pillText, { color: "#3B82F6" }]}>Located</Text></>}
                  </View>
                </Animated.View>
              )}
              {filtered.length === 0 && (
                <View style={s.emptyOverlay}>
                  <View style={[s.emptyCard, HEAVY_SHADOW]}>
                    <View style={s.emptyIconBox}><MaterialCommunityIcons name="map-marker-off" size={32} color={T.text3} /></View>
                    <Text style={s.emptyTitle}>{hasFilters ? "No Matches" : "No Providers Nearby"}</Text>
                    <Text style={s.emptyDesc}>{hasFilters ? "Try adjusting your filters." : "Companies with a location will appear as pins."}</Text>
                    {hasFilters && (
                      <TouchableOpacity onPress={() => { setShowVerifiedOnly(false); setMinRating(0); setSearchQuery(""); }} style={s.clearFilterBtn}>
                        <Text style={s.clearFilterText}>Clear Filters</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
              {userLoc && (
                <TouchableOpacity style={[s.locateBtn, CARD_SHADOW]} activeOpacity={0.85}
                  onPress={() => {
                    if (mapViewRef.current) mapViewRef.current.animateToRegion({ latitude: userLoc.lat, longitude: userLoc.lng, latitudeDelta: 0.02, longitudeDelta: 0.02 }, 600);
                    else webviewRef.current?.injectJavaScript("map.flyTo([" + userLoc.lat + "," + userLoc.lng + "],15,{animate:true,duration:0.8}); true;");
                  }}>
                  <MaterialCommunityIcons name="crosshairs-gps" size={22} color={T.accent} />
                </TouchableOpacity>
              )}
            </View>
            {viewMode === "list" && (
              <Animated.View style={[{ flex: 1, backgroundColor: T.bg }, { opacity: listAnim, transform: [{ translateY: listAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }] }]}>
                {filtered.length === 0 ? (
                  <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
                    <MaterialCommunityIcons name="magnify-close" size={56} color={T.text3} />
                    <Text style={[s.emptyTitle, { marginTop: 16 }]}>No Results</Text>
                    <Text style={[s.emptyDesc, { textAlign: "center", marginTop: 8 }]}>Try adjusting your search or filters.</Text>
                  </View>
                ) : (
                  <FlatList
                    data={filtered}
                    keyExtractor={item => item.id}
                    contentContainerStyle={{ padding: 16, gap: 12 }}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item, index }) => (
                      <ListProviderCard
                        company={item} index={index} userLoc={userLoc}
                        onPress={() => { setSelectedCompany(item); setViewMode("map"); setTimeout(() => focusCompanyOnMap(item), 350); }}
                        onNavigate={id => router.push(("/(customer)/company/" + id) as any)}
                      />
                    )}
                  />
                )}
              </Animated.View>
            )}
          </>
        )}
      </View>

      {selectedCompany && viewMode === "map" && (
        <SelectedCard
          company={selectedCompany} userLoc={userLoc}
          onClose={() => setSelectedCompany(null)}
          onNavigate={id => router.push(("/(customer)/company/" + id) as any)}
        />
      )}
    </View>
  );
}

function LoadingScreen() {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.timing(spin, { toValue: 1, duration: 1200, easing: Easing.linear, useNativeDriver: true })).start();
  }, []);
  const rot = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  return (
    <View style={s.loadingBox}>
      <Animated.View style={{ transform: [{ rotate: rot }] }}>
        <MaterialCommunityIcons name="map-search" size={52} color={T.accent} />
      </Animated.View>
      <Text style={s.loadingTitle}>Finding Nearby Providers</Text>
      <Text style={s.loadingDesc}>Scanning your area for top-rated services...</Text>
    </View>
  );
}

function ListProviderCard({ company, index, userLoc, onPress, onNavigate }: {
  company: CompanyPin; index: number; userLoc: { lat: number; lng: number } | null;
  onPress: () => void; onNavigate: (id: string) => void;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 350, delay: index * 55, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, []);
  const dist = userLoc ? haversine(userLoc.lat, userLoc.lng, company.lat, company.lng) : null;
  const rc = ratingColor(company.rating);
  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }] }}>
      <Pressable onPress={onPress} style={({ pressed }) => [s.listCard, CARD_SHADOW, pressed && { opacity: 0.85 }]}>
        <View style={s.listLogo}>
          {company.logoUrl ? (
            <Image source={{ uri: company.logoUrl }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
          ) : (
            <Text style={s.listLogoFallback}>{company.name.charAt(0)}</Text>
          )}
          {company.verified && (
            <View style={s.listVerifiedBadge}><MaterialCommunityIcons name="shield-check" size={10} color="#fff" /></View>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.listName} numberOfLines={1}>{company.name}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 2 }}>
            <View style={[s.ratingBubble, { backgroundColor: rc + "20" }]}>
              <MaterialCommunityIcons name="star" size={11} color={rc} />
              <Text style={[s.ratingBubbleText, { color: rc }]}>{company.rating > 0 ? company.rating.toFixed(1) : "New"}</Text>
            </View>
            {company.reviewCount > 0 && <Text style={s.listMeta}>({company.reviewCount} reviews)</Text>}
            {company.city && <Text style={s.listMeta}>· {company.city}</Text>}
          </View>
          {dist !== null && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
              <MaterialCommunityIcons name="map-marker-distance" size={12} color={T.text3} />
              <Text style={s.listMeta}>{dist < 1 ? (dist * 1000).toFixed(0) + "m away" : dist.toFixed(1) + " km away"}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={() => onNavigate(company.id)} style={s.listViewBtn} activeOpacity={0.85}>
          <Text style={s.listViewBtnText}>View</Text>
        </TouchableOpacity>
      </Pressable>
    </Animated.View>
  );
}

function SelectedCard({ company, userLoc, onClose, onNavigate }: {
  company: CompanyPin; userLoc: { lat: number; lng: number } | null;
  onClose: () => void; onNavigate: (id: string) => void;
}) {
  const slideAnim = useRef(new Animated.Value(320)).current;
  const scaleAnim = useRef(new Animated.Value(0.94)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 9 }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 65, friction: 9 }),
    ]).start();
  }, [company.id]);
  const dist = userLoc ? haversine(userLoc.lat, userLoc.lng, company.lat, company.lng) : null;
  const rc = ratingColor(company.rating);
  return (
    <Animated.View style={[s.selectedCard, HEAVY_SHADOW, { transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }]}>
      <View style={s.dragHandle} />
      <TouchableOpacity onPress={onClose} style={s.closeBtn} activeOpacity={0.75}>
        <MaterialIcons name="close" size={16} color={T.text2} />
      </TouchableOpacity>
      <View style={s.selectedBody}>
        <View style={s.selectedLogo}>
          {company.logoUrl ? (
            <Image source={{ uri: company.logoUrl }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
          ) : (
            <Text style={s.selectedLogoFallback}>{company.name.charAt(0)}</Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={s.selectedName} numberOfLines={1}>{company.name}</Text>
            {company.verified && <MaterialCommunityIcons name="shield-check" size={16} color="#10B981" />}
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
            <View style={[s.ratingBubble, { backgroundColor: rc + "20" }]}>
              <MaterialCommunityIcons name="star" size={12} color={rc} />
              <Text style={[s.ratingBubbleText, { color: rc }]}>{company.rating > 0 ? company.rating.toFixed(1) : "New"}</Text>
            </View>
            {company.reviewCount > 0 && (
              <View style={s.metaChip}>
                <MaterialCommunityIcons name="comment-text" size={11} color={T.text3} />
                <Text style={s.metaChipText}>{company.reviewCount} reviews</Text>
              </View>
            )}
            {dist !== null && (
              <View style={s.metaChip}>
                <MaterialCommunityIcons name="map-marker-distance" size={11} color={T.text3} />
                <Text style={s.metaChipText}>{dist < 1 ? (dist * 1000).toFixed(0) + "m" : dist.toFixed(1) + "km"}</Text>
              </View>
            )}
            {company.city && (
              <View style={s.metaChip}>
                <MaterialCommunityIcons name="map-marker" size={11} color={T.text3} />
                <Text style={s.metaChipText}>{company.city}</Text>
              </View>
            )}
          </View>
          {company.description && <Text style={s.selectedDesc} numberOfLines={2}>{company.description}</Text>}
        </View>
      </View>
      <View style={s.actionRow}>
        <TouchableOpacity onPress={() => onNavigate(company.id)} style={s.viewBtn} activeOpacity={0.85}>
          <MaterialCommunityIcons name="store" size={17} color="#fff" />
          <Text style={s.viewBtnText}>View Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onClose} style={s.dismissBtn} activeOpacity={0.85}>
          <Text style={s.dismissText}>Dismiss</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  header: { backgroundColor: T.surface, borderBottomWidth: 1, borderBottomColor: T.border },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 10 },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: T.accentLight, alignItems: "center", justifyContent: "center" },
  searchWrap: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#F1F5F9", borderRadius: 12, paddingHorizontal: 12, height: 40, borderWidth: 1, borderColor: T.border },
  searchInput: { flex: 1, fontSize: 14, color: T.text1, fontWeight: "500", height: 40 },
  toggleWrap: { flexDirection: "row", backgroundColor: "#F1F5F9", borderRadius: 10, padding: 3, gap: 2, borderWidth: 1, borderColor: T.border },
  toggleBtn: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  toggleActive: { backgroundColor: T.accent },
  chip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: "#F1F5F9", borderWidth: 1, borderColor: T.border },
  chipActive: { backgroundColor: T.accent, borderColor: T.accent },
  chipText: { fontSize: 12, fontWeight: "600", color: T.text2 },
  chipTextActive: { color: "#fff" },
  body: { flex: 1, position: "relative" },
  pillWrap: { position: "absolute", top: 14, left: 0, right: 0, alignItems: "center", zIndex: 10 },
  pill: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.96)", paddingHorizontal: 16, paddingVertical: 9, borderRadius: 24, borderWidth: 1, borderColor: T.border },
  pillText: { fontSize: 13, fontWeight: "800", color: T.accent },
  pillDivider: { width: 1, height: 14, backgroundColor: T.border },
  locateBtn: { position: "absolute", bottom: 30, right: 16, width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.97)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: T.border, zIndex: 10 },
  emptyOverlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", zIndex: 10, padding: 32 },
  emptyCard: { backgroundColor: T.surface, borderRadius: 24, padding: 28, alignItems: "center", width: "100%", borderWidth: 1, borderColor: T.border },
  emptyIconBox: { width: 72, height: 72, borderRadius: 36, backgroundColor: T.bg, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: T.text1, marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: T.text3, lineHeight: 20 },
  clearFilterBtn: { marginTop: 16, backgroundColor: T.accent, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 },
  clearFilterText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  loadingBox: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: T.bg, gap: 12 },
  loadingTitle: { fontSize: 18, fontWeight: "800", color: T.text1, marginTop: 8 },
  loadingDesc: { fontSize: 14, color: T.text3, textAlign: "center" },
  nativePin: { width: 38, height: 38, borderRadius: 19, borderWidth: 2.5, borderColor: "#fff", alignItems: "center", justifyContent: "center", ...Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 5 }, android: { elevation: 4 } }) },
  nativePinLetter: { fontSize: 15, fontWeight: "900", color: "#fff" },
  nativePinRating: { position: "absolute", bottom: -18, backgroundColor: "rgba(255,255,255,0.95)", borderRadius: 6, paddingHorizontal: 4, paddingVertical: 1 },
  nativePinRatingText: { fontSize: 9, fontWeight: "800", color: "#1E293B" },
  nativePinVerified: { position: "absolute", top: -4, right: -4, width: 12, height: 12, borderRadius: 6, backgroundColor: "#10B981", borderWidth: 1.5, borderColor: "#fff" },
  listCard: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: T.surface, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: T.border },
  listLogo: { width: 56, height: 56, borderRadius: 14, backgroundColor: T.accentLight, alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" },
  listLogoFallback: { fontSize: 22, fontWeight: "900", color: T.accent },
  listVerifiedBadge: { position: "absolute", bottom: 0, right: 0, width: 18, height: 18, borderRadius: 9, backgroundColor: "#10B981", alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: T.surface },
  listName: { fontSize: 15, fontWeight: "800", color: T.text1 },
  listMeta: { fontSize: 12, color: T.text3, fontWeight: "400" },
  listViewBtn: { backgroundColor: T.accentLight, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  listViewBtnText: { fontSize: 13, fontWeight: "700", color: T.accent },
  ratingBubble: { flexDirection: "row", alignItems: "center", gap: 3, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  ratingBubbleText: { fontSize: 12, fontWeight: "800" },
  selectedCard: { position: "absolute", bottom: 20, left: 14, right: 14, zIndex: 30, backgroundColor: T.surface, borderRadius: 26, padding: 20, borderWidth: 1, borderColor: T.border },
  dragHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: T.border, alignSelf: "center", marginBottom: 16 },
  closeBtn: { position: "absolute", top: 14, right: 14, width: 30, height: 30, borderRadius: 15, backgroundColor: T.bg, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: T.border, zIndex: 40 },
  selectedBody: { flexDirection: "row", gap: 14, marginBottom: 16 },
  selectedLogo: { width: 70, height: 70, borderRadius: 18, backgroundColor: T.accentLight, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  selectedLogoFallback: { fontSize: 26, fontWeight: "900", color: T.accent },
  selectedName: { fontSize: 17, fontWeight: "900", color: T.text1, flexShrink: 1 },
  selectedDesc: { fontSize: 13, color: T.text2, marginTop: 10, lineHeight: 19 },
  metaChip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#F8FAFC", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: T.border },
  metaChipText: { fontSize: 11, color: T.text3, fontWeight: "600" },
  actionRow: { flexDirection: "row", gap: 12 },
  viewBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, backgroundColor: T.accent, borderRadius: 14, height: 48 },
  viewBtnText: { fontSize: 15, fontWeight: "800", color: "#fff" },
  dismissBtn: { backgroundColor: T.bg, borderRadius: 14, height: 48, paddingHorizontal: 20, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: T.border },
  dismissText: { fontSize: 14, fontWeight: "700", color: T.text2 },
});
