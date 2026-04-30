import { Platform } from "react-native";
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
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        if (Platform.OS === "web") {
          const isSecure = window.isSecureContext;
          if (!isSecure) {
            setLocationError(
              "Geolocation requires HTTPS. Access this app via HTTPS or localhost.",
            );
            setLocation({ lat: 10.3535, lng: 123.9135, accuracy: null });
            setLoading(false);
            return;
          }
        }

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setPermissionGranted(false);
          setLocationError("Location permission denied. Enable it in your browser/device settings.");
          setLocation({ lat: 10.3535, lng: 123.9135, accuracy: null });
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
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setLocationError(msg);
        console.error("[useLocation]", msg);
        setLocation({ lat: 10.3535, lng: 123.9135, accuracy: null });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { location, permissionGranted, loading, locationError };
}
