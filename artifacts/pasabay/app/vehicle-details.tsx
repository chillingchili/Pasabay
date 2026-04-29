import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { useScale } from "@/hooks/useScale";
import { apiRequest } from "@/lib/api";

const CAR_MAKES = ["Toyota", "Honda", "Mitsubishi", "Nissan", "Hyundai", "Suzuki", "Ford", "Other"];
const SEAT_OPTIONS = ["2", "3", "4", "5", "6", "7"];

export default function VehicleDetailsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { fs, isSmall } = useScale();
  const { refreshUser } = useApp();

  const [plate, setPlate] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [seats, setSeats] = useState("4");
  const [carColor, setCarColor] = useState("");
  const [fuelEff, setFuelEff] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
    };
  }, []);

  const currentYear = new Date().getFullYear();

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!plate.trim()) errors.plate = "Plate number is required";
    else if (!/^[a-zA-Z0-9\s]{3,10}$/.test(plate.trim())) errors.plate = "3-10 alphanumeric characters";
    if (!make) errors.make = "Select a car make";
    if (!model.trim()) errors.model = "Model is required";
    const yearNum = parseInt(year);
    if (!year || isNaN(yearNum)) errors.year = "Year is required";
    else if (yearNum < 1990 || yearNum > currentYear) errors.year = `Must be between 1990 and ${currentYear}`;
    if (!carColor.trim()) errors.color = "Car color is required";
    const seatsNum = parseInt(seats);
    if (seatsNum < 1 || seatsNum > 8) errors.seats = "Must be between 1 and 8";
    if (fuelEff) {
      const eff = parseFloat(fuelEff);
      if (isNaN(eff) || eff <= 0 || eff > 30) errors.fuelEff = "Must be between 5 and 30 km/L";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    setError(null);
    if (!validate()) return;
    setLoading(true);
    try {
      const response = await apiRequest("/users/driver", {
        method: "POST",
        body: JSON.stringify({
          plate: plate.trim(),
          make,
          model: model.trim(),
          year: parseInt(year),
          color: carColor,
          seats: parseInt(seats),
          fuelEfficiency: fuelEff ? parseFloat(fuelEff) : undefined,
        }),
      });
      if (fuelEff && response?.fuelEfficiencyApproved === false && response?.fuelEfficiency != null) {
        Alert.alert("Fuel Efficiency Adjusted", `Adjusted to ${Number(response.fuelEfficiency).toFixed(1)} km/L based on vehicle specs.`);
      }
      await refreshUser();
      setLoading(false);
      setSuccess(true);
      redirectTimer.current = setTimeout(() => {
        router.replace("/(main)/profile");
      }, 1200);
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message ?? "Failed to submit vehicle details. Please try again.";
      setError(message);
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
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 12, paddingBottom: Math.max(insets.bottom + 24, 40) }]}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable style={styles.back} onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color={colors.textSecondary} />
          <Text style={[styles.backText, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>Back</Text>
        </Pressable>

        <Text style={[styles.title, { fontSize: fs(26), color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Vehicle details</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>Tell us about your car so passengers can find you</Text>

        <View style={[styles.carIllustration, { backgroundColor: colors.primaryLight }]}>
          <Feather name="truck" size={40} color={colors.primary} />
        </View>

        <View style={styles.form}>
          <FormGroup label="License plate number" colors={colors}>
            <TextInput
              style={[styles.input, { color: colors.foreground, borderColor: fieldErrors.plate ? "#ef4444" : colors.border, backgroundColor: colors.card, fontFamily: "Inter_400Regular" }]}
              value={plate}
              onChangeText={t => { setPlate(t.toUpperCase()); if (fieldErrors.plate) setFieldErrors(prev => { const n = { ...prev }; delete n.plate; return n; }); }}
              placeholder="e.g. ABC 1234"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="characters"
            />
            {fieldErrors.plate && <Text style={[styles.fieldError, { color: "#ef4444" }]}>{fieldErrors.plate}</Text>}
          </FormGroup>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <FormGroup label="Car make" colors={colors}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 0 }}>
                  <View style={{ flexDirection: "row", gap: 6 }}>
                    {CAR_MAKES.map(m => (
                      <Pressable
                        key={m}
                        onPress={() => { setMake(m); if (fieldErrors.make) setFieldErrors(prev => { const n = { ...prev }; delete n.make; return n; }); }}
                        style={[styles.chip, { backgroundColor: make === m ? colors.primary : colors.card, borderColor: fieldErrors.make ? "#ef4444" : make === m ? colors.primary : colors.border }]}
                      >
                        <Text style={[styles.chipText, { color: make === m ? "#fff" : colors.foreground, fontFamily: "Inter_500Medium" }]}>{m}</Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
                {fieldErrors.make && <Text style={[styles.fieldError, { color: "#ef4444" }]}>{fieldErrors.make}</Text>}
              </FormGroup>
            </View>
          </View>

          <FormGroup label="Car model" colors={colors}>
            <TextInput
              style={[styles.input, { color: colors.foreground, borderColor: fieldErrors.model ? "#ef4444" : colors.border, backgroundColor: colors.card, fontFamily: "Inter_400Regular" }]}
              value={model}
              onChangeText={t => { setModel(t); if (fieldErrors.model) setFieldErrors(prev => { const n = { ...prev }; delete n.model; return n; }); }}
              placeholder="e.g. Vios"
              placeholderTextColor={colors.textMuted}
            />
            {fieldErrors.model && <Text style={[styles.fieldError, { color: "#ef4444" }]}>{fieldErrors.model}</Text>}
          </FormGroup>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <FormGroup label="Year" colors={colors}>
                <TextInput
                  style={[styles.input, { color: colors.foreground, borderColor: fieldErrors.year ? "#ef4444" : colors.border, backgroundColor: colors.card, fontFamily: "Inter_400Regular" }]}
                  value={year}
                  onChangeText={t => { setYear(t); if (fieldErrors.year) setFieldErrors(prev => { const n = { ...prev }; delete n.year; return n; }); }}
                  placeholder="e.g. 2019"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  maxLength={4}
                />
                {fieldErrors.year && <Text style={[styles.fieldError, { color: "#ef4444" }]}>{fieldErrors.year}</Text>}
              </FormGroup>
            </View>
            <View style={{ flex: 1 }}>
              <FormGroup label="Seat capacity" colors={colors}>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                  {SEAT_OPTIONS.map(s => (
                    <Pressable
                      key={s}
                      onPress={() => { setSeats(s); if (fieldErrors.seats) setFieldErrors(prev => { const n = { ...prev }; delete n.seats; return n; }); }}
                      style={[styles.seatChip, { backgroundColor: seats === s ? colors.primary : colors.card, borderColor: fieldErrors.seats ? "#ef4444" : seats === s ? colors.primary : colors.border }]}
                    >
                      <Text style={[styles.chipText, { color: seats === s ? "#fff" : colors.foreground, fontFamily: "Inter_500Medium" }]}>{s}</Text>
                    </Pressable>
                  ))}
                </View>
                {fieldErrors.seats && <Text style={[styles.fieldError, { color: "#ef4444" }]}>{fieldErrors.seats}</Text>}
              </FormGroup>
            </View>
          </View>

          <FormGroup label="Car color" colors={colors}>
            <TextInput
              style={[styles.input, { color: colors.foreground, borderColor: fieldErrors.color ? "#ef4444" : colors.border, backgroundColor: colors.card, fontFamily: "Inter_400Regular" }]}
              value={carColor}
              onChangeText={t => { setCarColor(t); if (fieldErrors.color) setFieldErrors(prev => { const n = { ...prev }; delete n.color; return n; }); }}
              placeholder="e.g. Silver, White, Black"
              placeholderTextColor={colors.textMuted}
            />
            {fieldErrors.color && <Text style={[styles.fieldError, { color: "#ef4444" }]}>{fieldErrors.color}</Text>}
          </FormGroup>

          <View style={[styles.fuelSection, { borderTopColor: colors.borderLighter }]}>
            <View style={styles.fuelHeader}>
              <Text style={[styles.label, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>Fuel efficiency (km/L)</Text>
              <View style={[styles.optionalBadge, { backgroundColor: colors.primaryLight }]}>
                <Text style={[styles.optionalText, { color: colors.primary, fontFamily: "Inter_500Medium" }]}>Optional</Text>
              </View>
            </View>
            <TextInput
              style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card, fontFamily: "Inter_400Regular" }]}
              value={fuelEff}
              onChangeText={setFuelEff}
              placeholder="Default: 20 km/L"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
            />
            <Text style={[styles.hint, { color: colors.textMuted, fontFamily: "Inter_400Regular" }]}>
              Used to calculate fair fuel-sharing costs for passengers.
            </Text>
          </View>

          {success && (
            <View style={[styles.successBanner, { backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" }]}>
              <Feather name="check-circle" size={16} color="#22c55e" />
              <Text style={[styles.successText, { color: "#22c55e", fontFamily: "Inter_500Medium" }]}>Vehicle saved! Redirecting...</Text>
            </View>
          )}

          {error && (
            <View style={[styles.errorBanner, { backgroundColor: "#fef2f2", borderColor: "#fecaca" }]}>
              <Feather name="alert-circle" size={16} color="#ef4444" />
              <Text style={[styles.errorText, { color: "#ef4444" }]}>{error}</Text>
              <Pressable onPress={handleSave} style={styles.retryBtn}>
                <Text style={[styles.retryText, { color: "#ef4444" }]}>Retry</Text>
              </Pressable>
            </View>
          )}

          <Pressable
            style={[styles.btnPrimary, { backgroundColor: loading ? colors.mutedForeground : success ? colors.success : colors.primary }]}
            onPress={handleSave}
            disabled={loading || success}
          >
            {success ? (
              <Text style={[styles.btnPrimaryText, { fontFamily: "Inter_600SemiBold" }]}>Saved!</Text>
            ) : loading ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={[styles.btnPrimaryText, { fontFamily: "Inter_600SemiBold" }]}>Submitting...</Text>
              </View>
            ) : (
              <Text style={[styles.btnPrimaryText, { fontFamily: "Inter_600SemiBold" }]}>Save vehicle</Text>
            )}
          </Pressable>
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
  container: { paddingHorizontal: 20 },
  back: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 20 },
  backText: { fontSize: 14 },
  title: { fontSize: 26, fontWeight: "700", marginBottom: 6 },
  subtitle: { fontSize: 14, marginBottom: 20 },
  carIllustration: { width: 80, height: 60, borderRadius: 16, alignSelf: "center", alignItems: "center", justifyContent: "center", marginBottom: 24 },
  form: { gap: 16 },
  formGroup: { gap: 6 },
  label: { fontSize: 13, fontWeight: "500" },
  input: { height: 50, borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 14, fontSize: 15 },
  row: { flexDirection: "row", gap: 12 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  seatChip: { width: 40, height: 36, borderRadius: 10, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  chipText: { fontSize: 13 },
  fuelSection: { borderTopWidth: 1, paddingTop: 14, gap: 8 },
  fuelHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  optionalBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  optionalText: { fontSize: 11 },
  hint: { fontSize: 11, lineHeight: 15 },
  btnPrimary: { height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 8 },
  btnPrimaryText: { color: "#fff", fontSize: 16 },
  fieldError: { fontSize: 12, marginTop: 4, fontFamily: "Inter_400Regular" },
  errorBanner: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 10, borderWidth: 1, marginTop: 4 },
  errorText: { fontSize: 13, flex: 1, fontFamily: "Inter_400Regular" },
  retryBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  retryText: { fontSize: 13, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  successBanner: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 10, borderWidth: 1, marginTop: 4 },
  successText: { fontSize: 13, flex: 1 },
});
