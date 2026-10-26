import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  ScrollView, Text, View, TouchableOpacity, TextInput,
  ActivityIndicator, RefreshControl, StyleSheet, Platform, Animated, Alert, Linking, Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { api } from "@/store/authStore";
import { useSidebarStore } from "@/store/sidebarStore";
import ErrorState from "@/components/common/ErrorState";
import { MobileStatusPill } from "@/components/admin/ManagementCard";
import UrgencyBadge from "@/components/common/UrgencyBadge";
import AssignStaffModal from "@/app/(company)/operations/AssignStaffModal";

const FILTERS = [
  { key: "all",         label: "All" },
  { key: "pending",     label: "Urgent Pending" },
  { key: "confirmed",   label: "Confirmed" },
  { key: "in_progress", label: "In Progress" },
  { key: "completed",   label: "Completed" },
  { key: "cancelled",   label: "Cancelled" },
];

export default function Operations() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [bookings, setBookings] = useState<any[]>([]);
  const [instantRequests, setInstantRequests] = useState<any[]>([]);
  const [biddingRequest, setBiddingRequest] = useState<any | null>(null);
  const [bidPrice, setBidPrice] = useState("35");
  const [bidEta, setBidEta] = useState("15");
  const [submittingBid, setSubmittingBid] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [assignModalBookingId, setAssignModalBookingId] = useState<string | null>(null);
  const setCompanyOpen = useSidebarStore((s) => s.setCompanyOpen);

  const pulseAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.5, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [pulseAnim]);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [searchQuery]);

  const loadBookings = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const [bookingsRes, instantRes] = await Promise.allSettled([
        api.get("/api/bookings"),
        api.get("/api/instant-requests/company-feed"),
      ]);

      if (bookingsRes.status === "fulfilled") {
        const data = bookingsRes.value.data?.data ?? bookingsRes.value.data;
        setBookings(data?.bookings || []);
      }
      if (instantRes.status === "fulfilled") {
        const iRaw = instantRes.value.data;
        const iData = iRaw?.data ?? iRaw;
        const list = Array.isArray(iData) ? iData : iData?.requests;
        setInstantRequests(Array.isArray(list) ? list : []);
      }
      setHasError(false);
    } catch {
      setHasError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleSubmitBid = async () => {
    if (!biddingRequest) return;
    const priceNum = parseFloat(bidPrice);
    const etaNum = parseInt(bidEta, 10);
    if (isNaN(priceNum) || priceNum <= 0) {
      Toast.show({ type: "error", text1: "Invalid Price", text2: "Enter a valid dollar amount." });
      return;
    }
    if (isNaN(etaNum) || etaNum <= 0) {
      Toast.show({ type: "error", text1: "Invalid ETA", text2: "Enter estimated minutes." });
      return;
    }
    setSubmittingBid(true);
    try {
      await api.post(`/api/instant-requests/${biddingRequest.id}/bid`, {
        priceEstimate: priceNum,
        etaMinutes: etaNum,
      });
      Toast.show({ type: "success", text1: "Bid Placed", text2: "Customer will see your offer immediately." });
      setBiddingRequest(null);
      loadBookings(true);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to submit bid.";
      Toast.show({ type: "error", text1: "Bid Error", text2: msg });
    } finally {
      setSubmittingBid(false);
    }
  };

  useFocusEffect(useCallback(() => { loadBookings(); }, [loadBookings]));

  const filteredBookings = bookings.filter((b) => {
    const customer = (b.customer?.fullName || b.customerName || "").toLowerCase();
    const service = (b.service?.name || b.serviceName || "").toLowerCase();
    const idStr = String(b.id);
    const search = debouncedSearch.toLowerCase();
    const matchesSearch = customer.includes(search) || service.includes(search) || idStr.includes(search);
    const matchesFilter = activeFilter === "all" || b.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const pendingCount = bookings.filter((b) => b.status === "pending").length;
  const activeCount = bookings.filter((b) => b.status === "in_progress" || b.status === "confirmed").length;
  const completedCount = bookings.filter((b) => b.status === "completed").length;

  const handleDecline = (id: string | number) => {
    Alert.alert("Decline Booking", "Release this booking back to the dispatch pool?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Decline",
        style: "destructive",
        onPress: async () => {
          try {
            await api.patch(`/api/bookings/${id}/status`, { status: "cancelled" });
            Toast.show({ type: "info", text1: "Booking Declined", text2: "Customer notified." });
            loadBookings(true);
          } catch {
            Toast.show({ type: "error", text1: "Error", text2: "Failed to decline booking." });
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.root} edges={["top", "left", "right"]}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => setCompanyOpen(true)}
            style={styles.menuBtn}
            accessibilityRole="button"
            accessibilityLabel="Open menu"
          >
            <MaterialCommunityIcons name="menu" size={24} color="#0A192F" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Dispatch Command</Text>
        </View>

        {pendingCount > 0 && (
          <View style={styles.urgentPill}>
            <View style={styles.urgentDot} />
            <Text style={styles.urgentPillText}>{pendingCount} Pending SLA</Text>
          </View>
        )}
      </View>

      {/* KPI Overview Capsules */}
      <View style={styles.kpiStrip}>
        <View style={styles.kpiCapsule}>
          <View style={[styles.kpiDot, { backgroundColor: "#EF4444" }]} />
          <Text style={styles.kpiNumber}>{pendingCount}</Text>
          <Text style={styles.kpiLabel}>Awaiting</Text>
        </View>
        <View style={styles.kpiDivider} />
        <View style={styles.kpiCapsule}>
          <View style={[styles.kpiDot, { backgroundColor: "#0284C7" }]} />
          <Text style={styles.kpiNumber}>{activeCount}</Text>
          <Text style={styles.kpiLabel}>In Field</Text>
        </View>
        <View style={styles.kpiDivider} />
        <View style={styles.kpiCapsule}>
          <View style={[styles.kpiDot, { backgroundColor: "#10B981" }]} />
          <Text style={styles.kpiNumber}>{completedCount}</Text>
          <Text style={styles.kpiLabel}>Done Today</Text>
        </View>
      </View>

      {/* Search & Filter Bar */}
      <View style={styles.filtersContainer}>
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={20} color="#64748B" />
          <TextInput
            placeholder="Search customer, service, #ID..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <MaterialCommunityIcons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChips}>
          {FILTERS.map((f) => {
            const isActive = activeFilter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                onPress={() => setActiveFilter(f.key)}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Bookings Queue */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadBookings(true)}
            tintColor="#0A192F"
          />
        }
      >
        {/* Urgent Broadcast Requests Banner & Cards */}
        {instantRequests.length > 0 && (
          <View style={styles.broadcastSection}>
            <View style={styles.broadcastSectionHeader}>
              <View style={styles.broadcastTitleRow}>
                <Animated.View style={[styles.broadcastPulseDot, { opacity: pulseAnim }]} />
                <Text style={styles.broadcastSectionTitle}>
                  Live Broadcast Requests ({instantRequests.length})
                </Text>
              </View>
              <Text style={styles.broadcastSectionSubtitle}>
                On-demand customers looking for urgent assistance in your coverage area
              </Text>
            </View>

            {instantRequests.map((req) => (
              <View key={req.id} style={styles.broadcastCard}>
                <View style={styles.broadcastCardHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.broadcastCategoryRow}>
                      <Text style={styles.broadcastCategoryBadge}>{(req.serviceCategory || "SERVICE").toUpperCase()}</Text>
                      {req.preferredTime === "now" && (
                        <View style={styles.asapBadge}>
                          <MaterialCommunityIcons name="flash" size={12} color="#DC2626" />
                          <Text style={styles.asapText}>ASAP</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.broadcastCustomerName}>{req.customerName}</Text>
                  </View>
                  <Text style={styles.broadcastTimeText}>Live Broadcast</Text>
                </View>

                {!!req.description && (
                  <Text style={styles.broadcastDesc} numberOfLines={2}>
                    "{req.description}"
                  </Text>
                )}

                <View style={styles.broadcastFooter}>
                  {req.myBid ? (
                    <View style={styles.bidSubmittedPill}>
                      <MaterialCommunityIcons name="check-circle" size={14} color="#059669" />
                      <Text style={styles.bidSubmittedText}>
                        Bid Placed: ${req.myBid.priceEstimate} ({req.myBid.etaMinutes}m ETA)
                      </Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.placeBidBtn}
                      onPress={() => {
                        setBiddingRequest(req);
                        setBidPrice("35");
                        setBidEta("15");
                      }}
                      activeOpacity={0.85}
                    >
                      <MaterialCommunityIcons name="gavel" size={15} color="#FFFFFF" />
                      <Text style={styles.placeBidBtnText}>Submit Price & ETA Bid</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
        {loading && !refreshing ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#0A192F" />
          </View>
        ) : hasError && bookings.length === 0 ? (
          <ErrorState onRetry={() => loadBookings()} />
        ) : filteredBookings.length === 0 ? (
          <View style={styles.emptyBox}>
            <View style={styles.emptyIconWrap}>
              <MaterialCommunityIcons
                name={searchQuery ? "file-search-outline" : "check-decagram"}
                size={36}
                color="#059669"
              />
            </View>
            <Text style={styles.emptyTitle}>
              {searchQuery ? "No matching bookings" : "Queue Cleared"}
            </Text>
            <Text style={styles.emptySub}>
              {searchQuery ? "Try a different search query" : "All dispatch bookings handled."}
            </Text>
          </View>
        ) : (
          filteredBookings.map((booking) => {
            const isPending = booking.status === "pending";
            const createdTime = new Date(booking.createdAt || booking.bookingDate || Date.now()).getTime();
            const elapsedMinutes = Math.max(0, (Date.now() - createdTime) / 60000);
            const remainingMinutes = Math.max(1, 30 - elapsedMinutes);
            const displayId = String(booking.id).slice(-6).toUpperCase();

            return (
              <TouchableOpacity
                key={booking.id}
                onPress={() => router.push(`/(company)/booking/${booking.id}` as any)}
                style={styles.card}
                activeOpacity={0.88}
              >
                {/* Header Row: ID, Urgency, Status */}
                <View style={styles.cardHeader}>
                  <View style={styles.idAndTitle}>
                    <View style={styles.idCapsule}>
                      <Text style={styles.idText}>#{displayId}</Text>
                    </View>
                    <Text style={styles.customerName} numberOfLines={1}>
                      {booking.customer?.fullName ?? booking.customerName ?? "Customer"}
                    </Text>
                  </View>

                  <View style={styles.headerBadges}>
                    {isPending && <UrgencyBadge deadlineMinutes={remainingMinutes} compact />}
                    <MobileStatusPill status={booking.status} />
                  </View>
                </View>

                {/* Body Row: Service, Schedule, Address */}
                <View style={styles.cardBody}>
                  <View style={styles.detailRow}>
                    <MaterialCommunityIcons name="briefcase-outline" size={15} color="#475569" />
                    <Text style={styles.detailText} numberOfLines={1}>
                      {booking.service?.name ?? "Home Service"}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <MaterialCommunityIcons name="clock-outline" size={15} color="#475569" />
                    <Text style={styles.detailText}>
                      {new Date(booking.bookingDate).toLocaleDateString("en-US", {
                        weekday: "short", month: "short", day: "numeric",
                      })}
                      {booking.startTime ? ` · ${booking.startTime}` : ""}
                    </Text>
                  </View>

                  {booking.serviceAddress ? (
                    <View style={styles.detailRow}>
                      <MaterialCommunityIcons name="map-marker-outline" size={15} color="#64748B" />
                      <Text style={styles.addressText} numberOfLines={1}>
                        {booking.serviceAddress}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {/* Footer Action Row */}
                <View style={styles.cardFooter}>
                  <View style={styles.payoutWrap}>
                    <Text style={styles.payoutLabel}>PAYOUT</Text>
                    <Text style={styles.payoutValue}>
                      ${Number(booking.companyEarnings ?? booking.totalPrice ?? 0).toFixed(2)}
                    </Text>
                  </View>

                  <View style={styles.actionButtonGroup}>
                    {isPending ? (
                      <>
                        <TouchableOpacity
                          style={styles.declineBtn}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleDecline(booking.id);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.declineText}>Decline</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.assignPrimaryBtn}
                          onPress={(e) => {
                            e.stopPropagation();
                            setAssignModalBookingId(String(booking.id));
                          }}
                          activeOpacity={0.85}
                        >
                          <MaterialCommunityIcons name="account-arrow-right" size={15} color="#FFFFFF" />
                          <Text style={styles.assignPrimaryText}>Assign Staff</Text>
                        </TouchableOpacity>
                      </>
                    ) : booking.assignedStaff ? (
                      <View style={styles.assignedStaffPill}>
                        <MaterialCommunityIcons name="account-check" size={14} color="#059669" />
                        <Text style={styles.assignedStaffText} numberOfLines={1}>
                          {booking.assignedStaff.user?.fullName || booking.assignedStaff.fullName || "Assigned"}
                        </Text>
                        {booking.assignedStaff.phone ? (
                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation();
                              Linking.openURL(`tel:${booking.assignedStaff.phone}`).catch(() => {});
                            }}
                            style={styles.phoneIconMini}
                          >
                            <MaterialCommunityIcons name="phone" size={12} color="#059669" />
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.reassignBtn}
                        onPress={(e) => {
                          e.stopPropagation();
                          setAssignModalBookingId(String(booking.id));
                        }}
                        activeOpacity={0.8}
                      >
                        <MaterialCommunityIcons name="account-plus-outline" size={14} color="#0284C7" />
                        <Text style={styles.reassignText}>Assign Staff</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* 1-Tap Allocation Modal */}
      <AssignStaffModal
        visible={!!assignModalBookingId}
        bookingId={assignModalBookingId}
        onClose={() => setAssignModalBookingId(null)}
        onAssigned={() => loadBookings()}
      />

      {/* Instant Bid Modal */}
      <Modal
        visible={!!biddingRequest}
        transparent
        animationType="fade"
        onRequestClose={() => setBiddingRequest(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalSheetTitle}>Place Broadcast Bid</Text>
                <Text style={styles.modalSheetSubtitle}>
                  {biddingRequest?.serviceCategory?.toUpperCase()} • {biddingRequest?.customerName}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setBiddingRequest(null)} style={styles.modalCloseBtn}>
                <MaterialCommunityIcons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.bidInputsRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.bidInputLabel}>Price Estimate ($ USD)</Text>
                <TextInput
                  style={styles.bidTextInput}
                  value={bidPrice}
                  onChangeText={setBidPrice}
                  keyboardType="numeric"
                  placeholder="35"
                  placeholderTextColor="#94A3B8"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.bidInputLabel}>Arrival ETA (Minutes)</Text>
                <TextInput
                  style={styles.bidTextInput}
                  value={bidEta}
                  onChangeText={setBidEta}
                  keyboardType="numeric"
                  placeholder="15"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            <View style={styles.bidModalActions}>
              <TouchableOpacity
                style={styles.cancelBidBtn}
                onPress={() => setBiddingRequest(null)}
                disabled={submittingBid}
              >
                <Text style={styles.cancelBidBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBidBtn}
                onPress={handleSubmitBid}
                disabled={submittingBid}
              >
                {submittingBid ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="send" size={16} color="#FFFFFF" />
                    <Text style={styles.confirmBidBtnText}>Send Offer</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  menuBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0A192F",
    letterSpacing: -0.3,
  },
  urgentPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  urgentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#EF4444",
  },
  urgentPillText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#DC2626",
  },
  kpiStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  kpiCapsule: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  kpiDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  kpiNumber: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#64748B",
  },
  kpiDivider: {
    width: 1,
    height: 14,
    backgroundColor: "#E2E8F0",
  },
  filtersContainer: {
    backgroundColor: "#FFFFFF",
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    height: 40,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#0F172A",
    fontWeight: "500",
  },
  filterChips: {
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  filterChipActive: {
    backgroundColor: "#0A192F",
    borderColor: "#0A192F",
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
  },
  listContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 110, // Generous clearance for floating 4-tab bar!
  },
  loadingBox: {
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyBox: {
    alignItems: "center",
    paddingVertical: 50,
    gap: 8,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  emptySub: {
    fontSize: 12,
    color: "#64748B",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0A192F",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  idAndTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  idCapsule: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  idText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#475569",
  },
  customerName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  headerBadges: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardBody: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 10,
    gap: 6,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#334155",
  },
  addressText: {
    fontSize: 11,
    color: "#64748B",
    flex: 1,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 2,
  },
  payoutWrap: {},
  payoutLabel: {
    fontSize: 8,
    fontWeight: "700",
    color: "#94A3B8",
    textTransform: "uppercase",
  },
  payoutValue: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0A192F",
  },
  actionButtonGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  declineBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
  },
  declineText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
  },
  assignPrimaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#0A192F",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  assignPrimaryText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  assignedStaffPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  assignedStaffText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#065F46",
    maxWidth: 100,
  },
  phoneIconMini: {
    marginLeft: 2,
    padding: 2,
  },
  reassignBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F0F9FF",
    borderWidth: 1,
    borderColor: "#BAE6FD",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  reassignText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0284C7",
  },

  /* Broadcast Requests Section */
  broadcastSection: {
    marginBottom: 20,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  broadcastSectionHeader: {
    marginBottom: 12,
  },
  broadcastTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  broadcastPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#DC2626",
  },
  broadcastSectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
  },
  broadcastSectionSubtitle: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  broadcastCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  broadcastCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  broadcastCategoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  broadcastCategoryBadge: {
    fontSize: 10,
    fontWeight: "800",
    color: "#0F172A",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  asapBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  asapText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#DC2626",
  },
  broadcastCustomerName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  broadcastTimeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#D97706",
  },
  broadcastDesc: {
    fontSize: 12,
    color: "#475569",
    fontStyle: "italic",
    marginBottom: 10,
    lineHeight: 16,
  },
  broadcastFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  placeBidBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#0F172A",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  placeBidBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  bidSubmittedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  bidSubmittedText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#047857",
  },

  /* Modal Styles */
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalSheet: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  modalSheetTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  modalSheetSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  bidInputsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 18,
  },
  bidInputLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  bidTextInput: {
    height: 42,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    backgroundColor: "#F8FAFC",
  },
  bidModalActions: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "flex-end",
  },
  cancelBidBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cancelBidBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  confirmBidBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#0F172A",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
  },
  confirmBidBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
