import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, Easing, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Props {
  size?: number;
}

const STAR_SHADOW = Platform.select({
  ios: { shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 12 },
  android: { elevation: 4 },
});

export function EmptyReviewsSvg({ size = 110 }: Props) {
  const outerSize = size;
  const starBoxSize = Math.round(size * 0.65);
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -6, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, [floatAnim]);

  return (
    <View style={[styles.container, { width: outerSize, height: outerSize }]}>
      {/* Soft Gold/Amber Background Ring */}
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
          <MaterialCommunityIcons name="star-four-points" size={14} color="#FBBF24" />
        </View>
        <View style={styles.sparkleTopRight}>
          <MaterialCommunityIcons name="star-four-points" size={16} color="#F59E0B" />
        </View>
        <View style={styles.sparkleBottom}>
          <View style={styles.dotGold} />
        </View>

        {/* Central Floating Star Badge */}
        <Animated.View
          style={[
            styles.starBox,
            STAR_SHADOW,
            {
              width: starBoxSize,
              height: starBoxSize,
              borderRadius: starBoxSize / 2,
              transform: [{ translateY: floatAnim }],
            },
          ]}
        >
          <MaterialCommunityIcons name="star" size={starBoxSize * 0.52} color="#D97706" />

          {/* Mini Pencil Badge */}
          <View style={styles.pencilBadge}>
            <MaterialCommunityIcons name="pencil" size={10} color="#FFFFFF" />
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
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  starBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pencilBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#D97706',
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
  dotGold: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
  },
});
