import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Alert, Image, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Btn, Card, H1, P, Pill, Screen } from "../../components/ui";
import { C, F, R } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import { resetDemoData } from "../../lib/demo/server";

function Item({ icon, label, sub, onPress, color = C.g1, danger }: { icon: any; label: string; sub?: string; onPress: () => void; color?: string; danger?: boolean }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14 }}>
        <View style={{ width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: (danger ? C.danger : color) + "1F" }}>
          <MaterialIcons name={icon} size={21} color={danger ? C.danger : color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: danger ? C.danger : C.text, fontFamily: F.bold, fontSize: 15 }}>{label}</Text>
          {sub ? <Text style={{ color: C.mute, fontFamily: F.semi, fontSize: 12 }}>{sub}</Text> : null}
        </View>
        <MaterialIcons name="chevron-right" size={22} color={C.mute} />
      </View>
    </Pressable>
  );
}

export default function Yo() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated, logout } = useAuth();
  const { summary, saved, stage, totalDone, demo, refresh } = useData();

  if (!isAuthenticated) {
    return (
      <Screen pad={false}>
        <ScrollView contentContainerStyle={{ paddingTop: insets.top + 40, paddingHorizontal: 24, paddingBottom: 130, gap: 16 }}>
          <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: C.surface2, alignItems: "center", justifyContent: "center", alignSelf: "center" }}>
            <MaterialIcons name="person" size={44} color={C.g1} />
          </View>
          <H1 style={{ textAlign: "center" }}>Tu espacio personal</H1>
          <P style={{ textAlign: "center" }}>Guarda contenido, sigue tu racha y construye tu PIT desde cualquier dispositivo.</P>
          <Btn title="Iniciar sesión o crear cuenta" icon="login" onPress={() => router.push("/auth")} />
          <Card><Item icon="help-outline" label="Ayuda y privacidad" onPress={() => router.push("/settings")} /></Card>
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen pad={false}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 130, gap: 18 }} showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: "center", gap: 10 }}>
          <View style={{ width: 96, height: 96, borderRadius: 48, overflow: "hidden", backgroundColor: C.surface2, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: C.g1 }}>
            {user?.avatar ? <Image source={{ uri: user.avatar }} style={{ width: "100%", height: "100%" }} /> : <Text style={{ color: C.g1, fontFamily: F.display, fontSize: 40 }}>{user?.name?.[0]?.toUpperCase()}</Text>}
          </View>
          <View style={{ alignItems: "center", gap: 2 }}>
            <Text style={{ color: C.text, fontFamily: F.display, fontSize: 26 }}>{user?.name}</Text>
            <Text style={{ color: C.mute, fontFamily: F.semi, fontSize: 13 }}>{user?.email}</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pill label={stage.stage.name} color={C.g1} icon="eco" />
            {user?.role === "admin" ? <Pill label="Administrador" color={C.sun} icon="shield" /> : null}
            {demo ? <Pill label="Modo demo" color={C.sky} icon="science" /> : null}
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 10 }}>
          {[
            { v: summary?.streak.current ?? 0, l: "Racha", c: C.coral },
            { v: summary?.streak.best ?? 0, l: "Mejor", c: C.sun },
            { v: totalDone, l: "Acciones", c: C.g1 },
            { v: summary?.medals.length ?? 0, l: "Medallas", c: C.lilac },
          ].map((s) => (
            <View key={s.l} style={{ flex: 1, alignItems: "center", paddingVertical: 14, borderRadius: R.lg, backgroundColor: "rgba(16,36,26,0.78)", borderWidth: 1, borderColor: C.line }}>
              <Text style={{ color: s.c, fontFamily: F.display, fontSize: 24 }}>{s.v}</Text>
              <Text style={{ color: C.mute, fontFamily: F.bold, fontSize: 11 }}>{s.l}</Text>
            </View>
          ))}
        </View>

        <Card style={{ paddingVertical: 4 }}>
          <Item icon="bookmark" label="Guardados" sub={`${saved.length} ${saved.length === 1 ? "contenido" : "contenidos"}`} onPress={() => router.push("/saved")} />
          <Item icon="edit" label="Editar perfil" sub="Nombre, foto y contraseña" color={C.sky} onPress={() => router.push("/profile-edit")} />
          <Item icon="auto-awesome" label="Hablar con ORQ" sub="Tu guía de hábitos" color={C.lilac} onPress={() => router.push("/orq")} />
          {user?.role === "admin" ? <Item icon="admin-panel-settings" label="Panel de administración" sub="Usuarios, contenido y retos" color={C.sun} onPress={() => router.push("/admin")} /> : null}
          <Item icon="shield" label="Ayuda y privacidad" color={C.sub} onPress={() => router.push("/settings")} />
        </Card>

        {demo ? (
          <Card>
            <P>Estás en modo demo: los datos viven solo en este dispositivo y funcionan sin servidor.</P>
            <Btn title="Restablecer datos demo" variant="ghost" small style={{ marginTop: 12 }} onPress={() => Alert.alert("Restablecer", "Se borrarán los cambios y la sesión demo.", [{ text: "Cancelar", style: "cancel" }, { text: "Restablecer", style: "destructive", onPress: async () => { await resetDemoData(); await logout(); await refresh(); } }])} />
          </Card>
        ) : null}

        <Btn title="Cerrar sesión" icon="logout" variant="danger" onPress={() => void logout()} />
      </ScrollView>
    </Screen>
  );
}
