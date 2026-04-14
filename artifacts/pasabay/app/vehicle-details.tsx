import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";

const COLORS_LIST = [
  { name: "White", hex: "#fff" },
  { name: "Silver", hex: "#C0C0C0" },
  { name: "Black", hex: "#333" },
  { name: "Red", hex: "#8B0000" },
  { name: "Blue", hex: "#1a3a6b" },
  { name: "Green", hex: "#2d5a2d" },
  { name: "Beige", hex: "#D4A574" },
  { name: "Gold", hex: "#8B6914" },
];

const CAR_MAKES = ["Toyota", "Honda", "Mitsubishi", "Nissan", "Hyundai", "Suzuki", "Ford", "Other"];
const SEAT_OPTIONS = ["2", "3", "4", "5", "6", "7"];

export default function VehicleDetailsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { setDriverVerified } = useApp();

  const [plate, setPlate] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [seats, setSeats] = useState("4");
  const [carColor, setCarColor] = useState("Silver");
  const [fuelEff, setFuelEff] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!plate || !make || !model || !year) {
      Alert.alert("Required Fields", "Please fill in all required vehicle details.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setDriverVerified({
        make,
        model,
        year,
        plate: plate.toUpperCase(),
        color: carColor,
        seats: parseInt(seats),
        fuelEfficiency: parseFloat(fuelEff) || 20,
      });
      router.replace("/(main)/driver-home");
      setLoading(false);
    }, 500);
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

        <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Vehicle details</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>Tell us about your car so passengers can find you</Text>

        <View style={[styles.carIllustration, { backgroundColor: colors.primaryLight }]}>
          <Feather name="truck" size={40} color={colors.primary} />
        </View>

        <View style={styles.form}>
          <FormGroup label="License plate number" colors={colors}>
            <TextInput
              style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card, fontFamily: "Inter_400Regular" }]}
              value={plate}
              onChangeText={t => setPlate(t.toUpperCase())}
              placeholder="e.g. ABC 1234"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="characters"
            />
          </FormGroup>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <FormGroup label="Car make" colors={colors}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 0 }}>
                  <View style={{ flexDirection: "row", gap: 6 }}>
                    {CAR_MAKES.map(m => (
                      <Pressable
                        key={m}
                        onPress={() => setMake(m)}
                        style={[styles.chip, { backgroundColor: make === m ? colors.primary : colors.card, borderColor: make === m ? colors.primary : colors.border }]}
                      >
                        <Text style={[styles.chipText, { color: make === m ? "#fff" : colors.foreground, fontFamily: "Inter_500Medium" }]}>{m}</Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </FormGroup>
            </View>
          </View>

          <FormGroup label="Car model" colors={colors}>
            <TextInput
              style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card, fontFamily: "Inter_400Regular" }]}
              value={model}
              onChangeText={setModel}
              placeholder="e.g. Vios"
              placeholderTextColor={colors.textMuted}
            />
          </FormGroup>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <FormGroup label="Year" colors={colors}>
                <TextInput
                  style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card, fontFamily: "Inter_400Regular" }]}
                  value={year}
                  onChangeText={setYear}
                  placeholder="e.g. 2019"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  maxLength={4}
                />
              </FormGroup>
            </View>
            <View style={{ flex: 1 }}>
              <FormGroup label="Seat capacity" colors={colors}>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                  {SEAT_OPTIONS.map(s => (
                    <Pressable
                      key={s}
                      onPress={() => setSeats(s)}
                      style={[styles.seatChip, { backgroundColor: seats === s ? colors.primary : colors.card, borderColor: seats === s ? colors.primary : colors.border }]}
                    >
                      <Text style={[styles.chipText, { color: seats === s ? "#fff" : colors.foreground, fontFamily: "Inter_500Medium" }]}>{s}</Text>
                    </Pressable>
                  ))}
                </View>
              </FormGroup>
            </View>
          </View>

          <FormGroup label="Car color" colors={colors}>
            <View style={styles.colorGrid}>
              {COLORS_LIST.map(c => (
                <Pressable
                  key={c.name}
                  onPress={() => setCarColor(c.name)}
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: c.hex, borderColor: carColor === c.name ? colors.primary : colors.border, borderWidth: carColor === c.name ? 2.5 : 1.5 },
                    c.hex === "#fff" && { borderColor: colors.border },
                  ]}
                >
                  {carColor === c.name && (
                    <View style={styles.colorCheck}>
                      <Feather name="check" size={10} color={c.hex === "#fff" || c.hex === "#C0C0C0" ? "#333" : "#fff"} />
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
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

          <Pressable
            style={[styles.btnPrimary, { backgroundColor: loading ? colors.mutedForeground : colors.primary }]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={[styles.btnPrimaryText, { fontFamily: "Inter_600SemiBold" }]}>{loading ? "Saving..." : "Save vehicle"}</Text>
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
  colorGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, paddingVertical: 4 },
  colorSwatch: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  colorCheck: { width: 18, height: 18, borderRadius: 9, backgroundColor: "rgba(0,0,0,0.15)", alignItems: "center", justifyContent: "center" },
  fuelSection: { borderTopWidth: 1, paddingTop: 14, gap: 8 },
  fuelHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  optionalBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  optionalText: { fontSize: 11 },
  hint: { fontSize: 11, lineHeight: 15 },
  btnPrimary: { height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 8 },
  btnPrimaryText: { color: "#fff", fontSize: 16 },
});
