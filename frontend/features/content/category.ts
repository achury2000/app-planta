// features/content/category.ts

export type CategoryId =
  | "environment"
  | "fitness"
  | "routine"
  | "challenges";

export const CATEGORY_LABEL: Record<CategoryId, string> = {
  environment: "Medio ambiente",
  fitness: "Actividad física",
  routine: "Rutina",
  challenges: "Retos",
};
