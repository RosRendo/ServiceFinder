import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { FleetRadarMember } from "@/types/cockpit";

interface FleetQuickRadarProps {
  staffList?: FleetRadarMember[];
  onCallPress?: (phone: string) => void;
  onChatPress?: (staffId: string, name: string) => void;
  onViewAllPress: () => void;
}

export default function FleetQuickRadar({
  staffList = [],
  onCallPress,
  onChatPress,
  onViewAllPress,
}: FleetQuickRadarProps) {
  const onlineCount = staffList.filter((s) => s.status === "ONLINE").length;
  const onJobCount = staffList.filter((s) => s.status === "ON_JOB").length;

  const handleCall = (phone?: string) => {
    if (!phone) return;
    if (onCallPress) {
      onCallPress(phone);
    } else {
      Linking.openURL(`tel:${phone}`).catch(() => {});
    }
  };

  const handleChat = (staffId: string, name: string) => {
    if (onChatPress) {
      onChatPress(staffId, name);
    }
  };

  return (
    <View style={styles.card}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons name="radar" size={16} color="#0A192F" />
          <Text style={styles.headerTitle}>Fleet Radar</Text>
          <View style={styles.countPill}>
            <View style={styles.onlineDot} />
            <Text style={styles.countPillText}>{onlineCount} Online</Text>
            {onJobCount > 0 && (
              <Text style={styles.countPillSub}>· {onJobCount} on job</Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          onPress={onViewAllPress}
          style={styles.viewAllBtn}
          activeOpacity={0.7}
        >
          <Text style={styles.viewAllText}>Full Fleet</Text>
          <MaterialCommunityIcons name="arrow-right" size={12} color="#0284C7" />
        </TouchableOpacity>
      </View>

      {/* Staff Strip */}
      {staffList.length === 0 ? (
        <View style={styles.emptyWrap}>
          <MaterialCommunityIcons name="account-group-outline" size={24} color="#94A3B8" />
          <Text style={styles.emptyText}>No field technicians registered</Text>
          <TouchableOpacity onPress={onViewAllPress} style={styles.addCrewBtn}>
            <Text style={styles.addCrewText}>+ Add Crew</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {staffList.map((staff) => {
            const isOnline = staff.status === "ONLINE";
            const isOnJob = staff.status === "ON_JOB";
            const ringColor = isOnline
              ? "#10B981"
              : isOnJob
              ? "#F59E0B"
              : "#CBD5E1";
            const statusLabel = isOnline
              ? "Online"
              : isOnJob
              ? "On Job"
              : "Offline";

            return (
              <View key={staff.id} style={styles.staffItem}>
                {/* Avatar with Status Ring */}
                <View style={[styles.avatarRing, { borderColor: ringColor }]}>
                  <View style={styles.avatarInner}>
                    <MaterialCommunityIcons name="account-hard-hat" size={18} color="#0A192F" />
                  </View>
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: ringColor },
                    ]}
                  />
                </View>

                {/* Name & Workload */}
                <Text style={styles.staffName} numberOfLines={1}>
                  {staff.name}
                </Text>
                <View
                  style={[
                    styles.workloadChip,
                    isOnJob && styles.workloadChipBusy,
                  ]}
                >
                  <Text
                    style={[
                      styles.workloadText,
                      isOnJob && styles.workloadTextBusy,
                    ]}
                  >
                    {staff.activeJobCount > 0 ? `${staff.activeJobCount} Active` : "Free"}
                  </Text>
                </View>

                {/* 1-Tap Call & Chat Shortcuts */}
                <View style={styles.shortcutsRow}>
                  {staff.phone ? (
                    <TouchableOpacity
                      style={styles.iconBtn}
                      onPress={() => handleCall(staff.phone)}
                      activeOpacity={0.7}
                      accessibilityLabel={`Call ${staff.name}`}
                    >
                      <MaterialCommunityIcons name="phone" size={12} color="#059669" />
                    </TouchableOpacity>
                  ) : null}

                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => handleChat(staff.id, staff.name)}
                    activeOpacity={0.7}
                    accessibilityLabel={`Chat with ${staff.name}`}
                  >
                    <MaterialCommunityIcons name="message-text" size={12} color="#0284C7" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingVertical: 14,
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
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  headerLeft: {
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
  countPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#A7F3D0",
    gap: 4,
  },
  onlineDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  countPillText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#065F46",
  },
  countPillSub: {
    fontSize: 9,
    fontWeight: "600",
    color: "#047857",
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
    paddingHorizontal: 14,
    gap: 12,
  },
  staffItem: {
    alignItems: "center",
    width: 78,
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  avatarRing: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    position: "relative",
  },
  avatarInner: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  statusDot: {
    position: "absolute",
    bottom: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  staffName: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
    width: "100%",
    marginBottom: 4,
  },
  workloadChip: {
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
    marginBottom: 6,
  },
  workloadChipBusy: {
    backgroundColor: "#FEF3C7",
  },
  workloadText: {
    fontSize: 8,
    fontWeight: "700",
    color: "#475569",
  },
  workloadTextBusy: {
    color: "#B45309",
  },
  shortcutsRow: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  iconBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  emptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 6,
  },
  emptyText: {
    fontSize: 11,
    color: "#94A3B8",
  },
  addCrewBtn: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  addCrewText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0A192F",
  },
});
