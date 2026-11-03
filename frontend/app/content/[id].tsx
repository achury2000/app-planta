import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Image, Platform, Pressable, ScrollView, Share, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import YoutubePlayer from "react-native-youtube-iframe";

import { Bar, Btn, Card, H1, H2, IconBtn, P, Pill, Screen } from "../../components/ui";
import { C, F, R, catOf } from "../../constants/theme";
import { apiFetch } from "../../constants/api";
import { useAuth } from "../../context/AuthContext";
import { useData, type Content } from "../../context/DataContext";
import { useGate } from "../../hooks/use-require-auth";
import { thumb } from "../../lib/img";

/* ── Slides ── */
type Slide =
  | { kind: "cover" }
  | { kind: "text"; text: string }
  | { kind: "steps"; items: string[] }
  | { kind: "quiz"; q: number }
  | { kind: "end" };

const LIST = /^(?:[-*•]\s+|\d+[.)]\s+)/;

function buildSlides(c: Content): Slide[] {
  const out: Slide[] = [{ kind: "cover" }];
  const blocks = String(c.body || "").split(/\n\s*\n/).map((b) => b.split("\n").map((l) => l.trim()).filter(Boolean)).filter((b) => b.length);
  for (const b of blocks) {
    if (b.length > 1 && b.every((l) => LIST.test(l))) out.push({ kind: "steps", items: b.map((l) => l.replace(LIST, "")) });
    else out.push({ kind: "text", text: b.join(" ") });
  }
  (c.quiz ?? []).forEach((_, q) => out.push({ kind: "quiz", q }));
  out.push({ kind: "end" });
  return out;
}

/* ── Video ── */
function VideoView({ c }: { c: Content }) {
  const [w, setW] = useState(0);
  const id = c.youtubeId;
  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ borderRadius: R.lg, overflow: "hidden", backgroundColor: "#000", borderWidth: 1, borderColor: C.line2 }}>
      {id && w > 0 ? (
        Platform.OS === "web" ? (
          // @ts-ignore iframe solo en web
          <iframe src={`https://www.youtube.com/embed/${id}`} style={{ width: w, height: (w * 9) / 16, border: "none" }} allow="autoplay; encrypted-media; fullscreen" allowFullScreen />
        ) : (
          <YoutubePlayer height={(w * 9) / 16} width={w} videoId={id} />
        )
      ) : (
        <Image source={thumb(c.thumbnail)} style={{ width: "100%", height: 200 }} />
      )}
    </View>
  );
}

export default function ContentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const gate = useGate();
  const { token, isAuthenticated } = useAuth();
  const { byId, record, trackProgress, saved, toggleSave, summary } = useData();

  const [item, setItem] = useState<Content | null>(byId(String(id)) ?? null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await apiFetch(`/content/${id}`, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
        if (!alive) return;
        if (res.ok) setItem(await res.json());
        else if (!item) setMissing(true);
      } catch {
        if (alive && !item) setMissing(true);
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token]);

  if (!item) {
    return (
      <Screen>
        <View style={{ padding: 20 }}><IconBtn icon="arrow-back" onPress={() => router.back()} /></View>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12 }}>
          {missing ? <><MaterialIcons name="error-outline" size={40} color={C.mute} /><P>No encontramos este contenido.</P></> : <ActivityIndicator color={C.g1} />}
        </View>
      </Screen>
    );
  }
  const isSaved = saved.includes(item._id);
  const done = (summary?.completedIds ?? []).includes(item._id);
  const common = {
    item,
    onBack: () => router.back(),
    onSave: () => gate(() => void toggleSave(item._id)),
    isSaved: isSaved && isAuthenticated,
    done,
    isAuthenticated,
    record,
    trackProgress,
    insetsTop: insets.top,
    insetsBottom: insets.bottom,
    goLogin: () => router.push("/auth"),
  };
  return item.type === "video" ? <VideoScreen {...common} /> : <ReaderScreen {...common} />;
}

type Common = {
  item: Content; onBack: () => void; onSave: () => void; isSaved: boolean; done: boolean; isAuthenticated: boolean;
  record: ReturnType<typeof useData>["record"]; trackProgress: ReturnType<typeof useData>["trackProgress"];
  insetsTop: number; insetsBottom: number; goLogin: () => void;
};

