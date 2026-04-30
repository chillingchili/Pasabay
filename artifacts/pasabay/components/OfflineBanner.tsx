import React, { useEffect, useRef, useState } from "react";
import { Animated, Platform, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Surface, Text, useTheme } from "react-native-paper";
import { useNetworkStatus } from "@/lib/network";

const RECONNECT_VISIBLE_MS = 2000;

export default function OfflineBanner() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { isOnline: online } = useNetworkStatus();

  const slideAnim = useRef(new Animated.Value(-60)).current;
  const [showReconnect, setShowReconnect] = useState(false);
  const wasOnlineRef = useRef(true);

  useEffect(() => {
    if (online) {
      if (!wasOnlineRef.current) {
        setShowReconnect(true);
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 80,
          friction: 8,
          useNativeDriver: true,
        }).start();
        const timer = setTimeout(() => {
          Animated.timing(slideAnim, {
            toValue: -60,
            duration: 300,
            useNativeDriver: true,
          }).start(() => setShowReconnect(false));
        }, RECONNECT_VISIBLE_MS);
        wasOnlineRef.current = true;
        return () => clearTimeout(timer);
      }
    } else {
      wasOnlineRef.current = false;
      setShowReconnect(false);
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }
  }, [online]);

  if (online && !showReconnect) return null;

  const isReconnecting = showReconnect;
  const topOffset = Platform.OS === "web" ? 67 : insets.top;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: topOffset,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Surface
        style={[
          styles.banner,
          {
            backgroundColor: isReconnecting
              ? theme.colors.primary
              : theme.colors.tertiaryContainer,
            elevation: 5,
          },
        ]}
      >
        <Feather
          name={isReconnecting ? "wifi" : "wifi-off"}
          size={16}
          color={isReconnecting ? theme.colors.onPrimary : theme.colors.onTertiaryContainer}
        />
        <Text
          variant="bodyLarge"
          style={{
            color: isReconnecting ? theme.colors.onPrimary : theme.colors.onTertiaryContainer,
            fontSize: 13,
          }}
        >
          {isReconnecting ? "Back online" : "No internet connection"}
        </Text>
      </Surface>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 300,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
});
