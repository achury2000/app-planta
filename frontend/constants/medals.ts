// constants/medals.ts — Catálogo de medallas (mismos ids que el backend)
import type { IconName } from "../components/ui";
import { C } from "./theme";

export type MedalDef = { id: string; title: string; desc: string; icon: IconName; color: string; group: "Inicio" | "Racha" | "Lectura" | "Movimiento" | "Retos" };

const mk = (id: string, title: string, desc: string, icon: IconName, color: string, group: MedalDef["group"]): MedalDef => ({ id, title, desc, icon, color, group });

export const MEDALS: MedalDef[] = [
  mk("FIRST_ARTICLE", "Primera lectura", "Completa tu primer artículo", "menu-book", C.g1, "Inicio"),
  mk("FIRST_ROUTINE", "Primer movimiento", "Completa tu primera rutina", "fitness-center", C.sky, "Inicio"),
  mk("FIRST_CHALLENGE", "Primer reto", "Completa tu primer reto", "eco", C.lilac, "Inicio"),
  mk("STREAK_3", "Chispa", "3 días seguidos activo", "wb-sunny", C.sun, "Racha"),
  mk("STREAK_7", "Llama", "7 días seguidos activo", "local-fire-department", C.coral, "Racha"),
  mk("STREAK_14", "Hoguera", "14 días seguidos activo", "whatshot", C.coral, "Racha"),
  mk("STREAK_30", "Volcán", "30 días seguidos activo", "local-fire-department", C.coral, "Racha"),
  mk("STREAK_100", "Estrella", "100 días seguidos activo", "stars", C.sun, "Racha"),
  mk("ARTICLES_5", "Lector 5", "Completa 5 artículos", "auto-stories", C.g1, "Lectura"),
  mk("ARTICLES_10", "Lector 10", "Completa 10 artículos", "library-books", C.g1, "Lectura"),
  mk("ARTICLES_25", "Lector 25", "Completa 25 artículos", "library-books", C.g1, "Lectura"),
  mk("ARTICLES_50", "Sabio 50", "Completa 50 artículos", "school", C.g1, "Lectura"),
  mk("ARTICLES_100", "Maestro 100", "Completa 100 artículos", "workspace-premium", C.sun, "Lectura"),
  mk("ROUTINES_5", "Activo 5", "Completa 5 rutinas", "fitness-center", C.sky, "Movimiento"),
  mk("ROUTINES_10", "Activo 10", "Completa 10 rutinas", "fitness-center", C.sky, "Movimiento"),
  mk("ROUTINES_25", "Atleta 25", "Completa 25 rutinas", "sports-gymnastics", C.sky, "Movimiento"),
  mk("ROUTINES_50", "Atleta 50", "Completa 50 rutinas", "sports-gymnastics", C.sun, "Movimiento"),
  mk("CHALLENGES_5", "Retador 5", "Completa 5 retos", "emoji-events", C.lilac, "Retos"),
  mk("CHALLENGES_10", "Retador 10", "Completa 10 retos", "emoji-events", C.lilac, "Retos"),
  mk("CHALLENGES_25", "Campeón 25", "Completa 25 retos", "military-tech", C.lilac, "Retos"),
  mk("CHALLENGES_50", "Campeón 50", "Completa 50 retos", "military-tech", C.sun, "Retos"),
  mk("CHALLENGES_100", "Leyenda 100", "Completa 100 retos", "badge", C.sun, "Retos"),
];

export const medalById = (id: string) => MEDALS.find((m) => m.id === id);
