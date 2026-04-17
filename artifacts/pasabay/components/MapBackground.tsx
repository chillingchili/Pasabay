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
        {/* === USC Campus Landmark: USC Main Campus === */}
        <Rect x={120} y={280} width={100} height={80} rx={4} fill="rgba(13,158,117,0.08)" stroke="rgba(13,158,117,0.2)" strokeWidth={1} />
        <SvgText x={170} y={325} fontSize={14} fontWeight="700" fill="rgba(13,158,117,0.7)" textAnchor="middle">USC</SvgText>
        <SvgText x={170} y={342} fontSize={8} fill="rgba(13,158,117,0.5)" textAnchor="middle">Main Campus</SvgText>
        {/* USC Main Gate marker */}
        <Circle cx={170} cy={370} r={10} fill="rgba(13,158,117,0.25)" />
        <Circle cx={170} cy={370} r={5} fill="#0D9E75" />
        <SvgText x={170} y={395} fontSize={8} fill="rgba(13,158,117,0.6)" textAnchor="middle">Main Gate</SvgText>

        {/* === SM City Cebu === */}
        <Rect x={200} y={100} width={90} height={70} rx={4} fill="rgba(59,130,246,0.08)" stroke="rgba(59,130,246,0.2)" strokeWidth={1} />
        <SvgText x={245} y={140} fontSize={13} fontWeight="700" fill="rgba(59,130,246,0.7)" textAnchor="middle">SM</SvgText>
        <SvgText x={245} y={157} fontSize={8} fill="rgba(59,130,246,0.5)" textAnchor="middle">City Cebu</SvgText>

        {/* === IT Park, Lahug === */}
        <Rect x={280} y={60} width={80} height={60} rx={4} fill="rgba(168,85,247,0.08)" stroke="rgba(168,85,247,0.2)" strokeWidth={1} />
        <SvgText x={320} y={95} fontSize={10} fontWeight="600" fill="rgba(168,85,247,0.7)" textAnchor="middle">IT Park</SvgText>

        {/* === Ayala Center === */}
        <Rect x={60} y={160} width={80} height={55} rx={4} fill="rgba(245,158,11,0.08)" stroke="rgba(245,158,11,0.2)" strokeWidth={1} />
        <SvgText x={100} y={192} fontSize={9} fontWeight="600" fill="rgba(245,158,11,0.6)" textAnchor="middle">Ayala</SvgText>

        {/* === Major Roads === */}
        {/* N. Bacalso Ave (horizontal main road) */}
        <Line x1={0} y1={200} x2={390} y2={200} stroke="rgba(255,255,255,0.12)" strokeWidth={4} />
        <SvgText x={195} y={195} fontSize={8} fill="rgba(255,255,255,0.35)" textAnchor="middle">N. Bacalso Ave</SvgText>

        {/* J. Alcantara St (vertical road) */}
        <Line x1={155} y1={0} x2={155} y2={600} stroke="rgba(255,255,255,0.1)" strokeWidth={3} />
        <SvgText x={155} y={260} fontSize={7} fill="rgba(255,255,255,0.3)" textAnchor="middle" transform="rotate(-90, 155, 260)">J. Alcantara St</SvgText>

        {/* Salinas Dr (horizontal) */}
        <Line x1={0} y1={120} x2={390} y2={120} stroke="rgba(255,255,255,0.08)" strokeWidth={3} />
        <SvgText x={300} y={115} fontSize={7} fill="rgba(255,255,255,0.3)" textAnchor="middle">Salinas Dr</SvgText>

        {/* Cardinal Rosales Ave */}
        <Line x1={260} y1={0} x2={260} y2={500} stroke="rgba(255,255,255,0.08)" strokeWidth={2.5} />
        <SvgText x={260} y={350} fontSize={7} fill="rgba(255,255,255,0.3)" textAnchor="middle" transform="rotate(-90, 260, 350)">Cardinal Rosales</SvgText>

        {/* === Building Blocks === */}
        <Rect x={20} y={60} width={60} height={45} rx={2} fill="rgba(255,255,255,0.02)" />
        <Rect x={300} y={180} width={70} height={50} rx={2} fill="rgba(255,255,255,0.015)" />
        <Rect x={30} y={420} width={90} height={60} rx={2} fill="rgba(255,255,255,0.018)" />
        <Rect x={250} y={400} width={80} height={70} rx={2} fill="rgba(255,255,255,0.02)" />
        <Rect x={20} y={520} width={100} height={50} rx={2} fill="rgba(255,255,255,0.015)" />
        <Rect x={280} y={500} width={90} height={60} rx={2} fill="rgba(255,255,255,0.018)" />

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
              d="M 195 500 L 195 400 Q 195 370 210 350 L 250 300 Q 260 285 260 270 L 260 180 Q 260 165 270 155 L 310 130"
              stroke="rgba(13,158,117,0.2)"
              strokeWidth={16}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M 195 500 L 195 400 Q 195 370 210 350 L 250 300 Q 260 285 260 270 L 260 180 Q 260 165 270 155 L 310 130"
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
              d="M 195 620 L 195 480 Q 195 460 210 440 L 300 380 Q 310 370 310 350 L 310 280 Q 310 260 300 250 L 260 220"
              stroke="rgba(13,158,117,0.2)"
              strokeWidth={14}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M 195 620 L 195 480 Q 195 460 210 440 L 300 380 Q 310 370 310 350 L 310 280 Q 310 260 300 250 L 260 220"
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

        {/* Original user location pin */}
        <Circle cx={90} cy={330} r={18} fill="rgba(13,158,117,0.15)" />
        <Circle cx={90} cy={330} r={8} fill="#0D9E75" />
        <Circle cx={90} cy={330} r={4} fill="#fff" />
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
