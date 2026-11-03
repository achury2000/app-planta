// lib/orqStorage.ts
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type StoredSource = {
  id: string;
  title: string;
  type: string;
  category: string;
  description?: string;
};

export type StoredMessage = {
  id: string;
  author: "orq" | "user";
  text: string;
  sources?: StoredSource[];
};

const MAX_MESSAGES = 60;

function keyFor(scope: string) {
  return `orq_conversation_v1:${scope}`;
}

function isValidMessage(value: unknown): value is StoredMessage {
  if (!value || typeof value !== "object") return false;
  const m = value as StoredMessage;
  return (
    typeof m.id === "string" &&
    (m.author === "orq" || m.author === "user") &&
    typeof m.text === "string"
  );
}

/** Lee la conversación guardada (null si no hay o está corrupta) */
export async function getOrqConversation(
  scope: string
): Promise<StoredMessage[] | null> {
  const key = keyFor(scope);
  const raw =
    Platform.OS === "web"
      ? localStorage.getItem(key)
      : await AsyncStorage.getItem(key);

  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const clean = parsed.filter(isValidMessage).map((m) => ({
      ...m,
      sources: Array.isArray(m.sources) ? m.sources : undefined,
    }));
    return clean.length ? clean : null;
  } catch {
    return null;
  }
}

/** Guarda la conversación (ignora errores de cuota, etc.) */
export async function saveOrqConversation(
  scope: string,
  messages: StoredMessage[]
): Promise<void> {
  const key = keyFor(scope);
  const payload = JSON.stringify(messages.slice(-MAX_MESSAGES));
  try {
    if (Platform.OS === "web") {
      localStorage.setItem(key, payload);
      return;
    }
    await AsyncStorage.setItem(key, payload);
  } catch {
    // sin persistencia no es motivo para romper el chat
  }
}

/** Borra la conversación guardada */
export async function clearOrqConversation(scope: string): Promise<void> {
  const key = keyFor(scope);
  try {
    if (Platform.OS === "web") {
      localStorage.removeItem(key);
      return;
    }
    await AsyncStorage.removeItem(key);
  } catch {
    // ignore
  }
}
