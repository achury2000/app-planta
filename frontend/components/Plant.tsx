// components/Plant.tsx — La Planta viva (orquídea holográfica que crece con tu progreso)
import React, { useEffect, useId, useMemo } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Defs, Ellipse, G, Line, LinearGradient, Path, RadialGradient, Stop } from "react-native-svg";

import { C } from "../constants/theme";

const HEIGHTS = [0, 26, 50, 76, 102, 122];

function Leaf({ u, x, y, a, s = 1, flip = 1 }: { u: string; x: number; y: number; a: number; s?: number; flip?: number }) {
  return (
    <G transform={`translate(${x} ${y}) rotate(${a}) scale(${s * flip} ${s})`}>
      <Path d="M0 0 C 14 -16, 46 -20, 74 -4 C 48 10, 16 10, 0 0 Z" fill={`url(#${u}leaf)`} opacity={0.95} />
      <Path d="M2 0 C 24 -3, 46 -4, 70 -4" stroke="#CFFFE0" strokeOpacity={0.5} strokeWidth={1} fill="none" />
    </G>
  );
}

function Flower({ u, x, y, s = 1, rot = 0 }: { u: string; x: number; y: number; s?: number; rot?: number }) {
  const petals = [0, 72, 144, 216, 288];
  return (
    <G transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <Circle r={22} fill={`url(#${u}glow)`} opacity={0.7} />
      {petals.map((a) => (
        <Ellipse key={a} cx={0} cy={-13} rx={8.5} ry={14} fill={`url(#${u}petal)`} opacity={0.92} transform={`rotate(${a})`} stroke="#EBDDFF" strokeOpacity={0.55} strokeWidth={0.8} />
      ))}
      <Circle r={4.2} fill="#FFE29A" />
      <Circle r={2} fill="#FFFFFF" opacity={0.9} />
    </G>
  );
}

