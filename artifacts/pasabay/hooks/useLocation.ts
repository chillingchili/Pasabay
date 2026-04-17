import { useState, useEffect } from "react";
import * as Location from "expo-location";

interface LocationData {
  lat: number;
  lng: number;
  accuracy: number | null;
}

export function useLocation() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setPermissionGranted(false);
          setLocation({ lat: 10.3157, lng: 123.9030, accuracy: null });
          setLoading(false);
          return;
        }

        setPermissionGranted(true);
        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setLocation({
          lat: current.coords.latitude,
          lng: current.coords.longitude,
          accuracy: current.coords.accuracy,
        });

        const subscription = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, timeInterval: 5000, distanceInterval: 10 },
          (loc) => {
            setLocation({
              lat: loc.coords.latitude,
              lng: loc.coords.longitude,
              accuracy: loc.coords.accuracy,
            });
          }
        );

        return () => subscription.remove();
      } catch {
        setLocation({ lat: 10.3157, lng: 123.9030, accuracy: null });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { location, permissionGranted, loading };
}
