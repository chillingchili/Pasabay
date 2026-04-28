import React, { useEffect, useRef, useState } from "react";
import { Animated, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { RealMap } from "@/components/RealMap";
import { PreMatchModal } from "@/components/PreMatchModal";
import LoadingOverlay from "@/components/LoadingOverlay";
import { useColors } from "@/hooks/useColors";
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
  "JY Square": { lat: 10.3188, lng: 123.9078 },
  "Mango Square": { lat: 10.3090, lng: 123.8993 },
};

export default function PassengerHomeScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { fs, isSmall } = useScale();
  const dimensions = useWindowDimensions();
  const { user, driverLocation, switchRole, activeRide } = useApp();
  const { location: userLoc } = useLocation();
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
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const sheetAnim = useRef(new Animated.Value(0)).current;

  const topPad = Platform.OS === "web" ? Math.min(dimensions.width * 0.17, 67) : insets.top;
  const bottomPad = Platform.OS === "web" ? Math.max(insets.bottom + 80, 100) : Math.max(insets.bottom + 100, 100);

  const pickupPoint = userLoc ? { lat: userLoc.lat, lng: userLoc.lng, name: "Your location" } : null;
  const destCoords = destination ? DEST_COORDS[destination] ?? null : null;
  const dropoffPoint = destCoords ? { lat: destCoords.lat, lng: destCoords.lng, name: destination } : null;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.8, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    );
    pulse.start();
    Animated.spring(sheetAnim, { toValue: 1, tension: 50, friction: 10, useNativeDriver: true }).start();
    return () => pulse.stop();
  }, [pulseAnim, sheetAnim]);

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
        const fare = Math.max(15, Math.round(dist * 5.5 + 8));
        setFareEstimate(fare);
      } else {
        const dist = haversineKm(pickupPoint, dropoffPoint);
        setDistanceKm(dist);
        setEtaMin(Math.round(dist * 3));
        const fare = Math.max(15, Math.round(dist * 5.5 + 8));
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

      <View style={[styles.topArea, { paddingTop: topPad + 8 }]}>
        <View style={styles.greetingRow}>
          <Text style={[styles.greeting, { fontFamily: "Inter_600SemiBold" }]}>{greeting} 👋</Text>
          {(user?.driverVerified || user?.driverStatus || user?.vehicle) && (
            <Pressable
              style={[styles.roleSwitchBtn, { backgroundColor: colors.primary }]}
              onPress={() => { switchRole("driver"); router.replace("/(main)/driver-home"); }}
            >
              <Feather name="truck" size={13} color="#fff" />
              <Text style={[styles.roleSwitchText, { fontFamily: "Inter_500Medium" }]}>Drive</Text>
            </Pressable>
          )}
        </View>

        <View style={[styles.searchContainer, { backgroundColor: "rgba(255,255,255,0.97)" }]}>
          <View style={[styles.searchDot, { backgroundColor: colors.primary }]} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
            value={destination}
            onChangeText={setDestination}
            placeholder="Where are you headed?"
            placeholderTextColor={colors.textSecondary}
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
                <Text style={[styles.suggestionText, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>{d}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <Animated.View
        onLayout={(e) => setSheetContentHeight(e.nativeEvent.layout.height)}
        style={[
          styles.bottomSheet,
          {
            backgroundColor: "rgba(255,255,255,0.97)",
            paddingBottom: bottomPad,
            maxHeight: Platform.OS === "web" ? dimensions.height * 0.55 : undefined,
            transform: [{ translateY: sheetAnim.interpolate({ inputRange: [0, 1], outputRange: [200, 0] }) }],
          },
        ]}
      >
        <View style={[styles.handle, { backgroundColor: colors.border }]} />

        <ScrollView style={styles.sheetScroll} contentContainerStyle={styles.sheetScrollContent} showsVerticalScrollIndicator={false} bounces={false}>
        {activeRide ? (
          <>
            <View style={styles.destRow}>
              <View style={[styles.destIcon, { backgroundColor: colors.primaryLight }]}>
                <Feather name="map-pin" size={16} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.destLabel, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>Your driver is coming</Text>
                <Text style={[styles.destValue, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{activeRide.driver.name}</Text>
              </View>
            </View>

            <View style={[styles.walkCard, { backgroundColor: colors.accentBg, marginBottom: 14 }]}>
              <Feather name="navigation" size={16} color={colors.accentDark} />
              <Text style={[styles.walkText, { color: colors.accentDark, fontFamily: "Inter_500Medium" }]}>
                {walkToPickupM > 0
                  ? `${walkToPickupM < 1000 ? `${walkToPickupM}m` : `${(walkToPickupM / 1000).toFixed(1)}km`} walk to pickup point`
                  : activeRide.distanceKm > 0
                    ? `${activeRide.distanceKm.toFixed(1)}km ride`
                    : "Calculating walking distance..."}
              </Text>
            </View>

            <View style={styles.statChips}>
              <StatChip label="Vehicle" value={activeRide.driver.vehicle ? `${activeRide.driver.vehicle.make} ${activeRide.driver.vehicle.model}` : "Not specified"} colors={colors} />
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <StatChip label="Fare" value={`₱${activeRide.total.toFixed(0)}`} colors={colors} />
            </View>
          </>
        ) : destination ? (
          <>
            <View style={styles.destRow}>
              <View style={[styles.destIcon, { backgroundColor: colors.primaryLight }]}>
                <Feather name="map-pin" size={16} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.destLabel, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>Drop-off</Text>
                <Text style={[styles.destValue, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{destination}</Text>
              </View>
              <View style={[styles.fareChip, { backgroundColor: colors.accentBg }]}>
                <Text style={[styles.fareLabel, { color: colors.accentDark, fontFamily: "Inter_400Regular" }]}>fare</Text>
                <Text style={[styles.fareAmount, { color: colors.accentDark, fontFamily: "Inter_700Bold" }]}>₱{fareEstimate}</Text>
              </View>
            </View>

            <View style={styles.statChips}>
              <StatChip label="Distance" value={`${distanceKm.toFixed(1)} km`} colors={colors} />
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <StatChip label="Walk" value="~4 min" colors={colors} />
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <StatChip label="ETA" value={`~${etaMin} min`} colors={colors} />
            </View>

            <Pressable
              style={({ pressed }) => [styles.findBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
              onPress={handleFindRide}
            >
              <Feather name="search" size={18} color="#fff" />
              <Text style={[styles.findBtnText, { fontFamily: "Inter_600SemiBold" }]}>Find a pasabay</Text>
            </Pressable>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>Enter a destination to find a ride</Text>
          </View>
        )}
        </ScrollView>
      </Animated.View>

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

function StatChip({ label, value, colors }: { label: string; value: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={styles.statChip}>
      <Text style={[styles.statLabel, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>{label}</Text>
      <Text style={[styles.statValue, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topArea: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 10, paddingHorizontal: 16, gap: 8 },
  greetingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 2 },
  greeting: { fontSize: 15, color: "#fff" },
  roleSwitchBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  roleSwitchText: { fontSize: 12, color: "#fff" },
  searchContainer: { flexDirection: "row", alignItems: "center", borderRadius: 14, padding: 10, paddingLeft: 16, gap: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 },
  searchDot: { width: 8, height: 8, borderRadius: 4 },
  searchInput: { flex: 1, fontSize: 14, minHeight: 34 },
  searchBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  suggestions: { borderRadius: 12, overflow: "hidden", zIndex: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 5 },
  suggestionItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f5f5f5" },
  suggestionText: { fontSize: 14 },
  bottomSheet: { position: "absolute", bottom: 0, left: 0, right: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingTop: 0, shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 10, maxHeight: "65%" },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginTop: 12, marginBottom: 16 },
  sheetScroll: { flex: 1 },
  sheetScrollContent: { paddingBottom: 20 },
  destRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  destIcon: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  destLabel: { fontSize: 11, marginBottom: 2 },
  destValue: { fontSize: 15 },
  fareChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  fareLabel: { fontSize: 10 },
  fareAmount: { fontSize: 14 },
  statChips: { flexDirection: "row", backgroundColor: "#f7f7f7", borderRadius: 12, padding: 12, marginBottom: 14, alignItems: "center" },
  statChip: { flex: 1, alignItems: "center" },
  statLabel: { fontSize: 10, marginBottom: 3 },
  statValue: { fontSize: 14 },
  statDivider: { width: 1, height: 28 },
  findBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", height: 52, borderRadius: 14, gap: 8 },
  findBtnText: { color: "#fff", fontSize: 16 },
  walkCard: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, padding: 10 },
  walkText: { fontSize: 13, flex: 1 },
  emptyState: { paddingVertical: 20, alignItems: "center" },
  emptyText: { fontSize: 14 },
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
