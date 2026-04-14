import React from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, Line, Path, Rect } from "react-native-svg";

interface Props {
  showRoute?: boolean;
  driverRoute?: boolean;
}

export function MapBackground({ showRoute = true, driverRoute = false }: Props) {
  return (
    <View style={StyleSheet.absoluteFill}>
      <View style={styles.mapBg} />
      <Svg width="390" height="844" viewBox="0 0 390 844" fill="none" style={StyleSheet.absoluteFill}>
        <Rect x={20} y={60} width={120} height={90} rx={3} fill="rgba(255,255,255,0.02)" />
        <Rect x={160} y={80} width={100} height={120} rx={3} fill="rgba(255,255,255,0.025)" />
        <Rect x={280} y={50} width={90} height={80} rx={3} fill="rgba(255,255,255,0.015)" />
        <Rect x={30} y={180} width={140} height={110} rx={3} fill="rgba(255,255,255,0.018)" />
        <Rect x={200} y={230} width={160} height={90} rx={3} fill="rgba(255,255,255,0.022)" />
        <Rect x={40} y={320} width={100} height={130} rx={3} fill="rgba(255,255,255,0.025)" />
        <Rect x={170} y={350} width={80} height={100} rx={3} fill="rgba(255,255,255,0.015)" />
        <Rect x={270} y={310} width={100} height={130} rx={3} fill="rgba(255,255,255,0.02)" />
        <Rect x={20} y={480} width={160} height={80} rx={3} fill="rgba(255,255,255,0.018)" />
        <Rect x={210} y={470} width={120} height={100} rx={3} fill="rgba(255,255,255,0.022)" />

        <Line x1={0} y1={170} x2={390} y2={170} stroke="rgba(255,255,255,0.06)" strokeWidth={3} />
        <Line x1={0} y1={310} x2={390} y2={310} stroke="rgba(255,255,255,0.06)" strokeWidth={3} />
        <Line x1={0} y1={460} x2={390} y2={460} stroke="rgba(255,255,255,0.05)" strokeWidth={2.5} />
        <Line x1={150} y1={0} x2={150} y2={600} stroke="rgba(255,255,255,0.06)" strokeWidth={3} />
        <Line x1={260} y1={0} x2={260} y2={600} stroke="rgba(255,255,255,0.05)" strokeWidth={2.5} />

        <Line x1={0} y1={230} x2={150} y2={230} stroke="rgba(255,255,255,0.03)" strokeWidth={1.5} />
        <Line x1={0} y1={400} x2={260} y2={400} stroke="rgba(255,255,255,0.03)" strokeWidth={1.5} />
        <Line x1={80} y1={170} x2={80} y2={460} stroke="rgba(255,255,255,0.03)" strokeWidth={1.5} />
        <Line x1={200} y1={80} x2={200} y2={310} stroke="rgba(255,255,255,0.03)" strokeWidth={1.5} />
        <Line x1={330} y1={100} x2={330} y2={460} stroke="rgba(255,255,255,0.03)" strokeWidth={1.5} />

        {showRoute && !driverRoute && (
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

        {driverRoute && (
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
