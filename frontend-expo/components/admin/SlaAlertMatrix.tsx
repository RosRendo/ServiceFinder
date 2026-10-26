import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Theme } from "@/constants/theme";

const T = Theme.colors;

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: "#0F172A", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  android: { elevation: 2 },
});

export interface SlaAlertMatrixProps {
  pendingVerificationsCount: number;
  activeDisputesCount: number;
  pendingPayoutsCount: number | null;
  onNavigateQueue: () => void;
  onNavigateDisputes: () => void;
  onNavigatePayouts: () => void;
}

export default function SlaAlertMatrix({
  pendingVerificationsCount,
  activeDisputesCount,
  pendingPayoutsCount,
  onNavigateQueue,
  onNavigateDisputes,
  onNavigatePayouts,
}: SlaAlertMatrixProps) {
  const payoutsTracked = pendingPayoutsCount != null;
  const payoutsValue = pendingPayoutsCount ?? 0;
  const totalActionable =
    pendingVerificationsCount + activeDisputesCount + (payoutsTracked ? payoutsValue : 0);

  return (
    <View style={s.container}>
      {/* Section Header */}
      <View style={s.headerRow}>
        <View style={s.headerTitleWrap}>
          <View
            style={[
              s.indicatorDot,
              { backgroundColor: totalActionable > 0 ? "#DC2626" : "#059669" },
            ]}
          />
          <Text style={s.headerTitle}>OPERATIONAL ACTION MATRIX</Text>
        </View>
        <View style={s.totalBadge}>
          <View
            style={[
              s.statusDotSmall,
              { backgroundColor: totalActionable > 0 ? "#DC2626" : "#059669" },
            ]}
          />
          <Text style={s.totalBadgeText}>
            {totalActionable > 0 ? `${totalActionable} ACTION REQUIRED` : "ALL CLEAR"}
          </Text>
        </View>
      </View>

      {/* Grid of Actionable Cards */}
      <View style={s.cardsGrid}>
        {/* Verifications Card */}
        <TouchableOpacity
          style={[s.card, CARD_SHADOW]}
          onPress={onNavigateQueue}
          activeOpacity={0.7}
        >
          <View style={s.cardTop}>
            <View style={s.iconBox}>
              <MaterialCommunityIcons name="briefcase-check-outline" size={18} color="#0F172A" />
            </View>
            <View style={s.countPill}>
              {pendingVerificationsCount > 0 && <View style={[s.statusDot, { backgroundColor: "#D97706" }]} />}
              <Text style={s.countText}>{pendingVerificationsCount}</Text>
            </View>
          </View>
          <Text style={s.cardTitle}>KYC Verifications</Text>
          <Text style={s.cardSubtitle}>
            {pendingVerificationsCount > 0 ? "Pending commercial compliance" : "Queue caught up"}
          </Text>
          <View style={s.actionRow}>
            <Text style={s.actionText}>Review Queue</Text>
            <MaterialCommunityIcons name="arrow-right" size={13} color="#0F172A" />
          </View>
        </TouchableOpacity>

        {/* Disputes Card */}
        <TouchableOpacity
          style={[s.card, CARD_SHADOW]}
          onPress={onNavigateDisputes}
          activeOpacity={0.7}
        >
          <View style={s.cardTop}>
            <View style={s.iconBox}>
              <MaterialCommunityIcons name="shield-alert-outline" size={18} color="#0F172A" />
            </View>
            <View style={s.countPill}>
              {activeDisputesCount > 0 && <View style={[s.statusDot, { backgroundColor: "#DC2626" }]} />}
              <Text style={s.countText}>{activeDisputesCount}</Text>
            </View>
          </View>
          <Text style={s.cardTitle}>Escrow Disputes</Text>
          <Text style={s.cardSubtitle}>
            {activeDisputesCount > 0 ? "Arbitration case active" : "Zero open disputes"}
          </Text>
          <View style={s.actionRow}>
            <Text style={s.actionText}>Mediate Cases</Text>
            <MaterialCommunityIcons name="arrow-right" size={13} color="#0F172A" />
          </View>
        </TouchableOpacity>

        {/* Payouts Card */}
        <TouchableOpacity
          style={[s.card, CARD_SHADOW]}
          onPress={onNavigatePayouts}
          activeOpacity={0.7}
        >
          <View style={s.cardTop}>
            <View style={s.iconBox}>
              <MaterialCommunityIcons name="bank-transfer-out" size={18} color="#0F172A" />
            </View>
            <View style={s.countPill}>
              {payoutsTracked && payoutsValue > 0 && <View style={[s.statusDot, { backgroundColor: "#334155" }]} />}
              <Text style={s.countText}>{payoutsTracked ? payoutsValue : "—"}</Text>
            </View>
          </View>
          <Text style={s.cardTitle}>Payout Settlement</Text>
          <Text style={s.cardSubtitle}>
            {payoutsTracked
              ? payoutsValue > 0
                ? "Batches queued for disbursement"
                : "All settlements clear"
              : "Data not instrumented yet"}
          </Text>
          <View style={s.actionRow}>
            <Text style={s.actionText}>Disburse Funds</Text>
            <MaterialCommunityIcons name="arrow-right" size={13} color="#0F172A" />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  headerTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  headerTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.8,
  },
  totalBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  statusDotSmall: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  totalBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#475569",
    letterSpacing: 0.3,
  },
  cardsGrid: {
    gap: 10,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  countPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  countText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 10,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  actionText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
  },
});
