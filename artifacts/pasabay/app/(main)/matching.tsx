import React, { useEffect, useRef, useState } from "react";
import { Animated, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { apiRequest, formatApiError } from "@/lib/api";
import { onMatchDeclined } from "@/lib/socket";
import LoadingOverlay from "@/components/LoadingOverlay";
import ErrorBanner from "@/components/ErrorBanner";

export default function MatchingScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { matchConfirmed, clearMatchConfirmed } = useApp();
  const params = useLocalSearchParams<{
    destination?: string;
    pickupLat?: string; pickupLng?: string;
    dropoffLat?: string; dropoffLng?: string;
    pickupName?: string; dropoffName?: string;
  }>();

  const [searching, setSearching] = useState(true);
  const [status, setStatus] = useState("Looking for a driver on your route…");
  const [fareEst, setFareEst] = useState<number | null>(null);
  const [distEst, setDistEst] = useState<number | null>(null);
  const [etaEst, setEtaEst] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const didNavigate = useRef(false);

  const ring1 = useRef(new Animated.Value(1)).current;
  const ring2 = useRef(new Animated.Value(1)).current;
  const ring3 = useRef(new Animated.Value(1)).current;
  const dot1 = useRef(new Animated.Value(0.4)).current;
  const dot2 = useRef(new Animated.Value(0.4)).current;
  const dot3 = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const createRingAnim = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 2.2, duration: 1400, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 1, duration: 0, useNativeDriver: true }),
        ])
      );
    const a1 = createRingAnim(ring1, 0);
    const a2 = createRingAnim(ring2, 400);
    const a3 = createRingAnim(ring3, 800);
    a1.start(); a2.start(); a3.start();

    const createDot = (d: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(d, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(d, { toValue: 0.4, duration: 300, useNativeDriver: true }),
          Animated.delay(600),
        ])
      );
    const d1 = createDot(dot1, 0);
    const d2 = createDot(dot2, 200);
    const d3 = createDot(dot3, 400);
    d1.start(); d2.start(); d3.start();

    return () => {
      a1.stop(); a2.stop(); a3.stop();
      d1.stop(); d2.stop(); d3.stop();
    };
  }, [ring1, ring2, ring3, dot1, dot2, dot3]);

  useEffect(() => {
    const searchForDriver = async () => {
      try {
        const pickupLat = parseFloat(params.pickupLat ?? "10.2969");
        const pickupLng = parseFloat(params.pickupLng ?? "123.9008");
        const dropoffLat = parseFloat(params.dropoffLat ?? "10.3157");
        const dropoffLng = parseFloat(params.dropoffLng ?? "123.9030");
        const pickupName = params.pickupName ?? "USC Main Gate";
        const dropoffName = params.dropoffName ?? params.destination ?? "IT Park, Lahug";

        const result = await apiRequest<any>("/rides/request", {
          method: "POST",
          body: JSON.stringify({ pickupLat, pickupLng, dropoffLat, dropoffLng, pickupName, dropoffName }),
        });

        setIsLoading(false);

        if (!result.matched) {
          setStatus(result.message ?? "No drivers found. Try again in a moment.");
          setSearching(false);
          setTimeout(() => {
            if (!didNavigate.current) router.back();
          }, 3000);
          return;
        }

        setFareEst(result.total ?? result.fare);
        setDistEst(result.distanceKm);
        setEtaEst(result.pickupEtaMin);
        setStatus("Driver found! Waiting for confirmation…");
      } catch (err: any) {
        setIsLoading(false);
        setErrorMessage(formatApiError(err));
        setShowError(true);
        setStatus("Connection error. Please try again.");
        setSearching(false);
        setTimeout(() => {
          if (!didNavigate.current) router.back();
        }, 2500);
      }
    };
    searchForDriver();
  }, []);

  useEffect(() => {
    if (matchConfirmed && !didNavigate.current) {
      didNavigate.current = true;
      router.replace("/(main)/match-found");
    }
  }, [matchConfirmed]);

  useEffect(() => {
    const off = onMatchDeclined(() => {
      setStatus("Driver declined. Searching for another driver…");
      setFareEst(null);
      setDistEst(null);
      setEtaEst(null);
    });
    return off;
  }, []);

  const handleCancel = () => {
    didNavigate.current = true;
    clearMatchConfirmed();
    router.back();
  };

  const destination = params.dropoffName ?? params.destination ?? "your destination";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LoadingOverlay visible={isLoading} message="Searching for drivers..." />
      <ErrorBanner
        message={errorMessage}
        visible={showError}
        onDismiss={() => setShowError(false)}
      />
      <View style={[styles.content, { paddingTop: (Platform.OS === "web" ? 67 : insets.top) + 40 }]}>
        <View style={styles.ringsContainer}>
          {[ring1, ring2, ring3].map((r, i) => (
            <Animated.View
              key={i}
              style={[
                styles.ring,
                {
                  borderColor: `${colors.primary}${i === 0 ? "30" : i === 1 ? "20" : "10"}`,
                  transform: [{ scale: r }],
                  opacity: r.interpolate({ inputRange: [1, 2.2], outputRange: [0.6, 0] }),
                },
              ]}
            />
          ))}
          <View style={[styles.centerIcon, { backgroundColor: colors.primary }]}>
            <Feather name="navigation-2" size={28} color="#fff" />
          </View>
        </View>

        <Text style={[styles.mainText, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
          {status}
        </Text>
        <Text style={[styles.subText, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
          Heading to{"\n"}
          <Text style={[styles.destHighlight, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{destination}</Text>
        </Text>

        <View style={styles.dots}>
          {[dot1, dot2, dot3].map((d, i) => (
            <Animated.View key={i} style={[styles.dot, { backgroundColor: colors.primary, opacity: d }]} />
          ))}
        </View>

        {fareEst !== null && (
          <View style={[styles.fareCard, { backgroundColor: colors.card }]}>
            <View style={styles.fareCardHeader}>
              <Text style={[styles.fareCardLabel, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>Estimated fare</Text>
              <View style={[styles.farePill, { backgroundColor: colors.accentBg }]}>
                <Text style={[styles.farePillText, { color: colors.accentDark, fontFamily: "Inter_700Bold" }]}>₱{fareEst.toFixed(0)}</Text>
              </View>
            </View>
            <View style={styles.fareStats}>
              <FareStat label="Distance" value={`${distEst?.toFixed(1) ?? "–"} km`} colors={colors} />
              <View style={[styles.fareStatDivider, { backgroundColor: colors.border }]} />
              <FareStat label="Pickup ETA" value={`~${etaEst ?? "–"} min`} colors={colors} />
            </View>
          </View>
        )}
      </View>

      <View style={[styles.bottom, { paddingBottom: Math.max(insets.bottom + 16, 32) }]}>
        <Pressable
          style={[styles.cancelBtn, { borderColor: colors.destructiveLight }]}
          onPress={handleCancel}
        >
          <Text style={[styles.cancelText, { color: colors.destructive, fontFamily: "Inter_500Medium" }]}>Cancel search</Text>
        </Pressable>
      </View>
    </View>
  );
}

function FareStat({ label, value, colors }: { label: string; value: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={styles.fareStat}>
      <Text style={[styles.fareStatLabel, { color: colors.textMuted, fontFamily: "Inter_400Regular" }]}>{label}</Text>
      <Text style={[styles.fareStatValue, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  ringsContainer: { width: 140, height: 140, alignItems: "center", justifyContent: "center", marginBottom: 32 },
  ring: { position: "absolute", width: 100, height: 100, borderRadius: 50, borderWidth: 2 },
  centerIcon: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  mainText: { fontSize: 22, textAlign: "center", marginBottom: 8 },
  subText: { fontSize: 14, textAlign: "center", lineHeight: 22, marginBottom: 20 },
  destHighlight: { fontSize: 15 },
  dots: { flexDirection: "row", gap: 6, marginBottom: 32 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  fareCard: { width: "100%", borderRadius: 16, padding: 16, gap: 12 },
  fareCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  fareCardLabel: { fontSize: 12 },
  farePill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  farePillText: { fontSize: 14 },
  fareStats: { flexDirection: "row", alignItems: "center" },
  fareStat: { flex: 1, alignItems: "center" },
  fareStatLabel: { fontSize: 10, marginBottom: 3 },
  fareStatValue: { fontSize: 14 },
  fareStatDivider: { width: 1, height: 28 },
  bottom: { paddingHorizontal: 24 },
  cancelBtn: { height: 50, borderRadius: 14, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  cancelText: { fontSize: 15 },
});
