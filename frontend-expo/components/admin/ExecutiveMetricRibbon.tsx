import React from "react";
import { View, Text, StyleSheet, Platform, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const HERO_SHADOW = Platform.select({
  ios: { shadowColor: "#0F172A", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.16, shadowRadius: 12 },
  android: { elevation: 4 },
});

interface ExecutiveMetricRibbonProps {
  totalRevenue: number;
  revenueGrowth?: number | null;
  completedBookings: number;
  onInspectPress?: () => void;
}

export default function ExecutiveMetricRibbon({
  totalRevenue,
  revenueGrowth,
  completedBookings,
  onInspectPress,
}: ExecutiveMetricRibbonProps) {
  const formatCurrency = (val: number) => {
    return "$" + Math.round(val || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const growthText =
    typeof revenueGrowth === "number" && Number.isFinite(revenueGrowth)
      ? `${revenueGrowth >= 0 ? "+" : ""}${revenueGrowth}%`
      : null;

  return (
    <View style={s.card}>
      {/* Top Header */}
      <View style={s.topRow}>
        <View style={s.badgeLabelRow}>
          <View style={s.iconPill}>
            <MaterialCommunityIcons name="finance" size={13} color="#94A3B8" />
          </View>
          <Text style={s.badgeLabel}>PLATFORM GROSS VOLUME</Text>
        </View>

        {growthText && (
          <View style={s.trendPill}>
            <View
              style={[
                s.trendDot,
                { backgroundColor: (revenueGrowth ?? 0) >= 0 ? "#10B981" : "#EF4444" },
              ]}
            />
            <Text style={s.trendText}>{growthText} vs prev period</Text>
          </View>
        )}
      </View>

      {/* Main Revenue Figure */}
      <Text style={s.amountText}>{formatCurrency(totalRevenue)}</Text>

      {/* Breakdown Ribbon Footer */}
      <View style={s.footerRow}>
        <View style={s.statItem}>
          <Text style={s.statLabel}>Completed Orders</Text>
          <Text style={s.statVal}>{completedBookings.toLocaleString()}</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.statItem}>
          <Text style={s.statLabel}>Escrow Status</Text>
          <View style={s.escrowRow}>
            <View style={s.escrowDot} />
            <Text style={s.statVal}>Active Custody</Text>
          </View>
        </View>
        {onInspectPress && (
          <TouchableOpacity onPress={onInspectPress} style={s.inspectBtn} activeOpacity={0.8}>
            <Text style={s.inspectText}>Ledger</Text>
            <MaterialCommunityIcons name="arrow-right" size={13} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: "#0F172A",
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: "#1E293B",
    ...HERO_SHADOW,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  badgeLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconPill: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 0.8,
  },
  trendPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  trendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  trendText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#CBD5E1",
  },
  amountText: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.6,
    marginVertical: 4,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
    gap: 16,
  },
  statItem: {
    gap: 2,
  },
  statLabel: {
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  statVal: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  escrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  escrowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  statDivider: {
    width: 1,
    height: 22,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  inspectBtn: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  inspectText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
