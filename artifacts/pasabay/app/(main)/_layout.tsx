import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";
import { useTheme } from "react-native-paper";
import { useApp } from "@/context/AppContext";

const isWeb = Platform.OS === "web";
const isIOS = Platform.OS === "ios";

function TabBarIcon({ name, color, focused }: { name: keyof typeof Feather.glyphMap; color: string; focused: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={{ alignItems: "center", justifyContent: "center", width: 44, height: 44 }}>
      <Feather name={name} size={22} color={color} />
    </View>
  );
}

export default function MainTabLayout() {
  const { colors } = useTheme();
  const colorScheme = useColorScheme();
  const { activeRole } = useApp();
  const isDark = colorScheme === "dark";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.onSurfaceVariant,
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          bottom: Platform.OS === 'web' ? 0 : undefined,
          backgroundColor: isIOS ? "transparent" : colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.outline,
          elevation: 0,
          height: 64,
          paddingBottom: 8,
        },
        tabBarBackground: () =>
          isIOS && !isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.surface }]} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.surface }]} />
          ),
      }}
    >
      <Tabs.Screen
        name="passenger-home"
        options={{
          title: "Home",
          href: activeRole === "passenger" ? undefined : null,
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="home" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="driver-home"
        options={{
          title: "Home",
          href: activeRole === "driver" ? undefined : null,
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="home" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="clock" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="user" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen name="matching" options={{ href: null, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen name="match-found" options={{ href: null, tabBarStyle: { display: "none" } }} />
    </Tabs>
  );
}
