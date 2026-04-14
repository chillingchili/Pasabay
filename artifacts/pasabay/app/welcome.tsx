import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Line, Path } from "react-native-svg";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View style={[styles.heroSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.illustration}>
          <Svg width={200} height={200} viewBox="0 0 200 200" fill="none">
            <Circle cx={100} cy={100} r={90} fill={colors.primaryLight} />
            <Circle cx={100} cy={100} r={70} fill={colors.primaryLighter} />
            <Line x1={40} y1={100} x2={160} y2={100} stroke={colors.primary} strokeWidth={2} opacity={0.2} />
            <Line x1={100} y1={40} x2={100} y2={160} stroke={colors.primary} strokeWidth={2} opacity={0.2} />
            <Path d="M70 130 Q100 90 130 70" stroke={colors.primary} strokeWidth={3} fill="none" strokeLinecap="round" strokeDasharray="6 4" />
            <Circle cx={70} cy={130} r={10} fill={colors.primary} />
            <Circle cx={70} cy={130} r={4} fill="#fff" />
            <Circle cx={130} cy={70} r={10} fill={colors.accent} />
            <Circle cx={130} cy={70} r={4} fill="#fff" />
          </Svg>
        </View>

        <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Pasabay</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
          Share rides with fellow Carolinians.{"\n"}Safe, affordable campus commutes.
        </Text>
      </Animated.View>

      <Animated.View style={[styles.features, { opacity: fadeAnim }]}>
        <FeatureItem icon="shield" label={"Verified\nstudents only"} colors={colors} />
        <FeatureItem icon="dollar-sign" label={"Cost-sharing\nfares only"} colors={colors} />
        <FeatureItem icon="users" label={"Same route\nmatching"} colors={colors} />
      </Animated.View>

      <View style={{ flex: 1 }} />

      <Animated.View style={[styles.buttons, { opacity: fadeAnim, paddingBottom: Math.max(insets.bottom + 20, 32) }]}>
        <Pressable
          style={({ pressed }) => [styles.btnPrimary, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
          onPress={() => router.push("/signup")}
        >
          <Text style={[styles.btnPrimaryText, { fontFamily: "Inter_600SemiBold" }]}>Sign up</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.btnOutline, { borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
          onPress={() => router.push("/login")}
        >
          <Text style={[styles.btnOutlineText, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>Log in</Text>
        </Pressable>

        <View style={styles.divider}>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.textMuted, fontFamily: "Inter_400Regular" }]}>or</Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        </View>

        <Pressable
          style={({ pressed }) => [styles.btnGoogle, { borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
          onPress={() => router.push("/login")}
        >
          <Feather name="globe" size={18} color={colors.foreground} />
          <Text style={[styles.btnGoogleText, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>Continue with Google</Text>
        </Pressable>

        <Text style={[styles.restriction, { color: colors.textMuted, fontFamily: "Inter_400Regular" }]}>
          Restricted to <Text style={{ color: colors.textSecondary, fontFamily: "Inter_500Medium" }}>@usc.edu.ph</Text> email addresses
        </Text>
      </Animated.View>
    </View>
  );
}

function FeatureItem({ icon, label, colors }: { icon: keyof typeof Feather.glyphMap; label: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={styles.featureItem}>
      <View style={[styles.featureIcon, { backgroundColor: colors.primaryLight }]}>
        <Feather name={icon} size={22} color={colors.primary} />
      </View>
      <Text style={[styles.featureText, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroSection: { alignItems: "center", paddingTop: 60, paddingHorizontal: 24 },
  illustration: { marginBottom: 20 },
  title: { fontSize: 36, fontWeight: "700", letterSpacing: -0.5 },
  subtitle: { fontSize: 15, textAlign: "center", lineHeight: 22, marginTop: 8 },
  features: { flexDirection: "row", paddingHorizontal: 24, paddingTop: 28, gap: 8 },
  featureItem: { flex: 1, alignItems: "center", gap: 8 },
  featureIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  featureText: { fontSize: 11, textAlign: "center", lineHeight: 15 },
  buttons: { paddingHorizontal: 24, gap: 10 },
  btnPrimary: { height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  btnPrimaryText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  btnOutline: { height: 52, borderRadius: 14, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  btnOutlineText: { fontSize: 16, fontWeight: "600" },
  btnGoogle: { height: 52, borderRadius: 14, borderWidth: 1.5, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  btnGoogleText: { fontSize: 15 },
  divider: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 4 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 13 },
  restriction: { fontSize: 11, textAlign: "center", lineHeight: 16 },
});
