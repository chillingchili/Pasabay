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
  bottomInset?: number;
  heading?: number;
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

function computeBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const dLng = toRad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(toRad(lat2));
  const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
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
  bottomInset,
  heading,
}: WebMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polylineBgRef = useRef<any>(null);
  const polylineFgRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const userDraggedRef = useRef(false);
  const lastFittedKeyRef = useRef(0);
  const prevLocRef = useRef<MapPoint | null>(null);
  const headingRef = useRef(heading ?? 0);

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
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    }).addTo(map);

    map.on("dragstart", () => {
      userDraggedRef.current = true;
      onUserDrag?.();
    });

    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 100);
    return () => { map.remove(); mapRef.current = null; };
  }, [loaded, initialRegion]);

  // Track heading from userLocation changes when no heading prop
  useEffect(() => {
    if (!userLocation) return;
    if (prevLocRef.current && heading === undefined) {
      const bearing = computeBearing(
        prevLocRef.current.lat, prevLocRef.current.lng,
        userLocation.lat, userLocation.lng
      );
      if (bearing !== 0 || prevLocRef.current.lat !== userLocation.lat) {
        headingRef.current = bearing;
      }
    }
    prevLocRef.current = userLocation;
  }, [userLocation, heading]);

  // Use explicit heading prop if provided
  useEffect(() => {
    if (heading !== undefined) {
      headingRef.current = heading;
    }
  }, [heading]);

  function clearMarkers() {
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    if (polylineBgRef.current) { polylineBgRef.current.remove(); polylineBgRef.current = null; }
    if (polylineFgRef.current) { polylineFgRef.current.remove(); polylineFgRef.current = null; }
  }

  function addCarMarker(L: any, lat: number, lng: number, color: string, size: number) {
    const deg = headingRef.current ?? 0;
    const svg = `
      <svg width="${size}" height="${size}" viewBox="0 0 40 40" style="transform: rotate(${deg}deg)">
        <path d="M20 2 L34 30 Q20 36 6 30 Z" fill="${color}" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/>
        <circle cx="20" cy="18" r="5" fill="#fff" opacity="0.6"/>
        <path d="M12 22 L20 14 L28 22" fill="none" stroke="${color}" stroke-width="2" opacity="0.3"/>
      </svg>`;
    const icon = L.divIcon({
      html: svg,
      className: "",
      iconSize: [size, size],
      iconAnchor: [size / 2, size * 0.85],
    });
    const marker = L.marker([lat, lng], { icon }).addTo(mapRef.current);
    markersRef.current.push(marker);
  }

  function addMarker(L: any, lat: number, lng: number, color: string, size: number, inner: number, label?: string) {
    const icon = L.divIcon({
      html: `<div style="display:flex;flex-direction:column;align-items:center;gap:2px"><div style="width:${size}px;height:${size}px;border-radius:50%;background:${color}33;display:flex;align-items:center;justify-content:center"><div style="width:${inner}px;height:${inner}px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,0.3)"></div></div>${label ? `<span style="font-size:10px;font-weight:600;color:#fff;background:${color};padding:1px 6px;border-radius:4px;white-space:nowrap;box-shadow:0 1px 2px rgba(0,0,0,0.2)">${label}</span>` : ''}</div>`,
      className: "",
      iconSize: [label ? Math.max(size, 64) : size, label ? size + 20 : size],
      iconAnchor: [label ? Math.max(size, 64) / 2 : size / 2, label ? size + 20 : size / 2],
    });
    const marker = L.marker([lat, lng], { icon }).addTo(mapRef.current);
    markersRef.current.push(marker);
  }

  function offsetMapForBottomThird() {
    if (!mapRef.current || !userLocation) return;
    const L = (window as any).L;
    const point = mapRef.current.latLngToContainerPoint(L.latLng(userLocation.lat, userLocation.lng));
    const h = containerRef.current?.offsetHeight ?? 600;
    const targetY = h * 0.65;
    const dy = point.y - targetY;
    if (dy !== 0) {
      mapRef.current.panBy([0, -dy], { animate: false });
    }
  }

  // Fit bounds helper with bottom-third offset padding
  function fitWithOffset(points: MapPoint[]) {
    if (!mapRef.current || points.length < 2) return;
    const L = (window as any).L;
    const lats = points.map((p) => p.lat);
    const lngs = points.map((p) => p.lng);
    const bounds = L.latLngBounds(lats.map((lat, i) => [lat, lngs[i]]));
    const h = containerRef.current?.offsetHeight ?? 600;
    mapRef.current.fitBounds(bounds, {
      paddingTopLeft: [50, h * 0.3],
      paddingBottomRight: [50, 50 + (bottomInset ?? 0)],
    });
  }

  useEffect(() => {
    if (!mapRef.current || !loaded) return;
    const L = (window as any).L;
    clearMarkers();

    if (pickupPoint) addMarker(L, pickupPoint.lat, pickupPoint.lng, "#3B82F6", 30, 14);
    if (dropoffPoint) addMarker(L, dropoffPoint.lat, dropoffPoint.lng, "#EF4444", 30, 14);
    if (driverLocation) addCarMarker(L, driverLocation.lat, driverLocation.lng, "#0D9E75", 36);
    if (userLocation) addMarker(L, userLocation.lat, userLocation.lng, "#0D9E75", 26, 12);

    if (showRoute && routePolyline && routePolyline.length > 1) {
      const coords = routePolyline.map((p) => [p.lat, p.lng]);
      polylineBgRef.current = L.polyline(coords, {
        color: "#1a7a5a",
        weight: 10,
        opacity: 0.6,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(mapRef.current);
      polylineFgRef.current = L.polyline(coords, {
        color: "#0D9E75",
        weight: 5,
        opacity: 1,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(mapRef.current);
    }
  }, [loaded, userLocation, pickupPoint, dropoffPoint, driverLocation, routePolyline, showRoute]);

  // Fit map to show route when fitRouteKey changes
  useEffect(() => {
    if (!mapRef.current || !loaded || !fitRouteKey) return;
    userDraggedRef.current = false;
    lastFittedKeyRef.current = 0;

    const points: MapPoint[] = [];
    if (pickupPoint) points.push(pickupPoint);
    if (dropoffPoint) points.push(dropoffPoint);
    if (routePolyline && routePolyline.length > 0) {
      routePolyline.forEach((p) => points.push(p));
    }

    if (points.length >= 2) {
      fitWithOffset(points);
    } else if (points.length === 1) {
      mapRef.current.setView([points[0].lat, points[0].lng], 16);
    }
    setTimeout(offsetMapForBottomThird, 100);
  }, [loaded, fitRouteKey]);

  // When route polyline data arrives asynchronously, refit map
  useEffect(() => {
    if (!mapRef.current || !loaded) return;
    if (!routePolyline || routePolyline.length < 2) return;
    if (lastFittedKeyRef.current >= (fitRouteKey ?? 0)) return;
    lastFittedKeyRef.current = fitRouteKey ?? 0;
    userDraggedRef.current = false;

    const allPoints: MapPoint[] = [...routePolyline];
    if (pickupPoint) allPoints.push(pickupPoint);
    if (dropoffPoint) allPoints.push(dropoffPoint);

    fitWithOffset(allPoints);
    setTimeout(offsetMapForBottomThird, 100);
  }, [loaded, routePolyline, pickupPoint, dropoffPoint, fitRouteKey]);

  // Recenter when recenterKey changes
  useEffect(() => {
    if (!mapRef.current || !loaded || !recenterKey || recenterKey <= 0) return;
    userDraggedRef.current = false;

    const points: MapPoint[] = [];
    if (pickupPoint) points.push(pickupPoint);
    if (dropoffPoint) points.push(dropoffPoint);
    if (routePolyline && routePolyline.length > 0) {
      routePolyline.forEach((p) => points.push(p));
    }

    if (points.length >= 2) {
      fitWithOffset(points);
    } else if (userLocation) {
      mapRef.current.setView([userLocation.lat, userLocation.lng], 16);
    }
    setTimeout(offsetMapForBottomThird, 100);
  }, [loaded, recenterKey]);

  // Offset map when userLocation updates during active navigation — only if not dragged
  useEffect(() => {
    if (!mapRef.current || !loaded || !userLocation || userDraggedRef.current) return;
    offsetMapForBottomThird();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, fitRouteKey]);

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
