import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker, Polyline } from "react-native-maps";
import { MAP_PROVIDER } from "@/utils/mapHelper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { io, Socket } from "socket.io-client";
import { Theme } from "@/constants/theme";
import { api } from "@/store/authStore";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";
import { SOCKET_URL as API_URL } from "@/lib/apiConfig";

const T = Theme.colors;



export default function InstantRequestTracking() {
  const router = useRouter();
  const { bookingId, isSimulation } = useLocalSearchParams<{ bookingId: string, isSimulation?: string }>();
  const { location: fallbackLoc } = useCurrentLocation(true);

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [providerLoc, setProviderLoc] = useState({ latitude: 11.5615, longitude: 104.9310 });
  const [etaVal, setEtaVal] = useState<number | string>("Assigning...");
  const [status, setStatus] = useState<"confirmed" | "on_the_way" | "arrived" | "in_progress" | "completed">("confirmed");
  const [isLive, setIsLive] = useState(false);

  const stepCount = useRef(0);

  // 1. Fetch & Poll booking details
  useEffect(() => {
    async function loadBooking() {
      if (isSimulation === "true") {
        const b = {
          id: bookingId || "mock-booking",
          status: "confirmed",
          totalPrice: "25.00",
          customerNotes: "Test simulation notes",
          company: { 
            name: "ABC Repair (Simulated)", 
            latitude: String(fallbackLoc.latitude + 0.006), 
            longitude: String(fallbackLoc.longitude + 0.006) 
          },
          service: { name: "AC Cleaning" },
          latitude: fallbackLoc.latitude,
          longitude: fallbackLoc.longitude,
        };
        setBooking(b);
        setProviderLoc({
          latitude: fallbackLoc.latitude + 0.006,
          longitude: fallbackLoc.longitude + 0.006
        });
        setLoading(false);
        return;
      }
      if (!bookingId) return;
      try {
        const res = await api.get(`/api/bookings/${bookingId}`);
        const b = res.data.data.booking ?? res.data.data;
        setBooking(b);
        if (b.company?.latitude && b.company?.longitude) {
          setProviderLoc({
            latitude: parseFloat(b.company.latitude),
            longitude: parseFloat(b.company.longitude)
          });
        }
      } catch (err) {
        console.error("Failed to load booking in tracking:", err);
      } finally {
        setLoading(false);
      }
    }
    loadBooking();

    if (isSimulation === "true") return;

    // Poll status from DB every 5 seconds to sync with staff acceptance/travel steps
    const pollInterval = setInterval(loadBooking, 5000);
    return () => clearInterval(pollInterval);
  }, [bookingId, isSimulation, fallbackLoc]);

  // 1.5. Synchronize local status state with database status
  useEffect(() => {
    if (isSimulation === "true") return;
    if (!booking) return;
    const dbStatus = booking.status;
    if (dbStatus === "en_route") {
      setStatus("on_the_way");
    } else if (dbStatus === "arrived") {
      setStatus("arrived");
      setEtaVal("Arrived");
    } else if (dbStatus === "in_progress") {
      setStatus("in_progress");
      setEtaVal("In Progress");
    } else if (dbStatus === "confirmed" || dbStatus === "assigned") {
      setStatus("confirmed");
    }
  }, [booking?.status, isSimulation]);

  // 2. WebSocket live updates connection
  useEffect(() => {
    if (isSimulation === "true") return;
    if (loading || !booking || !bookingId) return;

    let socket: Socket | null = null;
    try {
      socket = io(API_URL, { transports: ["websocket"] });
      socket.on("connect", () => {
        socket?.emit("join_booking", String(bookingId));
      });

      socket.on("staff_location_updated", (data: any) => {
        setIsLive(true);
        setProviderLoc({ latitude: data.latitude, longitude: data.longitude });
        
        // Derive status from the live coordinates/eta
        const cLat = booking?.latitude ? parseFloat(booking.latitude) : 11.5564;
        const cLng = booking?.longitude ? parseFloat(booking.longitude) : 104.9282;
        const latDiff = Math.abs(cLat - data.latitude);
        const lngDiff = Math.abs(cLng - data.longitude);
        if (latDiff < 0.001 && lngDiff < 0.001) {
          setStatus("arrived");
          setEtaVal("Arrived");
        } else {
          setStatus("on_the_way");
          setEtaVal("Live tracking...");
        }
      });
    } catch (e) {
      console.warn("Socket.io connection failed, staying in mock mode:", e);
    }

    return () => {
      if (socket) {
        socket.emit("leave_booking", String(bookingId));
        socket.disconnect();
      }
    };
  }, [loading, booking, bookingId]);

  // 3. Mock simulation loop (only runs if isLive is false)
  useEffect(() => {
    if (loading || !booking || isLive) return;

    const interval = setInterval(() => {
      if (isLive) {
        clearInterval(interval);
        return;
      }

      stepCount.current += 1;
      const step = stepCount.current;

      if (step < 2) {
        // Confirmed state (0 - 4 seconds)
        setStatus("confirmed");
        setEtaVal("Assigning...");
      } else if (step >= 2 && step < 6) {
        // En route state (4 - 12 seconds)
        setStatus("on_the_way");
        // Interpolate coordinates closer
        setProviderLoc((prev) => {
          const cLat = booking?.latitude ? parseFloat(booking.latitude) : 11.5564;
          const cLng = booking?.longitude ? parseFloat(booking.longitude) : 104.9282;
          const nextLat = prev.latitude + (cLat - prev.latitude) * 0.22;
          const nextLng = prev.longitude + (cLng - prev.longitude) * 0.22;
          return { latitude: nextLat, longitude: nextLng };
        });
        const remainingSteps = 6 - step;
        setEtaVal(remainingSteps + 1 + " mins");
      } else if (step >= 6 && step < 9) {
        // Arrived state (12 - 18 seconds)
        setStatus("arrived");
        setProviderLoc({
          latitude: booking?.latitude ? parseFloat(booking.latitude) : 11.5564,
          longitude: booking?.longitude ? parseFloat(booking.longitude) : 104.9282
        });
        setEtaVal("Arrived");
      } else if (step >= 9 && step < 12) {
        // In Progress state (18 - 24 seconds)
        setStatus("in_progress");
        setEtaVal("In Progress");
      } else if (step >= 12) {
        // Completed state (24+ seconds)
        setStatus("completed");
        setEtaVal("Completed");
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [loading, booking, isLive, isSimulation]);

  if (loading) {
    return (
      <SafeAreaView style={[s.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={T.accent} />
      </SafeAreaView>
    );
  }

  const companyName = booking?.company?.name || "Service Provider";
  const serviceName = booking?.service?.name || "Service";
  const startLat = booking?.company?.latitude ? parseFloat(booking.company.latitude) : 11.5615;
  const startLng = booking?.company?.longitude ? parseFloat(booking.company.longitude) : 104.9310;
  const customerLoc = {
    latitude: booking?.latitude ? parseFloat(booking.latitude) : 11.5564,
    longitude: booking?.longitude ? parseFloat(booking.longitude) : 104.9282
  };

  return (
    <SafeAreaView style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.replace("/(customer)/(tabs)/home")} style={s.backBtn}>
          <MaterialCommunityIcons name="home-outline" size={24} color={T.text1} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Live Tracking</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Map View */}
      <View style={s.mapContainer}>
        <MapView
          provider={MAP_PROVIDER}
          style={StyleSheet.absoluteFillObject}
          initialRegion={{
            latitude: (customerLoc.latitude + startLat) / 2,
            longitude: (customerLoc.longitude + startLng) / 2,
            latitudeDelta: 0.015,
            longitudeDelta: 0.015,
          }}
        >
          {/* Customer Location Pin */}
          <Marker coordinate={customerLoc} title="You">
            <View style={s.customerMarker}>
              <MaterialCommunityIcons name="home" size={20} color="#FFF" />
            </View>
          </Marker>

          {/* Provider Vehicle Pin */}
          <Marker coordinate={providerLoc} title={companyName}>
            <View style={[s.providerMarker, status === "arrived" && s.providerArrived]}>
              <MaterialCommunityIcons name="car-sports" size={20} color="#FFF" />
            </View>
          </Marker>

          {/* Route Line */}
          <Polyline
            coordinates={[providerLoc, customerLoc]}
            strokeColor={T.accent}
            strokeWidth={4}
            lineDashPattern={[6, 3]}
          />
        </MapView>

        {/* Floating ETA bubble */}
        <View style={s.etaBubble}>
          <Text style={s.etaLabel}>STATUS</Text>
          <Text style={s.etaText}>{etaVal}</Text>
        </View>
      </View>

      {/* Bottom Sheet Drawer Details */}
      <View style={s.bottomSheet}>
        <View style={s.profileRow}>
          <Image
            source={{ uri: `https://api.dicebear.com/9.x/initials/svg?seed=${companyName}` }}
            style={s.avatar}
          />
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={s.companyName}>{companyName}</Text>
            <Text style={s.serviceType}>{serviceName} • Verified Provider</Text>
          </View>
          <TouchableOpacity style={s.contactIconBtn}>
            <MaterialCommunityIcons name="phone" size={20} color={T.accent} />
          </TouchableOpacity>
        </View>        <View style={s.statusBanner}>
          <View style={[
            s.pulseDot, 
            (status === "arrived" || status === "completed") && { backgroundColor: T.success }, 
            status === "in_progress" && { backgroundColor: T.accent }
          ]} />
          <Text style={s.statusText}>
            {status === "confirmed" && "Booking confirmed. Assigning staff..."}
            {status === "on_the_way" && "Staff Member 1 is en route to you"}
            {status === "arrived" && "Staff has arrived at your location"}
            {status === "in_progress" && "Service is in progress..."}
            {status === "completed" && "Service completed successfully! Thank you."}
          </Text>
        </View>

        <View style={s.buttonRow}>
          {(status === "in_progress" || status === "completed") ? (
            <TouchableOpacity
              style={s.paymentBtn}
              onPress={() => {
                router.replace("/(customer)/(tabs)/home" as any);
              }}
            >
              <Text style={s.paymentText}>Return to Home</Text>
              <MaterialCommunityIcons name="home" size={20} color="#FFF" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={s.cancelBtn}
              onPress={() => {
                Alert.alert("Cancel Booking?", "Are you sure you want to cancel this booking?", [
                  { text: "No", style: "cancel" },
                  {
                    text: "Yes, Cancel",
                    style: "destructive",
                    onPress: () => router.replace("/(customer)/(tabs)/home")
                  }
                ]);
              }}
            >
              <Text style={s.cancelText}>Cancel Booking</Text>
            </TouchableOpacity>
          )}
        </View>
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
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFF"
  },
  providerMarker: {
    backgroundColor: T.warning,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  providerArrived: {
    backgroundColor: T.success
  },
  etaBubble: {
    position: "absolute",
    top: 16,
    alignSelf: "center",
    backgroundColor: "#0F172A",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4
  },
  etaLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: "rgba(255, 255, 255, 0.6)",
    letterSpacing: 0.5
  },
  etaText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFF"
  },
  bottomSheet: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 10
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F1F5F9"
  },
  companyName: {
    fontSize: 18,
    fontWeight: "800",
    color: T.text1
  },
  serviceType: {
    fontSize: 13,
    color: T.text2,
    fontWeight: "500",
    marginTop: 2
  },
  contactIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: T.accent + "10",
    alignItems: "center",
    justifyContent: "center"
  },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 12,
    marginTop: 20,
    gap: 8
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: T.success
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
    color: T.text1
  },
  buttonRow: {
    marginTop: 20
  },
  cancelBtn: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center"
  },
  cancelText: {
    color: T.error,
    fontSize: 14,
    fontWeight: "700"
  },
  paymentBtn: {
    backgroundColor: T.accent,
    height: 48,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center"
  },
  paymentText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "800"
  }
});
