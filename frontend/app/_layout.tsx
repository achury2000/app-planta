import { Fraunces_400Regular_Italic, Fraunces_600SemiBold } from "@expo-google-fonts/fraunces";
import { Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold, useFonts } from "@expo-google-fonts/manrope";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { View } from "react-native";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { Celebration } from "../components/Celebration";
import { C } from "../constants/theme";
import { AuthProvider } from "../context/AuthContext";
import { DataProvider } from "../context/DataContext";

void SplashScreen.preventAutoHideAsync().catch(() => {});

export const unstable_settings = { anchor: "(tabs)" };

const navTheme = { ...DarkTheme, colors: { ...DarkTheme.colors, background: C.bg, card: C.bg, primary: C.g1, text: C.text, border: C.line } };

function Gate() {
  const router = useRouter();
  useEffect(() => {
    AsyncStorage.getItem("planta_onboarded_v2")
      .then((v) => {
        if (!v) router.replace("/welcome");
      })
      .catch(() => {});
  }, [router]);
  return null;
}

export default function RootLayout() {
  const [loaded] = useFonts({ Fraunces_600SemiBold, Fraunces_400Regular_Italic, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold });
  useEffect(() => {
    if (loaded) void SplashScreen.hideAsync().catch(() => {});
  }, [loaded]);
  if (!loaded) return <View style={{ flex: 1, backgroundColor: C.bg }} />;
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <DataProvider>
          <ThemeProvider value={navTheme}>
            <Stack screenOptions={{ headerShown: false, animation: "fade", contentStyle: { backgroundColor: C.bg } }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="welcome" options={{ animation: "fade", gestureEnabled: false }} />
              <Stack.Screen name="auth" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
              <Stack.Screen name="orq" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
              <Stack.Screen name="content/[id]" options={{ animation: "slide_from_right" }} />
              <Stack.Screen name="presentar" options={{ presentation: "fullScreenModal", animation: "fade" }} />
            </Stack>
            <Gate />
            <Celebration />
            <StatusBar style="light" />
          </ThemeProvider>
        </DataProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
