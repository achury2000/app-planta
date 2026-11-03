import { MaterialIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { C, F } from "../../constants/theme";
import type { IconName } from "../../components/ui";

const TABS: Record<string, { label: string; icon: IconName }> = {
  index: { label: "Hoy", icon: "spa" },
  discover: { label: "Explorar", icon: "explore" },
  retos: { label: "Retos", icon: "flag" },
  pit: { label: "Mi PIT", icon: "hub" },
  profile: { label: "Yo", icon: "person" },
};

function TabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.bar}>
        <BlurView intensity={Platform.OS === "web" ? 0 : 40} tint="dark" style={StyleSheet.absoluteFill} />
        {state.routes.map((r: any, i: number) => {
          const meta = TABS[r.name];
          if (!meta) return null;
          const focused = state.index === i;
          return (
            <Pressable
              key={r.key}
              accessibilityRole="button"
              accessibilityLabel={meta.label}
              onPress={() => {
                if (Platform.OS !== "web") void Haptics.selectionAsync().catch(() => {});
                if (!focused) navigation.navigate(r.name);
              }}
              style={styles.item}
            >
              <View style={[styles.iconWrap, focused && styles.iconWrapOn]}>
                <MaterialIcons name={meta.icon} size={22} color={focused ? C.ink : C.mute} />
              </View>
              <Text style={[styles.lbl, focused && { color: C.g1 }]}>{meta.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs tabBar={(p) => <TabBar {...p} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: C.bg } }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="discover" />
      <Tabs.Screen name="retos" />
      <Tabs.Screen name="pit" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 14 },
  bar: { flexDirection: "row", borderRadius: 30, overflow: "hidden", backgroundColor: "rgba(9,22,15,0.97)", borderWidth: 1, borderColor: C.line2, paddingVertical: 8, paddingHorizontal: 6 },
  item: { flex: 1, alignItems: "center", gap: 3 },
  iconWrap: { width: 46, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  iconWrapOn: { backgroundColor: C.g1 },
  lbl: { fontFamily: F.bold, fontSize: 10.5, color: C.mute },
});
