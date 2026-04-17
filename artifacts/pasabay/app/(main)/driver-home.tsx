import React, { useEffect, useRef, useState } from "react";
import { Alert, Animated, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { MapBackground } from "@/components/MapBackground";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import {
  emitDriverOnline, emitDriverOffline, emitMatchAccept, emitMatchDecline,
  emitRideComplete, onDriverRouteSet, onDriverError,
} from "@/lib/socket";
import type { MatchRequestPayload } from "@/lib/socket";

const USC_ORIGIN = { lat: 10.2969, lng: 123.9008, name: "USC Main Gate" };
const SM_DEST = { lat: 10.3278, lng: 123.9028, name: "SM City Cebu" };

export default function DriverHomeScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { user, pendingMatchRequest, clearPendingMatch } = useApp();

  const [isOnline, setIsOnline] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{ distanceKm: number; durationMin: number } | null>(null);
  const [accepted, setAccepted] = useState<MatchRequestPayload | null>(null);
  const [timer, setTimer] = useState(60);

  const slideAnim = useRef(new Animated.Value(-160)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  useEffect(() => {
    Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 10, useNativeDriver: true }).start();
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.8, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [slideAnim, pulseAnim]);

  useEffect(() => {
    if (!accepted) return;
    const interval = setInterval(() => {
      setTimer(t => {
        if (t <= 1) { clearInterval(interval); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [accepted]);

  useEffect(() => {
    const offRouteSet = onDriverRouteSet((data) => {
      setRouteInfo({ distanceKm: data.distanceKm, durationMin: data.durationMin });
      setIsOnline(true);
    });
    const offError = onDriverError((data) => {
      Alert.alert("Driver Error", data.message);
      setIsOnline(false);
    });
    return () => {
      offRouteSet();
      offError();
    };
  }, []);

  const handleGoOnline = () => {
    emitDriverOnline({
      originName: USC_ORIGIN.name,
      originLat: USC_ORIGIN.lat,
      originLng: USC_ORIGIN.lng,
      destName: SM_DEST.name,
      destLat: SM_DEST.lat,
      destLng: SM_DEST.lng,
    });
  };

  const handleGoOffline = () => {
    emitDriverOffline();
    setIsOnline(false);
    setRouteInfo(null);
    setAccepted(null);
  };

  const handleAccept = (req: MatchRequestPayload) => {
    emitMatchAccept({
      routeId: req.routeId,
      passengerId: req.passengerId,
      pickupLat: req.pickup.lat,
      pickupLng: req.pickup.lng,
      dropoffLat: req.dropoff.lat,
      dropoffLng: req.dropoff.lng,
      pickupName: req.pickup.name,
      dropoffName: req.dropoff.name,
      fare: req.fare,
      matchingFee: req.matchingFee,
      distanceKm: req.distanceKm,
    });
    setAccepted(req);
    setTimer(60);
    clearPendingMatch();
  };

  const handleDecline = (req: MatchRequestPayload) => {
    emitMatchDecline(req.passengerId);
    clearPendingMatch();
  };

  const handleCompleteRide = () => {
    if (accepted) {
      emitRideComplete(accepted.routeId);
      setAccepted(null);
      setTimer(60);
    }
  };

  const destLabel = SM_DEST.name;
  const etaMin = routeInfo?.durationMin ?? 18;

  return (
    <View style={styles.container}>
      <MapBackground showRoute={true} driverRoute={true} />

      <View style={[styles.topBar, { paddingTop: topPad + 8, paddingHorizontal: 16 }]}>
        <View style={[styles.destBar, { backgroundColor: "rgba(255,255,255,0.97)" }]}>
          <View style={[styles.destDot, { backgroundColor: isOnline ? colors.primary : colors.textMuted }]} />
          <Text style={[styles.destText, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{destLabel}</Text>
          <Pressable
            style={[styles.statusTag, { backgroundColor: isOnline ? colors.primaryLight : colors.card }]}
            onPress={isOnline ? handleGoOffline : handleGoOnline}
          >
            <Text style={[styles.statusTagText, { color: isOnline ? colors.primary : colors.textSecondary, fontFamily: "Inter_500Medium" }]}>
              {isOnline ? "Online" : "Go Online"}
            </Text>
          </Pressable>
        </View>
      </View>

      {pendingMatchRequest && !accepted && (
        <Animated.View
          style={[
            styles.requestPopup,
            { backgroundColor: "rgba(255,255,255,0.97)", top: topPad + 76 },
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.requestHeader}>
            <Feather name="star" size={12} color={colors.primary} />
            <Text style={[styles.requestHeaderText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>Pasabay request</Text>
          </View>
          <View style={styles.requestBody}>
            <View style={[styles.passengerAvatar, { backgroundColor: "#e0885a" }]}>
              <Text style={[styles.passengerAvatarText, { fontFamily: "Inter_700Bold" }]}>
                {pendingMatchRequest.passengerName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.passengerName, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                {pendingMatchRequest.passengerName} · ★{pendingMatchRequest.passengerRating.toFixed(1)}
              </Text>
              <Text style={[styles.passengerRoute, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
                {pendingMatchRequest.pickup.name} → {pendingMatchRequest.dropoff.name}
              </Text>
            </View>
            <View style={[styles.fareAdd, { backgroundColor: colors.accentBg }]}>
              <Text style={[styles.fareAddText, { color: colors.accentDark, fontFamily: "Inter_700Bold" }]}>
                + ₱{pendingMatchRequest.total.toFixed(0)}
              </Text>
            </View>
          </View>
          <View style={styles.requestActions}>
            <Pressable
              style={[styles.declineBtn, { borderColor: colors.border }]}
              onPress={() => handleDecline(pendingMatchRequest)}
            >
              <Text style={[styles.declineBtnText, { color: colors.textSecondary, fontFamily: "Inter_500Medium" }]}>Decline</Text>
            </Pressable>
            <Pressable
              style={[styles.acceptBtn, { backgroundColor: colors.primary }]}
              onPress={() => handleAccept(pendingMatchRequest)}
            >
              <Text style={[styles.acceptBtnText, { fontFamily: "Inter_600SemiBold" }]}>Accept</Text>
            </Pressable>
          </View>
        </Animated.View>
      )}

      {accepted && (
        <View style={[styles.acceptedInfo, { backgroundColor: "rgba(255,255,255,0.97)", top: topPad + 76 }]}>
          <View style={styles.acceptedHeader}>
            <View style={[styles.acceptedIcon, { backgroundColor: colors.primaryLight }]}>
              <Feather name="user" size={16} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.acceptedTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>Heading to pickup</Text>
              <Text style={[styles.acceptedSubtitle, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
                {accepted.pickup.name} · {accepted.passengerName}
              </Text>
            </View>
            {timer > 0 ? (
              <View style={[styles.timerBadge, { backgroundColor: timer < 20 ? colors.destructiveLight : colors.primaryLight }]}>
                <Text style={[styles.timerText, { color: timer < 20 ? colors.destructive : colors.primary, fontFamily: "Inter_700Bold" }]}>{timer}s</Text>
              </View>
            ) : (
              <Pressable style={[styles.noShowBtn, { backgroundColor: colors.destructiveLight }]} onPress={handleCompleteRide}>
                <Text style={[styles.noShowText, { color: colors.destructive, fontFamily: "Inter_500Medium" }]}>Complete</Text>
              </Pressable>
            )}
          </View>
        </View>
      )}

      <View style={styles.userPin}>
        <Animated.View style={[styles.pulse, { transform: [{ scale: pulseAnim }], backgroundColor: `${colors.primary}30` }]} />
        <View style={[styles.pin, { backgroundColor: colors.primary, borderColor: "#fff" }]} />
      </View>

      <View style={[styles.infoBar, { backgroundColor: "rgba(255,255,255,0.97)", paddingBottom: Math.max(insets.bottom + 80, 100) }]}>
        <View style={styles.infoBlock}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>To destination</Text>
          <Text style={[styles.infoValue, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{destLabel}</Text>
        </View>
        <View style={styles.infoBlock}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>ETA</Text>
          <Text style={[styles.infoValue, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
            {etaMin} <Text style={[styles.infoUnit, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>min</Text>
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 10 },
  destBar: { flexDirection: "row", alignItems: "center", borderRadius: 14, padding: 12, paddingLeft: 14, gap: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 },
  destDot: { width: 8, height: 8, borderRadius: 4 },
  destText: { flex: 1, fontSize: 14 },
  statusTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusTagText: { fontSize: 12 },
  requestPopup: { position: "absolute", left: 16, right: 16, borderRadius: 16, padding: 14, gap: 10, zIndex: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 20, elevation: 8 },
  requestHeader: { flexDirection: "row", alignItems: "center", gap: 5 },
  requestHeaderText: { fontSize: 13 },
  requestBody: { flexDirection: "row", alignItems: "center", gap: 10 },
  passengerAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  passengerAvatarText: { color: "#fff", fontSize: 14 },
  passengerName: { fontSize: 14, marginBottom: 2 },
  passengerRoute: { fontSize: 12 },
  fareAdd: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  fareAddText: { fontSize: 13 },
  requestActions: { flexDirection: "row", gap: 8 },
  declineBtn: { flex: 1, height: 44, borderRadius: 12, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  declineBtnText: { fontSize: 14 },
  acceptBtn: { flex: 2, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  acceptBtnText: { color: "#fff", fontSize: 14 },
  acceptedInfo: { position: "absolute", left: 16, right: 16, borderRadius: 16, padding: 14, zIndex: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 5 },
  acceptedHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  acceptedIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  acceptedTitle: { fontSize: 14 },
  acceptedSubtitle: { fontSize: 12, marginTop: 2 },
  timerBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  timerText: { fontSize: 16 },
  noShowBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  noShowText: { fontSize: 12 },
  userPin: { position: "absolute", left: "50%", top: "73%", transform: [{ translateX: -12 }, { translateY: -12 }], alignItems: "center", justifyContent: "center", zIndex: 5 },
  pulse: { position: "absolute", width: 40, height: 40, borderRadius: 20 },
  pin: { width: 16, height: 16, borderRadius: 8, borderWidth: 3 },
  infoBar: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 24, paddingTop: 16 },
  infoBlock: { gap: 3 },
  infoLabel: { fontSize: 11 },
  infoValue: { fontSize: 18 },
  infoUnit: { fontSize: 14 },
});
