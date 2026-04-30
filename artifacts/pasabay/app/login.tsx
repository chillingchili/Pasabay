import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import { useTheme, Text, TextInput, Button, Divider } from "react-native-paper";
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
  const { colors } = useTheme();
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
      style={{ flex: 1, backgroundColor: colors.surface }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.container, { paddingHorizontal: isSmall ? 16 : 24, paddingTop: insets.top + 12, paddingBottom: Math.max(insets.bottom + 20, 32) }]}>
        <Button mode="text" onPress={() => router.back()} style={styles.backBtn} textColor={colors.onSurfaceVariant}>
          Back
        </Button>

        <Text variant="headlineSmall" style={{ marginBottom: 6 }}>Welcome back</Text>
        <Text variant="bodyLarge" style={{ color: colors.onSurfaceVariant, marginBottom: 32 }}>Log in to your Pasabay account</Text>

        {showForgotPassword ? (
          <View style={[styles.form, { gap: isSmall ? 12 : 14 }]}>
            {forgotMessage && (
              <View style={[forgotSuccess ? styles.successBox : styles.errorBox]}>
                <Feather name={forgotSuccess ? "check-circle" : "alert-circle"} size={16} color={forgotSuccess ? "#15803d" : colors.error} />
                <Text variant="bodyLarge" style={{ flex: 1, fontSize: 13, color: forgotSuccess ? "#15803d" : colors.error }}>{forgotMessage}</Text>
              </View>
            )}
            <TextInput
              label="School email"
              mode="outlined"
              value={forgotEmail}
              onChangeText={(t) => { setForgotEmail(t); setForgotMessage(null); }}
              placeholder="yourname@usc.edu.ph"
              keyboardType="email-address"
              autoCapitalize="none"
              activeOutlineColor={colors.primary}
            />

            <Button
              mode="contained"
              onPress={handleForgotPassword}
              disabled={forgotLoading}
              loading={forgotLoading}
              buttonColor={colors.primary}
              style={styles.btn}
            >
              {forgotLoading ? "Sending..." : "Send Reset Link"}
            </Button>

            <Button mode="text" onPress={() => { setShowForgotPassword(false); setForgotMessage(null); setForgotEmail(""); }} textColor={colors.primary}>
              Back to Login
            </Button>
          </View>
        ) : (
          <View style={[styles.form, { gap: isSmall ? 12 : 14 }]}>
            {error && (
              <View style={styles.errorBox}>
                <Feather name="alert-circle" size={16} color={colors.error} />
                <Text variant="bodyLarge" style={{ flex: 1, fontSize: 13, color: colors.error }}>{error}</Text>
              </View>
            )}
            <TextInput
              label="School email"
              mode="outlined"
              value={email}
              onChangeText={setEmail}
              placeholder="yourname@usc.edu.ph"
              keyboardType="email-address"
              autoCapitalize="none"
              activeOutlineColor={colors.primary}
            />

            <TextInput
              label="Password"
              mode="outlined"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry={!showPass}
              activeOutlineColor={colors.primary}
              right={<TextInput.Icon icon={showPass ? "eye-off" : "eye"} onPress={() => setShowPass(!showPass)} />}
            />

            <Button mode="text" onPress={() => { setShowForgotPassword(true); setError(null); }} textColor={colors.primary} style={{ alignSelf: "flex-end" }}>
              Forgot password?
            </Button>

            <Button
              mode="contained"
              onPress={handleLogin}
              disabled={loading}
              loading={loading}
              buttonColor={colors.primary}
              style={styles.btn}
            >
              {loading ? "Logging in..." : "Log in"}
            </Button>

            <Divider style={{ marginVertical: 4 }} />

            <Button
              mode="outlined"
              onPress={handleGoogleLogin}
              disabled={googleLoading}
              loading={googleLoading}
              style={styles.googleBtn}
            >
              {googleLoading ? "Signing in..." : "Continue with Google"}
            </Button>

            <Button mode="text" onPress={async () => { await loginAsDemo(); router.replace("/(main)/passenger-home"); }} textColor={colors.primary} icon="zap">
              Try demo — no sign-in needed
            </Button>

            <Text variant="bodyLarge" style={styles.footer}>
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
  container: { flex: 1 },
  backBtn: { alignSelf: "flex-start", marginBottom: 16 },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 10, backgroundColor: "#fef2f2", borderWidth: 1, borderColor: "#fecaca" },
  successBox: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 10, backgroundColor: "#f0fdf4", borderWidth: 1, borderColor: "#bbf7d0" },
  form: { gap: 14 },
  btn: { height: 52, borderRadius: 14, justifyContent: "center" },
  googleBtn: { height: 52, borderRadius: 14, justifyContent: "center" },
  footer: { textAlign: "center", fontSize: 13, marginTop: 4, color: "#999999" },
});
