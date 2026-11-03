// features/content/savedApi.ts
import { apiFetch } from "../../constants/api";
import { getSavedIds, setSavedIds, toggleSavedId } from "./savedStorage";

/**
 * Guardados sincronizados con el backend.
 *
 * El backend es la fuente de verdad (D3): los guardados viajan con la
 * cuenta y se ven igual en el móvil y en la web.
 *
 * La caché local (savedStorage) se mantiene como respaldo: si el servidor
 * no responde, la app sigue mostrando lo que el usuario guardó.
 */

/** GET /api/user/saved → ids guardados (null si el backend no responde). */
export async function fetchRemoteSavedIds(
  token: string | null,
): Promise<string[] | null> {
  if (!token) return null;

  try {
    const res = await apiFetch(`/user/saved`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;

    const json = await res.json().catch(() => null);
    const ids = Array.isArray(json?.ids) ? json.ids : [];
    return ids.filter((x: unknown): x is string => typeof x === "string");
  } catch {
    return null;
  }
}

/**
 * Devuelve los ids guardados: del backend si responde, si no de la caché.
 * Siempre refresca la caché local con lo que llega del servidor.
 */
export async function syncSavedIds(
  userId: string,
  token: string | null,
): Promise<string[]> {
  const remote = await fetchRemoteSavedIds(token);

  if (remote) {
    await setSavedIds(userId, remote);
    return remote;
  }

  return getSavedIds(userId);
}

/**
 * Alterna un guardado.
 * Con sesión va al backend; sin sesión (o si falla) se resuelve local.
 */
export async function toggleSaved(
  userId: string,
  token: string | null,
  contentId: string,
): Promise<{ saved: boolean; ids: string[] }> {
  if (token) {
    try {
      const res = await apiFetch(
        `/user/saved/${encodeURIComponent(contentId)}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (res.ok) {
        const json = await res.json().catch(() => null);
        const ids = Array.isArray(json?.ids) ? json.ids : [];
        await setSavedIds(userId, ids);
        return { saved: !!json?.saved, ids };
      }
    } catch {
      // sin red: se cae al modo local
    }
  }

  return toggleSavedId(userId, contentId);
}
