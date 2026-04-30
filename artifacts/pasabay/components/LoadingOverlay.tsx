import React, { useEffect, useRef } from "react";
import { ActivityIndicator, Animated, StyleSheet } from "react-native";
import { Surface, Text, useTheme } from "react-native-paper";

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  blocking?: boolean;
}

export default function LoadingOverlay({
  visible,
  message = "Loading...",
  blocking = false,
}: LoadingOverlayProps) {
  const theme = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          backgroundColor: blocking ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0.15)",
        },
      ]}
      pointerEvents={blocking ? "none" : "auto"}
    >
      <Surface
        style={[
          styles.card,
          { backgroundColor: theme.colors.surface, elevation: 5 },
        ]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text variant="bodyLarge">{message}</Text>
      </Surface>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 50,
  },
  card: {
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
});
