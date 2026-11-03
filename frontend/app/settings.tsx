import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Card, H1, H2, IconBtn, P, Screen } from "../components/ui";

const FAQ = [
  ["¿Cómo funciona la planta?", "Cada lectura, rutina o reto completado suma una acción. Con más acciones tu planta pasa de semilla a árbol en flor."],
  ["¿Qué es la PIT?", "La Planta Individual de Transformación resume tu estado actual: constancia y territorio salen de tu actividad; enfoque, resiliencia y calma, de tu check-in diario."],
  ["¿Cómo se cuenta la racha?", "Cuenta los días seguidos en los que completas al menos una acción. Si pasas un día sin actividad, vuelve a empezar."],
  ["¿Cómo se valida la caminata?", "El GPS registra tu recorrido y el servidor recalcula la distancia. El registro manual queda marcado como no verificado."],
];

export default function Settings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <Screen pad={false}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 60, gap: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          <IconBtn icon="arrow-back" onPress={() => router.back()} />
          <H1>Ayuda y privacidad</H1>
        </View>
        {FAQ.map(([q, a]) => (
          <Card key={q}><H2 style={{ fontSize: 17 }}>{q}</H2><P style={{ marginTop: 6 }}>{a}</P></Card>
        ))}
        <Card glow="#7CF2A2">
          <H2 style={{ fontSize: 17 }}>Tus datos</H2>
          <P style={{ marginTop: 6 }}>Guardamos tu nombre, correo y actividad dentro de la app para calcular tu progreso. La ubicación solo se usa mientras caminas en un reto y nunca se guarda el recorrido completo. Puedes eliminar tu cuenta desde Editar perfil.</P>
        </Card>
      </ScrollView>
    </Screen>
  );
}
