import { API_BASE } from "./api";

export interface RoutePoint {
  lat: number;
  lng: number;
}

export interface OSRMRoute {
  polyline: RoutePoint[];
  distanceKm: number;
  durationSec: number;
}

const OSRM_FOOT_BASE = "https://router.project-osrm.org/route/v1/foot";

/**
 * Fetches a walking route from OSRM foot routing API.
 * Called directly from the client — lightweight, no server caching needed.
 */
export async function getWalkingRoute(
  origin: RoutePoint,
  destination: RoutePoint,
): Promise<OSRMRoute | null> {
  try {
    const url = `${OSRM_FOOT_BASE}/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson&steps=false`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      code: string;
      routes?: { geometry: { coordinates: [number, number][] }; distance: number; duration: number }[];
    };
    if (data.code !== "Ok" || !data.routes?.length) return null;

    const route = data.routes[0];
    const coords: RoutePoint[] = route.geometry.coordinates.map(
      ([lng, lat]: [number, number]) => ({ lat, lng }),
    );
    return {
      polyline: coords,
      distanceKm: route.distance / 1000,
      durationSec: route.duration,
    };
  } catch {
    return null;
  }
}

/**
 * Fetches a driving route by delegating to the server API.
 * The mobile app routes through the backend for server-side caching.
 */
export async function getRoute(
  origin: RoutePoint,
  destination: RoutePoint,
): Promise<OSRMRoute | null> {
  try {
    const res = await fetch(`${API_BASE}/route`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ origin, destination }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as OSRMRoute;
    return data;
  } catch {
    return null;
  }
}

export function haversineKm(a: RoutePoint, b: RoutePoint): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}
