import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, Animated, Platform, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker } from "react-native-maps";
import { MAP_PROVIDER } from "@/utils/mapHelper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { io, Socket } from "socket.io-client";
import { Theme } from "@/constants/theme";

const T = Theme.colors;
const API_URL = process.env.EXPO_PUBLIC_API_URL || (Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000');
const DEFAULT_LOC = { latitude: 11.5564, longitude: 104.9282 };

export default function InstantRequestMatching() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const requestId = params.requestId as string;
  const lat = Number(params.lat || DEFAULT_LOC.latitude);
  const lng = Number(params.lng || DEFAULT_LOC.longitude);

  const [statusText, setStatusText] = useState("Checking 3km radius...");
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Pulse animation loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 2.2,
          duration: 1800,
          useNativeDriver: true
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true
        })
      ])
    ).start();

    let socket: Socket | null = null;
    let transitionTimer: any = null;

    // Connect socket for real-time bid updates
    socket = io(API_URL, { transports: ["websocket"] });
    socket.on("connect", () => {
      socket?.emit("join_instant_request", { requestId });
    });

    socket.on("bid_received", (data: any) => {
      setStatusText(`Offer received from ${data.companyName || 'provider'}!`);
      
      // Auto transition after 1.8 seconds to selection view
      if (!transitionTimer) {
        transitionTimer = setTimeout(() => {
          router.push({
            pathname: "/(customer)/instant-request/selection" as any,
            params
          });
        }, 1800);
      }
    });

    // Progressive search status text updates
    const searchStages = [
      { time: 0, text: "Checking 3km radius..." },
      { time: 4000, text: "Expanding search to 5km..." },
      { time: 8000, text: "Looking up to 10km away..." }
    ];

    const timers = searchStages.map(stage => 
      setTimeout(() => {
        setStatusText(stage.text);
      }, stage.time)
    );

    // Fallback timeout: if no bids arrive in 12 seconds, push forward to selection anyway
    const fallbackTimer = setTimeout(() => {
      router.push({
        pathname: "/(customer)/instant-request/selection" as any,
        params
      });
    }, 12000);

    return () => {
      if (socket) {
        socket.emit("leave_instant_request", { requestId });
        socket.disconnect();
      }
      clearTimeout(fallbackTimer);
      if (transitionTimer) clearTimeout(transitionTimer);
      timers.forEach(clearTimeout);
    };
  }, [requestId]);

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      {/* Map Background */}
      <View style={s.mapContainer}>
        <MapView
          provider={MAP_PROVIDER}
          style={StyleSheet.absoluteFillObject}
          initialRegion={{
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.015,
            longitudeDelta: 0.015,
          }}
          scrollEnabled={false}
          zoomEnabled={false}
          pitchEnabled={false}
          rotateEnabled={false}
        >
          {/* Customer Location Pin */}
          <Marker coordinate={{ latitude: lat, longitude: lng }} />
        </MapView>

        {/* Pulse Overlay in Center of Map */}
        <View style={s.radarOverlay}>
          <Animated.View
            style={[
              s.pulseCircle,
              {
                transform: [{ scale: pulseAnim }],
                opacity: pulseAnim.interpolate({
                  inputRange: [1, 2.2],
                  outputRange: [0.55, 0.0]
                })
              }
            ]}
          />
          <View style={s.centerCircle}>
            <MaterialCommunityIcons name="radar" size={32} color="#FFF" />
          </View>
        </View>
      </View>

      {/* Floating Bottom Card */}
      <View style={s.bottomSheet}>
        <View style={s.sheetHeader}>
          <ActivityIndicator size="small" color={T.accent} style={{ marginRight: 10 }} />
          <Text style={s.title}>Finding nearby pros...</Text>
        </View>
        <Text style={s.status}>{statusText}</Text>
        <Text style={s.subText}>This should take just a moment. Offers will appear dynamically.</Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F8FAFC"
  },
  mapContainer: {
    flex: 1,
    position: "relative",
    justifyContent: "center",
    alignItems: "center"
  },
  radarOverlay: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center"
  },
  pulseCircle: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: T.accent,
    borderWidth: 1.5,
    borderColor: T.accentLight
  },
  centerCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: T.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: T.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6
  },
  bottomSheet: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 10
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10
  },
  title: {
    fontSize: 18,
    fontWeight: "900",
    color: T.text1
  },
  status: {
    fontSize: 15,
    fontWeight: "700",
    color: T.accentMid,
    marginBottom: 8
  },
  subText: {
    fontSize: 12,
    color: T.text2,
    lineHeight: 16
  }
});
