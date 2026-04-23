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
  const [showRecenter, setShowRecenter] = useState(false);

  const slideAnim = useRef(new Animated.Value(-160)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const topPad = Platform.OS === "web" ? Math.min(dimensions.width * 0.17, 67) : insets.top;

  const DEST_OPTIONS = [
    { name: "IT Park, Lahug", lat: 10.3296, lng: 123.9077 },
    { name: "SM City Cebu", lat: 10.3278, lng: 123.9028 },
    { name: "Ayala Center", lat: 10.3080, lng: 123.8980 },
    { name: "JY Square", lat: 10.3200, lng: 123.9050 },
    { name: "Mango Square", lat: 10.3100, lng: 123.9000 },
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
      Alert.alert("Driver Error", data.message);
      setIsOnline(false);
    });
    return () => {
      offRouteSet();
      offError();
    };
  }, []);

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
      Alert.alert("Set Destination", "Please select your destination before going online.");
      return;
    }
    if (!userLoc) {
      Alert.alert("Location Required", "Please enable location services to go online.");
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

  const handleGoOffline = () => {
    setIsLoading(true);
    emitDriverOffline();
    setIsOnline(false);
    setRouteInfo(null);
    setAccepted(null);
    setRideId(null);
    clearActiveRide();
    setActiveRide(null);
    setTimeout(() => setIsLoading(false), 300);
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
    setActiveRide({
      rideId: rideId ?? req.routeId,
      driver: user ? {
        id: user.id,
        name: user.name,
        rating: user.rating,
        avatar: user.avatar,
        vehicle: user.vehicle
          ? { make: user.vehicle.make, model: user.vehicle.model, color: user.vehicle.color, plate: user.vehicle.plate }
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
      Alert.alert("Error", "Ride ID not available");
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

  return (
    <View style={styles.container}>
      <RealMap
        showRoute={!!routePolyline}
        routePolyline={routePolyline ?? undefined}
        userLocation={userLoc ?? undefined}
        pickupPoint={selectedDest ?? undefined}
        centerOn={selectedDest ?? undefined}
        recenterKey={recenterKey}
        onUserDrag={() => setShowRecenter(true)}
      />
      <LoadingOverlay visible={isLoading} message={isOnline ? "Going offline..." : "Going online..."} />

      {showRecenter && (
        <Pressable
          style={[styles.recenterBtn, { backgroundColor: colors.primary, bottom: Math.max(insets.bottom + 100, 120) }]}
          onPress={() => { setShowRecenter(false); setRecenterKey(k => k + 1); }}
        >
          <Feather name="navigation" size={20} color="#fff" />
        </Pressable>
      )}

      <View style={[styles.topBar, { paddingTop: topPad, paddingHorizontal: 16 }]}>
        <View style={[styles.destBar, { backgroundColor: "rgba(255,255,255,0.97)" }]}>
          <View style={[styles.destDot, { backgroundColor: isOnline ? colors.primary : colors.textMuted }]} />
          <TextInput
            style={[styles.destInput, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}
            value={destQuery}
            onChangeText={(t) => { setDestQuery(t); setShowDestSuggestions(true); }}
            onFocus={() => setShowDestSuggestions(true)}
            onBlur={() => setTimeout(() => setShowDestSuggestions(false), 200)}
            placeholder="Set destination..."
            placeholderTextColor={colors.textMuted}
            editable={!isOnline}
          />
          <Pressable
            style={[styles.statusTag, { backgroundColor: isOnline ? colors.primaryLight : colors.card }]}
            onPress={isOnline ? handleGoOffline : handleGoOnline}
          >
            <Text style={[styles.statusTagText, { color: isOnline ? colors.primary : colors.textSecondary, fontFamily: "Inter_500Medium" }]}>
              {isOnline ? "Online" : "Go Online"}
            </Text>
          </Pressable>
        </View>

        <Pressable
          style={[styles.switchBtn, { backgroundColor: "rgba(255,255,255,0.97)" }]}
          onPress={() => { switchRole("passenger"); router.replace("/(main)/passenger-home"); }}
        >
          <Feather name="user" size={16} color={colors.primary} />
          <Text style={[styles.switchBtnText, { color: colors.primary, fontFamily: "Inter_500Medium" }]}>Switch to Passenger</Text>
          <Feather name="arrow-right" size={16} color={colors.primary} />
        </Pressable>

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
      </View>

      {pendingMatchRequest && !accepted && (
        <Animated.View
          style={[
            styles.requestPopup,
            { backgroundColor: "rgba(255,255,255,0.97)", top: topPad + (showDestSuggestions ? 180 : 76) },
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
            <Pressable style={[styles.chatBtn, { backgroundColor: colors.primaryLight }]} onPress={() => setShowChat(true)}>
              <Feather name="message-circle" size={16} color={colors.primary} />
            </Pressable>
            {timer > 0 ? (
              <View style={[styles.timerBadge, { backgroundColor: timer < 20 ? colors.destructiveLight : colors.primaryLight }]}>
                <Text style={[styles.timerText, { color: timer < 20 ? colors.destructive : colors.primary, fontFamily: "Inter_700Bold" }]}>{timer}s</Text>
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

      <View style={[styles.infoBar, { backgroundColor: "rgba(255,255,255,0.97)", paddingBottom: Math.max(insets.bottom + 16, 24) + 60 }]}>
        <View style={styles.infoBlock}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>To destination</Text>
          <Text style={[styles.infoValue, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{selectedDest?.name ?? "Not set"}</Text>
        </View>
        <View style={styles.infoBlock}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>ETA</Text>
          <Text style={[styles.infoValue, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
            {etaMin != null ? `${etaMin} ` : "— "}
            <Text style={[styles.infoUnit, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>{etaMin != null ? "min" : ""}</Text>
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
  destInput: { flex: 1, fontSize: 14 },
  switchBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 12, padding: 10, marginTop: 6, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  switchBtnText: { fontSize: 13 },
  statusTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusTagText: { fontSize: 12 },
  suggestions: { position: "absolute", top: 58, left: 0, right: 0, borderRadius: 12, overflow: "hidden", zIndex: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 },
  suggestionItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f5f5f5" },
  suggestionText: { fontSize: 14 },
  requestPopup: { position: "absolute", left: 16, right: 16, borderRadius: 16, padding: 14, gap: 10, zIndex: 200, shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 20, elevation: 8 },
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
  infoBar: { position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 5, flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 24, paddingTop: 16 },
  infoBlock: { gap: 3 },
  infoLabel: { fontSize: 11 },
  infoValue: { fontSize: 18 },
  infoUnit: { fontSize: 14 },
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
    elevation: 5,
  },
});
