import React, { useState } from "react";
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useApp, RideHistory } from "@/context/AppContext";

const TABS = ["All", "Completed", "Canceled"] as const;
type FilterTab = typeof TABS[number];

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { rideHistory } = useApp();
  const [activeTab, setActiveTab] = useState<FilterTab>("All");
  const [selectedRide, setSelectedRide] = useState<RideHistory | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const filtered = rideHistory.filter(r => {
    if (activeTab === "All") return true;
    if (activeTab === "Completed") return r.status === "completed";
    return r.status === "canceled";
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Ride history</Text>
      </View>

      <View style={[styles.tabRow, { borderBottomColor: colors.borderLighter }]}>
        {TABS.map(tab => (
          <Pressable
            key={tab}
            style={[styles.tab, activeTab === tab && { borderBottomColor: colors.primary, borderBottomWidth: 2.5 }]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, { color: activeTab === tab ? colors.primary : colors.textSecondary, fontFamily: activeTab === tab ? "Inter_600SemiBold" : "Inter_400Regular" }]}>
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
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="clock" size={40} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>No rides yet</Text>
          </View>
        ) : (
          filtered.map(ride => (
            <Pressable
              key={ride.id}
              style={[styles.rideItem, { borderBottomColor: colors.borderLighter }]}
              onPress={() => setSelectedRide(ride)}
            >
              <View style={[styles.rideIcon, { backgroundColor: ride.status === "completed" ? colors.primaryLight : colors.destructiveLight }]}>
                <Feather
                  name={ride.status === "completed" ? "check" : "x"}
                  size={16}
                  color={ride.status === "completed" ? colors.primary : colors.destructive}
                />
              </View>
              <View style={styles.rideContent}>
                <Text style={[styles.rideRoute, { color: colors.foreground, fontFamily: "Inter_500Medium" }]} numberOfLines={1}>{ride.route}</Text>
                <Text style={[styles.rideMeta, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
                  {ride.date}{ride.withName ? ` · with ${ride.withName}` : ride.cancelReason ? ` · ${ride.cancelReason}` : ""}
                </Text>
              </View>
              <View style={styles.rideRight}>
                <Text style={[styles.rideFare, { color: ride.status === "canceled" ? colors.textMuted : colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                  {ride.status === "canceled" ? "—" : `₱${ride.fare}`}
                </Text>
                <Text style={[styles.rideStatus, { color: ride.status === "completed" ? colors.primary : colors.destructive, fontFamily: "Inter_400Regular" }]}>
                  {ride.status === "completed" ? "Completed" : "Canceled"}
                </Text>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>

      <Modal visible={!!selectedRide} transparent animationType="slide" onRequestClose={() => setSelectedRide(null)}>
        {selectedRide && (
          <View style={styles.modalOverlay}>
            <Pressable style={styles.modalBackdrop} onPress={() => setSelectedRide(null)} />
            <View style={[styles.modalSheet, { backgroundColor: colors.background }]}>
              <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
              <Text style={[styles.modalTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Trip details</Text>

              <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
                <DetailRow icon="map-pin" label="From" value={selectedRide.from} colors={colors} />
                <View style={[styles.detailDivider, { backgroundColor: colors.borderLighter }]} />
                <DetailRow icon="navigation" label="To" value={selectedRide.to} colors={colors} />
                <View style={[styles.detailDivider, { backgroundColor: colors.borderLighter }]} />
                <DetailRow icon="clock" label="Date" value={selectedRide.date} colors={colors} />
                {selectedRide.withName && (
                  <>
                    <View style={[styles.detailDivider, { backgroundColor: colors.borderLighter }]} />
                    <DetailRow icon="user" label="Driver" value={selectedRide.withName} colors={colors} />
                  </>
                )}
                <View style={[styles.detailDivider, { backgroundColor: colors.borderLighter }]} />
                <DetailRow
                  icon="dollar-sign"
                  label="Fare"
                  value={selectedRide.status === "canceled" ? "—" : `₱${selectedRide.fare}`}
                  colors={colors}
                  valueColor={selectedRide.status === "completed" ? colors.foreground : colors.textMuted}
                />
              </View>

              <View style={[styles.statusChip, { backgroundColor: selectedRide.status === "completed" ? colors.primaryLight : colors.destructiveLight }]}>
                <Feather
                  name={selectedRide.status === "completed" ? "check-circle" : "x-circle"}
                  size={14}
                  color={selectedRide.status === "completed" ? colors.primary : colors.destructive}
                />
                <Text style={[styles.statusChipText, { color: selectedRide.status === "completed" ? colors.primary : colors.destructive, fontFamily: "Inter_500Medium" }]}>
                  {selectedRide.status === "completed" ? "Completed" : `Canceled · ${selectedRide.cancelReason}`}
                </Text>
              </View>

              <Pressable
                style={[styles.closeBtn, { backgroundColor: colors.primary }]}
                onPress={() => setSelectedRide(null)}
              >
                <Text style={[styles.closeBtnText, { fontFamily: "Inter_600SemiBold" }]}>Close</Text>
              </Pressable>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
}

function DetailRow({ icon, label, value, colors, valueColor }: { icon: keyof typeof Feather.glyphMap; label: string; value: string; colors: ReturnType<typeof useColors>; valueColor?: string }) {
  return (
    <View style={styles.detailRow}>
      <View style={[styles.detailIcon, { backgroundColor: colors.primaryLight }]}>
        <Feather name={icon} size={14} color={colors.primary} />
      </View>
      <Text style={[styles.detailLabel, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: valueColor || colors.foreground, fontFamily: "Inter_500Medium" }]}>{value}</Text>
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
  rideItem: { flexDirection: "row", alignItems: "center", paddingVertical: 14, gap: 12, borderBottomWidth: 1 },
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
  modalCard: { borderRadius: 14, overflow: "hidden" },
  detailRow: { flexDirection: "row", alignItems: "center", padding: 12, gap: 10 },
  detailIcon: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  detailLabel: { width: 60, fontSize: 12 },
  detailValue: { flex: 1, fontSize: 14 },
  detailDivider: { height: 1, marginLeft: 52 },
  statusChip: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, alignSelf: "flex-start" },
  statusChipText: { fontSize: 13 },
  closeBtn: { height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  closeBtnText: { color: "#fff", fontSize: 16 },
});
