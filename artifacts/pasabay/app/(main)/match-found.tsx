import React, { useEffect, useRef } from "react";
import { Alert, Animated, Platform, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "react-native-paper";
import { Card, Button, Text, Surface, Chip } from "react-native-paper";
import { useApp } from "@/context/AppContext";
import { useScale } from "@/hooks/useScale";
import { emitRideCancel, onRideCanceled } from "@/lib/socket";

function _calcEtaMin(
  driverLoc: { lat: number; lng: number },
  pickup: { lat: number; lng: number },
): number {
  const dlat = (driverLoc.lat - pickup.lat) * 111;
  const dlng = (driverLoc.lng - pickup.lng) * 111 * Math.cos((pickup.lat * Math.PI) / 180);
  const distKm = Math.sqrt(dlat * dlat + dlng * dlng);
  return (distKm / 30) * 60; // assume 30 km/h
}

export default function MatchFoundScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { fs, isSmall } = useScale();
  const dimensions = useWindowDimensions();
  const { matchConfirmed, clearMatchConfirmed, completedRide, clearCompletedRide, addRideHistory, activeRide, driverLocation, clearActiveRide, networkStatus } = useApp();
  const slideAnim = useRef(new Animated.Value(60)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const badgeScale = useRef(new Animated.Value(0.6)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const topPad = Platform.OS === "web" ? Math.min(dimensions.width * 0.17, 67) : insets.top;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(badgeScale, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }),
    ]).start();
  }, [slideAnim, fadeAnim, badgeScale]);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.4, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  useEffect(() => {
    if (completedRide) {
      addRideHistory({
        id: completedRide.rideId,
        route: `${matchConfirmed?.pickup.name ?? "–"} → ${matchConfirmed?.dropoff.name ?? "–"}`,
        from: matchConfirmed?.pickup.name ?? "–",
        to: matchConfirmed?.dropoff.name ?? "–",
        date: `Today, ${new Date().toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" })}`,
        fare: completedRide.total,
        status: "completed",
        withName: matchConfirmed?.driver.name,
      });
      clearCompletedRide();
      clearMatchConfirmed();
      router.replace("/(main)/passenger-home");
    }
  }, [completedRide]);

  // Detect ride cancellation via socket event (not state mismatch)
  const didCancelRef = useRef(false);
  useEffect(() => {
    const off = onRideCanceled((data) => {
      if (didCancelRef.current) return;
      didCancelRef.current = true;
      Alert.alert("Ride Canceled", data.reason ?? "The driver canceled this ride. Please request a new ride.");
      clearMatchConfirmed();
      clearActiveRide();
      router.replace("/(main)/passenger-home");
    });
    return off;
  }, []);

  const handleDecline = () => {
    if (matchConfirmed?.rideId) {
      emitRideCancel(matchConfirmed.rideId, "Passenger declined after match");
    }
    clearMatchConfirmed();
    router.replace("/(main)/passenger-home");
  };

  const handleAccept = () => {
    router.replace("/(main)/passenger-home");
  };

  const driver = matchConfirmed?.driver;
  const vehicle = driver?.vehicle;
  const pickup = matchConfirmed?.pickup;
  const fare = matchConfirmed?.fare ?? 0;
  const matchingFee = matchConfirmed?.matchingFee ?? 0;
  const driverInitials = driver?.name
    ? driver.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "DR";

  return (
    <Surface style={[styles.container, { backgroundColor: colors.surface }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingHorizontal: isSmall ? 16 : 20, paddingTop: topPad + 8, paddingBottom: Math.max(insets.bottom + 120, 140) }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Animated.View style={[styles.matchBadge, { backgroundColor: colors.primaryContainer, transform: [{ scale: badgeScale }] }]}>
            <Feather name="check" size={14} color={colors.primary} />
            <Text variant="labelLarge" style={[styles.matchBadgeText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>Match found!</Text>
          </Animated.View>

          <View style={styles.driverCard}>
            <View style={styles.avatarContainer}>
              <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                <Text variant="displaySmall" style={[styles.avatarText, { fontFamily: "Sora_800ExtraBold" }]}>{driverInitials}</Text>
              </View>
              <View style={[styles.onlineIndicator, { backgroundColor: networkStatus === "online" ? colors.primary : colors.onSurfaceDisabled, borderColor: colors.surface }]} />
            </View>
            <Text variant="headlineSmall" style={[styles.driverName, { color: colors.onSurface }]}>
              {driver?.name ?? "Your Driver"}
            </Text>
            {vehicle && (
              <Chip mode="flat" style={{ backgroundColor: colors.primary }} textStyle={{ color: colors.onPrimary, fontFamily: "Inter_400Regular", fontSize: 12 }}>
                Verified
              </Chip>
            )}
            <View style={styles.ratingRow}>
              <Feather name="star" size={13} color={colors.primary} />
              <Text variant="labelLarge" style={[styles.ratingText, { color: colors.onSurfaceVariant }]}>
                {driver?.rating?.toFixed(1) ?? "5.0"}
                {driver?.rideCount != null && ` · ${driver.rideCount} rides`}
              </Text>
            </View>
          </View>

          {vehicle && (
            <Card mode="outlined" style={{ backgroundColor: colors.surfaceVariant, borderRadius: 14 }}>
              <Card.Content style={styles.cardContentRow}>
                <View style={[styles.vehicleIcon, { backgroundColor: colors.primaryContainer }]}>
                  <Feather name="truck" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="labelLarge" style={[styles.vehicleName, { color: colors.onSurface, fontFamily: "Inter_600SemiBold" }]}>
                    {vehicle.make} {vehicle.model} · {vehicle.color}
                  </Text>
                  <Text variant="labelLarge" style={[styles.vehiclePlate, { color: colors.onSurfaceVariant, fontSize: 12 }]}>
                    {vehicle.plate}
                  </Text>
                </View>
                <View style={[styles.seatBadge, { backgroundColor: colors.primaryContainer }]}>
                  <Feather name="users" size={12} color={colors.primary} />
                  <Text variant="labelLarge" style={[styles.seatBadgeText, { color: colors.primary, fontFamily: "Inter_500Medium" }]}>
                    {vehicle.seats} seats
                  </Text>
                </View>
              </Card.Content>
            </Card>
          )}

          <Card mode="outlined" style={{ backgroundColor: colors.surfaceVariant, borderRadius: 14 }}>
            <Card.Content style={styles.cardContentRow}>
              <View style={[styles.pickupIcon, { backgroundColor: colors.primaryContainer }]}>
                <Feather name="map-pin" size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="labelLarge" style={[styles.pickupLabel, { color: colors.onSurfaceVariant, fontSize: 11 }]}>Pickup at</Text>
                <Text variant="bodyLarge" style={[styles.pickupValue, { color: colors.onSurface, fontFamily: "Inter_600SemiBold" }]}>
                  {pickup?.name ?? "Your pickup point"}
                </Text>
              </View>
            </Card.Content>
          </Card>

          {/* Ride status indicator */}
          <View style={[styles.rideStatusCard, { backgroundColor: colors.surfaceVariant }]}>
            <Animated.View style={[styles.statusDot, { backgroundColor: colors.primary, transform: [{ scale: pulseAnim }] }]} />
            <Text variant="labelLarge" style={[styles.rideStatusText, { color: colors.onSurfaceVariant, fontFamily: "Inter_500Medium" }]}>
              {driverLocation ? "Driver is nearby" : "Driver is heading to pickup"}
            </Text>
          </View>

          {/* Driver location card — only shown when driverLocation is available */}
          {driverLocation && pickup && (
            <View style={[styles.driverLocationCard, { backgroundColor: colors.surfaceVariant }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                <Feather name="navigation" size={14} color={colors.primary} />
                <Text variant="labelLarge" style={[styles.driverLocationText, { color: colors.onSurfaceVariant, fontSize: 13 }]}>
                  Driver location: {driverLocation.lat.toFixed(4)}, {driverLocation.lng.toFixed(4)}
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <View style={[styles.liveDot, { backgroundColor: networkStatus === "online" ? colors.primary : colors.error }]} />
                <Text variant="labelLarge" style={[styles.liveText, { color: networkStatus === "online" ? colors.primary : colors.error, fontFamily: "Inter_600SemiBold", fontSize: 12 }]}>
                  {networkStatus === "online" ? "Live" : "Offline"}
                </Text>
              </View>
              <Text variant="labelLarge" style={[styles.etaText, { color: colors.primary, fontFamily: "Inter_500Medium", fontSize: 13 }]}>
                ~{Math.max(1, Math.round(_calcEtaMin(driverLocation, pickup)))} min away
              </Text>
            </View>
          )}

          <Surface style={{ backgroundColor: colors.primary, borderRadius: 14, padding: 16, marginTop: 14 }}>
            <View style={styles.fareStripRow}>
              <Text variant="displaySmall" style={[styles.fareStripAmount, { fontFamily: "Sora_800ExtraBold", color: colors.onPrimary }]}>
                ₱{fare.toFixed(0)}
              </Text>
              {matchingFee > 0 && (
                <Text variant="labelLarge" style={[styles.fareStripFee, { fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.8)" }]}>
                  + ₱{matchingFee.toFixed(0)} service fee
                </Text>
              )}
            </View>
            <Text variant="labelLarge" style={[styles.fareStripNote, { fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.7)", fontSize: 12 }]}>
              Fuel share only — all rides comply with LTFRB cost-sharing guidelines
            </Text>
          </Surface>
        </Animated.View>
      </ScrollView>

      <View style={[styles.actionBar, { backgroundColor: colors.surface, borderTopColor: colors.outlineVariant, paddingBottom: Math.max(insets.bottom + 24, 40) }]}>
        <Button
          mode="outlined"
          textColor={colors.error}
          onPress={handleDecline}
          style={[styles.btnDecline, { borderColor: `${colors.error}40` }]}
          contentStyle={{ height: 52 }}
          labelStyle={{ fontFamily: "Inter_500Medium", fontSize: 15 }}
        >
          Decline
        </Button>
        <Button
          mode="contained"
          buttonColor={colors.primary}
          textColor={colors.onPrimary}
          onPress={handleAccept}
          style={styles.btnAccept}
          contentStyle={{ height: 52 }}
          labelStyle={{ fontFamily: "Inter_600SemiBold", fontSize: 16 }}
          icon={() => <Feather name="check" size={18} color={colors.onPrimary} />}
        >
          Accept ride
        </Button>
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  content: { gap: 14 },
  matchBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, alignSelf: "center" },
  matchBadgeText: { fontSize: 14 },
  driverCard: { alignItems: "center", paddingVertical: 16, gap: 6 },
  avatarContainer: { position: "relative", marginBottom: 4 },
  avatar: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 24, color: "#fff" },
  onlineIndicator: { position: "absolute", bottom: 2, right: 2, width: 14, height: 14, borderRadius: 7, borderWidth: 2 },
  driverName: { fontSize: 20 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  ratingText: { fontSize: 14 },
  cardContentRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  vehicleIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  vehicleName: { fontSize: 14, marginBottom: 2 },
  vehiclePlate: { fontSize: 12 },
  seatBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  seatBadgeText: { fontSize: 12 },
  pickupIcon: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  pickupLabel: { fontSize: 11, marginBottom: 2 },
  pickupValue: { fontSize: 14 },
  rideStatusCard: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 12, gap: 10 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  rideStatusText: { fontSize: 14 },
  driverLocationCard: { padding: 14, borderRadius: 14, gap: 8 },
  driverLocationText: { fontSize: 13 },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  liveText: { fontSize: 12 },
  etaText: { fontSize: 13, marginTop: 2 },
  fareStripRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  fareStripAmount: { fontSize: 28 },
  fareStripFee: { fontSize: 14 },
  fareStripNote: { fontSize: 12, lineHeight: 16 },
  actionBar: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", gap: 10, paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1 },
  btnDecline: { flex: 1, borderRadius: 14 },
  btnAccept: { flex: 2, borderRadius: 14 },
});
