// context/DataContext.tsx — Estado compartido: catálogo, progreso, guardados y check-in
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DateTime } from "luxon";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { apiFetch, isDemo, subscribeDemo } from "../constants/api";
import { stageOf } from "../constants/theme";
import { fetchRemoteSavedIds } from "../features/content/savedApi";
import { useAuth } from "./AuthContext";

export type Quiz = { question: string; options: string[]; correctIndex: number; explanation?: string };
export type Content = {
  _id: string;
  type: "video" | "article";
  category: "environment" | "fitness" | "routine" | "challenges";
  title: string;
  description: string;
  thumbnail: string;
  body: string;
  duration: number;
  views: number;
  isNew: boolean;
  isFeatured: boolean;
  status: string;
  createdAt: string;
  youtubeId?: string;
  videoUrl?: string;
  quiz?: Quiz[];
};
export type Summary = {
  streak: { current: number; best: number; lastActiveLocalDate: string | null };
  progress: { completed: { article: number; routine: number; challenge: number } };
  completedIds: string[];
  today: { localDate: string | null; completed: number };
  challenges: { completedCount: number; recent: { refId: string; at: string; meta: Record<string, any> }[] };
  medals: { id: string; earnedAt: string }[];
};
export type InProgress = {
  refType: "article" | "routine" | "challenge";
  refId: string;
  title: string | null;
  thumbnail: string | null;
  contentType: string | null;
  category: string | null;
  duration: number | null;
  updatedAt: string | null;
  percent: number | null;
  lastSeenIndex?: number;
  furthestIndex?: number;
  step?: number;
  durationSeconds?: number;
};
export type Ev = { type: string; refType: string; refId: string; at: string; localDate?: string; meta?: Record<string, any> };
export type Checkin = { date: string; stress: number; focus: number; energy: number; sleep: number } | null;

export const DAILY_GOAL = 3;

type Ctx = {
  contents: Content[];
  contentLoading: boolean;
  summary: Summary | null;
  inProgress: InProgress[];
  events: Ev[];
  saved: string[];
  checkin: Checkin;
  demo: boolean;
  totalDone: number;
  stage: ReturnType<typeof stageOf>;
  celebrate: string[];
  dismissCelebrate: () => void;
  byId: (id: string) => Content | undefined;
  refresh: () => Promise<void>;
  record: (type: string, refType: string, refId: string, meta?: Record<string, any>) => Promise<{ ok: boolean; error?: string; deduped?: boolean }>;
  trackProgress: (refType: "article" | "routine" | "challenge", refId: string, payload: Record<string, any>) => void;
  toggleSave: (id: string) => Promise<boolean>;
  saveCheckin: (c: Omit<NonNullable<Checkin>, "date">) => Promise<void>;
};

