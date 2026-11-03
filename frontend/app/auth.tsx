import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Plant } from "../components/Plant";
import { Btn, Card, H1, IconBtn, P, Screen } from "../components/ui";
import { C, F, R } from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";

function Field({ icon, ...p }: any) {
  const [show, setShow] = useState(false);
  const secure = p.secureTextEntry;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: R.md, borderWidth: 1, borderColor: C.line2, paddingHorizontal: 14 }}>
      <MaterialIcons name={icon} size={20} color={C.mute} />
      <TextInput placeholderTextColor={C.mute} autoCapitalize="none" {...p} secureTextEntry={secure && !show} style={{ flex: 1, color: C.text, fontFamily: F.semi, fontSize: 15, paddingVertical: 15, outlineStyle: "none" } as any} />
      {secure ? <Pressable onPress={() => setShow((s) => !s)} hitSlop={10}><MaterialIcons name={show ? "visibility-off" : "visibility"} size={20} color={C.mute} /></Pressable> : null}
    </View>
  );
}

export default function Auth() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login, register } = useAuth();
  const { demo } = useData();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const done = () => (router.canGoBack() ? router.back() : router.replace("/"));

  const submit = async (e = email, p = pass) => {
    setErr(null);
    if (mode === "register" && !name.trim()) return setErr("Escribe tu nombre.");
    if (!e.trim() || !p) return setErr("Completa tu correo y contraseña.");
    setBusy(true);
    const r = mode === "login" ? await login(e.trim(), p) : await register(name.trim(), e.trim(), p);
    setBusy(false);
    if (!r.ok) return setErr(r.error ?? "No se pudo continuar.");
    done();
  };

  const quick = async (e: string, p: string) => {
    setMode("login");
    setBusy(true);
    setErr(null);
    const r = await login(e, p);
    setBusy(false);
    if (!r.ok) return setErr(r.error ?? "Error");
    done();
  };

  return (
    <Screen pad={false}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ padding: 22, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 30, gap: 16 }} keyboardShouldPersistTaps="handled">
          <View style={{ alignItems: "flex-start" }}><IconBtn icon="close" onPress={done} /></View>
          <View style={{ alignItems: "center" }}><Plant stage={mode === "login" ? 2 : 0} size={170} /></View>
          <View style={{ gap: 6 }}>
            <H1 style={{ textAlign: "center" }}>{mode === "login" ? "Qué bueno verte" : "Planta tu semilla"}</H1>
            <P style={{ textAlign: "center" }}>{mode === "login" ? "Entra para seguir cuidando tu planta." : "Crea tu cuenta y empieza tu transformación."}</P>
          </View>

          <View style={{ flexDirection: "row", backgroundColor: "rgba(255,255,255,0.06)", borderRadius: R.pill, padding: 4 }}>
            {(["login", "register"] as const).map((m) => (
              <Pressable key={m} onPress={() => { setMode(m); setErr(null); }} style={{ flex: 1, paddingVertical: 11, borderRadius: R.pill, backgroundColor: mode === m ? C.g1 : "transparent", alignItems: "center" }}>
                <Text style={{ color: mode === m ? C.ink : C.sub, fontFamily: F.xbold, fontSize: 14 }}>{m === "login" ? "Entrar" : "Crear cuenta"}</Text>
              </Pressable>
            ))}
          </View>

          <View style={{ gap: 12 }}>
            {mode === "register" ? <Field icon="person" placeholder="Tu nombre" value={name} onChangeText={setName} autoCapitalize="words" /> : null}
            <Field icon="mail" placeholder="Correo" value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" />
            <Field icon="lock" placeholder="Contraseña" value={pass} onChangeText={setPass} secureTextEntry onSubmitEditing={() => void submit()} />
          </View>
          {err ? <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}><MaterialIcons name="error-outline" size={18} color={C.coral} /><Text style={{ color: C.coral, fontFamily: F.semi, fontSize: 13, flex: 1 }}>{err}</Text></View> : null}
          <Btn title={mode === "login" ? "Entrar" : "Crear mi cuenta"} loading={busy} onPress={() => void submit()} />

          {demo ? (
            <Card glow={C.sky}>
              <View style={{ gap: 10 }}>
                <Text style={{ color: C.sky, fontFamily: F.bold, fontSize: 12, letterSpacing: 1.4 }}>MODO DEMO · ACCESO RÁPIDO</Text>
                <Btn title="Carlos · racha de 6 días" icon="local-fire-department" variant="soft" small onPress={() => quick("carlos@planta.com", "demo123")} />
                <Btn title="Juan · cuenta nueva" icon="person-add-alt" variant="ghost" small onPress={() => quick("juan@planta.com", "demo123")} />
                <Btn title="Administrador" icon="admin-panel-settings" variant="ghost" small onPress={() => quick("admin@planta.com", "admin123")} />
              </View>
            </Card>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
