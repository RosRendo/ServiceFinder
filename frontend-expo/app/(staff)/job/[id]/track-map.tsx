import React, { useEffect, useRef, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import MapView, { Marker, Polyline } from "react-native-maps";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as ExpoLocation from "expo-location";
import { api } from "@/store/authStore";

interface GeoCoords { lat: number; lng: number; accuracy?: number; heading?: number }
const PUSH_INTERVAL_MS = 10_000;
const DEFAULT = { lat: 11.5625, lng: 104.916 };

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

  const webviewRef = useRef<WebView>(null);
  const watchRef   = useRef<ExpoLocation.LocationSubscription | null>(null);
  const pushTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [myCoords, setMyCoords]         = useState<GeoCoords | null>(null);
  const [mapReady, setMapReady]         = useState(false);
  const [permGranted, setPermGranted]   = useState(false);
  const [pushing, setPushing]           = useState(false);
  const [pushCount, setPushCount]       = useState(0);
  const [error, setError]               = useState<string | null>(null);

  const svcLat = serviceLat ? parseFloat(serviceLat) : DEFAULT.lat;
  const svcLng = serviceLng ? parseFloat(serviceLng) : DEFAULT.lng;

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
      watchRef.current = await ExpoLocation.watchPositionAsync(
        { accuracy: ExpoLocation.Accuracy.High, timeInterval: 5000, distanceInterval: 10 },
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
      );
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
    </body></html>`;
  };

  const handleWebViewMessage = (e: any) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data);
      if (msg.type === "ready") setMapReady(true);
    } catch {}
  };

  // ── Haversine distance helper ─────────────────────────────────────────────
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
    <SafeAreaView className="flex-1 bg-surface items-center justify-center px-8">
      <MaterialCommunityIcons name="map-marker-off" size={52} color="#EF4444" />
      <Text className="text-red-600 font-bold mt-4 text-center">{error}</Text>
      <TouchableOpacity onPress={() => router.back()} className="mt-6 bg-[#002045] px-6 py-3 rounded-full">
        <Text className="text-white font-bold">Go Back</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );

  return (
    <View className="flex-1 bg-surface">
      {/* Header */}
      <SafeAreaView edges={["top"]} className="bg-white border-b border-surface-container">
        <View className="flex-row items-center justify-between px-4 py-3">
          <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 rounded-full items-center justify-center">
            <MaterialCommunityIcons name="arrow-left" size={24} color="#002045" />
          </TouchableOpacity>
          <View className="items-center">
            <Text className="text-base font-bold text-primary">Navigate to Job</Text>
            {serviceName && <Text className="text-xs text-on-surface-variant" numberOfLines={1}>{serviceName}</Text>}
          </View>
          {/* Live indicator */}
          <View className="flex-row items-center gap-1.5 bg-green-100 px-3 py-1.5 rounded-full">
            {pushing
              ? <ActivityIndicator size="small" color="#16a34a" />
              : <View className="w-2 h-2 rounded-full bg-green-500" />}
            <Text className="text-[10px] font-bold text-green-700">LIVE</Text>
          </View>
        </View>
      </SafeAreaView>

      {/* Stats row */}
      {myCoords && (
        <View className="absolute top-24 left-4 right-4 z-20">
          <View className="bg-white/95 rounded-2xl px-4 py-3 shadow-lg flex-row justify-around">
            <View className="items-center">
              <Text className="text-[10px] font-bold uppercase text-gray-400">Distance</Text>
              <Text className="text-lg font-black text-primary">{distanceKm()} km</Text>
            </View>
            <View className="w-px bg-gray-200" />
            <View className="items-center">
              <Text className="text-[10px] font-bold uppercase text-gray-400">Updates Sent</Text>
              <Text className="text-lg font-black text-green-600">{pushCount}</Text>
            </View>
            <View className="w-px bg-gray-200" />
            <View className="items-center">
              <Text className="text-[10px] font-bold uppercase text-gray-400">Accuracy</Text>
              <Text className="text-lg font-black text-primary">
                {myCoords.accuracy != null ? `±${myCoords.accuracy.toFixed(0)}m` : "—"}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Waiting for GPS */}
      {!permGranted && !error && (
        <View className="absolute top-24 left-0 right-0 items-center z-20">
          <View className="bg-amber-100 border border-amber-300 px-4 py-2 rounded-full flex-row items-center gap-2">
            <ActivityIndicator size="small" color="#d97706" />
            <Text className="text-amber-700 text-xs font-bold">Requesting GPS permission...</Text>
          </View>
        </View>
      )}

      {permGranted && !myCoords && (
        <View className="absolute top-24 left-0 right-0 items-center z-20">
          <View className="bg-blue-50 border border-blue-200 px-4 py-2 rounded-full flex-row items-center gap-2">
            <ActivityIndicator size="small" color="#1d4ed8" />
            <Text className="text-blue-700 text-xs font-bold">Getting your GPS signal...</Text>
          </View>
        </View>
      )}

      {/* Map */}
      {process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ? (
        <MapView
          style={{ flex: 1 }}
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
              <View className="w-12 h-12 bg-[#002045] rounded-full border-4 border-white items-center justify-center shadow-lg">
                <Text className="text-xl">🧑‍🔧</Text>
              </View>
            </Marker>
          )}
          <Marker coordinate={{ latitude: svcLat, longitude: svcLng }}>
            <View className="w-11 h-11 bg-pink-500 rounded-full border-4 border-white items-center justify-center shadow-lg">
              <Text className="text-lg">🏠</Text>
            </View>
          </Marker>
          {myCoords && (
            <Polyline
              coordinates={[{ latitude: myCoords.lat, longitude: myCoords.lng }, { latitude: svcLat, longitude: svcLng }]}
              strokeColor="#002045"
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
          style={{ flex: 1 }}
          onMessage={handleWebViewMessage}
          onError={() => Alert.alert("Map Error", "Could not load map.")}
        />
      )}

      {/* Bottom card */}
      <SafeAreaView edges={["bottom"]} className="bg-white border-t border-surface-container">
        <View className="px-4 py-4 gap-3">
          <View className="flex-row items-start gap-3">
            <View className="w-10 h-10 rounded-full bg-pink-100 items-center justify-center mt-0.5">
              <MaterialCommunityIcons name="map-marker" size={20} color="#e91e63" />
            </View>
            <View className="flex-1">
              <Text className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Customer Address</Text>
              <Text className="text-sm font-semibold text-on-surface" numberOfLines={2}>
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
            className="bg-[#002045] rounded-full py-3.5 items-center flex-row justify-center gap-2"
          >
            <MaterialCommunityIcons name="send" size={18} color="white" />
            <Text className="text-white font-bold">Update My Location Now</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}
