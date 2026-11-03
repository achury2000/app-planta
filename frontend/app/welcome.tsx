import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import { FlatList, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Plant } from "../components/Plant";
import { Btn, Screen } from "../components/ui";
import { C, F } from "../constants/theme";

const PAGES = [
  { stage: 0, kicker: "BIENVENIDO", title: "Todo bosque empieza con una semilla", text: "Planta de Transformación convierte tus hábitos en algo que puedes ver crecer." },
  { stage: 3, kicker: "ACCIONES REALES", title: "Lee, muévete, respira, camina", text: "Cada lectura, rutina o reto que completas riega tu planta y alimenta tu racha." },
  { stage: 5, kicker: "TU PIT", title: "Una hoja de vida que respira", text: "Tu Planta Individual de Transformación muestra tu estado real hoy: constancia, enfoque, resiliencia y calma." },
];

export default function Welcome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [i, setI] = useState(0);
  const ref = useRef<FlatList>(null);

  const finish = async (to: "/" | "/auth") => {
    try { await AsyncStorage.setItem("planta_onboarded_v2", "1"); } catch {}
    router.replace(to as any);
  };

  return (
    <Screen pad={false}>
      <FlatList
        ref={ref}
        data={PAGES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, k) => String(k)}
        onMomentumScrollEnd={(e) => setI(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => (
          <View style={{ width, paddingTop: insets.top + 50, paddingHorizontal: 28, alignItems: "center", gap: 14 }}>
            <Plant stage={item.stage} size={Math.min(300, width - 60)} />
            <Text style={{ color: C.g1, fontFamily: F.bold, fontSize: 12, letterSpacing: 2, marginTop: 10 }}>{item.kicker}</Text>
            <Text style={{ color: C.text, fontFamily: F.display, fontSize: 31, lineHeight: 38, textAlign: "center" }}>{item.title}</Text>
            <Text style={{ color: C.sub, fontFamily: F.body, fontSize: 15, lineHeight: 23, textAlign: "center" }}>{item.text}</Text>
          </View>
        )}
      />
      <View style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 22, gap: 14 }}>
        <View style={{ flexDirection: "row", justifyContent: "center", gap: 8 }}>
          {PAGES.map((_, k) => <View key={k} style={{ width: k === i ? 26 : 8, height: 8, borderRadius: 4, backgroundColor: k === i ? C.g1 : C.line2 }} />)}
        </View>
        {i < PAGES.length - 1 ? (
          <Btn title="Siguiente" icon="arrow-forward" onPress={() => ref.current?.scrollToIndex({ index: i + 1 })} />
        ) : (
          <Btn title="Crear mi cuenta" icon="eco" onPress={() => void finish("/auth")} />
        )}
        <Btn title={i < PAGES.length - 1 ? "Saltar" : "Explorar primero"} variant="ghost" small onPress={() => void finish("/")} />
      </View>
    </Screen>
  );
}
