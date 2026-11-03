import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { Image, Pressable, Text, View } from "react-native";

import { C, F, R, catOf } from "../constants/theme";
import type { Content } from "../context/DataContext";
import { thumb } from "../lib/img";
import { Pill } from "./ui";

export function useOpen() {
  const router = useRouter();
  return (id: string) => router.push(`/content/${id}` as any);
}

const typeIcon = (c: Content) => (c.type === "video" ? "play-circle-filled" : "auto-stories");

/** Tarjeta grande con imagen de fondo. */
export function HeroCard({ item, label, onPress, done, height = 230 }: { item: Content; label?: string; onPress: () => void; done?: boolean; height?: number }) {
  const cat = catOf(item.category);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.985 : 1 }] })}>
      <View style={{ height, borderRadius: R.xl, overflow: "hidden", borderWidth: 1, borderColor: C.line2 }}>
        <Image source={thumb(item.thumbnail)} style={{ position: "absolute", width: "100%", height: "100%" }} resizeMode="cover" />
        <LinearGradient colors={["rgba(6,16,11,0.05)", "rgba(6,16,11,0.55)", "rgba(6,16,11,0.96)"]} style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }} />
        <View style={{ flex: 1, justifyContent: "space-between", padding: 18 }}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {label ? <Pill solid label={label} color={C.sun} icon="bolt" /> : null}
            <Pill solid label={cat.label} color={cat.color} />
            {done ? <Pill solid label="Hecho hoy" color={C.g1} icon="check" /> : null}
          </View>
          <View style={{ gap: 6 }}>
            <Text numberOfLines={2} style={{ color: C.text, fontFamily: F.display, fontSize: 24, lineHeight: 29 }}>{item.title}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                <MaterialIcons name={typeIcon(item)} size={16} color={C.g1} />
                <Text style={{ color: C.sub, fontFamily: F.semi, fontSize: 13 }}>{item.type === "video" ? "Video" : "Lectura"} · {item.duration} min</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

/** Fila compacta. */
export function RowCard({ item, onPress, right, done }: { item: Content; onPress: () => void; right?: React.ReactNode; done?: boolean }) {
  const cat = catOf(item.category);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
      <View style={{ flexDirection: "row", gap: 14, padding: 10, borderRadius: R.lg, backgroundColor: "rgba(16,36,26,0.78)", borderWidth: 1, borderColor: C.line, alignItems: "center" }}>
        <View style={{ width: 82, height: 82, borderRadius: R.md, overflow: "hidden" }}>
          <Image source={thumb(item.thumbnail)} style={{ width: "100%", height: "100%" }} />
          {item.type === "video" ? (
            <View style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.25)" } as any}>
              <MaterialIcons name="play-arrow" size={28} color="#fff" />
            </View>
          ) : null}
        </View>
        <View style={{ flex: 1, gap: 5 }}>
          <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
            <Text style={{ color: cat.color, fontFamily: F.bold, fontSize: 11, letterSpacing: 0.6 }}>{cat.label.toUpperCase()}</Text>
            {item.isNew ? <Pill label="Nuevo" color={C.coral} /> : null}
            {done ? <MaterialIcons name="check-circle" size={14} color={C.g1} /> : null}
          </View>
          <Text numberOfLines={2} style={{ color: C.text, fontFamily: F.bold, fontSize: 15, lineHeight: 20 }}>{item.title}</Text>
          <Text style={{ color: C.mute, fontFamily: F.semi, fontSize: 12 }}>{item.type === "video" ? "Video" : "Lectura"} · {item.duration} min</Text>
        </View>
        {right}
      </View>
    </Pressable>
  );
}

/** Tarjeta vertical para carruseles. */
export function TileCard({ item, onPress, width = 176 }: { item: Content; onPress: () => void; width?: number }) {
  const cat = catOf(item.category);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ width, transform: [{ scale: pressed ? 0.97 : 1 }] })}>
      <View style={{ height: 200, borderRadius: R.lg, overflow: "hidden", borderWidth: 1, borderColor: C.line }}>
        <Image source={thumb(item.thumbnail)} style={{ position: "absolute", width: "100%", height: "100%" }} />
        <LinearGradient colors={["transparent", "rgba(6,16,11,0.95)"]} style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 130 }} />
        <View style={{ position: "absolute", left: 12, right: 12, bottom: 12, gap: 4 }}>
          <Text style={{ color: cat.color, fontFamily: F.bold, fontSize: 10.5, letterSpacing: 0.8 }}>{cat.label.toUpperCase()}</Text>
          <Text numberOfLines={3} style={{ color: C.text, fontFamily: F.bold, fontSize: 14, lineHeight: 18 }}>{item.title}</Text>
        </View>
      </View>
    </Pressable>
  );
}
