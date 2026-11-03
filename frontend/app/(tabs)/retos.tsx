import { MaterialIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { DateTime } from "luxon";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Platform, ScrollView, Text, TextInput, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Bar, Btn, Card, H1, H2, P, Pill, Ring, Screen } from "../../components/ui";
import { C, F } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import { useGate } from "../../hooks/use-require-auth";

const REQUIRED_KM = 1;
type Pt = { lat: number; lon: number; t: number };

const hav = (a: Pt, b: Pt) => {
  const R = 6371, r = (x: number) => (x * Math.PI) / 180;
  const h = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lon - a.lon) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

/* ── Respiración guiada 4-4-6 ── */
function Breathing({ onDone, demo }: { onDone: () => void; demo: boolean }) {
  const TOTAL = 5 * 60;
  const [sec, setSec] = useState(0);
  const scale = useSharedValue(0.6);
  const phaseRef = useRef("");
  const cyc = sec % 14;
  const phase = cyc < 4 ? "Inhala" : cyc < 8 ? "Sostén" : "Exhala";

  useEffect(() => {
    const id = setInterval(() => setSec((s) => Math.min(TOTAL, s + 1)), 1000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (phaseRef.current === phase) return;
    phaseRef.current = phase;
    if (phase === "Inhala") scale.value = withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.sin) });
    if (phase === "Exhala") scale.value = withTiming(0.6, { duration: 6000, easing: Easing.inOut(Easing.sin) });
  }, [phase, scale]);
  useEffect(() => {
    if (sec >= TOTAL) onDone();
  }, [sec, onDone]);
  const st = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const left = TOTAL - sec;
  return (
    <View style={{ alignItems: "center", gap: 18, paddingVertical: 10 }}>
      <View style={{ width: 220, height: 220, alignItems: "center", justifyContent: "center" }}>
        <Animated.View style={[{ position: "absolute", width: 210, height: 210, borderRadius: 105, backgroundColor: C.sky + "22", borderWidth: 2, borderColor: C.sky + "88" }, st]} />
        <Animated.View style={[{ position: "absolute", width: 140, height: 140, borderRadius: 70, backgroundColor: C.g1 + "33" }, st]} />
        <Text style={{ color: C.text, fontFamily: F.display, fontSize: 28 }}>{phase}</Text>
      </View>
      <Text style={{ color: C.sub, fontFamily: F.bold, fontSize: 16 }}>{Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}</Text>
      <Bar pct={sec / TOTAL} color={C.sky} />
      {demo ? <Btn title="Saltar (solo demo)" variant="ghost" small onPress={onDone} /> : null}
    </View>
  );
}

