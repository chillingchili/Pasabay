import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useRef, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text as RNText, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useTheme, Text, TextInput, Button, Surface } from "react-native-paper";
import { useApp } from "@/context/AppContext";
import { useScale } from "@/hooks/useScale";
import { apiRequest } from "@/lib/api";

const CAR_MAKES = ["Toyota", "Honda", "Mitsubishi", "Nissan", "Hyundai", "Suzuki", "Ford", "Other"];
const SEAT_OPTIONS = ["2", "3", "4", "5", "6", "7"];

export default function VehicleDetailsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
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
      await AsyncStorage.setItem("pasabay_driver_verified", JSON.stringify({
        driverVerified: true,
        driverStatus: response.driverStatus ?? "submitted",
        vehicle: response.vehicle ?? { plate: plate.trim(), make, model: model.trim(), year, color: carColor, seats: parseInt(seats) },
        fuelEfficiencyEstimate: response.fuelEfficiencyEstimate ?? undefined,
      }));
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
      style={{ flex: 1, backgroundColor: colors.surface }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 12, paddingBottom: Math.max(insets.bottom + 24, 40) }]}
        keyboardShouldPersistTaps="handled"
      >
        <Button mode="text" onPress={() => router.back()} style={styles.backBtn} textColor={colors.onSurfaceVariant}>
          Back
        </Button>

        <Text variant="headlineSmall" style={{ marginBottom: 6 }}>Vehicle details</Text>
        <Text variant="bodyLarge" style={{ color: colors.onSurfaceVariant, marginBottom: 20 }}>Tell us about your car so passengers can find you</Text>

        <Surface style={[styles.carIllustration, { backgroundColor: colors.primaryContainer }]}>
          <Feather name="truck" size={40} color={colors.primary} />
        </Surface>

        <View style={styles.form}>
          <TextInput
            label="License plate number"
            mode="outlined"
            value={plate}
            onChangeText={t => { setPlate(t.toUpperCase()); if (fieldErrors.plate) setFieldErrors(prev => { const n = { ...prev }; delete n.plate; return n; }); }}
            placeholder="e.g. ABC 1234"
            autoCapitalize="characters"
            activeOutlineColor={colors.primary}
            error={!!fieldErrors.plate}
          />
          {fieldErrors.plate && <RNText style={[styles.fieldError, { color: colors.error }]}>{fieldErrors.plate}</RNText>}

          <View style={{ gap: 6 }}>
            <Text variant="labelLarge" style={{ color: colors.onSurface }}>Car make</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: "row", gap: 6 }}>
                {CAR_MAKES.map(m => (
                  <Pressable
                    key={m}
                    onPress={() => { setMake(m); if (fieldErrors.make) setFieldErrors(prev => { const n = { ...prev }; delete n.make; return n; }); }}
                    style={[styles.chip, { backgroundColor: make === m ? colors.primary : colors.surfaceVariant, borderColor: fieldErrors.make ? colors.error : make === m ? colors.primary : colors.outline }]}
                  >
                    <Text variant="labelLarge" style={{ color: make === m ? colors.onPrimary : colors.onSurface }}>{m}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
            {fieldErrors.make && <RNText style={[styles.fieldError, { color: colors.error }]}>{fieldErrors.make}</RNText>}
          </View>

          <TextInput
            label="Car model"
            mode="outlined"
            value={model}
            onChangeText={t => { setModel(t); if (fieldErrors.model) setFieldErrors(prev => { const n = { ...prev }; delete n.model; return n; }); }}
            placeholder="e.g. Vios"
            activeOutlineColor={colors.primary}
            error={!!fieldErrors.model}
          />
          {fieldErrors.model && <RNText style={[styles.fieldError, { color: colors.error }]}>{fieldErrors.model}</RNText>}

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <TextInput
                label="Year"
                mode="outlined"
                value={year}
                onChangeText={t => { setYear(t); if (fieldErrors.year) setFieldErrors(prev => { const n = { ...prev }; delete n.year; return n; }); }}
                placeholder="e.g. 2019"
                keyboardType="numeric"
                maxLength={4}
                activeOutlineColor={colors.primary}
                error={!!fieldErrors.year}
              />
              {fieldErrors.year && <RNText style={[styles.fieldError, { color: colors.error }]}>{fieldErrors.year}</RNText>}
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="labelLarge" style={{ color: colors.onSurface, marginBottom: 6 }}>Seat capacity</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {SEAT_OPTIONS.map(s => (
                  <Pressable
                    key={s}
                    onPress={() => { setSeats(s); if (fieldErrors.seats) setFieldErrors(prev => { const n = { ...prev }; delete n.seats; return n; }); }}
                    style={[styles.seatChip, { backgroundColor: seats === s ? colors.primary : colors.surfaceVariant, borderColor: fieldErrors.seats ? colors.error : seats === s ? colors.primary : colors.outline }]}
                  >
                    <Text variant="labelLarge" style={{ color: seats === s ? colors.onPrimary : colors.onSurface }}>{s}</Text>
                  </Pressable>
                ))}
              </View>
              {fieldErrors.seats && <RNText style={[styles.fieldError, { color: colors.error }]}>{fieldErrors.seats}</RNText>}
            </View>
          </View>

          <TextInput
            label="Car color"
            mode="outlined"
            value={carColor}
            onChangeText={t => { setCarColor(t); if (fieldErrors.color) setFieldErrors(prev => { const n = { ...prev }; delete n.color; return n; }); }}
            placeholder="e.g. Silver, White, Black"
            activeOutlineColor={colors.primary}
            error={!!fieldErrors.color}
          />
          {fieldErrors.color && <RNText style={[styles.fieldError, { color: colors.error }]}>{fieldErrors.color}</RNText>}

          <View style={[styles.fuelSection, { borderTopColor: colors.outlineVariant }]}>
            <View style={styles.fuelHeader}>
              <Text variant="labelLarge" style={{ color: colors.onSurface }}>Fuel efficiency (km/L)</Text>
              <View style={[styles.optionalBadge, { backgroundColor: colors.primaryContainer }]}>
                <Text variant="labelLarge" style={{ color: colors.primary, fontSize: 11 }}>Optional</Text>
              </View>
            </View>
            <TextInput
              mode="outlined"
              value={fuelEff}
              onChangeText={setFuelEff}
              placeholder="Default: 20 km/L"
              keyboardType="decimal-pad"
              activeOutlineColor={colors.primary}
            />
            <Text variant="bodyLarge" style={{ fontSize: 11, color: colors.onSurfaceDisabled }}>
              Used to calculate fair fuel-sharing costs for passengers.
            </Text>
          </View>

          {success && (
            <View style={[styles.successBanner, { backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" }]}>
              <Feather name="check-circle" size={16} color="#22c55e" />
              <RNText style={[styles.successText, { color: "#22c55e" }]}>Vehicle saved! Redirecting...</RNText>
            </View>
          )}

          {error && (
            <View style={[styles.errorBanner, { backgroundColor: colors.errorContainer, borderColor: colors.error }]}>
              <Feather name="alert-circle" size={16} color={colors.error} />
              <RNText style={[styles.errorText, { color: colors.error }]}>{error}</RNText>
              <Pressable onPress={handleSave} style={styles.retryBtn}>
                <RNText style={[styles.retryText, { color: colors.error }]}>Retry</RNText>
              </Pressable>
            </View>
          )}

          <Button
            mode="contained"
            onPress={handleSave}
            disabled={loading || success}
            loading={loading}
            buttonColor={success ? colors.primary : colors.primary}
            style={styles.btn}
          >
            {success ? "Saved!" : loading ? "Submitting..." : "Save vehicle"}
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20 },
  backBtn: { alignSelf: "flex-start", marginBottom: 8 },
  carIllustration: { width: 80, height: 60, borderRadius: 16, alignSelf: "center", alignItems: "center", justifyContent: "center", marginBottom: 24, elevation: 2 },
  form: { gap: 16 },
  row: { flexDirection: "row", gap: 12 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  seatChip: { width: 40, height: 36, borderRadius: 10, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  fuelSection: { borderTopWidth: 1, paddingTop: 14, gap: 8 },
  fuelHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  optionalBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  btn: { height: 52, borderRadius: 14, justifyContent: "center", marginTop: 8 },
  fieldError: { fontSize: 12, marginTop: 4, fontFamily: "Inter_400Regular" },
  errorBanner: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 10, borderWidth: 1, marginTop: 4 },
  errorText: { fontSize: 13, flex: 1, fontFamily: "Inter_400Regular" },
  retryBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  retryText: { fontSize: 13, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  successBanner: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 10, borderWidth: 1, marginTop: 4 },
  successText: { fontSize: 13, flex: 1, fontFamily: "Inter_500Medium" },
});
