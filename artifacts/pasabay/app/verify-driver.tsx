import React, { useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useScale } from "@/hooks/useScale";

export default function VerifyDriverScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { fs, isSmall } = useScale();
  const [stage, setStage] = useState<"capture" | "analyzing" | "success">("capture");
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.04, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const handleScan = () => {
    setStage("analyzing");
    Animated.timing(progressAnim, { toValue: 1, duration: 2500, useNativeDriver: false }).start(() => {
      setStage("success");
    });
  };

  const handleContinue = () => {
    router.replace("/vehicle-details");
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { fontSize: fs(22), fontFamily: "Sora_800ExtraBold" }]}>Verify your license</Text>
        <Text style={[styles.step, { fontFamily: "Inter_400Regular" }]}>Step 2 of 2</Text>
      </View>

      <View style={styles.stepBars}>
        <View style={[styles.stepBar, styles.stepBarDone]} />
        <View style={[styles.stepBar, styles.stepBarActive]} />
      </View>

      <View style={[styles.privacyNote, { backgroundColor: "rgba(255,255,255,0.08)" }]}>
        <Feather name="shield" size={16} color="rgba(255,255,255,0.6)" />
        <Text style={[styles.privacyText, { fontFamily: "Inter_400Regular" }]}>
          Your license is used only for identity verification and is encrypted at rest. We never share your data.
        </Text>
      </View>

      {stage === "capture" && (
        <View style={styles.cameraArea}>
          <Animated.View style={[styles.frame, { width: '75%', maxWidth: 280, transform: [{ scale: pulseAnim }] }]}>
            <View style={styles.frameCorner1} />
            <View style={styles.frameCorner2} />
            <View style={styles.frameCorner3} />
            <View style={styles.frameCorner4} />
            <View style={styles.frameInner}>
              <Feather name="credit-card" size={36} color="rgba(255,255,255,0.4)" />
              <Text style={[styles.frameText, { fontFamily: "Inter_400Regular" }]}>Align your Driver's License{"\n"}within the frame</Text>
            </View>
          </Animated.View>

          <View style={styles.tips}>
            <TipRow icon="sun" text="Use a well-lit room and avoid glare on your license" />
            <TipRow icon="eye" text="Make sure all text and your photo are clearly visible" />
          </View>
        </View>
      )}

      {stage === "analyzing" && (
        <View style={styles.cameraArea}>
          <View style={styles.analyzingContainer}>
            <View style={[styles.analyzeIcon]}>
              <Feather name="cpu" size={36} color="#fff" />
            </View>
            <Text style={[styles.analyzeTitle, { fontFamily: "Inter_600SemiBold" }]}>Verifying license...</Text>
            <Text style={[styles.analyzeSubtext, { fontFamily: "Inter_400Regular" }]}>Checking authenticity via secure service</Text>
            <View style={styles.progressBarBg}>
              <Animated.View
                style={[styles.progressBarFill, { width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) }]}
              />
            </View>
          </View>
        </View>
      )}

      {stage === "success" && (
        <View style={styles.cameraArea}>
          <View style={styles.analyzingContainer}>
            <View style={styles.analyzeIcon}>
              <Feather name="check-circle" size={36} color="#fff" />
            </View>
            <Text style={[styles.analyzeTitle, { fontFamily: "Inter_600SemiBold" }]}>License verified!</Text>
            <Text style={[styles.analyzeSubtext, { fontFamily: "Inter_400Regular" }]}>Your Philippine Driver's License has been verified</Text>
            <View style={[styles.successTag]}>
              <Feather name="check" size={14} color="#fff" />
              <Text style={[styles.successTagText, { fontFamily: "Inter_500Medium" }]}>Driver License · Authentic</Text>
            </View>
          </View>
        </View>
      )}

      <View style={[styles.buttons, { paddingBottom: Math.max(insets.bottom + 24, 40) }]}>
        {stage === "capture" && (
          <>
            <Pressable style={styles.btnCapture} onPress={handleScan}>
              <Feather name="camera" size={20} color="#fff" />
              <Text style={[styles.btnCaptureText, { fontFamily: "Inter_600SemiBold" }]}>Scan license</Text>
            </Pressable>
            <Pressable style={styles.btnGhost} onPress={handleContinue}>
              <Text style={[styles.btnGhostText, { fontFamily: "Inter_400Regular" }]}>Enter manually instead</Text>
            </Pressable>
            <Pressable style={[styles.btnSkip]} onPress={() => router.replace("/(main)/passenger-home")}>
              <Feather name="arrow-right" size={18} color="#fff" />
              <Text style={[styles.btnSkipText, { fontFamily: "Inter_600SemiBold" }]}>Skip for now</Text>
            </Pressable>
          </>
        )}
        {stage === "success" && (
          <Pressable style={styles.btnCapture} onPress={handleContinue}>
            <Text style={[styles.btnCaptureText, { fontFamily: "Inter_600SemiBold" }]}>Continue to vehicle details</Text>
            <Feather name="arrow-right" size={20} color="#fff" />
          </Pressable>
        )}
      </View>
    </View>
  );
}

