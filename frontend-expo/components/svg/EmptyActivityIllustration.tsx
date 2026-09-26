import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Theme } from '@/constants/theme';

const T = Theme.colors;

const POP_SHADOW = Platform.select({
  ios: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 12 },
  android: { elevation: 4 },
});

interface Props {
  activeTab?: 'upcoming' | 'past' | 'cancelled';
  size?: number;
}

export function EmptyActivitySvg({ activeTab = 'upcoming', size = 160 }: Props) {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -8, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleAnim, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(sparkleAnim, { toValue: 0.3, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, [floatAnim, sparkleAnim]);

  const mainColor = activeTab === 'upcoming' ? T.accent : activeTab === 'past' ? (T.blue || '#2563EB') : T.text3;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Background Soft Glow Ring */}
      <View style={[styles.glowRing, { backgroundColor: mainColor + '12' }]} />

      {/* Main Clipboard Container */}
      <Animated.View style={[styles.clipboard, POP_SHADOW, { transform: [{ translateY: floatAnim }] }]}>
        {/* Top Metallic Clip */}
        <View style={styles.clipHead}>
          <View style={styles.clipHole} />
        </View>

        {/* Paper Surface with checklist lines */}
        <View style={styles.paperContent}>
          <View style={styles.checkLine}>
            <View style={[styles.checkCircle, { backgroundColor: mainColor }]}>
              <MaterialCommunityIcons name="check" size={10} color="#FFFFFF" />
            </View>
            <View style={[styles.lineText, { width: 50, backgroundColor: mainColor + '30' }]} />
          </View>

          <View style={styles.checkLine}>
            <View style={[styles.checkCircle, { backgroundColor: '#E2E8F0' }]}>
              <MaterialCommunityIcons name="clock-outline" size={10} color="#94A3B8" />
            </View>
            <View style={[styles.lineText, { width: 42, backgroundColor: '#E2E8F0' }]} />
          </View>

          <View style={styles.checkLine}>
            <View style={[styles.checkCircle, { backgroundColor: '#F1F5F9' }]} />
            <View style={[styles.lineText, { width: 34, backgroundColor: '#F1F5F9' }]} />
          </View>
        </View>
      </Animated.View>

      {/* Floating Sparkle Star 1 */}
      <Animated.View style={[styles.sparkle1, { opacity: sparkleAnim }]}>
        <MaterialCommunityIcons name="star-four-points" size={20} color="#F59E0B" />
      </Animated.View>

      {/* Floating Sparkle Star 2 */}
      <Animated.View style={[styles.sparkle2, { opacity: sparkleAnim }]}>
        <MaterialCommunityIcons name="star-four-points" size={14} color={T.accent} />
      </Animated.View>

      {/* Floating Mini Calendar Tag */}
      <View style={[styles.calendarTag, POP_SHADOW]}>
        <MaterialCommunityIcons
          name={activeTab === 'upcoming' ? 'calendar-plus' : activeTab === 'past' ? 'calendar-check' : 'calendar-remove'}
          size={16}
          color={mainColor}
        />
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
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  clipboard: {
    width: 100,
    height: 120,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    paddingTop: 16,
    paddingHorizontal: 12,
  },
  clipHead: {
    position: 'absolute',
    top: -8,
    width: 44,
    height: 16,
    backgroundColor: '#475569',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clipHole: {
    width: 18,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  paperContent: {
    width: '100%',
    gap: 12,
    marginTop: 6,
  },
  checkLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lineText: {
    height: 6,
    borderRadius: 3,
  },
  sparkle1: {
    position: 'absolute',
    top: 8,
    right: 12,
  },
  sparkle2: {
    position: 'absolute',
    bottom: 16,
    left: 10,
  },
  calendarTag: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
