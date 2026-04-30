import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { RealMap } from "@/components/RealMap";
import { PreMatchModal } from "@/components/PreMatchModal";
import LoadingOverlay from "@/components/LoadingOverlay";
import { useTheme } from "react-native-paper";
import { Button, Surface } from "react-native-paper";
import { useLocation } from "@/hooks/useLocation";
import { useApp } from "@/context/AppContext";
import { getRoute } from "@/lib/osrm";
import { getWalkingRoute } from "@/lib/osrm";
import { haversineKm } from "@/lib/osrm";
import { useScale } from "@/hooks/useScale";
import { useWindowDimensions } from "react-native";

const QUICK_DESTINATIONS = ["USC Talamban", "IT Park, Lahug", "SM City Cebu", "Ayala Center", "JY Square", "Mango Square"];

const DEST_COORDS: Record<string, { lat: number; lng: number }> = {
  "USC Talamban": { lat: 10.3535, lng: 123.9135 },
  "IT Park, Lahug": { lat: 10.3308, lng: 123.9068 },
  "SM City Cebu": { lat: 10.3112, lng: 123.9172 },
  "Ayala Center": { lat: 10.3173, lng: 123.9046 },
  "JY Square": { lat: 10.3307, lng: 123.8965 },
  "Mango Square": { lat: 10.3111, lng: 123.8961 },
};

