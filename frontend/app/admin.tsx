import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { DateTime } from "luxon";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Btn, Card, Chip, Empty, H1, H2, IconBtn, P, Pill, Screen } from "../components/ui";
import { API_BASE, apiFetch } from "../constants/api";
import { C, F, catOf } from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import { useData, type Content } from "../context/DataContext";
import { adminGetUser, adminListUsers, adminUpdateUser, type AdminUserDetail, type AdminUserRow } from "../features/admin/adminApi";

type Tab = "resumen" | "usuarios" | "contenido" | "retos";
const CH: Record<string, string> = { c1: "Caminata 1 km", c2: "Sin plástico", c3: "Respiración", c4: "Hidratación" };

export default function Admin() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, token, handleUnauthorized } = useAuth();
  const { refresh } = useData();
  const [tab, setTab] = useState<Tab>("resumen");
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [all, setAll] = useState<Content[]>([]);
  const [chs, setChs] = useState<any[]>([]);
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const h = { Authorization: `Bearer ${token}` };

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setErr(null);
    const u = await adminListUsers({ apiBase: API_BASE, token, limit: 100, on401: handleUnauthorized });
    if (u.ok) setUsers(u.data.users); else setErr(u.error);
    try {
      const c = await apiFetch(`/content/admin/all`, { headers: h });
      if (c.ok) setAll(await c.json());
      const r = await apiFetch(`/admin/challenges?page=1&limit=100`, { headers: h });
      if (r.ok) setChs((await r.json()).completions ?? []);
    } catch {}
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);
  useEffect(() => { void load(); }, [load]);

  if (user?.role !== "admin") {
    return <Screen><View style={{ padding: 20 }}><IconBtn icon="arrow-back" onPress={() => router.back()} /></View><Empty icon="lock" title="Solo administradores" /></Screen>;
  }

  const patchUser = async (id: string, updates: { role?: "user" | "admin"; blocked?: boolean }) => {
    const r = await adminUpdateUser({ apiBase: API_BASE, token: token!, id, updates, on401: handleUnauthorized });
    if (!r.ok) setErr(r.error);
    await load();
  };
  const patchContent = async (c: Content, body: Partial<Content>) => {
    await apiFetch(`/content/${c._id}`, { method: "PUT", headers: { ...h, "Content-Type": "application/json" }, body: JSON.stringify(body) });
    await load();
    void refresh();
  };
  const delContent = async (c: Content) => {
    if (Platform.OS === "web" && !confirm(`¿Eliminar "${c.title}"?`)) return;
    await apiFetch(`/content/${c._id}`, { method: "DELETE", headers: h });
    await load();
    void refresh();
  };
  const open = async (id: string) => {
    const r = await adminGetUser({ apiBase: API_BASE, token: token!, id, on401: handleUnauthorized });
    if (r.ok) setDetail(r.data); else setErr(r.error);
  };

  const published = all.filter((c) => c.status === "published").length;
  const views = all.reduce((s, c) => s + (c.views || 0), 0);
  const Stat = ({ v, l, c }: { v: number | string; l: string; c: string }) => (
    <View style={{ width: "48%", padding: 16, borderRadius: 22, backgroundColor: "rgba(16,36,26,0.78)", borderWidth: 1, borderColor: C.line }}>
      <Text style={{ color: c, fontFamily: F.display, fontSize: 34 }}>{v}</Text>
      <Text style={{ color: C.mute, fontFamily: F.bold, fontSize: 12 }}>{l}</Text>
    </View>
  );

  return (
    <Screen pad={false}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 60, gap: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          <IconBtn icon="arrow-back" onPress={() => (detail ? setDetail(null) : router.back())} />
          <View><Text style={{ color: C.sun, fontFamily: F.bold, fontSize: 11, letterSpacing: 1.6 }}>ADMINISTRACIÓN</Text><H1 style={{ fontSize: 26 }}>{detail ? detail.user.name : "Panel"}</H1></View>
        </View>
        {err ? <Text style={{ color: C.coral, fontFamily: F.bold }}>{err}</Text> : null}

        {detail ? (
          <View style={{ gap: 14 }}>
            <Card><P>{detail.user.email}</P>
              <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
                <Pill label={detail.user.role} color={C.sun} />{detail.user.blocked ? <Pill label="Bloqueado" color={C.danger} /> : null}
              </View></Card>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "space-between" }}>
              <Stat v={detail.stats.streakCurrent} l="Racha actual" c={C.coral} />
              <Stat v={detail.stats.streakBest} l="Mejor racha" c={C.sun} />
              <Stat v={detail.stats.completed.article + detail.stats.completed.routine + detail.stats.completed.challenge} l="Acciones" c={C.g1} />
              <Stat v={detail.medals.length} l="Medallas" c={C.lilac} />
            </View>
            <H2>Actividad reciente</H2>
            {detail.recentEvents.slice(0, 10).map((e, i) => (
              <Text key={i} style={{ color: C.sub, fontFamily: F.semi, fontSize: 13 }}>• {e.type.replace("_", " ")} · {DateTime.fromISO(e.at).setLocale("es").toFormat("d LLL HH:mm")}</Text>
            ))}
          </View>
        ) : (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {(["resumen", "usuarios", "contenido", "retos"] as Tab[]).map((t) => <Chip key={t} label={t[0].toUpperCase() + t.slice(1)} active={tab === t} onPress={() => setTab(t)} color={C.sun} />)}
            </ScrollView>
            {loading ? <ActivityIndicator color={C.g1} /> : null}

            {tab === "resumen" && (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "space-between" }}>
                <Stat v={users.length} l="Usuarios" c={C.g1} />
                <Stat v={published} l="Contenidos publicados" c={C.sky} />
                <Stat v={views} l="Vistas totales" c={C.sun} />
                <Stat v={chs.length} l="Retos completados" c={C.lilac} />
              </View>
            )}

            {tab === "usuarios" && users.map((u) => (
              <Card key={u.id}>
                <Pressable onPress={() => void open(u.id)} style={{ gap: 4 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Text style={{ flex: 1, color: C.text, fontFamily: F.bold, fontSize: 16 }}>{u.name}</Text>
                    {u.role === "admin" ? <Pill label="Admin" color={C.sun} /> : null}
                    {u.blocked ? <Pill label="Bloqueado" color={C.danger} /> : null}
                  </View>
                  <Text style={{ color: C.mute, fontFamily: F.semi, fontSize: 12 }}>{u.email}</Text>
                </Pressable>
                {u.id !== user.id ? (
                  <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
                    <Btn small variant="ghost" title={u.blocked ? "Desbloquear" : "Bloquear"} onPress={() => void patchUser(u.id, { blocked: !u.blocked })} />
                    <Btn small variant="ghost" title={u.role === "admin" ? "Quitar admin" : "Hacer admin"} onPress={() => void patchUser(u.id, { role: u.role === "admin" ? "user" : "admin" })} />
                  </View>
                ) : null}
              </Card>
            ))}

            {tab === "contenido" && all.map((c) => (
              <Card key={c._id}>
                <View style={{ gap: 6 }}>
                  <View style={{ flexDirection: "row", gap: 8 }}><Pill label={catOf(c.category).label} color={catOf(c.category).color} /><Pill label={c.status === "published" ? "Publicado" : "Borrador"} color={c.status === "published" ? C.g1 : C.mute} /></View>
                  <Text style={{ color: C.text, fontFamily: F.bold, fontSize: 15 }}>{c.title}</Text>
                  <Text style={{ color: C.mute, fontFamily: F.semi, fontSize: 12 }}>{c.views} vistas · {c.type === "video" ? "Video" : "Lectura"}</Text>
                  <View style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
                    <Btn small variant="ghost" title={c.status === "published" ? "Pasar a borrador" : "Publicar"} onPress={() => void patchContent(c, { status: c.status === "published" ? "draft" : "published" })} />
                    <Btn small variant="ghost" title={c.isFeatured ? "Quitar destacado" : "Destacar"} onPress={() => void patchContent(c, { isFeatured: !c.isFeatured })} />
                    <Pressable onPress={() => void delContent(c)} hitSlop={8} style={{ justifyContent: "center" }}><MaterialIcons name="delete-outline" size={22} color={C.danger} /></Pressable>
                  </View>
                </View>
              </Card>
            ))}

            {tab === "retos" && (chs.length === 0 ? <Empty icon="flag" title="Sin retos completados" /> : chs.map((r, i) => (
              <Card key={i}>
                <Text style={{ color: C.text, fontFamily: F.bold, fontSize: 15 }}>{r.userName}</Text>
                <Text style={{ color: C.sub, fontFamily: F.semi, fontSize: 13 }}>{CH[r.refId] ?? r.refId}{r.distanceKm ? ` · ${Number(r.distanceKm).toFixed(2)} km` : ""}{r.source ? ` · ${r.source === "gps" ? "GPS verificado" : r.source === "manual" ? "manual" : "autorreporte"}` : ""}</Text>
                <Text style={{ color: C.mute, fontFamily: F.semi, fontSize: 11 }}>{DateTime.fromISO(r.at).setLocale("es").toFormat("d LLL yyyy · HH:mm")}</Text>
              </Card>
            )))}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
