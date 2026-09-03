import { Platform } from 'react-native';
import { PROVIDER_GOOGLE } from 'react-native-maps';
import type MapView from 'react-native-maps';

export const hasValidGoogleMapsKey = 
  !!process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY && 
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY !== 'AIza_placeholder_for_maps';

// On Android, always default to PROVIDER_GOOGLE. On iOS, only use PROVIDER_GOOGLE if a valid key is set, otherwise fallback to Apple Maps (undefined provider = $0 cost)
export const MAP_PROVIDER = (Platform.OS === 'android' || hasValidGoogleMapsKey) ? PROVIDER_GOOGLE : undefined;

export interface Coordinate {
  latitude: number;
  longitude: number;
}

/**
 * Frames the map viewport to fit both customer and provider coordinates with smooth padding
 */
export function fitDualCoordinates(
  mapRef: React.RefObject<MapView | null>,
  coordA: Coordinate,
  coordB: Coordinate,
  padding: { top?: number; right?: number; bottom?: number; left?: number } = {}
) {
  if (!mapRef.current) return;
  mapRef.current.fitToCoordinates([coordA, coordB], {
    edgePadding: {
      top: padding.top ?? 80,
      right: padding.right ?? 60,
      bottom: padding.bottom ?? 240, // accommodate bottom sheet
      left: padding.left ?? 60,
    },
    animated: true,
  });
}

/**
 * Smoothly centers map on a specific coordinate with configurable zoom level (delta)
 */
export function centerMapCamera(
  mapRef: React.RefObject<MapView | null>,
  coord: Coordinate,
  delta: number = 0.02,
  duration: number = 800
) {
  if (!mapRef.current) return;
  mapRef.current.animateToRegion({
    latitude: coord.latitude,
    longitude: coord.longitude,
    latitudeDelta: delta,
    longitudeDelta: delta,
  }, duration);
}