export function Plant({ stage = 0, size = 220, sway = true }: { stage?: number; size?: number; sway?: boolean }) {
  const u = useId().replace(/[^a-zA-Z0-9]/g, "");
  const t = useSharedValue(0);
  useEffect(() => {
    if (!sway) return;
    t.value = withRepeat(withTiming(1, { duration: 3600, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [sway, t]);
  const st = useAnimatedStyle(() => ({ transform: [{ rotate: `${(t.value - 0.5) * 3}deg` }] }));

  const s = Math.max(0, Math.min(5, Math.round(stage)));
  const h = HEIGHTS[s];
  const baseY = 168;
  const topY = baseY - h;
  const sway1 = 10 + s * 1.2;

  const stem = useMemo(
    () => `M100 ${baseY} C 100 ${baseY - h * 0.4}, ${100 - sway1} ${baseY - h * 0.7}, ${100 + 6} ${topY}`,
    [h, topY, sway1],
  );

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 200 200">
        <Defs>
          <RadialGradient id={`${u}aura`} cx="50%" cy="60%" r="55%">
            <Stop offset="0" stopColor={C.g1} stopOpacity={0.3} />
            <Stop offset="0.55" stopColor={C.g1} stopOpacity={0.1} />
            <Stop offset="1" stopColor={C.g1} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id={`${u}glow`} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#C8B6FF" stopOpacity={0.9} />
            <Stop offset="1" stopColor="#7CC8FF" stopOpacity={0} />
          </RadialGradient>
          <LinearGradient id={`${u}leaf`} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#1FA866" />
            <Stop offset="1" stopColor="#8FFFC0" />
          </LinearGradient>
          <LinearGradient id={`${u}petal`} x1="0" y1="1" x2="0" y2="0">
            <Stop offset="0" stopColor="#7CC8FF" />
            <Stop offset="1" stopColor="#D6B8FF" />
          </LinearGradient>
          <LinearGradient id={`${u}stem`} x1="0" y1="1" x2="0" y2="0">
            <Stop offset="0" stopColor="#14925A" />
            <Stop offset="1" stopColor="#9CFFC4" />
          </LinearGradient>
        </Defs>

        {/* aura */}
        <Circle cx={100} cy={110} r={92} fill={`url(#${u}aura)`} />

        {/* plataforma holográfica */}
        <Ellipse cx={100} cy={176} rx={64} ry={13} fill="none" stroke={C.g1} strokeOpacity={0.5} strokeWidth={1.2} />
        <Ellipse cx={100} cy={176} rx={46} ry={9} fill="none" stroke={C.sky} strokeOpacity={0.45} strokeWidth={1} />
        <Ellipse cx={100} cy={176} rx={26} ry={5} fill={C.g1} fillOpacity={0.18} />
        {Array.from({ length: 24 }).map((_, i) => {
          const a = (i / 24) * Math.PI * 2;
          return (
            <Line key={i} x1={100 + Math.cos(a) * 64} y1={176 + Math.sin(a) * 13} x2={100 + Math.cos(a) * 68} y2={176 + Math.sin(a) * 14.2} stroke={C.g1} strokeOpacity={0.5} strokeWidth={1} />
          );
        })}
      </Svg>

      <Animated.View style={[{ position: "absolute", left: 0, top: 0, width: size, height: size, transformOrigin: "50% 88%" } as any, st]}>
        <Svg width={size} height={size} viewBox="0 0 200 200">
          <Defs>
            <RadialGradient id={`${u}glow`} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor="#C8B6FF" stopOpacity={0.9} />
              <Stop offset="1" stopColor="#7CC8FF" stopOpacity={0} />
            </RadialGradient>
            <LinearGradient id={`${u}leaf`} x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#1FA866" />
              <Stop offset="1" stopColor="#8FFFC0" />
            </LinearGradient>
            <LinearGradient id={`${u}petal`} x1="0" y1="1" x2="0" y2="0">
              <Stop offset="0" stopColor="#7CC8FF" />
              <Stop offset="1" stopColor="#D6B8FF" />
            </LinearGradient>
            <LinearGradient id={`${u}stem`} x1="0" y1="1" x2="0" y2="0">
              <Stop offset="0" stopColor="#14925A" />
              <Stop offset="1" stopColor="#9CFFC4" />
            </LinearGradient>
          </Defs>

          {s === 0 && (
            <G>
              <Ellipse cx={100} cy={160} rx={11} ry={15} fill="#C69A5B" />
              <Ellipse cx={96} cy={155} rx={3.5} ry={6} fill="#F3D9A4" opacity={0.8} />
              <Circle cx={100} cy={150} r={26} fill={`url(#${u}glow)`} opacity={0.5} />
              {[[78, 130], [122, 124], [108, 104], [88, 110]].map(([x, y], i) => (
                <Circle key={i} cx={x} cy={y} r={1.8} fill={C.g1} opacity={0.8} />
              ))}
            </G>
          )}

          {s >= 1 && (
            <G>
              {/* hojas */}
              <Leaf u={u} x={100} y={baseY - 4} a={-24} s={s >= 3 ? 1.05 : 0.55 + s * 0.12} flip={-1} />
              <Leaf u={u} x={100} y={baseY - 4} a={-18} s={s >= 3 ? 1.1 : 0.55 + s * 0.12} />
              {s >= 2 && <Leaf u={u} x={100} y={baseY - 18} a={-52} s={0.6 + s * 0.08} />}
              {s >= 2 && <Leaf u={u} x={100} y={baseY - 22} a={-48} s={0.6 + s * 0.08} flip={-1} />}
              {s >= 4 && <Leaf u={u} x={101} y={baseY - 48} a={-62} s={0.65} flip={-1} />}
              {s >= 4 && <Leaf u={u} x={102} y={baseY - 56} a={-60} s={0.6} />}
              {/* tallo */}
              <Path d={stem} stroke={`url(#${u}stem)`} strokeWidth={3.4} strokeLinecap="round" fill="none" />
              {s === 1 && <Leaf u={u} x={106} y={topY + 2} a={-70} s={0.4} />}
              {s === 2 && (
                <G>
                  <Leaf u={u} x={106} y={topY + 2} a={-70} s={0.5} />
                  <Leaf u={u} x={106} y={topY + 4} a={-110} s={0.5} flip={-1} />
                </G>
              )}
              {s === 3 && (
                <G>
                  <Circle cx={106} cy={topY - 2} r={6} fill="#C8B6FF" />
                  <Circle cx={106} cy={topY - 2} r={14} fill={`url(#${u}glow)`} opacity={0.7} />
                  <Circle cx={92} cy={topY + 22} r={4.5} fill="#9CD2FF" />
                </G>
              )}
              {s === 4 && (
                <G>
                  <Flower u={u} x={110} y={topY - 4} s={0.95} rot={8} />
                  <Circle cx={92} cy={topY + 26} r={5} fill="#C8B6FF" />
                </G>
              )}
              {s === 5 && (
                <G>
                  <Flower u={u} x={112} y={topY - 6} s={1} rot={10} />
                  <Flower u={u} x={84} y={topY + 18} s={0.75} rot={-14} />
                  <Flower u={u} x={128} y={topY + 24} s={0.6} rot={20} />
                </G>
              )}
            </G>
          )}
        </Svg>
      </Animated.View>
    </View>
  );
}