/* ── Pantalla de video ── */
function VideoScreen({ item, onBack, onSave, isSaved, done, isAuthenticated, record, insetsTop, goLogin }: Common) {
  const cat = catOf(item.category);
  const [state, setState] = useState<"idle" | "busy" | "done">(done ? "done" : "idle");
  const started = useRef(false);
  useEffect(() => {
    if (isAuthenticated && !started.current) {
      started.current = true;
      void record("routine_started", "routine", item._id);
    }
  }, [isAuthenticated, item._id, record]);
  return (
    <Screen pad={false}>
      <ScrollView contentContainerStyle={{ paddingTop: insetsTop + 12, paddingHorizontal: 20, paddingBottom: 60, gap: 18 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <IconBtn icon="arrow-back" onPress={onBack} />
          <View style={{ flexDirection: "row", gap: 10 }}>
            <IconBtn icon="ios-share" onPress={() => void Share.share({ message: `${item.title} — Planta de Transformación` }).catch(() => {})} />
            <IconBtn icon={isSaved ? "bookmark" : "bookmark-border"} color={isSaved ? C.g1 : C.text} onPress={onSave} />
          </View>
        </View>
        <VideoView c={item} />
        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pill label={cat.label} color={cat.color} />
            <Pill label={`${item.duration} min`} color={C.sub} icon="schedule" />
          </View>
          <H1 style={{ fontSize: 28, lineHeight: 34 }}>{item.title}</H1>
          <P>{item.description}</P>
        </View>
        <Card glow={C.g1}>
          <View style={{ gap: 12 }}>
            <H2>¿Terminaste la rutina?</H2>
            <P>Márcala como completada para sumar a tu racha y hacer crecer tu planta.</P>
            {!isAuthenticated ? <Btn title="Inicia sesión para registrar" icon="lock-open" onPress={goLogin} /> : (
              <Btn title={state === "done" ? "Rutina registrada" : "Marcar como completada"} icon={state === "done" ? "check-circle" : "check"} disabled={state === "done"} loading={state === "busy"} onPress={async () => { setState("busy"); const r = await record("routine_completed", "routine", item._id, { duration: item.duration * 60 }); setState(r.ok ? "done" : "idle"); }} />
            )}
          </View>
        </Card>
      </ScrollView>
    </Screen>
  );
}

/* ── Lector tipo historias ── */
function ReaderScreen({ item, onBack, onSave, isSaved, isAuthenticated, record, trackProgress, insetsTop, insetsBottom, goLogin }: Common) {
  const cat = catOf(item.category);
  const slides = useMemo(() => buildSlides(item), [item]);
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [finishState, setFinishState] = useState<"idle" | "busy" | "ok" | "guest" | "err">("idle");
  const sentEnd = useRef(false);
  const started = useRef(false);
  const total = slides.length;
  const slide = slides[i];
  const quizTotal = item.quiz?.length ?? 0;
  const correct = (item.quiz ?? []).reduce((n, q, k) => n + (answers[k] === q.correctIndex ? 1 : 0), 0);

  // Reanudar donde lo dejó
  const { token } = useAuth();
  useEffect(() => {
    if (!token) return;
    apiFetch(`/activity/article/${item._id}/in-progress`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((j) => { if (j?.found && j.lastSeenIndex > 0 && j.lastSeenIndex < total - 1) setI(j.lastSeenIndex); })
      .catch(() => {});
  }, [token, item._id, total]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!started.current) { started.current = true; void record("article_started", "article", item._id); }
    if (i > 0 && i < total - 1) trackProgress("article", item._id, { slideIndex: i });
  }, [i, isAuthenticated, item._id, record, trackProgress, total]);

  const finish = useCallback(async () => {
    if (sentEnd.current) return;
    if (!isAuthenticated) return setFinishState("guest");
    sentEnd.current = true;
    setFinishState("busy");
    if (quizTotal) await record("quiz_submitted", "quiz", item._id, { score: correct, total: quizTotal });
    const r = await record("article_completed", "article", item._id, { quizScore: correct, quizTotal });
    setFinishState(r.ok ? "ok" : "err");
    if (!r.ok) sentEnd.current = false;
  }, [isAuthenticated, quizTotal, correct, record, item._id]);

  useEffect(() => { if (slide.kind === "end") void finish(); }, [slide.kind, finish]);

  const canNext = slide.kind !== "quiz" || answers[slide.q] !== undefined;

  return (
    <Screen pad={false} tint={cat.color}>
      {/* Barra de progreso tipo historias */}
      <View style={{ paddingTop: insetsTop + 10, paddingHorizontal: 16, gap: 12 }}>
        <View style={{ flexDirection: "row", gap: 4 }}>
          {slides.map((_, k) => (
            <View key={k} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: k <= i ? cat.color : "rgba(255,255,255,0.14)" }} />
          ))}
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <IconBtn icon="close" onPress={onBack} />
          <Text numberOfLines={1} style={{ flex: 1, textAlign: "center", color: C.mute, fontFamily: F.bold, fontSize: 12, marginHorizontal: 10 }}>{cat.label.toUpperCase()} · {i + 1}/{total}</Text>
          <IconBtn icon={isSaved ? "bookmark" : "bookmark-border"} color={isSaved ? C.g1 : C.text} onPress={onSave} />
        </View>
      </View>

      <ScrollView key={i} contentContainerStyle={{ flexGrow: 1, padding: 22, justifyContent: "center", gap: 18 }} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(320)} style={{ gap: 18 }}>
          {slide.kind === "cover" && (
            <>
              <View style={{ height: 250, borderRadius: R.xl, overflow: "hidden", borderWidth: 1, borderColor: C.line2 }}>
                <Image source={thumb(item.thumbnail)} style={{ width: "100%", height: "100%" }} />
                <LinearGradient colors={["transparent", "rgba(6,16,11,0.6)"]} style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 100 }} />
              </View>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Pill label={cat.label} color={cat.color} />
                <Pill label={`${item.duration} min`} color={C.sub} icon="schedule" />
                {quizTotal ? <Pill label="Con quiz" color={C.sun} icon="quiz" /> : null}
              </View>
              <H1 style={{ fontSize: 31, lineHeight: 37 }}>{item.title}</H1>
              <P style={{ fontSize: 16, lineHeight: 24 }}>{item.description}</P>
            </>
          )}
          {slide.kind === "text" && (
            <Text style={{ color: C.text, fontFamily: F.display, fontSize: 26, lineHeight: 36 }}>{slide.text}</Text>
          )}
          {slide.kind === "steps" && (
            <>
              <Text style={{ color: cat.color, fontFamily: F.bold, fontSize: 12, letterSpacing: 1.6 }}>TU PLAN DE ACCIÓN</Text>
              <View style={{ gap: 10 }}>
                {slide.items.map((s, k) => {
                  const key = `${i}-${k}`;
                  const on = !!checked[key];
                  return (
                    <Pressable key={key} onPress={() => setChecked((c) => ({ ...c, [key]: !c[key] }))}>
                      <View style={{ flexDirection: "row", gap: 14, alignItems: "center", padding: 16, borderRadius: R.lg, backgroundColor: on ? cat.color + "1F" : "rgba(16,36,26,0.78)", borderWidth: 1, borderColor: on ? cat.color : C.line }}>
                        <View style={{ width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: on ? cat.color : "transparent", borderWidth: on ? 0 : 2, borderColor: C.line2 }}>
                          {on ? <MaterialIcons name="check" size={18} color={C.ink} /> : <Text style={{ color: C.mute, fontFamily: F.bold, fontSize: 13 }}>{k + 1}</Text>}
                        </View>
                        <Text style={{ flex: 1, color: C.text, fontFamily: F.semi, fontSize: 16, lineHeight: 23, textDecorationLine: on ? "line-through" : "none", opacity: on ? 0.7 : 1 }}>{s}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}
          {slide.kind === "quiz" && (() => {
            const q = item.quiz![slide.q];
            const picked = answers[slide.q];
            return (
              <>
                <Text style={{ color: C.sun, fontFamily: F.bold, fontSize: 12, letterSpacing: 1.6 }}>QUIZ · PREGUNTA {slide.q + 1} DE {quizTotal}</Text>
                <Text style={{ color: C.text, fontFamily: F.display, fontSize: 24, lineHeight: 32 }}>{q.question}</Text>
                <View style={{ gap: 10 }}>
                  {q.options.map((o, k) => {
                    const answered = picked !== undefined;
                    const isRight = k === q.correctIndex;
                    const isPicked = picked === k;
                    const col = !answered ? C.line2 : isRight ? C.g1 : isPicked ? C.danger : C.line;
                    return (
                      <Pressable key={k} disabled={answered} onPress={() => setAnswers((a) => ({ ...a, [slide.q]: k }))}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: R.lg, borderWidth: 1.5, borderColor: col, backgroundColor: answered && isRight ? C.g1 + "1F" : answered && isPicked ? C.danger + "1A" : "rgba(16,36,26,0.78)" }}>
                          <Text style={{ flex: 1, color: C.text, fontFamily: F.semi, fontSize: 15, lineHeight: 22 }}>{o}</Text>
                          {answered && isRight ? <MaterialIcons name="check-circle" size={22} color={C.g1} /> : answered && isPicked ? <MaterialIcons name="cancel" size={22} color={C.danger} /> : null}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
                {picked !== undefined ? (
                  <Animated.View entering={FadeIn}>
                    <Card glow={picked === q.correctIndex ? C.g1 : C.coral}>
                      <Text style={{ color: picked === q.correctIndex ? C.g1 : C.coral, fontFamily: F.xbold, fontSize: 14, marginBottom: 4 }}>{picked === q.correctIndex ? "¡Correcto!" : "Casi."}</Text>
                      <P style={{ color: C.text }}>{q.explanation || (picked === q.correctIndex ? "Bien leído." : `La respuesta era: ${q.options[q.correctIndex]}`)}</P>
                    </Card>
                  </Animated.View>
                ) : null}
              </>
            );
          })()}
          {slide.kind === "end" && (
            <View style={{ alignItems: "center", gap: 14, paddingVertical: 10 }}>
              <View style={{ width: 110, height: 110, borderRadius: 55, backgroundColor: C.g1 + "22", borderWidth: 2, borderColor: C.g1, alignItems: "center", justifyContent: "center" }}>
                <MaterialIcons name="eco" size={56} color={C.g1} />
              </View>
              <H1 style={{ textAlign: "center" }}>¡Lectura completada!</H1>
              {quizTotal ? <Text style={{ color: C.sun, fontFamily: F.xbold, fontSize: 20 }}>Quiz: {correct}/{quizTotal}</Text> : null}
              {finishState === "busy" ? <ActivityIndicator color={C.g1} /> : null}
              {finishState === "ok" ? <P style={{ textAlign: "center" }}>Tu planta recibió agua. Tu progreso quedó registrado.</P> : null}
              {finishState === "guest" ? <><P style={{ textAlign: "center" }}>Inicia sesión para guardar tu progreso y sumar a tu racha.</P><Btn title="Iniciar sesión" icon="login" onPress={goLogin} /></> : null}
              {finishState === "err" ? <><P style={{ textAlign: "center", color: C.coral }}>No pudimos registrar tu progreso.</P><Btn title="Reintentar" variant="ghost" onPress={() => void finish()} /></> : null}
              <Btn title="Volver" variant="soft" onPress={onBack} style={{ marginTop: 6 }} />
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {slide.kind !== "end" ? (
        <View style={{ flexDirection: "row", gap: 12, paddingHorizontal: 20, paddingBottom: insetsBottom + 16, paddingTop: 8 }}>
          <Btn title="Atrás" variant="ghost" disabled={i === 0} onPress={() => setI((x) => Math.max(0, x - 1))} style={{ flex: 1 }} />
          <Btn title={i === total - 2 ? "Finalizar" : "Siguiente"} icon="arrow-forward" disabled={!canNext} onPress={() => setI((x) => Math.min(total - 1, x + 1))} style={{ flex: 2 }} />
        </View>
      ) : null}
    </Screen>
  );
}
