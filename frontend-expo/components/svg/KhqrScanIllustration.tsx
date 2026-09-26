import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface ScanProps {
  width?: number;
  height?: number;
}

/**
 * High-clarity Phone Scanning QR Code Illustration
 * Built with pure React Native primitives to avoid Fabric New Architecture "topSvgLayout" crashes.
 */
export function PhoneScanIllustrationSvg({ width = 220, height = 90 }: ScanProps) {
  return (
    <View style={[styles.container, { width, height }]}>
      {/* Phone Silhouette */}
      <View style={styles.phoneBox}>
        <View style={styles.dynamicIsland} />
        <View style={styles.reticle}>
          <MaterialCommunityIcons name="qrcode-scan" size={28} color="#38BDF8" />
        </View>
        <View style={styles.scanLine} />
      </View>

      {/* Optical Optical Beam Dots */}
      <View style={styles.beamRow}>
        <View style={styles.beamDot} />
        <View style={[styles.beamDot, { opacity: 0.6 }]} />
        <View style={[styles.beamDot, { opacity: 0.3 }]} />
      </View>

      {/* Target QR Mockup */}
      <View style={styles.targetQrBox}>
        <MaterialCommunityIcons name="qrcode" size={44} color="#0F172A" />
      </View>

      {/* Partner Bank Dot Stack */}
      <View style={styles.bankStack}>
        <View style={[styles.miniBankDot, { backgroundColor: '#002B49' }]}>
          <Text style={styles.miniBankText}>ABA</Text>
        </View>
        <View style={[styles.miniBankDot, { backgroundColor: '#D9222A' }]}>
          <Text style={styles.miniBankText}>KH</Text>
        </View>
        <View style={[styles.miniBankDot, { backgroundColor: '#84CC16' }]}>
          <Text style={styles.miniBankText}>W</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  phoneBox: {
    width: 44,
    height: 72,
    backgroundColor: '#0F172A',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  dynamicIsland: {
    position: 'absolute',
    top: 4,
    width: 14,
    height: 3,
    backgroundColor: '#475569',
    borderRadius: 2,
  },
  reticle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanLine: {
    position: 'absolute',
    left: 4,
    right: 4,
    height: 1.5,
    backgroundColor: '#EF4444',
  },
  beamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  beamDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#38BDF8',
  },
  targetQrBox: {
    width: 54,
    height: 54,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankStack: {
    gap: 5,
  },
  miniBankDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  miniBankText: {
    color: '#FFFFFF',
    fontSize: 7,
    fontWeight: '900',
  },
});
