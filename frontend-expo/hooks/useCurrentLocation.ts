import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

const DEFAULT_LOC = { latitude: 11.5564, longitude: 104.9282 };

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

      // Use Balanced accuracy for faster resolution since we just need roughly the right neighborhood
      let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const newLoc = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
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
