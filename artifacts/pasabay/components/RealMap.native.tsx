import React, { useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_DEFAULT, type Region } from "react-native-maps";
import { useColors } from "@/hooks/useColors";

export interface MapPoint {
  lat: number;
  lng: number;
  name?: string;
}

interface RealMapProps {
  showRoute?: boolean;
  routePolyline?: MapPoint[];
  pickupPoint?: MapPoint;
  dropoffPoint?: MapPoint;
  userLocation?: MapPoint;
  driverLocation?: MapPoint;
  centerOn?: MapPoint;
  initialRegion?: Region;
  recenterKey?: number;
  onRegionChangeComplete?: (region: Region) => void;
  onUserDrag?: () => void;
  onMapPress?: (event: any) => void;
  style?: object;
}

const DEFAULT_REGION: Region = {
  latitude: 10.3157,
  longitude: 123.9030,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

export function RealMap({
  showRoute = false,
  routePolyline,
  pickupPoint,
  dropoffPoint,
  userLocation,
  driverLocation,
  centerOn,
  initialRegion,
  recenterKey,
  onRegionChangeComplete,
  onUserDrag,
  onMapPress,
  style,
}: RealMapProps) {
  const colors = useColors();
  const mapRef = useRef<any>(null);
  const [region, setRegion] = useState<Region>(initialRegion ?? DEFAULT_REGION);
  const [followUser, setFollowUser] = useState(true);
  const isAnimating = useRef(false);

  // Track initial centering to avoid recentering on every GPS update
  const hasCenteredRef = useRef(false);

  // Track destination coordinate changes (not object reference, since these are recreated each render)
  const prevCenterCoords = useRef<string | null>(centerOn ? `${centerOn.lat},${centerOn.lng}` : null);

  // Center map on initial load, then only on explicit destination changes
  useEffect(() => {
    const currentCoords = centerOn ? `${centerOn.lat},${centerOn.lng}` : null;
    const destinationChanged = currentCoords !== prevCenterCoords.current;
    prevCenterCoords.current = currentCoords;

    // Skip auto-centering if user has manually dragged and no destination change
    if (!followUser && !destinationChanged && hasCenteredRef.current) return;

    if (centerOn) {
      const newRegion: Region = {
        latitude: centerOn.lat,
        longitude: centerOn.lng,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      };
      setRegion(newRegion);
      isAnimating.current = true;
      mapRef.current?.animateToRegion(newRegion, 500);
      setTimeout(() => { isAnimating.current = false; }, 600);
      hasCenteredRef.current = true;
      return;
    }

    // On initial load, center on user location (only once)
    if (!hasCenteredRef.current && userLocation) {
      const newRegion: Region = {
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      };
      setRegion(newRegion);
      isAnimating.current = true;
      mapRef.current?.animateToRegion(newRegion, 500);
      setTimeout(() => { isAnimating.current = false; }, 600);
      hasCenteredRef.current = true;
      return;
    }

    const points: MapPoint[] = [];
    if (dropoffPoint) points.push(dropoffPoint);
    if (driverLocation) points.push(driverLocation);
    if (routePolyline?.length) {
      routePolyline.forEach((p) => points.push(p));
    }

    if (points.length > 0 && destinationChanged) {
      const lats = points.map((p) => p.lat);
      const lngs = points.map((p) => p.lng);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);
      const latDelta = (maxLat - minLat) * 1.5 + 0.005;
      const lngDelta = (maxLng - minLng) * 1.5 + 0.005;

      const newRegion: Region = {
        latitude: (minLat + maxLat) / 2,
        longitude: (minLng + maxLng) / 2,
        latitudeDelta: Math.max(latDelta, 0.01),
        longitudeDelta: Math.max(lngDelta, 0.01),
      };

      setRegion(newRegion);
      isAnimating.current = true;
      mapRef.current?.animateToRegion(newRegion, 500);
      setTimeout(() => { isAnimating.current = false; }, 600);
      hasCenteredRef.current = true;
    }
  }, [centerOn, dropoffPoint, driverLocation, routePolyline, userLocation]);

  // Recenter on user location when recenterKey changes (manual recenter button)
  useEffect(() => {
    if (recenterKey !== undefined && recenterKey > 0) {
      setFollowUser(true);
      const target = userLocation ?? centerOn;
      if (target) {
        const newRegion: Region = {
          latitude: target.lat,
          longitude: target.lng,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        };
        setRegion(newRegion);
        isAnimating.current = true;
        mapRef.current?.animateToRegion(newRegion, 500);
        setTimeout(() => { isAnimating.current = false; }, 600);
      }
    }
  }, [recenterKey]);

  // Detect user drag — stop following
  const handleRegionChangeComplete = (newRegion: Region) => {
    setRegion(newRegion);
    if (!isAnimating.current) {
      setFollowUser(false);
      onUserDrag?.();
    }
    onRegionChangeComplete?.(newRegion);
  };

  return (
    <View style={[StyleSheet.absoluteFill, style]}>
      <MapView
        ref={mapRef}
        provider={Platform.OS === "ios" ? undefined : PROVIDER_DEFAULT}
        style={StyleSheet.absoluteFill}
        region={region}
        onRegionChangeComplete={handleRegionChangeComplete}
        onPress={onMapPress}
        showsUserLocation={!!userLocation}
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        showsZoomControls={false}
        zoomEnabled
        scrollEnabled
        pitchEnabled={false}
        rotateEnabled={false}
        mapType="standard"
      >
        {showRoute && routePolyline && routePolyline.length > 1 && (
          <Polyline
            coordinates={routePolyline.map((p) => ({
              latitude: p.lat,
              longitude: p.lng,
            }))}
            strokeColor="#0D9E75"
            strokeWidth={4}
            lineCap="round"
            lineJoin="round"
          />
        )}

        {pickupPoint && (
          <Marker
            coordinate={{ latitude: pickupPoint.lat, longitude: pickupPoint.lng }}
            title={pickupPoint.name ?? "Pickup"}
          >
            <View style={styles.pickupMarker}>
              <View style={styles.pickupMarkerInner} />
            </View>
          </Marker>
        )}

        {dropoffPoint && (
          <Marker
            coordinate={{ latitude: dropoffPoint.lat, longitude: dropoffPoint.lng }}
            title={dropoffPoint.name ?? "Dropoff"}
          >
            <View style={styles.dropoffMarker}>
              <View style={styles.dropoffMarkerInner} />
            </View>
          </Marker>
        )}

        {driverLocation && (
          <Marker
            coordinate={{ latitude: driverLocation.lat, longitude: driverLocation.lng }}
            title="Driver"
          >
            <View style={styles.driverMarker}>
              <View style={styles.driverMarkerInner} />
            </View>
          </Marker>
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  pickupMarker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(59,130,246,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  pickupMarkerInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#3B82F6",
    borderWidth: 2,
    borderColor: "#fff",
  },
  dropoffMarker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(239,68,68,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  dropoffMarkerInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#EF4444",
    borderWidth: 2,
    borderColor: "#fff",
  },
  driverMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(13,158,117,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  driverMarkerInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#0D9E75",
    borderWidth: 2,
    borderColor: "#fff",
  },
});
