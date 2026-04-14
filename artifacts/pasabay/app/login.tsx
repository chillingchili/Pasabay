import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { login } = useApp();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email) { Alert.alert("Required", "Please enter your email."); return; }
    if (!password) { Alert.alert("Required", "Please enter your password."); return; }
    setLoading(true);
    try {
      await login(email, password);
      router.replace("/(main)/passenger-home");
    } catch {
      Alert.alert("Error", "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.container, { paddingTop: insets.top + 12, paddingBottom: Math.max(insets.bottom + 20, 32) }]}>
        <Pressable style={styles.back} onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color={colors.textSecondary} />
          <Text style={[styles.backText, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>Back</Text>
        </Pressable>

        <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Welcome back</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>Log in to your Pasabay account</Text>

        <View style={styles.form}>
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

          <Pressable style={styles.forgotRow} onPress={() => {}}>
            <Text style={[styles.forgotText, { color: colors.primary, fontFamily: "Inter_400Regular" }]}>Forgot password?</Text>
          </Pressable>

          <Pressable
            style={[styles.btnPrimary, { backgroundColor: loading ? colors.mutedForeground : colors.primary }]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={[styles.btnPrimaryText, { fontFamily: "Inter_600SemiBold" }]}>{loading ? "Logging in..." : "Log in"}</Text>
          </Pressable>

          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textMuted, fontFamily: "Inter_400Regular" }]}>or</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          <Pressable style={[styles.btnGoogle, { borderColor: colors.border }]} onPress={() => {}}>
            <Feather name="globe" size={18} color={colors.foreground} />
            <Text style={[styles.btnGoogleText, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>Continue with Google</Text>
          </Pressable>

          <Text style={[styles.footer, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
            Don't have an account?{" "}
            <Text style={{ color: colors.primary, fontFamily: "Inter_500Medium" }} onPress={() => router.push("/signup")}>Sign up</Text>
          </Text>
        </View>
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
  form: { gap: 14 },
  formGroup: { gap: 6 },
  label: { fontSize: 13, fontWeight: "500" },
  input: { height: 50, borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 14, fontSize: 15 },
  inputRow: { flexDirection: "row", alignItems: "center", height: 50, borderRadius: 12, borderWidth: 1.5, paddingLeft: 14, paddingRight: 8 },
  inputFlex: { flex: 1, fontSize: 15, height: 50 },
  eyeBtn: { padding: 8 },
  forgotRow: { alignSelf: "flex-end" },
  forgotText: { fontSize: 13 },
  btnPrimary: { height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 4 },
  btnPrimaryText: { color: "#fff", fontSize: 16 },
  divider: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 4 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 13 },
  btnGoogle: { height: 52, borderRadius: 14, borderWidth: 1.5, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  btnGoogleText: { fontSize: 15 },
  footer: { textAlign: "center", fontSize: 13, marginTop: 4 },
});
