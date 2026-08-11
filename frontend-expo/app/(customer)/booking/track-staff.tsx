import React, { useEffect, useRef, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, Platform, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker, Polyline, AnimatedRegion } from "react-native-maps";
import Reanimated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withDelay, Easing } from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { io, Socket } from "socket.io-client";
import { api } from "@/store/authStore";

const API_URL = process.env.EXPO_PUBLIC_API_URL || (Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000');

interface LocationData {
  staffLocation: { lat: number; lng: number; heading?: number; updatedAt: string } | null;
  isOnline: boolean;
  serviceAddress: string;
  serviceLat: number | null;
  serviceLng: number | null;
  bookingStatus: string;
  lastSeen: string | null;
}

// Pulsing Marker Animation Component
function PulsingMarker({ color = "#3B82F6", delay = 0, icon }: { color?: string, delay?: number, icon?: React.ReactNode }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: 2500, easing: Easing.out(Easing.ease) }),
        -1, // infinite
        false // no reverse
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: 1 + progress.value * 2.5 }],
      opacity: 1 - progress.value,
    };
  });

  return (
    <View style={{ width: 60, height: 60, alignItems: "center", justifyContent: "center" }}>
      <Reanimated.View style={[{ position: "absolute", width: 28, height: 28, borderRadius: 14, backgroundColor: color }, animatedStyle]} />
      <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: "#FFFFFF", alignItems: 'center', justifyContent: 'center', backgroundColor: color, ...Platform.select({ ios: { shadowColor: "#000"}, android: { elevation: 4 } }) }}>
        {icon}
      </View>
    </View>
  );
}

