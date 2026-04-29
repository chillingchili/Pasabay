import React, { useEffect, useRef } from "react";
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
  fitRouteKey?: number;
  recenterKey?: number;
  onRegionChangeComplete?: (region: Region) => void;
  onUserDrag?: () => void;
  onMapPress?: (event: any) => void;
  style?: object;
  bottomInset?: number;
}

const DEFAULT_REGION: Region = {
  latitude: 10.3535,
  longitude: 123.9135,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

/** Fit map to show all given points, accounting for bottom sheet overlay */
function fitMapToPoints(
  mapRef: React.MutableRefObject<any>,
  points: MapPoint[],
  bottomInset: number = 0,
) {
  if (points.length === 0) return;
  if (points.length === 1) {
    mapRef.current?.animateToRegion(
      { latitude: points[0].lat, longitude: points[0].lng, latitudeDelta: 0.015, longitudeDelta: 0.015 },
      500,
    );
    return;
  }
  const coords = points.map((p) => ({ latitude: p.lat, longitude: p.lng }));
  const edgePadding = {
    top: 50,
    right: 50,
    bottom: bottomInset + 50,
    left: 50,
  };
  mapRef.current?.fitToCoordinates(coords, { edgePadding, animated: true });
}

export function RealMap({
  showRoute = false,
  routePolyline,
  pickupPoint,
  dropoffPoint,
  userLocation,
  driverLocation,
  fitRouteKey,
  recenterKey,
  onRegionChangeComplete,
  onUserDrag,
  onMapPress,
  style,
  bottomInset,
}: RealMapProps) {
  const colors = useColors();
  const mapRef = useRef<any>(null);
  const isAnimating = useRef(false);
  const hasCenteredRef = useRef(false);
  const lastFittedKeyRef = useRef(0);

  // Center on user location once on first GPS fix (uncontrolled map)
  useEffect(() => {
    if (!userLocation || hasCenteredRef.current) return;
    hasCenteredRef.current = true;
    isAnimating.current = true;
    mapRef.current?.animateToRegion(
      { latitude: userLocation.lat, longitude: userLocation.lng, latitudeDelta: 0.015, longitudeDelta: 0.015 },
      500,
    );
    setTimeout(() => { isAnimating.current = false; }, 600);
  }, [userLocation]);

  // When a route becomes available (destination selected), fit to endpoint markers.
  // Reset lastFittedKeyRef so the polyline-arrival effect can refit once with full route data.
  useEffect(() => {
    if (!fitRouteKey) return;
    lastFittedKeyRef.current = 0;
    const points: MapPoint[] = [];
    if (pickupPoint) points.push(pickupPoint);
    if (dropoffPoint) points.push(dropoffPoint);
    if (routePolyline && routePolyline.length > 0) {
      routePolyline.forEach((p) => points.push(p));
    }
    if (points.length === 0) return;

    isAnimating.current = true;
    fitMapToPoints(mapRef, points, bottomInset ?? 0);
    setTimeout(() => { isAnimating.current = false; }, 600);
  }, [fitRouteKey]);

  // When route polyline data arrives asynchronously, refit map to show the full road path.
  // Only refit ONCE per destination change (guarded by lastFittedKeyRef, reset by fitRouteKey).
  useEffect(() => {
    if (!routePolyline || routePolyline.length < 2) return;
    if (lastFittedKeyRef.current >= (fitRouteKey ?? 0)) return;
    lastFittedKeyRef.current = fitRouteKey ?? 0;

    const allPoints: MapPoint[] = [...routePolyline];
    if (pickupPoint) allPoints.push(pickupPoint);
    if (dropoffPoint) allPoints.push(dropoffPoint);

    isAnimating.current = true;
    fitMapToPoints(mapRef, allPoints, bottomInset ?? 0);
    setTimeout(() => { isAnimating.current = false; }, 600);
  }, [routePolyline, pickupPoint, dropoffPoint, fitRouteKey]);

  // Manual recenter button: show the full route (or user location if no route)
  useEffect(() => {
    if (recenterKey === undefined || recenterKey <= 0) return;
    const routePoints: MapPoint[] = [];
    if (pickupPoint) routePoints.push(pickupPoint);
    if (dropoffPoint) routePoints.push(dropoffPoint);
    if (routePolyline && routePolyline.length > 0) {
      routePolyline.forEach((p) => routePoints.push(p));
    }

    isAnimating.current = true;
    if (routePoints.length >= 2) {
      fitMapToPoints(mapRef, routePoints, bottomInset ?? 0);
    } else if (userLocation) {
      mapRef.current?.animateToRegion(
        { latitude: userLocation.lat, longitude: userLocation.lng, latitudeDelta: 0.015, longitudeDelta: 0.015 },
        500,
      );
    }
    setTimeout(() => { isAnimating.current = false; }, 600);
  }, [recenterKey]);

  // Detect user drag — notify parent (map is uncontrolled, so no state fight)
  const handleRegionChangeComplete = (newRegion: Region) => {
    if (!isAnimating.current) {
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
        initialRegion={DEFAULT_REGION}
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
