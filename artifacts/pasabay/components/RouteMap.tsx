import React from "react";
import Svg, { Path } from "react-native-svg";

export interface RoutePoint {
  lat: number;
  lng: number;
}

// Bounding box for USC Cebu area
const LAT_MIN = 10.29;
const LAT_MAX = 10.325;
const LNG_MIN = 123.89;
const LNG_MAX = 123.915;
const SVG_WIDTH = 390;
const SVG_HEIGHT = 844;

/**
 * Converts lat/lng coordinates to SVG x/y positions using linear projection.
 * Maps the USC area bounding box to the SVG viewBox dimensions (390x844).
 */
export function coordinateToXY(point: RoutePoint): { x: number; y: number } {
  const x = ((point.lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * SVG_WIDTH;
  const y = ((LAT_MAX - point.lat) / (LAT_MAX - LAT_MIN)) * SVG_HEIGHT;
  return { x, y };
}

interface RouteMapProps {
  polyline: RoutePoint[];
  type: "driving" | "walking";
  color?: string;
  width?: number;
}

export function RouteMap({ polyline, type, color, width }: RouteMapProps) {
  if (polyline.length < 2) return null;

  const points = polyline.map(coordinateToXY);
  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const isDriving = type === "driving";
  const strokeColor = color ?? (isDriving ? "#0D9E75" : "#0D9E7580");
  const strokeWidth = width ?? (isDriving ? 4 : 3);
  const glowWidth = isDriving ? 16 : 14;
  const dashArray = isDriving ? undefined : "6,4";

  return (
    <>
      {/* Glow path underneath */}
      <Path
        d={pathD}
        stroke={isDriving ? "rgba(13,158,117,0.2)" : "rgba(13,158,117,0.1)"}
        strokeWidth={glowWidth}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Main route path */}
      <Path
        d={pathD}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeDasharray={dashArray}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  );
}
