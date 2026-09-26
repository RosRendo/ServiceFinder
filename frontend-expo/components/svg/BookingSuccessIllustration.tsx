import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Theme } from '@/constants/theme';

const T = Theme.colors;

const POP_SHADOW = Platform.select({
  ios: { shadowColor: '#10B981', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16 },
  android: { elevation: 6 },
});

interface Props {
  size?: number;
}

export function BookingSuccessSvg({ size = 160 }: Props) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 40, useNativeDriver: true }),
      Animated.timing(rotateAnim, { toValue: 1, duration: 800, easing: Easing.out(Easing.back(1.5)), useNativeDriver: true }),
    ]).start();
  }, [scaleAnim, rotateAnim]);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Background Radiance Ring */}
      <View style={styles.radianceRing} />

      {/* Confetti Particles */}
      <View style={[styles.confetti, { top: 15, left: 20, backgroundColor: '#F59E0B' }]} />
      <View style={[styles.confetti, { top: 20, right: 25, backgroundColor: '#38BDF8' }]} />
      <View style={[styles.confetti, { bottom: 25, left: 25, backgroundColor: '#EC4899' }]} />
      <View style={[styles.confetti, { bottom: 20, right: 20, backgroundColor: '#10B981' }]} />
      <View style={[styles.confetti, { top: 45, right: 10, backgroundColor: '#8B5CF6' }]} />

      {/* Main Success Shield */}
      <Animated.View style={[styles.shieldBox, POP_SHADOW, { transform: [{ scale: scaleAnim }] }]}>
        <MaterialCommunityIcons name="check-bold" size={44} color="#FFFFFF" />
      </Animated.View>

      {/* Verified Stamp Ribbon */}
      <View style={styles.verifiedRibbon}>
        <MaterialCommunityIcons name="shield-check" size={12} color="#047857" style={{ marginRight: 3 }} />
        <Text style={styles.ribbonText}>CONFIRMED</Text>
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
  radianceRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#10B98115',
  },
  shieldBox: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  verifiedRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginTop: 8,
  },
  ribbonText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#047857',
    letterSpacing: 0.5,
  },
  confetti: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
