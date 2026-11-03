import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { DateTime } from "luxon";
import React, { useState } from "react";
import { ScrollView, Share, Text, View } from "react-native";
import Svg, { Circle, Line, Polygon, Text as SvgText } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Plant } from "../../components/Plant";
import { Bar, Btn, Card, Chip, Empty, H1, H2, P, Pill, Screen, SectionHead } from "../../components/ui";
import { MEDALS, medalById } from "../../constants/medals";
import { C, CAT, F, R } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import { usePit, type Axis } from "../../lib/pit";

function Radar({ axes, size = 270 }: { axes: Axis[]; size?: number }) {
  const cx = size / 2, cy = size / 2, R0 = size / 2 - 38;
  const n = axes.length;
  const pt = (i: number, v: number) => {
    const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
    return [cx + Math.cos(a) * R0 * v, cy + Math.sin(a) * R0 * v] as const;
  };
  const poly = axes.map((a, i) => pt(i, a.value ?? 0).join(",")).join(" ");
  return (
    <Svg width={size} height={size}>
      {[0.25, 0.5, 0.75, 1].map((r) => (
        <Polygon key={r} points={axes.map((_, i) => pt(i, r).join(",")).join(" ")} fill="none" stroke={C.line2} strokeWidth={1} />
      ))}
      {axes.map((_, i) => { const [x, y] = pt(i, 1); return <Line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke={C.line} />; })}
      <Polygon points={poly} fill={C.g1} fillOpacity={0.22} stroke={C.g1} strokeWidth={2} strokeLinejoin="round" />
      {axes.map((a, i) => { const [x, y] = pt(i, a.value ?? 0); return <Circle key={a.key} cx={x} cy={y} r={4.5} fill={a.color} stroke={C.bg} strokeWidth={1.5} />; })}
      {axes.map((a, i) => {
        const [x, y] = pt(i, 1.22);
        return <SvgText key={a.key} x={x} y={y + 4} fill={C.sub} fontSize={11} fontWeight="700" fontFamily={F.bold} textAnchor="middle">{a.label}</SvgText>;
      })}
    </Svg>
  );
}

const SLIDERS = [
  { k: "stress", label: "Estrés", low: "Tranquilo", high: "Tenso", color: C.lilac },
  { k: "focus", label: "Enfoque", low: "Disperso", high: "Claro", color: C.sky },
  { k: "energy", label: "Energía", low: "Baja", high: "Alta", color: C.sun },
  { k: "sleep", label: "Descanso", low: "Mal", high: "Reparador", color: C.g1 },
] as const;

