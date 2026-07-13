import React, { useState, useEffect, useRef } from "react";
import { Image } from "expo-image";
import { ScrollView, Text, View, TouchableOpacity, Alert, Platform, ActivityIndicator, StyleSheet, Dimensions, Animated, PanResponder } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as ExpoLocation from "expo-location";
import MapView, { Marker, Polyline, AnimatedRegion } from "react-native-maps";
import Reanimated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withDelay, Easing } from "react-native-reanimated";
import { api } from "@/store/authStore";
import SwipeToComplete from "@/components/SwipeToComplete";
import SuccessOverlay from "@/components/SuccessOverlay";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const T = {
  bg: "#FFFFFF",
  surface: "#FFFFFF",
  primary: "#0A192F",
  primaryLight: "#F7F7F7",
  secondary: "#3B82F6",
  text: "#0F172A",
  textMuted: "#64748B",
  border: "#EBEBEB",
  success: "#00A699",
  successLight: "#D1FAE5",
  warning: "#FFB800",
  warningLight: "#FEF3C7",
  error: "#E31C5F",
  errorLight: "#FEE2E2",
};

const SHADOW = {};

// Pulsing Marker Animation Component
function PulsingMarker({ color = T.secondary, delay = 0, icon }: { color?: string, delay?: number, icon?: React.ReactNode }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        -1, // infinite
        true // reverse to create a smooth fade back
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: 1 + progress.value * 0.8 }], // Spread slightly
      opacity: 0.2 + (progress.value * 0.4), // Glow becomes brighter then fades back
    };
  });

  return (
    <View style={s.markerContainer}>
      <Reanimated.View style={[s.markerGlow, { backgroundColor: color }, animatedStyle]} />
      <View style={[s.markerCore, { backgroundColor: color }]}>
        {icon}
      </View>
    </View>
  );
}

