import React from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, Line, Path, Rect, Text as SvgText } from "react-native-svg";
import { RouteMap, RoutePoint, coordinateToXY } from "./RouteMap";

interface Props {
  showRoute?: boolean;
  driverRoute?: boolean;
  routePolyline?: RoutePoint[];
  walkingPolyline?: RoutePoint[];
  pickupPoint?: RoutePoint;
  dropoffPoint?: RoutePoint;
}

export function MapBackground({
  showRoute = true,
  driverRoute = false,
  routePolyline,
  walkingPolyline,
  pickupPoint,
  dropoffPoint,
}: Props) {
  const hasDynamicRoute = !!routePolyline;

  return (
    <View style={StyleSheet.absoluteFill}>
      <View style={styles.mapBg} />
      <Svg width="390" height="844" viewBox="0 0 390 844" fill="none" style={StyleSheet.absoluteFill}>
        {/* === USC Talamban Campus, main gate (10.3545, 123.9135) === */}
        <Rect x={189} y={147} width={80} height={80} rx={4} fill="rgba(13,158,117,0.08)" stroke="rgba(13,158,117,0.2)" strokeWidth={1} />
        <SvgText x={229} y={192} fontSize={14} fontWeight="700" fill="rgba(13,158,117,0.7)" textAnchor="middle">USC</SvgText>
        <SvgText x={229} y={209} fontSize={8} fill="rgba(13,158,117,0.5)" textAnchor="middle">Talamban</SvgText>
        <Circle cx={229} cy={237} r={10} fill="rgba(13,158,117,0.25)" />
        <Circle cx={229} cy={237} r={5} fill="#0D9E75" />
        <SvgText x={229} y={262} fontSize={8} fill="rgba(13,158,117,0.6)" textAnchor="middle">Main Gate</SvgText>

        {/* === SM City Cebu (10.3112, 123.9172) === */}
        <Rect x={220} y={674} width={90} height={70} rx={4} fill="rgba(59,130,246,0.08)" stroke="rgba(59,130,246,0.2)" strokeWidth={1} />
        <SvgText x={265} y={714} fontSize={13} fontWeight="700" fill="rgba(59,130,246,0.7)" textAnchor="middle">SM</SvgText>
        <SvgText x={265} y={731} fontSize={8} fill="rgba(59,130,246,0.5)" textAnchor="middle">City Cebu</SvgText>

        {/* === IT Park, Lahug (10.3308, 123.9068) === */}
        <Rect x={124} y={443} width={80} height={60} rx={4} fill="rgba(168,85,247,0.08)" stroke="rgba(168,85,247,0.2)" strokeWidth={1} />
        <SvgText x={164} y={478} fontSize={10} fontWeight="600" fill="rgba(168,85,247,0.7)" textAnchor="middle">IT Park</SvgText>

        {/* === Ayala Center (10.3173, 123.9046) === */}
        <Rect x={102} y={606} width={80} height={60} rx={4} fill="rgba(245,158,11,0.08)" stroke="rgba(245,158,11,0.2)" strokeWidth={1} />
        <SvgText x={142} y={641} fontSize={9} fontWeight="600" fill="rgba(245,158,11,0.6)" textAnchor="middle">Ayala</SvgText>

        {/* === Major Roads === */}
        {/* N. Bacalso Ave (horizontal main road, south side ~lat 10.309) */}
        <Line x1={0} y1={720} x2={390} y2={720} stroke="rgba(255,255,255,0.12)" strokeWidth={4} />
        <SvgText x={195} y={715} fontSize={8} fill="rgba(255,255,255,0.35)" textAnchor="middle">N. Bacalso Ave</SvgText>

        {/* J. Alcantara St (vertical road, west side ~lng 123.899) */}
        <Line x1={88} y1={100} x2={88} y2={760} stroke="rgba(255,255,255,0.1)" strokeWidth={3} />
        <SvgText x={88} y={430} fontSize={7} fill="rgba(255,255,255,0.3)" textAnchor="middle" transform="rotate(-90, 88, 430)">J. Alcantara St</SvgText>

        {/* Salinas Dr (horizontal road, near IT Park ~lat 10.327) */}
        <Line x1={0} y1={500} x2={390} y2={500} stroke="rgba(255,255,255,0.08)" strokeWidth={3} />
        <SvgText x={310} y={495} fontSize={7} fill="rgba(255,255,255,0.3)" textAnchor="middle">Salinas Dr</SvgText>

        {/* Cardinal Rosales Ave (vertical road, near Ayala ~lng 123.9045) */}
        <Line x1={140} y1={350} x2={140} y2={650} stroke="rgba(255,255,255,0.08)" strokeWidth={2.5} />
        <SvgText x={140} y={500} fontSize={7} fill="rgba(255,255,255,0.3)" textAnchor="middle" transform="rotate(-90, 140, 500)">Cardinal Rosales</SvgText>

        {/* === Building Blocks (decorative) === */}
        <Rect x={20} y={200} width={60} height={45} rx={2} fill="rgba(255,255,255,0.02)" />
        <Rect x={300} y={150} width={70} height={50} rx={2} fill="rgba(255,255,255,0.015)" />
        <Rect x={30} y={350} width={90} height={60} rx={2} fill="rgba(255,255,255,0.018)" />
        <Rect x={280} y={370} width={80} height={70} rx={2} fill="rgba(255,255,255,0.02)" />
        <Rect x={20} y={750} width={100} height={50} rx={2} fill="rgba(255,255,255,0.015)" />
        <Rect x={280} y={730} width={90} height={60} rx={2} fill="rgba(255,255,255,0.018)" />

        {/* === Dynamic Routes via RouteMap === */}
        {hasDynamicRoute && (
          <>
            <RouteMap polyline={routePolyline} type="driving" />
            {walkingPolyline && walkingPolyline.length > 1 && (
              <RouteMap polyline={walkingPolyline} type="walking" />
            )}
          </>
        )}

        {/* === Backward Compatibility: Hardcoded Routes === */}
        {!hasDynamicRoute && showRoute && !driverRoute && (
          <>
            <Path
              d="M 229 237 L 229 370 Q 229 430 240 460 L 268 490 L 265 674"
              stroke="rgba(13,158,117,0.2)"
              strokeWidth={16}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M 229 237 L 229 370 Q 229 430 240 460 L 268 490 L 265 674"
              stroke="#0D9E75"
              strokeWidth={4}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        )}

        {!hasDynamicRoute && driverRoute && (
          <>
            <Path
              d="M 142 636 L 142 500 Q 142 400 165 350 L 200 280 L 229 237"
              stroke="rgba(13,158,117,0.2)"
              strokeWidth={14}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M 142 636 L 142 500 Q 142 400 165 350 L 200 280 L 229 237"
              stroke="#0D9E75"
              strokeWidth={4}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        )}

        {/* === Pickup/Dropoff Pin Markers === */}
        {pickupPoint && (
          <>
            <Circle cx={coordinateToXY(pickupPoint).x} cy={coordinateToXY(pickupPoint).y} r={14} fill="rgba(59,130,246,0.2)" />
            <Circle cx={coordinateToXY(pickupPoint).x} cy={coordinateToXY(pickupPoint).y} r={7} fill="#3B82F6" />
            <Circle cx={coordinateToXY(pickupPoint).x} cy={coordinateToXY(pickupPoint).y} r={3} fill="#fff" />
          </>
        )}
        {dropoffPoint && (
          <>
            <Circle cx={coordinateToXY(dropoffPoint).x} cy={coordinateToXY(dropoffPoint).y} r={14} fill="rgba(239,68,68,0.2)" />
            <Circle cx={coordinateToXY(dropoffPoint).x} cy={coordinateToXY(dropoffPoint).y} r={7} fill="#EF4444" />
            <Circle cx={coordinateToXY(dropoffPoint).x} cy={coordinateToXY(dropoffPoint).y} r={3} fill="#fff" />
          </>
        )}

        {/* User location pin (at default USC Talamban main gate) */}
        <Circle cx={229} cy={187} r={18} fill="rgba(13,158,117,0.15)" />
        <Circle cx={229} cy={187} r={8} fill="#0D9E75" />
        <Circle cx={229} cy={187} r={4} fill="#fff" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  mapBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#1e2d4d",
  },
});
