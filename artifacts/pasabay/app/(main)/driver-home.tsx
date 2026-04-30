import React, { useEffect, useRef, useState } from "react";
import { Alert, Animated, Platform, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { RealMap } from "@/components/RealMap";
import LoadingOverlay from "@/components/LoadingOverlay";
import { useColors } from "@/hooks/useColors";
import { useLocation } from "@/hooks/useLocation";
import { useApp } from "@/context/AppContext";
import { useScale } from "@/hooks/useScale";
import { emitDriverOnline, emitDriverOffline, emitMatchAccept, emitMatchDecline,
  emitRideComplete, emitRideCancel, onDriverRouteSet, onDriverError,
  onMatchAccepted, emitDriverLocation,
} from "@/lib/socket";
import { ChatSheet } from "@/components/ChatSheet";
import type { MatchRequestPayload } from "@/lib/socket";
import { getRoute } from "@/lib/osrm";

export default function DriverHomeScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { fs, isSmall } = useScale();
  const dimensions = useWindowDimensions();
  const { user, pendingMatchRequest, clearPendingMatch, activeRide, clearActiveRide, setActiveRide, switchRole } = useApp();
  const { location: userLoc } = useLocation();

  const [isOnline, setIsOnline] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{ distanceKm: number; durationMin: number } | null>(null);
  const [accepted, setAccepted] = useState<MatchRequestPayload | null>(null);
  const [rideId, setRideId] = useState<string | null>(null);
  const [timer, setTimer] = useState(60);
  const [destQuery, setDestQuery] = useState("");
  const [showDestSuggestions, setShowDestSuggestions] = useState(false);
  const [selectedDest, setSelectedDest] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [routePolyline, setRoutePolyline] = useState<{ lat: number; lng: number }[] | null>(null);
  const [isDriverView, setIsDriverView] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [recenterKey, setRecenterKey] = useState(0);
  const [fitRouteKey, setFitRouteKey] = useState(0);
  const [showRecenter, setShowRecenter] = useState(false);
  const [infoBarHeight, setInfoBarHeight] = useState(0);
  const [driverError, setDriverError] = useState<string | null>(null);
  const [showRouteInfo, setShowRouteInfo] = useState(false);

  const slideAnim = useRef(new Animated.Value(-160)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const topPad = Platform.OS === "web" ? Math.min(dimensions.width * 0.17, 67) : insets.top;

  const DEST_OPTIONS = [
    { name: "IT Park, Lahug", lat: 10.3308, lng: 123.9068 },
    { name: "SM City Cebu", lat: 10.3112, lng: 123.9172 },
    { name: "Ayala Center", lat: 10.3173, lng: 123.9046 },
    { name: "JY Square", lat: 10.3307, lng: 123.8965 },
    { name: "Mango Square", lat: 10.3111, lng: 123.8961 },
  ];

  const filteredDests = destQuery
    ? DEST_OPTIONS.filter(d => d.name.toLowerCase().includes(destQuery.toLowerCase()))
    : DEST_OPTIONS;

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
    if (!accepted || !userLoc) return;
    const interval = setInterval(() => {
      console.log("[MATCH-STAGE-6] Emitting driver location:", { lat: userLoc.lat, lng: userLoc.lng });
      emitDriverLocation(userLoc.lat, userLoc.lng);
    }, 10000);
    return () => clearInterval(interval);
  }, [accepted, userLoc]);

  useEffect(() => {
    const off = onMatchAccepted((data) => {
      setRideId(data.rideId);
    });
    return off;
  }, []);

  useEffect(() => {
    const offRouteSet = onDriverRouteSet((data) => {
      setRouteInfo({ distanceKm: data.distanceKm, durationMin: data.durationMin });
      setIsOnline(true);
    });
    const offError = onDriverError((data) => {
      setDriverError(data.message);
      setIsOnline(false);
    });
    return () => {
      offRouteSet();
      offError();
    };
  }, []);

  // Fit the map to show the full route ONCE when destination changes
  // (NOT when user location changes, which happens on every GPS update)
  useEffect(() => {
    if (!selectedDest) return;
    setFitRouteKey((k) => k + 1);
  }, [selectedDest]);

  useEffect(() => {
    if (!userLoc || !selectedDest) return;
    let cancelled = false;
    const fetch = async () => {
      const route = await getRoute(userLoc, selectedDest);
      if (cancelled) return;
      if (route) {
        setRoutePolyline(route.polyline);
        setRouteInfo({ distanceKm: route.distanceKm, durationMin: Math.round(route.durationSec / 60) });
      }
    };
    fetch();
    return () => { cancelled = true; };
  }, [selectedDest, userLoc]);

  const handleSelectDest = (d: { name: string; lat: number; lng: number }) => {
    setSelectedDest(d);
    setDestQuery(d.name);
    setShowDestSuggestions(false);
  };

  const handleGoOnline = () => {
    if (!selectedDest) {
      setDriverError("Please select your destination before going online.");
      return;
    }
    if (!userLoc) {
      setDriverError("Please enable location services to go online.");
      return;
    }
    setIsLoading(true);
    emitDriverOnline({
      originName: "Current Location",
      originLat: userLoc.lat,
      originLng: userLoc.lng,
      destName: selectedDest.name,
      destLat: selectedDest.lat,
      destLng: selectedDest.lng,
    });
    setTimeout(() => setIsLoading(false), 500);
  };

  const handleAccept = (req: MatchRequestPayload) => {
    console.log("[MATCH-STAGE-4a] Driver accepting match:", { routeId: req.routeId, passengerId: req.passengerId });
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
    setActiveRide({
      rideId: rideId ?? req.routeId,
      driver: user ? {
        id: user.id,
        name: user.name,
        rating: user.rating,
        avatar: user.avatar,
        vehicle: user.vehicle
          ? { make: user.vehicle.make, model: user.vehicle.model, color: user.vehicle.color, plate: user.vehicle.plate, fuelEfficiency: user.vehicle.fuelEfficiency }
          : null,
      } : { id: "", name: "", rating: 0, avatar: undefined, vehicle: null },
      pickup: req.pickup,
      dropoff: req.dropoff,
      fare: req.fare,
      matchingFee: req.matchingFee,
      total: req.total,
      distanceKm: req.distanceKm,
    });
  };

  const handleDecline = (req: MatchRequestPayload) => {
    console.log("[MATCH-STAGE-4b] Driver declining match:", { passengerId: req.passengerId });
    emitMatchDecline(req.passengerId);
    clearPendingMatch();
  };

  const handleCompleteRide = () => {
    if (rideId) {
      emitRideComplete(rideId);
      setAccepted(null);
      setRideId(null);
      setTimer(60);
      clearActiveRide();
      setActiveRide(null);
    } else {
      setDriverError("Ride ID not available");
    }
  };

  const handleNoShow = () => {
    Alert.alert(
      "Passenger No-Show",
      "Cancel this ride and notify the passenger?",
      [
        { text: "Keep Waiting", style: "cancel" },
        {
          text: "Cancel Ride",
          style: "destructive",
          onPress: () => {
            if (rideId) {
              emitRideCancel(rideId, "Passenger no-show");
              setAccepted(null);
              setRideId(null);
              setTimer(60);
              clearActiveRide();
              setActiveRide(null);
            }
          },
        },
      ]
    );
  };

  const etaMin = selectedDest ? (routeInfo?.durationMin ?? 18) : null;
  const fuelEst = routeInfo ? `₱${Math.max(Math.round(routeInfo.distanceKm * 60 / 10 / 10) * 10, 20)}` : null;

  return (
    <View style={styles.container}>
      <RealMap
        showRoute={!!routePolyline}
        routePolyline={routePolyline ?? undefined}
        userLocation={userLoc ?? undefined}
        pickupPoint={selectedDest ?? undefined}
        fitRouteKey={fitRouteKey}
        recenterKey={recenterKey}
        onUserDrag={() => setShowRecenter(true)}
      />
      <LoadingOverlay visible={isLoading} message="Preparing route..." />

      {showRecenter && (
        <Pressable
          style={[styles.recenterBtn, { backgroundColor: colors.primary, bottom: Math.max(infoBarHeight + 12, 120) }]}
          onPress={() => { setShowRecenter(false); setRecenterKey(k => k + 1); }}
        >
          <Feather name="navigation" size={20} color="#fff" />
        </Pressable>
      )}

      <View style={[styles.topBar, { paddingTop: topPad - 4 }]}>
        <View style={styles.greetingRow}>
          <Pressable
            style={[styles.roleSwitchBtn, { backgroundColor: colors.primary }]}
            onPress={() => { switchRole("passenger"); router.replace("/(main)/passenger-home"); }}
          >
            <Feather name="refresh-cw" size={12} color="#fff" />
            <Text style={[styles.roleSwitchText, { fontFamily: "Inter_500Medium" }]}>Switch to Passenger</Text>
          </Pressable>
        </View>

        <View style={[styles.destBar, { backgroundColor: "rgba(255,255,255,0.97)" }]}>
          <View style={[styles.destDot, { backgroundColor: colors.primary }]} />
          <TextInput
            style={[styles.destInput, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
            value={destQuery}
            onChangeText={(t) => { setDestQuery(t); setShowDestSuggestions(true); }}
            onFocus={() => setShowDestSuggestions(true)}
            onBlur={() => setTimeout(() => setShowDestSuggestions(false), 200)}
            placeholder="Set destination..."
            placeholderTextColor={colors.textMuted}
          />
        </View>

        {showDestSuggestions && !isOnline && filteredDests.length > 0 && (
          <View style={[styles.suggestions, { backgroundColor: "rgba(255,255,255,0.97)" }]}>
            {filteredDests.map(d => (
              <Pressable
                key={d.name}
                style={styles.suggestionItem}
                onPress={() => handleSelectDest(d)}
              >
                <Feather name="map-pin" size={14} color={colors.primary} />
                <Text style={[styles.suggestionText, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>{d.name}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {driverError && (
          <View style={[styles.errorBanner, { backgroundColor: colors.destructiveLight }]}>
            <Feather name="alert-circle" size={14} color={colors.destructive} />
            <Text style={[styles.errorBannerText, { color: colors.destructive, fontFamily: "Inter_500Medium" }]}>{driverError}</Text>
            <Pressable onPress={() => setDriverError(null)} hitSlop={8}>
              <Feather name="x" size={14} color={colors.destructive} />
            </Pressable>
          </View>
        )}
      </View>

      {pendingMatchRequest && !accepted && (
        <Animated.View
          style={[
            styles.requestPopup,
            { backgroundColor: "rgba(255,255,255,0.97)", top: topPad + (showDestSuggestions ? 200 : 130) },
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.requestHeader}>
            <Feather name="star" size={12} color={colors.primary} />
            <Text style={[styles.requestHeaderText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>Pasabay request</Text>
          </View>
          <View style={styles.requestBody}>
            <View style={[styles.passengerAvatar, { backgroundColor: "#e0885a" }]}>
              <Text style={[styles.passengerAvatarText, { fontFamily: "Sora_800ExtraBold" }]}>
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
              <Text style={[styles.fareAddText, { color: colors.accentDark, fontFamily: "Sora_800ExtraBold" }]}>
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
        <View style={[styles.acceptedInfo, { backgroundColor: "rgba(255,255,255,0.97)", top: topPad + 130 }]}>
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
            <Pressable style={[styles.chatBtn, { backgroundColor: colors.primaryLight }]} onPress={() => setShowChat(true)}>
              <Feather name="message-circle" size={16} color={colors.primary} />
            </Pressable>
            {timer > 0 ? (
              <View style={[styles.timerBadge, { backgroundColor: timer < 20 ? colors.destructiveLight : colors.primaryLight }]}>
                <Text style={[styles.timerText, { color: timer < 20 ? colors.destructive : colors.primary, fontFamily: "Sora_800ExtraBold" }]}>{timer}s</Text>
              </View>
            ) : (
              <Pressable style={[styles.noShowBtn, { backgroundColor: colors.destructive }]} onPress={handleNoShow}>
                <Text style={[styles.noShowText, { color: "#fff", fontFamily: "Inter_600SemiBold" }]}>Passenger No-Show</Text>
              </Pressable>
            )}
          </View>
        </View>
      )}

      <ChatSheet
        visible={showChat}
        onClose={() => setShowChat(false)}
        driverName={accepted?.passengerName ?? "Passenger"}
      />

      {selectedDest && (
        <View style={[styles.infoBar, { backgroundColor: "rgba(255,255,255,0.97)", paddingBottom: Math.max(insets.bottom + 16, 24) + (isOnline && !accepted && !showRouteInfo ? 32 : 60) }]} onLayout={(e) => setInfoBarHeight(e.nativeEvent.layout.height)}>
          {isOnline && !accepted ? (
            <Pressable style={[styles.navBar, { backgroundColor: colors.primary }]} onPress={() => setShowRouteInfo(v => !v)}>
              <View style={[styles.navIcon, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
                <Feather name="navigation" size={20} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.navLabel}>En route to</Text>
                <Text style={styles.navDest}>{selectedDest?.name ?? "Destination"}</Text>
              </View>
              <View style={styles.navEta}>
                <Feather name="clock" size={14} color="#fff" />
                <Text style={styles.navEtaText}>{etaMin != null ? `${etaMin} min` : "—"}</Text>
              </View>
              <Feather name={showRouteInfo ? "chevron-down" : "chevron-up"} size={16} color="#fff" />
            </Pressable>
          ) : (
            <Pressable
              style={[styles.driveBtn, { backgroundColor: colors.primary }]}
              onPress={handleGoOnline}
            >
              <Feather name="navigation" size={16} color="#fff" />
              <Text style={[styles.driveBtnText, { fontFamily: "Inter_600SemiBold" }]}>
                Drive to Destination
              </Text>
            </Pressable>
          )}
          {(!isOnline || accepted || showRouteInfo) && (
            <>
              <View style={styles.routeRow}>
                <View style={[styles.routeIcon, { backgroundColor: colors.primaryLight }]}>
                  <Feather name="map-pin" size={16} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>To</Text>
                  <Text style={[styles.infoValue, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{selectedDest.name}</Text>
                </View>
              </View>
              <View style={styles.routeMeta}>
                <View style={styles.metaBlock}>
                  <Feather name="clock" size={12} color={colors.textSecondary} />
                  <Text style={[styles.metaText, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
                    {etaMin != null ? `${etaMin} min` : "—"}
                  </Text>
                </View>
                <View style={styles.metaBlock}>
                  <Feather name="droplet" size={12} color={colors.textSecondary} />
                  <Text style={[styles.metaText, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
                    {fuelEst ?? "—"}
                  </Text>
                </View>
                <View style={styles.metaBlock}>
                  <Feather name="maximize" size={12} color={colors.textSecondary} />
                  <Text style={[styles.metaText, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
                    {routeInfo ? `${routeInfo.distanceKm.toFixed(1)} km` : "—"}
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
container: { flex: 1 },
  topBar: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 10, paddingHorizontal: 16, gap: 8 },
  greetingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 2 },
  roleSwitchBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  roleSwitchText: { fontSize: 12, color: "#fff", textShadowColor: "rgba(0,0,0,0.75)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  destBar: { flexDirection: "row", alignItems: "center", borderRadius: 14, padding: 10, paddingLeft: 16, gap: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 },
  destDot: { width: 8, height: 8, borderRadius: 4 },
  destInput: { flex: 1, fontSize: 14, minHeight: 34 },

  suggestions: { borderRadius: 12, overflow: "hidden", zIndex: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 },
  suggestionItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f5f5f5" },
  suggestionText: { fontSize: 14 },
  requestPopup: { position: "absolute", left: 12, right: 12, borderRadius: 16, padding: 16, gap: 12, zIndex: 200, shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 20, elevation: 8 },
  requestHeader: { flexDirection: "row", alignItems: "center", gap: 5 },
  requestHeaderText: { fontSize: 15 },
  requestBody: { flexDirection: "row", alignItems: "center", gap: 10 },
  passengerAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  passengerAvatarText: { color: "#fff", fontSize: 14 },
  passengerName: { fontSize: 16, marginBottom: 2 },
  passengerRoute: { fontSize: 13 },
  fareAdd: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  fareAddText: { fontSize: 13 },
  requestActions: { flexDirection: "row", gap: 8 },
  declineBtn: { flex: 1, height: 44, borderRadius: 12, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  declineBtnText: { fontSize: 14 },
  acceptBtn: { flex: 2, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  acceptBtnText: { color: "#fff", fontSize: 14 },
  acceptedInfo: { position: "absolute", left: 16, right: 16, borderRadius: 16, padding: 14, zIndex: 200, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 5 },
  acceptedHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  acceptedIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  acceptedTitle: { fontSize: 14 },
  acceptedSubtitle: { fontSize: 12, marginTop: 2 },
  chatBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  timerBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  timerText: { fontSize: 16 },
  noShowBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  noShowText: { fontSize: 12 },
  infoBar: { position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 5, paddingHorizontal: 20, paddingTop: 16, gap: 12, borderTopLeftRadius: 20, borderTopRightRadius: 20, shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 10 },
  infoLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  infoValue: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  routeRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  routeIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  routeMeta: { flexDirection: "row", gap: 20, paddingLeft: 46 },
  metaBlock: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 13 },
  driveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 50, borderRadius: 14 },
  driveBtnText: { color: "#fff", fontSize: 16 },
  errorBanner: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 12 },
  errorBannerText: { flex: 1, fontSize: 13 },
  recenterBtn: {
    position: "absolute",
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 15,
    zIndex: 15,
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    height: 56,
    borderRadius: 14,
    paddingHorizontal: 16,
  },
  navIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  navLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.75)",
    fontFamily: "Inter_400Regular",
  },
  navDest: {
    fontSize: 15,
    color: "#fff",
    fontFamily: "Inter_600SemiBold",
  },
  navEta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  navEtaText: {
    fontSize: 14,
    color: "#fff",
    fontFamily: "Sora_800ExtraBold",
  },
});
