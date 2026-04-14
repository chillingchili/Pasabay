import React from "react";
import Svg, { Circle, Path, Rect, G } from "react-native-svg";

interface Props {
  size?: number;
  color?: string;
}

export function PasabayLogo({ size = 60, color = "#fff" }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <Rect width={120} height={120} rx={30} fill="rgba(255,255,255,0.15)" />
      <G transform="translate(25, 20)">
        <Circle cx={35} cy={28} r={12} fill={color} opacity={0.9} />
        <Circle cx={35} cy={28} r={5} fill="#0D9E75" />
        <Path d="M35 40 L35 55 Q35 60 40 62 L55 62" stroke={color} strokeWidth={3} strokeLinecap="round" fill="none" opacity={0.7} />
        <Circle cx={58} cy={62} r={4} fill="#FBBF24" />
        <Rect x={14} y={48} width={18} height={10} rx={3} fill={`${color}99`} />
        <Circle cx={18} cy={60} r={2.5} fill={`${color}80`} />
        <Circle cx={28} cy={60} r={2.5} fill={`${color}80`} />
      </G>
    </Svg>
  );
}
