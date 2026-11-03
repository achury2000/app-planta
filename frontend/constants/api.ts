// constants/api.ts
import { Platform } from "react-native";

/**
 * URL base del backend.
 *
 *   Para desarrollo local con Expo, cambia a tu IP local:
 *     export const API_BASE = "http://TU_IP:5000/api";
 *
 * En producción (Render) usa la URL desplegada.
 */
const configuredApiBase = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "");

// 10.0.2.2 es la dirección especial del emulador Android hacia el host.
// En web, el mismo backend local se alcanza mediante localhost.
const resolvedApiBase =
  Platform.OS === "web" && configuredApiBase?.includes("10.0.2.2")
    ? configuredApiBase.replace("10.0.2.2", "localhost")
    : configuredApiBase;

// Fallback de desarrollo: si falta EXPO_PUBLIC_API_URL no leave el fetch con
// "undefined/content", que rompia todas las pantallas en silencio.
export const API_BASE: string =
  resolvedApiBase ?? (Platform.OS === "web" ? "http://localhost:3000/api" : "http://10.0.2.2:3000/api");

/** Tiempo máximo de espera por petición (ms). */
export const API_TIMEOUT_MS = 20_000;

/* ───────────────────────────────────────────────
   MODO DEMO
   - EXPO_PUBLIC_DEMO=1  → siempre demo (sin backend).
   - EXPO_PUBLIC_DEMO=0  → nunca demo (solo backend real).
   - sin definir (auto)  → si el backend no responde, la app
     cambia sola a un servidor simulado en el dispositivo.
   ─────────────────────────────────────────────── */
const DEMO_ENV = process.env.EXPO_PUBLIC_DEMO;
let demoOn = DEMO_ENV === "1";
let backendReached = false;
const demoListeners = new Set<() => void>();

export const isDemo = () => demoOn;
export function subscribeDemo(fn: () => void) {
  demoListeners.add(fn);
  return () => {
    demoListeners.delete(fn);
  };
}
function setDemo(v: boolean) {
  if (demoOn === v) return;
  demoOn = v;
  demoListeners.forEach((f) => f());
}

async function demoFetch(url: string, options: RequestInit) {
  const { handleDemoRequest } = await import("../lib/demo/server");
  return handleDemoRequest(url.slice(API_BASE.length), options);
}

/**
 * fetch con timeout: si el backend no responde (apagado, IP equivocada o
 * red sin ruta), la petición se cancela en vez de quedarse colgada.
 * Si el modo demo está activo (o es automático) responde el servidor simulado.
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = API_TIMEOUT_MS,
): Promise<Response> {
  const isApi = url.startsWith(API_BASE);
  if (isApi && demoOn) return demoFetch(url, options);

  const controller = new AbortController();
  // Mientras no se haya confirmado el backend, se sondea rápido (4 s).
  const limit = isApi && !backendReached && DEMO_ENV !== "0" ? 4000 : timeoutMs;
  const timer = setTimeout(() => controller.abort(), limit);

  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    if (isApi) backendReached = true;
    return res;
  } catch (e) {
    if (isApi && DEMO_ENV !== "0" && !backendReached) {
      setDemo(true);
      return demoFetch(url, options);
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

/** Igual que fetch pero con la URL base del backend. */
export async function apiFetch(
  path: string,
  options: RequestInit = {},
  timeoutMs: number = API_TIMEOUT_MS,
): Promise<Response> {
  return fetchWithTimeout(`${API_BASE}${path}`, options, timeoutMs);
}

/** Error de red por tiempo de espera (para mensajes claros). */
export function isTimeoutError(err: unknown): boolean {
  return (
    !!err &&
    typeof err === "object" &&
    (err as { name?: string }).name === "AbortError"
  );
}
