// features/admin/adminApi.ts
import { fetchWithTimeout } from "@/constants/api";
import type { User } from "@/context/AuthContext";

export type AdminUserRow = Pick<User, "id" | "name" | "email" | "role"> & {
  createdAt?: string;
  blocked?: boolean;
};

export type ListUsersResponse = {
  page: number;
  limit: number;
  total: number;
  users: AdminUserRow[];
};

export type AdminUserDetail = {
  user: AdminUserRow & { blocked: boolean };
  stats: {
    streakCurrent: number;
    streakBest: number;
    completed: { article: number; routine: number; challenge: number };
  };
  medals: { id: string; earnedAt: string }[];
  challenges: {
    completedCount: number;
    recent: { refId: string; at: string; meta: Record<string, any> }[];
  };
  recentEvents: {
    type: string;
    refType: string;
    refId: string;
    at: string;
    localDate?: string;
    meta: Record<string, any>;
  }[];
};

export async function adminListUsers(params: {
  apiBase: string;
  token: string;
  search?: string;
  page?: number;
  limit?: number;
  on401: () => Promise<void>;
}): Promise<
  | { ok: true; data: ListUsersResponse }
  | { ok: false; error: string; status?: number }
> {
  const { apiBase, token, search = "", page = 1, limit = 20, on401 } = params;

  const url = new URL(`${apiBase}/admin/users`);
  if (search.trim()) url.searchParams.set("search", search.trim());
  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", String(limit));

  let res: Response;
  try {
    res = await fetchWithTimeout(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    return { ok: false, error: "No se pudo conectar al servidor" };
  }

  const json = await res.json().catch(() => ({}));

  if (res.status === 401) {
    await on401();
    return {
      ok: false,
      status: 401,
      error: "Sesión expirada. Inicia sesión de nuevo.",
    };
  }

  if (res.status === 403) {
    return { ok: false, status: 403, error: "No autorizado (solo admin)." };
  }

  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      error: json?.error || "Error al cargar ",
    };
  }

  return { ok: true, data: json as ListUsersResponse };
}

/** GET /api/admin/users/:id — detalle con actividad */
export async function adminGetUser(params: {
  apiBase: string;
  token: string;
  id: string;
  on401: () => Promise<void>;
}): Promise<
  | { ok: true; data: AdminUserDetail }
  | { ok: false; error: string; status?: number }
> {
  const { apiBase, token, id, on401 } = params;

  let res: Response;
  try {
    res = await fetchWithTimeout(`${apiBase}/admin/users/${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    return { ok: false, error: "No se pudo conectar al servidor" };
  }

  const json = await res.json().catch(() => ({}));

  if (res.status === 401) {
    await on401();
    return {
      ok: false,
      status: 401,
      error: "Sesión expirada. Inicia sesión de nuevo.",
    };
  }

  if (res.status === 403) {
    return { ok: false, status: 403, error: "No autorizado (solo admin)." };
  }

  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      error: json?.error || "No se pudo cargar el usuario",
    };
  }

  return { ok: true, data: json as AdminUserDetail };
}

/** PATCH /api/admin/users/:id — cambiar rol o bloquear */
export async function adminUpdateUser(params: {
  apiBase: string;
  token: string;
  id: string;
  updates: { role?: "user" | "admin"; blocked?: boolean };
  on401: () => Promise<void>;
}): Promise<
  | { ok: true; data: AdminUserRow }
  | { ok: false; error: string; status?: number }
> {
  const { apiBase, token, id, updates, on401 } = params;

  let res: Response;
  try {
    res = await fetchWithTimeout(`${apiBase}/admin/users/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });
  } catch {
    return { ok: false, error: "No se pudo conectar al servidor" };
  }

  const json = await res.json().catch(() => ({}));

  if (res.status === 401) {
    await on401();
    return {
      ok: false,
      status: 401,
      error: "Sesión expirada. Inicia sesión de nuevo.",
    };
  }

  if (res.status === 403) {
    return { ok: false, status: 403, error: "No autorizado (solo admin)." };
  }

  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      error: json?.error || "No se pudo actualizar el usuario",
    };
  }

  return { ok: true, data: json?.user as AdminUserRow };
}
