import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';

interface SearchIllustrationProps {
  size?: number;
}

/**
 * Modern Empty Search Discovery Illustration
 * Built with pure React Native primitives to avoid Fabric New Architecture "topSvgLayout" crashes.
 */
export function SearchDiscoverySvg({ size = 110 }: SearchIllustrationProps) {
  const outerSize = size;
  const innerSize = Math.round(size * 0.72);
  const iconSize = Math.round(size * 0.42);

  return (
    <View style={[styles.center, { width: outerSize, height: outerSize }]}>
      {/* Soft Blue Radial Background */}
      <View
        style={[
          styles.center,
          {
            width: outerSize,
            height: outerSize,
            borderRadius: outerSize / 2,
            backgroundColor: '#EEF2FF',
            borderWidth: 1.5,
            borderColor: '#E0E7FF',
            position: 'relative',
          },
        ]}
      >
        {/* Floating Sparkle Stars */}
        <View style={styles.sparkleTopLeft}>
          <MaterialCommunityIcons name="star-four-points" size={16} color="#F59E0B" />
        </View>
        <View style={styles.sparkleTopRight}>
          <MaterialCommunityIcons name="star-four-points" size={14} color="#6366F1" />
        </View>
        <View style={styles.sparkleBottomRight}>
          <View style={styles.dotGreen} />
        </View>

        {/* Central Magnifying Glass Lens */}
        <View
          style={[
            styles.center,
            {
              width: innerSize,
              height: innerSize,
              borderRadius: innerSize / 2,
              backgroundColor: '#FFFFFF',
              shadowColor: '#4F46E5',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.12,
              shadowRadius: 10,
              elevation: 4,
              borderWidth: 2,
              borderColor: '#C7D2FE',
            },
          ]}
        >
          <MaterialIcons name="search" size={iconSize} color="#4F46E5" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkleTopLeft: {
    position: 'absolute',
    top: 14,
    left: 18,
  },
  sparkleTopRight: {
    position: 'absolute',
    top: 20,
    right: 18,
  },
  sparkleBottomRight: {
    position: 'absolute',
    bottom: 18,
    right: 24,
  },
  dotGreen: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
});
