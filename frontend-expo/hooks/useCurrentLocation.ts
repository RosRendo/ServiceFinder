import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

const DEFAULT_LOC = { latitude: 11.5564, longitude: 104.9282 };

const isSimulatorLocation = (lat: number, lng: number) => {
  // Android Emulator default: ~37.422, -122.084 (Google Mountain View)
  // iOS Simulator default: ~37.785, -122.406 (San Francisco) or ~37.332, -122.030 (Cupertino)
  const isAndroidEmu = Math.abs(lat - 37.422) < 0.2 && Math.abs(lng - (-122.084)) < 0.2;
  const isIosEmu = (Math.abs(lat - 37.785) < 0.3 && Math.abs(lng - (-122.406)) < 0.3) ||
                   (Math.abs(lat - 37.332) < 0.3 && Math.abs(lng - (-122.030)) < 0.3);
  return isAndroidEmu || isIosEmu;
};

export function useCurrentLocation(requestOnMount = true) {
  const [location, setLocation] = useState(DEFAULT_LOC);
  const [loadingLocation, setLoadingLocation] = useState(requestOnMount);
  const [locationError, setLocationError] = useState<string | null>(null);

  const fetchLocation = async () => {
    try {
      setLoadingLocation(true);
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Permission to access location was denied');
        return DEFAULT_LOC;
      }

      let loc = await Location.getLastKnownPositionAsync();
      if (!loc) {
        loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      }
      
      const rawLat = loc.coords.latitude;
      const rawLng = loc.coords.longitude;

      // If emulator is in default US West Coast coordinates, stick to Phnom Penh Metro
      if (isSimulatorLocation(rawLat, rawLng)) {
        setLocation(DEFAULT_LOC);
        return DEFAULT_LOC;
      }

      const newLoc = { latitude: rawLat, longitude: rawLng };
      setLocation(newLoc);
      return newLoc;
    } catch (err: any) {
      setLocationError(err.message || 'Failed to fetch location');
      return DEFAULT_LOC;
    } finally {
      setLoadingLocation(false);
    }
  };

  useEffect(() => {
    if (requestOnMount) {
      fetchLocation();
    }
  }, [requestOnMount]);

  return { location, loadingLocation, locationError, fetchLocation };
}