export default function Retos() {
  const insets = useSafeAreaInsets();
  const gate = useGate();
  const { isAuthenticated } = useAuth();
  const { record, trackProgress, events, demo } = useData();
  const today = DateTime.now().setZone("America/Bogota").toISODate();
  const doneToday = useMemo(() => new Set(events.filter((e) => e.type === "challenge_completed" && e.localDate === today).map((e) => e.refId)), [events, today]);

  /* GPS */
  const [tracking, setTracking] = useState(false);
  const [km, setKm] = useState(0);
  const [signal, setSignal] = useState<"none" | "ok">("none");
  const [manual, setManual] = useState(false);
  const [manualKm, setManualKm] = useState("1");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const track = useRef<Pt[]>([]);
  const sub = useRef<Location.LocationSubscription | null>(null);

  /* Hábitos */
  const [breathing, setBreathing] = useState(false);
  const [water, setWater] = useState(0);

  const stop = useCallback(() => {
    sub.current?.remove();
    sub.current = null;
    setTracking(false);
  }, []);
  useEffect(() => () => { sub.current?.remove(); }, []);

  const start = async () => {
    setMsg(null);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== "granted") {
        setMsg("Necesitamos tu ubicación para medir el recorrido. También puedes ingresar la distancia manualmente.");
        setManual(true);
        return;
      }
      track.current = [];
      setKm(0);
      setTracking(true);
      sub.current = await Location.watchPositionAsync({ accuracy: Location.Accuracy.High, distanceInterval: 5, timeInterval: 2000 }, (loc) => {
        setSignal("ok");
        const p: Pt = { lat: loc.coords.latitude, lon: loc.coords.longitude, t: loc.timestamp };
        if ((loc.coords.accuracy ?? 0) > 50) return;
        const prev = track.current[track.current.length - 1];
        track.current = [...track.current, p].slice(-500);
        if (prev) setKm((k) => k + hav(prev, p));
      });
    } catch {
      setMsg("No pudimos activar el GPS. Usa el registro manual.");
      setManual(true);
      setTracking(false);
    }
  };

  /** Recorrido sintético (solo modo demo) para poder presentar el flujo completo. */
  const simulate = () => {
    const pts: Pt[] = [];
    const t0 = Date.now() - 14 * 60 * 1000;
    for (let i = 0; i <= 28; i++) pts.push({ lat: 4.711 + i * 0.00041, lon: -74.0721 + i * 0.00006, t: t0 + i * 30000 });
    track.current = pts;
    let d = 0;
    for (let i = 1; i < pts.length; i++) d += hav(pts[i - 1], pts[i]);
    setKm(d);
  };

  const finishWalk = async (source: "gps" | "manual") => {
    setBusy(true);
    setMsg(null);
    const distanceKm = source === "gps" ? Number(km.toFixed(2)) : Number(manualKm.replace(",", "."));
    const meta = source === "gps" ? { source, distanceKm, track: track.current } : { source, distanceKm };
    const r = await record("challenge_completed", "challenge", "c1", meta);
    setBusy(false);
    if (!r.ok) return setMsg(r.error ?? "No se pudo validar el recorrido.");
    stop();
    setKm(0);
    setManual(false);
    Alert.alert("¡Reto completado!", "Tu caminata quedó registrada y tu planta recibió agua.");
  };

  const habit = async (id: string, meta: Record<string, any> = {}) => {
    setBusy(true);
    const r = await record("challenge_completed", "challenge", id, { source: "self_report", ...meta });
    setBusy(false);
    if (!r.ok) setMsg(r.error ?? "No se pudo registrar.");
    return r.ok;
  };

  const walkDone = doneToday.has("c1");
  const pct = Math.min(1, km / REQUIRED_KM);

  return (
    <Screen pad={false}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 130, paddingHorizontal: 20, gap: 18 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={{ gap: 4 }}>
          <Text style={{ color: C.lilac, fontFamily: F.bold, fontSize: 12, letterSpacing: 1.6 }}>RETOS</Text>
          <H1>Acciones reales que hacen crecer tu planta</H1>
        </View>
        {msg ? <Card glow={C.coral}><View style={{ flexDirection: "row", gap: 10 }}><MaterialIcons name="info-outline" size={20} color={C.coral} /><P style={{ flex: 1, color: C.text }}>{msg}</P></View></Card> : null}

        {/* Caminata */}
        <Card glow={C.sky}>
          <View style={{ gap: 16 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ flex: 1, gap: 6 }}>
                <Pill label="Actividad física" color={C.sky} icon="directions-walk" />
                <H2>Camina 1 km hoy</H2>
                <P>El GPS mide tu recorrido y el servidor lo valida. Sin trampas, con orgullo.</P>
              </View>
              {walkDone ? <Pill label="Hecho hoy" color={C.g1} icon="check" /> : null}
            </View>
            <View style={{ alignItems: "center", gap: 6 }}>
              <Ring size={150} stroke={12} pct={pct} color={C.sky}>
                <Text style={{ color: C.text, fontFamily: F.display, fontSize: 34 }}>{km.toFixed(2)}</Text>
                <Text style={{ color: C.mute, fontFamily: F.bold, fontSize: 12 }}>de {REQUIRED_KM} km</Text>
              </Ring>
              {tracking ? <Text style={{ color: signal === "ok" ? C.g1 : C.sun, fontFamily: F.bold, fontSize: 12 }}>{signal === "ok" ? "● Señal GPS activa" : "● Buscando señal…"}</Text> : null}
            </View>
            {!isAuthenticated ? (
              <Btn title="Inicia sesión para empezar" icon="lock-open" onPress={() => gate(() => {})} />
            ) : tracking ? (
              <View style={{ gap: 10 }}>
                <Btn title="Completar reto" icon="flag" disabled={km < 0.8} loading={busy} onPress={() => finishWalk("gps")} />
                <Btn title="Detener" variant="ghost" onPress={stop} />
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                <Btn title={walkDone ? "Caminar otra vez" : "Empezar caminata"} icon="play-arrow" onPress={() => void start()} />
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <Btn title="Sin GPS" variant="soft" small style={{ flex: 1 }} onPress={() => setManual((m) => !m)} />
                  {demo ? <Btn title="Simular (demo)" variant="ghost" small style={{ flex: 1 }} onPress={() => { setTracking(true); setSignal("ok"); simulate(); }} /> : null}
                </View>
              </View>
            )}
            {manual && isAuthenticated ? (
              <View style={{ gap: 10, borderTopWidth: 1, borderTopColor: C.line, paddingTop: 14 }}>
                <P>Registro manual: indica los km. Queda marcado como no verificado.</P>
                <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
                  <TextInput value={manualKm} onChangeText={setManualKm} keyboardType="decimal-pad" style={{ flex: 1, color: C.text, fontFamily: F.bold, fontSize: 18, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 }} />
                  <Btn title="Registrar" small loading={busy} onPress={() => finishWalk("manual")} />
                </View>
              </View>
            ) : null}
          </View>
        </Card>

        {/* Respiración */}
        <Card glow={C.lilac}>
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <View style={{ flex: 1, gap: 6 }}>
                <Pill label="Rutina" color={C.lilac} icon="self-improvement" />
                <H2>5 minutos de respiración guiada</H2>
                <P>Ritmo 4-4-6 para bajar el estrés. La planta respira contigo.</P>
              </View>
              {doneToday.has("c3") ? <Pill label="Hecho hoy" color={C.g1} icon="check" /> : null}
            </View>
            {breathing ? (
              <Breathing demo={demo} onDone={async () => { setBreathing(false); if (await habit("c3", { minutes: 5 })) Alert.alert("Respiración completa", "Tu mente y tu planta lo agradecen."); }} />
            ) : (
              <Btn title="Comenzar" icon="air" variant="soft" onPress={() => gate(() => { setBreathing(true); trackProgress("challenge", "c3", { progress: 0.05 }); })} />
            )}
          </View>
        </Card>

        {/* Agua */}
        <Card glow={C.g1}>
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <View style={{ flex: 1, gap: 6 }}>
                <Pill label="Hábito" color={C.g1} icon="water-drop" />
                <H2>Hidrátate: 8 vasos</H2>
                <P>Toca un vaso cada vez que bebas. Al llegar a 8, el reto se completa.</P>
              </View>
              {doneToday.has("c4") ? <Pill label="Hecho hoy" color={C.g1} icon="check" /> : null}
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <Text key={i} onPress={() => gate(async () => {
                  const n = i + 1 === water ? i : i + 1;
                  setWater(n);
                  trackProgress("challenge", "c4", { progress: n / 8 });
                  if (n === 8) await habit("c4", { glasses: 8 });
                })} style={{ fontSize: 26, opacity: i < water ? 1 : 0.28 }}>💧</Text>
              ))}
            </View>
            <Bar pct={water / 8} color={C.sky} />
          </View>
        </Card>

        {/* Plástico */}
        <Card glow={C.coral}>
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <View style={{ flex: 1, gap: 6 }}>
                <Pill label="Naturaleza" color={C.coral} icon="recycling" />
                <H2>Hoy, cero plástico de un solo uso</H2>
                <P>Botella reutilizable, bolsa de tela, sin pitillos. Marca el día cuando lo cumplas.</P>
              </View>
              {doneToday.has("c2") ? <Pill label="Hecho hoy" color={C.g1} icon="check" /> : null}
            </View>
            <Btn title={doneToday.has("c2") ? "Registrado" : "Lo cumplí hoy"} icon="check-circle" variant="soft" disabled={doneToday.has("c2")} loading={busy} onPress={() => gate(() => void habit("c2"))} />
          </View>
        </Card>
      </ScrollView>
    </Screen>
  );
}
