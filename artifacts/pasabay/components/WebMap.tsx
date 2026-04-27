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
  fitRouteKey?: number;
  recenterKey?: number;
  initialRegion?: { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number };
  onMapPress?: (event: any) => void;
  onUserDrag?: () => void;
  style?: object;
}

const DEFAULT_CENTER: [number, number] = [10.3535, 123.9135];
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
  fitRouteKey,
  recenterKey,
  initialRegion,
  onUserDrag,
}: WebMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polylineRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const userDraggedRef = useRef(false);
  const lastFittedKeyRef = useRef(0);

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

    // Detect user drag on the web map
    map.on("dragstart", () => {
      userDraggedRef.current = true;
      onUserDrag?.();
    });

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

    // If user has manually dragged, don't auto-center unless explicit action
    // (fitRouteKey or recenterKey change resets userDragged)
    if (pickupPoint) addMarker(L, pickupPoint.lat, pickupPoint.lng, "#3B82F6", 30, 14, pickupPoint.name);
    if (dropoffPoint) addMarker(L, dropoffPoint.lat, dropoffPoint.lng, "#EF4444", 30, 14, dropoffPoint.name);
    if (driverLocation) addMarker(L, driverLocation.lat, driverLocation.lng, "#0D9E75", 36, 16, "Driver");
    if (userLocation) addMarker(L, userLocation.lat, userLocation.lng, "#6B7280", 24, 10, "You");

    if (showRoute && routePolyline && routePolyline.length > 1) {
      polylineRef.current = L.polyline(
        routePolyline.map((p) => [p.lat, p.lng]),
        { color: "#0D9E75", weight: 4 }
      ).addTo(mapRef.current);
    }
  }, [loaded, userLocation, pickupPoint, dropoffPoint, driverLocation, routePolyline, showRoute]);

  // Fit map to show the full route when fitRouteKey changes (destination selected).
  // Reset lastFittedKeyRef so the polyline-arrival effect can refit with full route data.
  useEffect(() => {
    if (!mapRef.current || !loaded || !fitRouteKey) return;
    const L = (window as any).L;
    userDraggedRef.current = false;
    lastFittedKeyRef.current = 0;

    const points: MapPoint[] = [];
    if (pickupPoint) points.push(pickupPoint);
    if (dropoffPoint) points.push(dropoffPoint);
    if (routePolyline && routePolyline.length > 0) {
      routePolyline.forEach((p) => points.push(p));
    }

    if (points.length >= 2) {
      const lats = points.map((p) => p.lat);
      const lngs = points.map((p) => p.lng);
      const bounds = L.latLngBounds(lats.map((lat, i) => [lat, lngs[i]]));
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    } else if (points.length === 1) {
      mapRef.current.setView([points[0].lat, points[0].lng], 16);
    }
  }, [loaded, fitRouteKey]);

  // When route polyline data arrives asynchronously, refit map to show the full road path.
  // Only refit ONCE per destination change (guarded by lastFittedKeyRef, reset by fitRouteKey).
  useEffect(() => {
    if (!mapRef.current || !loaded) return;
    if (!routePolyline || routePolyline.length < 2) return;
    if (lastFittedKeyRef.current >= (fitRouteKey ?? 0)) return;
    lastFittedKeyRef.current = fitRouteKey ?? 0;
    const L = (window as any).L;
    userDraggedRef.current = false;

    const allPoints: MapPoint[] = [...routePolyline];
    if (pickupPoint) allPoints.push(pickupPoint);
    if (dropoffPoint) allPoints.push(dropoffPoint);

    const lats = allPoints.map((p) => p.lat);
    const lngs = allPoints.map((p) => p.lng);
    const bounds = L.latLngBounds(lats.map((lat, i) => [lat, lngs[i]]));
    mapRef.current.fitBounds(bounds, { padding: [50, 50] });
  }, [loaded, routePolyline, pickupPoint, dropoffPoint, fitRouteKey]);

  // Recenter when recenterKey changes (manual recenter button)
  useEffect(() => {
    if (!mapRef.current || !loaded || !recenterKey || recenterKey <= 0) return;
    const L = (window as any).L;
    userDraggedRef.current = false;

    const points: MapPoint[] = [];
    if (pickupPoint) points.push(pickupPoint);
    if (dropoffPoint) points.push(dropoffPoint);
    if (routePolyline && routePolyline.length > 0) {
      routePolyline.forEach((p) => points.push(p));
    }

    if (points.length >= 2) {
      const lats = points.map((p) => p.lat);
      const lngs = points.map((p) => p.lng);
      const bounds = L.latLngBounds(lats.map((lat, i) => [lat, lngs[i]]));
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    } else if (userLocation) {
      mapRef.current.setView([userLocation.lat, userLocation.lng], 16);
    }
  }, [loaded, recenterKey]);

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
