import React, { useEffect, useRef, useState, useCallback } from "react";
import { StyleSheet, View, Text } from "react-native";
import type { MapPoint } from "./WebMap";
import type { Region } from "react-native-maps";

interface RealMapProps {
  showRoute?: boolean;
  routePolyline?: MapPoint[];
  pickupPoint?: MapPoint;
  dropoffPoint?: MapPoint;
  userLocation?: MapPoint;
  driverLocation?: MapPoint;
  centerOn?: MapPoint;
  initialRegion?: Region;
  onRegionChangeComplete?: (region: Region) => void;
  onMapPress?: (event: any) => void;
  style?: object;
}

export function RealMap(props: RealMapProps) {
  const [WebMapComponent, setWebMapComponent] = useState<React.ComponentType<any> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    import("./WebMap")
      .then((mod) => setWebMapComponent(() => mod.WebMap))
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>Map failed to load: {error}</Text>
      </View>
    );
  }

  if (!WebMapComponent) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, props.style]}>
      <WebMapComponent {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#666",
    fontSize: 14,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 14,
    padding: 16,
  },
});
