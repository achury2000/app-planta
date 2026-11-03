// components/ui.tsx — Componentes base del sistema "Bosque Nocturno"
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useId } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import Svg, { Circle, Defs, LinearGradient as SvgGrad, RadialGradient as SvgRadial, Stop } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { C, F, R } from "../constants/theme";

export type IconName = React.ComponentProps<typeof MaterialIcons>["name"];

/* ── Fondo con aurora ── */
function Glow({ size, color, opacity, style }: { size: number; color: string; opacity: number; style: any }) {
  const gid = "gl" + useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <Animated.View style={[{ position: "absolute", width: size, height: size }, style]}>
      <Svg width={size} height={size}>
        <Defs>
          <SvgRadial id={gid} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={color} stopOpacity={opacity} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </SvgRadial>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${gid})`} />
      </Svg>
    </Animated.View>
  );
}

export function Aurora({ tint = C.g2 }: { tint?: string }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: 9000, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [t]);
  const a = useAnimatedStyle(() => ({ transform: [{ translateY: t.value * 24 }, { scale: 1 + t.value * 0.08 }] }));
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient colors={[C.bg2, C.bg, C.bg]} style={StyleSheet.absoluteFill} />
      <Glow size={520} color={tint} opacity={0.3} style={[{ top: -230, right: -200 }, a]} />
      <Glow size={560} color={C.sky} opacity={0.12} style={[{ top: 300, left: -300 }, a]} />
    </View>
  );
}

export function Screen({
  children,
  tint,
  style,
  pad = true,
}: {
  children: React.ReactNode;
  tint?: string;
  style?: StyleProp<ViewStyle>;
  pad?: boolean;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[{ flex: 1, backgroundColor: C.bg }, style]}>
      <Aurora tint={tint} />
      <View style={{ flex: 1, paddingTop: pad ? insets.top : 0 }}>{children}</View>
    </View>
  );
}

/* ── Texto ── */
type TProps = { children: React.ReactNode; style?: StyleProp<TextStyle>; numberOfLines?: number };
export const H1 = ({ children, style, numberOfLines }: TProps) => (
  <Text numberOfLines={numberOfLines} style={[styles.h1, style]}>{children}</Text>
);
export const H2 = ({ children, style, numberOfLines }: TProps) => (
  <Text numberOfLines={numberOfLines} style={[styles.h2, style]}>{children}</Text>
);
export const P = ({ children, style, numberOfLines }: TProps) => (
  <Text numberOfLines={numberOfLines} style={[styles.p, style]}>{children}</Text>
);
export const Label = ({ children, style }: TProps) => (
  <Text style={[styles.label, style]}>{children}</Text>
);

/* ── Tarjeta ── */
export function Card({
  children,
  style,
  onPress,
  glow,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  glow?: string;
}) {
  const body = (
    <View style={[styles.card, glow ? { borderColor: glow + "55" } : null, style]}>{children}</View>
  );
  if (!onPress) return body;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.985 : 1 }] })}>
      {body}
    </Pressable>
  );
}

/* ── Botón ── */
export function Btn({
  title,
  onPress,
  icon,
  variant = "primary",
  loading,
  disabled,
  style,
  small,
}: {
  title: string;
  onPress?: () => void;
  icon?: IconName;
  variant?: "primary" | "ghost" | "soft" | "danger";
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  small?: boolean;
}) {
  const dim = disabled || loading;
  const fg = variant === "primary" ? C.ink : variant === "danger" ? C.danger : C.text;
  const inner = (
    <View style={[styles.btnIn, small && { paddingVertical: 10, paddingHorizontal: 16 }]}>
      {loading ? <ActivityIndicator color={fg} size="small" /> : icon ? <MaterialIcons name={icon} size={small ? 16 : 20} color={fg} /> : null}
      <Text style={[styles.btnTx, { color: fg }, small && { fontSize: 13 }]}>{title}</Text>
    </View>
  );
  return (
    <Pressable
      onPress={dim ? undefined : onPress}
      style={({ pressed }) => [{ opacity: dim ? 0.5 : pressed ? 0.88 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }, style]}
    >
      {variant === "primary" ? (
        <LinearGradient colors={[C.g1, C.g2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.btn}>
          {inner}
        </LinearGradient>
      ) : (
        <View
          style={[
            styles.btn,
            variant === "soft" && { backgroundColor: "rgba(124,242,162,0.12)", borderColor: C.line2, borderWidth: 1 },
            variant === "ghost" && { borderColor: C.line2, borderWidth: 1 },
            variant === "danger" && { borderColor: "rgba(255,107,107,0.4)", borderWidth: 1, backgroundColor: "rgba(255,107,107,0.08)" },
          ]}
        >
          {inner}
        </View>
      )}
    </Pressable>
  );
}

export function IconBtn({ icon, onPress, color = C.text, size = 22, style, badge }: { icon: IconName; onPress?: () => void; color?: string; size?: number; style?: StyleProp<ViewStyle>; badge?: boolean }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.7 : 1 }, style]}>
      <MaterialIcons name={icon} size={size} color={color} />
      {badge ? <View style={styles.dot} /> : null}
    </Pressable>
  );
}

export function Chip({ label, active, onPress, color = C.g1, icon }: { label: string; active?: boolean; onPress?: () => void; color?: string; icon?: IconName }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active ? { backgroundColor: color, borderColor: color } : null]}
    >
      {icon ? <MaterialIcons name={icon} size={14} color={active ? C.ink : color} /> : null}
      <Text style={[styles.chipTx, { color: active ? C.ink : C.sub }]}>{label}</Text>
    </Pressable>
  );
}

export function Pill({ label, color = C.g1, icon, solid }: { label: string; color?: string; icon?: IconName; solid?: boolean }) {
  return (
    <View style={[styles.pill, { backgroundColor: solid ? "rgba(6,16,11,0.78)" : color + "22", borderColor: color + (solid ? "AA" : "55") }]}>
      {icon ? <MaterialIcons name={icon} size={12} color={color} /> : null}
      <Text style={[styles.pillTx, { color }]}>{label}</Text>
    </View>
  );
}

export function Bar({ pct, color = C.g1, height = 8 }: { pct: number; color?: string; height?: number }) {
  const w = useSharedValue(0);
  useEffect(() => {
    w.value = withTiming(Math.max(0, Math.min(1, pct)), { duration: 700, easing: Easing.out(Easing.cubic) });
  }, [pct, w]);
  const st = useAnimatedStyle(() => ({ width: `${w.value * 100}%` as any }));
  return (
    <View style={{ height, borderRadius: height, backgroundColor: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
      <Animated.View style={[{ height, borderRadius: height, backgroundColor: color }, st]} />
    </View>
  );
}

/* ── Anillo de progreso ── */
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
export function Ring({ size = 96, stroke = 10, pct, color = C.g1, children }: { size?: number; stroke?: number; pct: number; color?: string; children?: React.ReactNode }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const v = useSharedValue(0);
  useEffect(() => {
    v.value = withTiming(Math.max(0, Math.min(1, pct)), { duration: 900, easing: Easing.out(Easing.cubic) });
  }, [pct, v]);
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute", transform: [{ rotate: "-90deg" }] }}>
        <Defs>
          <SvgGrad id={`rg${uid}`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={color} />
            <Stop offset="1" stopColor={C.g3} />
          </SvgGrad>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} fill="none" />
        <RingArc size={size} r={r} stroke={stroke} circ={circ} v={v} uid={uid} />
      </Svg>
      {children}
    </View>
  );
}
function RingArc({ size, r, stroke, circ, v, uid }: any) {
  const ap = useAnimatedStylePropsOffset(v, circ);
  return (
    <AnimatedCircle
      cx={size / 2}
      cy={size / 2}
      r={r}
      stroke={`url(#rg${uid})`}
      strokeWidth={stroke}
      strokeLinecap="round"
      fill="none"
      strokeDasharray={`${circ} ${circ}`}
      animatedProps={ap}
    />
  );
}
function useAnimatedStylePropsOffset(v: any, circ: number) {
  return useAnimatedProps(() => ({ strokeDashoffset: circ * (1 - v.value) }));
}

