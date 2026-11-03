import { MaterialIcons } from "@expo/vector-icons";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { DateTime } from "luxon";
import React, { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Plant } from "../components/Plant";
import { Bar, Pill } from "../components/ui";
import { C, F } from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import { usePit } from "../lib/pit";

/** Modo presentación: tu PIT en pantalla completa para mostrarla "sobre la mesa". */
export default function Presentar() {
  useEffect(() => {
    activateKeepAwakeAsync("pit").catch(() => {});
    return () => { deactivateKeepAwake("pit").catch(() => {}); };
  }, []);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const pit = usePit();
  const [now, setNow] = useState(DateTime.now().setZone("America/Bogota"));
  useEffect(() => {
    const id = setInterval(() => setNow(DateTime.now().setZone("America/Bogota")), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: "#03080A" }}>
      <LinearGradient colors={["#0B2230", "#03080A", "#03120A"]} style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }} />
      <View style={{ flex: 1, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16, paddingHorizontal: 22 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: C.g1 }} />
            <Text style={{ color: C.g1, fontFamily: F.bold, fontSize: 12, letterSpacing: 1.5 }}>EN VIVO · {now.toFormat("HH:mm:ss")}</Text>
          </View>
          <Pressable onPress={() => router.back()} hitSlop={12}><MaterialIcons name="close" size={26} color={C.sub} /></Pressable>
        </View>

        <View style={{ marginTop: 8, gap: 2 }}>
          <Text style={{ color: C.mute, fontFamily: F.bold, fontSize: 11, letterSpacing: 2 }}>PLANTA INDIVIDUAL DE TRANSFORMACIÓN</Text>
          <Text style={{ color: C.text, fontFamily: F.display, fontSize: 32 }}>{user?.name ?? "PIT"}</Text>
          <Text style={{ color: C.sub, fontFamily: F.semi, fontSize: 13 }}>Transformación digital · Aprendizaje continuo · Impacto real</Text>
        </View>

        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Plant stage={pit.stage.index} size={300} />
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8, marginTop: -6 }}>
            <Text style={{ color: C.text, fontFamily: F.display, fontSize: 64 }}>{pit.index}</Text>
            <Text style={{ color: C.mute, fontFamily: F.bold }}>ÍNDICE PIT</Text>
          </View>
          <Pill label={`${pit.stage.stage.name} · ${pit.totalDone} acciones · ${pit.streak} días de racha`} color={C.g1} />
        </View>

        <View style={{ gap: 11 }}>
          {pit.axes.map((a) => (
            <View key={a.key} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Text style={{ width: 92, color: C.sub, fontFamily: F.bold, fontSize: 13 }}>{a.label}</Text>
              <View style={{ flex: 1 }}><Bar pct={a.value ?? 0} color={a.color} height={7} /></View>
              <Text style={{ width: 44, textAlign: "right", color: a.color, fontFamily: F.xbold, fontSize: 13 }}>{a.value === null ? "—" : `${Math.round(a.value * 100)}%`}</Text>
            </View>
          ))}
          <Text style={{ color: C.mute, fontFamily: F.semi, fontSize: 10.5, marginTop: 4 }}>Constancia y territorio se calculan de tu actividad en la app. Enfoque, resiliencia y calma son tu autorreporte de hoy.</Text>
        </View>
      </View>
    </View>
  );
}
