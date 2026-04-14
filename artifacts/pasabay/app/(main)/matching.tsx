import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

export default function MatchingScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const ring1 = useRef(new Animated.Value(1)).current;
  const ring2 = useRef(new Animated.Value(1)).current;
  const ring3 = useRef(new Animated.Value(1)).current;

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  useEffect(() => {
    const createRingAnim = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(anim, { toValue: 2.2, duration: 1400, useNativeDriver: true }),
          ]),
          Animated.timing(anim, { toValue: 1, duration: 0, useNativeDriver: true }),
        ])
      );

    const a1 = createRingAnim(ring1, 0);
    const a2 = createRingAnim(ring2, 400);
    const a3 = createRingAnim(ring3, 800);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, [ring1, ring2, ring3]);

  const dot1 = useRef(new Animated.Value(0.4)).current;
  const dot2 = useRef(new Animated.Value(0.4)).current;
  const dot3 = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const createDot = (d: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(d, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(d, { toValue: 0.4, duration: 300, useNativeDriver: true }),
          Animated.delay(600),
        ])
      );
    const d1 = createDot(dot1, 0); const d2 = createDot(dot2, 200); const d3 = createDot(dot3, 400);
    d1.start(); d2.start(); d3.start();
    return () => { d1.stop(); d2.stop(); d3.stop(); };
  }, [dot1, dot2, dot3]);

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/(main)/match-found");
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={styles.ringsContainer}>
          {[ring1, ring2, ring3].map((r, i) => (
            <Animated.View
              key={i}
              style={[styles.ring, {
                borderColor: `${colors.primary}${i === 0 ? "30" : i === 1 ? "20" : "10"}`,
                transform: [{ scale: r }],
                opacity: r.interpolate({ inputRange: [1, 2.2], outputRange: [0.6, 0] }),
              }]}
            />
          ))}
          <View style={[styles.centerIcon, { backgroundColor: colors.primary }]}>
            <Feather name="navigation-2" size={28} color="#fff" />
          </View>
        </View>

        <Text style={[styles.mainText, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
          Looking for a pasabay...
        </Text>
        <Text style={[styles.subText, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
          Finding drivers heading to{"\n"}
          <Text style={[styles.destHighlight, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>IT Park, Lahug</Text>
        </Text>

        <View style={styles.dots}>
          {[dot1, dot2, dot3].map((d, i) => (
            <Animated.View key={i} style={[styles.dot, { backgroundColor: colors.primary, opacity: d }]} />
          ))}
        </View>

        <View style={[styles.fareCard, { backgroundColor: colors.card }]}>
          <View style={styles.fareCardHeader}>
            <Text style={[styles.fareCardLabel, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>Estimated fare</Text>
            <View style={[styles.farePill, { backgroundColor: colors.accentBg }]}>
              <Text style={[styles.farePillText, { color: colors.accentDark, fontFamily: "Inter_700Bold" }]}>₱18</Text>
            </View>
          </View>
          <View style={styles.fareStats}>
            <FareStat label="Distance" value="3.2 km" colors={colors} />
            <View style={[styles.fareStatDivider, { backgroundColor: colors.border }]} />
            <FareStat label="Walk" value="~4 min" colors={colors} />
            <View style={[styles.fareStatDivider, { backgroundColor: colors.border }]} />
            <FareStat label="ETA" value="~12 min" colors={colors} />
          </View>
        </View>
      </View>

      <View style={[styles.bottom, { paddingBottom: Math.max(insets.bottom + 16, 32) }]}>
        <Pressable
          style={[styles.cancelBtn, { borderColor: colors.destructiveLight }]}
          onPress={() => router.back()}
        >
          <Text style={[styles.cancelText, { color: colors.destructive, fontFamily: "Inter_500Medium" }]}>Cancel search</Text>
        </Pressable>
      </View>
    </View>
  );
}

function FareStat({ label, value, colors }: { label: string; value: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={styles.fareStat}>
      <Text style={[styles.fareStatLabel, { color: colors.textMuted, fontFamily: "Inter_400Regular" }]}>{label}</Text>
      <Text style={[styles.fareStatValue, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{value}</Text>
    </View>
  );
}

import { Platform } from "react-native";

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24, paddingTop: 40 },
  ringsContainer: { width: 140, height: 140, alignItems: "center", justifyContent: "center", marginBottom: 32 },
  ring: { position: "absolute", width: 100, height: 100, borderRadius: 50, borderWidth: 2 },
  centerIcon: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  mainText: { fontSize: 22, textAlign: "center", marginBottom: 8 },
  subText: { fontSize: 14, textAlign: "center", lineHeight: 22, marginBottom: 20 },
  destHighlight: { fontSize: 15 },
  dots: { flexDirection: "row", gap: 6, marginBottom: 32 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  fareCard: { width: "100%", borderRadius: 16, padding: 16, gap: 12 },
  fareCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  fareCardLabel: { fontSize: 12 },
  farePill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  farePillText: { fontSize: 14 },
  fareStats: { flexDirection: "row", alignItems: "center" },
  fareStat: { flex: 1, alignItems: "center" },
  fareStatLabel: { fontSize: 10, marginBottom: 3 },
  fareStatValue: { fontSize: 14 },
  fareStatDivider: { width: 1, height: 28 },
  bottom: { paddingHorizontal: 24 },
  cancelBtn: { height: 50, borderRadius: 14, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  cancelText: { fontSize: 15 },
});
