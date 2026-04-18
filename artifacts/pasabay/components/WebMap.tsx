import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import type { Region } from "react-native-maps";

export interface MapPoint {
  lat: number;
  lng: number;
  name?: string;
}

interface WebMapProps {
  showRoute?: boolean;
  routePolyline?: MapPoint[];
  pickupPoint?: MapPoint;
  dropoffPoint?: MapPoint;
  userLocation?: MapPoint;
  driverLocation?: MapPoint;
  centerOn?: MapPoint;
  initialRegion?: { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number };
  onMapPress?: (event: any) => void;
  style?: object;
}

const DEFAULT_CENTER: [number, number] = [10.3157, 123.9030];
const DEFAULT_ZOOM = 15;
let leafletLoaded = false;
let leafletLoading = false;
const loadCallbacks: Array<() => void> = [];

function loadLeaflet(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (leafletLoaded) { resolve(); return; }
    if (leafletLoading) { loadCallbacks.push(resolve); return; }
    leafletLoading = true;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    link.onload = () => {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = () => {
        leafletLoaded = true;
        leafletLoading = false;
        loadCallbacks.forEach((cb) => cb());
        resolve();
      };
      script.onerror = () => reject(new Error("Failed to load Leaflet JS"));
      document.head.appendChild(script);
    };
    link.onerror = () => reject(new Error("Failed to load Leaflet CSS"));
    document.head.appendChild(link);
  });
}

export function WebMap({
  showRoute = false,
  routePolyline,
  pickupPoint,
  dropoffPoint,
  userLocation,
  driverLocation,
  centerOn,
  initialRegion,
}: WebMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polylineRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadLeaflet()
      .then(() => setLoaded(true))
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!loaded || !containerRef.current || mapRef.current) return;
    const L = (window as any).L;
    const center: [number, number] = initialRegion
      ? [initialRegion.latitude, initialRegion.longitude]
      : DEFAULT_CENTER;
    const zoom = initialRegion
      ? Math.max(18 - Math.log2(Math.max(initialRegion.latitudeDelta, initialRegion.longitudeDelta) * 100), 10)
      : DEFAULT_ZOOM;

    const map = L.map(containerRef.current, { zoomControl: false }).setView(center, zoom);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    mapRef.current = map;

    setTimeout(() => map.invalidateSize(), 100);
    return () => { map.remove(); mapRef.current = null; };
  }, [loaded, initialRegion]);

  function clearMarkers() {
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    if (polylineRef.current) { polylineRef.current.remove(); polylineRef.current = null; }
  }

  function addMarker(L: any, lat: number, lng: number, color: string, size: number, inner: number, popup?: string) {
    const icon = L.divIcon({
      html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color}33;display:flex;align-items:center;justify-content:center"><div style="width:${inner}px;height:${inner}px;border-radius:50%;background:${color};border:2px solid #fff"></div></div>`,
      className: "",
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
    const marker = L.marker([lat, lng], { icon }).addTo(mapRef.current);
    if (popup) marker.bindPopup(popup);
    markersRef.current.push(marker);
  }

  useEffect(() => {
    if (!mapRef.current || !loaded) return;
    const L = (window as any).L;
    clearMarkers();

    if (centerOn) {
      mapRef.current.setView([centerOn.lat, centerOn.lng], 16);
    } else {
      const points: MapPoint[] = [];
      if (userLocation) points.push(userLocation);
      if (pickupPoint) points.push(pickupPoint);
      if (dropoffPoint) points.push(dropoffPoint);
      if (driverLocation) points.push(driverLocation);
      if (routePolyline?.length) routePolyline.forEach((p) => points.push(p));

      if (points.length > 0) {
        const lats = points.map((p) => p.lat);
        const lngs = points.map((p) => p.lng);
        const bounds = L.latLngBounds(lats.map((lat, i) => [lat, lngs[i]]));
        mapRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    }

    if (showRoute && routePolyline && routePolyline.length > 1) {
      polylineRef.current = L.polyline(
        routePolyline.map((p) => [p.lat, p.lng]),
        { color: "#0D9E75", weight: 4 }
      ).addTo(mapRef.current);
    }

    if (pickupPoint) addMarker(L, pickupPoint.lat, pickupPoint.lng, "#3B82F6", 30, 14, pickupPoint.name);
    if (dropoffPoint) addMarker(L, dropoffPoint.lat, dropoffPoint.lng, "#EF4444", 30, 14, dropoffPoint.name);
    if (driverLocation) addMarker(L, driverLocation.lat, driverLocation.lng, "#0D9E75", 36, 16, "Driver");
    if (userLocation) addMarker(L, userLocation.lat, userLocation.lng, "#6B7280", 24, 10, "You");
  }, [loaded, centerOn, userLocation, pickupPoint, dropoffPoint, driverLocation, routePolyline, showRoute]);

  if (error) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>Map failed to load: {error}</Text>
      </View>
    );
  }

  return (
    <div
      ref={containerRef as any}
      style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: "center", alignItems: "center" },
  errorText: { color: "#EF4444", fontSize: 14, padding: 16 },
});
