import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, Easing, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Props {
  size?: number;
}

const HEART_SHADOW = Platform.select({
  ios: { shadowColor: '#F43F5E', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 12 },
  android: { elevation: 4 },
});

export function EmptySavedSvg({ size = 110 }: Props) {
  const outerSize = size;
  const heartSize = Math.round(size * 0.65);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, [pulseAnim]);

  return (
    <View style={[styles.container, { width: outerSize, height: outerSize }]}>
      {/* Soft Rose Background Ring */}
      <View
        style={[
          styles.outerRing,
          {
            width: outerSize,
            height: outerSize,
            borderRadius: outerSize / 2,
          },
        ]}
      >
        {/* Floating Sparkles */}
        <View style={styles.sparkleTopLeft}>
          <MaterialCommunityIcons name="star-four-points" size={14} color="#FB7185" />
        </View>
        <View style={styles.sparkleTopRight}>
          <MaterialCommunityIcons name="star-four-points" size={16} color="#F59E0B" />
        </View>
        <View style={styles.sparkleBottom}>
          <View style={styles.dotPurple} />
        </View>

        {/* Pulsing Central Heart Badge */}
        <Animated.View
          style={[
            styles.heartBox,
            HEART_SHADOW,
            {
              width: heartSize,
              height: heartSize,
              borderRadius: heartSize / 2,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <MaterialCommunityIcons name="heart-outline" size={heartSize * 0.52} color="#E11D48" />

          {/* Mini Bookmark Ribbon */}
          <View style={styles.bookmarkBadge}>
            <MaterialCommunityIcons name="bookmark-outline" size={10} color="#FFFFFF" />
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    backgroundColor: '#FFF1F2',
    borderWidth: 1.5,
    borderColor: '#FFE4E6',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  heartBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#FECDD3',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bookmarkBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#E11D48',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  sparkleTopLeft: {
    position: 'absolute',
    top: 14,
    left: 14,
  },
  sparkleTopRight: {
    position: 'absolute',
    top: 16,
    right: 14,
  },
  sparkleBottom: {
    position: 'absolute',
    bottom: 14,
    left: 20,
  },
  dotPurple: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8B5CF6',
  },
});
