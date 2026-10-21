import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { UrgentDispatchCardItem } from "@/types/cockpit";
import { calculateSlaRemaining } from "@/utils/slaHelper";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = Math.min(SCREEN_WIDTH - 32, 360);

interface UrgentDispatchCarouselProps {
  bookings: UrgentDispatchCardItem[];
  onAccept: (bookingId: string | number) => void;
  onDecline: (bookingId: string | number) => void;
  onViewAll: () => void;
}

function UrgencyBadge({
  bookingDate,
  createdAt,
  deadlineMinutes,
  isInstant,
}: {
  bookingDate?: string;
  createdAt?: string;
  deadlineMinutes?: number;
  isInstant?: boolean;
}) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const sla = calculateSlaRemaining(bookingDate, createdAt, deadlineMinutes);

  useEffect(() => {
    if (sla.isCritical) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.35,
            duration: 650,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 650,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [sla.isCritical]);

  return (
    <View
      style={[
        styles.urgencyBadge,
        {
          backgroundColor: sla.bgColor,
          borderColor: sla.borderColor,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.urgencyDot,
          {
            backgroundColor: sla.textColor,
            opacity: pulseAnim,
          },
        ]}
      />
      <MaterialCommunityIcons
        name={isInstant ? "lightning-bolt" : "clock-outline"}
        size={11}
        color={sla.textColor}
      />
      <Text style={[styles.urgencyText, { color: sla.textColor }]}>
        {sla.formatted}
      </Text>
    </View>
  );
}

export default function UrgentDispatchCarousel({
  bookings = [],
  onAccept,
  onDecline,
  onViewAll,
}: UrgentDispatchCarouselProps) {
  // Empty State: Compact Queue Cleared Card (T007)
  if (!bookings || bookings.length === 0) {
    return (
      <View style={styles.clearedCard}>
        <View style={styles.clearedLeft}>
          <View style={styles.clearedIconWrap}>
            <MaterialCommunityIcons name="check-decagram" size={20} color="#059669" />
          </View>
          <View>
            <Text style={styles.clearedTitle}>Queue Cleared</Text>
            <Text style={styles.clearedSub}>Operational Normal · 0 Pending</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={onViewAll}
          style={styles.clearedAction}
          activeOpacity={0.7}
        >
          <Text style={styles.clearedActionText}>Open Ops</Text>
          <MaterialCommunityIcons name="chevron-right" size={14} color="#0A192F" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header bar */}
      <View style={styles.sectionHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.alertDot} />
          <Text style={styles.sectionTitle}>Urgent Dispatch</Text>
          <View style={styles.badgePill}>
            <Text style={styles.badgePillText}>{bookings.length}</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={onViewAll}
          style={styles.viewAllBtn}
          activeOpacity={0.7}
        >
          <Text style={styles.viewAllText}>All ({bookings.length})</Text>
          <MaterialCommunityIcons name="arrow-right" size={12} color="#0284C7" />
        </TouchableOpacity>
      </View>

      {/* Booking Cards Carousel */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + 12}
        snapToAlignment="start"
      >
        {bookings.map((booking) => (
          <View key={booking.id} style={[styles.card, { width: CARD_WIDTH }]}>
            {/* Top Card Row */}
            <View style={styles.cardHeader}>
              <UrgencyBadge
                bookingDate={booking.bookingDate}
                deadlineMinutes={booking.deadlineMinutes}
                isInstant={booking.isInstant}
              />
              <View style={styles.payoutBadge}>
                <Text style={styles.payoutLabel}>Net Payout</Text>
                <Text style={styles.payoutValue}>
                  ${Number(booking.payoutAmount || 0).toFixed(2)}
                </Text>
              </View>
            </View>

            {/* Middle Job Details */}
            <View style={styles.cardBody}>
              <View style={styles.customerRow}>
                <View style={styles.avatarMini}>
                  <MaterialCommunityIcons name="account" size={16} color="#475569" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.customerName} numberOfLines={1}>
                    {booking.customerName || "Customer"}
                  </Text>
                  <Text style={styles.serviceName} numberOfLines={1}>
                    {booking.serviceName || "Home Service"}
                  </Text>
                </View>
              </View>

              <View style={styles.locationRow}>
                <MaterialCommunityIcons name="map-marker-outline" size={13} color="#64748B" />
                <Text style={styles.locationText} numberOfLines={1}>
                  {booking.serviceAddress || "Address provided upon dispatch"}
                </Text>
              </View>
            </View>

            {/* Bottom 1-Tap Action Deck (T006) */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.declineBtn}
                onPress={() => onDecline(booking.id)}
                activeOpacity={0.75}
              >
                <MaterialCommunityIcons name="close" size={14} color="#64748B" />
                <Text style={styles.declineBtnText}>Decline</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.assignBtn}
                onPress={() => onAccept(booking.id)}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="account-arrow-right" size={15} color="#FFFFFF" />
                <Text style={styles.assignBtnText}>Accept & Assign</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  alertDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#EF4444",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  badgePill: {
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  badgePillText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#DC2626",
  },
  viewAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  viewAllText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0284C7",
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0A192F",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  urgencyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  urgencyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  urgencyText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: -0.1,
  },
  payoutBadge: {
    alignItems: "flex-end",
  },
  payoutLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#94A3B8",
    textTransform: "uppercase",
  },
  payoutValue: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0A192F",
    letterSpacing: -0.3,
  },
  cardBody: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    gap: 6,
  },
  customerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  avatarMini: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  customerName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
  },
  serviceName: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "500",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingTop: 2,
  },
  locationText: {
    fontSize: 10,
    color: "#64748B",
    flex: 1,
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  declineBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
  },
  declineBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
  },
  assignBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "#0A192F",
    shadowColor: "#0A192F",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  assignBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },
  clearedCard: {
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: "#F0FDF4",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  clearedLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  clearedIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
  },
  clearedTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#166534",
  },
  clearedSub: {
    fontSize: 10,
    fontWeight: "600",
    color: "#15803D",
  },
  clearedAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#86EFAC",
  },
  clearedActionText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#0A192F",
  },
});