export function Empty({ icon = "spa", title, text, action }: { icon?: IconName; title: string; text?: string; action?: React.ReactNode }) {
  return (
    <View style={{ alignItems: "center", padding: 28, gap: 10 }}>
      <View style={styles.emptyIcon}><MaterialIcons name={icon} size={30} color={C.g1} /></View>
      <H2 style={{ textAlign: "center" }}>{title}</H2>
      {text ? <P style={{ textAlign: "center" }}>{text}</P> : null}
      {action}
    </View>
  );
}

export function SectionHead({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
      <H2>{title}</H2>
      {action ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={{ color: C.g1, fontFamily: F.bold, fontSize: 13 }}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Skeleton({ h = 80, style }: { h?: number; style?: StyleProp<ViewStyle> }) {
  const o = useSharedValue(0.35);
  useEffect(() => {
    o.value = withRepeat(withSequence(withTiming(0.7, { duration: 700 }), withTiming(0.35, { duration: 700 })), -1);
  }, [o]);
  const st = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[{ height: h, borderRadius: R.lg, backgroundColor: C.surface2 }, st, style]} />;
}

const styles = StyleSheet.create({
  blob: { position: "absolute", width: 320, height: 320, borderRadius: 999 },
  h1: { color: C.text, fontFamily: F.display, fontSize: 32, lineHeight: 38, letterSpacing: -0.5 },
  h2: { color: C.text, fontFamily: F.display, fontSize: 21, lineHeight: 27 },
  p: { color: C.sub, fontFamily: F.body, fontSize: 14, lineHeight: 21 },
  label: { color: C.mute, fontFamily: F.bold, fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase" },
  card: { backgroundColor: "rgba(16,36,26,0.78)", borderColor: C.line, borderWidth: 1, borderRadius: R.lg, padding: 16, overflow: "hidden" },
  btn: { borderRadius: R.pill, overflow: "hidden" },
  btnIn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 15, paddingHorizontal: 22 },
  btnTx: { fontFamily: F.xbold, fontSize: 15 },
  iconBtn: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.06)", borderColor: C.line, borderWidth: 1 },
  dot: { position: "absolute", top: 9, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: C.coral },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 9, paddingHorizontal: 14, borderRadius: R.pill, borderWidth: 1, borderColor: C.line2, backgroundColor: "rgba(255,255,255,0.04)" },
  chipTx: { fontFamily: F.bold, fontSize: 13 },
  pill: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 4, paddingHorizontal: 9, borderRadius: R.pill, borderWidth: 1, alignSelf: "flex-start" },
  pillTx: { fontFamily: F.bold, fontSize: 11 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(124,242,162,0.1)" },
});
