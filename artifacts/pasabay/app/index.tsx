import { useApp } from "@/context/AppContext";
import { Redirect } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { PasabayLogo } from "@/components/PasabayLogo";
import { useScale } from "@/hooks/useScale";

export default function SplashScreen() {
  const { isLoading, isAuthenticated, user } = useApp();
  const { s, fs } = useScale();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  if (!isLoading) {
    if (isAuthenticated && user?.verified) {
      return <Redirect href="/(main)/passenger-home" />;
    }
    if (isAuthenticated && !user?.verified) {
      return <Redirect href="/verify-school-id" />;
    }
    return <Redirect href="/welcome" />;
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <PasabayLogo size={80} color="#fff" />
        <Text style={styles.name}>Pasabay</Text>
        <Text style={styles.tagline}>Campus Commute</Text>
        <View style={styles.dots}>
          <Dot delay={0} />
          <Dot delay={200} />
          <Dot delay={400} />
        </View>
      </Animated.View>
    </View>
  );
}

function Dot({ delay }: { delay: number }) {
  const opacity = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        Animated.delay(600 - delay),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [delay, opacity]);

  return <Animated.View style={[styles.dot, { opacity }]} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D9E75",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
    gap: 12,
  },
  name: {
    fontSize: 36,
    fontWeight: "700",
    color: "#fff",
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
    marginTop: 8,
  },
  tagline: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    fontFamily: "Inter_400Regular",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  dots: {
    flexDirection: "row",
    gap: 6,
    marginTop: 32,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.7)",
  },
});
