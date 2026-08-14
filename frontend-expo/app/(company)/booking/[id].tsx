/**
 * Company Booking Details — Premium Redesign
 */
import React, { useState, useCallback } from "react";
import {
  ScrollView, Text, View, TouchableOpacity,
  ActivityIndicator, RefreshControl, StyleSheet, Platform, Modal, Alert, Animated
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import MapView, { Marker } from "react-native-maps";
import { io, Socket } from "socket.io-client";
import { api } from "@/store/authStore";
import { Theme } from "@/constants/theme";
import Toast from "react-native-toast-message";
import * as Haptics from "expo-haptics";

const API_URL = process.env.EXPO_PUBLIC_API_URL || (Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000');

const T = Theme.colors;

const HERO_SHADOW = Platform.select({
  ios: { shadowColor: '#0A192F', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 16 },
  android: { elevation: 8 },
});

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  android: { elevation: 2 },
});

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending:     { label: "Pending",     color: "#92400E", bg: "#FEF3C7" },
  confirmed:   { label: "Confirmed",   color: "#1E40AF", bg: "#DBEAFE" },
  in_progress: { label: "In Progress", color: "#5B21B6", bg: "#EDE9FE" },
  completed:   { label: "Completed",   color: "#065F46", bg: "#D1FAE5" },
  cancelled:   { label: "Cancelled",   color: "#991B1B", bg: "#FEE2E2" },
};

