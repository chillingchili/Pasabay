import React, { useState } from "react";
import { Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const dimensions = useWindowDimensions();
  const { user, logout, activeRole, switchRole, networkStatus } = useApp();
  const isRegisteredDriver = user?.driverVerified || user?.vehicle;
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showEditName, setShowEditName] = useState(false);
  const [editNameValue, setEditNameValue] = useState(user?.name ?? "");
  const [showHelp, setShowHelp] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  const topPad = Platform.OS === "web" ? Math.min(dimensions.width * 0.17, 67) : insets.top;

  const initials = user?.name
    ? user.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
    : "JD";

  const handleLogout = () => {
    setConfirmLogout(false);
    logout();
    // Redirect handled by forceLogout in AppContext
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topPad }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: Math.max(insets.bottom + 80, 100) }]}
      >
        <View style={styles.profileHeader}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={[styles.avatarText, { fontFamily: "Inter_700Bold" }]}>{initials}</Text>
          </View>
          <Text style={[styles.name, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>{user?.name || "Juan Dela Cruz"}</Text>
          <Text style={[styles.email, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>{user?.email || "juan.delacruz@usc.edu.ph"}</Text>
          <View style={styles.badges}>
            <View style={[styles.networkDot, { backgroundColor: networkStatus === "online" ? colors.success : networkStatus === "reconnecting" ? colors.accentDark : colors.destructive }]} />
            {user?.verified && (
              <View style={[styles.badge, { backgroundColor: colors.primaryLight }]}>
                <Feather name="check-circle" size={12} color={colors.primary} />
                <Text style={[styles.badgeText, { color: colors.primary, fontFamily: "Inter_500Medium" }]}>Verified</Text>
              </View>
            )}
            <View style={[styles.badge, { backgroundColor: colors.accentBg }]}>
              <Feather name="star" size={12} color={colors.accentDark} />
              <Text style={[styles.badgeText, { color: colors.accentDark, fontFamily: "Inter_500Medium" }]}>{user?.rating?.toFixed(1) || "4.8"}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.roleCard, { backgroundColor: colors.card }]}>
          <View style={[styles.roleIcon, { backgroundColor: colors.primaryLight }]}>
            <Feather name={activeRole === "driver" ? "truck" : "user"} size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.roleName, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
              {activeRole === "driver" ? "Driver" : "Passenger"}
            </Text>
            <Text style={[styles.roleLabel, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>Current role</Text>
          </View>
          {activeRole === "passenger" && !isRegisteredDriver && (
            <Pressable
              style={[styles.roleSwitchBtn, { backgroundColor: colors.accentBg }]}
              onPress={() => router.push("/vehicle-details")}
            >
              <Feather name="truck" size={12} color={colors.accentDark} />
              <Text style={[styles.roleSwitchText, { color: colors.accentDark, fontFamily: "Inter_500Medium" }]}>Become a driver</Text>
            </Pressable>
          )}
        </View>

        {user?.vehicle && (
          <Section title="Your Vehicle" colors={colors}>
            <InfoRow icon="truck" label="Car" value={`${user.vehicle.make} ${user.vehicle.model} ${user.vehicle.year}`} colors={colors} />
            <InfoRow icon="credit-card" label="Plate" value={user.vehicle.plate} colors={colors} />
            <InfoRow icon="users" label="Seats" value={String(user.vehicle.seats)} colors={colors} />
          </Section>
        )}

        <Section title="Account" colors={colors}>
          <MenuItem icon="user" label="Edit profile" colors={colors} onPress={() => { setEditNameValue(user?.name ?? ""); setShowEditName(true); }} />
          <MenuItem icon="credit-card" label="Payment methods" colors={colors} onPress={() => Alert.alert("Coming Soon", "Payment methods will be available in a future update.")} />
          <MenuItem icon="shield" label="Verification status" colors={colors} onPress={() => {}} badge="Done" badgeColor={colors.successLight} badgeTextColor={colors.success} />
        </Section>

        <Section title="Safety" colors={colors}>
          <MenuItem icon="phone" label="Emergency contact" colors={colors} onPress={() => Alert.alert("Coming Soon", "Emergency contact feature will be available in a future update.")} />
        </Section>

        <Section title="App" colors={colors}>
          <MenuItem icon="settings" label="Settings" colors={colors} onPress={() => Alert.alert("Coming Soon", "Settings will be available in a future update.")} />
          <MenuItem icon="help-circle" label="Help & Support" colors={colors} onPress={() => setShowHelp(true)} />
          <MenuItem icon="info" label="About Pasabay" colors={colors} onPress={() => setShowAbout(true)} />
        </Section>

        <Section title="Danger Zone" colors={colors} titleColor={colors.destructive}>
          <MenuItem icon="log-out" label="Log out" colors={colors} onPress={() => setConfirmLogout(true)} />
          <MenuItem icon="trash-2" label="Delete account" colors={colors} onPress={() => setConfirmDelete(true)} danger />
        </Section>

        <Text style={[styles.version, { color: colors.textMuted, fontFamily: "Inter_400Regular" }]}>
          Pasabay v1.0.0 · USC Talamban Pilot
        </Text>
      </ScrollView>

      {/* Edit Name Modal */}
      <Modal visible={showEditName} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.alertBox, { backgroundColor: colors.background }]}>
            <Text style={[styles.alertTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Edit name</Text>
            <TextInput
              style={[styles.nameInput, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border, fontFamily: "Inter_400Regular" }]}
              value={editNameValue}
              onChangeText={setEditNameValue}
              placeholder="Your name"
              placeholderTextColor={colors.textMuted}
              autoFocus
            />
            <View style={styles.alertBtns}>
              <Pressable style={[styles.alertBtnCancel, { borderColor: colors.border }]} onPress={() => setShowEditName(false)}>
                <Text style={[styles.alertBtnCancelText, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.alertBtnConfirm, { backgroundColor: colors.primary }]} onPress={() => {
                if (editNameValue.trim()) {
                  setShowEditName(false);
                  // Demo-only: name update would call PATCH /users/profile
                }
              }}>
                <Text style={[styles.alertBtnConfirmText, { fontFamily: "Inter_600SemiBold" }]}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Help & Support Modal */}
      <Modal visible={showHelp} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.alertBox, { backgroundColor: colors.background }]}>
            <Text style={[styles.alertTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Help & Support</Text>
            <Text style={[styles.alertMsg, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
              {"Frequently Asked Questions:\n\n"}
              {"Q: How do I request a ride?\n"}
              {"A: Go to the passenger home screen, enter your destination, and tap \"Find a pasabay\".\n\n"}
              {"Q: How do I become a driver?\n"}
              {"A: Go to your profile and tap \"Become a driver\" to complete vehicle verification.\n\n"}
              {"Q: How is fare calculated?\n"}
              {"A: Fares are based on distance and fuel efficiency, following LTFRB cost-sharing guidelines."}
            </Text>
            <View style={styles.alertBtns}>
              <Pressable style={[styles.alertBtnConfirm, { backgroundColor: colors.primary }]} onPress={() => setShowHelp(false)}>
                <Text style={[styles.alertBtnConfirmText, { fontFamily: "Inter_600SemiBold" }]}>Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* About Modal */}
      <Modal visible={showAbout} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.alertBox, { backgroundColor: colors.background }]}>
            <Text style={[styles.alertTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>About Pasabay</Text>
            <Text style={[styles.alertMsg, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
              {"Pasabay v1.0.0\n\n"}
              {"A campus rideshare app connecting USC students heading the same direction. Passengers get reliable rides and drivers share fuel costs — safely, affordably, and campus-verified.\n\n"}
              {"Built for the USC Talamban Pilot."}
            </Text>
            <View style={styles.alertBtns}>
              <Pressable style={[styles.alertBtnConfirm, { backgroundColor: colors.primary }]} onPress={() => setShowAbout(false)}>
                <Text style={[styles.alertBtnConfirmText, { fontFamily: "Inter_600SemiBold" }]}>Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={confirmLogout} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.alertBox, { backgroundColor: colors.background }]}>
            <Text style={[styles.alertTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Log out?</Text>
            <Text style={[styles.alertMsg, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>You'll be returned to the welcome screen.</Text>
            <View style={styles.alertBtns}>
              <Pressable style={[styles.alertBtnCancel, { borderColor: colors.border }]} onPress={() => setConfirmLogout(false)}>
                <Text style={[styles.alertBtnCancelText, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.alertBtnConfirm, { backgroundColor: colors.destructive }]} onPress={handleLogout}>
                <Text style={[styles.alertBtnConfirmText, { fontFamily: "Inter_600SemiBold" }]}>Log out</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={confirmDelete} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.alertBox, { backgroundColor: colors.background }]}>
            <Text style={[styles.alertTitle, { color: colors.destructive, fontFamily: "Inter_700Bold" }]}>Delete account?</Text>
            <Text style={[styles.alertMsg, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>This is permanent and cannot be undone. All your data will be lost.</Text>
            <View style={styles.alertBtns}>
              <Pressable style={[styles.alertBtnCancel, { borderColor: colors.border }]} onPress={() => setConfirmDelete(false)}>
                <Text style={[styles.alertBtnCancelText, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.alertBtnConfirm, { backgroundColor: colors.destructive }]}
                onPress={() => {
                  setConfirmDelete(false);
                  logout();
                  // Redirect handled by forceLogout in AppContext
                }}
              >
                <Text style={[styles.alertBtnConfirmText, { fontFamily: "Inter_600SemiBold" }]}>Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Section({ title, children, colors, titleColor }: { title: string; children: React.ReactNode; colors: ReturnType<typeof useColors>; titleColor?: string }) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: titleColor || colors.textSecondary, fontFamily: "Inter_600SemiBold" }]}>{title}</Text>
      <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
        {children}
      </View>
    </View>
  );
}

function MenuItem({ icon, label, colors, onPress, badge, badgeColor, badgeTextColor, danger }: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  colors: ReturnType<typeof useColors>;
  onPress: () => void;
  badge?: string;
  badgeColor?: string;
  badgeTextColor?: string;
  danger?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.menuItem, { opacity: pressed ? 0.7 : 1, borderBottomColor: colors.borderLighter }]}
      onPress={onPress}
    >
      <View style={[styles.menuIcon, { backgroundColor: danger ? colors.destructiveLight : colors.primaryLight }]}>
        <Feather name={icon} size={16} color={danger ? colors.destructive : colors.primary} />
      </View>
      <Text style={[styles.menuLabel, { color: danger ? colors.destructive : colors.foreground, fontFamily: "Inter_400Regular", flex: 1 }]}>{label}</Text>
      {badge && (
        <View style={[styles.menuBadge, { backgroundColor: badgeColor }]}>
          <Text style={[styles.menuBadgeText, { color: badgeTextColor, fontFamily: "Inter_500Medium" }]}>{badge}</Text>
        </View>
      )}
      <Feather name="chevron-right" size={16} color={danger ? colors.destructive : colors.textMuted} />
    </Pressable>
  );
}

