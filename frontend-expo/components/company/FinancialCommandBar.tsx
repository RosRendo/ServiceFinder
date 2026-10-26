import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface FinancialCommandBarProps {
  availableBalance: number;
  escrowBalance: number;
  unremittedCrewCash?: number;
  todayNetRevenue?: number | null;
  cashRemittanceLimit?: number;
  onWithdrawPress: () => void;
  onAuditCashPress: () => void;
}

export default function FinancialCommandBar({
  availableBalance = 0,
  escrowBalance = 0,
  unremittedCrewCash = 0,
  todayNetRevenue = null,
  cashRemittanceLimit = 100,
  onWithdrawPress,
  onAuditCashPress,
}: FinancialCommandBarProps) {
  const isCashAtRisk = unremittedCrewCash >= cashRemittanceLimit;

  return (
    <View style={styles.card}>
      {/* Top Title & Action Strip */}
      <View style={styles.headerRow}>
        <View style={styles.headerTitleWrap}>
          <MaterialCommunityIcons name="shield-check" size={15} color="#0A192F" />
          <Text style={styles.headerTitle}>Financial Command</Text>
        </View>

        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={styles.actionBtnSecondary}
            onPress={onAuditCashPress}
            activeOpacity={0.75}
          >
            <MaterialCommunityIcons name="cash-register" size={12} color="#0A192F" />
            <Text style={styles.actionBtnSecondaryText}>Audit Cash</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtnPrimary}
            onPress={onWithdrawPress}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="bank-transfer-out" size={13} color="#FFFFFF" />
            <Text style={styles.actionBtnPrimaryText}>Withdraw</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Cash Risk Banner if crew cash holds exceed threshold */}
      {isCashAtRisk && (
        <TouchableOpacity
          style={styles.cashRiskBanner}
          onPress={onAuditCashPress}
          activeOpacity={0.8}
        >
          <View style={styles.riskBannerLeft}>
            <MaterialCommunityIcons name="alert-circle" size={14} color="#D97706" />
            <Text style={styles.riskBannerText}>
              Crew Cash Hold (${unremittedCrewCash.toFixed(0)}) &gt; ${cashRemittanceLimit} Limit
            </Text>
          </View>
          <Text style={styles.riskBannerAction}>Reconcile &gt;</Text>
        </TouchableOpacity>
      )}

      {/* 4-Metric Grid */}
      <View style={styles.metricsGrid}>
        {/* Metric 1: Available Wallet */}
        <View style={styles.metricCell}>
          <View style={styles.cellHeader}>
            <MaterialCommunityIcons name="wallet-outline" size={13} color="#0A192F" />
            <Text style={styles.metricLabel}>Available</Text>
          </View>
          <Text style={[styles.metricValue, { color: "#0A192F" }]}>
            ${availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          <Text style={styles.metricSub}>Ready for bank payout</Text>
        </View>

        <View style={styles.divider} />

        {/* Metric 2: Escrow Balance */}
        <View style={styles.metricCell}>
          <View style={styles.cellHeader}>
            <MaterialCommunityIcons name="lock-outline" size={13} color="#0284C7" />
            <Text style={styles.metricLabel}>In Escrow</Text>
          </View>
          <Text style={[styles.metricValue, { color: "#0284C7" }]}>
            ${escrowBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          <Text style={styles.metricSub}>Active jobs transit</Text>
        </View>

        <View style={styles.divider} />

        {/* Metric 3: Crew Cash Hold */}
        <TouchableOpacity style={styles.metricCell} onPress={onAuditCashPress} activeOpacity={0.7}>
          <View style={styles.cellHeader}>
            <MaterialCommunityIcons
              name="cash"
              size={13}
              color={isCashAtRisk ? "#D97706" : "#64748B"}
            />
            <Text style={[styles.metricLabel, isCashAtRisk && { color: "#D97706", fontWeight: "800" }]}>
              Crew Cash
            </Text>
          </View>
          <Text
            style={[
              styles.metricValue,
              { color: isCashAtRisk ? "#D97706" : "#334155" },
            ]}
          >
            ${unremittedCrewCash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          <Text style={styles.metricSub}>{isCashAtRisk ? "Requires settlement" : "Field collected"}</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Metric 4: Today Net Revenue */}
        <View style={styles.metricCell}>
          <View style={styles.cellHeader}>
            <MaterialCommunityIcons name="trending-up" size={13} color="#059669" />
            <Text style={styles.metricLabel}>Today Net</Text>
          </View>
          <Text style={[styles.metricValue, { color: "#059669" }]}>
            {todayNetRevenue != null
              ? `$${todayNetRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : "—"}
          </Text>
          <Text style={styles.metricSub}>{todayNetRevenue != null ? "Realized earnings" : "Not instrumented yet"}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0A192F",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  headerTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0F172A",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  actionButtonsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionBtnSecondary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  actionBtnSecondaryText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#0F172A",
  },
  actionBtnPrimary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#0A192F",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  actionBtnPrimaryText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  cashRiskBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FDE68A",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 10,
  },
  riskBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  riskBannerText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#92400E",
  },
  riskBannerAction: {
    fontSize: 10,
    fontWeight: "800",
    color: "#B45309",
  },
  metricsGrid: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  metricCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  cellHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginBottom: 3,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
  },
  metricValue: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  metricSub: {
    fontSize: 8,
    color: "#94A3B8",
    marginTop: 2,
    textAlign: "center",
  },
  divider: {
    width: 1,
    height: "75%",
    backgroundColor: "#E2E8F0",
    alignSelf: "center",
  },
});
