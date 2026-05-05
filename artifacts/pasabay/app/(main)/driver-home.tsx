import React, { useEffect, useRef, useState } from "react";
import { Animated, Platform, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, FontAwesome } from "@expo/vector-icons";
import { RealMap } from "@/components/RealMap";
import LoadingOverlay from "@/components/LoadingOverlay";
import { useTheme } from "react-native-paper";
import { Card, Button, Surface } from "react-native-paper";
import { useLocation } from "@/hooks/useLocation";
import { useApp } from "@/context/AppContext";
import type { RidePassenger } from "@/context/AppContext";
import { useScale } from "@/hooks/useScale";
import { emitDriverOnline, emitDriverOffline, emitDriverArrived, emitDriverStartedTrip, emitMatchAccept, emitMatchDecline,
  emitRideComplete, onDriverRouteSet, onDriverError,
  onMatchAccepted, emitDriverLocation, emitNoShow,
} from "@/lib/socket";
import { ChatSheet } from "@/components/ChatSheet";
import type { MatchRequestPayload } from "@/lib/socket";
import { getRoute } from "@/lib/osrm";

export default function DriverHomeScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { fs, isSmall } = useScale();
  const dimensions = useWindowDimensions();
  const { user, pendingMatchRequest, clearPendingMatch, activeRide, clearActiveRide, setActiveRide, addPassengerToRide, updatePassengerStatus, switchRole, socketConnected, clearMatchConfirmed, demoDriverDest } = useApp();
  const { location: userLoc } = useLocation();

  const [isOnline, setIsOnline] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{ distanceKm: number; durationMin: number } | null>(null);
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
  const [selectedPassengerIndex, setSelectedPassengerIndex] = useState(0);
  const [passengerTimers, setPassengerTimers] = useState<Record<string, number>>({});
  const [matchRequestTimer, setMatchRequestTimer] = useState(60);
  const [showPassengerList, setShowPassengerList] = useState(true);
  const [chatPassengerName, setChatPassengerName] = useState<string>("Passenger");
  const [heading, setHeading] = useState(0);
  const [navStep, setNavStep] = useState(0);

  const WAZE_NAV_STEPS = [
    { dist: "500 m", text: "Turn left on Gorordo Ave", icon: "chevron-left" as const },
    { dist: "1.2 km", text: "Continue straight on Gov. M. Cuenco Ave", icon: "chevron-up" as const },
    { dist: "300 m", text: "Turn right on Gen. Maxilom Ave", icon: "chevron-right" as const },
  ];

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
    if (!pendingMatchRequest) return;
    setMatchRequestTimer(60);
    const interval = setInterval(() => {
      setMatchRequestTimer(t => {
        if (t <= 1) { clearInterval(interval); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [pendingMatchRequest]);

  useEffect(() => {
    const ids = Object.keys(passengerTimers);
    if (ids.length === 0) return;
    const interval = setInterval(() => {
      setPassengerTimers(prev => {
        const next = { ...prev };
        let changed = false;
        for (const pid of Object.keys(next)) {
          if (next[pid] > 1) {
            next[pid]--;
            changed = true;
          } else {
            delete next[pid];
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [passengerTimers]);

  useEffect(() => {
    if (!isOnline || !userLoc) return;
    const interval = setInterval(() => {
      emitDriverLocation(userLoc.lat, userLoc.lng);
    }, 10000);
    return () => clearInterval(interval);
  }, [isOnline, userLoc]);

  useEffect(() => {
    if (!socketConnected) return;
    const off = onMatchAccepted((data) => {
      if (activeRide && data.rideId) {
        setActiveRide({ ...activeRide, rideId: data.rideId });
      }
    });
    return off;
  }, [socketConnected, activeRide]);

  useEffect(() => {
    if (!socketConnected) return;
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
  }, [socketConnected]);

  // Fit the map to show the full route ONCE when destination or accepted match changes
  useEffect(() => {
    if (!selectedDest && (!activeRide || activeRide.passengers.length === 0)) return;
    setFitRouteKey((k) => k + 1);
  }, [selectedDest, activeRide?.passengers]);

  useEffect(() => {
    const activePassenger = activeRide?.passengers?.[selectedPassengerIndex];
    const dest = activePassenger && activePassenger.status !== 'onboard' ? activePassenger.pickup : 
                 activePassenger && activePassenger.status === 'onboard' ? activePassenger.dropoff : 
                 selectedDest;
    if (!userLoc || !dest) return;
    setRoutePolyline(null);
    let cancelled = false;
    const fetch = async () => {
      const route = await getRoute(userLoc, dest);
      if (cancelled) return;
      if (route) {
        setRoutePolyline(route.polyline);
        setRouteInfo({ distanceKm: route.distanceKm, durationMin: Math.round(route.durationSec / 60) });
      }
    };
    fetch();
    return () => { cancelled = true; };
  }, [selectedDest, userLoc, activeRide?.passengers, selectedPassengerIndex]);

  // Compute heading from the first segment of the route polyline
  useEffect(() => {
    if (!routePolyline || routePolyline.length < 2) return;
    const p0 = routePolyline[0];
    const p1 = routePolyline[1];
    const toRad = (d: number) => (d * Math.PI) / 180;
    const toDeg = (r: number) => (r * 180) / Math.PI;
    const dLng = toRad(p1.lng - p0.lng);
    const y = Math.sin(dLng) * Math.cos(toRad(p1.lat));
    const x = Math.cos(toRad(p0.lat)) * Math.sin(toRad(p1.lat)) -
      Math.sin(toRad(p0.lat)) * Math.cos(toRad(p1.lat)) * Math.cos(dLng);
    setHeading((toDeg(Math.atan2(y, x)) + 360) % 360);
  }, [routePolyline]);

  useEffect(() => {
    if (!demoDriverDest || selectedDest) return;
    console.log('[DEMO] Setting driver destination:', demoDriverDest.name);
    setDestQuery(demoDriverDest.name);
    setSelectedDest(demoDriverDest);
  }, [demoDriverDest, selectedDest]);

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
    if (!socketConnected) {
      setDriverError("Connecting to server. Please wait a moment and try again.");
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
    const newPassenger: RidePassenger = {
      passengerId: req.passengerId,
      passengerName: req.passengerName,
      passengerRating: req.passengerRating,
      passengerAvatar: req.passengerAvatar,
      pickup: req.pickup,
      dropoff: req.dropoff,
      fare: req.fare,
      matchingFee: req.matchingFee,
      total: req.total,
      distanceKm: req.distanceKm,
      status: "en_route",
    };
    if (!activeRide) {
      setActiveRide({
        rideId: req.routeId,
        driver: user ? {
          id: user.id, name: user.name, rating: user.rating, avatar: user.avatar,
          vehicle: user.vehicle
            ? { make: user.vehicle.make, model: user.vehicle.model, color: user.vehicle.color, plate: user.vehicle.plate, fuelEfficiency: user.vehicle.fuelEfficiency }
            : null,
        } : { id: "", name: "", rating: 0, avatar: undefined, vehicle: null },
        passengers: [newPassenger],
      });
    } else {
      addPassengerToRide(newPassenger);
    }
    clearPendingMatch();
  };

  const handleDecline = (req: MatchRequestPayload) => {
    emitMatchDecline(req.passengerId);
    clearPendingMatch();
  };

  const handleArrived = (passengerId: string) => {
    const rideId = activeRide?.rideId;
    if (!rideId) return;
    emitDriverArrived(rideId, passengerId);
    updatePassengerStatus(passengerId, "at_pickup");
    setPassengerTimers(prev => ({ ...prev, [passengerId]: 60 }));
  };

  const handleStartTrip = (passengerId: string) => {
    const rideId = activeRide?.rideId;
    if (!rideId) return;
    emitDriverStartedTrip(rideId, passengerId);
    updatePassengerStatus(passengerId, "onboard");
    setPassengerTimers(prev => { const next = { ...prev }; delete next[passengerId]; return next; });
  };

  const handleDropOff = (passengerId: string) => {
    updatePassengerStatus(passengerId, "completed");
    const remaining = activeRide?.passengers.filter(p => p.passengerId !== passengerId && p.status !== "completed") ?? [];
    if (remaining.length === 0) {
      const rideId = activeRide?.rideId;
      if (rideId) emitRideComplete(rideId);
      clearActiveRide();
      setPassengerTimers({});
    }
  };

  const handleNoShow = (passengerId: string) => {
    const rideId = activeRide?.rideId;
    if (rideId) emitNoShow(rideId, passengerId);
    updatePassengerStatus(passengerId, "completed");
    setPassengerTimers(prev => { const next = { ...prev }; delete next[passengerId]; return next; });
    const remaining = activeRide?.passengers.filter(p => p.passengerId !== passengerId && p.status !== "completed") ?? [];
    if (remaining.length === 0) clearActiveRide();
  };

  const handleCompleteRide = () => {
    const rideId = activeRide?.rideId;
    if (!rideId) return;
    emitRideComplete(rideId);
    clearActiveRide();
    setPassengerTimers({});
  };

  const handleConfirmCancel = () => {
    emitDriverOffline();
    setIsOnline(false);
    setRouteInfo(null);
    setRoutePolyline(null);
    setSelectedDest(null);
    setDestQuery("");
    setDriverError(null);
    setDriverError(null);
    setInfoBarHeight(0);
    clearActiveRide();
    setPassengerTimers({});
  };

  const activePassenger = activeRide?.passengers?.[selectedPassengerIndex] ?? null;
  const passengers = activeRide?.passengers ?? [];
  const hasActiveRide = passengers.length > 0;
  const activeCount = passengers.filter(p => p.status !== "completed").length;

  // Cycle Waze nav steps when there are active passengers
  useEffect(() => {
    if (activeCount === 0) return;
    const timer = setInterval(() => {
      setNavStep(s => (s + 1) % WAZE_NAV_STEPS.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [activeCount]);
  const estEarnings = routeInfo ? `₱${Math.round(routeInfo.distanceKm * 8)}` : null;
  const etaMin = (selectedDest || activePassenger) ? (routeInfo?.durationMin ?? 18) : null;

  return (
    <View style={styles.container}>
      <RealMap
        showRoute={!!routePolyline}
        routePolyline={routePolyline ?? undefined}
        userLocation={userLoc ?? undefined}
        pickupPoint={activePassenger ? activePassenger.pickup : (selectedDest ?? undefined)}
        dropoffPoint={activePassenger ? activePassenger.dropoff : undefined}
        fitRouteKey={fitRouteKey}
        recenterKey={recenterKey}
        onUserDrag={() => setShowRecenter(true)}
        heading={heading}
      />
      <LoadingOverlay visible={isLoading} message="Preparing route..." />

      {demoDriverDest && (
        <View style={{ position: 'absolute', top: 4, left: 0, right: 0, zIndex: 999, backgroundColor: 'rgba(13,158,117,0.9)', padding: 6, alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 12, fontFamily: 'Inter_600SemiBold' }}>DEMO: {demoDriverDest.name}</Text>
        </View>
      )}

      {showRecenter && (
        <Pressable
          style={[styles.recenterBtn, { backgroundColor: colors.primary, bottom: Math.max(infoBarHeight + 12, 120) }]}
          onPress={() => { setShowRecenter(false); setRecenterKey(k => k + 1); }}
        >
          <Feather name="navigation" size={20} color="#fff" />
        </Pressable>
      )}

      {!isOnline && !hasActiveRide && (
      <View style={[styles.topBar, { paddingTop: topPad - 4 }]}>
        <View style={[styles.destBar, { backgroundColor: "rgba(255,255,255,0.97)" }]}>
          <View style={[styles.destDot, { backgroundColor: colors.primary }]} />
          <TextInput
            style={[styles.destInput, { color: colors.onSurface, fontFamily: "Inter_400Regular" }]}
            value={destQuery}
            onChangeText={(t) => { setDestQuery(t); setShowDestSuggestions(true); }}
            onFocus={() => setShowDestSuggestions(true)}
            onBlur={() => setTimeout(() => setShowDestSuggestions(false), 200)}
            placeholder="Set destination..."
            placeholderTextColor={colors.onSurfaceDisabled}
          />
          <Pressable
            style={[styles.searchBtn, { backgroundColor: selectedDest ? colors.error : colors.primary }]}
            onPress={selectedDest ? () => { setSelectedDest(null); setDestQuery(""); setRoutePolyline(null); setRouteInfo(null); } : undefined}
          >
            <Feather name={selectedDest ? "x" : "search"} size={16} color="#fff" />
          </Pressable>
        </View>

        {showDestSuggestions && !isOnline && filteredDests.length > 0 && (
          <View style={[styles.suggestions, { backgroundColor: "rgba(255,255,255,0.97)" }]}>
            {filteredDests.map(d => (
              <Pressable
                key={d.name}
                style={styles.suggestionItem}
                onPressIn={() => handleSelectDest(d)}
              >
                <Feather name="map-pin" size={14} color={colors.primary} />
                <Text style={[styles.suggestionText, { color: colors.onSurface, fontFamily: "Inter_400Regular" }]}>{d.name}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {driverError && (
          <View style={[styles.errorBanner, { backgroundColor: colors.errorContainer }]}>
            <Feather name="alert-circle" size={14} color={colors.error} />
            <Text style={[styles.errorBannerText, { color: colors.error, fontFamily: "Inter_500Medium" }]}>{driverError}</Text>
            <Pressable onPress={() => setDriverError(null)} hitSlop={8}>
              <Feather name="x" size={14} color={colors.error} />
            </Pressable>
          </View>
        )}
      </View>
      )}

      {pendingMatchRequest && (
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
              <Text style={[styles.passengerName, { color: colors.onSurface, fontFamily: "Inter_600SemiBold" }]}>
                {pendingMatchRequest.passengerName} · ★{pendingMatchRequest.passengerRating.toFixed(1)}
              </Text>
              <Text style={[styles.passengerRoute, { color: colors.onSurfaceVariant, fontFamily: "Inter_400Regular" }]}>
                {pendingMatchRequest.pickup.name} → {pendingMatchRequest.dropoff.name}
              </Text>
            </View>
            <View style={[styles.fareAdd, { backgroundColor: colors.tertiaryContainer }]}>
              <Text style={[styles.fareAddText, { color: colors.onTertiaryContainer, fontFamily: "Sora_800ExtraBold" }]}>
                + ₱{pendingMatchRequest.total.toFixed(2)}
              </Text>
            </View>
          </View>
          <View style={styles.requestActions}>
            <Button
              mode="outlined"
              textColor={colors.onSurfaceVariant}
              onPress={() => handleDecline(pendingMatchRequest)}
              style={[styles.declineBtn, { borderColor: colors.outline }]}
              contentStyle={{ height: 44 }}
              labelStyle={{ fontFamily: "Inter_500Medium", fontSize: 14 }}
            >
              Decline
            </Button>
            <Button
              mode="contained"
              buttonColor={colors.primary}
              textColor={colors.onPrimary}
              onPress={() => handleAccept(pendingMatchRequest)}
              style={styles.acceptBtn}
              contentStyle={{ height: 44 }}
              labelStyle={{ fontFamily: "Inter_600SemiBold", fontSize: 14 }}
            >
              Accept
            </Button>
          </View>
        </Animated.View>
      )}

      {(isOnline || activeCount > 0) && (
        <View style={[styles.wazeNav, { backgroundColor: colors.primary, top: topPad - 4 }]}>
          <View style={styles.wazeNavBox}>
            <View style={[styles.wazeNavIcon, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
              <Feather name={WAZE_NAV_STEPS[navStep].icon} size={20} color="#fff" />
            </View>
            <View style={styles.wazeNavText}>
              <Text style={styles.wazeNavDist}>{WAZE_NAV_STEPS[navStep].dist}</Text>
              <Text style={styles.wazeNavInst} numberOfLines={1}>{WAZE_NAV_STEPS[navStep].text}</Text>
            </View>
            <Pressable onPress={handleConfirmCancel} hitSlop={8} style={styles.wazeNavClose}>
              <Feather name="x" size={20} color="#fff" />
            </Pressable>
          </View>
          <View style={styles.wazeNavDots}>
            {WAZE_NAV_STEPS.map((_, i) => (
              <View key={i} style={[styles.wazeNavDot, { backgroundColor: i === navStep ? "#fff" : "rgba(255,255,255,0.4)" }]} />
            ))}
          </View>
        </View>
      )}

      <ChatSheet
        visible={showChat}
        onClose={() => setShowChat(false)}
        driverName={chatPassengerName}
        userIsPassenger={false}
      />

      {(selectedDest || isOnline || hasActiveRide) && (
        <View style={[styles.infoBar, { backgroundColor: "rgba(255,255,255,0.97)", paddingBottom: Math.max(insets.bottom + 8, 16) + 64 }]} onLayout={(e) => setInfoBarHeight(e.nativeEvent.layout.height)}>
          {!isOnline && selectedDest ? (
            <>
              <View style={styles.wazeBentoRow}>
                <Surface style={[styles.wazeBentoBox, { backgroundColor: colors.tertiaryContainer }]}>
                  <Feather name="clock" size={16} color={colors.onTertiaryContainer} />
                  <Text style={[styles.wazeBentoValue, { color: colors.onTertiaryContainer, fontFamily: "Sora_800ExtraBold" }]}>
                    {etaMin != null ? `${etaMin}` : "—"}
                  </Text>
                  <Text style={[styles.wazeBentoLabel, { color: colors.onTertiaryContainer }]}>min</Text>
                </Surface>
                <Surface style={[styles.wazeBentoBox, { backgroundColor: colors.surfaceVariant }]}>
                  <Feather name="maximize" size={16} color={colors.onSurfaceVariant} />
                  <Text style={[styles.wazeBentoValue, { color: colors.onSurface, fontFamily: "Inter_600SemiBold" }]}>
                    {routeInfo ? `${routeInfo.distanceKm.toFixed(1)}` : "—"}
                  </Text>
                  <Text style={[styles.wazeBentoLabel, { color: colors.onSurfaceVariant }]}>km</Text>
                </Surface>
                <Surface style={[styles.wazeBentoBox, { backgroundColor: colors.primaryContainer }]}>
                  <Feather name="trending-up" size={16} color={colors.primary} />
                  <Text style={[styles.wazeBentoValue, { color: colors.primary, fontFamily: "Sora_800ExtraBold" }]}>
                    {estEarnings ?? "—"}
                  </Text>
                  <Text style={[styles.wazeBentoLabel, { color: colors.primary }]}>Est. Earnings</Text>
                </Surface>
              </View>
              <Button
                mode="contained"
                buttonColor={colors.primary}
                textColor={colors.onPrimary}
                onPress={handleGoOnline}
                style={{ borderRadius: 14 }}
                contentStyle={{ height: 50 }}
                labelStyle={{ fontFamily: "Inter_600SemiBold", fontSize: 16 }}
                icon={() => <Feather name="navigation" size={16} color={colors.onPrimary} />}
              >
                Drive to Destination
              </Button>
            </>
          ) : (isOnline || hasActiveRide) ? (
            <>
              <View style={styles.destIndicator}>
                <Feather name="map-pin" size={12} color={colors.primary} />
                <Text style={[styles.destIndicatorText, { color: colors.onSurfaceVariant, fontFamily: "Inter_500Medium" }]} numberOfLines={1}>
                  Heading to {selectedDest?.name ?? "Destination"}
                </Text>
              </View>
              <Pressable onPress={() => setShowPassengerList(v => !v)} style={{ gap: 10 }}>
                <View style={styles.wazeBentoRow}>
                  <Surface style={[styles.wazeBentoBox, { backgroundColor: colors.tertiaryContainer }]}>
                    <Feather name="clock" size={16} color={colors.onTertiaryContainer} />
                    <Text style={[styles.wazeBentoValue, { color: colors.onTertiaryContainer, fontFamily: "Sora_800ExtraBold" }]}>
                      {etaMin != null ? `${etaMin}` : "—"}
                    </Text>
                    <Text style={[styles.wazeBentoLabel, { color: colors.onTertiaryContainer }]}>min</Text>
                  </Surface>
                  <Surface style={[styles.wazeBentoBox, { backgroundColor: colors.surfaceVariant }]}>
                    <Feather name="maximize" size={16} color={colors.onSurfaceVariant} />
                    <Text style={[styles.wazeBentoValue, { color: colors.onSurface, fontFamily: "Inter_600SemiBold" }]}>
                      {routeInfo ? `${routeInfo.distanceKm.toFixed(1)}` : "—"}
                    </Text>
                    <Text style={[styles.wazeBentoLabel, { color: colors.onSurfaceVariant }]}>km</Text>
                  </Surface>
                  <Surface style={[styles.wazeBentoBox, { backgroundColor: colors.surfaceVariant }]}>
                    <FontAwesome name="users" size={14} color={colors.onSurfaceVariant} />
                    <Text style={[styles.wazeBentoValue, { color: colors.onSurface, fontFamily: "Sora_800ExtraBold" }]}>
                      {activeCount}
                    </Text>
                    <Text style={[styles.wazeBentoLabel, { color: colors.onSurfaceVariant }]}>riders</Text>
                  </Surface>
                </View>
                <View style={{ alignItems: "center" }}>
                  <Feather name={showPassengerList ? "chevron-down" : "chevron-up"} size={20} color={colors.onSurfaceVariant} />
                </View>
              </Pressable>
              {showPassengerList && (
                <>
                  {activeCount > 0 ? (
                    <View style={{ gap: 8 }}>
                      {passengers.filter(p => p.status !== "completed").map((p, i) => {
                        const isSelected = i === selectedPassengerIndex;
                        const timer = passengerTimers[p.passengerId];
                        const initials = p.passengerName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
                        const statusColor = p.status === "onboard" ? "#4caf50" :
                          p.status === "at_pickup" ? "#ff9800" : colors.primary;
                        const statusLabel = p.status === "en_route" ? "En route" :
                          p.status === "at_pickup" ? "Waiting" :
                          p.status === "onboard" ? "Onboard" : "Done";
                        return (
                          <Pressable
                            key={p.passengerId}
                            style={[
                              styles.passengerCard,
                              { borderColor: isSelected ? colors.primary : colors.outlineVariant, borderWidth: isSelected ? 2 : 1 },
                            ]}
                            onPress={() => setSelectedPassengerIndex(i)}
                          >
                            <View style={styles.passengerCardHeader}>
                              <View style={[styles.passengerCardAvatar, { backgroundColor: `hsl(${i * 80 + 10}, 55%, 45%)` }]}>
                                <Text style={[styles.passengerCardAvatarText, { fontFamily: "Sora_800ExtraBold" }]}>{initials}</Text>
                              </View>
                              <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                  <Text style={[styles.passengerCardName, { color: colors.onSurface, fontFamily: "Inter_600SemiBold" }]} numberOfLines={1}>
                                    {p.passengerName}
                                  </Text>
                                  <Text style={{ fontSize: 11, color: colors.primary, fontFamily: "Inter_500Medium" }}>★{p.passengerRating.toFixed(1)}</Text>
                                </View>
                                <Text style={[styles.passengerCardRoute, { color: colors.onSurfaceVariant, fontFamily: "Inter_400Regular" }]} numberOfLines={1}>
                                  {p.pickup.name} → {p.dropoff.name} · ₱{p.total.toFixed(2)}
                                </Text>
                              </View>
                              <View style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}>
                                <View style={[styles.statusDotMini, { backgroundColor: statusColor }]} />
                                <Text style={[styles.statusText, { color: statusColor, fontFamily: "Inter_600SemiBold" }]}>{statusLabel}</Text>
                              </View>
                              <Pressable
                                onPress={() => { setChatPassengerName(p.passengerName); setShowChat(true); }}
                                hitSlop={8}
                                style={[styles.chatIconBtn, { backgroundColor: colors.surfaceVariant }]}
                              >
                                <Feather name="message-circle" size={14} color={colors.primary} />
                              </Pressable>
                            </View>
                            {p.status === "en_route" && (
                              <View style={styles.passengerCardActions}>
                                <Feather name="map-pin" size={12} color={colors.onSurfaceVariant} />
                                <Text style={[styles.infoLabel, { color: colors.onSurfaceVariant, fontFamily: "Inter_400Regular", flex: 1 }]} numberOfLines={1}>
                                  Pickup at {p.pickup.name}
                                </Text>
                                <Pressable style={[styles.actionBtn, { backgroundColor: colors.primary }]} onPress={() => handleArrived(p.passengerId)}>
                                  <Feather name="check" size={13} color="#fff" />
                                  <Text style={styles.actionBtnText}>Arrived</Text>
                                </Pressable>
                              </View>
                            )}
                            {p.status === "at_pickup" && (
                              <View style={styles.passengerCardActions}>
                                {timer != null && timer > 0 ? (
                                  <View style={[styles.timerBadge, { backgroundColor: timer > 30 ? "#4caf50" : timer > 10 ? "#ff9800" : colors.errorContainer }]}>
                                    <Text style={[styles.timerText, { color: timer > 30 ? "#fff" : timer > 10 ? "#fff" : colors.error, fontFamily: "Sora_800ExtraBold" }]}>{timer}s</Text>
                                  </View>
                                ) : (
                                  <Pressable style={[styles.noShowBtn, { backgroundColor: colors.error }]} onPress={() => handleNoShow(p.passengerId)}>
                                    <Text style={[styles.noShowText, { color: "#fff", fontFamily: "Inter_600SemiBold" }]}>No-Show</Text>
                                  </Pressable>
                                )}
                                <View style={{ flex: 1 }} />
                                <Pressable style={[styles.actionBtn, { backgroundColor: colors.primary }]} onPress={() => handleStartTrip(p.passengerId)}>
                                  <Feather name="user-check" size={13} color="#fff" />
                                  <Text style={styles.actionBtnText}>Start Trip</Text>
                                </Pressable>
                              </View>
                            )}
                            {p.status === "onboard" && (
                              <View style={styles.passengerCardActions}>
                                <Feather name="navigation" size={12} color={colors.onSurfaceVariant} />
                                <Text style={[styles.infoLabel, { color: colors.onSurfaceVariant, fontFamily: "Inter_400Regular", flex: 1 }]} numberOfLines={1}>
                                  Dropoff at {p.dropoff.name}
                                </Text>
                                <Pressable style={[styles.actionBtn, { backgroundColor: colors.tertiary }]} onPress={() => handleDropOff(p.passengerId)}>
                                  <Feather name="flag" size={13} color="#fff" />
                                  <Text style={styles.actionBtnText}>Drop Off</Text>
                                </Pressable>
                              </View>
                            )}
                          </Pressable>
                        );
                      })}
                    </View>
                  ) : (
                    <Pressable style={[styles.cancelBtnSmall, { borderColor: colors.error }]} onPress={handleConfirmCancel}>
                      <Feather name="x" size={14} color={colors.error} />
                      <Text style={[styles.cancelBtnText, { color: colors.error }]}>End Route</Text>
                    </Pressable>
                  )}
                </>
              )}
            </>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 10, paddingHorizontal: 16, gap: 8 },

  destBar: { flexDirection: "row", alignItems: "center", borderRadius: 14, padding: 10, paddingLeft: 16, gap: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 },
  destDot: { width: 8, height: 8, borderRadius: 4 },
  destInput: { flex: 1, fontSize: 14, minHeight: 34 },
  searchBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },

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
  declineBtn: { flex: 1, borderRadius: 12 },
  acceptBtn: { flex: 2, borderRadius: 12 },
  navChatBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  timerBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  timerText: { fontSize: 16 },
  noShowBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  noShowText: { fontSize: 12 },
  infoBar: { position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 5, paddingHorizontal: 20, paddingTop: 16, gap: 12, borderTopLeftRadius: 20, borderTopRightRadius: 20, shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 10 },
  infoLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  infoValue: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  errorBanner: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 12 },
  errorBannerText: { flex: 1, fontSize: 13 },
  actionRow: { flexDirection: "row", gap: 10 },
  cancelBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, height: 44, borderRadius: 12, borderWidth: 1.5 },
  cancelBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  arrivedBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, height: 44, borderRadius: 12 },
  arrivedBtnText: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
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

  passengerCard: {
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.97)",
    padding: 12,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  passengerCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  passengerCardAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  passengerCardAvatarText: {
    color: "#fff",
    fontSize: 13,
  },
  passengerCardName: {
    fontSize: 14,
    marginBottom: 2,
  },
  passengerCardRoute: {
    fontSize: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
  },
  passengerCardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
  },
  actionBtnText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  cancelBtnSmall: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 36,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  statusDotMini: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  chatIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  wazeNav: {
    position: "absolute",
    left: 12,
    right: 12,
    zIndex: 50,
    borderRadius: 12,
    padding: 10,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 2,
    borderColor: "rgba(0,0,0,0.2)",
  },
  wazeNavBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  wazeNavIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  wazeNavText: {
    flex: 1,
  },
  wazeNavDist: {
    fontSize: 20,
    color: "#fff",
    fontFamily: "Sora_800ExtraBold",
    letterSpacing: -0.5,
  },
  wazeNavInst: {
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    fontFamily: "Inter_600SemiBold",
  },
  wazeNavDots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  wazeNavDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  wazeNavClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  wazeBentoRow: {
    flexDirection: "row",
    gap: 8,
  },
  wazeBentoBox: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    gap: 4,
  },
  wazeBentoValue: {
    fontSize: 20,
  },
  wazeBentoLabel: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
  },
  destIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  destIndicatorText: {
    fontSize: 12,
  },
});
