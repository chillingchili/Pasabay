export interface RoutePoint { lat: number; lng: number; }
export interface OSRMRoute {
  polyline: RoutePoint[];
  distanceKm: number;
  durationSec: number;
}

const OSRM_BASE = "https://router.project-osrm.org/route/v1/driving";

export async function getRoute(
  origin: RoutePoint,
  destination: RoutePoint
): Promise<OSRMRoute | null> {
  try {
    const url = `${OSRM_BASE}/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson&steps=false`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const data = await res.json() as any;
    if (data.code !== "Ok" || !data.routes?.length) return null;

    const route = data.routes[0];
    const coords: RoutePoint[] = route.geometry.coordinates.map(
      ([lng, lat]: [number, number]) => ({ lat, lng })
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

function pointToSegmentDistanceKm(
  p: RoutePoint,
  a: RoutePoint,
  b: RoutePoint
): { distKm: number; t: number; closest: RoutePoint } {
  const dx = b.lat - a.lat;
  const dy = b.lng - a.lng;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((p.lat - a.lat) * dx + (p.lng - a.lng) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const closest: RoutePoint = { lat: a.lat + t * dx, lng: a.lng + t * dy };
  return { distKm: haversineKm(p, closest), t, closest };
}

export interface PolylineProjection {
  distKm: number;
  segmentIndex: number;
  t: number;
  snapped: RoutePoint;
}

export function projectPointOnPolyline(
  point: RoutePoint,
  polyline: RoutePoint[]
): PolylineProjection {
  let best: PolylineProjection = {
    distKm: Infinity,
    segmentIndex: 0,
    t: 0,
    snapped: polyline[0],
  };
  for (let i = 0; i < polyline.length - 1; i++) {
    const { distKm, t, closest } = pointToSegmentDistanceKm(
      point,
      polyline[i],
      polyline[i + 1]
    );
    if (distKm < best.distKm) {
      best = { distKm, segmentIndex: i, t, snapped: closest };
    }
  }
  return best;
}

export function polylineDistanceKm(
  polyline: RoutePoint[],
  fromIndex: number,
  toIndex: number
): number {
  let dist = 0;
  for (let i = fromIndex; i < Math.min(toIndex, polyline.length - 1); i++) {
    dist += haversineKm(polyline[i], polyline[i + 1]);
  }
  return dist;
}
