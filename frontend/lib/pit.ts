// lib/pit.ts — Vector de Estado Real de la PIT (Planta Individual de Transformación)
import { useMemo } from "react";

import { C } from "../constants/theme";
import { useData } from "../context/DataContext";

export type Axis = { key: string; label: string; value: number | null; color: string; source: "app" | "check-in"; hint: string };

export function usePit() {
  const { summary, checkin, totalDone, stage, events, byId } = useData();

  return useMemo(() => {
    const streak = summary?.streak.current ?? 0;
    const axes: Axis[] = [
      { key: "const", label: "Constancia", value: Math.min(1, streak / 14), color: C.coral, source: "app", hint: `${streak} días de racha (meta 14)` },
      { key: "foco", label: "Enfoque", value: checkin ? checkin.focus / 5 : null, color: C.sky, source: "check-in", hint: "Claridad mental de hoy" },
      { key: "energia", label: "Resiliencia", value: checkin ? (checkin.energy + checkin.sleep) / 10 : null, color: C.sun, source: "check-in", hint: "Energía y descanso" },
      { key: "calma", label: "Calma", value: checkin ? (6 - checkin.stress) / 5 : null, color: C.lilac, source: "check-in", hint: "Nivel de estrés (inverso)" },
      { key: "terr", label: "Territorio", value: Math.min(1, totalDone / 24), color: C.g1, source: "app", hint: `${totalDone} acciones registradas` },
    ];
    const known = axes.filter((a) => a.value !== null) as (Axis & { value: number })[];
    const index = known.length ? Math.round((known.reduce((s, a) => s + a.value, 0) / known.length) * 100) : 0;

    // Competencias: acciones completadas por categoría
    const comp = { environment: 0, fitness: 0, routine: 0, challenges: 0, saber: 0 };
    const done = events.filter((e) => e.type.endsWith("_completed"));
    for (const e of done) {
      const c = byId(e.refId);
      if (e.refType === "challenge") comp.challenges += 1;
      if (c) {
        comp[c.category] += c.category === "challenges" ? 0 : 1;
        if (c.type === "article") comp.saber += 1;
      }
    }
    return { axes, index, comp, stage, totalDone, streak, done };
  }, [summary, checkin, totalDone, stage, events, byId]);
}