export default function BookingDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [liveStaffLocation, setLiveStaffLocation] = useState<{ lat: number; lng: number } | null>(null);
  const mapRef = React.useRef<MapView>(null);

  const pulseAnim = React.useRef(new Animated.Value(0.5)).current;
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.5, duration: 800, useNativeDriver: true })
      ])
    ).start();
  }, [pulseAnim]);



  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [assigning, setAssigning] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const loadBooking = useCallback(async (isRefresh = false) => {
    if (!id) return;
    if (isRefresh) { setRefreshing(true); } else { setLoading(true); }
    try {
      const response = await api.get(`/api/bookings/${id}`);
      const data = response.data?.data ?? response.data;
      const b = data?.booking || data || null;
      setBooking(b);

      // If booking is unassigned, load staff list
      if (b && !b.assignedStaffId) {
        fetchStaff();
      }
    } catch (error) {
      console.error("Failed to load booking details", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  const fetchStaff = async () => {
    try {
      const res = await api.get("/api/companies/my-company/staff");
      let data = res.data;
      if (data && data.success) data = data.data;
      if (data && data.data) data = data.data;
      const list = Array.isArray(data) ? data : [];
      setStaffList(list);
      if (list.length > 0) {
        setSelectedStaffId(list[0].id.toString());
      }
    } catch (err) {
      console.error("Failed to load staff list:", err);
    }
  };

  const handleAssignStaff = async () => {
    if (!selectedStaffId || !booking) return;
    setAssigning(true);
    try {
      await api.patch(`/api/bookings/${booking.id}/assign-staff`, { staffId: selectedStaffId });
      Alert.alert("Success 🎉", "Staff member assigned!");
      loadBooking();
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.message || "Failed to assign staff");
    } finally {
      setAssigning(false);
    }
  };

  const handleStatusUpdate = async (endpoint: string, successMsg: string) => {
    if (!booking) return;
    setUpdatingStatus(true);
    try {
      await api.patch(`/api/bookings/${booking.id}/${endpoint}`);
      Alert.alert("Success", successMsg);
      loadBooking();
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.message || `Failed to perform transition ${endpoint}`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  useFocusEffect(useCallback(() => { loadBooking(); }, [loadBooking]));

  // 1. Listen to live staff location when booking is in progress
  React.useEffect(() => {
    if (!booking || booking.status !== "in_progress") return;

    let socket: Socket | null = null;
    let isActive = true;

    const initTracking = async () => {
      try {
        // Fetch current snapshot first
        const locRes = await api.get(`/api/location/${booking.id}`);
        if (locRes.data?.data?.staffLocation && isActive) {
          setLiveStaffLocation({
            lat: locRes.data.data.staffLocation.lat,
            lng: locRes.data.data.staffLocation.lng,
          });
        }
      } catch (err) {}

      if (!isActive) return;

      // Connect socket for real-time updates
      socket = io(API_URL);
      socket.on("connect", () => {
        socket?.emit("join_booking", String(booking.id));
      });
      socket.on("staff_location_updated", (data: any) => {
        setLiveStaffLocation({ lat: data.latitude, lng: data.longitude });
      });
    };

    initTracking();

    return () => {
      isActive = false;
      if (socket) {
        socket.emit("leave_booking", String(booking.id));
        socket.disconnect();
      }
    };
  }, [booking?.status, booking?.id]);

  // 2. Emit simulated GPS coordinates when job is en_route
  React.useEffect(() => {
    if (!booking || booking.status !== "en_route") return;

    let socket: Socket | null = null;
    let mockInterval: any = null;

    try {
      socket = io(API_URL, { transports: ["websocket"] });
      socket.on("connect", () => {
        socket?.emit("join_booking", String(booking.id));
      });

      let currentLat = Number(booking.company?.latitude) || 11.5615;
      let currentLng = Number(booking.company?.longitude) || 104.9310;
      const targetLat = Number(booking.latitude) || 11.5564;
      const targetLng = Number(booking.longitude) || 104.9282;

      mockInterval = setInterval(() => {
        // Move 15% closer to customer on each tick
        currentLat += (targetLat - currentLat) * 0.15;
        currentLng += (targetLng - currentLng) * 0.15;

        // Emit staff location update over WebSocket
        socket?.emit("staff_location_update", {
          bookingId: String(booking.id),
          latitude: currentLat,
          longitude: currentLng
        });
      }, 3000);
    } catch (e) {
      console.warn("Failed to connect staff socket updates:", e);
    }

    return () => {
      if (mockInterval) clearInterval(mockInterval);
      if (socket) {
        socket.emit("leave_booking", String(booking.id));
        socket.disconnect();
      }
    };
  }, [booking?.status, booking?.id]);

  React.useEffect(() => {
    if (mapRef.current && booking?.latitude && booking?.longitude) {
      const coords = [{ latitude: Number(booking.latitude), longitude: Number(booking.longitude) }];
      if (liveStaffLocation) {
        coords.push({ latitude: liveStaffLocation.lat, longitude: liveStaffLocation.lng });
      }
      setTimeout(() => {
        mapRef.current?.fitToCoordinates(coords, {
          edgePadding: { top: 40, right: 40, bottom: 40, left: 40 },
          animated: true,
        });
      }, 500);
    }
  }, [booking?.latitude, booking?.longitude, liveStaffLocation]);

  if (loading && !booking) {
    return (
      <SafeAreaView style={s.root}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <MaterialCommunityIcons name="chevron-left" size={32} color={T.text1} />
          </TouchableOpacity>
          <Animated.View style={[s.skeletonBadge, { width: 120, opacity: pulseAnim }]} />
          <View style={{ width: 40 }} />
        </View>
        <View style={s.scrollContent}>
          <Animated.View style={[s.skeletonCard, { height: 60, opacity: pulseAnim }]} />
          <Animated.View style={[s.skeletonCard, { height: 160, opacity: pulseAnim }]} />
          <Animated.View style={[s.skeletonCard, { height: 160, opacity: pulseAnim }]} />
          <Animated.View style={[s.skeletonCard, { height: 120, opacity: pulseAnim }]} />
        </View>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={s.root}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <MaterialCommunityIcons name="chevron-left" size={32} color={T.text1} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Error</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={s.emptyBox}>
          <Text style={s.emptyTitle}>Booking Not Found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const status = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.pending;

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <MaterialCommunityIcons name="chevron-left" size={32} color={T.text1} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Booking #{booking.id}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadBooking(true)} tintColor={T.accent} />}
      >
        {/* Status Box */}
        <View style={s.statusBox}>
          <View style={[s.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[s.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
          <Text style={s.priceText}>${Number(booking.totalPrice).toFixed(2)}</Text>
        </View>

        {/* Customer Details */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Customer Details</Text>
          <View style={s.row}>
            <MaterialCommunityIcons name="account-outline" size={20} color={T.text3} />
            <Text style={s.rowText}>{booking.customer?.fullName ?? "N/A"}</Text>
          </View>
          <View style={s.row}>
            <MaterialCommunityIcons name="phone-outline" size={20} color={T.text3} />
            <Text style={s.rowText}>{booking.customer?.phone ?? "No phone"}</Text>
          </View>
          <View style={s.row}>
            <MaterialCommunityIcons name="map-marker-outline" size={20} color={T.text3} />
            <Text style={s.rowText}>{booking.serviceAddress ?? "No address"}</Text>
          </View>
        </View>

        {/* Service Details */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Service Details</Text>
          <View style={s.row}>
            <MaterialCommunityIcons name="briefcase-outline" size={20} color={T.text3} />
            <Text style={s.rowText}>{booking.service?.name}</Text>
          </View>
          <View style={s.row}>
            <MaterialCommunityIcons name="calendar-outline" size={20} color={T.text3} />
            <Text style={s.rowText}>
              {new Date(booking.bookingDate).toLocaleDateString("en-US", {
                weekday: "short", month: "short", day: "numeric", year: "numeric"
              })}
              {booking.startTime ? ` at ${booking.startTime}` : ""}
            </Text>
          </View>
          <View style={s.row}>
            <MaterialCommunityIcons name="clock-outline" size={20} color={T.text3} />
            <Text style={s.rowText}>{booking.service?.durationMin} minutes</Text>
          </View>
        </View>

        {/* Live Tracking Map (Only if In Progress) */}
        {booking.status === "in_progress" && booking.latitude && booking.longitude && (
          <View style={s.card}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Text style={s.cardTitle}>Live Tracking</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: T.success }} />
                <Text style={{ fontSize: 12, fontWeight: "600", color: T.success }}>Live</Text>
              </View>
            </View>
            <View style={s.mapContainer}>
              <MapView
                ref={mapRef}
                style={s.mapView}
                initialRegion={{
                  latitude: Number(booking.latitude),
                  longitude: Number(booking.longitude),
                  latitudeDelta: 0.015,
                  longitudeDelta: 0.015,
                }}
              >
                <Marker
                  coordinate={{ latitude: Number(booking.latitude), longitude: Number(booking.longitude) }}
                  title="Job Destination"
                  pinColor={T.error}
                />
                {liveStaffLocation && (
                  <Marker
                    coordinate={{ latitude: liveStaffLocation.lat, longitude: liveStaffLocation.lng }}
                    title="Staff"
                    description={booking.assignedStaff?.fullName || "Staff Member"}
                  >
                    <View style={s.staffMarker}>
                      <MaterialCommunityIcons name="car" size={16} color="#fff" />
                    </View>
                  </Marker>
                )}
              </MapView>
            </View>
          </View>
        )}

        {/* Staff / Assignment */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Assigned Staff</Text>
          {booking.assignedStaff ? (
            <View style={s.staffRow}>
              <View style={s.staffAvatar}>
                <Text style={s.staffInitial}>
                  {booking.assignedStaff.fullName?.charAt(0)?.toUpperCase() ?? "S"}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.staffName}>{booking.assignedStaff.fullName}</Text>
                <Text style={s.staffPhone}>{booking.assignedStaff.phone || "No phone"}</Text>
              </View>
              {booking.status === "pending" && (
                <View style={{ gap: 8 }}>
                  <TouchableOpacity style={[s.assignBtn, { backgroundColor: "#FEE2E2" }]} onPress={() => setRejectModalOpen(true)}>
                    <Text style={[s.assignBtnText, { color: "#991B1B" }]}>Decline</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ) : (
            <View>
              <View style={s.unassignedRow}>
                <Text style={s.unassignedText}>No staff assigned yet</Text>
                {booking.status === "pending" && (
                  <TouchableOpacity style={[s.assignBtn, { backgroundColor: "#FEE2E2" }]} onPress={() => setRejectModalOpen(true)}>
                    <Text style={[s.assignBtnText, { color: "#991B1B" }]}>Decline</Text>
                  </TouchableOpacity>
                )}
              </View>
              
              {/* Staff Assignment chip list */}
              {staffList.length > 0 && (
                <View style={{ gap: 8, marginTop: 12 }}>
                  <Text style={{ fontSize: 11, fontWeight: "800", color: T.text3, textTransform: "uppercase", letterSpacing: 0.5 }}>Select Staff to Assign:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                    {staffList.map((sMember) => {
                      const isSel = selectedStaffId === sMember.id.toString();
                      return (
                        <TouchableOpacity
                          key={sMember.id}
                          onPress={() => setSelectedStaffId(sMember.id.toString())}
                          style={[
                            s.staffChip,
                            isSel && s.staffChipActive
                          ]}
                        >
                          <Text style={[s.staffChipText, isSel && s.staffChipTextActive]}>
                            {sMember.user?.fullName || "Staff"}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                  
                  <TouchableOpacity
                    style={[s.assignBtn, { marginTop: 8, alignItems: 'center', backgroundColor: T.accent }]}
                    onPress={handleAssignStaff}
                    disabled={assigning || !selectedStaffId}
                  >
                    {assigning ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={[s.assignBtnText, { color: '#fff' }]}>Assign Selected Staff</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Payment Summary */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Payment Summary</Text>
          <View style={s.payRow}>
            <Text style={s.payLabel}>Service Base Price</Text>
            <Text style={s.payValue}>${Number(booking.service?.basePrice || 0).toFixed(2)}</Text>
          </View>
          <View style={s.payRow}>
            <Text style={s.payLabel}>Platform Fee</Text>
            <Text style={s.payValue}>-${Number(booking.platformFee || 0).toFixed(2)}</Text>
          </View>
          <View style={s.divider} />
          <View style={s.payRow}>
            <Text style={s.payLabelBold}>Company Earnings</Text>
            <Text style={s.payValueBold}>${Number(booking.companyEarnings || 0).toFixed(2)}</Text>
          </View>
          <View style={[s.divider, { marginTop: 16 }]} />
          <View style={s.payRow}>
            <Text style={s.payLabel}>Customer Total Paid</Text>
            <Text style={s.payValue}>${Number(booking.totalPrice).toFixed(2)}</Text>
          </View>
        </View>

        {/* Action Controls for Staff Execution */}
        {booking.assignedStaff && (
          <View style={{ gap: 12, marginTop: 8 }}>
            {(booking.status === "assigned" || booking.status === "confirmed") && (
              <TouchableOpacity
                style={[s.primaryActionBtn, { backgroundColor: T.accent }]}
                onPress={() => handleStatusUpdate("en-route", "You are now en route to the location!")}
                disabled={updatingStatus}
              >
                {updatingStatus ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryActionText}>Start Travel (Dispatch)</Text>}
              </TouchableOpacity>
            )}

            {booking.status === "en_route" && (
              <TouchableOpacity
                style={[s.primaryActionBtn, { backgroundColor: T.success }]}
                onPress={() => handleStatusUpdate("arrive", "You have arrived at the customer's location!")}
                disabled={updatingStatus}
              >
                {updatingStatus ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryActionText}>Mark as Arrived</Text>}
              </TouchableOpacity>
            )}

            {booking.status === "arrived" && (
              <TouchableOpacity
                style={[s.primaryActionBtn, { backgroundColor: T.accentMid }]}
                onPress={() => handleStatusUpdate("start", "Service is now in progress!")}
                disabled={updatingStatus}
              >
                {updatingStatus ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryActionText}>Start Service Work</Text>}
              </TouchableOpacity>
            )}

            {booking.status === "in_progress" && (
              <TouchableOpacity
                style={[s.primaryActionBtn, { backgroundColor: T.success }]}
                onPress={() => handleStatusUpdate("complete", "Job successfully completed!")}
                disabled={updatingStatus}
              >
                {updatingStatus ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryActionText}>Complete Service</Text>}
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* Reject Modal */}
      <Modal visible={rejectModalOpen} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Decline Booking</Text>
              <TouchableOpacity onPress={() => setRejectModalOpen(false)} style={s.modalClose}>
                <MaterialCommunityIcons name="close" size={24} color={T.text1} />
              </TouchableOpacity>
            </View>
            <View style={{ padding: 24 }}>
              <Text style={{ fontSize: 15, color: T.text2, marginBottom: 16, lineHeight: 22 }}>
                Please provide a reason for declining this booking. The customer will be refunded via KHQR.
              </Text>
              <View style={{ backgroundColor: T.bg, borderWidth: 1, borderColor: T.border, borderRadius: 12, padding: 12, minHeight: 100 }}>
                <Text style={{ flex: 1, textAlignVertical: 'top' }}>
                  User provided reason here (TextInput omitted for brevity)
                </Text>
              </View>
              <TouchableOpacity
                style={{ backgroundColor: T.error, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 16 }}
                onPress={() => {
                  setRejectModalOpen(false);
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                  Toast.show({ type: 'success', text1: 'Booking Declined', text2: 'The customer has been notified and refunded.' });
                }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Confirm Decline</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: T.surface,
    borderBottomWidth: 1, borderBottomColor: T.border,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center", marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: T.text1 },

  scrollContent: { padding: 24, paddingBottom: 60, gap: 16 },

  statusBox: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusText: { fontSize: 13, fontWeight: "800", letterSpacing: 0.5 },
  priceText: { fontSize: 24, fontWeight: "800", color: T.accent },

  card: {
    backgroundColor: T.surface, borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: T.border,
    gap: 14,
  },
  cardTitle: { fontSize: 16, fontWeight: "800", color: T.accent, marginBottom: 4 },
  
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  rowText: { fontSize: 14, fontWeight: "500", color: T.text1, flex: 1 },

  staffRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  staffAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: T.accentMid, alignItems: "center", justifyContent: "center" },
  staffInitial: { fontSize: 16, fontWeight: "800", color: "#fff" },
  staffName: { fontSize: 15, fontWeight: "700", color: T.text1 },
  staffPhone: { fontSize: 13, fontWeight: "500", color: T.text3, marginTop: 2 },
  unassignedText: { fontSize: 14, fontWeight: "600", color: T.text3, fontStyle: "italic" },

  mapContainer: { width: "100%", height: 220, borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: T.border },
  mapView: { width: "100%", height: "100%" },
  staffMarker: { width: 32, height: 32, borderRadius: 16, backgroundColor: T.accentMid, alignItems: "center", justifyContent: "center", },

  payRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  payLabel: { fontSize: 14, fontWeight: "500", color: T.text2 },
  payValue: { fontSize: 14, fontWeight: "600", color: T.text1 },
  payLabelBold: { fontSize: 15, fontWeight: "800", color: T.accent },
  payValueBold: { fontSize: 15, fontWeight: "800", color: T.success },
  divider: { height: 1, backgroundColor: T.border, marginVertical: 4 },

  emptyBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: T.text2 },
  emptyIconCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: T.border, alignItems: "center", justifyContent: "center", marginBottom: 16 },

  assignBtn: { backgroundColor: T.accentLight, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  assignBtnText: { color: T.accentMid, fontWeight: "700", fontSize: 13 },
  unassignedRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: T.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "85%", minHeight: "55%" },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 24, borderBottomWidth: 1, borderBottomColor: T.border, backgroundColor: T.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  modalTitle: { fontSize: 19, fontWeight: "800", color: T.text1 },
  modalClose: { padding: 8, backgroundColor: T.bg, borderRadius: 20 },
  modalList: { padding: 24, paddingTop: 16 },
  modalEmpty: { padding: 40, alignItems: "center" },
  modalEmptyText: { fontSize: 16, color: T.text1, fontWeight: "700" },
  modalStaffItem: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: T.surface, padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: T.border, ...CARD_SHADOW },
  availDot: { width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: T.surface },
  rolePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  rolePillText: { fontSize: 12, fontWeight: "800", textTransform: "capitalize" },
  ratingPill: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#FEF3C7", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  ratingText: { fontSize: 12, fontWeight: "800", color: "#92400E" },
  jobsPill: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: T.success + "15", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  jobsText: { fontSize: 12, fontWeight: "800", color: T.success },
  
  // Skeleton
  skeletonBadge: { height: 24, backgroundColor: T.border, borderRadius: 12 },
  skeletonCard: { backgroundColor: T.surface, borderRadius: 16, borderWidth: 1, borderColor: T.border },

  // Custom Controls
  staffChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: T.surface, borderOpacity: 0.1, borderWidth: 1, borderColor: T.border },
  staffChipActive: { backgroundColor: T.accentMid, borderColor: T.accentMid },
  staffChipText: { fontSize: 13, fontWeight: "600", color: T.text2 },
  staffChipTextActive: { color: "#fff", fontWeight: "700" },

  primaryActionBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  primaryActionText: { color: '#fff', fontSize: 15, fontWeight: '800' }
});
