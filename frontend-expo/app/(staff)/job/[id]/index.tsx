import React, { useState, useCallback, useEffect, useRef } from "react";
import { Image } from "expo-image";
import { ScrollView, Text, View, TouchableOpacity, Alert, ActivityIndicator, StyleSheet, Platform, Linking, Dimensions, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import MapView, { Marker, Polyline } from "react-native-maps";
import { MAP_PROVIDER } from "@/utils/mapHelper";
import MapViewDirections from 'react-native-maps-directions';
import * as Location from 'expo-location';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withDelay, Easing } from "react-native-reanimated";
import { api, useAuthStore } from "@/store/authStore";
import { useTranslation } from "react-i18next";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";

const { width } = Dimensions.get("window");

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
function PulsingMarker({ color = T.secondary, delay = 0 }) {
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
    <View style={s.markerContainer}>
      <Animated.View style={[s.markerGlow, { backgroundColor: color }, animatedStyle]} />
      <View style={[s.markerCore, { backgroundColor: color }]} />
    </View>
  );
}

export default function JobDetailScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const { id } = useLocalSearchParams();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [jobData, setJobData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [wallet, setWallet] = useState<number>(0);
  const [creditLimit, setCreditLimit] = useState<number>(0);
  const { location: hookLoc } = useCurrentLocation(true);
  const location = { coords: hookLoc };
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const fetchJob = async () => {
    try {
      const res = await api.get(`/api/bookings/${id}`);
      const data = res.data?.data?.booking || res.data?.booking || res.data?.data || res.data;
      setJobData(data);

      try {
        if (user?.staffProfile?.id) {
          const walletRes = await api.get("/api/wallets/staff/" + user.staffProfile.id);
          const walletData = walletRes.data?.data || walletRes.data || {};
          setWallet(Number(walletData.balance ?? walletData.walletBalance ?? 0));
          setCreditLimit(Number(walletData.creditLimit ?? 0));
        }
      } catch (e) {
        console.warn("Wallet data not available");
      }
    } catch (e) {
      console.error("Failed to fetch job details", e);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (id) fetchJob();
    }, [id])
  );

  const handleCall = () => {
    const phone = jobData?.customer?.phone;
    if (phone) Linking.openURL(`tel:${phone}`);
    else Alert.alert(t('staffBooking.callTitle'), t('staffBooking.callingName', { name: jobData?.customer?.fullName || '' }));
  };

  const handleMessage = async () => {
    try {
      const res = await api.post("/api/conversations", { 
        type: 'job',
        bookingId: id ? id.toString() : ''
      });
      const responseData = res.data?.data || res.data;
      const conversation = responseData?.data || responseData;
      router.push(`/(staff)/messages/${conversation.id}?otherName=${encodeURIComponent(jobData?.customer?.fullName || t('staffBooking.unknownCustomer'))}` as any);
    } catch (e) {
      Alert.alert(t('staffBooking.errorTitle'), t('staffBooking.couldNotStartConv'));
    }
  };

  const handleGetDirections = () => {
    const lat = jobData?.latitude;
    const lng = jobData?.longitude;
    const addr = jobData?.serviceAddress;
    if (lat && lng) Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
    else if (addr) Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`);
    else Alert.alert(t('staffBooking.noLocationTitle'), t('staffBooking.noAddressFound'));
  };

  const handleArrive = async () => {
    try {
      await api.patch(`/api/bookings/${id}/status`, { status: "arrived" });
      fetchJob();
    } catch (e: any) {
      Alert.alert(t('staffBooking.errorTitle'), "Could not update status to arrived");
    }
  };

  const handleStartJob = async () => {
    try {
      const payload: any = {};
      if (location) {
        payload.staffStartLatitude = location.coords.latitude;
        payload.staffStartLongitude = location.coords.longitude;
      }
      await api.patch(`/api/bookings/${id}/start`, payload);
      router.push(`/(staff)/job/${id}/execution` as any);
    } catch (e: any) {
      const msg = e.response?.data?.message || e.message || t('staffBooking.couldNotStartJob');
      Alert.alert(t('staffBooking.errorTitle'), msg);
    }
  };

  const handleCompleteJob = async () => {
    if (jobData?.status === "in_progress") {
      Alert.alert(t('staffBooking.completeJobTitle'), t('staffBooking.completeJobConfirm'), [
        { text: t('staffBooking.cancel'), style: "cancel" },
        {
          text: t('staffBooking.completeBtn'), onPress: async () => {
            try {
              await api.patch(`/api/bookings/${id}/complete`);
              Alert.alert(t('staffBooking.doneTitle'), t('staffBooking.jobMarkedComplete'));
              fetchJob();
            } catch (e) {
              Alert.alert(t('staffBooking.errorTitle'), t('staffBooking.couldNotCompleteJob'));
            }
          }
        }
      ]);
    }
  };

  if (isLoading || !jobData) {
    return (
      <SafeAreaView style={[s.root, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={T.primary} />
        <Text style={s.loadingText}>{t('staffBooking.loadingDetails')}</Text>
      </SafeAreaView>
    );
  }

  const isActionable = jobData.status === "confirmed" || jobData.status === "pending";
  const isArrived = jobData.status === "arrived";
  const isInProgress = jobData.status === "in_progress";
  const isCompleted = jobData.status === "completed";

  const statusColor = isCompleted ? T.success : isInProgress ? T.warning : T.primary;
  const statusBg = isCompleted ? T.successLight : isInProgress ? T.warningLight : T.primaryLight;

  const customerLat = jobData.latitude ? Number(jobData.latitude) : location.coords.latitude;
  const customerLng = jobData.longitude ? Number(jobData.longitude) : location.coords.longitude;
  const staffLat = jobData.staffStartLatitude ? Number(jobData.staffStartLatitude) : location.coords.latitude;
  const staffLng = jobData.staffStartLongitude ? Number(jobData.staffStartLongitude) : location.coords.longitude;

  const fitMapToRoute = () => {
    if (mapRef.current && staffLat && staffLng && customerLat && customerLng) {
      mapRef.current.fitToCoordinates(
        [
          { latitude: staffLat, longitude: staffLng },
          { latitude: customerLat, longitude: customerLng }
        ],
        {
          edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
          animated: true,
        }
      );
    }
  };

  return (
    <SafeAreaView style={s.root} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8} style={s.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={T.primary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{t('staffBooking.jobId', { id: jobData.id })}</Text>
        <TouchableOpacity activeOpacity={0.8} style={s.iconBtn}>
          <MaterialCommunityIcons name="help-circle-outline" size={24} color={T.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>

        {/* Action Buttons (Moved to top to prevent bottom nav overlap) */}
        <View style={s.actionContainer}>
          {isActionable && (
            <TouchableOpacity onPress={handleArrive} style={s.primaryBtn} activeOpacity={0.85}>
              <MaterialCommunityIcons name="map-marker-radius" size={24} color="#fff" />
              <Text style={s.primaryBtnText}>Arrive at Location</Text>
            </TouchableOpacity>
          )}
          {isArrived && (
            jobData.paymentMethod === 'cash' && wallet <= creditLimit ? (
              <View style={s.warningBanner}>
                <MaterialCommunityIcons name="alert-circle" size={20} color={T.error} />
                <Text style={s.warningText}>
                  {t('staffBooking.walletBalanceWarning')}
                </Text>
              </View>
            ) : (
              <TouchableOpacity onPress={handleStartJob} style={s.primaryBtn} activeOpacity={0.85}>
                <MaterialCommunityIcons name="play-circle" size={24} color="#fff" />
                <Text style={s.primaryBtnText}>{t('staffBooking.startJob')}</Text>
              </TouchableOpacity>
            )
          )}
          {isInProgress && (
            <>
              <TouchableOpacity onPress={() => router.push(`/(staff)/job/${id}/execution` as any)} style={s.primaryBtn} activeOpacity={0.85}>
                <MaterialCommunityIcons name="clipboard-text-play" size={24} color="#fff" />
                <Text style={s.primaryBtnText}>{t('staffBooking.continueExecution')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCompleteJob} style={s.secondaryBtn} activeOpacity={0.85}>
                <Text style={s.secondaryBtnText}>{t('staffBooking.markCompleted')}</Text>
              </TouchableOpacity>
            </>
          )}
          {isCompleted && (
            <View style={[s.primaryBtn, { backgroundColor: T.success }]}>
              <MaterialCommunityIcons name="check-decagram" size={24} color="#fff" />
              <Text style={s.primaryBtnText}>{t('staffBooking.jobCompletedSuccess')}</Text>
            </View>
          )}
        </View>

        {/* Hero Card */}
        <View style={s.card}>
          <View style={s.heroTop}>
            <View style={[s.statusBadge, { backgroundColor: statusBg }]}>
              <View style={[s.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[s.statusText, { color: statusColor }]}>{jobData.status?.replace("_", " ").toUpperCase()}</Text>
            </View>
            <Text style={s.heroPrice}>${Number(jobData.totalPrice || 0).toFixed(2)}</Text>
          </View>

          <View style={s.heroServiceRow}>
            <View style={s.heroServiceIcon}>
              <MaterialCommunityIcons name="briefcase-variant-outline" size={26} color={T.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.heroServiceName}>{jobData.service?.name || t('staffBooking.serviceTask')}</Text>
              <Text style={s.heroServiceCategory}>
                {jobData.service?.serviceType?.category?.name || t('staffBooking.service')}
                {jobData.service?.durationMin ? ` • ${jobData.service.durationMin}–${jobData.service.durationMax} mins` : ""}
              </Text>
            </View>
          </View>

          <View style={s.heroMeta}>
            <View style={s.heroMetaItem}>
              <MaterialCommunityIcons name="calendar-month" size={18} color={T.secondary} />
              <Text style={s.heroMetaText}>
                {new Date(jobData.bookingDate).toLocaleDateString(undefined, { weekday: "short", month: "long", day: "numeric" })}
              </Text>
            </View>
            <View style={s.heroMetaItem}>
              <MaterialCommunityIcons name="clock-outline" size={18} color={T.secondary} />
              <Text style={s.heroMetaText}>
                {new Date(jobData.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} –{" "}
                {new Date(jobData.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </Text>
            </View>
          </View>
        </View>

        {/* Customer Card */}
        <View style={s.card}>
          <Text style={s.cardLabel}>{t('staffBooking.clientDetails')}</Text>
          <View style={s.customerRow}>
            <Image
              source={{ uri: jobData.customer?.avatarUrl || "https://ui-avatars.com/api/?name=" + encodeURIComponent(jobData.customer?.fullName || "Customer") }}
              style={s.customerAvatar}
            />
            <View style={{ flex: 1 }}>
              <Text style={s.customerName}>{jobData.customer?.fullName || t('staffBooking.unknownCustomer')}</Text>
              <Text style={s.customerPhone}>{jobData.customer?.phone || t('staffBooking.noPhoneNumber')}</Text>
            </View>
            <View style={s.actionRow}>
              <TouchableOpacity onPress={handleMessage} style={s.circleBtn} activeOpacity={0.85}>
                <MaterialCommunityIcons name="message-text" size={20} color={T.secondary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCall} style={s.circleBtn} activeOpacity={0.85}>
                <MaterialCommunityIcons name="phone" size={20} color={T.success} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Location & Map Card */}
        <View style={[s.card, { padding: 0, overflow: "hidden" }]}>
          <View style={{ padding: 20 }}>
            <Text style={s.cardLabel}>{t('staffBooking.jobLocation')}</Text>
            <View style={s.locationTextRow}>
              <MaterialCommunityIcons name="map-marker-radius" size={22} color={T.error} style={{ marginTop: 2 }} />
              <Text style={s.locationText}>{jobData.serviceAddress || t('staffBooking.addressNotProvided')}</Text>
            </View>
          </View>
          
          <View style={s.mapContainer}>
            <MapView
              provider={MAP_PROVIDER}
              ref={mapRef}
              style={s.map}
              onMapReady={fitMapToRoute}
              onLayout={fitMapToRoute}
              initialRegion={{
                latitude: customerLat,
                longitude: customerLng,
                latitudeDelta: 0.008,
                longitudeDelta: 0.008,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
            >
              {/* Customer Marker */}
              <Marker coordinate={{ latitude: customerLat, longitude: customerLng }} title={t('staffBooking.jobLocation')}>
                <PulsingMarker color={T.error} delay={0} />
              </Marker>
              
              {/* Staff Marker */}
              {staffLat && staffLng && (
                <Marker coordinate={{ latitude: staffLat, longitude: staffLng }} title={t('staffBooking.yourLocation')}>
                  <PulsingMarker color={T.secondary} delay={500} />
                </Marker>
              )}

              {/* Connecting Line */}
              {staffLat && staffLng && (
                process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY && process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY !== 'AIza_placeholder_for_maps' ? (
                  <MapViewDirections
                    origin={{ latitude: staffLat, longitude: staffLng }}
                    destination={{ latitude: customerLat, longitude: customerLng }}
                    apikey={process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}
                    strokeWidth={2}
                    strokeColor={T.secondary}
                  />
                ) : (
                  <Polyline
                    coordinates={[
                      { latitude: staffLat, longitude: staffLng },
                      { latitude: customerLat, longitude: customerLng }
                    ]}
                    strokeColor={T.secondary}
                    strokeWidth={2}
                    lineDashPattern={[5, 5]}
                  />
                )
              )}
            </MapView>
            <View style={s.mapOverlay}>
              <TouchableOpacity onPress={handleGetDirections} style={s.directionsBtn} activeOpacity={0.9}>
                <MaterialCommunityIcons name="navigation-variant" size={20} color="#fff" />
                <Text style={s.directionsBtnText}>{t('staffBooking.getDirections')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Proof of Work */}
        {jobData.proofOfWorkPhoto && (
          <View style={s.card}>
            <Text style={s.cardLabel}>PROOF OF WORK</Text>
            <TouchableOpacity activeOpacity={0.8} onPress={() => setPhotoModalVisible(true)}>
              <Image
                source={{ uri: jobData.proofOfWorkPhoto }}
                style={{ width: '100%', height: 220, borderRadius: 16 }}
                contentFit="cover"
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Payment Summary */}
        {jobData.payment && (
          <View style={s.card}>
            <Text style={s.cardLabel}>{t('staffBooking.paymentSummary')}</Text>
            <View style={s.paymentGrid}>
              <View style={s.paymentCol}>
                <Text style={s.paymentLabel}>{t('staffBooking.method')}</Text>
                <Text style={s.paymentValue}>{jobData.payment.method?.toUpperCase() || "—"}</Text>
              </View>
              <View style={s.paymentCol}>
                <Text style={s.paymentLabel}>{t('staffBooking.status')}</Text>
                <Text style={[s.paymentValue, { color: jobData.payment.status === "paid" ? T.success : T.warning }]}>
                  {jobData.payment.status?.toUpperCase() || "—"}
                </Text>
              </View>
              <View style={s.paymentCol}>
                <Text style={s.paymentLabel}>{t('staffBooking.yourPay')}</Text>
                <Text style={[s.paymentValue, { color: T.primary, fontSize: 18 }]}>${Number(jobData.staffEarnings || 0).toFixed(2)}</Text>
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Full Screen Photo Modal */}
      <Modal visible={photoModalVisible} transparent={true} animationType="fade">
        <View style={s.modalBackground}>
          <TouchableOpacity style={s.modalCloseBtn} onPress={() => setPhotoModalVisible(false)}>
            <MaterialCommunityIcons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          {jobData?.proofOfWorkPhoto && (
            <Image
              source={{ uri: jobData.proofOfWorkPhoto }}
              style={s.modalImage}
              contentFit="contain"
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  loadingText: { marginTop: 12, fontSize: 15, color: T.textMuted, fontWeight: "600" },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: T.bg,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: T.surface, alignItems: "center", justifyContent: "center" },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: T.surface, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: T.text },

  content: { padding: 16, gap: 16 },

  card: { backgroundColor: T.surface, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: T.border },
  cardLabel: { fontSize: 12, fontWeight: "800", color: T.textMuted, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 16 },

  // Hero Card
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 24 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },
  heroPrice: { fontSize: 28, fontWeight: "900", color: T.primary },

  heroServiceRow: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 20 },
  heroServiceIcon: { width: 56, height: 56, borderRadius: 16, backgroundColor: T.primaryLight, alignItems: "center", justifyContent: "center" },
  heroServiceName: { fontSize: 18, fontWeight: "800", color: T.text, marginBottom: 4 },
  heroServiceCategory: { fontSize: 14, color: T.textMuted, fontWeight: "600" },

  heroMeta: { gap: 12, backgroundColor: T.bg, padding: 16, borderRadius: 16 },
  heroMetaItem: { flexDirection: "row", alignItems: "center", gap: 10 },
  heroMetaText: { fontSize: 14, fontWeight: "600", color: T.text },

  // Customer
  customerRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  customerAvatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: T.border },
  customerName: { fontSize: 18, fontWeight: "800", color: T.primary, marginBottom: 4 },
  customerPhone: { fontSize: 14, color: T.textMuted, fontWeight: "600" },

  actionRow: { flexDirection: "row", gap: 8 },
  circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: T.bg, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: T.border },

  // Location
  locationTextRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  locationText: { flex: 1, fontSize: 16, fontWeight: "600", color: T.text, lineHeight: 24 },
  mapContainer: { width: "100%", height: 220, position: "relative" },
  map: { width: "100%", height: "100%" },
  mapOverlay: { position: "absolute", bottom: 16, left: 0, right: 0, alignItems: "center" },
  directionsBtn: {
    backgroundColor: T.primary, flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 24, paddingVertical: 14, borderRadius: 30,
  },
  directionsBtnText: { fontSize: 15, fontWeight: "800", color: "#fff" },

  // Payment
  paymentGrid: { flexDirection: "row", justifyContent: "space-between" },
  paymentCol: { flex: 1, alignItems: "flex-start" },
  paymentLabel: { fontSize: 11, fontWeight: "700", color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  paymentValue: { fontSize: 16, fontWeight: "800", color: T.text },

  // Modal
  modalBackground: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  modalCloseBtn: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 8 },
  modalImage: { width: '100%', height: '80%' },

  // Action Container at the top
  actionContainer: { gap: 12, marginBottom: 8 },
  primaryBtn: { backgroundColor: T.primary, paddingVertical: 16, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  secondaryBtn: { backgroundColor: T.primaryLight, paddingVertical: 16, borderRadius: 16, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: T.border },
  secondaryBtnText: { color: T.primary, fontSize: 16, fontWeight: "700" },
  warningBanner: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: T.errorLight, padding: 16, borderRadius: 16 },
  warningText: { flex: 1, color: T.error, fontSize: 14, fontWeight: "600", lineHeight: 20 },

  // Animated Marker Styles
  markerContainer: { width: 50, height: 50, alignItems: "center", justifyContent: "center" },
  markerGlow: { position: "absolute", width: 24, height: 24, borderRadius: 12 },
  markerCore: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: "#FFFFFF" },
});