function TipRow({ icon, text }: { icon: keyof typeof Feather.glyphMap; text: string }) {
  return (
    <View style={styles.tipRow}>
      <View style={styles.tipIcon}>
        <Feather name={icon} size={14} color="rgba(255,255,255,0.7)" />
      </View>
      <Text style={[styles.tipText, { fontFamily: "Inter_400Regular" }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a7d5c" },
  header: { alignItems: "center", paddingTop: 12, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: "700", color: "#fff" },
  step: { fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 4 },
  stepBars: { flexDirection: "row", gap: 8, paddingHorizontal: 24, marginBottom: 16 },
  stepBar: { flex: 1, height: 4, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 2 },
  stepBarActive: { backgroundColor: "#fff" },
  stepBarDone: { backgroundColor: "rgba(255,255,255,0.6)" },
  privacyNote: { marginHorizontal: 24, borderRadius: 12, padding: 14, flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 8 },
  privacyText: { flex: 1, color: "rgba(255,255,255,0.65)", fontSize: 12, lineHeight: 17 },
  cameraArea: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  frame: { width: 280, height: 180, borderRadius: 12, backgroundColor: "rgba(0,0,0,0.3)", alignItems: "center", justifyContent: "center", marginBottom: 28, position: "relative" },
  frameCorner1: { position: "absolute", top: -2, left: -2, width: 22, height: 22, borderTopWidth: 3, borderLeftWidth: 3, borderColor: "#fff", borderRadius: 4 },
  frameCorner2: { position: "absolute", top: -2, right: -2, width: 22, height: 22, borderTopWidth: 3, borderRightWidth: 3, borderColor: "#fff", borderRadius: 4 },
  frameCorner3: { position: "absolute", bottom: -2, left: -2, width: 22, height: 22, borderBottomWidth: 3, borderLeftWidth: 3, borderColor: "#fff", borderRadius: 4 },
  frameCorner4: { position: "absolute", bottom: -2, right: -2, width: 22, height: 22, borderBottomWidth: 3, borderRightWidth: 3, borderColor: "#fff", borderRadius: 4 },
  frameInner: { alignItems: "center", gap: 10 },
  frameText: { color: "rgba(255,255,255,0.6)", fontSize: 12, textAlign: "center", lineHeight: 17 },
  tips: { gap: 10, width: "100%" },
  tipRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  tipIcon: { width: 28, height: 28, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  tipText: { flex: 1, color: "rgba(255,255,255,0.7)", fontSize: 12, lineHeight: 17 },
  analyzingContainer: { alignItems: "center", gap: 14 },
  analyzeIcon: { width: 80, height: 80, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  analyzeTitle: { fontSize: 20, color: "#fff", fontWeight: "600" },
  analyzeSubtext: { fontSize: 13, color: "rgba(255,255,255,0.7)", textAlign: "center" },
  progressBarBg: { width: 240, height: 6, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 3, overflow: "hidden" },
  progressBarFill: { height: 6, backgroundColor: "#fff", borderRadius: 3 },
  successTag: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.15)" },
  successTagText: { color: "#fff", fontSize: 14 },
  buttons: { paddingHorizontal: 24, gap: 10 },
  btnCapture: { height: 52, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.2)", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  btnCaptureText: { color: "#fff", fontSize: 16 },
  btnGhost: { height: 40, alignItems: "center", justifyContent: "center" },
  btnGhostText: { color: "rgba(255,255,255,0.5)", fontSize: 13 },
  btnSkip: { height: 52, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.12)", borderWidth: 1, borderColor: "rgba(255,255,255,0.25)", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  btnSkipText: { color: "#fff", fontSize: 15 },
});
