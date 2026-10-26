import React, { useEffect, useRef, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, Platform, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import MapView, { Marker, Polyline } from "react-native-maps";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as ExpoLocation from "expo-location";
import { api } from "@/store/authStore";
import { Theme } from "@/constants/theme";

const T = Theme.colors;

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  android: { elevation: 2 },
});

interface GeoCoords { lat: number; lng: number; accuracy?: number; heading?: number }
const PUSH_INTERVAL_MS = 10_000;

export default function StaffTrackMapScreen() {
  const router = useRouter();
  const { bookingId, serviceAddress, serviceLat, serviceLng, serviceName } =
    useLocalSearchParams<{
      bookingId: string;
      serviceAddress?: string;
      serviceLat?: string;
      serviceLng?: string;
      serviceName?: string;
    }>();

  const webviewRef = useRef<any>(null);
  const watchRef   = useRef<ExpoLocation.LocationSubscription | null>(null);
  const pushTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [myCoords, setMyCoords]         = useState<GeoCoords | null>(null);
  const [mapReady, setMapReady]         = useState(false);
  const [permGranted, setPermGranted]   = useState(false);
  const [pushing, setPushing]           = useState(false);
  const [pushCount, setPushCount]       = useState(0);
  const [error, setError]               = useState<string | null>(null);

  const svcLat = serviceLat ? parseFloat(serviceLat) : (myCoords?.lat || 0);
  const svcLng = serviceLng ? parseFloat(serviceLng) : (myCoords?.lng || 0);

  // ── Request location permission ──────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("Location permission denied. Enable it in Settings to share your position.");
        return;
      }
      setPermGranted(true);
    })();
    return () => {
      watchRef.current?.remove();
      if (pushTimerRef.current) clearInterval(pushTimerRef.current);
    };
  }, []);

  // ── Watch GPS after permission ────────────────────────────────────────────
  useEffect(() => {
    if (!permGranted) return;
    (async () => {
      try {
        const servicesEnabled = await ExpoLocation.hasServicesEnabledAsync().catch(() => false);
        if (!servicesEnabled) {
          setMyCoords({ lat: 11.5564, lng: 104.9282 });
          return;
        }
        watchRef.current = await ExpoLocation.watchPositionAsync(
          { accuracy: ExpoLocation.Accuracy.Balanced, timeInterval: 5000, distanceInterval: 10 },
          (loc) => {
            const c: GeoCoords = {
              lat:      loc.coords.latitude,
              lng:      loc.coords.longitude,
              accuracy: loc.coords.accuracy ?? undefined,
              heading:  loc.coords.heading ?? undefined,
            };
            setMyCoords(c);
            // Live inject staff marker into map
            if (webviewRef.current && mapReady) {
              webviewRef.current.injectJavaScript(`
                if (window.myMarker) map.removeLayer(window.myMarker);
                window.myMarker = L.marker([${c.lat},${c.lng}], { icon: myIcon }).addTo(map);
                true;
              `);
            }
          }
        ).catch(() => null);
      } catch {
        setMyCoords({ lat: 11.5564, lng: 104.9282 });
      }
    })();
  }, [permGranted, mapReady]);

  // ── Push location to backend every 10s ───────────────────────────────────
  const pushLocation = useCallback(async (coords: GeoCoords) => {
    if (!bookingId) return;
    setPushing(true);
    try {
      await api.patch(`/api/location/${bookingId}`, coords);
      setPushCount((n) => n + 1);
    } catch (e) {
      console.warn("[StaffTrack] push error", e);
    } finally {
      setPushing(false);
    }
  }, [bookingId]);

  useEffect(() => {
    if (!permGranted || !myCoords) return;
    pushLocation(myCoords); // immediate first push
    pushTimerRef.current = setInterval(() => {
      if (myCoords) pushLocation(myCoords);
    }, PUSH_INTERVAL_MS);
    return () => { if (pushTimerRef.current) clearInterval(pushTimerRef.current); };
  }, [permGranted, pushLocation, !!myCoords]);

  // Push latest coords on each location update
  useEffect(() => {
    if (myCoords && permGranted) pushLocation(myCoords);
  }, [myCoords]);

  // ── Build Leaflet map HTML ────────────────────────────────────────────────
  const buildMapHTML = () => {
    const centerLat = myCoords?.lat ?? svcLat;
    const centerLng = myCoords?.lng ?? svcLng;
    const staffJs = myCoords ? `
      const myIcon = L.divIcon({
        className:'',
        html:'<div style="width:48px;height:48px;background:#002045;border-radius:50%;border:4px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(0,32,69,0.5);"><span style="font-size:22px;">🧑‍🔧</span></div>',
        iconSize:[48,48],iconAnchor:[24,24],
      });
      window.myMarker = L.marker([${myCoords.lat},${myCoords.lng}],{icon:myIcon}).addTo(map);
      window.myMarker.bindPopup('<b>Your Location</b>').openPopup();
    ` : `const myIcon = null;`;

    return `<!DOCTYPE html><html><head>
      <meta charset="utf-8"/>
      <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>*{margin:0;padding:0;box-sizing:border-box}html,body,#map{width:100%;height:100%}</style>
    </head><body>
      <div id="map"></div>
      <script>
        const map = L.map('map',{zoomControl:true}).setView([${centerLat},${centerLng}],14);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',{
          attribution:'© OpenStreetMap',subdomains:'abcd',maxZoom:20
        }).addTo(map);

        // Destination pin
        const dstIcon = L.divIcon({
          className:'',
          html:'<div style="width:44px;height:44px;background:#e91e63;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 4px 12px rgba(233,30,99,0.4);display:flex;align-items:center;justify-content:center;"><span style="transform:rotate(45deg);font-size:18px;">🏠</span></div>',
          iconSize:[44,44],iconAnchor:[22,44],
        });
        L.marker([${svcLat},${svcLng}],{icon:dstIcon}).addTo(map)
          .bindPopup('<b>Customer Address</b><br>${(serviceAddress ?? "Service Location").replace(/'/g,"\\'")}');

        ${staffJs}

        ${myCoords ? `
        L.polyline([[${myCoords.lat},${myCoords.lng}],[${svcLat},${svcLng}]],{
          color:'#002045',weight:3,opacity:0.5,dashArray:'8,8'
        }).addTo(map);
        map.fitBounds([[${myCoords.lat},${myCoords.lng}],[${svcLat},${svcLng}]],{padding:[50,50]});
        ` : ''}
        window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({type:'ready'}));
      </script>
    </head><body></html>`;
  };

  const handleWebViewMessage = (e: any) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data);
      if (msg.type === "ready") setMapReady(true);
    } catch {}
  };

  const distanceKm = () => {
    if (!myCoords) return null;
    const R = 6371;
    const dLat = ((svcLat - myCoords.lat) * Math.PI) / 180;
    const dLng = ((svcLng - myCoords.lng) * Math.PI) / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(myCoords.lat*Math.PI/180)*Math.cos(svcLat*Math.PI/180)*Math.sin(dLng/2)**2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return (R * c).toFixed(1);
  };

  if (error) return (
    <SafeAreaView style={s.errorContainer} edges={["top", "bottom"]}>
      <MaterialCommunityIcons name="map-marker-off" size={52} color={T.error} />
      <Text style={s.errorText}>{error}</Text>
      <TouchableOpacity onPress={() => router.back()} style={s.errorBtn}>
        <Text style={s.errorBtnText}>Go Back</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );

  return (
    <View style={s.root}>
      {/* Header */}
      <SafeAreaView edges={["top"]} style={s.header}>
        <View style={s.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={T.primary} />
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={s.headerTitle}>Navigate to Job</Text>
            {serviceName && <Text style={s.headerSubtitle} numberOfLines={1}>{serviceName}</Text>}
          </View>
          {/* Live indicator */}
          <View style={s.liveBadge}>
            {pushing
              ? <ActivityIndicator size="small" color={T.success} />
              : <View style={[s.liveDot, { backgroundColor: T.success }]} />}
            <Text style={[s.liveText, { color: T.success }]}>LIVE</Text>
          </View>
        </View>
      </SafeAreaView>

      {/* Stats row */}
      {myCoords && (
        <View style={s.statsCardWrap}>
          <View style={s.statsCard}>
            <View style={s.statCol}>
              <Text style={s.statLabel}>Distance</Text>
              <Text style={s.statValue}>{distanceKm()} km</Text>
            </View>
            <View style={s.divider} />
            <View style={s.statCol}>
              <Text style={s.statLabel}>Updates Sent</Text>
              <Text style={[s.statValue, { color: T.success }]}>{pushCount}</Text>
            </View>
            <View style={s.divider} />
            <View style={s.statCol}>
              <Text style={s.statLabel}>Accuracy</Text>
              <Text style={s.statValue}>
                {myCoords.accuracy != null ? `±${myCoords.accuracy.toFixed(0)}m` : "—"}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Waiting for GPS */}
      {!permGranted && !error && (
        <View style={s.statusBannerWrap}>
          <View style={s.statusBannerWarning}>
            <ActivityIndicator size="small" color={T.warning} />
            <Text style={s.statusBannerWarningText}>Requesting GPS permission...</Text>
          </View>
        </View>
      )}

      {permGranted && !myCoords && (
        <View style={s.statusBannerWrap}>
          <View style={s.statusBannerInfo}>
            <ActivityIndicator size="small" color={T.info} />
            <Text style={s.statusBannerInfoText}>Getting your GPS signal...</Text>
          </View>
        </View>
      )}

      {/* Map */}
      {process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ? (
        <MapView
          style={s.map}
          initialRegion={{
            latitude: myCoords ? myCoords.lat : svcLat,
            longitude: myCoords ? myCoords.lng : svcLng,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          ref={(ref) => {
            if (ref && myCoords) {
              ref.fitToCoordinates([{ latitude: myCoords.lat, longitude: myCoords.lng }, { latitude: svcLat, longitude: svcLng }], {
                edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                animated: true,
              });
            }
          }}
        >
          {myCoords && (
            <Marker coordinate={{ latitude: myCoords.lat, longitude: myCoords.lng }}>
              <View style={s.markerWrap}>
                <Text style={s.markerEmoji}>🧑‍🔧</Text>
              </View>
            </Marker>
          )}
          <Marker coordinate={{ latitude: svcLat, longitude: svcLng }}>
            <View style={[s.markerWrap, { backgroundColor: T.error }]}>
              <Text style={s.markerEmoji}>🏠</Text>
            </View>
          </Marker>
          {myCoords && (
            <Polyline
              coordinates={[{ latitude: myCoords.lat, longitude: myCoords.lng }, { latitude: svcLat, longitude: svcLng }]}
              strokeColor={T.primary}
              strokeWidth={3}
              lineDashPattern={[8, 8]}
            />
          )}
        </MapView>
      ) : (
        <WebView
          ref={webviewRef}
          originWhitelist={["*"]}
          source={{ html: buildMapHTML() }}
          javaScriptEnabled
          domStorageEnabled
          style={s.map}
          onMessage={handleWebViewMessage}
          onError={() => Alert.alert("Map Error", "Could not load map.")}
        />
      )}

      {/* Bottom card */}
      <SafeAreaView edges={["bottom"]} style={s.bottomContainer}>
        <View style={s.bottomContent}>
          <View style={s.addressRow}>
            <View style={s.addressIconBox}>
              <MaterialCommunityIcons name="map-marker" size={20} color={T.error} />
            </View>
            <View style={s.addressTextWrap}>
              <Text style={s.addressTitle}>Customer Address</Text>
              <Text style={s.addressDesc} numberOfLines={2}>
                {serviceAddress || "Address not provided"}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => {
              if (!myCoords) { Alert.alert("GPS not ready", "Please wait for GPS lock."); return; }
              pushLocation(myCoords);
              Alert.alert("✅ Location Sent", "Customer can now see your updated position.");
            }}
            style={s.updateBtn}
          >
            <MaterialCommunityIcons name="send" size={18} color="white" />
            <Text style={s.updateBtnText}>Update My Location Now</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  errorContainer: {
    flex: 1,
    backgroundColor: T.surface,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  errorText: {
    color: T.error,
    fontWeight: "800",
    marginTop: 16,
    textAlign: "center",
  },
  errorBtn: {
    marginTop: 24,
    backgroundColor: T.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    ...CARD_SHADOW,
  },
  errorBtnText: {
    color: "white",
    fontWeight: "800",
  },
  header: {
    backgroundColor: T.surface,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    zIndex: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    alignItems: "center",
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: T.primary,
  },
  headerSubtitle: {
    fontSize: 11,
    color: T.text3,
    fontWeight: "600",
    marginTop: 2,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: T.successBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  liveText: {
    fontSize: 10,
    fontWeight: "800",
  },
  statsCardWrap: {
    position: "absolute",
    top: 90,
    left: 16,
    right: 16,
    zIndex: 20,
  },
  statsCard: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-around",
    borderWidth: 1,
    borderColor: T.border,
    ...CARD_SHADOW,
  },
  statCol: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    color: T.text3,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "900",
    color: T.primary,
    marginTop: 2,
  },
  divider: {
    width: 1,
    backgroundColor: T.border,
  },
  statusBannerWrap: {
    position: "absolute",
    top: 90,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 20,
  },
  statusBannerWarning: {
    backgroundColor: T.warningBg,
    borderColor: T.warning,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusBannerWarningText: {
    color: T.warning,
    fontSize: 12,
    fontWeight: "800",
  },
  statusBannerInfo: {
    backgroundColor: T.blueBg,
    borderColor: T.blueBorder,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusBannerInfoText: {
    color: T.blueText,
    fontSize: 12,
    fontWeight: "800",
  },
  map: {
    flex: 1,
  },
  markerWrap: {
    width: 44,
    height: 44,
    backgroundColor: T.primary,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: "white",
    alignItems: "center",
    justifyContent: "center",
    ...CARD_SHADOW,
  },
  markerEmoji: {
    fontSize: 18,
  },
  bottomContainer: {
    backgroundColor: T.surface,
    borderTopWidth: 1,
    borderTopColor: T.border,
  },
  bottomContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  addressIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: T.errorBg,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  addressTextWrap: {
    flex: 1,
  },
  addressTitle: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    color: T.text3,
  },
  addressDesc: {
    fontSize: 14,
    fontWeight: "700",
    color: T.text1,
    marginTop: 2,
  },
  updateBtn: {
    backgroundColor: T.primary,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    ...CARD_SHADOW,
  },
  updateBtnText: {
    color: "white",
    fontWeight: "800",
    fontSize: 15,
  },
});
