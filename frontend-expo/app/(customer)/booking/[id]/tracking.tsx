import React, { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import {
  View, Text, TouchableOpacity, StyleSheet,
  Platform, ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from "react-native-maps";
import { Theme } from "@/constants/theme";

const T = Theme.colors;

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 16 },
  android: { elevation: 12 },
});

const DESTINATION = { latitude: 37.7749, longitude: -122.4194 };
const START = { latitude: 37.7600, longitude: -122.4300 };

const BACKEND_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3000';

export default function LiveTrackingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const bookingId = params.id || "BOOK-999";

  // Simulation State
  const [etaMins, setEtaMins] = useState(12);
  const [currentLoc, setCurrentLoc] = useState(START);
  const [arrived, setArrived] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    // Connect to WebSocket Server
    const socket: Socket = io(BACKEND_URL, {
      transports: ['websocket'],
    });

    socket.on("connect", () => {
      socket.emit("join_booking", bookingId);
    });

    socket.on("staff_location_updated", (data: { latitude: number; longitude: number }) => {
      setCurrentLoc({ latitude: data.latitude, longitude: data.longitude });
      
      // Rough distance calculation to determine "arrived" (within ~100m)
      const latDiff = Math.abs(DESTINATION.latitude - data.latitude);
      const lngDiff = Math.abs(DESTINATION.longitude - data.longitude);
      if (latDiff < 0.001 && lngDiff < 0.001) {
        setArrived(true);
        setEtaMins(0);
      }
    });

    socket.on("disconnect", () => {
    });

    return () => {
      socket.emit("leave_booking", bookingId);
      socket.disconnect();
    };
  }, [bookingId]);

  const focusMap = () => {
    if (mapRef.current && mapReady) {
      mapRef.current.fitToCoordinates([START, DESTINATION], {
        edgePadding: { top: 100, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  };

  return (
    <View style={s.root}>
      {/* Absolute Back Button floating over map */}
      <SafeAreaView edges={['top']} style={s.floatingHeader}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={T.text1} />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Top 70% Map View */}
      <View style={s.mapContainer}>
        {Platform.OS !== 'web' ? (
          <MapView
            ref={mapRef}
            provider={PROVIDER_DEFAULT}
            style={StyleSheet.absoluteFillObject}
            initialRegion={{
              latitude: (START.latitude + DESTINATION.latitude) / 2,
              longitude: (START.longitude + DESTINATION.longitude) / 2,
              latitudeDelta: 0.04,
              longitudeDelta: 0.04,
            }}
            onMapReady={() => {
              setMapReady(true);
              focusMap();
            }}
          >
            {/* Route Polyline */}
            <Polyline
              coordinates={[currentLoc, DESTINATION]}
              strokeColor={T.accent}
              strokeWidth={4}
              lineDashPattern={[1]}
            />
            
            {/* Customer Home Pin */}
            <Marker coordinate={DESTINATION}>
              <View style={s.homePin}>
                <MaterialCommunityIcons name="home" size={20} color="#FFF" />
              </View>
            </Marker>

            {/* Staff Car Pin */}
            <Marker coordinate={currentLoc} anchor={{ x: 0.5, y: 0.5 }}>
              <View style={s.carPin}>
                <MaterialCommunityIcons name="car-side" size={20} color="#FFF" />
              </View>
            </Marker>
          </MapView>
        ) : (
          <View style={s.webFallback}>
            <MaterialCommunityIcons name="map-marker-off" size={64} color="#94A3B8" />
            <Text style={s.webFallbackText}>Live tracking map unavailable on Web.</Text>
            <Text style={s.webFallbackSub}>Please use the mobile app to view the driver's location.</Text>
          </View>
        )}

        {/* ETA Bubble */}
        {!arrived && (
          <View style={s.etaBubble}>
            <Text style={s.etaValue}>{etaMins}</Text>
            <Text style={s.etaLabel}>MIN</Text>
          </View>
        )}
      </View>

      {/* Bottom 30% Staff Details Sheet */}
      <View style={s.bottomSheet}>
        {/* Drag Indicator */}
        <View style={s.dragIndicator} />

        <View style={s.statusBanner}>
          <View style={[s.statusDot, arrived && { backgroundColor: T.success }]} />
          <Text style={s.statusText}>
            {arrived ? "Your Pro has arrived!" : "Your Pro is on the way"}
          </Text>
        </View>

        <View style={s.staffProfileRow}>
          <Image 
            source={{ uri: "https://api.dicebear.com/9.x/avataaars/svg?seed=JohnDoe" }} 
            style={s.avatar} 
          />
          <View style={s.staffInfo}>
            <Text style={s.staffName}>John Doe</Text>
            <View style={s.ratingRow}>
              <MaterialCommunityIcons name="star" size={14} color={T.gold} />
              <Text style={s.ratingText}>4.9 (124 reviews)</Text>
            </View>
          </View>
          <View style={s.vehicleBadge}>
            <Text style={s.vehicleText}>White Ford F-150</Text>
          </View>
        </View>

        <View style={s.actionsRow}>
          <TouchableOpacity style={[s.actionBtn, s.callBtn]} activeOpacity={0.8}>
            <MaterialCommunityIcons name="phone" size={20} color="#FFF" />
            <Text style={s.actionBtnText}>Call Staff</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.actionBtn, s.msgBtn]} activeOpacity={0.8}>
            <MaterialCommunityIcons name="message-text" size={20} color={T.blue} />
            <Text style={[s.actionBtnText, { color: T.blue }]}>Message</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  
  floatingHeader: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 10, paddingHorizontal: 16 },
  backBtn: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: T.surface,
    alignItems: "center", justifyContent: "center", marginTop: 8,
    borderWidth: 1, borderColor: T.border, ...CARD_SHADOW
  },

  mapContainer: { flex: 0.7, backgroundColor: "#E2E8F0", justifyContent: "center", alignItems: "center" },
  
  webFallback: { alignItems: "center", padding: 24 },
  webFallbackText: { fontSize: 16, fontWeight: "700", color: "#64748B", marginTop: 16 },
  webFallbackSub: { fontSize: 14, color: "#94A3B8", textAlign: "center", marginTop: 8 },

  homePin: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: T.accent,
    alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: "#FFF",
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4
  },
  carPin: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: T.text1,
    alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: "#FFF",
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4
  },

  etaBubble: {
    position: "absolute", top: 120, right: 16, backgroundColor: T.surface,
    paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, alignItems: "center",
    borderWidth: 1, borderColor: T.border, ...CARD_SHADOW
  },
  etaValue: { fontSize: 24, fontWeight: "900", color: T.accent },
  etaLabel: { fontSize: 10, fontWeight: "800", color: T.text2, letterSpacing: 1 },

  bottomSheet: {
    flex: 0.3, backgroundColor: T.surface, borderTopLeftRadius: 32, borderTopRightRadius: 32,
    padding: 24, paddingTop: 12, ...CARD_SHADOW, marginTop: -24
  },
  dragIndicator: { width: 40, height: 4, borderRadius: 2, backgroundColor: T.border, alignSelf: "center", marginBottom: 20 },
  
  statusBanner: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 24 },
  statusDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: T.accent },
  statusText: { fontSize: 18, fontWeight: "800", color: T.text1 },

  staffProfileRow: { flexDirection: "row", alignItems: "center", marginBottom: 24 },
  avatar: { width: 56, height: 56, borderRadius: 16, backgroundColor: T.accentLight },
  staffInfo: { flex: 1, marginLeft: 16 },
  staffName: { fontSize: 16, fontWeight: "700", color: T.text1, marginBottom: 4 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  ratingText: { fontSize: 13, fontWeight: "600", color: T.text2 },
  vehicleBadge: { backgroundColor: T.bg, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: T.border },
  vehicleText: { fontSize: 11, fontWeight: "700", color: T.text2 },

  actionsRow: { flexDirection: "row", gap: 12 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1 },
  callBtn: { backgroundColor: T.success, borderColor: T.success },
  msgBtn: { backgroundColor: T.blue + "15", borderColor: T.blue + "30" },
  actionBtnText: { fontSize: 15, fontWeight: "700", color: "#FFF" },
});
