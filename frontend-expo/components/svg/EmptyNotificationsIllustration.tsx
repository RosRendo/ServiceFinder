import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, Easing, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Props {
  size?: number;
}

const BELL_SHADOW = Platform.select({
  ios: { shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 12 },
  android: { elevation: 4 },
});

export function EmptyNotificationsSvg({ size = 110 }: Props) {
  const outerSize = size;
  const bellSize = Math.round(size * 0.65);
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -6, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, [floatAnim]);

  return (
    <View style={[styles.container, { width: outerSize, height: outerSize }]}>
      {/* Soft Indigo Ring */}
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
          <MaterialCommunityIcons name="star-four-points" size={15} color="#60A5FA" />
        </View>
        <View style={styles.sparkleTopRight}>
          <MaterialCommunityIcons name="star-four-points" size={13} color="#F59E0B" />
        </View>
        <View style={styles.sparkleBottom}>
          <View style={styles.dotTeal} />
        </View>

        {/* Floating Central Bell Shield */}
        <Animated.View
          style={[
            styles.bellBox,
            BELL_SHADOW,
            {
              width: bellSize,
              height: bellSize,
              borderRadius: bellSize / 2,
              transform: [{ translateY: floatAnim }],
            },
          ]}
        >
          <MaterialCommunityIcons name="bell-ring-outline" size={bellSize * 0.52} color="#2563EB" />

          {/* Mini Check Badge */}
          <View style={styles.checkBadge}>
            <MaterialCommunityIcons name="check" size={11} color="#FFFFFF" />
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
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  checkBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#10B981',
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
    bottom: 12,
    left: 20,
  },
  dotTeal: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0D9488',
  },
});
