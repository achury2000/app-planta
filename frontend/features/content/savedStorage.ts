// features/content/savedStorage.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const storage = {
  async get(key: string) {
    if (Platform.OS === "web") return localStorage.getItem(key);
    return AsyncStorage.getItem(key);
  },
  async set(key: string, value: string) {
    if (Platform.OS === "web") {
      localStorage.setItem(key, value);
      return;
    }
    return AsyncStorage.setItem(key, value);
  },
  async remove(key: string) {
    if (Platform.OS === "web") {
      localStorage.removeItem(key);
      return;
    }
    return AsyncStorage.removeItem(key);
  },
};

function keyFor(userId: string) {
  return `saved_content_v1:${userId}`;
}

/**
 * Lee IDs guardados
 * - Filtra tipos inválidos
 * - Elimina duplicados
 * - Preserva orden
 */
export async function getSavedIds(userId: string): Promise<string[]> {
  const raw = await storage.get(keyFor(userId));
  if (!raw) return [];

  try {
    const arr = JSON.parse(raw);
    const ids = Array.isArray(arr)
      ? arr.filter((x) => typeof x === "string")
      : [];

    // ✅ DEDUPE
    return Array.from(new Set(ids));
  } catch {
    return [];
  }
}

/**
 * Alterna guardado
 * - Nunca permite duplicados
 */
export async function toggleSavedId(
  userId: string,
  id: string,
): Promise<{ saved: boolean; ids: string[] }> {
  const ids = await getSavedIds(userId); // ya viene limpio
  const exists = ids.includes(id);

  const next = exists
    ? ids.filter((x) => x !== id)
    : [id, ...ids];

  // ✅ DEDUPE paranoico extra
  const nextClean = Array.from(new Set(next));

  await storage.set(keyFor(userId), JSON.stringify(nextClean));

  return { saved: !exists, ids: nextClean };
}

/**
 * Guarda el listado completo (usado al sincronizar con el backend).
 */
export async function setSavedIds(
  userId: string,
  ids: string[],
): Promise<void> {
  const clean = Array.from(
    new Set(ids.filter((x) => typeof x === "string" && x.length > 0)),
  );
  await storage.set(keyFor(userId), JSON.stringify(clean));
}