function InfoRow({ icon, label, value, colors }: { icon: keyof typeof Feather.glyphMap; label: string; value: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={[styles.menuItem, { borderBottomColor: colors.borderLighter }]}>
      <View style={[styles.menuIcon, { backgroundColor: colors.primaryLight }]}>
        <Feather name={icon} size={16} color={colors.primary} />
      </View>
      <Text style={[styles.menuLabel, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>{label}</Text>
      <Text style={[styles.menuValue, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 16 },
  profileHeader: { alignItems: "center", paddingTop: 16, paddingBottom: 20, gap: 6 },
  avatar: { width: 76, height: 76, borderRadius: 38, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  avatarText: { fontSize: 26, color: "#fff" },
  name: { fontSize: 20, fontWeight: "700" },
  email: { fontSize: 13 },
  badges: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  networkDot: { width: 8, height: 8, borderRadius: 4 },
  badge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  badgeText: { fontSize: 12 },
  roleCard: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 14, marginBottom: 16, gap: 12 },
  roleIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  roleName: { fontSize: 14 },
  roleLabel: { fontSize: 11, marginTop: 1 },
  roleSwitchBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  roleSwitchText: { fontSize: 11 },
  section: { marginBottom: 16, gap: 6 },
  sectionTitle: { fontSize: 11, textTransform: "uppercase", letterSpacing: 1, paddingLeft: 4 },
  sectionCard: { borderRadius: 14, overflow: "hidden" },
  menuItem: { flexDirection: "row", alignItems: "center", padding: 12, gap: 10, borderBottomWidth: 1 },
  menuIcon: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  menuLabel: { fontSize: 14 },
  menuValue: { fontSize: 14 },
  menuBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, marginRight: 4 },
  menuBadgeText: { fontSize: 11 },
  version: { textAlign: "center", fontSize: 11, paddingTop: 8 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center", padding: 32 },
  alertBox: { width: "100%", borderRadius: 20, padding: 24, gap: 10 },
  alertTitle: { fontSize: 18, fontWeight: "700" },
  alertMsg: { fontSize: 14, lineHeight: 20 },
  alertBtns: { flexDirection: "row", gap: 10, marginTop: 6 },
  alertBtnCancel: { flex: 1, height: 48, borderRadius: 12, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  alertBtnCancelText: { fontSize: 15 },
  alertBtnConfirm: { flex: 1, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  alertBtnConfirmText: { color: "#fff", fontSize: 15 },
  nameInput: { width: "100%", height: 44, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, fontSize: 14, marginTop: 4 },
});
