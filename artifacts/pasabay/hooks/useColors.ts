/**
 * @deprecated Use useTheme() from react-native-paper instead.
 * This hook is kept temporarily for reference but should not be used in new code.
 *
 * Migration: Replace `import { useColors } from "@/hooks/useColors"` with
 * `import { useTheme } from "react-native-paper"` and use `const { colors } = useTheme()`.
 */
import { useColorScheme } from "react-native";

import colors from "@/constants/colors";

/**
 * Returns the design tokens for the current color scheme.
 *
 * @deprecated Use useTheme() from react-native-paper.
 */
export function useColors() {
  const scheme = useColorScheme();
  const palette =
    scheme === "dark" && "dark" in colors
      ? (colors as Record<string, typeof colors.light>).dark
      : colors.light;
  return { ...palette, radius: colors.radius };
}