export default function TrackStaffScreen() {
  const router = useRouter();
  const { bookingId, serviceName } = useLocalSearchParams<{ bookingId: string; serviceName?: string }>();

  const mapRef = useRef<MapView>(null);
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [liveStaffLocation, setLiveStaffLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [routeCoords, setRouteCoords] = useState<{latitude: number; longitude: number}[]>([]);
  const hasCenteredMap = useRef(false);
  const [autoFollow, setAutoFollow] = useState(true);

  // Smooth Marker Animation
  const staffCoordAnim = useRef(
    new AnimatedRegion({
      latitude: 0,
      longitude: 0,
      latitudeDelta: 0,
      longitudeDelta: 0,
    })
  ).current;

  const fetchLocation = useCallback(async () => {
    if (!bookingId) return;
    try {
      const res = await api.get(`/api/location/${bookingId}`);
      const data: LocationData = res.data?.data ?? res.data;
      setLocationData(data);
      if (data.staffLocation) {
        setLiveStaffLocation({ lat: data.staffLocation.lat, lng: data.staffLocation.lng });
        
        // Initial setup for Animated Marker
        if ((staffCoordAnim as any).latitude._value === 0) {
          staffCoordAnim.setValue({ latitude: data.staffLocation.lat, longitude: data.staffLocation.lng, latitudeDelta: 0.01, longitudeDelta: 0.01 });
        }
        
        setLastUpdated(new Date());
      }
    } catch (e) {
      console.error('[TrackStaff] fetch error', e);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  // Initial load
  useEffect(() => { fetchLocation(); }, [fetchLocation]);

  // WebSocket Live Updates — only connect when job is actively in progress
  useEffect(() => {
    if (!bookingId || !locationData || !['confirmed', 'arrived', 'in_progress'].includes(locationData.bookingStatus)) return;

    let socket: Socket | null = null;
    let isActive = true;

    socket = io(API_URL);
    socket.on("connect", () => {
      socket?.emit("join_booking", String(bookingId));
    });
    
    socket.on("staff_location_updated", (data: any) => {
      if (!isActive) return;
      setLiveStaffLocation({ lat: data.latitude, lng: data.longitude });
      
      // Animate Marker
      if ((staffCoordAnim as any).latitude._value === 0) {
        staffCoordAnim.setValue({ latitude: data.latitude, longitude: data.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 });
      } else {
        staffCoordAnim.timing({
          latitude: data.latitude,
          longitude: data.longitude,
          duration: 1000,
          useNativeDriver: false,
        } as any).start();
      }

      setLastUpdated(new Date());
    });

    return () => {
      isActive = false;
      if (socket) {
        socket.emit("leave_booking", String(bookingId));
        socket.disconnect();
      }
    };
  }, [bookingId, locationData?.bookingStatus]);

  // Auto-fit map when location changes
  useEffect(() => {
    if (mapRef.current && locationData?.serviceLat && locationData?.serviceLng && !hasCenteredMap.current) {
      const coords = [{ latitude: locationData.serviceLat, longitude: locationData.serviceLng }];
      if (liveStaffLocation) {
        coords.push({ latitude: liveStaffLocation.lat, longitude: liveStaffLocation.lng });
      }
      setTimeout(() => {
        mapRef.current?.fitToCoordinates(coords, {
          edgePadding: { top: 80, right: 60, bottom: 80, left: 60 },
          animated: true,
        });
        hasCenteredMap.current = true;
      }, 500);
    }
  }, [locationData?.serviceLat, locationData?.serviceLng]); // Removed liveStaffLocation so it doesn't refit on every move

  // Auto-follow logic
  useEffect(() => {
    if (autoFollow && mapRef.current && liveStaffLocation) {
      mapRef.current.animateCamera({
        center: { latitude: liveStaffLocation.lat, longitude: liveStaffLocation.lng },
        altitude: 2000,
        zoom: 16,
      }, { duration: 1000 });
    }
  }, [liveStaffLocation, autoFollow]);

  // Fetch Driving Route
  useEffect(() => {
    const fetchRoute = async () => {
      if (locationData?.serviceLat && locationData?.serviceLng && liveStaffLocation) {
        try {
          const url = `https://router.project-osrm.org/route/v1/driving/${liveStaffLocation.lng},${liveStaffLocation.lat};${locationData.serviceLng},${locationData.serviceLat}?overview=full&geometries=geojson`;
          const res = await fetch(url);
          const json = await res.json();
          if (json.routes && json.routes.length > 0) {
            const points = json.routes[0].geometry.coordinates.map((coord: number[]) => ({
              latitude: coord[1],
              longitude: coord[0],
            }));
            setRouteCoords(points);
          }
        } catch (e) {
          console.warn("Could not fetch route from OSRM");
        }
      }
    };
    fetchRoute();
  }, [locationData?.serviceLat, locationData?.serviceLng, liveStaffLocation?.lat, liveStaffLocation?.lng]);

  const timeSince = () => {
    if (!lastUpdated) return '';
    const s = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
    if (s < 5) return 'Just now';
    return s < 60 ? `${s}s ago` : `${Math.floor(s / 60)}m ago`;
  };

  const isOnline = locationData?.isOnline || (lastUpdated && (Date.now() - lastUpdated.getTime()) < 60000);

  return (
    <View className="flex-1 bg-surface">
      {/* Header */}
      <SafeAreaView edges={["top"]} className="bg-white border-b border-surface-container z-10" style={styles.shadow as any}>
        <View className="flex-row items-center justify-between px-4 py-3">
          <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 rounded-full items-center justify-center">
            <MaterialCommunityIcons name="arrow-left" size={24} color="#000000" />
          </TouchableOpacity>
          <View className="items-center">
            <Text className="text-base font-bold text-black">Track Staff</Text>
            {serviceName && <Text className="text-xs text-gray-500">{serviceName}</Text>}
          </View>
          <TouchableOpacity onPress={() => {
            setAutoFollow(true);
            if (mapRef.current && locationData?.serviceLat && locationData?.serviceLng && liveStaffLocation) {
              mapRef.current.fitToCoordinates([
                { latitude: locationData.serviceLat, longitude: locationData.serviceLng },
                { latitude: liveStaffLocation.lat, longitude: liveStaffLocation.lng }
              ], {
                edgePadding: { top: 80, right: 60, bottom: 80, left: 60 },
                animated: true,
              });
            }
          }} className="w-10 h-10 rounded-full items-center justify-center">
            <MaterialCommunityIcons name="image-filter-center-focus" size={22} color="#000000" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Floating Status Pill */}
      {locationData && (
        <View className="absolute top-28 left-0 right-0 z-20 items-center pointer-events-none">
          <View className={`flex-row items-center gap-2 px-4 py-2 rounded-full ${isOnline ? 'bg-green-600' : 'bg-gray-500'}`} style={styles.shadow as any}>
            <View className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-200' : 'bg-gray-300'}`} />
            <Text className="text-white text-xs font-bold">
              {isOnline ? `Live Tracking · ${timeSince()}` : 'Location unavailable'}
            </Text>
          </View>
        </View>
      )}

      {/* Map Content */}
      <View className="flex-1">
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#002045" />
            <Text className="text-gray-400 mt-3">Loading map...</Text>
          </View>
        ) : locationData && locationData.serviceLat && locationData.serviceLng ? (
          <MapView
            ref={mapRef}
            style={{ flex: 1 }}
            onPanDrag={() => setAutoFollow(false)}
            initialRegion={{
              latitude: locationData.serviceLat,
              longitude: locationData.serviceLng,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }}
          >
            {/* Service Destination Pin */}
            <Marker
              coordinate={{ latitude: locationData.serviceLat, longitude: locationData.serviceLng }}
              title="Service Address"
              description={locationData.serviceAddress}
            >
              <PulsingMarker color="#EF4444" delay={0} />
            </Marker>
            
            {/* Staff Location Pin (Smooth Animated) */}
            {liveStaffLocation && (
              <Marker.Animated
                coordinate={staffCoordAnim as any}
                title="Staff"
                description="Live Location"
              >
                <PulsingMarker color="#000000" delay={500} icon={<MaterialCommunityIcons name="car" size={12} color="white" />} />
              </Marker.Animated>
            )}

            {/* Tracking Line */}
            {liveStaffLocation && locationData.serviceLat && locationData.serviceLng && (
              <Polyline
                coordinates={
                  routeCoords.length > 0 
                    ? routeCoords 
                    : [
                        { latitude: liveStaffLocation.lat, longitude: liveStaffLocation.lng },
                        { latitude: locationData.serviceLat, longitude: locationData.serviceLng },
                      ]
                }
                strokeColor="#000000"
                strokeWidth={4}
                lineDashPattern={routeCoords.length > 0 ? undefined : [5, 5]}
              />
            )}
          </MapView>
        ) : (
          <View className="flex-1 items-center justify-center px-8">
            <MaterialCommunityIcons name="map-marker-off" size={52} color="#9CA3AF" />
            <Text className="text-gray-500 font-bold mt-4 text-center">No location data available</Text>
            <Text className="text-gray-400 text-sm text-center mt-2">Map will appear once the job begins.</Text>
          </View>
        )}
      </View>

      {/* Bottom info card */}
      {locationData && (
        <SafeAreaView edges={["bottom"]} className="bg-white border-t border-surface-container z-10" style={styles.shadowUp as any}>
          <View className="px-5 py-4 flex-row items-center gap-4">
            <View className="w-12 h-12 rounded-full bg-[#F7F7F7] items-center justify-center border border-[#EBEBEB]">
              <MaterialCommunityIcons name="map-marker-check" size={24} color="#000000" />
            </View>
            <View className="flex-1">
              <Text className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-0.5">Service Address</Text>
              <Text className="text-sm font-bold text-black" numberOfLines={2}>
                {locationData.serviceAddress || "—"}
              </Text>
            </View>
          </View>
        </SafeAreaView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {},
  shadowUp: {},
  staffMarker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "white",
  }
});
