import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { DateTime } from "luxon";
import React, { useCallback, useMemo, useState } from "react";
import { Image, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HeroCard, RowCard, TileCard, useOpen } from "../../components/ContentCard";
import { Plant } from "../../components/Plant";
import { Bar, Btn, Card, H1, H2, IconBtn, P, Pill, Ring, Screen, SectionHead, Skeleton } from "../../components/ui";
import { C, F, R, catOf } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";
import { DAILY_GOAL, useData } from "../../context/DataContext";
import { thumb } from "../../lib/img";

const DAYS = ["L", "M", "X", "J", "V", "S", "D"];

function greeting() {
  const h = DateTime.now().setZone("America/Bogota").hour;
  return h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
}

export default function Hoy() {
  const router = useRouter();
  const open = useOpen();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated } = useAuth();
  const { contents, contentLoading, summary, inProgress, events, stage, totalDone, demo, checkin, refresh, byId } = useData();
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));

  const doneIds = useMemo(() => new Set(summary?.completedIds ?? []), [summary]);
  const todayDone = summary?.today.localDate === DateTime.now().setZone("America/Bogota").toISODate() ? summary?.today.completed ?? 0 : 0;
  const streak = summary?.streak.current ?? 0;

  /** Acción del día: rota entre lo que aún no completaste. */
  const daily = useMemo(() => {
    const pool = contents.filter((c) => !doneIds.has(c._id));
    const base = pool.length ? pool : contents;
    if (!base.length) return null;
    const d = Math.floor(Date.now() / 86400000);
    return base[d % base.length];
  }, [contents, doneIds]);

  const week = useMemo(() => {
    const now = DateTime.now().setZone("America/Bogota");
    const active = new Set(events.filter((e) => e.type.endsWith("_completed")).map((e) => e.localDate));
    const monday = now.startOf("week");
    return Array.from({ length: 7 }).map((_, i) => {
      const d = monday.plus({ days: i });
      const iso = d.toISODate()!;
      return { label: DAYS[i], done: active.has(iso), today: iso === now.toISODate(), future: d > now };
    });
  }, [events]);

  const featured = contents.filter((c) => c.isFeatured && c._id !== daily?._id);
  const fresh = contents.filter((c) => c.isNew);
  const first = (user?.name ?? "").split(" ")[0];

  return (
    <Screen pad={false}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 10, paddingBottom: 130, paddingHorizontal: 20, gap: 22 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} tintColor={C.g1} onRefresh={async () => { setRefreshing(true); await refresh(); setRefreshing(false); }} />}
      >
        {/* Cabecera */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Pressable onPress={() => router.push(isAuthenticated ? "/profile-edit" : "/auth")}>
            <View style={{ width: 46, height: 46, borderRadius: 23, overflow: "hidden", backgroundColor: C.surface2, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: C.g1 + "88" }}>
              {user?.avatar ? <Image source={{ uri: user.avatar }} style={{ width: "100%", height: "100%" }} /> : <Text style={{ color: C.g1, fontFamily: F.display, fontSize: 20 }}>{(first || "P")[0].toUpperCase()}</Text>}
            </View>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ color: C.mute, fontFamily: F.semi, fontSize: 12 }}>{greeting()}</Text>
            <Text style={{ color: C.text, fontFamily: F.display, fontSize: 22 }} numberOfLines={1}>{first ? first : "Bienvenido"}</Text>
          </View>
          {demo ? <Pill label="Demo" color={C.sun} icon="science" /> : null}
          <IconBtn icon="auto-awesome" color={C.g1} onPress={() => router.push("/orq")} />
        </View>

        {/* Planta viva */}
        <Card glow={C.g1} style={{ padding: 0 }}>
          <View style={{ padding: 18, gap: 4 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
              <View style={{ gap: 6, flex: 1 }}>
                <Pill label={`Etapa ${stage.index + 1} · ${stage.stage.name}`} color={C.g1} icon="eco" />
                <H2 style={{ fontSize: 24, lineHeight: 30, marginTop: 4 }}>{isAuthenticated ? "Tu planta está creciendo" : "Planta tu primera semilla"}</H2>
                <P>{isAuthenticated ? stage.stage.hint : "Crea tu cuenta y cada acción hará crecer tu planta, tu racha y tu PIT."}</P>
              </View>
            </View>
          </View>
          <View style={{ alignItems: "center", marginTop: -6 }}>
            <Plant stage={stage.index} size={230} />
          </View>
          <View style={{ padding: 18, paddingTop: 0, gap: 14 }}>
            {isAuthenticated ? (
              <>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                  <Ring size={74} stroke={8} pct={todayDone / DAILY_GOAL}>
                    <Text style={{ color: C.text, fontFamily: F.xbold, fontSize: 18 }}>{Math.min(todayDone, DAILY_GOAL)}/{DAILY_GOAL}</Text>
                  </Ring>
                  <View style={{ flex: 1, gap: 8 }}>
                    <Text style={{ color: C.text, fontFamily: F.bold, fontSize: 15 }}>{todayDone >= DAILY_GOAL ? "¡Meta diaria cumplida!" : `Meta de hoy: ${DAILY_GOAL} acciones`}</Text>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <Pill label={`${streak} ${streak === 1 ? "día" : "días"} de racha`} color={C.coral} icon="local-fire-department" />
                      <Pill label={`${totalDone} acciones`} color={C.sky} icon="bolt" />
                    </View>
                  </View>
                </View>
                <View style={{ gap: 6 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ color: C.mute, fontFamily: F.semi, fontSize: 12 }}>{stage.next ? `Siguiente: ${stage.next.name}` : "Etapa máxima"}</Text>
                    <Text style={{ color: C.mute, fontFamily: F.semi, fontSize: 12 }}>{stage.next ? `${stage.next.min - totalDone} acciones` : "🌸"}</Text>
                  </View>
                  <Bar pct={stage.pct} color={C.g1} />
                </View>
                {/* Semana */}
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 2 }}>
                  {week.map((d, i) => (
                    <View key={i} style={{ alignItems: "center", gap: 6 }}>
                      <View style={{ width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: d.done ? C.g1 : "rgba(255,255,255,0.05)", borderWidth: d.today ? 1.5 : 0, borderColor: C.g1 }}>
                        {d.done ? <MaterialIcons name="check" size={18} color={C.ink} /> : <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: d.future ? C.line2 : C.mute }} />}
                      </View>
                      <Text style={{ color: d.today ? C.g1 : C.mute, fontFamily: F.bold, fontSize: 11 }}>{d.label}</Text>
                    </View>
                  ))}
                </View>
              </>
            ) : (
              <Btn title="Crear mi planta" icon="eco" onPress={() => router.push("/auth")} />
            )}
          </View>
        </Card>

        {/* Check-in */}
        {isAuthenticated && !checkin ? (
          <Card onPress={() => router.push("/pit")} glow={C.sky}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
              <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: C.sky + "22", alignItems: "center", justifyContent: "center" }}>
                <MaterialIcons name="monitor-heart" size={24} color={C.sky} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: C.text, fontFamily: F.bold, fontSize: 15 }}>Actualiza tu vector de estado</Text>
                <P>20 segundos: estrés, enfoque y energía de hoy.</P>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={C.mute} />
            </View>
          </Card>
        ) : null}

        {/* Acción del día */}
        {contentLoading ? <Skeleton h={230} /> : daily ? (
          <View>
            <SectionHead title="Tu acción del día" />
            <HeroCard item={daily} label="HOY" done={doneIds.has(daily._id)} onPress={() => open(daily._id)} />
          </View>
        ) : null}

        {/* Continuar */}
        {isAuthenticated && inProgress.filter((x) => x.refType !== "challenge").length ? (
          <View>
            <SectionHead title="Continúa donde lo dejaste" />
            <View style={{ gap: 10 }}>
              {inProgress.filter((x) => x.refType !== "challenge").slice(0, 3).map((it) => {
                const c = byId(it.refId);
                if (!c) return null;
                const pct = it.percent ?? (c.quiz?.length || c.body ? Math.min(1, ((it.furthestIndex ?? 0) + 1) / 6) * 100 : 20);
                return (
                  <RowCard key={it.refId} item={c} onPress={() => open(c._id)} right={
                    <View style={{ width: 44, alignItems: "center" }}>
                      <Ring size={40} stroke={4} pct={pct / 100}><Text style={{ color: C.text, fontFamily: F.bold, fontSize: 10 }}>{Math.round(pct)}%</Text></Ring>
                    </View>
                  } />
                );
              })}
            </View>
          </View>
        ) : null}

        {/* Recomendado */}
        {featured.length ? (
          <View>
            <SectionHead title="Recomendado para ti" action="Ver todo" onAction={() => router.push("/discover")} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 20 }}>
              {featured.map((c) => <TileCard key={c._id} item={c} onPress={() => open(c._id)} />)}
            </ScrollView>
          </View>
        ) : null}

        {fresh.length ? (
          <View>
            <SectionHead title="Recién llegado" />
            <View style={{ gap: 10 }}>
              {fresh.slice(0, 3).map((c) => <RowCard key={c._id} item={c} done={doneIds.has(c._id)} onPress={() => open(c._id)} />)}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
