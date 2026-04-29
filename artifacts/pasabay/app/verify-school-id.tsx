import React, { useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { useScale } from "@/hooks/useScale";

export default function VerifySchoolIdScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { fs, isSmall } = useScale();
  const { setSchoolIdVerified } = useApp();
  const [stage, setStage] = useState<"capture" | "analyzing" | "success">("capture");
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const handleTakePhoto = () => {
    setStage("analyzing");
    Animated.timing(progressAnim, { toValue: 1, duration: 2200, useNativeDriver: false }).start(() => {
      setStage("success");
    });
  };

const handleContinue = (skipDriver?: boolean) => {
  setSchoolIdVerified();
  if (skipDriver) {
    router.replace("/(main)/passenger-home");
  } else {
    router.replace("/verify-driver");
  }
};

  return (
    <View style={[styles.container, { backgroundColor: "#0a7d5c", paddingTop: insets.top, paddingHorizontal: isSmall ? 16 : 24 }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { fontSize: fs(22), fontFamily: "Inter_700Bold" }]}>Verify your school ID</Text>
        <Text style={[styles.step, { fontFamily: "Inter_400Regular" }]}>Step 1 of 2</Text>
      </View>

      <View style={styles.stepBars}>
        <View style={[styles.stepBar, styles.stepBarActive]} />
        <View style={[styles.stepBar]} />
      </View>

      {stage === "capture" && (
        <View style={styles.cameraArea}>
          <Animated.View style={[styles.frame, { width: '75%', maxWidth: 280, transform: [{ scale: pulseAnim }] }]}>
            <View style={styles.frameCorner1} />
            <View style={styles.frameCorner2} />
            <View style={styles.frameCorner3} />
            <View style={styles.frameCorner4} />
            <View style={styles.frameInner}>
              <Feather name="credit-card" size={40} color="rgba(255,255,255,0.4)" />
              <Text style={[styles.frameText, { fontFamily: "Inter_400Regular" }]}>Align your USC ID{"\n"}within the frame</Text>
            </View>
          </Animated.View>

          <View style={styles.tips}>
            <TipRow icon="sun" text="Use a well-lit room and avoid glare on your ID" />
            <TipRow icon="shield" text="Hold your phone steady until the photo is taken" />
          </View>
        </View>
      )}

      {stage === "analyzing" && (
        <View style={styles.cameraArea}>
          <View style={styles.analyzingContainer}>
            <View style={[styles.analyzeIcon, { backgroundColor: "rgba(255,255,255,0.1)" }]}>
              <Feather name="cpu" size={36} color="#fff" />
            </View>
            <Text style={[styles.analyzeTitle, { fontFamily: "Inter_600SemiBold" }]}>Verifying your ID...</Text>
            <Text style={[styles.analyzeSubtext, { fontFamily: "Inter_400Regular" }]}>AI is checking your USC school ID</Text>
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
            <View style={[styles.analyzeIcon, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
              <Feather name="check-circle" size={36} color="#fff" />
            </View>
            <Text style={[styles.analyzeTitle, { fontFamily: "Inter_600SemiBold" }]}>Verification successful!</Text>
            <Text style={[styles.analyzeSubtext, { fontFamily: "Inter_400Regular" }]}>Your USC student identity has been confirmed</Text>
            <View style={[styles.successTag, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
              <Feather name="user" size={14} color="#fff" />
              <Text style={[styles.successTagText, { fontFamily: "Inter_500Medium" }]}>USC Student · Verified</Text>
            </View>
          </View>
        </View>
      )}

      <View style={[styles.buttons, { paddingBottom: Math.max(insets.bottom + 24, 40) }]}>
        {stage === "capture" && (
          <>
            <Pressable style={[styles.btnCapture]} onPress={handleTakePhoto}>
              <Feather name="camera" size={20} color="#fff" />
              <Text style={[styles.btnCaptureText, { fontFamily: "Inter_600SemiBold" }]}>Take photo</Text>
            </Pressable>
            <Pressable style={styles.btnGhost} onPress={handleTakePhoto}>
              <Text style={[styles.btnGhostText, { fontFamily: "Inter_400Regular" }]}>Enter manually instead</Text>
            </Pressable>
          </>
        )}
        {stage === "success" && (
          <>
            <Pressable style={[styles.btnCapture, { backgroundColor: "rgba(255,255,255,0.3)" }]} onPress={() => handleContinue(true)}>
              <Text style={[styles.btnCaptureText, { fontFamily: "Inter_600SemiBold" }]}>Skip for now (Continue as Passenger)</Text>
            </Pressable>
            <Pressable style={[styles.btnCapture]} onPress={() => handleContinue(false)}>
              <Text style={[styles.btnCaptureText, { fontFamily: "Inter_600SemiBold" }]}>Continue</Text>
              <Feather name="arrow-right" size={20} color="#fff" />
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

function TipRow({ icon, text }: { icon: keyof typeof Feather.glyphMap; text: string }) {
  return (
    <View style={styles.tipRow}>
      <View style={[styles.tipIcon]}>
        <Feather name={icon} size={14} color="rgba(255,255,255,0.7)" />
      </View>
      <Text style={[styles.tipText, { fontFamily: "Inter_400Regular" }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: "center", paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: "700", color: "#fff" },
  step: { fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 4 },
  stepBars: { flexDirection: "row", gap: 8, paddingHorizontal: 24, marginBottom: 20 },
  stepBar: { flex: 1, height: 4, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 2 },
  stepBarActive: { backgroundColor: "#fff" },
  cameraArea: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  frame: { height: 200, borderRadius: 14, backgroundColor: "rgba(0,0,0,0.3)", alignItems: "center", justifyContent: "center", marginBottom: 32, position: "relative" },
  frameCorner1: { position: "absolute", top: -2, left: -2, width: 24, height: 24, borderTopWidth: 3, borderLeftWidth: 3, borderColor: "#fff", borderRadius: 4 },
  frameCorner2: { position: "absolute", top: -2, right: -2, width: 24, height: 24, borderTopWidth: 3, borderRightWidth: 3, borderColor: "#fff", borderRadius: 4 },
  frameCorner3: { position: "absolute", bottom: -2, left: -2, width: 24, height: 24, borderBottomWidth: 3, borderLeftWidth: 3, borderColor: "#fff", borderRadius: 4 },
  frameCorner4: { position: "absolute", bottom: -2, right: -2, width: 24, height: 24, borderBottomWidth: 3, borderRightWidth: 3, borderColor: "#fff", borderRadius: 4 },
  frameInner: { alignItems: "center", gap: 12 },
  frameText: { color: "rgba(255,255,255,0.6)", fontSize: 13, textAlign: "center", lineHeight: 18 },
  tips: { gap: 12, width: "100%" },
  tipRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  tipIcon: { width: 28, height: 28, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  tipText: { flex: 1, color: "rgba(255,255,255,0.7)", fontSize: 13, lineHeight: 18 },
  analyzingContainer: { alignItems: "center", gap: 16 },
  analyzeIcon: { width: 80, height: 80, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  analyzeTitle: { fontSize: 20, color: "#fff", fontWeight: "600" },
  analyzeSubtext: { fontSize: 13, color: "rgba(255,255,255,0.7)", textAlign: "center" },
  progressBarBg: { width: 240, height: 6, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 3, overflow: "hidden" },
  progressBarFill: { height: 6, backgroundColor: "#fff", borderRadius: 3 },
  successTag: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  successTagText: { color: "#fff", fontSize: 14 },
  buttons: { paddingHorizontal: 24, gap: 10 },
  btnCapture: { height: 52, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.2)", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  btnCaptureText: { color: "#fff", fontSize: 16 },
  btnGhost: { height: 44, alignItems: "center", justifyContent: "center" },
  btnGhostText: { color: "rgba(255,255,255,0.5)", fontSize: 14 },
});
