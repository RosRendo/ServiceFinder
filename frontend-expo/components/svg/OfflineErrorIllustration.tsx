import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, Easing, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Theme } from '@/constants/theme';

const T = Theme.colors;

const POP_SHADOW = Platform.select({
  ios: { shadowColor: '#EF4444', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 14 },
  android: { elevation: 5 },
});

interface Props {
  size?: number;
}

export function OfflineErrorSvg({ size = 140 }: Props) {
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -8, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, [floatAnim]);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Background Soft Red Glow */}
      <View style={styles.glowRing} />

      {/* Main Cloud Card */}
      <Animated.View style={[styles.cloudBox, POP_SHADOW, { transform: [{ translateY: floatAnim }] }]}>
        <MaterialCommunityIcons name="cloud-off-outline" size={48} color="#EF4444" />
      </Animated.View>

      {/* Crossed Signal Antenna Tag */}
      <View style={[styles.signalTag, POP_SHADOW]}>
        <MaterialCommunityIcons name="wifi-off" size={16} color="#FFFFFF" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glowRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#EF444415',
  },
  cloudBox: {
    width: 84,
    height: 84,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signalTag: {
    position: 'absolute',
    bottom: 12,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});
