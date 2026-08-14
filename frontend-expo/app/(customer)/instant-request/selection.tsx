import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker } from "react-native-maps";
import { MAP_PROVIDER } from "@/utils/mapHelper";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Theme } from "@/constants/theme";

import { api } from "@/store/authStore";
import { io, Socket } from "socket.io-client";
import { ActivityIndicator, Alert, Platform } from "react-native";

const T = Theme.colors;
const { width } = Dimensions.get("window");

const DEFAULT_LOC = { latitude: 11.5564, longitude: 104.9282 };
const API_URL = process.env.EXPO_PUBLIC_API_URL || (Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000');

interface Bid {
  id: string;
  companyName: string;
  rating: number;
  priceEstimate: string;
  eta: string;
  distance: string;
  lat?: number;
  lng?: number;
}

export default function InstantRequestSelection() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const requestId = params.requestId as string;
  const lat = Number(params.lat || DEFAULT_LOC.latitude);
  const lng = Number(params.lng || DEFAULT_LOC.longitude);

  const [bids, setBids] = useState<Bid[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const mapViewRef = useRef<MapView>(null);

  // Generate coordinates near customer for map visualization
  const getProviderCoordinate = (idx: number) => {
    const offsets = [
      { latitude: 0.0051, longitude: 0.0028 },
      { latitude: -0.0054, longitude: 0.0098 },
      { latitude: 0.0116, longitude: -0.0102 }
    ];
    const offset = offsets[idx % offsets.length];
    return {
      latitude: lat + offset.latitude,
      longitude: lng + offset.longitude
    };
  };

  // Pan map when selected provider changes
  useEffect(() => {
    if (bids.length > 0 && mapViewRef.current) {
      const targetCoords = getProviderCoordinate(selectedIdx);
      mapViewRef.current.animateToRegion({
        latitude: targetCoords.latitude,
        longitude: targetCoords.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02
      }, 800);
    }
  }, [selectedIdx, bids]);

  // Load bids initially and connect socket listener
  useEffect(() => {
    let socket: Socket | null = null;

    const fetchBids = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/api/instant-requests/${requestId}/bids`);
        const payloadList = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
        const sorted = [...payloadList].sort((a: any, b: any) => {
          const valA = parseInt(a.eta) || 999;
          const valB = parseInt(b.eta) || 999;
          return valA - valB;
        });
        setBids(sorted);
      } catch (err: any) {
        console.warn("Failed to load bids initially:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBids();

    // Setup socket to receive incoming bids in real-time
    socket = io(API_URL, { transports: ["websocket"] });
    socket.on("connect", () => {
      socket?.emit("join_instant_request", { requestId });
    });

    socket.on("bid_received", (newBid: any) => {
      setBids((prev) => {
        // Prevent duplicate bids
        if (prev.some((b) => b.id === newBid.id)) return prev;
        const updated = [...prev, newBid];
        // Sort by fastest ETA
        return updated.sort((a: any, b: any) => {
          const valA = parseInt(a.eta) || 999;
          const valB = parseInt(b.eta) || 999;
          return valA - valB;
        });
      });
    });

    return () => {
      if (socket) {
        socket.emit("leave_instant_request", { requestId });
        socket.disconnect();
      }
    };
  }, [requestId]);

  const handleSelect = async () => {
    if (bids.length === 0) return;
    const selected = bids[selectedIdx];
    const targetCoords = getProviderCoordinate(selectedIdx);

    try {
      setSubmitting(true);
      const res = await api.post(`/api/instant-requests/${requestId}/select`, {
        bidId: selected.id
      });

      const responseData = res.data?.data || res.data;
      const bookingId = responseData?.bookingId;

      router.push({
        pathname: "/(customer)/checkout" as any,
        params: {
          bookingId,
          isInstant: "true",
        }
      });
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message || err.message || "Failed to select provider");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={T.text1} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Select Provider</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Map View */}
      <View style={s.mapContainer}>
        {loading ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F8FAFC" }}>
            <ActivityIndicator size="large" color={T.accent} />
            <Text style={{ marginTop: 12, fontSize: 14, color: T.text2, fontWeight: "600" }}>Loading available providers...</Text>
          </View>
        ) : bids.length === 0 ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F8FAFC", padding: 24 }}>
            <MaterialCommunityIcons name="wifi-off" size={48} color={T.text2} style={{ marginBottom: 12 }} />
            <Text style={{ fontSize: 16, color: T.text1, fontWeight: "700", textAlign: "center" }}>No providers available yet</Text>
            <Text style={{ fontSize: 13, color: T.text2, textAlign: "center", marginTop: 4, paddingHorizontal: 20 }}>
              Searching for nearby companies willing to take this request. Please wait...
            </Text>
          </View>
        ) : (
          <>
            <MapView
              provider={MAP_PROVIDER}
              ref={mapViewRef}
              style={StyleSheet.absoluteFillObject}
              initialRegion={{
                latitude: lat,
                longitude: lng,
                latitudeDelta: 0.025,
                longitudeDelta: 0.025,
              }}
            >
              {/* Customer marker */}
              <Marker coordinate={{ latitude: lat, longitude: lng }}>
                <View style={s.customerMarker}>
                  <MaterialCommunityIcons name="home-outline" size={18} color="#FFF" />
                </View>
              </Marker>

              {/* Provider Markers */}
              {bids.map((p, idx) => {
                const isSelected = selectedIdx === idx;
                const coords = getProviderCoordinate(idx);
                return (
                  <Marker
                    key={p.id}
                    coordinate={coords}
                    onPress={() => setSelectedIdx(idx)}
                  >
                    <View style={[s.providerMarker, isSelected && s.providerMarkerSelected]}>
                      <MaterialCommunityIcons name="truck-delivery" size={18} color="#FFF" />
                    </View>
                  </Marker>
                );
              })}
            </MapView>

            {/* Floating Cards Deck */}
            <View style={s.deckWrapper}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={width - 48 + 12}
                decelerationRate="fast"
                contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
                onMomentumScrollEnd={(e) => {
                  const idx = Math.round(e.nativeEvent.contentOffset.x / (width - 48 + 12));
                  if (idx >= 0 && idx < bids.length) {
                    setSelectedIdx(idx);
                  }
                }}
              >
                {bids.map((p, idx) => {
                  const isSelected = selectedIdx === idx;
                  const coords = getProviderCoordinate(idx);
                  const distanceStr = p.distance || "1.5 km";
                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={[s.card, isSelected && s.cardSelected]}
                      activeOpacity={0.9}
                      onPress={() => setSelectedIdx(idx)}
                    >
                      <View style={s.cardHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={s.companyName}>{p.companyName}</Text>
                          <View style={s.ratingRow}>
                            <MaterialIcons name="star" size={14} color="#eab308" />
                            <Text style={s.ratingText}>{p.rating}</Text>
                            <Text style={s.jobsText}>• verified pro</Text>
                          </View>
                        </View>
                        <View style={s.badge}>
                          <Text style={s.badgeText}>{distanceStr}</Text>
                        </View>
                      </View>

                      <View style={s.cardDetails}>
                        <View style={s.detailCol}>
                          <Text style={s.detailLabel}>ESTIMATED ETA</Text>
                          <Text style={s.detailVal}>{p.eta}</Text>
                        </View>
                        <View style={s.detailCol}>
                          <Text style={s.detailLabel}>PRICE ESTIMATE</Text>
                          <Text style={s.detailVal}>{p.priceEstimate}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Action button */}
              <View style={{ paddingHorizontal: 24, marginTop: 12 }}>
                <TouchableOpacity
                  style={[s.confirmBtn, submitting && { backgroundColor: "#94a3b8" }]}
                  disabled={submitting}
                  onPress={handleSelect}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <>
                      <Text style={s.confirmBtnText}>Confirm Provider</Text>
                      <MaterialCommunityIcons name="check-circle-outline" size={20} color="#FFF" style={{ marginLeft: 8 }} />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F8FAFC"
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFF"
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9"
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: T.text1
  },
  mapContainer: {
    flex: 1,
    position: "relative"
  },
  customerMarker: {
    backgroundColor: T.accent,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFF"
  },
  providerMarker: {
    backgroundColor: "#64748b",
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFF"
  },
  providerMarkerSelected: {
    backgroundColor: T.success,
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3
  },
  deckWrapper: {
    position: "absolute",
    bottom: 24,
    left: 0,
    right: 0
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 16,
    width: width - 48,
    borderWidth: 2,
    borderColor: "transparent",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4
  },
  cardSelected: {
    borderColor: T.accent
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12
  },
  companyName: {
    fontSize: 18,
    fontWeight: "800",
    color: T.text1
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4
  },
  ratingText: {
    fontSize: 13,
    fontWeight: "700",
    color: T.text1
  },
  jobsText: {
    fontSize: 12,
    color: T.text2
  },
  badge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: T.text2
  },
  cardDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderColor: "#F1F5F9",
    paddingTop: 12
  },
  detailCol: {
    flex: 1
  },
  detailLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: T.text2,
    letterSpacing: 0.5
  },
  detailVal: {
    fontSize: 16,
    fontWeight: "700",
    color: T.text1,
    marginTop: 2
  },
  confirmBtn: {
    backgroundColor: T.accent,
    height: 52,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center"
  },
  confirmBtnText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700"
  }
});
