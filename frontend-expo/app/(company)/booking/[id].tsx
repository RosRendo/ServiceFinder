/**
 * Company Booking Details — Executive Command Redesign
 * Feature: specs/009-company-cockpit-redesign
 */
import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  ScrollView, Text, View, TouchableOpacity,
  ActivityIndicator, RefreshControl, StyleSheet, Platform, Alert, Animated, Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import MapView, { Marker } from "react-native-maps";
import { io, Socket } from "socket.io-client";
import { api } from "@/store/authStore";
import Toast from "react-native-toast-message";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";
import { API_URL } from "@/lib/apiConfig";
import { VisualMilestoneStepper, JobMilestoneKey } from "@/components/jobs/VisualMilestoneStepper";
import { MobileStatusPill } from "@/components/admin/ManagementCard";
import AssignStaffModal from "@/app/(company)/operations/AssignStaffModal";

export default function BookingDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { location: currentLoc } = useCurrentLocation(true);
  const [liveStaffLocation, setLiveStaffLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const mapRef = useRef<MapView>(null);

  const pulseAnim = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.5, duration: 800, useNativeDriver: true })
      ])
    ).start();
  }, [pulseAnim]);

  const loadBooking = useCallback(async (isRefresh = false) => {
    if (!id) return;
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const response = await api.get(`/api/bookings/${id}`);
      const data = response.data?.data ?? response.data;
      setBooking(data?.booking || data || null);
    } catch (error) {
      console.error("Failed to load booking details", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useFocusEffect(useCallback(() => { loadBooking(); }, [loadBooking]));

  // Live Socket Tracking
  useEffect(() => {
    if (!booking || (booking.status !== "in_progress" && booking.status !== "en_route")) return;

    let socket: Socket | null = null;
    let isActive = true;

    const initTracking = async () => {
      try {
        const locRes = await api.get(`/api/location/${booking.id}`);
        if (locRes.data?.data?.staffLocation && isActive) {
          setLiveStaffLocation({
            lat: locRes.data.data.staffLocation.lat,
            lng: locRes.data.data.staffLocation.lng,
          });
        }
      } catch {}

      if (!isActive) return;

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

  useEffect(() => {
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

  const handleAccept = async () => {
    try {
      await api.patch(`/api/bookings/${booking.id}/status`, { status: "confirmed" });
      Toast.show({ type: "success", text1: "Booking Accepted", text2: "Customer notified." });
      setAssignModalOpen(true);
      loadBooking(true);
    } catch {
      Toast.show({ type: "error", text1: "Error", text2: "Failed to accept booking." });
    }
  };

  const handleDecline = () => {
    Alert.alert("Decline Booking", "Release this booking back to the dispatch pool?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Decline",
        style: "destructive",
        onPress: async () => {
          try {
            await api.patch(`/api/bookings/${booking.id}/status`, { status: "cancelled" });
            Toast.show({ type: "info", text1: "Booking Declined", text2: "Customer notified." });
            loadBooking(true);
          } catch {
            Toast.show({ type: "error", text1: "Error", text2: "Failed to decline booking." });
          }
        },
      },
    ]);
  };

  if (loading && !booking) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#0A192F" />
          <Text style={styles.loadingText}>Loading Booking Command...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <MaterialCommunityIcons name="chevron-left" size={28} color="#0A192F" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Error</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>Booking Not Found</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Derive Milestone Stage
  let milestoneStage: JobMilestoneKey = "EN_ROUTE";
  let completedStages: JobMilestoneKey[] = [];
  if (booking.status === "en_route") {
    milestoneStage = "EN_ROUTE";
    completedStages = [];
  } else if (booking.status === "in_progress") {
    milestoneStage = "WORKING";
    completedStages = ["EN_ROUTE", "ARRIVED"];
  } else if (booking.status === "completed") {
    milestoneStage = "COMPLETED";
    completedStages = ["EN_ROUTE", "ARRIVED", "WORKING"];
  }

  const isPending = booking.status === "pending";
  const customerPhone = booking.customer?.phone;
  const staffPhone = booking.assignedStaff?.phone || booking.assignedStaff?.user?.phone;
  const destinationLat = Number(booking.latitude) || 11.5564;
  const destinationLng = Number(booking.longitude) || 104.9282;

  return (
    <SafeAreaView style={styles.root} edges={["top", "left", "right"]}>
      {/* Executive Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="chevron-left" size={26} color="#0A192F" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Booking #{String(booking.id).slice(-6).toUpperCase()}</Text>
          <Text style={styles.headerSub}>{booking.service?.name || "Service"}</Text>
        </View>
        <View style={styles.headerActions}>
          {customerPhone ? (
            <TouchableOpacity
              onPress={() => Linking.openURL(`tel:${customerPhone}`).catch(() => {})}
              style={styles.iconCircleBtn}
              accessibilityLabel="Call Customer"
            >
              <MaterialCommunityIcons name="phone" size={16} color="#059669" />
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            onPress={() => router.push(`/(company)/(tabs)/messages` as any)}
            style={styles.iconCircleBtn}
            accessibilityLabel="Open Chat"
          >
            <MaterialCommunityIcons name="message-text-outline" size={16} color="#0284C7" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadBooking(true)} tintColor="#0A192F" />}
      >
        {/* Hero Liquidity & Status Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroLabel}>NET COMPANY PAYOUT</Text>
              <Text style={styles.heroValue}>
                ${Number(booking.companyEarnings ?? booking.totalPrice ?? 0).toFixed(2)}
              </Text>
            </View>
            <MobileStatusPill status={booking.status} />
          </View>
          <View style={styles.heroDivider} />
          <View style={styles.heroBottom}>
            <View style={styles.heroBottomItem}>
              <MaterialCommunityIcons name="shield-check" size={14} color="#10B981" />
              <Text style={styles.heroBottomText}>Escrow Protected</Text>
            </View>
            <View style={styles.heroBottomItem}>
              <MaterialCommunityIcons name="clock-outline" size={14} color="#94A3B8" />
              <Text style={styles.heroBottomText}>{booking.service?.durationMin || 60} mins window</Text>
            </View>
          </View>
        </View>

        {/* Visual Milestone Stepper (if not cancelled/pending) */}
        {!isPending && booking.status !== "cancelled" && (
          <View style={styles.card}>
            <Text style={styles.cardHeaderTitle}>Operational Milestone</Text>
            <VisualMilestoneStepper
              currentStage={milestoneStage}
              completedStages={completedStages}
            />
          </View>
        )}

        {/* Customer Information Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeaderTitle}>Customer & Destination</Text>
            {customerPhone ? (
              <TouchableOpacity
                onPress={() => Linking.openURL(`tel:${customerPhone}`).catch(() => {})}
                style={styles.actionChip}
              >
                <MaterialCommunityIcons name="phone" size={13} color="#059669" />
                <Text style={styles.actionChipText}>Call</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.infoRow}>
            <View style={styles.avatarWrap}>
              <MaterialCommunityIcons name="account" size={18} color="#0A192F" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.primaryText}>{booking.customer?.fullName || "Customer"}</Text>
              <Text style={styles.secondaryText}>{customerPhone || "No direct phone"}</Text>
            </View>
          </View>

          <View style={styles.innerDivider} />

          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="map-marker" size={18} color="#EF4444" />
            <Text style={[styles.secondaryText, { flex: 1 }]}>
              {booking.serviceAddress || "Address provided upon confirmation"}
            </Text>
          </View>

          {booking.customerNotes ? (
            <View style={styles.notesBox}>
              <MaterialCommunityIcons name="information-outline" size={15} color="#D97706" />
              <Text style={styles.notesText}>{booking.customerNotes}</Text>
            </View>
          ) : null}
        </View>

        {/* Assigned Technician Allocation Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeaderTitle}>Technician Assignment</Text>
            <TouchableOpacity
              onPress={() => setAssignModalOpen(true)}
              style={styles.actionChip}
            >
              <MaterialCommunityIcons name="account-sync" size={13} color="#0284C7" />
              <Text style={styles.actionChipText}>{booking.assignedStaff ? "Reassign" : "Assign"}</Text>
            </TouchableOpacity>
          </View>

          {booking.assignedStaff ? (
            <View style={styles.infoRow}>
              <View style={[styles.avatarWrap, { backgroundColor: "#ECFDF5" }]}>
                <MaterialCommunityIcons name="account-hard-hat" size={18} color="#059669" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.primaryText}>
                  {booking.assignedStaff.fullName || booking.assignedStaff.user?.fullName}
                </Text>
                <Text style={styles.secondaryText}>
                  {staffPhone || "On-shift technician"}
                </Text>
              </View>
              {staffPhone ? (
                <TouchableOpacity
                  onPress={() => Linking.openURL(`tel:${staffPhone}`).catch(() => {})}
                  style={styles.iconCircleMini}
                >
                  <MaterialCommunityIcons name="phone" size={14} color="#059669" />
                </TouchableOpacity>
              ) : null}
            </View>
          ) : (
            <View style={styles.unassignedBox}>
              <MaterialCommunityIcons name="account-alert-outline" size={24} color="#D97706" />
              <View style={{ flex: 1 }}>
                <Text style={styles.unassignedTitle}>Crew Unallocated</Text>
                <Text style={styles.unassignedSub}>Assign a technician to start SLA route</Text>
              </View>
              <TouchableOpacity
                onPress={() => setAssignModalOpen(true)}
                style={styles.assignNowBtn}
              >
                <Text style={styles.assignNowText}>Assign</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Live GPS Route Map */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeaderTitle}>Destination Map</Text>
            <View style={styles.livePill}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>GPS Active</Text>
            </View>
          </View>
          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
              style={styles.mapView}
              initialRegion={{
                latitude: destinationLat,
                longitude: destinationLng,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
              }}
            >
              <Marker
                coordinate={{ latitude: destinationLat, longitude: destinationLng }}
                title="Service Destination"
                pinColor="#EF4444"
              />
              {liveStaffLocation && (
                <Marker
                  coordinate={{ latitude: liveStaffLocation.lat, longitude: liveStaffLocation.lng }}
                  title="Technician"
                >
                  <View style={styles.staffMarker}>
                    <MaterialCommunityIcons name="car" size={16} color="#FFFFFF" />
                  </View>
                </Marker>
              )}
            </MapView>
          </View>
        </View>

        {/* Financial Breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardHeaderTitle}>Payment Ledger</Text>
          <View style={styles.payRow}>
            <Text style={styles.payLabel}>Customer Billed Total</Text>
            <Text style={styles.payValue}>${Number(booking.totalPrice || 0).toFixed(2)}</Text>
          </View>
          <View style={styles.payRow}>
            <Text style={styles.payLabel}>Platform Escrow Fee</Text>
            <Text style={[styles.payValue, { color: "#64748B" }]}>
              -${Number(booking.platformFee || 0).toFixed(2)}
            </Text>
          </View>
          <View style={styles.innerDivider} />
          <View style={styles.payRow}>
            <Text style={[styles.payLabel, { fontWeight: "800", color: "#0A192F" }]}>Net Company Receivable</Text>
            <Text style={[styles.payValue, { fontWeight: "800", color: "#059669", fontSize: 16 }]}>
              ${Number(booking.companyEarnings ?? booking.totalPrice ?? 0).toFixed(2)}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Operational Action Bar */}
      {isPending ? (
        <View style={styles.bottomDock}>
          <TouchableOpacity style={styles.dockDeclineBtn} onPress={handleDecline}>
            <Text style={styles.dockDeclineText}>Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dockAcceptBtn} onPress={handleAccept}>
            <MaterialCommunityIcons name="check" size={18} color="#FFFFFF" />
            <Text style={styles.dockAcceptText}>Accept & Assign</Text>
          </TouchableOpacity>
        </View>
      ) : !booking.assignedStaff ? (
        <View style={styles.bottomDock}>
          <TouchableOpacity
            style={[styles.dockAcceptBtn, { width: "100%" }]}
            onPress={() => setAssignModalOpen(true)}
          >
            <MaterialCommunityIcons name="account-arrow-right" size={18} color="#FFFFFF" />
            <Text style={styles.dockAcceptText}>Assign Crew Technician</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* 1-Tap Staff Allocation Modal */}
      <AssignStaffModal
        visible={assignModalOpen}
        bookingId={String(booking.id)}
        onClose={() => setAssignModalOpen(false)}
        onAssigned={() => {
          setAssignModalOpen(false);
          loadBooking(true);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0A192F",
    letterSpacing: -0.2,
  },
  headerSub: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  iconCircleBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 110,
  },
  heroCard: {
    backgroundColor: "#0A192F",
    borderRadius: 18,
    padding: 16,
    shadowColor: "#0A192F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  heroLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94A3B8",
    letterSpacing: 0.5,
  },
  heroValue: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
    marginTop: 2,
  },
  heroDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    marginVertical: 12,
  },
  heroBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroBottomItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  heroBottomText: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.8)",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 10,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardHeaderTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0F172A",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  actionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  actionChipText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#0A192F",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatarWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
  },
  secondaryText: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },
  innerDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 2,
  },
  notesBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FEF3C7",
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  notesText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#92400E",
    flex: 1,
  },
  iconCircleMini: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
  },
  unassignedBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFFBEB",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  unassignedTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#92400E",
  },
  unassignedSub: {
    fontSize: 10,
    color: "#B45309",
  },
  assignNowBtn: {
    backgroundColor: "#D97706",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  assignNowText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#10B981",
  },
  liveText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#059669",
  },
  mapContainer: {
    height: 160,
    borderRadius: 12,
    overflow: "hidden",
  },
  mapView: {
    width: "100%",
    height: "100%",
  },
  staffMarker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#0A192F",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  payRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  payLabel: {
    fontSize: 12,
    color: "#475569",
  },
  payValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  bottomDock: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 28 : 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  dockDeclineBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  dockDeclineText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
  },
  dockAcceptBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#0A192F",
  },
  dockAcceptText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
});
