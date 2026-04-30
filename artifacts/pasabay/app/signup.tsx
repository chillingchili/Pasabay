import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import { useTheme, Text, TextInput, Button, Divider } from "react-native-paper";
import { useApp } from "@/context/AppContext";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
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

export default function SignupScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { fs, isSmall } = useScale();
  const { signup, loginWithGoogle } = useApp();
  const { signInWithGoogle, loading: googleLoading } = useGoogleAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async () => {
    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!email.endsWith("@usc.edu.ph")) {
      setError("Please use your USC school email (@usc.edu.ph).");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (!agreed) {
      setError("Please agree to the Terms of Service.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signup(name.trim(), email, password);
      router.replace("/verify-school-id");
    } catch (err: any) {
      const status = err?.status || err?.statusCode;
      const message = err?.message ?? "";
      if (status === 409) {
        setError("An account with this email already exists. Try logging in instead.");
      } else if (!message && !status) {
        setError("Could not connect to the server. Check your internet connection and try again.");
      } else {
        setError(message || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    if (Platform.OS === "web") {
      Alert.alert("Use Expo Go", "Google Sign-In requires the Expo Go app on your phone to work properly.");
      return;
    }
    if (!agreed) {
      setError("Please agree to the Terms of Service to continue.");
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
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.container, { paddingHorizontal: isSmall ? 16 : 24, paddingTop: insets.top + 12, paddingBottom: Math.max(insets.bottom + 20, 32) }]}
        keyboardShouldPersistTaps="handled"
      >
        <Button mode="text" onPress={() => router.back()} style={styles.backBtn} textColor={colors.onSurfaceVariant}>
          Back
        </Button>

        <Text variant="headlineSmall" style={{ marginBottom: 6 }}>Create account</Text>
        <Text variant="bodyLarge" style={{ color: colors.onSurfaceVariant, marginBottom: 28 }}>Join the USC Pasabay community</Text>

        <View style={[styles.form, { gap: isSmall ? 12 : 14 }]}>
          {error && (
            <View style={styles.errorBox}>
              <Feather name="alert-circle" size={16} color={colors.error} />
              <Text variant="bodyLarge" style={{ flex: 1, fontSize: 13, color: colors.error }}>{error}</Text>
            </View>
          )}

          <TextInput
            label="Full name"
            mode="outlined"
            value={name}
            onChangeText={setName}
            placeholder="Juan Dela Cruz"
            autoCapitalize="words"
            autoComplete="name"
            activeOutlineColor={colors.primary}
          />

          <TextInput
            label="School email"
            mode="outlined"
            value={email}
            onChangeText={setEmail}
            placeholder="yourname@usc.edu.ph"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            activeOutlineColor={colors.primary}
          />

          <TextInput
            label="Password"
            mode="outlined"
            value={password}
            onChangeText={setPassword}
            placeholder="Create a password"
            secureTextEntry={!showPass}
            activeOutlineColor={colors.primary}
            right={<TextInput.Icon icon={showPass ? "eye-off" : "eye"} onPress={() => setShowPass(!showPass)} />}
          />

          <TextInput
            label="Confirm password"
            mode="outlined"
            value={confirm}
            onChangeText={setConfirm}
            placeholder="Re-enter your password"
            secureTextEntry={!showConfirm}
            activeOutlineColor={colors.primary}
            right={<TextInput.Icon icon={showConfirm ? "eye-off" : "eye"} onPress={() => setShowConfirm(!showConfirm)} />}
          />

          <Pressable style={styles.checkRow} onPress={() => setAgreed(!agreed)}>
            <View style={[styles.checkbox, { borderColor: agreed ? colors.primary : colors.outline, backgroundColor: agreed ? colors.primary : "transparent" }]}>
              {agreed && <Feather name="check" size={12} color="#fff" />}
            </View>
            <Text variant="bodyLarge" style={{ flex: 1, fontSize: 13, color: colors.onSurfaceVariant }}>
              I agree to the{" "}
              <Text style={{ color: colors.primary }}>Terms of Service</Text>
              {" "}and{" "}
              <Text style={{ color: colors.primary }}>Privacy Policy</Text>
            </Text>
          </Pressable>

          <Button
            mode="contained"
            onPress={handleSignup}
            disabled={loading}
            loading={loading}
            buttonColor={colors.primary}
            style={styles.btn}
          >
            {loading ? "Creating account..." : "Sign up"}
          </Button>

          <Divider style={{ marginVertical: 4 }} />

          <Button
            mode="outlined"
            onPress={handleGoogleSignup}
            disabled={googleLoading}
            loading={googleLoading}
            style={styles.googleBtn}
          >
            {googleLoading ? "Signing in..." : "Continue with Google"}
          </Button>

          <Text variant="bodyLarge" style={styles.footer}>
            Already have an account?{" "}
            <Text style={{ color: colors.primary, fontFamily: "Inter_500Medium" }} onPress={() => router.push("/login")}>Log in</Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {},
  backBtn: { alignSelf: "flex-start", marginBottom: 12 },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 10, backgroundColor: "#fef2f2", borderWidth: 1, borderColor: "#fecaca" },
  form: { gap: 14 },
  checkRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginVertical: 4 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, alignItems: "center", justifyContent: "center", marginTop: 1 },
  btn: { height: 52, borderRadius: 14, justifyContent: "center" },
  googleBtn: { height: 52, borderRadius: 14, justifyContent: "center" },
  footer: { textAlign: "center", fontSize: 13, marginTop: 4, paddingBottom: 20, color: "#999999" },
});
