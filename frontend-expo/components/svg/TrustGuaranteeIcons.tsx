import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface SvgProps {
  size?: number;
  width?: number;
  height?: number;
}

/**
 * 100% Satisfaction & Full Refund Shield
 * Built with pure React Native primitives to avoid Fabric New Architecture "topSvgLayout" crashes.
 */
export function SatisfactionShieldSvg({ size = 52 }: SvgProps) {
  const outerSize = size;
  const innerSize = Math.round(size * 0.72);
  const iconSize = Math.round(size * 0.44);

  return (
    <View
      style={[
        styles.center,
        {
          width: outerSize,
          height: outerSize,
          borderRadius: outerSize / 2,
          backgroundColor: '#ECFDF5',
          borderWidth: 1.5,
          borderColor: '#A7F3D0',
        },
      ]}
    >
      <View
        style={[
          styles.center,
          {
            width: innerSize,
            height: innerSize,
            borderRadius: innerSize / 2,
            backgroundColor: '#059669',
            shadowColor: '#059669',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.35,
            shadowRadius: 6,
            elevation: 4,
          },
        ]}
      >
        <MaterialCommunityIcons name="shield-check" size={iconSize} color="#FFFFFF" />
      </View>
    </View>
  );
}

/**
 * Free 24h Cancellation Calendar
 * Built with pure React Native primitives.
 */
export function FreeCancelClockSvg({ size = 44 }: SvgProps) {
  const outerSize = size;
  const iconSize = Math.round(size * 0.52);

  return (
    <View
      style={[
        styles.center,
        {
          width: outerSize,
          height: outerSize,
          borderRadius: 14,
          backgroundColor: '#EFF6FF',
          borderWidth: 1.5,
          borderColor: '#BFDBFE',
        },
      ]}
    >
      <MaterialCommunityIcons name="calendar-clock" size={iconSize} color="#2563EB" />
    </View>
  );
}

/**
 * $1,000 Property Damage Insurance Umbrella
 * Built with pure React Native primitives.
 */
export function DamageCoverUmbrellaSvg({ size = 44 }: SvgProps) {
  const outerSize = size;
  const iconSize = Math.round(size * 0.52);

  return (
    <View
      style={[
        styles.center,
        {
          width: outerSize,
          height: outerSize,
          borderRadius: 14,
          backgroundColor: '#ECFEFF',
          borderWidth: 1.5,
          borderColor: '#A5F3FC',
        },
      ]}
    >
      <MaterialCommunityIcons name="umbrella-beach" size={iconSize} color="#0891B2" />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