export default function PassengerHomeScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { fs, isSmall } = useScale();
  const dimensions = useWindowDimensions();
  const { user, driverLocation, switchRole, activeRide } = useApp();
  const { location: userLoc, locationError } = useLocation();
  const [destination, setDestination] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showPreMatch, setShowPreMatch] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [routePolyline, setRoutePolyline] = useState<{ lat: number; lng: number }[] | null>(null);
  const [walkingPolyline, setWalkingPolyline] = useState<{ lat: number; lng: number }[] | null>(null);
  const [fareEstimate, setFareEstimate] = useState(0);
  const [distanceKm, setDistanceKm] = useState(0);
  const [etaMin, setEtaMin] = useState(0);
  const [walkToPickupM, setWalkToPickupM] = useState(0);
  const [recenterKey, setRecenterKey] = useState(0);
  const [fitRouteKey, setFitRouteKey] = useState(0);
  const [showRecenter, setShowRecenter] = useState(false);
  const [sheetContentHeight, setSheetContentHeight] = useState(0);
  const [showFare, setShowFare] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const FUEL_PRICE = 65;
  const DEF_FUEL_EFF = 20;
  const MATCHING_FEE = 8;
  const eff = activeRide?.driver.vehicle?.fuelEfficiency ?? DEF_FUEL_EFF;
  const fuelCost = distanceKm * FUEL_PRICE / eff;
  const totalFare = Math.max(15, Math.round(fuelCost + MATCHING_FEE));

  const topPad = Platform.OS === "web" ? Math.min(dimensions.width * 0.17, 67) : insets.top;

  const pickupPoint = useMemo(() =>
    userLoc ? { lat: userLoc.lat, lng: userLoc.lng, name: "Your location" } : null,
    [userLoc?.lat, userLoc?.lng]
  );
  const destCoords = useMemo(() =>
    destination ? DEST_COORDS[destination] ?? null : null,
    [destination]
  );
  const dropoffPoint = useMemo(() =>
    destCoords ? { lat: destCoords.lat, lng: destCoords.lng, name: destination } : null,
    [destCoords?.lat, destCoords?.lng, destination]
  );

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.8, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  // Fit the map to show the full route ONCE when destination changes
  // (NOT when pickup changes, which happens on every GPS update)
  useEffect(() => {
    if (!destination) return;
    setFitRouteKey((k) => k + 1);
  }, [destination]);

  useEffect(() => {
    if (!pickupPoint || !dropoffPoint) {
      setRoutePolyline(null);
      setFareEstimate(0);
      setDistanceKm(0);
      setEtaMin(0);
      return;
    }

    let cancelled = false;
    const fetchRoute = async () => {
      const route = await getRoute(pickupPoint, dropoffPoint);
      if (cancelled) return;
      if (route) {
        setRoutePolyline(route.polyline);
        const dist = route.distanceKm;
        setDistanceKm(dist);
        setEtaMin(Math.round(route.durationSec / 60));
        const fare = Math.max(15, Math.round(dist * 65 / 20 + 8));
        setFareEstimate(fare);
      } else {
        const dist = haversineKm(pickupPoint, dropoffPoint);
        setDistanceKm(dist);
        setEtaMin(Math.round(dist * 3));
        const fare = Math.max(15, Math.round(dist * 65 / 20 + 8));
        setFareEstimate(fare);
      }
    };
    fetchRoute();
    return () => { cancelled = true; };
  }, [destination, pickupPoint, dropoffPoint]);

  useEffect(() => {
    if (!userLoc || !activeRide?.pickup) {
      setWalkingPolyline(null);
      setWalkToPickupM(0);
      return;
    }
    let cancelled = false;
    const fetch = async () => {
      try {
        const walk = await getWalkingRoute(userLoc, activeRide.pickup);
        if (cancelled) return;
        if (walk) {
          setWalkingPolyline(walk.polyline);
          setWalkToPickupM(Math.round(walk.distanceKm * 1000));
        } else {
          const dist = haversineKm(userLoc, activeRide.pickup);
          setWalkToPickupM(Math.round(dist * 1000));
        }
      } catch {
        if (cancelled) return;
        const dist = haversineKm(userLoc, activeRide.pickup);
        setWalkToPickupM(Math.round(dist * 1000));
      }
    };
    fetch();
    return () => { cancelled = true; };
  }, [userLoc, activeRide?.pickup]);

  const handleFindRide = () => {
    if (!destination) return;
    setShowPreMatch(true);
  };

  const handleConfirmRide = () => {
    setShowPreMatch(false);
    setIsLoading(true);
    const pickup = pickupPoint ?? { lat: 10.2969, lng: 123.9008 };
    const dropoff = dropoffPoint ?? { lat: 10.3535, lng: 123.9135 };
    router.push({
      pathname: "/(main)/matching",
      params: {
        destination,
        pickupLat: String(pickup.lat),
        pickupLng: String(pickup.lng),
        dropoffLat: String(dropoff.lat),
        dropoffLng: String(dropoff.lng),
        pickupName: pickupPoint?.name ?? "USC Main Gate",
        dropoffName: destination,
      },
    });
    setTimeout(() => setIsLoading(false), 1000);
  };

  const handleCancelRide = () => {
    setShowPreMatch(false);
  };

  const greeting = user?.name ? `Hi, ${user.name.split(" ")[0]}` : "Hi there";

  return (
    <View style={styles.container}>
      {locationError && (
        <View style={{ position: "absolute", top: 60, left: 16, right: 16, zIndex: 100, backgroundColor: "rgba(255, 68, 68, 0.95)", padding: 12, borderRadius: 10 }}>
          <Text style={{ color: "#fff", fontSize: 13, textAlign: "center", fontFamily: "Inter_500Medium" }}>
            {locationError}
          </Text>
        </View>
      )}
      <RealMap
        showRoute={!!routePolyline}
        routePolyline={routePolyline ?? undefined}
        pickupPoint={pickupPoint ?? undefined}
        dropoffPoint={dropoffPoint ?? undefined}
        userLocation={userLoc ?? undefined}
        driverLocation={driverLocation ?? undefined}
        fitRouteKey={fitRouteKey}
        recenterKey={recenterKey}
        onUserDrag={() => setShowRecenter(true)}
        bottomInset={sheetContentHeight}
      />
      <LoadingOverlay visible={isLoading} message="Navigating..." />

      {showRecenter && (
        <Pressable
          style={[styles.recenterBtn, { backgroundColor: colors.primary, bottom: Math.max(sheetContentHeight + 12, 180) }]}
          onPress={() => { setShowRecenter(false); setRecenterKey(k => k + 1); }}
        >
          <Feather name="navigation" size={20} color="#fff" />
        </Pressable>
      )}

      <View style={[styles.topArea, { paddingTop: topPad - 4 }]}>
        <View style={styles.greetingRow}>
          {user?.role === "driver" ? (
            <Pressable
              style={[styles.roleSwitchBtn, { backgroundColor: colors.primary }]}
              onPress={() => { switchRole("driver"); router.replace("/(main)/driver-home"); }}
            >
              <Feather name="refresh-cw" size={12} color="#fff" />
              <Text style={[styles.roleSwitchText, { fontFamily: "Inter_500Medium" }]}>Switch to Driver</Text>
            </Pressable>
          ) : (
            <Pressable
              style={[styles.roleSwitchBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/vehicle-details")}
            >
              <Feather name="truck" size={12} color="#fff" />
              <Text style={[styles.roleSwitchText, { fontFamily: "Inter_500Medium" }]}>Become a driver</Text>
            </Pressable>
          )}
        </View>

        <View style={[styles.searchContainer, { backgroundColor: "rgba(255,255,255,0.97)" }]}>
          <View style={[styles.searchDot, { backgroundColor: colors.primary }]} />
          <TextInput
            style={[styles.searchInput, { color: colors.onSurface, fontFamily: "Inter_400Regular" }]}
            value={destination}
            onChangeText={setDestination}
            placeholder="Where are you headed?"
            placeholderTextColor={colors.onSurfaceVariant}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          />
          <Pressable style={[styles.searchBtn, { backgroundColor: colors.primary }]}>
            <Feather name="search" size={16} color="#fff" />
          </Pressable>
        </View>

        {showSuggestions && (
          <View style={[styles.suggestions, { backgroundColor: "#fff" }]}>
            {QUICK_DESTINATIONS.filter(d => d.toLowerCase().includes(destination.toLowerCase()) && d !== destination).map(d => (
              <Pressable
                key={d}
                style={styles.suggestionItem}
                onPress={() => { setDestination(d); setShowSuggestions(false); }}
              >
                <Feather name="map-pin" size={14} color={colors.primary} />
                <Text style={[styles.suggestionText, { color: colors.onSurface, fontFamily: "Inter_400Regular" }]}>{d}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {destination && !activeRide && (
        <View
          onLayout={(e) => setSheetContentHeight(e.nativeEvent.layout.height)}
          style={[styles.sheetOuter, { paddingBottom: Math.max(insets.bottom + 16, 24) + 60, backgroundColor: "rgba(255,255,255,0.97)" }]}
        >
          <View style={styles.sheetInner}>
            <View style={styles.routeRow}>
              <View style={[styles.routeIcon, { backgroundColor: colors.primaryContainer }]}>
                <Feather name="map-pin" size={16} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.infoLabel, { color: colors.onSurfaceVariant }]}>Drop-off</Text>
                <Text style={[styles.infoValue, { color: colors.onSurface }]}>{destination}</Text>
              </View>
              <View style={[styles.fareChip, { backgroundColor: colors.tertiaryContainer }]}>
                <Text style={[styles.fareLabel, { color: colors.onTertiaryContainer }]}>{activeRide ? "fare" : "est"}</Text>
                <Text style={[styles.fareAmount, { color: colors.onTertiaryContainer }]}>₱{totalFare}</Text>
              </View>
            </View>

            <View style={styles.routeMeta}>
              <View style={styles.metaBlock}>
                <Feather name="maximize" size={12} color={colors.onSurfaceVariant} />
                <Text style={[styles.metaText, { color: colors.onSurface }]}>{distanceKm.toFixed(1)} km</Text>
              </View>
              <View style={styles.metaBlock}>
                <Feather name="clock" size={12} color={colors.onSurfaceVariant} />
                <Text style={[styles.metaText, { color: colors.onSurface }]}>{etaMin} min</Text>
              </View>
            </View>

            <Pressable onPress={() => setShowFare(!showFare)} style={styles.fareToggle}>
              <Text style={[styles.fareToggleText, { color: colors.primary, fontFamily: "Inter_500Medium" }]}>
                {showFare ? "Hide fare breakdown" : "Show fare breakdown"}
              </Text>
              <Feather name={showFare ? "chevron-up" : "chevron-down"} size={14} color={colors.primary} />
            </Pressable>

            {showFare && (
              <>
                <View style={[styles.fareDivider, { backgroundColor: colors.outline }]} />
                <Text style={[styles.fareTitle, { color: colors.onSurfaceVariant, fontFamily: "Inter_600SemiBold" }]}>Estimated fare</Text>
                <View style={styles.fareRow}>
                  <Text style={[styles.fareRowLabel, { color: colors.onSurfaceVariant, fontFamily: "Inter_400Regular" }]}>Fuel ({distanceKm.toFixed(1)}km × ₱{FUEL_PRICE}/L ÷ {eff}km/L)</Text>
                  <Text style={[styles.fareRowValue, { color: colors.onSurface, fontFamily: "Inter_400Regular" }]}>₱{fuelCost.toFixed(2)}</Text>
                </View>
                <View style={styles.fareRow}>
                  <Text style={[styles.fareRowLabel, { color: colors.onSurfaceVariant, fontFamily: "Inter_400Regular" }]}>Matching fee</Text>
                  <Text style={[styles.fareRowValue, { color: colors.onSurface, fontFamily: "Inter_400Regular" }]}>₱{MATCHING_FEE.toFixed(2)}</Text>
                </View>
                <View style={[styles.fareTotalRow, { borderTopColor: colors.outline }]}>
                  <Text style={[styles.fareRowLabel, { color: colors.onSurface, fontFamily: "Inter_600SemiBold" }]}>Total</Text>
                  <Text style={[styles.fareRowValue, { color: colors.onSurface, fontFamily: "Sora_800ExtraBold" }]}>₱{totalFare.toFixed(2)}</Text>
                </View>
              </>
            )}

            <Button
              mode="contained"
              buttonColor={colors.primary}
              textColor={colors.onPrimary}
              onPress={handleFindRide}
              style={{ borderRadius: 14 }}
              contentStyle={{ height: 50 }}
              labelStyle={{ fontFamily: "Inter_600SemiBold", fontSize: 16 }}
              icon={() => <Feather name="search" size={16} color={colors.onPrimary} />}
            >
              Find a Pasabay
            </Button>
          </View>
        </View>
      )}

      {activeRide && (
        <View
          onLayout={(e) => setSheetContentHeight(e.nativeEvent.layout.height)}
          style={[styles.sheetOuter, { paddingBottom: Math.max(insets.bottom + 16, 24) + 60, backgroundColor: "rgba(255,255,255,0.97)" }]}
        >
          <View style={styles.sheetInner}>
            <View style={styles.routeRow}>
              <View style={[styles.routeIcon, { backgroundColor: colors.primaryContainer }]}>
                <Feather name="navigation" size={16} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.infoLabel, { color: colors.onSurfaceVariant }]}>Your driver is coming</Text>
                <Text style={[styles.infoValue, { color: colors.onSurface }]}>{activeRide.driver.name}</Text>
              </View>
            </View>
            <View style={styles.routeMeta}>
              <View style={styles.metaBlock}>
                <Feather name="truck" size={12} color={colors.onSurfaceVariant} />
                <Text style={[styles.metaText, { color: colors.onSurface }]}>
                  {activeRide.driver.vehicle ? `${activeRide.driver.vehicle.make} ${activeRide.driver.vehicle.model}` : "—"}
                </Text>
              </View>
              <View style={styles.metaBlock}>
                <Feather name="dollar-sign" size={12} color={colors.onSurfaceVariant} />
                <Text style={[styles.metaText, { color: colors.onSurface }]}>₱{activeRide.total.toFixed(0)}</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      <PreMatchModal
        visible={showPreMatch}
        destination={destination}
        fareEstimate={fareEstimate}
        distanceKm={distanceKm}
        etaMin={etaMin}
        onConfirm={handleConfirmRide}
        onCancel={handleCancelRide}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topArea: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 10, paddingHorizontal: 16, gap: 8 },
  greetingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 2 },
  roleSwitchBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  roleSwitchText: { fontSize: 12, color: "#fff", textShadowColor: "rgba(0,0,0,0.75)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  searchContainer: { flexDirection: "row", alignItems: "center", borderRadius: 14, padding: 10, paddingLeft: 16, gap: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 },
  searchDot: { width: 8, height: 8, borderRadius: 4 },
  searchInput: { flex: 1, fontSize: 14, minHeight: 34 },
  searchBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  suggestions: { borderRadius: 12, overflow: "hidden", zIndex: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 5 },
  suggestionItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f5f5f5" },
  suggestionText: { fontSize: 14 },
  fareChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  fareLabel: { fontSize: 10 },
  fareAmount: { fontSize: 14 },
  sheetOuter: { position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 5, borderTopLeftRadius: 20, borderTopRightRadius: 20, shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 10 },
  sheetInner: { paddingHorizontal: 20, paddingTop: 16, gap: 10 },
  fareToggle: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 4 },
  fareToggleText: { fontSize: 12 },
  infoLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  infoValue: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  routeRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  routeIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  routeMeta: { flexDirection: "row", gap: 20, paddingLeft: 46 },
  metaBlock: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  fareDivider: { height: 1, marginTop: 4 },
  fareTitle: { fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 },
  fareRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  fareRowLabel: { fontSize: 13 },
  fareRowValue: { fontSize: 13 },
  fareTotalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, paddingTop: 8 },
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
});
