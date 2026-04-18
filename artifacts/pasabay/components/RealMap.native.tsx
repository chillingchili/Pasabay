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
  onRegionChangeComplete?: (region: Region) => void;
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
  onRegionChangeComplete,
  onMapPress,
  style,
}: RealMapProps) {
  const colors = useColors();
  const mapRef = useRef<any>(null);
  const [region, setRegion] = useState<Region>(initialRegion ?? DEFAULT_REGION);

  useEffect(() => {
    if (centerOn) {
      const newRegion: Region = {
        latitude: centerOn.lat,
        longitude: centerOn.lng,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      };
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 500);
      return;
    }

    const points: MapPoint[] = [];
    if (userLocation) points.push(userLocation);
    if (pickupPoint) points.push(pickupPoint);
    if (dropoffPoint) points.push(dropoffPoint);
    if (driverLocation) points.push(driverLocation);
    if (routePolyline?.length) {
      routePolyline.forEach((p) => points.push(p));
    }

    if (points.length > 0) {
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
      mapRef.current?.animateToRegion(newRegion, 500);
    }
  }, [centerOn, userLocation, pickupPoint, dropoffPoint, driverLocation, routePolyline]);

  return (
    <View style={[StyleSheet.absoluteFill, style]}>
      <MapView
        ref={mapRef}
        provider={Platform.OS === "ios" ? undefined : PROVIDER_DEFAULT}
        style={StyleSheet.absoluteFill}
        region={region}
        onRegionChangeComplete={onRegionChangeComplete}
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
