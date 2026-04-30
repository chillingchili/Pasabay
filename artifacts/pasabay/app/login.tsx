import React, { useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Svg, { Circle, Path } from "react-native-svg";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { useScale } from "@/hooks/useScale";
import { apiRequest } from "@/lib/api";

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

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { fs, isSmall } = useScale();
  const { login, loginWithGoogle, loginAsDemo } = useApp();
  const { signInWithGoogle, loading: googleLoading } = useGoogleAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const handleForgotPassword = async () => {
    if (!forgotEmail.trim()) {
      setForgotMessage("Please enter your email.");
      setForgotSuccess(false);
      return;
    }
    setForgotLoading(true);
    setForgotMessage(null);
    try {
      await apiRequest("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
      setForgotMessage("If an account with that email exists, a reset link has been sent.");
      setForgotSuccess(true);
    } catch (err: any) {
      const message = err?.message ?? "";
      const status = err?.status;
      if (status === 404) {
        setForgotMessage("No account found with that email.");
      } else if (!message && !status) {
        setForgotMessage("Could not connect to the server. Check your internet connection.");
      } else {
        setForgotMessage(message || "Something went wrong. Please try again.");
      }
      setForgotSuccess(false);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email) { setError("Please enter your email."); return; }
    if (!password) { setError("Please enter your password."); return; }
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      router.replace("/(main)/passenger-home");
    } catch (err: any) {
      const status = err?.status;
      const message = err?.message ?? "";
      if (status === 401) {
        setError("Incorrect email or password. Please try again.");
      } else if (!message && !status) {
        setError("Could not connect to the server. Check your internet connection and try again.");
      } else {
        setError(message || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (Platform.OS === "web") {
      Alert.alert("Use Expo Go", "Google Sign-In requires the Expo Go app on your phone to work properly.");
      return;
    }
    const googleUser = await signInWithGoogle();
    if (!googleUser) return;

    if (!googleUser.email.endsWith("@usc.edu.ph")) {
      Alert.alert("USC Email Required", `Please use your @usc.edu.ph account.\n\nSigned in as: ${googleUser.email}`);
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
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.container, { paddingHorizontal: isSmall ? 16 : 24, paddingTop: insets.top + 12, paddingBottom: Math.max(insets.bottom + 20, 32) }]}>
        <Pressable style={styles.back} onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color={colors.textSecondary} />
          <Text style={[styles.backText, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>Back</Text>
        </Pressable>

        <Text style={[styles.title, { fontSize: fs(28), color: colors.foreground, fontFamily: "Sora_800ExtraBold" }]}>Welcome back</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>Log in to your Pasabay account</Text>

        {showForgotPassword ? (
          <View style={[styles.form, { gap: isSmall ? 12 : 14 }]}>
            {forgotMessage && (
              <View style={[forgotSuccess ? styles.successBox : styles.errorBox]}>
                <Feather name={forgotSuccess ? "check-circle" : "alert-circle"} size={16} color={forgotSuccess ? "#15803d" : colors.destructive} />
                <Text style={[forgotSuccess ? styles.successText : styles.errorText, { color: forgotSuccess ? "#15803d" : colors.destructive, fontFamily: "Inter_400Regular" }]}>{forgotMessage}</Text>
              </View>
            )}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>School email</Text>
              <TextInput
                style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card, fontFamily: "Inter_400Regular" }]}
                value={forgotEmail}
                onChangeText={(t) => { setForgotEmail(t); setForgotMessage(null); }}
                placeholder="yourname@usc.edu.ph"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <Pressable
              style={[styles.btnPrimary, { backgroundColor: forgotLoading ? colors.mutedForeground : colors.primary }]}
              onPress={handleForgotPassword}
              disabled={forgotLoading}
            >
              {forgotLoading && <ActivityIndicator size="small" color="#fff" />}
              <Text style={[styles.btnPrimaryText, { fontFamily: "Inter_600SemiBold" }]}>{forgotLoading ? "Sending..." : "Send Reset Link"}</Text>
            </Pressable>

            <Pressable
              style={styles.forgotRow}
              onPress={() => { setShowForgotPassword(false); setForgotMessage(null); setForgotEmail(""); }}
            >
              <Text style={[styles.forgotText, { color: colors.primary, fontFamily: "Inter_400Regular" }]}>Back to Login</Text>
            </Pressable>
          </View>
        ) : (
          <View style={[styles.form, { gap: isSmall ? 12 : 14 }]}>
            {error && (
              <View style={styles.errorBox}>
                <Feather name="alert-circle" size={16} color={colors.destructive} />
                <Text style={[styles.errorText, { color: colors.destructive, fontFamily: "Inter_400Regular" }]}>{error}</Text>
              </View>
            )}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>School email</Text>
              <TextInput
                style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card, fontFamily: "Inter_400Regular" }]}
                value={email}
                onChangeText={setEmail}
                placeholder="yourname@usc.edu.ph"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>Password</Text>
              <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <TextInput
                  style={[styles.inputFlex, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showPass}
                />
                <Pressable onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                  <Feather name={showPass ? "eye-off" : "eye"} size={18} color={colors.textSecondary} />
                </Pressable>
              </View>
            </View>

            <Pressable style={styles.forgotRow} onPress={() => { setShowForgotPassword(true); setError(null); }}>
              <Text style={[styles.forgotText, { color: colors.primary, fontFamily: "Inter_400Regular" }]}>Forgot password?</Text>
            </Pressable>

            <Pressable
              style={[styles.btnPrimary, { backgroundColor: loading ? colors.mutedForeground : colors.primary }]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading && <ActivityIndicator size="small" color="#fff" />}
              <Text style={[styles.btnPrimaryText, { fontFamily: "Inter_600SemiBold" }]}>{loading ? "Logging in..." : "Log in"}</Text>
            </Pressable>

            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.textMuted, fontFamily: "Inter_400Regular" }]}>or</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            <Pressable
              style={({ pressed }) => [styles.btnGoogle, { borderColor: colors.border, opacity: pressed || googleLoading ? 0.7 : 1 }]}
              onPress={handleGoogleLogin}
              disabled={googleLoading}
            >
              {googleLoading ? (
                <Text style={[styles.btnGoogleText, { color: colors.textSecondary, fontFamily: "Inter_500Medium" }]}>Signing in...</Text>
              ) : (
                <>
                  <GoogleIcon />
                  <Text style={[styles.btnGoogleText, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>Continue with Google</Text>
                </>
              )}
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.btnDemo, { backgroundColor: colors.primaryLighter, opacity: pressed ? 0.7 : 1 }]}
              onPress={async () => { await loginAsDemo(); router.replace("/(main)/passenger-home"); }}
            >
              <Feather name="zap" size={16} color={colors.primary} />
              <Text style={[styles.btnDemoText, { color: colors.primary, fontFamily: "Inter_500Medium" }]}>Try demo — no sign-in needed</Text>
            </Pressable>

            <Text style={[styles.footer, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
              Don't have an account?{" "}
              <Text style={{ color: colors.primary, fontFamily: "Inter_500Medium" }} onPress={() => router.push("/signup")}>Sign up</Text>
            </Text>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24 },
  back: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 28 },
  backText: { fontSize: 14 },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 6 },
  subtitle: { fontSize: 14, marginBottom: 32 },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 10, backgroundColor: "#fef2f2", borderWidth: 1, borderColor: "#fecaca" },
  errorText: { flex: 1, fontSize: 13, lineHeight: 18 },
  successBox: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 10, backgroundColor: "#f0fdf4", borderWidth: 1, borderColor: "#bbf7d0" },
  successText: { flex: 1, fontSize: 13, lineHeight: 18 },
  form: { gap: 14 },
  formGroup: { gap: 6 },
  label: { fontSize: 13, fontWeight: "500" },
  input: { height: 50, borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 14, fontSize: 15 },
  inputRow: { flexDirection: "row", alignItems: "center", height: 50, borderRadius: 12, borderWidth: 1.5, paddingLeft: 14, paddingRight: 8 },
  inputFlex: { flex: 1, fontSize: 15, height: 50 },
  eyeBtn: { padding: 8 },
  forgotRow: { alignSelf: "flex-end" },
  forgotText: { fontSize: 13 },
  btnPrimary: { height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 4, flexDirection: "row", gap: 8 },
  btnPrimaryText: { color: "#fff", fontSize: 16 },
  divider: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 4 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 13 },
  btnGoogle: { height: 52, borderRadius: 14, borderWidth: 1.5, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: "#fff" },
  btnGoogleText: { fontSize: 15 },
  btnDemo: { height: 44, borderRadius: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  btnDemoText: { fontSize: 14 },
  footer: { textAlign: "center", fontSize: 13, marginTop: 4 },
});
