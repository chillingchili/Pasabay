import React, { useEffect, useRef } from "react";
import { Animated, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

interface PreMatchModalProps {
  visible: boolean;
  destination: string;
  fareEstimate: number;
  distanceKm: number;
  etaMin: number;
  walkingInfo?: { toPickupM: number; fromDropoffM: number };
  onConfirm: () => void;
  onCancel: () => void;
}

export function PreMatchModal({
  visible,
  destination,
  fareEstimate,
  distanceKm,
  etaMin,
  walkingInfo,
  onConfirm,
  onCancel,
}: PreMatchModalProps) {
  const colors = useColors();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(300)).current;
  const bottomSafe = Platform.OS === "web" ? 60 : insets.bottom;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 10,
        useNativeDriver: true,
      }).start();
    } else {
      slideAnim.setValue(300);
    }
  }, [visible, slideAnim]);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onCancel} />
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: "rgba(255,255,255,0.97)",
              maxHeight: height * 0.85,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
              Before you ride
            </Text>
            <Pressable onPress={onCancel} style={styles.closeBtn}>
              <Feather name="x" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Scrollable Content */}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Route Summary Card */}
            <View style={[styles.routeCard, { backgroundColor: colors.card }]}>
              <View style={styles.routeRow}>
                <View style={[styles.routeDot, { backgroundColor: colors.primary }]} />
                <View style={styles.routeText}>
                  <Text style={[styles.routeLabel, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
                    Destination
                  </Text>
                  <Text style={[styles.routeValue, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                    {destination}
                  </Text>
                </View>
              </View>

              <View style={styles.summaryRow}>
                <SummaryItem label="Fare" value={`₱${fareEstimate.toFixed(0)}`} colors={colors} />
                <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
                <SummaryItem label="Distance" value={`${distanceKm.toFixed(1)} km`} colors={colors} />
                <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
                <SummaryItem label="ETA" value={`~${etaMin} min`} colors={colors} />
              </View>
            </View>

            {/* Walking Info */}
            {walkingInfo && (
              <View style={[styles.walkCard, { backgroundColor: colors.accentBg }]}>
                <Feather name="navigation" size={16} color={colors.accentDark} />
                <Text style={[styles.walkText, { color: colors.accentDark, fontFamily: "Inter_500Medium" }]}>
                  {walkingInfo.toPickupM}m walk to pickup · {walkingInfo.fromDropoffM}m walk from dropoff
                </Text>
              </View>
            )}

            {/* Terms & Conditions */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                Terms & Conditions
              </Text>
              <BulletPoint text="This is a cost-sharing rideshare, not a commercial service" colors={colors} />
              <BulletPoint text="Fares comply with LTFRB guidelines" colors={colors} />
              <BulletPoint text="Both parties agree to respectful conduct" colors={colors} />
            </View>

            {/* Expected Behavior */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                Expected behavior
              </Text>
              <BulletPoint text="Be at pickup point on time" colors={colors} />
              <BulletPoint text="Respect the driver's vehicle" colors={colors} />
              <BulletPoint text="Share fuel costs fairly" colors={colors} />
            </View>
          </ScrollView>

          {/* Sticky Action Buttons */}
          <View style={styles.actions}>
            <Pressable
              style={[styles.cancelActionBtn, { borderColor: colors.border }]}
              onPress={onCancel}
            >
              <Text style={[styles.cancelActionText, { color: colors.textSecondary, fontFamily: "Inter_500Medium" }]}>
                Cancel
              </Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.confirmBtn,
                { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={onConfirm}
            >
              <Feather name="check-circle" size={18} color="#fff" />
              <Text style={[styles.confirmText, { fontFamily: "Inter_600SemiBold" }]}>
                Confirm & Find Ride
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

function SummaryItem({ label, value, colors }: { label: string; value: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={styles.summaryItem}>
      <Text style={[styles.summaryLabel, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
        {label}
      </Text>
      <Text style={[styles.summaryValue, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
        {value}
      </Text>
    </View>
  );
}

function BulletPoint({ text, colors }: { text: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={styles.bulletRow}>
      <View style={[styles.bulletDot, { backgroundColor: colors.primary }]} />
      <Text style={[styles.bulletText, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    display: "flex",
    flexDirection: "column",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 8,
  },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 16, marginTop: 12 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, marginBottom: 12 },
  headerTitle: { fontSize: 18 },
  closeBtn: { padding: 4 },
  routeCard: { borderRadius: 14, padding: 14, marginBottom: 12 },
  routeRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  routeDot: { width: 10, height: 10, borderRadius: 5 },
  routeText: { flex: 1 },
  routeLabel: { fontSize: 11, marginBottom: 2 },
  routeValue: { fontSize: 14 },
  summaryRow: { flexDirection: "row", alignItems: "center" },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryLabel: { fontSize: 10, marginBottom: 3 },
  summaryValue: { fontSize: 14 },
  summaryDivider: { width: 1, height: 24 },
  walkCard: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, padding: 10, marginBottom: 16 },
  walkText: { fontSize: 12, flex: 1 },
  section: { marginBottom: 14 },
  sectionTitle: { fontSize: 13, marginBottom: 8 },
  bulletRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 6 },
  bulletDot: { width: 5, height: 5, borderRadius: 2.5, marginTop: 5, flexShrink: 0 },
  bulletText: { fontSize: 12, flex: 1, lineHeight: 18 },
  actions: { flexDirection: "row", gap: 10, paddingHorizontal: 20, paddingTop: 12, paddingBottom: Platform.OS === "web" ? 68 : 8 },
  cancelActionBtn: { flex: 1, height: 48, borderRadius: 14, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  cancelActionText: { fontSize: 14 },
  confirmBtn: { flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center", height: 48, borderRadius: 14, gap: 8 },
  confirmText: { color: "#fff", fontSize: 15 },
});
