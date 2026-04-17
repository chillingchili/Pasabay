import type { RoutePoint } from "./osrm";

const DEFAULT_WALKING_SPEED_KMH = 5;
const DEFAULT_WALKABLE_THRESHOLD_M = 500;

/**
 * Returns walking time in minutes for a given distance.
 * Default walking speed: 5 km/h.
 */
export function calcWalkingEta(
  distanceKm: number,
  speedKmh: number = DEFAULT_WALKING_SPEED_KMH,
): number {
  return (distanceKm / speedKmh) * 60;
}

/**
 * Returns true if the distance is under the walkable threshold.
 * Default threshold: 500 meters.
 */
export function isWalkable(
  distanceKm: number,
  thresholdM: number = DEFAULT_WALKABLE_THRESHOLD_M,
): boolean {
  return distanceKm * 1000 < thresholdM;
}

/**
 * Returns a human-readable distance string.
 * Uses meters for distances < 1 km, kilometers otherwise.
 */
export function formatWalkingDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}

export interface WalkingInfo {
  distanceM: number;
  etaMin: number;
  isWalkable: boolean;
  polyline?: RoutePoint[];
}

/**
 * Convenience function that combines all walking data into a single object.
 */
export function getWalkingInfo(
  distanceKm: number,
  polyline?: RoutePoint[],
  speedKmh?: number,
  thresholdM?: number,
): WalkingInfo {
  return {
    distanceM: Math.round(distanceKm * 1000),
    etaMin: calcWalkingEta(distanceKm, speedKmh),
    isWalkable: isWalkable(distanceKm, thresholdM),
    polyline,
  };
}
