import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface LogoProps {
  size?: number;
  width?: number;
  height?: number;
}

/**
 * Authentic ABA PayWay Badge
 * Built with pure React Native primitives to avoid Fabric New Architecture "topSvgLayout" crashes.
 */
export function AbaPayWaySvg({ width = 48, height = 32 }: LogoProps) {
  return (
    <View
      style={[
        styles.cardBase,
        {
          width,
          height,
          backgroundColor: '#002B49',
          borderWidth: 1,
          borderColor: '#004370',
        },
      ]}
    >
      <View style={styles.abaHeader}>
        <View style={styles.abaRedDot} />
        <Text style={styles.abaText}>ABA</Text>
      </View>
      <View style={styles.paywayPill}>
        <Text style={styles.paywayText}>PAYWAY</Text>
      </View>
    </View>
  );
}

/**
 * Authentic KHQR (Bakong) Badge
 * Built with pure React Native primitives.
 */
export function KhqrBakongSvg({ width = 48, height = 32 }: LogoProps) {
  return (
    <View
      style={[
        styles.cardBase,
        {
          width,
          height,
          backgroundColor: '#D9222A',
          borderWidth: 1,
          borderColor: '#B91C1C',
        },
      ]}
    >
      <Text style={styles.khqrText}>KHQR</Text>
      <View style={styles.bakongPill}>
        <Text style={styles.bakongText}>BAKONG</Text>
      </View>
    </View>
  );
}

/**
 * Authentic Wing Bank Badge
 * Built with pure React Native primitives.
 */
export function WingBankSvg({ width = 48, height = 32 }: LogoProps) {
  return (
    <View
      style={[
        styles.cardBase,
        {
          width,
          height,
          backgroundColor: '#84CC16',
          borderWidth: 1,
          borderColor: '#65A30D',
        },
      ]}
    >
      <MaterialCommunityIcons name="feather" size={14} color="#FFFFFF" />
      <Text style={styles.wingText}>wing</Text>
    </View>
  );
}

/**
 * Escrow Protection Vault Shield
 * Built with pure React Native primitives.
 */
export function EscrowShieldSvg({ size = 38 }: { size?: number }) {
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
          borderWidth: 1,
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
          },
        ]}
      >
        <MaterialCommunityIcons name="shield-lock" size={iconSize} color="#FDE047" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardBase: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    paddingHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  abaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  abaRedDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#EE2737',
  },
  abaText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  paywayPill: {
    backgroundColor: '#00A3E0',
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginTop: 1,
  },
  paywayText: {
    fontSize: 5,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  khqrText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  bakongPill: {
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginTop: 1,
  },
  bakongText: {
    fontSize: 5,
    fontWeight: '900',
    color: '#D9222A',
    letterSpacing: 0.5,
  },
  wingText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: -1,
  },
});