export default function JobExecutionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const [jobData, setJobData] = useState<any>(null);
  const watchRef = useRef<any>(null);
  const mapRef = useRef<MapView>(null);
  const [sharingLocation, setSharingLocation] = useState(false);
  const [staffLocation, setStaffLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [pushingGps, setPushingGps] = useState(false);
  const [gpsLastPushed, setGpsLastPushed] = useState<string | null>(null);
  const [routeCoords, setRouteCoords] = useState<{latitude: number; longitude: number}[]>([]);
  const hasCenteredMap = useRef(false);
  const [autoFollow, setAutoFollow] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);

  // Smooth Marker Animation
  const staffCoordAnim = useRef(
    new AnimatedRegion({
      latitude: 0,
      longitude: 0,
      latitudeDelta: 0,
      longitudeDelta: 0,
    })
  ).current;

  // ── Real-time tracking (like Grab) ──
  useEffect(() => {
    let active = true;

    const startTracking = async () => {
      try {
        const { status: fgStatus } = await ExpoLocation.requestForegroundPermissionsAsync();
        if (fgStatus !== "granted") return;
        try { await ExpoLocation.requestBackgroundPermissionsAsync(); } catch {}

        if (!active) return;
        setSharingLocation(true);

        watchRef.current = await ExpoLocation.watchPositionAsync(
          {
            accuracy: ExpoLocation.Accuracy.High,
            timeInterval: 10000,
            distanceInterval: 5, // Only update if moved 5m to reduce jitter
            showsBackgroundLocationIndicator: true,
          } as any,
          async (loc) => {
            if (!active) return;
            
            // Ignore inaccurate location jumps (e.g., cell tower triangulation when screen is off)
            if (loc.coords.accuracy && loc.coords.accuracy > 100) {
              console.warn(`Ignoring inaccurate location, accuracy: ${loc.coords.accuracy}m`);
              return;
            }

            const lat = loc.coords.latitude;
            const lng = loc.coords.longitude;
            setStaffLocation({ lat, lng });

            // Animate Marker
            if ((staffCoordAnim as any).latitude._value === 0) {
              staffCoordAnim.setValue({ latitude: lat, longitude: lng, latitudeDelta: 0.01, longitudeDelta: 0.01 });
            } else {
              staffCoordAnim.timing({
                latitude: lat,
                longitude: lng,
                duration: 1000, // Sync with camera animation duration
                useNativeDriver: false,
              } as any).start();
            }

            try {
              await api.patch(`/api/location/${id}`, {
                lat,
                lng,
                accuracy: loc.coords.accuracy ?? undefined,
                heading: loc.coords.heading ?? undefined,
              });
            } catch {}
          }
        );
      } catch {}
    };

    if (id) startTracking();

    return () => {
      active = false;
      watchRef.current?.remove();
    };
  }, [id]);

  // ── Fetch job data ──
  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await api.get(`/api/bookings/${id}`);
        const data = res.data?.data?.booking || res.data?.booking || res.data?.data || res.data;
        setJobData(data);

        setChecklist([
          { id: 1, title: `Preparation for ${data?.service?.name || "Service"}`, completed: data?.progressPercent >= 33 },
          { id: 2, title: `Execution of ${data?.service?.name || "Service"}`, completed: data?.progressPercent >= 66 },
          { id: 3, title: "Final Cleanup & Quality Check", completed: data?.progressPercent >= 100 },
        ]);

        if (data?.actualStartTime) {
          const diffMs = Date.now() - new Date(data.actualStartTime).getTime();
          const totalSecs = Math.floor(diffMs / 1000);
          setTimeElapsed({
            hours: Math.floor(totalSecs / 3600),
            minutes: Math.floor((totalSecs % 3600) / 60),
            seconds: totalSecs % 60,
          });
        }
      } catch {}
    };
    if (id) fetchJob();
  }, [id]);

  const [timeElapsed, setTimeElapsed] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [checklist, setChecklist] = useState<any[]>([]);
  const [photos, setPhotos] = useState<{ before: string | null; after: string | null }>({ before: null, after: null });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // ── Timer ──
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed((prev) => {
        let { hours, minutes, seconds } = prev;
        seconds += 1;
        if (seconds === 60) { seconds = 0; minutes += 1; }
        if (minutes === 60) { minutes = 0; hours += 1; }
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ── Auto-fit Map to bounds ──
  useEffect(() => {
    if (mapRef.current && jobData?.latitude && jobData?.longitude && !hasCenteredMap.current) {
      const coords = [{ latitude: jobData.latitude, longitude: jobData.longitude }];
      if (staffLocation) {
        coords.push({ latitude: staffLocation.lat, longitude: staffLocation.lng });
      }
      setTimeout(() => {
        mapRef.current?.fitToCoordinates(coords, {
          edgePadding: { top: 120, right: 60, bottom: (SCREEN_HEIGHT * 0.5) + 60, left: 60 },
          animated: true,
        });
        hasCenteredMap.current = true;
      }, 500);
    }
  }, [jobData?.latitude, jobData?.longitude]); // Removed staffLocation to prevent re-firing

  // ── Auto-follow logic ──
  useEffect(() => {
    if (autoFollow && mapRef.current && staffLocation) {
      mapRef.current.animateCamera({
        center: { latitude: staffLocation.lat, longitude: staffLocation.lng },
        altitude: 2000,
        zoom: 16,
      }, { duration: 1000 });
    }
  }, [staffLocation, autoFollow]);

  // ── Fetch Driving Route ──
  useEffect(() => {
    const fetchRoute = async () => {
      if (jobData?.latitude && jobData?.longitude && staffLocation) {
        try {
          const url = `https://router.project-osrm.org/route/v1/driving/${staffLocation.lng},${staffLocation.lat};${jobData.longitude},${jobData.latitude}?overview=full&geometries=geojson`;
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
  }, [jobData?.latitude, jobData?.longitude, staffLocation?.lat, staffLocation?.lng]);

  const fmt = (n: number) => String(n).padStart(2, "0");

  // ── Manual GPS push ──
  const handlePushGpsNow = async () => {
    try {
      setPushingGps(true);
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location permission is required.");
        return;
      }
      const loc = await ExpoLocation.getCurrentPositionAsync({ accuracy: ExpoLocation.Accuracy.High });
      await api.patch(`/api/location/${id}`, {
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
        accuracy: loc.coords.accuracy ?? undefined,
      });
      const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setGpsLastPushed(now);
      Alert.alert("GPS Synced", "Location successfully pushed to server.");
    } catch {
      Alert.alert("Error", "Failed to push location.");
    } finally {
      setPushingGps(false);
    }
  };

  // ── Checklist ──
  const handleChecklistToggle = async (itemId: number) => {
    const updated = checklist.map((item) => item.id === itemId ? { ...item, completed: !item.completed } : item);
    setChecklist(updated);
    const progress = Math.round((updated.filter((i) => i.completed).length / updated.length) * 100);
    try { await api.patch(`/api/bookings/${id}/progress`, { progressPercent: progress }); } catch {}
  };

  const completedCount = checklist.filter((i) => i.completed).length;
  const progressPct = checklist.length > 0 ? Math.round((completedCount / checklist.length) * 100) : 0;

  // ── Photo Capture ──
  const pickImage = async (type: "before" | "after", useCamera: boolean) => {
    const perm = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission required", `Please allow ${useCamera ? "camera" : "photo library"} access.`);
      return;
    }
    const result = await (useCamera ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync)({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.75,
      allowsEditing: true,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setPhotos((prev) => ({ ...prev, [type]: asset.uri }));
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("file", { uri: asset.uri, type: "image/jpeg", name: `job_${type}_${Date.now()}.jpg` } as any);
      formData.append("bookingId", String(id));
      formData.append("photoType", type);
      await api.post("/api/bookings/photos", formData, { headers: { "Content-Type": "multipart/form-data" } });
    } catch {} finally { setUploadingPhoto(false); }
  };

  const handlePhotoCapture = (type: "before" | "after") => {
    Alert.alert(`${type === "before" ? "Before" : "After"} Photo`, "Choose source", [
      { text: "Camera", onPress: () => pickImage(type, true) },
      { text: "Photo Library", onPress: () => pickImage(type, false) },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  // ── Complete ──
  const handleComplete = async () => {
    try {
      await api.patch(`/api/bookings/${id}/complete`);
      setShowSuccess(true);
    } catch {
      Alert.alert("Error", "Could not complete job.");
    }
  };

  const handleSuccessFinish = () => {
    setShowSuccess(false);
    router.replace("/(staff)/(tabs)/dashboard");
  };

  // ── Draggable bottom sheet ──
  const EXPANDED_Y = 0;
  const COLLAPSED_Y = SCREEN_HEIGHT * 0.38;
  const panY = useRef(new Animated.Value(EXPANDED_Y)).current;
  const isExpanded = useRef(true);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 5,
      onPanResponderMove: (_, gs) => {
        const currentBase = isExpanded.current ? EXPANDED_Y : COLLAPSED_Y;
        const next = currentBase + gs.dy;
        if (next >= -20 && next <= COLLAPSED_Y + 40) {
          panY.setValue(next);
        }
      },
      onPanResponderRelease: (_, gs) => {
        const THRESHOLD = 60;
        if (isExpanded.current) {
          if (gs.dy > THRESHOLD) {
            isExpanded.current = false;
            Animated.spring(panY, { toValue: COLLAPSED_Y, useNativeDriver: true, speed: 20 }).start();
          } else {
            Animated.spring(panY, { toValue: EXPANDED_Y, useNativeDriver: true, speed: 20 }).start();
          }
        } else {
          if (gs.dy < -THRESHOLD) {
            isExpanded.current = true;
            Animated.spring(panY, { toValue: EXPANDED_Y, useNativeDriver: true, speed: 20 }).start();
          } else {
            Animated.spring(panY, { toValue: COLLAPSED_Y, useNativeDriver: true, speed: 20 }).start();
          }
        }
      },
    })
  ).current;

  return (
    <View style={s.root}>
      {/* ── Full Screen Map ── */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        onPanDrag={() => setAutoFollow(false)}
        initialRegion={
          jobData?.latitude && jobData?.longitude
            ? {
                latitude: jobData.latitude,
                longitude: jobData.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }
            : undefined
        }
        showsUserLocation={false}
      >
        {/* Destination Marker */}
        {jobData?.latitude && jobData?.longitude && (
          <Marker
            coordinate={{ latitude: jobData.latitude, longitude: jobData.longitude }}
            title="Destination"
            description={jobData.serviceAddress}
          >
            <PulsingMarker color={T.error} delay={0} />
          </Marker>
        )}
        
        {/* Staff Marker (Smooth Animated) */}
        {staffLocation && (
          <Marker.Animated
            coordinate={staffCoordAnim as any}
            title="You"
            description="Your current location"
          >
            <PulsingMarker color={T.secondary} delay={500} icon={<MaterialCommunityIcons name="car" size={14} color="#fff" />} />
          </Marker.Animated>
        )}

        {/* Tracking Line (Driving Route or straight fallback) */}
        {jobData?.latitude && jobData?.longitude && staffLocation && (
          <Polyline
            coordinates={
              routeCoords.length > 0 
                ? routeCoords 
                : [
                    { latitude: staffLocation.lat, longitude: staffLocation.lng },
                    { latitude: jobData.latitude, longitude: jobData.longitude },
                  ]
            }
            strokeColor={T.primary}
            strokeWidth={4}
            lineDashPattern={routeCoords.length > 0 ? undefined : [5, 5]}
          />
        )}
      </MapView>

      {/* ── Floating Top Navigation Banner ── */}
      <View style={[s.topNavContainer, { top: Math.max(insets.top, 16) }]} pointerEvents="box-none">
        <View style={s.topNavCard}>
          <TouchableOpacity onPress={() => router.back()} style={s.navBackBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={T.primary} />
          </TouchableOpacity>
          <View style={s.navInstructionBox}>
            <MaterialCommunityIcons name="arrow-up-bold" size={32} color={T.secondary} style={{ marginRight: 16 }} />
            <View>
              <Text style={s.navInstructionTitle}>Proceed to Destination</Text>
              <Text style={s.navDistanceText}>1.5 km</Text>
            </View>
          </View>
        </View>
        
        <View style={{ alignItems: 'flex-start', marginLeft: 16, marginTop: 8 }}>
          <View style={[s.gpsPill, sharingLocation ? s.gpsPillActive : s.gpsPillOff]}>
            <View style={[s.gpsDot, sharingLocation ? s.gpsDotActive : s.gpsDotOff]} />
            <Text style={[s.gpsPillText, { color: sharingLocation ? T.primary : T.textMuted }]}>
              {sharingLocation ? "Live Tracking" : "No GPS"}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Floating Action Buttons ── */}
      <Animated.View style={[s.floatingActions, { transform: [{ translateY: Animated.multiply(panY, 0.5) }] }]} pointerEvents="box-none">
        <TouchableOpacity
          onPress={() => {
            if (mapRef.current && staffLocation) {
              setAutoFollow(true);
              mapRef.current.animateCamera({
                center: { latitude: staffLocation.lat, longitude: staffLocation.lng },
                altitude: 2000,
                zoom: 16,
              }, { duration: 1000 });
            }
          }}
          style={s.mapActionBtn}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="crosshairs-gps" size={24} color={autoFollow ? T.primary : T.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            const lat = jobData?.latitude;
            const lng = jobData?.longitude;
            const addr = jobData?.serviceAddress;
            if (lat && lng) {
              const { Linking } = require('react-native');
              Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
            } else if (addr) {
              const { Linking } = require('react-native');
              Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`);
            }
          }}
          style={s.mapActionBtn}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="navigation-variant" size={24} color={T.primary} />
        </TouchableOpacity>

        <TouchableOpacity onPress={handlePushGpsNow} style={s.mapActionBtn} activeOpacity={0.85}>
          {pushingGps ? (
            <ActivityIndicator size="small" color={T.primary} />
          ) : (
            <MaterialCommunityIcons name="crosshairs-gps" size={24} color={T.primary} />
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* ── Bottom Control Panel ── */}
      <Animated.View 
        style={[
          s.bottomPanel, 
          { 
            paddingBottom: Math.max(insets.bottom, 16),
            transform: [{ translateY: panY }] 
          }
        ]}
      >
        <View {...panResponder.panHandlers}>
          <View style={s.panelHandleArea}>
            <View style={s.panelHandle} />
          </View>
          
          <View style={s.grabSheetHeader}>
            <View style={{ flex: 1 }}>
              <Text style={s.arriveText}>Arrive in</Text>
              <Text style={s.arriveTime}>12 min</Text>
              <Text style={s.arriveDistance}>1.5 km • {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
            </View>
            <Image
              source={{ uri: jobData?.customer?.avatarUrl || "https://ui-avatars.com/api/?name=" + encodeURIComponent(jobData?.customer?.fullName || "Customer") }}
              style={s.grabCustomerAvatar}
            />
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.panelScrollContent}>
          {/* Job Info */}
          <View style={s.jobInfoBlock}>
            <Text style={s.jobInfoTitle}>{jobData?.service?.name || "Service Task"}</Text>
            <Text style={s.jobInfoSub} numberOfLines={2}>{jobData?.serviceAddress || "No address provided"}</Text>
          </View>

          {/* Progress */}
          <View style={s.card}>
            <View style={s.progressHeader}>
              <Text style={s.cardLabel}>Task Checklist</Text>
              <Text style={s.progressCount}>{completedCount}/{checklist.length} Done</Text>
            </View>
            <View style={s.progressBarBg}>
              <View style={[s.progressBarFill, { width: `${progressPct}%` }]} />
            </View>
            <View style={s.checklistItems}>
              {checklist.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => handleChecklistToggle(item.id)}
                  style={[s.checklistItem, index < checklist.length - 1 && s.checklistItemBorder]}
                  activeOpacity={0.85}
                >
                  <View style={[s.checkbox, item.completed && s.checkboxDone]}>
                    {item.completed && <MaterialCommunityIcons name="check" size={14} color="#fff" />}
                  </View>
                  <Text style={[s.checklistText, item.completed && s.checklistTextDone]}>
                    {item.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Photos */}
          <View style={s.card}>
            <Text style={s.cardLabel}>Evidence Photos</Text>
            {uploadingPhoto && (
              <View style={s.uploadingBanner}>
                <ActivityIndicator size="small" color={T.primary} />
                <Text style={s.uploadingText}>Uploading photo...</Text>
              </View>
            )}
            <View style={s.photosRow}>
              {(["before", "after"] as const).map((type) => (
                <TouchableOpacity key={type} onPress={() => handlePhotoCapture(type)} style={s.photoSlot} activeOpacity={0.85}>
                  <View style={s.photoBox}>
                    {photos[type] ? (
                      <Image source={{ uri: photos[type]! }} style={s.photoImage} contentFit="cover" />
                    ) : (
                      <View style={s.photoEmpty}>
                        <MaterialCommunityIcons name="camera-plus-outline" size={28} color={T.textMuted} />
                        <Text style={s.photoEmptyText}>{type === "before" ? "Before" : "After"}</Text>
                      </View>
                    )}
                    {photos[type] && (
                      <View style={s.photoDoneTag}>
                        <MaterialCommunityIcons name="check" size={12} color="#fff" />
                        <Text style={s.photoDoneText}>{type.toUpperCase()}</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Signature / Client */}
          <View style={s.card}>
            <Text style={s.cardLabel}>Client Confirmation</Text>
            <View style={s.clientRow}>
              <Image
                source={{ uri: jobData?.customer?.avatarUrl || "https://ui-avatars.com/api/?name=" + encodeURIComponent(jobData?.customer?.fullName || "Customer") }}
                style={s.clientAvatar}
              />
              <View>
                <Text style={s.clientName}>{jobData?.customer?.fullName || "Customer"}</Text>
                <Text style={s.clientRole}>Authorized Signatory</Text>
              </View>
            </View>
          </View>
          
          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Complete Button */}
        <View style={s.completeWrap}>
          <SwipeToComplete onComplete={handleComplete} text="Slide to Complete" />
        </View>
      </Animated.View>

      <SuccessOverlay 
        visible={showSuccess} 
        onFinish={handleSuccessFinish} 
        message="Job Completed!" 
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  
  // Top Navigation Banner
  topNavContainer: { position: "absolute", left: 16, right: 16, zIndex: 10 },
  topNavCard: { flexDirection: "row", backgroundColor: T.surface, borderRadius: 24, borderWidth: 1, borderColor: T.border, overflow: "hidden", padding: 8 },
  navBackBtn: { padding: 16, justifyContent: "center", borderRightWidth: 1, borderRightColor: T.border, borderRadius: 24, backgroundColor: T.primaryLight },
  navInstructionBox: { flex: 1, flexDirection: "row", alignItems: "center", paddingLeft: 16 },
  navInstructionTitle: { fontSize: 14, color: T.textMuted, fontWeight: "700", marginBottom: 2, textTransform: "uppercase", letterSpacing: 0.5 },
  navDistanceText: { fontSize: 24, fontWeight: "800", color: T.primary },

  gpsPill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: T.surface, borderWidth: 1, borderColor: T.border },
  gpsPillActive: { borderColor: T.primaryLight, backgroundColor: T.primaryLight },
  gpsPillOff: { borderColor: T.border },
  gpsDot: { width: 8, height: 8, borderRadius: 4 },
  gpsDotActive: { backgroundColor: T.secondary },
  gpsDotOff: { backgroundColor: T.textMuted },
  gpsPillText: { fontSize: 12, fontWeight: "800" },
  
  floatingActions: { position: "absolute", right: 16, bottom: "45%", gap: 12, zIndex: 10 },
  mapActionBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: T.surface, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: T.border },

  // Bottom Panel
  bottomPanel: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: T.bg, borderTopLeftRadius: 32, borderTopRightRadius: 32,
    maxHeight: "80%", minHeight: "35%", borderWidth: 1, borderColor: T.border,
  },
  panelHandleArea: { paddingTop: 16, paddingBottom: 12, alignItems: "center" },
  panelHandle: { width: 48, height: 5, borderRadius: 3, backgroundColor: "#CBD5E1" },
  
  grabSheetHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 24, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: T.border,
  },
  arriveText: { fontSize: 13, fontWeight: "800", color: T.textMuted, marginBottom: 2, textTransform: "uppercase", letterSpacing: 1 },
  arriveTime: { fontSize: 32, fontWeight: "900", color: T.primary, marginBottom: 4 },
  arriveDistance: { fontSize: 14, color: T.textMuted, fontWeight: "600" },
  grabCustomerAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: T.border, borderWidth: 3, borderColor: T.primaryLight },

  panelScrollContent: { padding: 20, gap: 16 },

  jobInfoBlock: { marginBottom: 4, paddingHorizontal: 4 },
  jobInfoTitle: { fontSize: 22, fontWeight: "900", color: T.primary, marginBottom: 6 },
  jobInfoSub: { fontSize: 15, color: T.textMuted, lineHeight: 22, fontWeight: "500" },

  card: { backgroundColor: T.surface, borderRadius: 24, padding: 20,  },
  cardLabel: { fontSize: 12, fontWeight: "800", color: T.textMuted, textTransform: "uppercase", letterSpacing: 1.2 },

  progressHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  progressCount: { fontSize: 14, fontWeight: "800", color: T.secondary },
  progressBarBg: { height: 8, backgroundColor: T.primaryLight, borderRadius: 4 },
  progressBarFill: { height: 8, backgroundColor: T.success, borderRadius: 4 },
  checklistItems: { gap: 0 },
  checklistItem: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14 },
  checklistItemBorder: { borderBottomWidth: 1, borderBottomColor: T.border },
  checkbox: { width: 24, height: 24, borderRadius: 8, borderWidth: 2, borderColor: T.border, alignItems: "center", justifyContent: "center", backgroundColor: T.bg },
  checkboxDone: { backgroundColor: T.primary, borderColor: T.primary },
  checklistText: { flex: 1, fontSize: 16, color: T.text, fontWeight: "600" },
  checklistTextDone: { textDecorationLine: "line-through", color: T.textMuted },

  uploadingBanner: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: T.primaryLight, padding: 12, borderRadius: 16 },
  uploadingText: { fontSize: 14, color: T.primary, fontWeight: "700" },
  photosRow: { flexDirection: "row", gap: 16 },
  photoSlot: { flex: 1 },
  photoBox: { aspectRatio: 1, borderRadius: 16, overflow: "hidden", borderWidth: 2, borderColor: T.border, backgroundColor: T.bg, borderStyle: "dashed" },
  photoImage: { width: "100%", height: "100%" },
  photoEmpty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  photoEmptyText: { fontSize: 14, color: T.textMuted, fontWeight: "700" },
  photoDoneTag: { position: "absolute", top: 10, left: 10, backgroundColor: T.success, flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, borderWidth: 1, borderColor: T.border },
  photoDoneText: { fontSize: 11, fontWeight: "800", color: "#fff", letterSpacing: 0.5 },

  clientRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  clientAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: T.border },
  clientName: { fontSize: 17, fontWeight: "800", color: T.primary, marginBottom: 4 },
  clientRole: { fontSize: 14, color: T.textMuted, fontWeight: "600" },

  completeWrap: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: Platform.OS === 'ios' ? 20 : 16, backgroundColor: T.bg, borderTopWidth: 1, borderTopColor: T.border },
  completeBtn: {
    backgroundColor: T.primary, paddingVertical: 18, borderRadius: 20,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12,
  },
  completeBtnText: { fontSize: 18, fontWeight: "800", color: "#fff" },

  // Animated Marker Styles
  markerContainer: { width: 60, height: 60, alignItems: "center", justifyContent: "center" },
  markerGlow: { position: "absolute", width: 28, height: 28, borderRadius: 14 },
  markerCore: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: "#FFFFFF", alignItems: 'center', justifyContent: 'center' },
});
