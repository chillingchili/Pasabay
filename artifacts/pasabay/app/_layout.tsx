import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useCallback, useEffect } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { PaperProvider } from "react-native-paper";
import { theme } from "@/constants/theme";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import OfflineBanner from "@/components/OfflineBanner";
import { AppProvider, useApp } from "@/context/AppContext";
import { useDemoListener } from "@/hooks/useDemoListener";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function DemoListenerWrapper() {
  const { handleDemoAuth, handleDemoStage, resetDemo } = useApp();

  const onAuth = useCallback(
    (token: string, role: 'driver' | 'passenger', userData: { id: string; name: string; email: string; role: string }) =>
      handleDemoAuth(token, role, userData),
    [handleDemoAuth]
  );
  const onStage = useCallback(
    (stage: number, role: 'driver' | 'passenger') => handleDemoStage(stage, role),
    [handleDemoStage]
  );
  const onReset = useCallback(() => resetDemo(), [resetDemo]);

  useDemoListener({ onAuth, onStage, onReset });

  return null;
}

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="welcome" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="login" />
      <Stack.Screen name="verify-school-id" />
      <Stack.Screen name="verify-driver" />
      <Stack.Screen name="vehicle-details" />
      <Stack.Screen name="(main)" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Sora_800ExtraBold: require("../assets/fonts/Sora/static/Sora_800ExtraBold.ttf"),
  });
  const [timedOut, setTimedOut] = React.useState(false);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  const ready = fontsLoaded || fontError || timedOut;

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <OfflineBanner />
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <PaperProvider theme={theme}>
            <AppProvider>
              <DemoListenerWrapper />
              <GestureHandlerRootView style={{ flex: 1, ...(Platform.OS === 'web' ? {} : { minHeight: '100vh' }) }}>
                <KeyboardProvider>
                  <RootLayoutNav />
                </KeyboardProvider>
              </GestureHandlerRootView>
            </AppProvider>
          </PaperProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
