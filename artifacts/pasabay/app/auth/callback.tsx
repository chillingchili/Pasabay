import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useApp } from "@/context/AppContext";
import { fetchGoogleUserInfo } from "@/hooks/useGoogleAuth";

export default function AuthCallbackScreen() {
  const { loginWithGoogle } = useApp();
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 900, useNativeDriver: true })
    ).start();

    const handle = async () => {
      try {
        const hash = window.location.hash.slice(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get("access_token");
        const error = params.get("error");

        if (error || !accessToken) {
          router.replace("/welcome");
          return;
        }

        const userInfo = await fetchGoogleUserInfo(accessToken);
        if (!userInfo) { router.replace("/welcome"); return; }

        await loginWithGoogle(userInfo);

        if (!userInfo.email.endsWith("@usc.edu.ph")) {
          router.replace("/welcome");
          return;
        }

        router.replace("/verify-school-id");
      } catch {
        router.replace("/welcome");
      }
    };

    handle();
  }, [loginWithGoogle, spinAnim]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[styles.spinner, {
          transform: [{
            rotate: spinAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] }),
          }],
        }]}
      />
      <Text style={styles.text}>Signing you in with Google...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", gap: 20 },
  spinner: { width: 40, height: 40, borderRadius: 20, borderWidth: 3, borderColor: "#0D9E75", borderTopColor: "transparent" },
  text: { fontSize: 15, color: "#666", fontFamily: "Inter_400Regular" },
});
