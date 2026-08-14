import { Platform } from 'react-native';
import { PROVIDER_GOOGLE } from 'react-native-maps';

export const hasValidGoogleMapsKey = 
  !!process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY && 
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY !== 'AIza_placeholder_for_maps';

// On Android, always default to PROVIDER_GOOGLE. On iOS, only use PROVIDER_GOOGLE if a valid key is set, otherwise fallback to Apple Maps (undefined provider)
export const MAP_PROVIDER = (Platform.OS === 'android' || hasValidGoogleMapsKey) ? PROVIDER_GOOGLE : undefined;
