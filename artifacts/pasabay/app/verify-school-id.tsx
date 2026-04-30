import React, { useEffect, useRef, useState } from "react";
import { Animated, Alert, Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Text, Button, Surface, useTheme } from "react-native-paper";
import { useApp } from "@/context/AppContext";
import { useScale } from "@/hooks/useScale";

export default function VerifySchoolIdScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
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

  const handleContinue = () => {
    setSchoolIdVerified();
    Alert.alert("", "Your details have been sent for verification", [{ text: "OK", onPress: () => router.replace("/verify-driver") }]);
  };

  return (
    <View style={[styles.container, { backgroundColor: "#0a7d5c", paddingTop: insets.top, paddingHorizontal: isSmall ? 16 : 24 }]}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={{ color: "#fff" }}>Verify your school ID</Text>
        <Text variant="bodyLarge" style={styles.stepSubtitle}>Step 1 of 2</Text>
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
              <Text variant="bodyLarge" style={styles.frameText}>Align your USC ID{"\n"}within the frame</Text>
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
            <Surface style={[styles.analyzeIcon, { backgroundColor: "rgba(255,255,255,0.1)" }]}>
              <Feather name="cpu" size={36} color="#fff" />
            </Surface>
            <Text variant="headlineSmall" style={{ color: "#fff" }}>Verifying your ID...</Text>
            <Text variant="bodyLarge" style={{ color: "rgba(255,255,255,0.7)" }}>AI is checking your USC school ID</Text>
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
            <Surface style={[styles.analyzeIcon, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
              <Feather name="check-circle" size={36} color="#fff" />
            </Surface>
            <Text variant="headlineSmall" style={{ color: "#fff" }}>Verification successful!</Text>
            <Text variant="bodyLarge" style={{ color: "rgba(255,255,255,0.7)" }}>Your USC student identity has been confirmed</Text>
            <Surface style={[styles.successTag, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
              <Feather name="user" size={14} color="#fff" />
              <Text variant="labelLarge" style={{ color: "#fff" }}>USC Student · Verified</Text>
            </Surface>
          </View>
        </View>
      )}

      <View style={[styles.buttons, { paddingBottom: Math.max(insets.bottom + 24, 40) }]}>
        {stage === "capture" && (
          <>
            <Button mode="contained" onPress={handleTakePhoto} buttonColor="rgba(255,255,255,0.2)" textColor="#fff" style={styles.btn} icon="camera">
              Take photo
            </Button>
            <Button mode="text" onPress={handleTakePhoto} textColor="rgba(255,255,255,0.5)">
              Enter manually instead
            </Button>
          </>
        )}
        {stage === "success" && (
          <Button mode="contained" onPress={handleContinue} buttonColor="rgba(255,255,255,0.2)" textColor="#fff" style={styles.btn}>
            Continue
          </Button>
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
      <Text variant="bodyLarge" style={styles.tipText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: "center", paddingTop: 16, paddingBottom: 8 },
  stepSubtitle: { fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 4 },
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
  analyzeIcon: { width: 80, height: 80, borderRadius: 24, alignItems: "center", justifyContent: "center", elevation: 2 },
  progressBarBg: { width: 240, height: 6, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 3, overflow: "hidden" },
  progressBarFill: { height: 6, backgroundColor: "#fff", borderRadius: 3 },
  successTag: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, elevation: 1 },
  buttons: { paddingHorizontal: 24, gap: 10 },
  btn: { height: 52, borderRadius: 14, justifyContent: "center" },
});
