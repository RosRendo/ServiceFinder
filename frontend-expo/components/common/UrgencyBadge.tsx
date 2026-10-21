import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export interface UrgencyBadgeProps {
  deadlineMinutes: number;
  compact?: boolean;
  animated?: boolean;
}

export const UrgencyBadge: React.FC<UrgencyBadgeProps> = ({
  deadlineMinutes,
  compact = false,
  animated = true,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const isCritical = deadlineMinutes <= 5;
  const isWarning = deadlineMinutes > 5 && deadlineMinutes <= 15;

  useEffect(() => {
    if (isCritical && animated) {
      const pulse = Animated.loop(
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
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isCritical, animated]);

  // Color & Icon Tokens
  const config = isCritical
    ? {
        bg: '#FEF2F2',
        border: '#FECACA',
        text: '#DC2626',
        icon: 'timer-alert' as keyof typeof MaterialCommunityIcons.glyphMap,
        label: deadlineMinutes <= 0 ? 'Breached' : `<${Math.max(1, Math.round(deadlineMinutes))}m left`,
      }
    : isWarning
    ? {
        bg: '#FEF3C7',
        border: '#FDE68A',
        text: '#D97706',
        icon: 'timer-sand' as keyof typeof MaterialCommunityIcons.glyphMap,
        label: `${Math.round(deadlineMinutes)}m left`,
      }
    : {
        bg: '#ECFDF5',
        border: '#A7F3D0',
        text: '#059669',
        icon: 'clock-check-outline' as keyof typeof MaterialCommunityIcons.glyphMap,
        label: `${Math.round(deadlineMinutes)}m left`,
      };

  return (
    <View
      style={[
        styles.badgeContainer,
        { backgroundColor: config.bg, borderColor: config.border },
        compact && styles.badgeCompact,
      ]}
    >
      {isCritical && (
        <Animated.View
          style={[
            styles.pulseDot,
            { opacity: pulseAnim, backgroundColor: config.text },
          ]}
        />
      )}
      <MaterialCommunityIcons
        name={config.icon}
        size={compact ? 12 : 14}
        color={config.text}
        style={styles.icon}
      />
      <Text
        style={[
          styles.badgeText,
          { color: config.text },
          compact && styles.badgeTextCompact,
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
};

export default UrgencyBadge;

const styles = StyleSheet.create({
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeCompact: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  icon: {
    marginRight: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  badgeTextCompact: {
    fontSize: 10,
    fontWeight: '700',
  },
});
