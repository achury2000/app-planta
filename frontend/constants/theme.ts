// constants/theme.ts — Sistema de diseño "Bosque Nocturno"
export const C = {
  bg: "#06100B",
  bg2: "#0B1B13",
  surface: "#10241A",
  surface2: "#173222",
  line: "rgba(170,255,205,0.09)",
  line2: "rgba(170,255,205,0.18)",
  text: "#ECF8F0",
  sub: "#A9C2B1",
  mute: "#6F8A78",
  g1: "#7CF2A2",
  g2: "#2FD27F",
  g3: "#0E9F5B",
  sun: "#FFCB5C",
  coral: "#FF7F61",
  sky: "#7CC8FF",
  lilac: "#B9A5FF",
  danger: "#FF6B6B",
  ink: "#04210F",
} as const;

export const F = {
  display: "Fraunces_600SemiBold",
  displayItalic: "Fraunces_400Regular_Italic",
  body: "Manrope_500Medium",
  semi: "Manrope_600SemiBold",
  bold: "Manrope_700Bold",
  xbold: "Manrope_800ExtraBold",
} as const;

export const R = { sm: 12, md: 18, lg: 24, xl: 32, pill: 999 } as const;

export type CategoryKey = "environment" | "fitness" | "routine" | "challenges";

export const CAT: Record<
  CategoryKey,
  { label: string; color: string; icon: string }
> = {
  environment: { label: "Naturaleza", color: C.g1, icon: "eco" },
  fitness: { label: "Movimiento", color: C.sky, icon: "directions-run" },
  routine: { label: "Rutina", color: C.sun, icon: "wb-sunny" },
  challenges: { label: "Retos", color: C.lilac, icon: "emoji-events" },
};

export const catOf = (k?: string | null) =>
  CAT[(k as CategoryKey) ?? "routine"] ?? CAT.routine;

/** Etapas de la planta según acciones completadas. */
export const STAGES = [
  { min: 0, name: "Semilla", hint: "Todo gran bosque empieza con una acción." },
  { min: 1, name: "Brote", hint: "Ya germinó. Riégala con constancia." },
  { min: 4, name: "Plántula", hint: "Tus hábitos echan raíces." },
  { min: 8, name: "Planta joven", hint: "Se nota el cambio. Sigue así." },
  { min: 14, name: "Frondosa", hint: "Tu rutina ya da sombra." },
  { min: 24, name: "Árbol en flor", hint: "Eres prueba de que transformarse se puede." },
] as const;

export function stageOf(total: number) {
  let i = 0;
  STAGES.forEach((s, k) => {
    if (total >= s.min) i = k;
  });
  const cur = STAGES[i];
  const next = STAGES[i + 1] ?? null;
  const pct = next ? (total - cur.min) / (next.min - cur.min) : 1;
  return { index: i, stage: cur, next, pct: Math.max(0, Math.min(1, pct)) };
}
