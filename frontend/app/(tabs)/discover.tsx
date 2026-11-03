import { MaterialIcons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HeroCard, RowCard, useOpen } from "../../components/ContentCard";
import { Chip, Empty, H1, P, Screen, Skeleton } from "../../components/ui";
import { C, CAT, F, R, type CategoryKey } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import { useGate } from "../../hooks/use-require-auth";

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
type Kind = "all" | "video" | "article";

export default function Explorar() {
  const open = useOpen();
  const gate = useGate();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const { contents, contentLoading, saved, toggleSave, summary } = useData();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<CategoryKey | "all">("all");
  const [kind, setKind] = useState<Kind>("all");
  const doneIds = useMemo(() => new Set(summary?.completedIds ?? []), [summary]);

  const list = useMemo(() => {
    const s = norm(q.trim());
    return contents.filter(
      (c) =>
        (cat === "all" || c.category === cat) &&
        (kind === "all" || c.type === kind) &&
        (!s || norm(`${c.title} ${c.description}`).includes(s)),
    );
  }, [contents, q, cat, kind]);

  const filtering = q.trim() || cat !== "all" || kind !== "all";
  const hero = contents.find((c) => c.isFeatured);

  return (
    <Screen pad={false}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 130, paddingHorizontal: 20, gap: 18 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={{ gap: 4 }}>
          <Text style={{ color: C.g1, fontFamily: F.bold, fontSize: 12, letterSpacing: 1.6 }}>EXPLORAR</Text>
          <H1>¿Qué quieres cultivar hoy?</H1>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: R.pill, paddingHorizontal: 16, borderWidth: 1, borderColor: C.line2 }}>
          <MaterialIcons name="search" size={20} color={C.mute} />
          <TextInput value={q} onChangeText={setQ} placeholder="Busca hábitos, rutinas, retos…" placeholderTextColor={C.mute} style={{ flex: 1, color: C.text, fontFamily: F.semi, fontSize: 15, paddingVertical: 14, outlineStyle: "none" } as any} />
          {q ? <Pressable onPress={() => setQ("")} hitSlop={10}><MaterialIcons name="close" size={18} color={C.mute} /></Pressable> : null}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          <Chip label="Todo" active={cat === "all"} onPress={() => setCat("all")} />
          {(Object.keys(CAT) as CategoryKey[]).map((k) => (
            <Chip key={k} label={CAT[k].label} icon={CAT[k].icon as any} color={CAT[k].color} active={cat === k} onPress={() => setCat(k)} />
          ))}
        </ScrollView>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Chip label="Todos los formatos" active={kind === "all"} onPress={() => setKind("all")} color={C.sub} />
          <Chip label="Videos" icon="play-circle-outline" active={kind === "video"} onPress={() => setKind("video")} color={C.sub} />
          <Chip label="Lecturas" icon="auto-stories" active={kind === "article"} onPress={() => setKind("article")} color={C.sub} />
        </View>

        {contentLoading ? (
          <View style={{ gap: 10 }}><Skeleton h={96} /><Skeleton h={96} /><Skeleton h={96} /></View>
        ) : (
          <>
            {!filtering && hero ? <HeroCard item={hero} label="DESTACADO" height={210} onPress={() => open(hero._id)} /> : null}
            <Text style={{ color: C.mute, fontFamily: F.bold, fontSize: 12, letterSpacing: 1 }}>{list.length} {list.length === 1 ? "RESULTADO" : "RESULTADOS"}</Text>
            {list.length === 0 ? (
              <Empty icon="search-off" title="Nada por aquí todavía" text="Prueba con otra palabra o quita algún filtro." />
            ) : (
              <View style={{ gap: 10 }}>
                {list.map((c) => {
                  const isSaved = saved.includes(c._id);
                  return (
                    <RowCard key={c._id} item={c} done={doneIds.has(c._id)} onPress={() => open(c._id)} right={
                      <Pressable hitSlop={10} onPress={() => gate(() => void toggleSave(c._id))}>
                        <MaterialIcons name={isSaved && isAuthenticated ? "bookmark" : "bookmark-border"} size={24} color={isSaved && isAuthenticated ? C.g1 : C.mute} />
                      </Pressable>
                    } />
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
