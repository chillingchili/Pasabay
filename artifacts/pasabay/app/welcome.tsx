import React, { useEffect, useRef } from "react";
import { Alert, Animated, Platform, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { useTheme } from "react-native-paper";
import { Card, Button, Text, Divider } from "react-native-paper";
import { Feather } from "@expo/vector-icons";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { useApp } from "@/context/AppContext";
import { useScale } from "@/hooks/useScale";

function GoogleIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 48 48">
      <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <Path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <Path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </Svg>
  );
}

function TeaserCard() {
  const { colors } = useTheme();
  return (
    <Card mode="outlined" style={{ backgroundColor: colors.surfaceVariant, borderRadius: 14, width: 280 }}>
      <Card.Content style={{ padding: 16 }}>
        <View style={styles.teaserRow}>
          <View style={[styles.teaserDot, { backgroundColor: colors.primary }]} />
          <Text variant="labelLarge" style={[styles.teaserLabel, { color: colors.onSurfaceVariant }]}>From</Text>
          <Text variant="bodyLarge" style={[styles.teaserValue, { color: colors.onSurface }]}>Your location</Text>
        </View>
        <Divider style={{ backgroundColor: colors.outlineVariant, marginLeft: 18 }} />
        <View style={styles.teaserRow}>
          <View style={[styles.teaserDot, { backgroundColor: colors.primary }]} />
          <Text variant="labelLarge" style={[styles.teaserLabel, { color: colors.onSurfaceVariant }]}>To</Text>
          <Text variant="bodyLarge" style={[styles.teaserValue, { color: colors.onSurfaceDisabled }]}>Where to?</Text>
        </View>
      </Card.Content>
    </Card>
  );
}

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { s, fs, isSmall } = useScale();
  const { loginWithGoogle, loginAsDemo } = useApp();
  const { signInWithGoogle, loading: googleLoading } = useGoogleAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleGoogleAuth = async () => {
    if (Platform.OS === "web") {
      Alert.alert(
        "Google Sign-In",
        "On the web preview, Google Sign-In redirects away from the page. Use the Expo Go app on your phone to test this.",
        [{ text: "OK" }]
      );
      return;
    }

    const googleUser = await signInWithGoogle();
    if (!googleUser) return;

    if (!googleUser.email.endsWith("@usc.edu.ph")) {
      Alert.alert(
        "USC Email Required",
        `Pasabay is only for USC students. Please sign in with your @usc.edu.ph Google account.\n\nSigned in as: ${googleUser.email}`,
        [{ text: "OK" }]
      );
      return;
    }

    const { isNew } = await loginWithGoogle(googleUser);
    if (isNew) {
      router.replace("/verify-school-id");
    } else {
      router.replace("/(main)/passenger-home");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <Animated.View style={[styles.heroSection, { paddingTop: s(60), paddingHorizontal: isSmall ? 16 : 24, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={[styles.illustration, { marginBottom: s(20) }]}>
          <TeaserCard />
        </View>

        <Text variant="displaySmall" style={[styles.title, { fontSize: fs(28), color: colors.onSurface }]}>
          Your campus, your commute
        </Text>
        <Text variant="bodyLarge" style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
          Share rides with fellow Carolinians.{"\n"}Safe, affordable campus commutes.
        </Text>
      </Animated.View>

      <View style={{ flex: 1 }} />

      <Animated.View style={[styles.buttons, { opacity: fadeAnim, paddingBottom: Math.max(insets.bottom + 20, 32) }]}>
        <Button
          mode="contained"
          buttonColor={colors.primary}
          textColor={colors.onPrimary}
          onPress={() => router.push("/signup")}
          style={styles.btnFull}
          contentStyle={styles.btnContent}
          labelStyle={{ fontFamily: "Inter_600SemiBold", fontSize: 16 }}
        >
          Sign up with email
        </Button>

        <Button
          mode="outlined"
          textColor={colors.onSurface}
          onPress={() => router.push("/login")}
          style={[styles.btnFull, { borderColor: colors.outline }]}
          contentStyle={styles.btnContent}
          labelStyle={{ fontFamily: "Inter_600SemiBold", fontSize: 16 }}
        >
          Log in
        </Button>

        <View style={styles.divider}>
          <View style={[styles.dividerLine, { backgroundColor: colors.outline }]} />
          <Text variant="labelLarge" style={[styles.dividerText, { color: colors.onSurfaceDisabled }]}>or</Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.outline }]} />
        </View>

        <Button
          mode="outlined"
          onPress={handleGoogleAuth}
          disabled={googleLoading}
          loading={googleLoading}
          style={[styles.btnFull, { borderColor: colors.outline, backgroundColor: "#fff" }]}
          contentStyle={styles.btnContent}
          labelStyle={{ fontFamily: "Inter_500Medium", fontSize: 15, color: googleLoading ? colors.onSurfaceVariant : colors.onSurface }}
          icon={() => googleLoading ? null : <GoogleIcon />}
        >
          {googleLoading ? "Signing in..." : "Continue with Google"}
        </Button>

        <Button
          mode="text"
          textColor={colors.primary}
          onPress={async () => { await loginAsDemo(); router.replace("/(main)/passenger-home"); }}
          style={[styles.btnFull, { borderColor: colors.outline }]}
          contentStyle={styles.btnContent}
          labelStyle={{ fontFamily: "Inter_500Medium", fontSize: 14 }}
          icon={() => <Feather name="zap" size={16} color={colors.primary} />}
        >
          Try demo — no sign-in needed
        </Button>

        <Text variant="labelLarge" style={[styles.restriction, { color: colors.onSurfaceDisabled }]}>
          Restricted to <Text variant="labelLarge" style={{ color: colors.onSurfaceVariant, fontFamily: "Inter_500Medium" }}>@usc.edu.ph</Text> email addresses
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroSection: { alignItems: "center" },
  illustration: {},
  title: { fontWeight: "800", letterSpacing: -0.5, textAlign: "center" },
  subtitle: { fontSize: 15, textAlign: "center", lineHeight: 22, marginTop: 8 },
  teaserRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
  teaserDot: { width: 8, height: 8, borderRadius: 4 },
  teaserLabel: { fontSize: 12, width: 40 },
  teaserValue: { fontSize: 14, flex: 1 },
  buttons: { paddingHorizontal: 24, gap: 10 },
  btnFull: { borderRadius: 14 },
  btnContent: { height: 52 },
  divider: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 4 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 13 },
  restriction: { fontSize: 11, textAlign: "center", lineHeight: 16 },
});
