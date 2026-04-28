import { Platform, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function useTopPad() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  return Platform.OS === "web" ? Math.min(width * 0.17, 67) : insets.top;
}

export function useBottomPad(extra: number = 0) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  return Platform.OS === "web"
    ? Math.max(extra + 80, 100)
    : Math.max(insets.bottom + extra, 100);
}