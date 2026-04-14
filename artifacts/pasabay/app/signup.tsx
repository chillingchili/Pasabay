import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";

export default function SignupScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { signup } = useApp();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!email.endsWith(".edu.ph") && !email.endsWith(".edu")) {
      Alert.alert("Invalid Email", "Please use your USC school email (@usc.edu.ph).");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Weak Password", "Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      Alert.alert("Password Mismatch", "Passwords do not match.");
      return;
    }
    if (!agreed) {
      Alert.alert("Terms Required", "Please agree to the Terms of Service.");
      return;
    }
    setLoading(true);
    try {
      await signup(email, password);
      router.replace("/verify-school-id");
    } catch {
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 12, paddingBottom: Math.max(insets.bottom + 20, 32) }]}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable style={styles.back} onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color={colors.textSecondary} />
          <Text style={[styles.backText, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>Back</Text>
        </Pressable>

        <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Create account</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>Join the USC Pasabay community</Text>

        <View style={styles.form}>
          <FormGroup label="School email" colors={colors}>
            <TextInput
              style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card, fontFamily: "Inter_400Regular" }]}
              value={email}
              onChangeText={setEmail}
              placeholder="yourname@usc.edu.ph"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </FormGroup>

          <FormGroup label="Password" colors={colors}>
            <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <TextInput
                style={[styles.inputFlex, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
                value={password}
                onChangeText={setPassword}
                placeholder="Create a password"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showPass}
              />
              <Pressable onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                <Feather name={showPass ? "eye-off" : "eye"} size={18} color={colors.textSecondary} />
              </Pressable>
            </View>
          </FormGroup>

          <FormGroup label="Confirm password" colors={colors}>
            <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <TextInput
                style={[styles.inputFlex, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
                value={confirm}
                onChangeText={setConfirm}
                placeholder="Re-enter your password"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showConfirm}
              />
              <Pressable onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeBtn}>
                <Feather name={showConfirm ? "eye-off" : "eye"} size={18} color={colors.textSecondary} />
              </Pressable>
            </View>
          </FormGroup>

          <Pressable style={styles.checkRow} onPress={() => setAgreed(!agreed)}>
            <View style={[styles.checkbox, { borderColor: agreed ? colors.primary : colors.border, backgroundColor: agreed ? colors.primary : "transparent" }]}>
              {agreed && <Feather name="check" size={12} color="#fff" />}
            </View>
            <Text style={[styles.checkText, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
              I agree to the{" "}
              <Text style={{ color: colors.primary }}>Terms of Service</Text>
              {" "}and{" "}
              <Text style={{ color: colors.primary }}>Privacy Policy</Text>
            </Text>
          </Pressable>

          <Pressable
            style={[styles.btnPrimary, { backgroundColor: loading ? colors.mutedForeground : colors.primary }]}
            onPress={handleSignup}
            disabled={loading}
          >
            <Text style={[styles.btnPrimaryText, { fontFamily: "Inter_600SemiBold" }]}>{loading ? "Creating account..." : "Sign up"}</Text>
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
            Already have an account?{" "}
            <Text style={{ color: colors.primary, fontFamily: "Inter_500Medium" }} onPress={() => router.push("/login")}>Log in</Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function FormGroup({ label, children, colors }: { label: string; children: React.ReactNode; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={styles.formGroup}>
      <Text style={[styles.label, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 24 },
  back: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 24 },
  backText: { fontSize: 14 },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 6 },
  subtitle: { fontSize: 14, marginBottom: 28 },
  form: { gap: 14 },
  formGroup: { gap: 6 },
  label: { fontSize: 13, fontWeight: "500" },
  input: { height: 50, borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 14, fontSize: 15 },
  inputRow: { flexDirection: "row", alignItems: "center", height: 50, borderRadius: 12, borderWidth: 1.5, paddingLeft: 14, paddingRight: 8 },
  inputFlex: { flex: 1, fontSize: 15, height: 50 },
  eyeBtn: { padding: 8 },
  checkRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginVertical: 4 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, alignItems: "center", justifyContent: "center", marginTop: 1 },
  checkText: { flex: 1, fontSize: 13, lineHeight: 18 },
  btnPrimary: { height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 4 },
  btnPrimaryText: { color: "#fff", fontSize: 16 },
  divider: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 4 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 13 },
  btnGoogle: { height: 52, borderRadius: 14, borderWidth: 1.5, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  btnGoogleText: { fontSize: 15 },
  footer: { textAlign: "center", fontSize: 13, marginTop: 4, paddingBottom: 20 },
});
