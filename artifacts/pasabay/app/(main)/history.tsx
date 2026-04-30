import React, { useState } from "react";
import { Modal, Platform, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "react-native-paper";
import { Card, Button, Text, Divider, Surface } from "react-native-paper";
import { useApp, RideHistory } from "@/context/AppContext";
import { useScale } from "@/hooks/useScale";
import type { MD3Colors } from "react-native-paper";

const TABS = ["All", "Completed", "Canceled"] as const;
type FilterTab = typeof TABS[number];

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { fs, isSmall } = useScale();
  const dimensions = useWindowDimensions();
  const { rideHistory } = useApp();
  const [activeTab, setActiveTab] = useState<FilterTab>("All");
  const [selectedRide, setSelectedRide] = useState<RideHistory | null>(null);

  const topPad = Platform.OS === "web" ? Math.min(dimensions.width * 0.17, 67) : insets.top;

  const filtered = rideHistory.filter(r => {
    if (activeTab === "All") return true;
    if (activeTab === "Completed") return r.status === "completed";
    return r.status === "canceled";
  });

  const currentMonthName = new Date().toLocaleString("en-US", { month: "long" });
  const currentMonthRides = rideHistory.filter(r => r.status === "completed" && (r.date.includes(currentMonthName) || r.date.startsWith("Today")));
  const tripCount = currentMonthRides.length;
  const totalSaved = currentMonthRides.reduce((sum, r) => sum + (typeof r.fare === "number" ? r.fare : 0), 0);

  return (
    <Surface style={[styles.container, { backgroundColor: colors.surface, paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={[styles.title, { fontSize: fs(26), color: colors.onSurface }]}>Ride history</Text>
      </View>

      <View style={[styles.tabRow, { borderBottomColor: colors.outlineVariant }]}>
        {TABS.map(tab => (
          <Pressable
            key={tab}
            style={[styles.tab, activeTab === tab && { borderBottomColor: colors.primary, borderBottomWidth: 2.5 }]}
            onPress={() => setActiveTab(tab)}
          >
            <Text variant="labelLarge" style={[styles.tabText, { color: activeTab === tab ? colors.primary : colors.onSurfaceVariant, fontFamily: activeTab === tab ? "Inter_600SemiBold" : "Inter_400Regular" }]}>
              {tab}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.list, { paddingBottom: Math.max(insets.bottom + 80, 100) }]}
        showsVerticalScrollIndicator={false}
      >
        {rideHistory.length > 0 && (
          <Card mode="elevated" style={{ borderRadius: 14, marginBottom: 16 }}>
            <Card.Content style={{ padding: 16 }}>
              <Text variant="headlineSmall" style={[styles.summaryStat, { color: colors.onSurface }]}>
                {tripCount}<Text variant="labelLarge" style={{ color: colors.onSurfaceVariant }}> trips · ₱</Text>{totalSaved}<Text variant="labelLarge" style={{ color: colors.onSurfaceVariant }}> saved</Text>
              </Text>
              <Text variant="labelLarge" style={[styles.summarySub, { color: colors.onSurfaceVariant }]}>This month</Text>
            </Card.Content>
          </Card>
        )}

        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="clock" size={40} color={colors.onSurfaceDisabled} />
            <Text variant="headlineSmall" style={[styles.emptyText, { color: colors.onSurfaceVariant, fontSize: 15 }]}>No rides yet</Text>
          </View>
        ) : (
          filtered.map(ride => (
            <Pressable
              key={ride.id}
              onPress={() => setSelectedRide(ride)}
            >
              <Card mode="outlined" style={[styles.rideCard, { backgroundColor: colors.surfaceVariant }]}>
                <Card.Content style={styles.rideCardContent}>
                  <View style={[styles.rideIcon, { backgroundColor: ride.status === "completed" ? colors.primaryContainer : colors.errorContainer }]}>
                    <Feather
                      name={ride.status === "completed" ? "check" : "x"}
                      size={16}
                      color={ride.status === "completed" ? colors.primary : colors.error}
                    />
                  </View>
                  <View style={styles.rideContent}>
                    <Text variant="bodyLarge" style={[styles.rideRoute, { color: colors.onSurface, fontFamily: "Inter_500Medium" }]} numberOfLines={1}>{ride.route}</Text>
                    <Text variant="labelLarge" style={[styles.rideMeta, { color: colors.onSurfaceVariant, fontSize: 11 }]}>
                      {ride.date}{ride.withName ? ` · with ${ride.withName}` : ride.cancelReason ? ` · ${ride.cancelReason}` : ""}
                    </Text>
                  </View>
                  <View style={styles.rideRight}>
                    <Text variant="labelLarge" style={[styles.rideFare, { color: ride.status === "canceled" ? colors.onSurfaceDisabled : colors.onSurface, fontFamily: "Inter_600SemiBold" }]}>
                      {ride.status === "canceled" ? "—" : `₱${ride.fare}`}
                    </Text>
                    <Text variant="labelLarge" style={[styles.rideStatus, { color: ride.status === "completed" ? colors.primary : colors.error, fontSize: 11 }]}>
                      {ride.status === "completed" ? "Completed" : "Canceled"}
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            </Pressable>
          ))
        )}
      </ScrollView>

      <Modal visible={!!selectedRide} transparent animationType="slide" onRequestClose={() => setSelectedRide(null)}>
        {selectedRide && (
          <View style={styles.modalOverlay}>
            <Pressable style={styles.modalBackdrop} onPress={() => setSelectedRide(null)} />
            <Surface style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
              <View style={[styles.modalHandle, { backgroundColor: colors.outline }]} />
              <Text variant="headlineSmall" style={[styles.modalTitle, { color: colors.onSurface }]}>Trip details</Text>

              <Card mode="outlined" style={{ backgroundColor: colors.surfaceVariant, borderRadius: 14, overflow: "hidden" }}>
                <DetailRow icon="map-pin" label="From" value={selectedRide.from} colors={colors} />
                <Divider style={{ backgroundColor: colors.outlineVariant, marginLeft: 52 }} />
                <DetailRow icon="navigation" label="To" value={selectedRide.to} colors={colors} />
                <Divider style={{ backgroundColor: colors.outlineVariant, marginLeft: 52 }} />
                <DetailRow icon="clock" label="Date" value={selectedRide.date} colors={colors} />
                {selectedRide.withName && (
                  <>
                    <Divider style={{ backgroundColor: colors.outlineVariant, marginLeft: 52 }} />
                    <DetailRow icon="user" label="Driver" value={selectedRide.withName} colors={colors} />
                  </>
                )}
                <Divider style={{ backgroundColor: colors.outlineVariant, marginLeft: 52 }} />
                <DetailRow
                  icon="dollar-sign"
                  label="Fare"
                  value={selectedRide.status === "canceled" ? "—" : `${selectedRide.fare}`}
                  valueSymbol={selectedRide.status !== "canceled" ? "₱" : undefined}
                  colors={colors}
                  valueColor={selectedRide.status === "completed" ? colors.onSurface : colors.onSurfaceDisabled}
                />
              </Card>

              <View style={[styles.statusChip, { backgroundColor: selectedRide.status === "completed" ? colors.primaryContainer : colors.errorContainer }]}>
                <Feather
                  name={selectedRide.status === "completed" ? "check-circle" : "x-circle"}
                  size={14}
                  color={selectedRide.status === "completed" ? colors.primary : colors.error}
                />
                <Text variant="labelLarge" style={[styles.statusChipText, { color: selectedRide.status === "completed" ? colors.primary : colors.error, fontFamily: "Inter_500Medium" }]}>
                  {selectedRide.status === "completed" ? "Completed" : `Canceled · ${selectedRide.cancelReason}`}
                </Text>
              </View>

              <Button
                mode="contained"
                buttonColor={colors.primary}
                textColor={colors.onPrimary}
                onPress={() => setSelectedRide(null)}
                style={{ borderRadius: 14 }}
                contentStyle={{ height: 52 }}
                labelStyle={{ fontFamily: "Inter_600SemiBold", fontSize: 16 }}
              >
                Close
              </Button>
            </Surface>
          </View>
        )}
      </Modal>
    </Surface>
  );
}

function DetailRow({ icon, label, value, colors, valueColor, valueSymbol }: { icon: keyof typeof Feather.glyphMap; label: string; value: string; colors: MD3Colors; valueColor?: string; valueSymbol?: string }) {
  return (
    <View style={styles.detailRow}>
      <View style={[styles.detailIcon, { backgroundColor: colors.primaryContainer }]}>
        <Feather name={icon} size={14} color={colors.primary} />
      </View>
      <Text variant="labelLarge" style={[styles.detailLabel, { color: colors.onSurfaceVariant, fontSize: 12 }]}>{label}</Text>
      <Text variant="bodyLarge" style={[styles.detailValue, { color: valueColor || colors.onSurface, fontFamily: "Inter_500Medium", fontSize: 14 }]}>
        {valueSymbol}{value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 8, paddingTop: 12 },
  title: { fontSize: 26, fontWeight: "700" },
  tabRow: { flexDirection: "row", borderBottomWidth: 1, marginHorizontal: 20 },
  tab: { paddingVertical: 10, paddingHorizontal: 4, marginRight: 20 },
  tabText: { fontSize: 14 },
  list: { paddingHorizontal: 20, paddingTop: 8 },
  summaryStat: { fontSize: 20 },
  summarySub: { fontSize: 14, marginTop: 2 },
  rideCard: { borderRadius: 14, marginBottom: 10 },
  rideCardContent: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  rideIcon: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  rideContent: { flex: 1, gap: 3 },
  rideRoute: { fontSize: 14 },
  rideMeta: { fontSize: 11 },
  rideRight: { alignItems: "flex-end", gap: 3 },
  rideFare: { fontSize: 15 },
  rideStatus: { fontSize: 11 },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15 },
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)" },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40, gap: 14 },
  modalHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 6 },
  modalTitle: { fontSize: 20, fontWeight: "700" },
  detailRow: { flexDirection: "row", alignItems: "center", padding: 12, gap: 10 },
  detailIcon: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  detailLabel: { width: 60, fontSize: 12 },
  detailValue: { flex: 1, fontSize: 14 },
  statusChip: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, alignSelf: "flex-start" },
  statusChipText: { fontSize: 13 },
});
