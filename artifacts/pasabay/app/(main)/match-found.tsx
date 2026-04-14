import React, { useEffect, useRef } from "react";
import { Animated, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

export default function MatchFoundScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const slideAnim = useRef(new Animated.Value(60)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const badgeScale = useRef(new Animated.Value(0.6)).current;

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(badgeScale, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }),
    ]).start();
  }, [slideAnim, fadeAnim, badgeScale]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 8, paddingBottom: Math.max(insets.bottom + 100, 120) }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Animated.View style={[styles.matchBadge, { backgroundColor: colors.primaryLight, transform: [{ scale: badgeScale }] }]}>
            <Feather name="check" size={14} color={colors.primary} />
            <Text style={[styles.matchBadgeText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>Match found!</Text>
          </Animated.View>

          <View style={styles.driverCard}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={[styles.avatarText, { fontFamily: "Inter_700Bold" }]}>RV</Text>
            </View>
            <Text style={[styles.driverName, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Renz Villanueva</Text>
            <View style={styles.ratingRow}>
              <Feather name="star" size={13} color={colors.primary} />
              <Text style={[styles.ratingText, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>4.9 · 142 rides</Text>
            </View>
          </View>

          <View style={[styles.vehicleCard, { backgroundColor: colors.card }]}>
            <View style={[styles.vehicleIcon, { backgroundColor: colors.primaryLight }]}>
              <Feather name="truck" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.vehicleName, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>Toyota Vios · Silver</Text>
              <Text style={[styles.vehiclePlate, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>ABC 1234 · 2019</Text>
            </View>
            <View style={[styles.seatBadge, { backgroundColor: colors.primaryLight }]}>
              <Feather name="users" size={12} color={colors.primary} />
              <Text style={[styles.seatBadgeText, { color: colors.primary, fontFamily: "Inter_500Medium" }]}>4 seats</Text>
            </View>
          </View>

          <View style={[styles.pickupCard, { borderColor: colors.borderLighter }]}>
            <View style={[styles.pickupIcon, { backgroundColor: colors.primaryLight }]}>
              <Feather name="map-pin" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.pickupLabel, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>Pickup at</Text>
              <Text style={[styles.pickupValue, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>USC Main Gate</Text>
            </View>
            <View style={[styles.walkBadge, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.walkBadgeText, { color: colors.primary, fontFamily: "Inter_500Medium" }]}>Walk ~3 min</Text>
            </View>
          </View>

          <View style={[styles.fareSection, { borderColor: colors.borderLighter }]}>
            <Text style={[styles.fareTitle, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>Your fare</Text>
            <View style={styles.fareAmountRow}>
              <Text style={[styles.fareCurrency, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>₱</Text>
              <Text style={[styles.fareNumber, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>18</Text>
              <View style={styles.feeChip}>
                <Text style={[styles.feeText, { color: colors.textMuted, fontFamily: "Inter_400Regular" }]}>+ ₱7 </Text>
                <Text style={[styles.feeLabel, { color: colors.textMuted, fontFamily: "Inter_400Regular" }]}>service fee</Text>
              </View>
            </View>
            <Text style={[styles.fareNote, { color: colors.textMuted, fontFamily: "Inter_400Regular" }]}>
              Fuel share only — all rides comply with LTFRB cost-sharing guidelines
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      <View style={[styles.actionBar, { backgroundColor: colors.background, borderTopColor: colors.borderLighter, paddingBottom: Math.max(insets.bottom + 8, 24) }]}>
        <Pressable
          style={[styles.btnDecline, { borderColor: `${colors.destructive}40` }]}
          onPress={() => router.replace("/(main)/passenger-home")}
        >
          <Text style={[styles.btnDeclineText, { color: colors.destructive, fontFamily: "Inter_500Medium" }]}>Decline</Text>
        </Pressable>
        <Pressable
          style={[styles.btnAccept, { backgroundColor: colors.primary }]}
          onPress={() => router.replace("/(main)/passenger-home")}
        >
          <Feather name="check" size={18} color="#fff" />
          <Text style={[styles.btnAcceptText, { fontFamily: "Inter_600SemiBold" }]}>Accept ride</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  content: { gap: 14 },
  matchBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, alignSelf: "center" },
  matchBadgeText: { fontSize: 14 },
  driverCard: { alignItems: "center", paddingVertical: 16, gap: 6 },
  avatar: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  avatarText: { fontSize: 24, color: "#fff" },
  driverName: { fontSize: 20 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  ratingText: { fontSize: 14 },
  vehicleCard: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 14, gap: 12 },
  vehicleIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  vehicleName: { fontSize: 14, marginBottom: 2 },
  vehiclePlate: { fontSize: 12 },
  seatBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  seatBadgeText: { fontSize: 12 },
  pickupCard: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 14, borderWidth: 1, gap: 12 },
  pickupIcon: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  pickupLabel: { fontSize: 11, marginBottom: 2 },
  pickupValue: { fontSize: 14 },
  walkBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  walkBadgeText: { fontSize: 12 },
  fareSection: { borderTopWidth: 1, paddingTop: 16, gap: 6 },
  fareTitle: { fontSize: 12 },
  fareAmountRow: { flexDirection: "row", alignItems: "flex-end", gap: 4 },
  fareCurrency: { fontSize: 22, fontWeight: "700", paddingBottom: 4 },
  fareNumber: { fontSize: 44, lineHeight: 50 },
  feeChip: { flexDirection: "row", alignItems: "flex-end", paddingBottom: 6 },
  feeText: { fontSize: 14 },
  feeLabel: { fontSize: 11 },
  fareNote: { fontSize: 11, lineHeight: 15 },
  actionBar: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", gap: 10, paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1 },
  btnDecline: { flex: 1, height: 52, borderRadius: 14, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  btnDeclineText: { fontSize: 15 },
  btnAccept: { flex: 2, height: 52, borderRadius: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  btnAcceptText: { color: "#fff", fontSize: 16 },
});
