import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Plant } from "../components/Plant";
import { Chip, IconBtn, Screen } from "../components/ui";
import { apiFetch } from "../constants/api";
import { C, F, R, catOf } from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import { clearOrqConversation, getOrqConversation, saveOrqConversation, type StoredSource } from "../lib/orqStorage";

type Msg = { id: string; author: "orq" | "user"; text: string; sources?: StoredSource[]; error?: boolean; retry?: string };

const WELCOME: Msg = { id: "welcome", author: "orq", text: "Hola, soy ORQ, tu guía en Planta. Puedo recomendarte contenido, explicarte los retos o ayudarte a retomar tu racha. ¿Por dónde empezamos?" };
const SUGGEST = ["¿Qué puedo aprender hoy?", "¿Cómo va mi racha?", "Quiero bajar el estrés", "Rutina de fuerza en casa", "¿Cómo funcionan los retos?"];

function Dots() {
  const [n, setN] = useState(0);
  useEffect(() => { const id = setInterval(() => setN((x) => (x + 1) % 4), 350); return () => clearInterval(id); }, []);
  return <Text style={{ color: C.g1, fontFamily: F.xbold, fontSize: 22, letterSpacing: 2 }}>{"•".repeat(n || 1)}</Text>;
}

export default function Orq() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, token } = useAuth();
  const scope = user?.id ?? "anon";
  const [msgs, setMsgs] = useState<Msg[]>([WELCOME]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [ready, setReady] = useState(false);
  const list = useRef<FlatList<Msg>>(null);

  useEffect(() => {
    let alive = true;
    getOrqConversation(scope).then((s) => { if (alive) { if (s?.length) setMsgs(s); setReady(true); } });
    return () => { alive = false; };
  }, [scope]);
  useEffect(() => {
    if (ready) void saveOrqConversation(scope, msgs.map(({ id, author, text, sources }) => ({ id, author, text, sources })));
  }, [msgs, ready, scope]);

  const send = useCallback(async (raw?: string) => {
    const text = (raw ?? draft).trim();
    if (!text || sending) return;
    setMsgs((m) => [...m.filter((x) => !x.error), { id: `u${Date.now()}`, author: "user", text }]);
    setDraft("");
    setSending(true);
    try {
      const res = await apiFetch(`/orq/chat`, { method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ message: text }) }, 40000);
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "ORQ no pudo responder.");
      setMsgs((m) => [...m, { id: `o${Date.now()}`, author: "orq", text: j.answer, sources: j.sources }]);
    } catch (e: any) {
      setMsgs((m) => [...m, { id: `e${Date.now()}`, author: "orq", text: e?.message || "No pude conectarme ahora mismo.", error: true, retry: text }]);
    } finally {
      setSending(false);
    }
  }, [draft, sending, token]);

  useEffect(() => { setTimeout(() => list.current?.scrollToEnd({ animated: true }), 80); }, [msgs, sending]);
  const fresh = msgs.length <= 1;
  const data = useMemo(() => msgs, [msgs]);

  return (
    <Screen tint={C.lilac}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 8, gap: 12 }}>
        <IconBtn icon="expand-more" onPress={() => router.back()} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: C.text, fontFamily: F.display, fontSize: 22 }}>ORQ</Text>
          <Text style={{ color: C.g1, fontFamily: F.bold, fontSize: 11 }}>● Tu guía de hábitos</Text>
        </View>
        <IconBtn icon="delete-outline" onPress={async () => { await clearOrqConversation(scope); setMsgs([WELCOME]); }} />
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <FlatList
          ref={list}
          data={data}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 20 }}
          ListHeaderComponent={fresh ? <View style={{ alignItems: "center", marginBottom: 4 }}><Plant stage={2} size={150} /></View> : null}
          renderItem={({ item: m }) => (
            <Animated.View entering={FadeInUp.duration(260)} style={{ alignItems: m.author === "user" ? "flex-end" : "flex-start", gap: 8 }}>
              <View style={{ maxWidth: "86%", padding: 14, borderRadius: 20, borderBottomRightRadius: m.author === "user" ? 6 : 20, borderBottomLeftRadius: m.author === "orq" ? 6 : 20, backgroundColor: m.author === "user" ? C.g2 : m.error ? "rgba(255,127,97,0.14)" : "rgba(23,50,34,0.9)", borderWidth: m.author === "user" ? 0 : 1, borderColor: m.error ? C.coral : C.line }}>
                <Text style={{ color: m.author === "user" ? C.ink : C.text, fontFamily: m.author === "user" ? F.bold : F.semi, fontSize: 15, lineHeight: 22 }}>{m.text}</Text>
              </View>
              {m.retry ? <Chip label="Reintentar" icon="refresh" onPress={() => void send(m.retry)} color={C.coral} /> : null}
              {m.sources?.length ? (
                <View style={{ gap: 8, width: "86%" }}>
                  {m.sources.map((s) => {
                    const cat = catOf(s.category);
                    return (
                      <Pressable key={s.id} onPress={() => router.push(`/content/${s.id}` as any)}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: R.md, backgroundColor: "rgba(16,36,26,0.9)", borderWidth: 1, borderColor: cat.color + "55" }}>
                          <MaterialIcons name={s.type === "video" ? "play-circle-filled" : "auto-stories"} size={24} color={cat.color} />
                          <View style={{ flex: 1 }}>
                            <Text numberOfLines={2} style={{ color: C.text, fontFamily: F.bold, fontSize: 13.5 }}>{s.title}</Text>
                            <Text style={{ color: cat.color, fontFamily: F.bold, fontSize: 10.5 }}>{cat.label.toUpperCase()}</Text>
                          </View>
                          <MaterialIcons name="arrow-forward" size={18} color={C.mute} />
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}
            </Animated.View>
          )}
          ListFooterComponent={sending ? <View style={{ alignSelf: "flex-start", paddingHorizontal: 16, paddingVertical: 4, borderRadius: 18, backgroundColor: "rgba(23,50,34,0.9)" }}><Dots /></View> : null}
        />
        {fresh ? (
          <View style={{ paddingHorizontal: 16, paddingBottom: 8, flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {SUGGEST.map((s) => <Chip key={s} label={s} onPress={() => void send(s)} />)}
          </View>
        ) : null}
        <View style={{ flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingTop: 8, paddingBottom: insets.bottom + 12, alignItems: "flex-end" }}>
          <TextInput value={draft} onChangeText={setDraft} placeholder="Pregúntale a ORQ…" placeholderTextColor={C.mute} multiline maxLength={500} onSubmitEditing={() => void send()} blurOnSubmit style={{ flex: 1, maxHeight: 110, color: C.text, fontFamily: F.semi, fontSize: 15, backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 22, paddingHorizontal: 18, paddingVertical: 12, borderWidth: 1, borderColor: C.line2, outlineStyle: "none" } as any} />
          <Pressable onPress={() => void send()} disabled={!draft.trim() || sending} style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: draft.trim() && !sending ? C.g1 : "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center" }}>
            <MaterialIcons name="arrow-upward" size={24} color={draft.trim() && !sending ? C.ink : C.mute} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
