import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface CategoryMarkProps {
  size?: number;
}

const BRAND_NAVY = '#0A192F';
const NEUTRAL_HALO = '#F1F5F9';

/**
 * Refined, calm luxury category marks.
 * Unified design system: Crisp white background, subtle slate-100 halo,
 * and consistent signature brand Navy icons (#0A192F) across all categories.
 * Eliminates rainbow visual noise for a cohesive, executive aesthetic.
 */
export function AirconCategorySvg({ size = 60 }: CategoryMarkProps) {
  const haloSize = Math.round(size * 0.72);
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View style={[styles.halo, { width: haloSize, height: haloSize, borderRadius: haloSize / 2 }]}>
        <MaterialCommunityIcons name="air-conditioner" size={Math.round(size * 0.42)} color={BRAND_NAVY} />
      </View>
    </View>
  );
}

export function PlumbingCategorySvg({ size = 60 }: CategoryMarkProps) {
  const haloSize = Math.round(size * 0.72);
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View style={[styles.halo, { width: haloSize, height: haloSize, borderRadius: haloSize / 2 }]}>
        <MaterialCommunityIcons name="pipe-wrench" size={Math.round(size * 0.42)} color={BRAND_NAVY} />
      </View>
    </View>
  );
}

export function CleaningCategorySvg({ size = 60 }: CategoryMarkProps) {
  const haloSize = Math.round(size * 0.72);
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View style={[styles.halo, { width: haloSize, height: haloSize, borderRadius: haloSize / 2 }]}>
        <MaterialCommunityIcons name="broom" size={Math.round(size * 0.42)} color={BRAND_NAVY} />
      </View>
    </View>
  );
}

export function ElectricianCategorySvg({ size = 60 }: CategoryMarkProps) {
  const haloSize = Math.round(size * 0.72);
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View style={[styles.halo, { width: haloSize, height: haloSize, borderRadius: haloSize / 2 }]}>
        <MaterialCommunityIcons name="lightning-bolt" size={Math.round(size * 0.42)} color={BRAND_NAVY} />
      </View>
    </View>
  );
}

export function HandymanCategorySvg({ size = 60 }: CategoryMarkProps) {
  const haloSize = Math.round(size * 0.72);
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View style={[styles.halo, { width: haloSize, height: haloSize, borderRadius: haloSize / 2 }]}>
        <MaterialCommunityIcons name="hammer-wrench" size={Math.round(size * 0.42)} color={BRAND_NAVY} />
      </View>
    </View>
  );
}

export function MovingCategorySvg({ size = 60 }: CategoryMarkProps) {
  const haloSize = Math.round(size * 0.72);
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View style={[styles.halo, { width: haloSize, height: haloSize, borderRadius: haloSize / 2 }]}>
        <MaterialCommunityIcons name="truck-fast" size={Math.round(size * 0.42)} color={BRAND_NAVY} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    backgroundColor: NEUTRAL_HALO,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
