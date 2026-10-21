/**
 * Admin Booking Detail Dossier — Enterprise Operations Cockpit
 */
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  StyleSheet,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import api from "@/utils/api";
import { Theme } from "@/constants/theme";
import ErrorState from "@/components/common/ErrorState";

const T = Theme.colors;

type BookingStatus = "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";

const STATUS_CONFIG: Record<BookingStatus, { label: string; dotColor: string }> = {
  pending:     { label: "Pending",     dotColor: "#D97706" },
  confirmed:   { label: "Confirmed",   dotColor: "#334155" },
  in_progress: { label: "In Progress", dotColor: "#0284C7" },
  completed:   { label: "Completed",   dotColor: "#059669" },
  cancelled:   { label: "Cancelled",   dotColor: "#DC2626" },
};

const ALL_STATUSES: BookingStatus[] = ["pending", "confirmed", "in_progress", "completed", "cancelled"];

export default function AdminBookingDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [booking, setBooking] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Status Change Modal State
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<BookingStatus>("pending");

  // Cancellation Modal State
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const fetchBooking = useCallback(async (isRefresh = false) => {
    if (!id) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await api.get(`/bookings/${id}`);
      const payload = res.data?.data ?? res.data;
      const data = payload?.booking || payload;
      setBooking(data);
      if (data?.status) {
        setSelectedStatus(data.status);
      }
      setHasError(false);
    } catch (err) {
      console.error("Failed to fetch booking detail", err);
      setHasError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  const handleUpdateStatus = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      await api.patch(`/bookings/${id}/status`, { status: selectedStatus });
      Alert.alert("Success", `Booking status updated to ${selectedStatus.toUpperCase()}.`);
      setStatusModalOpen(false);
      fetchBooking(true);
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.message || "Failed to update booking status.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!id) return;
    if (!cancelReason.trim()) {
      return Alert.alert("Required", "Please provide a reason for cancelling this booking.");
    }

    setActionLoading(true);
    try {
      await api.patch(`/bookings/${id}/cancel`, { reason: cancelReason.trim() });
      Alert.alert("Cancelled", "Booking has been officially cancelled by administration.");
      setCancelModalOpen(false);
      setCancelReason("");
      fetchBooking(true);
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.message || "Failed to cancel booking.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={s.root} edges={["top", "left", "right"]}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Booking Dossier</Text>
        </View>
        <View style={s.centerBox}>
          <ActivityIndicator size="large" color="#0F172A" />
        </View>
      </SafeAreaView>
    );
  }

  if (hasError || !booking) {
    return (
      <SafeAreaView style={s.root} edges={["top", "left", "right"]}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Booking Dossier</Text>
        </View>
        <ErrorState onRetry={() => fetchBooking()} />
      </SafeAreaView>
    );
  }

  const sCfg = STATUS_CONFIG[booking.status as BookingStatus] ?? { label: booking.status || "Unknown", dotColor: "#94A3B8" };
  const dateFormatted = booking.bookingDate
    ? new Date(booking.bookingDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
    : "Unscheduled";
  const timeFormatted = booking.startTime ? `${booking.startTime}${booking.endTime ? ` - ${booking.endTime}` : ''}` : 'Time not specified';
  const staffUser = booking.assignedStaff?.user;

  return (
    <SafeAreaView style={s.root} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#0F172A" />
          </TouchableOpacity>
          <View>
            <Text style={s.headerTitle}>BKG-{booking.id}</Text>
            <Text style={s.headerSubTitle}>Operational Contract Dossier</Text>
          </View>
        </View>
        <View style={s.statusTag}>
          <View style={[s.statusDot, { backgroundColor: sCfg.dotColor }]} />
          <Text style={s.statusText}>{sCfg.label}</Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchBooking(true)}
            tintColor="#0F172A"
          />
        }
      >
        {/* Service Order Overview */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Service Order Overview</Text>

          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Service Spec</Text>
            <Text style={s.infoValueBold}>{booking.service?.name || "Standard Booking"}</Text>
          </View>
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Category</Text>
            <Text style={s.infoValue}>{booking.service?.serviceType?.category?.name || "General"}</Text>
          </View>
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Scheduled Date</Text>
            <Text style={s.infoValue}>{dateFormatted}</Text>
          </View>
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Window Slot</Text>
            <Text style={s.infoValue}>{timeFormatted}</Text>
          </View>
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Service Address</Text>
            <Text style={[s.infoValue, { flex: 1, textAlign: "right" }]}>{booking.serviceAddress || "On-site / Customer Address"}</Text>
          </View>
          {booking.customerNotes ? (
            <View style={s.notesBox}>
              <Text style={s.notesLabel}>Customer Instructions:</Text>
              <Text style={s.notesText}>{booking.customerNotes}</Text>
            </View>
          ) : null}
        </View>

        {/* Stakeholder Ledger */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Stakeholder Directory</Text>

          {/* Customer Block */}
          <View style={s.stakeholderBlock}>
            <View style={s.stakeholderHeader}>
              <MaterialCommunityIcons name="account" size={16} color="#0F172A" />
              <Text style={s.stakeholderRole}>Customer (Client)</Text>
            </View>
            <Text style={s.stakeholderName}>{booking.customer?.fullName || "Unregistered Customer"}</Text>
            <Text style={s.stakeholderSub}>{booking.customer?.email || "No email"} · {booking.customer?.phone || "No phone"}</Text>
          </View>

          <View style={s.blockDivider} />

          {/* Company Block */}
          <View style={s.stakeholderBlock}>
            <View style={s.stakeholderHeader}>
              <MaterialCommunityIcons name="office-building" size={16} color="#0F172A" />
              <Text style={s.stakeholderRole}>Service Provider</Text>
            </View>
            <Text style={s.stakeholderName}>{booking.company?.name || "Assigned Company"}</Text>
            <Text style={s.stakeholderSub}>{booking.company?.email || "No email"} · {booking.company?.phone || "No phone"}</Text>
          </View>

          <View style={s.blockDivider} />

          {/* Technician Block */}
          <View style={s.stakeholderBlock}>
            <View style={s.stakeholderHeader}>
              <MaterialCommunityIcons name="account-hard-hat" size={16} color="#0F172A" />
              <Text style={s.stakeholderRole}>Assigned Field Technician</Text>
            </View>
            <Text style={s.stakeholderName}>{staffUser?.fullName || "No Staff Assigned"}</Text>
            <Text style={s.stakeholderSub}>{staffUser?.phone || (staffUser ? "No direct phone" : "Company must dispatch staff")}</Text>
          </View>
        </View>

        {/* Financial Escrow Breakdown */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Escrow & Financial Accounting</Text>

          <View style={s.finRow}>
            <Text style={s.finLabel}>Gross Booking Total</Text>
            <Text style={s.finValueGross}>${parseFloat(booking.totalPrice || 0).toFixed(2)}</Text>
          </View>
          <View style={s.finRow}>
            <Text style={s.finLabel}>Platform Commission Fee</Text>
            <Text style={s.finValueFee}>${parseFloat(booking.platformFee || 0).toFixed(2)}</Text>
          </View>
          <View style={s.finRow}>
            <Text style={s.finLabel}>Company Net Earnings</Text>
            <Text style={s.finValueNet}>${parseFloat(booking.companyEarnings || 0).toFixed(2)}</Text>
          </View>
          {booking.staffEarnings ? (
            <View style={s.finRow}>
              <Text style={s.finLabel}>Technician Payout</Text>
              <Text style={s.finValue}>${parseFloat(booking.staffEarnings).toFixed(2)}</Text>
            </View>
          ) : null}

          <View style={s.paymentStatusBox}>
            <MaterialCommunityIcons name="shield-check" size={16} color="#059669" />
            <Text style={s.paymentStatusText}>
              Payment Status: {booking.payment?.status ? booking.payment.status.toUpperCase() : "ESCROW HOLD"}
            </Text>
          </View>
        </View>

        {/* Audit Status Log Timeline (if exists) */}
        {Array.isArray(booking.statusLogs) && booking.statusLogs.length > 0 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Audit Transition Log</Text>
            {booking.statusLogs.map((log: any, idx: number) => (
              <View key={log.id || idx} style={s.logItem}>
                <View style={s.logDot} />
                <View style={s.logContent}>
                  <Text style={s.logStatus}>Status updated to {log.newStatus?.toUpperCase()}</Text>
                  <Text style={s.logDate}>
                    {new Date(log.changedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Administration Enforcement Console */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Administration Interventions</Text>
          <Text style={s.actionSub}>Administrative overrides take effect platform-wide immediately.</Text>

          <View style={s.actionGrid}>
            <TouchableOpacity
              style={s.statusActionBtn}
              onPress={() => setStatusModalOpen(true)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="swap-horizontal" size={18} color="#FFFFFF" />
              <Text style={s.statusActionText}>Override Job Status</Text>
            </TouchableOpacity>

            {booking.status !== "cancelled" && (
              <TouchableOpacity
                style={s.cancelActionBtn}
                onPress={() => setCancelModalOpen(true)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="alert-octagon-outline" size={18} color="#DC2626" />
                <Text style={s.cancelActionText}>Emergency Cancel Order</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Override Status Modal */}
      <Modal visible={statusModalOpen} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Override Status</Text>
              <TouchableOpacity onPress={() => setStatusModalOpen(false)}>
                <MaterialCommunityIcons name="close" size={22} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <Text style={s.modalHelp}>Select target state for this booking contract:</Text>

            <View style={s.statusOptions}>
              {ALL_STATUSES.map((st) => {
                const cfg = STATUS_CONFIG[st];
                const isSelected = selectedStatus === st;
                return (
                  <TouchableOpacity
                    key={st}
                    style={[s.statusOpt, isSelected && s.statusOptActive]}
                    onPress={() => setSelectedStatus(st)}
                    activeOpacity={0.7}
                  >
                    <View style={[s.optDot, { backgroundColor: cfg.dotColor }]} />
                    <Text style={[s.optText, isSelected && s.optTextActive]}>{cfg.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={s.commitBtn}
              onPress={handleUpdateStatus}
              disabled={actionLoading}
              activeOpacity={0.85}
            >
              {actionLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={s.commitBtnText}>Commit Status Change</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Cancel Order Modal */}
      <Modal visible={cancelModalOpen} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <View style={s.modalHeader}>
              <Text style={[s.modalTitle, { color: "#DC2626" }]}>Emergency Cancellation</Text>
              <TouchableOpacity onPress={() => setCancelModalOpen(false)}>
                <MaterialCommunityIcons name="close" size={22} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <Text style={s.modalHelp}>
              Provide formal administrative justification for terminating this contract. Customer and Provider will be notified immediately.
            </Text>

            <TextInput
              style={s.reasonInput}
              placeholder="e.g. Non-responsive provider / safety breach / fraud alert..."
              placeholderTextColor="#94A3B8"
              value={cancelReason}
              onChangeText={setCancelReason}
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity
              style={[s.commitBtn, { backgroundColor: "#DC2626" }]}
              onPress={handleCancelBooking}
              disabled={actionLoading}
              activeOpacity={0.85}
            >
              {actionLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={s.commitBtnText}>Execute Contract Termination</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  backBtn: { marginLeft: -6, padding: 6 },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#0F172A", letterSpacing: -0.2 },
  headerSubTitle: { fontSize: 11, color: "#64748B", fontWeight: "500" },
  statusTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: "600", color: "#334155" },

  centerBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  scrollContent: { padding: 16, paddingBottom: 120, gap: 14 },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardTitle: { fontSize: 14, fontWeight: "700", color: "#0F172A", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.3 },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  infoLabel: { fontSize: 13, color: "#64748B", fontWeight: "500" },
  infoValue: { fontSize: 13, color: "#0F172A", fontWeight: "600" },
  infoValueBold: { fontSize: 14, color: "#0F172A", fontWeight: "700" },

  notesBox: {
    marginTop: 10,
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  notesLabel: { fontSize: 11, fontWeight: "700", color: "#475569", textTransform: "uppercase", marginBottom: 2 },
  notesText: { fontSize: 13, color: "#334155", lineHeight: 18 },

  stakeholderBlock: { paddingVertical: 4 },
  stakeholderHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 },
  stakeholderRole: { fontSize: 11, color: "#64748B", fontWeight: "600", textTransform: "uppercase" },
  stakeholderName: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  stakeholderSub: { fontSize: 12, color: "#64748B", marginTop: 1 },
  blockDivider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 8 },

  finRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  finLabel: { fontSize: 13, color: "#64748B", fontWeight: "500" },
  finValueGross: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  finValueFee: { fontSize: 14, fontWeight: "600", color: "#0284C7" },
  finValueNet: { fontSize: 14, fontWeight: "600", color: "#059669" },
  finValue: { fontSize: 13, fontWeight: "600", color: "#0F172A" },

  paymentStatusBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  paymentStatusText: { fontSize: 12, color: "#166534", fontWeight: "700" },

  logItem: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 12 },
  logDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#0F172A", marginTop: 4 },
  logContent: { flex: 1 },
  logStatus: { fontSize: 13, fontWeight: "600", color: "#0F172A" },
  logDate: { fontSize: 11, color: "#64748B", marginTop: 1 },

  actionSub: { fontSize: 12, color: "#64748B", marginBottom: 12 },
  actionGrid: { gap: 10 },
  statusActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#0F172A",
    borderRadius: 8,
    height: 44,
  },
  statusActionText: { fontSize: 13, fontWeight: "700", color: "#FFFFFF" },
  cancelActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 8,
    height: 44,
  },
  cancelActionText: { fontSize: 13, fontWeight: "700", color: "#DC2626" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  modalTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
  modalHelp: { fontSize: 12, color: "#64748B", marginBottom: 16, lineHeight: 17 },
  statusOptions: { gap: 8, marginBottom: 18 },
  statusOpt: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  statusOptActive: {
    backgroundColor: "#0F172A",
    borderColor: "#0F172A",
  },
  optDot: { width: 6, height: 6, borderRadius: 3 },
  optText: { fontSize: 13, fontWeight: "600", color: "#334155" },
  optTextActive: { color: "#FFFFFF", fontWeight: "700" },

  reasonInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    color: "#0F172A",
    minHeight: 80,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  commitBtn: {
    backgroundColor: "#0F172A",
    borderRadius: 8,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  commitBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
});
