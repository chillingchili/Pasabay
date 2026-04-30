import { MD3LightTheme, configureFonts } from "react-native-paper";

import type { MD3Theme } from "react-native-paper";

const theme: MD3Theme = {
  ...MD3LightTheme,
  roundness: 14,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#0D9E75",
    onPrimary: "#ffffff",
    primaryContainer: "#E1F5EE",
    onPrimaryContainer: "#0D9E75",
    secondary: "#999999",
    onSecondary: "#ffffff",
    secondaryContainer: "#f0f0f0",
    onSecondaryContainer: "#1a1a2e",
    tertiary: "#FBBF24",
    onTertiary: "#1a1a2e",
    tertiaryContainer: "#FEF3C7",
    onTertiaryContainer: "#92400E",
    error: "#EF4444",
    onError: "#ffffff",
    errorContainer: "#FEE2E2",
    onErrorContainer: "#EF4444",
    surface: "#ffffff",
    onSurface: "#1a1a2e",
    surfaceVariant: "#f7f7f7",
    onSurfaceVariant: "#999999",
    outline: "#e8e8e8",
    outlineVariant: "#f0f0f0",
    inverseSurface: "#1a1a2e",
    inverseOnSurface: "#ffffff",
    inversePrimary: "#E1F5EE",
    backdrop: "rgba(0,0,0,0.5)",
    surfaceDisabled: "rgba(28,27,31,0.12)",
    onSurfaceDisabled: "rgba(28,27,31,0.38)",
  },
  fonts: configureFonts({
    config: {
      displaySmall: {
        fontFamily: "Sora_800ExtraBold",
        fontSize: 28,
        fontWeight: "800",
        lineHeight: 34,
      },
      headlineSmall: {
        fontFamily: "Sora_800ExtraBold",
        fontSize: 20,
        fontWeight: "800",
        lineHeight: 26,
      },
      bodyLarge: {
        fontFamily: "Inter_400Regular",
        fontSize: 16,
        fontWeight: "400",
        lineHeight: 24,
      },
      labelLarge: {
        fontFamily: "Inter_400Regular",
        fontSize: 14,
        fontWeight: "400",
        lineHeight: 20,
      },
      titleMedium: {
        fontFamily: "Inter_500Medium",
        fontSize: 16,
        fontWeight: "500",
        lineHeight: 22,
      },
    },
  }),
};

export { theme };
export type { MD3Theme };