const DataCtx = createContext<Ctx | undefined>(undefined);
const todayStr = () => DateTime.now().setZone("America/Bogota").toISODate()!;

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user, token, isAuthenticated, handleUnauthorized } = useAuth();
  const [contents, setContents] = useState<Content[]>([]);
  const [contentLoading, setContentLoading] = useState(true);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [inProgress, setInProgress] = useState<InProgress[]>([]);
  const [events, setEvents] = useState<Ev[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
  const [checkin, setCheckin] = useState<Checkin>(null);
  const [demo, setDemo] = useState(isDemo());
  const [celebrate, setCelebrate] = useState<string[]>([]);
  const medalsRef = useRef<Set<string> | null>(null);

  useEffect(() => subscribeDemo(() => setDemo(isDemo())), []);

  const loadContent = useCallback(async () => {
    try {
      const res = await apiFetch(`/content?limit=50`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setContents(data);
      }
    } catch {}
    setContentLoading(false);
  }, []);

  const loadUser = useCallback(async () => {
    if (!token) return;
    const h = { Authorization: `Bearer ${token}` };
    try {
      const [s, a] = await Promise.all([apiFetch(`/achievements/summary`, { headers: h }), apiFetch(`/activity/me`, { headers: h })]);
      if (s.status === 401 || a.status === 401) {
        await handleUnauthorized();
        return;
      }
      if (s.ok) {
        const sum: Summary = await s.json();
        setSummary(sum);
        const ids = new Set(sum.medals.map((m) => m.id));
        if (!medalsRef.current) medalsRef.current = ids;
      }
      if (a.ok) {
        const act = await a.json();
        setInProgress(Array.isArray(act.inProgressList) ? act.inProgressList : []);
        setEvents(Array.isArray(act.events) ? act.events : []);
      }
      const sv = await fetchRemoteSavedIds(token);
      if (sv) setSaved(sv);
    } catch {}
  }, [token, handleUnauthorized]);

  useEffect(() => {
    void loadContent();
  }, [loadContent, demo]);

  useEffect(() => {
    medalsRef.current = null;
    if (!isAuthenticated || !token) {
      setSummary(null);
      setInProgress([]);
      setEvents([]);
      setSaved([]);
      setCheckin(null);
      return;
    }
    void loadUser();
    AsyncStorage.getItem(`planta_checkin:${user?.id}`)
      .then((raw) => {
        const c = raw ? JSON.parse(raw) : null;
        setCheckin(c && c.date === todayStr() ? c : null);
      })
      .catch(() => {});
  }, [isAuthenticated, token, user?.id, loadUser, demo]);

  const refresh = useCallback(async () => {
    await Promise.all([loadContent(), loadUser()]);
  }, [loadContent, loadUser]);

  const record: Ctx["record"] = useCallback(
    async (type, refType, refId, meta) => {
      if (!token) return { ok: false, error: "Inicia sesión para registrar tu progreso." };
      try {
        const res = await apiFetch(`/activity/event`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ type, refType, refId, meta }),
        });
        const json = await res.json().catch(() => ({}));
        if (res.status === 401) {
          await handleUnauthorized();
          return { ok: false, error: "Sesión expirada." };
        }
        if (!res.ok) return { ok: false, error: json?.error || "No se pudo registrar." };
        if (type.endsWith("_completed")) {
          const before = medalsRef.current ?? new Set<string>();
          const s = await apiFetch(`/achievements/summary`, { headers: { Authorization: `Bearer ${token}` } });
          if (s.ok) {
            const sum: Summary = await s.json();
            setSummary(sum);
            const fresh = sum.medals.map((m) => m.id).filter((id) => !before.has(id));
            medalsRef.current = new Set(sum.medals.map((m) => m.id));
            if (fresh.length) setCelebrate(fresh);
          }
          void loadUser();
        }
        return { ok: true, deduped: !!json?.deduped };
      } catch {
        return { ok: false, error: "Sin conexión con el servidor." };
      }
    },
    [token, handleUnauthorized, loadUser],
  );

  const trackProgress: Ctx["trackProgress"] = useCallback(
    (refType, refId, payload) => {
      if (!token) return;
      apiFetch(`/activity/in-progress`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ refType, refId, payload }),
      }).catch(() => {});
    },
    [token],
  );

  const toggleSave: Ctx["toggleSave"] = useCallback(
    async (id) => {
      if (!token) return false;
      const was = saved.includes(id);
      setSaved((s) => (was ? s.filter((x) => x !== id) : [id, ...s]));
      try {
        const res = await apiFetch(`/user/saved/${id}`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const j = await res.json();
          if (Array.isArray(j.ids)) setSaved(j.ids);
        }
      } catch {}
      return !was;
    },
    [token, saved],
  );

  const saveCheckin: Ctx["saveCheckin"] = useCallback(
    async (c) => {
      const full = { ...c, date: todayStr() };
      setCheckin(full);
      try {
        await AsyncStorage.setItem(`planta_checkin:${user?.id}`, JSON.stringify(full));
      } catch {}
    },
    [user?.id],
  );

  const totalDone = useMemo(() => {
    const c = summary?.progress.completed;
    return c ? c.article + c.routine + c.challenge : 0;
  }, [summary]);
  const stage = useMemo(() => stageOf(totalDone), [totalDone]);
  const byId = useCallback((id: string) => contents.find((c) => c._id === id), [contents]);

  const value: Ctx = {
    contents, contentLoading, summary, inProgress, events, saved, checkin, demo, totalDone, stage,
    celebrate, dismissCelebrate: () => setCelebrate([]), byId, refresh, record, trackProgress, toggleSave, saveCheckin,
  };
  return <DataCtx.Provider value={value}>{children}</DataCtx.Provider>;
}

export function useData() {
  const c = useContext(DataCtx);
  if (!c) throw new Error("useData fuera de DataProvider");
  return c;
}
