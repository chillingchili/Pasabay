import React, { useEffect, useRef } from "react";
import { Animated, Platform, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Surface, Text, IconButton, useTheme } from "react-native-paper";

const AUTO_DISMISS_MS = 4000;

interface ErrorBannerProps {
  message: string;
  visible: boolean;
  onDismiss?: () => void;
}

export default function ErrorBanner({ message, visible, onDismiss }: ErrorBannerProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 100,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
    return () => {};
  }, [visible]);

  const dismiss = () => {
    Animated.timing(slideAnim, {
      toValue: 100,
      duration: 200,
      useNativeDriver: true,
    }).start(() => onDismiss?.());
  };

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(dismiss, AUTO_DISMISS_MS);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  const bottomOffset = Platform.OS === "web" ? 32 : insets.bottom + 60;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          bottom: bottomOffset,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Surface
        style={[
          styles.banner,
          {
            backgroundColor: theme.colors.errorContainer,
            elevation: 5,
          },
        ]}
      >
        <Feather name="alert-triangle" size={16} color={theme.colors.onErrorContainer} />
        <Text
          variant="bodyLarge"
          style={{ flex: 1, color: theme.colors.onErrorContainer, fontSize: 13 }}
          numberOfLines={2}
        >
          {message}
        </Text>
        <IconButton
          icon="close"
          size={16}
          iconColor={theme.colors.onErrorContainer}
          onPress={dismiss}
          style={{ margin: 0 }}
        />
      </Surface>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 300,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
});
