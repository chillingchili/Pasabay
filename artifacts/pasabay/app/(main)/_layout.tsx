import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import React from "react";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";

function NativeTabLayout({ activeRole }: { activeRole: string }) {
  return (
    <NativeTabs>
      {activeRole === "driver" ? (
        <>
          <NativeTabs.Trigger name="driver-home">
            <Icon sf={{ default: "house", selected: "house.fill" }} />
            <Label>Home</Label>
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="history">
            <Icon sf={{ default: "clock", selected: "clock.fill" }} />
            <Label>History</Label>
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="profile">
            <Icon sf={{ default: "person", selected: "person.fill" }} />
            <Label>Profile</Label>
          </NativeTabs.Trigger>
        </>
      ) : (
        <>
          <NativeTabs.Trigger name="passenger-home">
            <Icon sf={{ default: "house", selected: "house.fill" }} />
            <Label>Home</Label>
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="history">
            <Icon sf={{ default: "clock", selected: "clock.fill" }} />
            <Label>History</Label>
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="profile">
            <Icon sf={{ default: "person", selected: "person.fill" }} />
            <Label>Profile</Label>
          </NativeTabs.Trigger>
        </>
      )}
    </NativeTabs>
  );
}

function ClassicTabLayout({ activeRole }: { activeRole: string }) {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />
          ) : null,
      }}
    >
      {activeRole === "driver" ? (
        <>
          <Tabs.Screen
            name="driver-home"
            options={{
              title: "Home",
              tabBarIcon: ({ color }) =>
                isIOS ? <SymbolView name="house" tintColor={color} size={24} /> : <Feather name="home" size={22} color={color} />,
            }}
          />
          <Tabs.Screen name="passenger-home" options={{ href: null }} />
        </>
      ) : (
        <>
          <Tabs.Screen
            name="passenger-home"
            options={{
              title: "Home",
              tabBarIcon: ({ color }) =>
                isIOS ? <SymbolView name="house" tintColor={color} size={24} /> : <Feather name="home" size={22} color={color} />,
            }}
          />
          <Tabs.Screen name="driver-home" options={{ href: null }} />
        </>
      )}
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="clock" tintColor={color} size={24} /> : <Feather name="clock" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="person" tintColor={color} size={24} /> : <Feather name="user" size={22} color={color} />,
        }}
      />
      <Tabs.Screen name="matching" options={{ href: null }} />
      <Tabs.Screen name="match-found" options={{ href: null }} />
    </Tabs>
  );
}

export default function MainTabLayout() {
  const { activeRole } = useApp();
  if (isLiquidGlassAvailable()) return <NativeTabLayout activeRole={activeRole} />;
  return <ClassicTabLayout activeRole={activeRole} />;
}
