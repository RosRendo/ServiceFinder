import React, { useRef, useEffect } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Theme } from "@/constants/theme";

const T = Theme.colors;

interface TrendItem {
  day?: string;
  label?: string;
  value?: number;
  actualValue?: number;
  latest?: boolean;
}

interface CompanyMiniTrendProps {
  data?: TrendItem[];
  completionRate?: number;
  totalRevenue?: number;
}

function MiniBar({ item, index, maxVal }: { item: TrendItem; index: number; maxVal: number }) {
  const heightAnim = useRef(new Animated.Value(0)).current;
  const rawValue = item.actualValue ?? item.value ?? 0;
  const normalizedHeight = maxVal > 0 ? Math.max((rawValue / maxVal) * 100, 8) : 8;

  useEffect(() => {
    Animated.timing(heightAnim, {
      toValue: normalizedHeight,
      duration: 500,
      delay: index * 60,
      useNativeDriver: false,
    }).start();
  }, [normalizedHeight]);

  return (
    <View style={styles.barCol}>
      <View style={styles.barTrack}>
        <Animated.View
          style={[
            styles.barFill,
            item.latest && styles.barFillLatest,
            {
              height: heightAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ["0%", "100%"],
              }),
            },
          ]}
        />
      </View>
      <Text style={[styles.barLabel, item.latest && styles.barLabelLatest]}>
        {(item.day || item.label || "").slice(0, 3)}
      </Text>
    </View>
  );
}

export default function CompanyMiniTrend({
  data = [],
  completionRate = 96,
  totalRevenue = 0,
}: CompanyMiniTrendProps) {
  const values = data.map((d) => d.actualValue ?? d.value ?? 0);
  const maxVal = Math.max(...values, 10);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <MaterialCommunityIcons name="chart-bell-curve-cumulative" size={16} color={T.accent || "#0A192F"} />
          <Text style={styles.title}>Velocity Trend</Text>
        </View>
        <View style={styles.metricCapsules}>
          {totalRevenue > 0 && (
            <View style={styles.capsule}>
              <Text style={styles.capsuleLabel}>Rev: ${Math.round(totalRevenue)}</Text>
            </View>
          )}
          <View style={[styles.capsule, styles.capsuleSuccess]}>
            <MaterialCommunityIcons name="check-circle" size={11} color="#059669" />
            <Text style={styles.capsuleSuccessText}>{Math.round(completionRate)}% SLA</Text>
          </View>
        </View>
      </View>

      <View style={styles.barsContainer}>
        {data.length > 0 ? (
          data.map((item, idx) => (
            <MiniBar
              key={idx}
              item={{ ...item, latest: idx === data.length - 1 }}
              index={idx}
              maxVal={maxVal}
            />
          ))
        ) : (
          <Text style={styles.emptyText}>Syncing weekly metrics...</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  titleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  title: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
    letterSpacing: -0.2,
  },
  metricCapsules: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  capsule: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
  },
  capsuleLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#475569",
  },
  capsuleSuccess: {
    backgroundColor: "#ECFDF5",
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  capsuleSuccessText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#059669",
  },
  barsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 44,
    paddingTop: 4,
  },
  barCol: {
    flex: 1,
    alignItems: "center",
    height: "100%",
    justifyContent: "flex-end",
    gap: 3,
  },
  barTrack: {
    width: 14,
    height: 28,
    backgroundColor: "#F1F5F9",
    borderRadius: 6,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  barFill: {
    width: "100%",
    backgroundColor: "#94A3B8",
    borderRadius: 6,
  },
  barFillLatest: {
    backgroundColor: "#0A192F",
  },
  barLabel: {
    fontSize: 9,
    fontWeight: "600",
    color: "#94A3B8",
  },
  barLabelLatest: {
    color: "#0A192F",
    fontWeight: "800",
  },
  emptyText: {
    fontSize: 11,
    color: "#94A3B8",
    textAlign: "center",
    width: "100%",
  },
});
