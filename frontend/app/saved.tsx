import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { RowCard, useOpen } from "../components/ContentCard";
import { Btn, Empty, H1, IconBtn, Screen } from "../components/ui";
import { useData } from "../context/DataContext";

export default function Saved() {
  const router = useRouter();
  const open = useOpen();
  const insets = useSafeAreaInsets();
  const { saved, byId } = useData();
  const items = saved.map((id) => byId(id)).filter(Boolean) as NonNullable<ReturnType<typeof byId>>[];
  return (
    <Screen pad={false}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 60, gap: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          <IconBtn icon="arrow-back" onPress={() => router.back()} />
          <H1>Guardados</H1>
        </View>
        {items.length === 0 ? (
          <Empty icon="bookmark-border" title="Aún no guardas nada" text="Toca el marcador en cualquier contenido para tenerlo aquí." action={<Btn title="Explorar" onPress={() => router.replace("/discover")} />} />
        ) : (
          <View style={{ gap: 10 }}>{items.map((c) => <RowCard key={c._id} item={c} onPress={() => open(c._id)} />)}</View>
        )}
      </ScrollView>
    </Screen>
  );
}
