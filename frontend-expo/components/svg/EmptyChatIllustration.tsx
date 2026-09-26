import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, Easing, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Theme } from '@/constants/theme';

const T = Theme.colors;

const POP_SHADOW = Platform.select({
  ios: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 14 },
  android: { elevation: 5 },
});

interface Props {
  size?: number;
}

export function EmptyChatSvg({ size = 160 }: Props) {
  const planeAnim = useRef(new Animated.Value(0)).current;
  const bubbleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(planeAnim, { toValue: -10, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(planeAnim, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(bubbleAnim, { toValue: -5, duration: 2400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(bubbleAnim, { toValue: 0, duration: 2400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, [planeAnim, bubbleAnim]);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Background Soft Glow */}
      <View style={[styles.glowRing, { backgroundColor: T.accent + '15' }]} />

      {/* Main Chat Bubble */}
      <Animated.View style={[styles.mainBubble, POP_SHADOW, { transform: [{ translateY: bubbleAnim }] }]}>
        <View style={styles.bubbleDotsRow}>
          <View style={[styles.chatDot, { backgroundColor: T.accent }]} />
          <View style={[styles.chatDot, { backgroundColor: T.accent + '80' }]} />
          <View style={[styles.chatDot, { backgroundColor: T.accent + '40' }]} />
        </View>
      </Animated.View>

      {/* Smaller Echo Bubble */}
      <View style={[styles.secondaryBubble, POP_SHADOW]}>
        <MaterialCommunityIcons name="heart" size={14} color="#EF4444" />
      </View>

      {/* Flying Paper Plane */}
      <Animated.View style={[styles.planeBox, POP_SHADOW, { transform: [{ translateY: planeAnim }] }]}>
        <MaterialCommunityIcons name="send" size={24} color="#FFFFFF" style={{ transform: [{ rotate: '-25deg' }] }} />
      </Animated.View>

      {/* Floating Sparkle */}
      <View style={styles.sparkle}>
        <MaterialCommunityIcons name="star-four-points" size={16} color="#F59E0B" />
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
  mainBubble: {
    width: 90,
    height: 70,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chatDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  secondaryBubble: {
    position: 'absolute',
    bottom: 20,
    left: 15,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planeBox: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: T.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkle: {
    position: 'absolute',
    top: 25,
    left: 20,
  },
});