export default function MiPit() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { summary, checkin, saveCheckin, byId } = useData();
  const pit = usePit();
  const [draft, setDraft] = useState({ stress: checkin?.stress ?? 3, focus: checkin?.focus ?? 3, energy: checkin?.energy ?? 3, sleep: checkin?.sleep ?? 3 });
  const [editing, setEditing] = useState(false);
  const [allMedals, setAllMedals] = useState(false);

  const earned = new Map((summary?.medals ?? []).map((m) => [m.id, m.earnedAt]));
  const compRows = [
    { label: "Naturaleza", v: pit.comp.environment, color: CAT.environment.color, icon: "eco" },
    { label: "Movimiento", v: pit.comp.fitness, color: CAT.fitness.color, icon: "directions-run" },
    { label: "Rutina y calma", v: pit.comp.routine, color: CAT.routine.color, icon: "self-improvement" },
    { label: "Retos", v: pit.comp.challenges, color: CAT.challenges.color, icon: "emoji-events" },
    { label: "Conocimiento", v: pit.comp.saber, color: C.sub, icon: "school" },
  ];

  const share = () =>
    void Share.share({
      message: `Mi PIT · ${user?.name ?? "Planta"}\nÍndice de estado: ${pit.index}/100 · Etapa: ${pit.stage.stage.name}\nRacha: ${pit.streak} días · Acciones: ${pit.totalDone}\n"La transformación comienza cuando decides florecer."`,
    }).catch(() => {});

  if (!isAuthenticated) {
    return (
      <Screen pad={false}>
        <ScrollView contentContainerStyle={{ paddingTop: insets.top + 30, paddingHorizontal: 24, paddingBottom: 130, alignItems: "center", gap: 14 }}>
          <Plant stage={0} size={230} />
          <Text style={{ color: C.g1, fontFamily: F.bold, fontSize: 12, letterSpacing: 1.6 }}>MI PIT</Text>
          <H1 style={{ textAlign: "center" }}>Tu hoja de vida, pero viva</H1>
          <P style={{ textAlign: "center" }}>La Planta Individual de Transformación muestra tu estado real hoy: constancia, enfoque, resiliencia, calma y avance de tu territorio. No es lo que hiciste, es quién eres ahora.</P>
          <Btn title="Crear mi PIT" icon="eco" onPress={() => router.push("/auth")} style={{ alignSelf: "stretch", marginTop: 8 }} />
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen pad={false}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 130, paddingHorizontal: 20, gap: 20 }} showsVerticalScrollIndicator={false}>
        <View style={{ gap: 4 }}>
          <Text style={{ color: C.g1, fontFamily: F.bold, fontSize: 12, letterSpacing: 1.6 }}>PLANTA INDIVIDUAL DE TRANSFORMACIÓN</Text>
          <H1>{user?.name}</H1>
        </View>

        {/* Holograma */}
        <Card glow={C.lilac} style={{ padding: 0 }}>
          <LinearGradient colors={["rgba(185,165,255,0.16)", "rgba(124,200,255,0.05)", "transparent"]} style={{ padding: 18, alignItems: "center" }}>
            <View style={{ flexDirection: "row", gap: 8, alignSelf: "flex-start" }}>
              <Pill label={pit.stage.stage.name} color={C.lilac} icon="spa" />
              <Pill label="Estado en vivo" color={C.g1} icon="sensors" />
            </View>
            <Plant stage={pit.stage.index} size={260} />
            <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
              <Text style={{ color: C.text, fontFamily: F.display, fontSize: 56 }}>{pit.index}</Text>
              <Text style={{ color: C.mute, fontFamily: F.bold, fontSize: 14 }}>/ 100 índice PIT</Text>
            </View>
            <P style={{ textAlign: "center" }}>"{pit.stage.stage.hint}"</P>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 14, alignSelf: "stretch" }}>
              <Btn title="Presentar" icon="cast" style={{ flex: 1 }} onPress={() => router.push("/presentar")} />
              <Btn title="Compartir" icon="ios-share" variant="soft" style={{ flex: 1 }} onPress={share} />
            </View>
          </LinearGradient>
        </Card>

        {/* Vector de estado */}
        <View>
          <SectionHead title="Vector de estado real" />
          <Card>
            <View style={{ alignItems: "center" }}><Radar axes={pit.axes} /></View>
            <View style={{ gap: 12, marginTop: 6 }}>
              {pit.axes.map((a) => (
                <View key={a.key} style={{ gap: 6 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: a.color }} />
                      <Text style={{ color: C.text, fontFamily: F.bold, fontSize: 14 }}>{a.label}</Text>
                      <Text style={{ color: C.mute, fontFamily: F.semi, fontSize: 11 }}>{a.source === "app" ? "registrado" : "autorreporte"}</Text>
                    </View>
                    <Text style={{ color: a.value === null ? C.mute : a.color, fontFamily: F.xbold, fontSize: 14 }}>{a.value === null ? "—" : `${Math.round(a.value * 100)}%`}</Text>
                  </View>
                  <Bar pct={a.value ?? 0} color={a.color} height={6} />
                </View>
              ))}
            </View>
          </Card>
        </View>

        {/* Check-in */}
        <Card glow={C.sky}>
          <View style={{ gap: 14 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flex: 1 }}>
                <H2>Check-in de hoy</H2>
                <P>{checkin && !editing ? "Guardado. Puedes actualizarlo cuando cambie tu estado." : "Cuatro toques para actualizar tu vector."}</P>
              </View>
              {checkin && !editing ? <Btn title="Editar" variant="ghost" small onPress={() => setEditing(true)} /> : null}
            </View>
            {(!checkin || editing) ? (
              <>
                {SLIDERS.map((s) => (
                  <View key={s.k} style={{ gap: 8 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ color: C.text, fontFamily: F.bold, fontSize: 14 }}>{s.label}</Text>
                      <Text style={{ color: C.mute, fontFamily: F.semi, fontSize: 12 }}>{s.low} → {s.high}</Text>
                    </View>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Text key={n} onPress={() => setDraft((d) => ({ ...d, [s.k]: n }))} style={{ flex: 1, textAlign: "center", paddingVertical: 11, borderRadius: 12, overflow: "hidden", fontFamily: F.xbold, fontSize: 15, color: draft[s.k] === n ? C.ink : C.sub, backgroundColor: draft[s.k] === n ? s.color : "rgba(255,255,255,0.06)" }}>{n}</Text>
                      ))}
                    </View>
                  </View>
                ))}
                <Btn title="Guardar check-in" icon="check" onPress={async () => { await saveCheckin(draft); setEditing(false); }} />
              </>
            ) : null}
          </View>
        </Card>

        {/* Competencias */}
        <View>
          <SectionHead title="Competencias que se transforman" />
          <Card>
            <View style={{ gap: 14 }}>
              {compRows.map((c) => (
                <View key={c.label} style={{ gap: 6 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <MaterialIcons name={c.icon as any} size={18} color={c.color} />
                    <Text style={{ flex: 1, color: C.text, fontFamily: F.bold, fontSize: 14 }}>{c.label}</Text>
                    <Text style={{ color: C.mute, fontFamily: F.bold, fontSize: 12 }}>{c.v} {c.v === 1 ? "acción" : "acciones"}</Text>
                  </View>
                  <Bar pct={Math.min(1, c.v / 8)} color={c.color} height={6} />
                </View>
              ))}
            </View>
          </Card>
        </View>

        {/* Certificaciones */}
        <View>
          <SectionHead title={`Certificaciones · ${earned.size}/${MEDALS.length}`} action={allMedals ? "Ocultar" : "Ver todas"} onAction={() => setAllMedals((v) => !v)} />
          {earned.size === 0 && !allMedals ? (
            <Empty icon="workspace-premium" title="Aún sin certificaciones" text="Completa tu primera acción para ganar tu primera medalla." />
          ) : (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {(allMedals ? MEDALS : MEDALS.filter((m) => earned.has(m.id))).map((m) => {
                const got = earned.has(m.id);
                return (
                  <View key={m.id} style={{ width: "48%", borderRadius: R.lg, padding: 14, gap: 8, backgroundColor: got ? m.color + "14" : "rgba(255,255,255,0.03)", borderWidth: 1, borderColor: got ? m.color + "55" : C.line, opacity: got ? 1 : 0.55 }}>
                    <View style={{ width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: got ? m.color + "26" : "rgba(255,255,255,0.05)" }}>
                      <MaterialIcons name={got ? m.icon : "lock"} size={24} color={got ? m.color : C.mute} />
                    </View>
                    <Text style={{ color: C.text, fontFamily: F.bold, fontSize: 14 }}>{m.title}</Text>
                    <Text style={{ color: C.mute, fontFamily: F.semi, fontSize: 11.5, lineHeight: 16 }}>{got ? `Obtenida ${DateTime.fromISO(earned.get(m.id)!).setLocale("es").toFormat("d LLL yyyy")}` : m.desc}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Trayectoria */}
        <View>
          <SectionHead title="Mi trayectoria" />
          {pit.done.length === 0 ? (
            <Card><P>Tu trayectoria aparecerá aquí con cada acción que completes.</P></Card>
          ) : (
            <View style={{ paddingLeft: 8 }}>
              {pit.done.slice(0, 8).map((e, i, arr) => {
                const c = byId(e.refId);
                const title = c?.title ?? (e.refType === "challenge" ? ({ c1: "Caminata de 1 km", c2: "Día sin plástico", c3: "Respiración guiada", c4: "8 vasos de agua" } as Record<string, string>)[e.refId] ?? "Reto" : "Actividad");
                const color = c ? CAT[c.category].color : C.lilac;
                return (
                  <View key={i} style={{ flexDirection: "row", gap: 14 }}>
                    <View style={{ alignItems: "center" }}>
                      <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: color, marginTop: 4 }} />
                      {i < arr.length - 1 ? <View style={{ width: 2, flex: 1, backgroundColor: C.line2, marginVertical: 2 }} /> : null}
                    </View>
                    <View style={{ flex: 1, paddingBottom: 16 }}>
                      <Text style={{ color: C.mute, fontFamily: F.bold, fontSize: 11 }}>{DateTime.fromISO(e.at).setLocale("es").toFormat("d LLL · HH:mm").toUpperCase()}</Text>
                      <Text style={{ color: C.text, fontFamily: F.bold, fontSize: 15, lineHeight: 20 }}>{title}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <Card style={{ alignItems: "center", gap: 6 }}>
          <Text style={{ color: C.g1, fontFamily: F.displayItalic, fontSize: 19, textAlign: "center", lineHeight: 26 }}>"La transformación comienza cuando decides florecer."</Text>
        </Card>
      </ScrollView>
    </Screen>
  );
}
