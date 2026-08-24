import React from "react";
import { View, Text, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { Theme } from "@/constants/theme";

const T = Theme.colors;

/**
 * Deterministic palette so a given name always renders the same color,
 * but adjacent users in a list don't look identical.
 */
const PALETTE = ["#0A192F", "#1E3A8A", "#2563EB", "#7C3AED", "#0F766E", "#B45309"];

const initialsFrom = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const colorFor = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
};

interface InitialsAvatarProps {
  name: string;
  /** Diameter in px. Default 40. */
  size?: number;
  /** Corner radius override; defaults to a circle. */
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

/** Offline-safe local avatar: deterministic colored circle with initials. */
export default function InitialsAvatar({ name, size = 40, radius, style }: InitialsAvatarProps) {
  return (
    <View
      accessible
      accessibilityLabel={name}
      accessibilityRole="image"
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: radius ?? size / 2,
          backgroundColor: colorFor(name),
        },
        style,
      ]}
    >
      <Text style={[styles.initials, { fontSize: Math.round(size * 0.4) }]} numberOfLines={1}>
        {initialsFrom(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: "center", justifyContent: "center" },
  initials: { color: "#FFFFFF", fontWeight: "700" },
});
