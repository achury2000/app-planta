// components/Celebration.tsx — Modal de medalla ganada
import { MaterialIcons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { Modal, Text, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from "react-native-reanimated";

import { medalById } from "../constants/medals";
import { C, F } from "../constants/theme";
import { useData } from "../context/DataContext";
import { Btn, H2, P } from "./ui";

function Spark({ i }: { i: number }) {
  const v = useSharedValue(0);
  useEffect(() => {
    v.value = withDelay(i * 40, withTiming(1, { duration: 1100, easing: Easing.out(Easing.cubic) }));
  }, [i, v]);
  const a = (i / 14) * Math.PI * 2;
  const st = useAnimatedStyle(() => ({
    opacity: 1 - v.value,
    transform: [{ translateX: Math.cos(a) * 120 * v.value }, { translateY: Math.sin(a) * 120 * v.value }, { scale: 1 - v.value * 0.4 }],
  }));
  const col = [C.g1, C.sun, C.sky, C.lilac, C.coral][i % 5];
  return <Animated.View style={[{ position: "absolute", width: 9, height: 9, borderRadius: 5, backgroundColor: col }, st]} />;
}

export function Celebration() {
  const { celebrate, dismissCelebrate } = useData();
  const medal = celebrate.length ? medalById(celebrate[0]) : null;
  const s = useSharedValue(0);
  useEffect(() => {
    s.value = 0;
    if (medal) s.value = withSpring(1, { damping: 9, stiffness: 120 });
  }, [medal, s]);
  const st = useAnimatedStyle(() => ({ transform: [{ scale: s.value }, { rotate: `${(1 - s.value) * -25}deg` }] }));
  if (!medal) return null;
  return (
    <Modal transparent animationType="fade" visible onRequestClose={dismissCelebrate}>
      <View style={{ flex: 1, backgroundColor: "rgba(3,10,6,0.88)", alignItems: "center", justifyContent: "center", padding: 28 }}>
        <View style={{ alignItems: "center", justifyContent: "center", height: 190 }}>
          {Array.from({ length: 14 }).map((_, i) => <Spark key={i} i={i} />)}
          <Animated.View style={[{ width: 130, height: 130, borderRadius: 65, backgroundColor: medal.color + "26", borderWidth: 2, borderColor: medal.color, alignItems: "center", justifyContent: "center" }, st]}>
            <MaterialIcons name={medal.icon} size={64} color={medal.color} />
          </Animated.View>
        </View>
        <Text style={{ color: C.g1, fontFamily: F.bold, letterSpacing: 2, fontSize: 12, marginTop: 8 }}>¡NUEVA MEDALLA!</Text>
        <H2 style={{ fontSize: 30, marginTop: 6, textAlign: "center" }}>{medal.title}</H2>
        <P style={{ textAlign: "center", marginTop: 6, marginBottom: 22 }}>{medal.desc}</P>
        {celebrate.length > 1 ? <P style={{ marginBottom: 14 }}>y {celebrate.length - 1} más por descubrir en tu PIT</P> : null}
        <Btn title="Seguir creciendo" icon="eco" onPress={dismissCelebrate} />
      </View>
    </Modal>
  );
}
