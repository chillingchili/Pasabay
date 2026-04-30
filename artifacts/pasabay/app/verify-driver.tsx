import React, { useEffect, useRef, useState } from "react";
import { Animated, Alert, Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Text, Button, Surface, useTheme } from "react-native-paper";
import { useScale } from "@/hooks/useScale";

export default function VerifyDriverScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
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
    Alert.alert("", "Your details have been sent for verification", [{ text: "OK", onPress: () => router.replace("/vehicle-details") }]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={{ color: "#fff" }}>Verify your license</Text>
        <Text variant="bodyLarge" style={styles.stepSubtitle}>Step 2 of 2</Text>
      </View>

      <View style={styles.stepBars}>
        <View style={[styles.stepBar, styles.stepBarDone]} />
        <View style={[styles.stepBar, styles.stepBarActive]} />
      </View>

      <Surface style={[styles.privacyNote, { backgroundColor: "rgba(255,255,255,0.08)" }]}>
        <Feather name="shield" size={16} color="rgba(255,255,255,0.6)" />
        <Text variant="bodyLarge" style={styles.privacyText}>
          Your license is used only for identity verification and is encrypted at rest. We never share your data.
        </Text>
      </Surface>

      {stage === "capture" && (
        <View style={styles.cameraArea}>
          <Animated.View style={[styles.frame, { width: '75%', maxWidth: 280, transform: [{ scale: pulseAnim }] }]}>
            <View style={styles.frameCorner1} />
            <View style={styles.frameCorner2} />
            <View style={styles.frameCorner3} />
            <View style={styles.frameCorner4} />
            <View style={styles.frameInner}>
              <Feather name="credit-card" size={36} color="rgba(255,255,255,0.4)" />
              <Text variant="bodyLarge" style={styles.frameText}>Align your Driver's License{"\n"}within the frame</Text>
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
            <Surface style={styles.analyzeIcon}>
              <Feather name="cpu" size={36} color="#fff" />
            </Surface>
            <Text variant="headlineSmall" style={{ color: "#fff" }}>Verifying license...</Text>
            <Text variant="bodyLarge" style={{ color: "rgba(255,255,255,0.7)" }}>Checking authenticity via secure service</Text>
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
            <Surface style={styles.analyzeIcon}>
              <Feather name="check-circle" size={36} color="#fff" />
            </Surface>
            <Text variant="headlineSmall" style={{ color: "#fff" }}>License verified!</Text>
            <Text variant="bodyLarge" style={{ color: "rgba(255,255,255,0.7)" }}>Your Philippine Driver's License has been verified</Text>
            <Surface style={styles.successTag}>
              <Feather name="check" size={14} color="#fff" />
              <Text variant="labelLarge" style={{ color: "#fff" }}>Driver License · Authentic</Text>
            </Surface>
          </View>
        </View>
      )}

      <View style={[styles.buttons, { paddingBottom: Math.max(insets.bottom + 24, 40) }]}>
        {stage === "capture" && (
          <>
            <Button mode="contained" onPress={handleScan} buttonColor="rgba(255,255,255,0.2)" textColor="#fff" style={styles.btn} icon="camera">
              Scan license
            </Button>
            <Button mode="text" onPress={handleContinue} textColor="rgba(255,255,255,0.5)">
              Enter manually instead
            </Button>
            <Button mode="outlined" onPress={() => router.replace("/(main)/passenger-home")} textColor="#fff" style={[styles.btn, { borderColor: "rgba(255,255,255,0.25)" }]} icon="arrow-right">
              Skip for now
            </Button>
          </>
        )}
        {stage === "success" && (
          <Button mode="contained" onPress={handleContinue} buttonColor="rgba(255,255,255,0.2)" textColor="#fff" style={styles.btn}>
            Continue to vehicle details
          </Button>
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
      <Text variant="bodyLarge" style={styles.tipText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a7d5c" },
  header: { alignItems: "center", paddingTop: 12, paddingBottom: 8 },
  stepSubtitle: { fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 4 },
  stepBars: { flexDirection: "row", gap: 8, paddingHorizontal: 24, marginBottom: 16 },
  stepBar: { flex: 1, height: 4, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 2 },
  stepBarActive: { backgroundColor: "#fff" },
  stepBarDone: { backgroundColor: "rgba(255,255,255,0.6)" },
  privacyNote: { marginHorizontal: 24, borderRadius: 12, padding: 14, flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 8, elevation: 2 },
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
  analyzeIcon: { width: 80, height: 80, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center", elevation: 2 },
  progressBarBg: { width: 240, height: 6, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 3, overflow: "hidden" },
  progressBarFill: { height: 6, backgroundColor: "#fff", borderRadius: 3 },
  successTag: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.15)", elevation: 1 },
  buttons: { paddingHorizontal: 24, gap: 10 },
  btn: { height: 52, borderRadius: 14, justifyContent: "center" },
});
