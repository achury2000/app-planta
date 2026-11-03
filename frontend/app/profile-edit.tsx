import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Image, Platform, Pressable, ScrollView, Switch, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Btn, Card, H1, IconBtn, P, Screen } from "../components/ui";
import { C, F, R } from "../constants/theme";
import { useAuth } from "../context/AuthContext";

export default function EditProfile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, updateProfile, deleteAccount } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [pass, setPass] = useState("");
  const [avatar, setAvatar] = useState<string | null>(user?.avatar ?? null);
  const [notif, setNotif] = useState(user?.notifications !== false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);

  const pick = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.4, base64: true });
    if (r.canceled || !r.assets[0]) return;
    const a = r.assets[0];
    setAvatar(a.base64 ? `data:${a.mimeType ?? "image/jpeg"};base64,${a.base64}` : a.uri);
  };

  const save = async () => {
    setBusy(true);
    setMsg(null);
    const r = await updateProfile({ name: name.trim(), avatar, notifications: notif, ...(pass ? { password: pass } : {}) });
    setBusy(false);
    setPass("");
    setMsg(r.ok ? { ok: true, t: "Cambios guardados." } : { ok: false, t: r.error ?? "No se pudo guardar." });
  };

  const del = () => {
    const run = async () => { const r = await deleteAccount(); if (r.ok) router.replace("/"); else setMsg({ ok: false, t: r.error ?? "Error" }); };
    if (Platform.OS === "web") { if (confirm("¿Eliminar tu cuenta? No se puede deshacer.")) void run(); return; }
    Alert.alert("Eliminar cuenta", "Esta acción no se puede deshacer.", [{ text: "Cancelar", style: "cancel" }, { text: "Eliminar", style: "destructive", onPress: run }]);
  };

  const input = { color: C.text, fontFamily: F.semi, fontSize: 15, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: R.md, borderWidth: 1, borderColor: C.line2, paddingHorizontal: 16, paddingVertical: 14, outlineStyle: "none" } as any;
  return (
    <Screen pad={false}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 60, gap: 18 }} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          <IconBtn icon="arrow-back" onPress={() => router.back()} />
          <H1>Editar perfil</H1>
        </View>
        <Pressable onPress={pick} style={{ alignSelf: "center" }}>
          <View style={{ width: 110, height: 110, borderRadius: 55, overflow: "hidden", backgroundColor: C.surface2, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: C.g1 }}>
            {avatar ? <Image source={{ uri: avatar }} style={{ width: "100%", height: "100%" }} /> : <Text style={{ color: C.g1, fontFamily: F.display, fontSize: 44 }}>{name[0]?.toUpperCase()}</Text>}
          </View>
          <View style={{ position: "absolute", right: 0, bottom: 0, width: 34, height: 34, borderRadius: 17, backgroundColor: C.g1, alignItems: "center", justifyContent: "center" }}><MaterialIcons name="photo-camera" size={18} color={C.ink} /></View>
        </Pressable>
        <View style={{ gap: 12 }}>
          <TextInput value={name} onChangeText={setName} placeholder="Nombre" placeholderTextColor={C.mute} style={input} />
          <TextInput value={user?.email} editable={false} style={[input, { opacity: 0.55 }]} />
          <TextInput value={pass} onChangeText={setPass} placeholder="Nueva contraseña (opcional)" placeholderTextColor={C.mute} secureTextEntry style={input} />
        </View>
        <Card>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={{ flex: 1 }}><Text style={{ color: C.text, fontFamily: F.bold, fontSize: 15 }}>Recordatorios</Text><P>Un empujón amable para mantener tu racha.</P></View>
            <Switch value={notif} onValueChange={setNotif} trackColor={{ true: C.g2, false: C.line2 }} thumbColor="#fff" />
          </View>
        </Card>
        {msg ? <Text style={{ color: msg.ok ? C.g1 : C.coral, fontFamily: F.bold, fontSize: 13 }}>{msg.t}</Text> : null}
        <Btn title="Guardar cambios" icon="check" loading={busy} onPress={save} />
        <Btn title="Eliminar mi cuenta" variant="danger" small onPress={del} />
      </ScrollView>
    </Screen>
  );
}
