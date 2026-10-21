import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import NotificationBell from "@/components/NotificationBell";
import { Theme } from "@/constants/theme";

const T = Theme.colors;

interface CompanyCockpitHeaderProps {
  companyName: string;
  isVerified?: boolean;
  logoUrl?: string;
  onlineCrewCount?: number;
  inProgressJobsCount?: number;
  todayCompletedCount?: number;
  slaComplianceRate?: number;
  onMenuPress: () => void;
  onNotificationPress?: () => void;
  onToggleShift?: (isOnline: boolean) => void;
}

export default function CompanyCockpitHeader({
  companyName = "Company Cockpit",
  isVerified = true,
  onlineCrewCount = 0,
  inProgressJobsCount = 0,
  todayCompletedCount = 0,
  slaComplianceRate = 98,
  onMenuPress,
  onToggleShift,
}: CompanyCockpitHeaderProps) {
  const [isShiftActive, setIsShiftActive] = useState(true);

  const handleToggle = () => {
    const nextState = !isShiftActive;
    setIsShiftActive(nextState);
    if (onToggleShift) {
      onToggleShift(nextState);
    }
  };

  return (
    <View style={styles.headerContainer}>
      {/* Top Action Bar */}
      <View style={styles.topRow}>
        <View style={styles.leftGroup}>
          <TouchableOpacity
            onPress={onMenuPress}
            style={styles.menuBtn}
            accessibilityRole="button"
            accessibilityLabel="Open navigation menu"
          >
            <MaterialCommunityIcons name="menu" size={24} color="#0A192F" />
          </TouchableOpacity>

          <View style={styles.titleWrap}>
            <Text style={styles.companyTitle} numberOfLines={1}>
              {companyName}
            </Text>
            {isVerified && (
              <MaterialCommunityIcons
                name="shield-check"
                size={16}
                color="#0284C7"
                style={styles.verifiedIcon}
              />
            )}
          </View>
        </View>

        <View style={styles.rightGroup}>
          {/* Shift Toggle Pill */}
          <TouchableOpacity
            style={[
              styles.shiftToggle,
              isShiftActive ? styles.shiftActive : styles.shiftInactive,
            ]}
            onPress={handleToggle}
            activeOpacity={0.8}
            accessibilityRole="switch"
            accessibilityState={{ checked: isShiftActive }}
          >
            <View
              style={[
                styles.shiftDot,
                { backgroundColor: isShiftActive ? "#10B981" : "#94A3B8" },
              ]}
            />
            <Text
              style={[
                styles.shiftText,
                { color: isShiftActive ? "#065F46" : "#475569" },
              ]}
            >
              {isShiftActive ? "Shift Live" : "Offline"}
            </Text>
          </TouchableOpacity>

          <NotificationBell color="#0A192F" />
        </View>
      </View>

      {/* Glanceable Shift Metrics Strip */}
      <View style={styles.statsStrip}>
        <View style={styles.statCapsule}>
          <View style={styles.statDotGreen} />
          <Text style={styles.statNumber}>{onlineCrewCount}</Text>
          <Text style={styles.statLabel}>Crew Online</Text>
        </View>

        <View style={styles.stripDivider} />

        <View style={styles.statCapsule}>
          <View style={styles.statDotBlue} />
          <Text style={styles.statNumber}>{inProgressJobsCount}</Text>
          <Text style={styles.statLabel}>In Progress</Text>
        </View>

        <View style={styles.stripDivider} />

        <View style={styles.statCapsule}>
          <View style={styles.statDotPurple} />
          <Text style={styles.statNumber}>{slaComplianceRate}%</Text>
          <Text style={styles.statLabel}>SLA Health</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  leftGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  menuBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  titleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  companyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0A192F",
    letterSpacing: -0.3,
  },
  verifiedIcon: {
    marginLeft: 2,
  },
  rightGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  shiftToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  shiftActive: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },
  shiftInactive: {
    backgroundColor: "#F1F5F9",
    borderColor: "#CBD5E1",
  },
  shiftDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  shiftText: {
    fontSize: 11,
    fontWeight: "700",
  },
  statsStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  statCapsule: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  statDotGreen: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  statDotBlue: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#0284C7",
  },
  statDotPurple: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#8B5CF6",
  },
  statNumber: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0F172A",
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#64748B",
  },
  stripDivider: {
    width: 1,
    height: 14,
    backgroundColor: "#CBD5E1",
  },
});
