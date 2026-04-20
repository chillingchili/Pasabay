import { useWindowDimensions } from 'react-native';

const BASE_WIDTH = 390; // iPhone 13/14/15 reference

export function useScale() {
  const { width } = useWindowDimensions();
  const ratio = width / BASE_WIDTH;

  return {
    s: (val: number) => Math.round(val * Math.max(0.85, Math.min(ratio, 1.15))),
    vs: (val: number) => Math.round(val * Math.max(0.9, Math.min(ratio, 1.1))),
    fs: (val: number) => Math.round(val * Math.max(0.9, Math.min(ratio, 1.1))),
    width,
    isSmall: width <= 375,
  };
}
