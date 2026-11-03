// lib/demo/server.ts
// Servidor simulado (en el dispositivo) con el MISMO contrato que /backend.
// Permite usar, probar y presentar la app sin MongoDB ni internet.
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DateTime } from "luxon";

import { DEMO_CONTENT, type DemoContent } from "./content";

type Ev = {
  type: string;
  refType: string;
  refId: string;
  meta: Record<string, any>;
  at: string;
  localDate: string;
};
type Medal = { id: string; earnedAt: string; meta: object };
type DUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: "user" | "admin";
  blocked: boolean;
  avatar: string | null;
  notifications: boolean;
  createdAt: string;
  saved: string[];
  activity: {
    events: Ev[];
    inProgress: Record<"article" | "routine" | "challenge", any[]>;
    stats: {
      streakCurrent: number;
      streakBest: number;
      completed: { article: number; routine: number; challenge: number };
      lastActiveLocalDate: string | null;
    };
    medals: Medal[];
  };
};
type DB = { users: DUser[]; contents: DemoContent[]; seq: number };

const KEY = "planta_demo_db_v2";
const MIN_WALK_KM = 0.8;
let cache: DB | null = null;

const today = () => DateTime.now().setZone("America/Bogota").toISODate()!;
const daysAgo = (n: number) =>
  DateTime.now().setZone("America/Bogota").minus({ days: n });

const MEDAL_RULES: { id: string; test: (u: DUser) => boolean }[] = [
  { id: "FIRST_ARTICLE", test: (u) => u.activity.stats.completed.article >= 1 },
  { id: "FIRST_ROUTINE", test: (u) => u.activity.stats.completed.routine >= 1 },
  { id: "FIRST_CHALLENGE", test: (u) => u.activity.stats.completed.challenge >= 1 },
  ...[3, 7, 14, 30, 100].map((n) => ({
    id: `STREAK_${n}`,
    test: (u: DUser) => u.activity.stats.streakBest >= n,
  })),
  ...[5, 10, 25, 50, 100].map((n) => ({
    id: `ARTICLES_${n}`,
    test: (u: DUser) => u.activity.stats.completed.article >= n,
  })),
  ...[5, 10, 25, 50].map((n) => ({
    id: `ROUTINES_${n}`,
    test: (u: DUser) => u.activity.stats.completed.routine >= n,
  })),
  ...[5, 10, 25, 50, 100].map((n) => ({
    id: `CHALLENGES_${n}`,
    test: (u: DUser) => u.activity.stats.completed.challenge >= n,
  })),
];

function emptyActivity(): DUser["activity"] {
  return {
    events: [],
    inProgress: { article: [], routine: [], challenge: [] },
    stats: {
      streakCurrent: 0,
      streakBest: 0,
      completed: { article: 0, routine: 0, challenge: 0 },
      lastActiveLocalDate: null,
    },
    medals: [],
  };
}

function awardMedals(u: DUser) {
  const have = new Set(u.activity.medals.map((m) => m.id));
  for (const r of MEDAL_RULES) {
    if (!have.has(r.id) && r.test(u)) {
      u.activity.medals.push({ id: r.id, earnedAt: new Date().toISOString(), meta: {} });
    }
  }
}

function mkUser(
  seq: number,
  name: string,
  email: string,
  password: string,
  role: "user" | "admin" = "user",
): DUser {
  return {
    id: `65f0b2d3e4a5c6d7e8f9${String(seq).padStart(4, "0")}`,
    name,
    email,
    password,
    role,
    blocked: false,
    avatar: null,
    notifications: true,
    createdAt: daysAgo(20 - seq * 2).toISO()!,
    saved: [],
    activity: emptyActivity(),
  };
}

/** Historial de ejemplo: Carlos lleva una racha de 6 días (¡le falta hoy para el 7!). */
function seedHistory(u: DUser, plan: [number, string, string][], streak: number) {
  for (const [ago, type, refId] of plan) {
    const d = daysAgo(ago);
    const refType = type.split("_")[0] === "article" ? "article" : type.split("_")[0] === "challenge" ? "challenge" : "routine";
    u.activity.events.push({
      type,
      refType,
      refId,
      meta: refType === "challenge" ? { source: "gps", distanceKm: 1.2 } : {},
      at: d.toISO()!,
      localDate: d.toISODate()!,
    });
    const k = refType as "article" | "routine" | "challenge";
    u.activity.stats.completed[k] += 1;
  }
  u.activity.events.sort((a, b) => +new Date(b.at) - +new Date(a.at));
  u.activity.stats.streakCurrent = streak;
  u.activity.stats.streakBest = streak;
  u.activity.stats.lastActiveLocalDate = daysAgo(1).toISODate()!;
  awardMedals(u);
}

function seedDB(): DB {
  const admin = mkUser(1, "Administrador Planta", "admin@planta.com", "admin123", "admin");
  const carlos = mkUser(2, "Carlos Pérez", "carlos@planta.com", "demo123");
  const maria = mkUser(3, "María Gómez", "maria@planta.com", "demo123");
  const juan = mkUser(4, "Juan Rodríguez", "juan@planta.com", "demo123");
  const c = (n: number) => DEMO_CONTENT[n]._id;

  seedHistory(
    carlos,
    [
      [6, "article_completed", c(2)],
      [5, "routine_completed", c(0)],
      [4, "article_completed", c(4)],
      [4, "challenge_completed", "c1"],
      [3, "article_completed", c(5)],
      [2, "routine_completed", c(1)],
      [2, "article_completed", c(6)],
      [1, "challenge_completed", "c3"],
      [1, "article_completed", c(7)],
    ],
    6,
  );
  seedHistory(
    maria,
    [
      [3, "article_completed", c(2)],
      [2, "routine_completed", c(0)],
      [1, "article_completed", c(5)],
    ],
    3,
  );
  carlos.saved = [c(9), c(10)];

  return { users: [admin, carlos, maria, juan], contents: DEMO_CONTENT.map((x) => ({ ...x })), seq: 10 };
}

async function load(): Promise<DB> {
  if (cache) return cache;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) {
      cache = JSON.parse(raw) as DB;
      return cache;
    }
  } catch {}
  cache = seedDB();
  await save();
  return cache;
}

async function save() {
  try {
    if (cache) await AsyncStorage.setItem(KEY, JSON.stringify(cache));
  } catch {}
}

/** Borra los datos demo (vuelve al estado inicial). */
export async function resetDemoData() {
  cache = seedDB();
  await save();
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
const err = (error: string, status = 400, extra: object = {}) =>
  json({ error, ...extra }, status);

const publicUser = (u: DUser) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  avatar: u.avatar,
  notifications: u.notifications,
});

const norm = (s: string) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

function haversine(a: any, b: any) {
  const R = 6371, rad = (x: number) => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function sortList(list: DemoContent[], sort?: string | null) {
  const arr = [...list];
  if (sort === "popular") arr.sort((a, b) => b.views - a.views);
  else if (sort === "oldest") arr.sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
  else arr.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  return arr;
}

function filterContent(db: DB, q: URLSearchParams, includeAll = false) {
  let list = db.contents.filter((c) => includeAll || c.status === "published");
  const type = q.get("type"), category = q.get("category"), featured = q.get("featured"), search = q.get("search"), ids = q.get("ids");
  if (type) list = list.filter((c) => c.type === type);
  if (category) list = list.filter((c) => c.category === category);
  if (featured === "true") list = list.filter((c) => c.isFeatured);
  if (ids) {
    const set = new Set(ids.split(",").map((s) => s.trim()));
    list = list.filter((c) => set.has(c._id));
  }
  if (search) {
    const s = norm(search);
    list = list.filter((c) => norm(`${c.title} ${c.description}`).includes(s));
  }
  return sortList(list, q.get("sort"));
}

function orqAnswer(db: DB, user: DUser | null, message: string) {
  const m = norm(message);
  const pub = db.contents.filter((c) => c.status === "published");
  const stats = user?.activity.stats;
  const pick = (items: DemoContent[]) => items.slice(0, 3);
  const ref = (items: DemoContent[]) => items.map((c) => `«${c.title}»`).join(", ");
  let answer = "";
  let sources: DemoContent[] = [];

  if (/(racha|streak|dias seguidos|constancia)/.test(m)) {
    const cur = stats?.streakCurrent ?? 0;
    answer = user
      ? `Tu racha actual es de ${cur} ${cur === 1 ? "día" : "días"} y tu mejor marca es ${stats?.streakBest ?? 0}. Completa una acción hoy para mantenerla viva. Una lectura corta puede ayudarte: `
      : "La racha cuenta los días seguidos en los que completas al menos una acción. Inicia sesión para ver la tuya. Para empezar suave, prueba: ";
    sources = pick(pub.filter((c) => c.duration <= 6 && c.type === "article"));
    answer += ref(sources) + ".";
  } else if (/(reto|retos|challenge|caminar|camina)/.test(m)) {
    sources = pick(pub.filter((c) => c.category === "challenges"));
    answer = `Los retos son acciones concretas que suman a tu racha: caminar 1 km con GPS, 7 días sin plástico o 5 minutos de respiración. Si quieres leer antes de empezar: ${ref(sources)}.`;
  } else if (/(estres|ansiedad|calma|respira|respirar|dormir|sueno|descans)/.test(m)) {
    sources = pick(pub.filter((c) => /respira|descansa|rutina/i.test(c.title)));
    answer = `Para bajar el estrés lo más efectivo es una pausa corta y consciente: respirar lento 5 minutos o cuidar tu descanso. Te dejo ${ref(sources)}.`;
  } else if (/(ejercicio|fuerza|entren|pesas|musculo|movilidad|fitness|deporte)/.test(m)) {
    sources = pick(pub.filter((c) => c.category === "fitness"));
    answer = `Para moverte con buena técnica y sin lesiones, empieza por ${ref(sources)}. Recuerda: la constancia vence a la intensidad.`;
  } else if (/(ambient|reciclar|plastico|planeta|bici|aire|ecolog|naturaleza)/.test(m)) {
    sources = pick(pub.filter((c) => c.category === "environment"));
    answer = `Cuidarte y cuidar el entorno van juntos. Estas lecturas te dan acciones simples: ${ref(sources)}.`;
  } else if (/(nuevo|novedad|reciente|hoy|aprender|recomienda|recomiend)/.test(m)) {
    sources = pick(sortList(pub.filter((c) => c.isNew || c.isFeatured)));
    answer = `Esto es lo más reciente y recomendado ahora mismo: ${ref(sources)}. Elige uno y termina antes de que acabe el día.`;
  } else {
    const words = norm(message).split(" ").filter((w) => w.length >= 4);
    sources = pick(pub.filter((c) => words.some((w) => norm(`${c.title} ${c.description}`).includes(w))));
    if (sources.length) answer = `Encontré esto en Planta que se relaciona con lo que preguntas: ${ref(sources)}.`;
    else {
      sources = pick(pub.filter((c) => c.isFeatured));
      answer = `Puedo ayudarte con hábitos, retos, ejercicio, respiración y cuidado del ambiente. Mientras tanto, estos contenidos destacados te pueden servir: ${ref(sources)}.`;
    }
  }
  return {
    answer,
    authenticated: !!user,
    sources: sources.map((c) => ({ id: c._id, title: c.title, type: c.type, category: c.category, description: c.description })),
  };
}

export async function handleDemoRequest(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const db = await load();
  const method = (options.method || "GET").toUpperCase();
  const url = new URL(path, "http://demo.local");
  const p = url.pathname.replace(/\/+$/, "");
  const q = url.searchParams;
  let body: any = {};
  try {
    if (options.body) body = JSON.parse(String(options.body));
  } catch {}

  const hdr = (options.headers ?? {}) as Record<string, string>;
  const auth = hdr.Authorization || hdr.authorization || "";
  const tokenId = auth.startsWith("Bearer demo.") ? auth.slice(12) : null;
  const me = tokenId ? db.users.find((u) => u.id === tokenId) ?? null : null;
  const needAuth = () => (me ? null : err("Token inválido", 401));
  const needAdmin = () => needAuth() ?? (me!.role === "admin" ? null : err("No autorizado", 403));
  await new Promise((r) => setTimeout(r, 120)); // latencia realista

  /* ── AUTH ── */
  if (p === "/auth/login" && method === "POST") {
    const email = String(body.email || "").trim().toLowerCase();
    if (!email || !body.password) return err("Correo y contraseña son obligatorios");
    const u = db.users.find((x) => x.email === email && x.password === body.password);
    if (!u) return err("Credenciales incorrectas", 401);
    if (u.blocked) return err("Tu cuenta esta bloqueada. Contacta al administrador.", 403);
    return json({ token: `demo.${u.id}`, user: publicUser(u) });
  }
  if (p === "/auth/register" && method === "POST") {
    const { name, email, password } = body;
    if (!name || !email || !password) return err("Todos los campos son obligatorios");
    if (String(password).length < 6) return err("La contraseña debe tener al menos 6 caracteres");
    const em = String(email).trim().toLowerCase();
    if (db.users.some((u) => u.email === em)) return err("El correo ya está registrado");
    db.seq += 1;
    const u = mkUser(db.seq, String(name).trim(), em, password);
    u.createdAt = new Date().toISOString();
    db.users.unshift(u);
    await save();
    return json({ token: `demo.${u.id}`, user: publicUser(u) }, 201);
  }
  if (p === "/auth/me") {
    const bad = needAuth();
    if (bad) return bad;
    if (method === "GET") return json({ user: publicUser(me!), ...publicUser(me!) });
    if (method === "PUT") {
      if (body.name !== undefined) {
        if (!String(body.name).trim()) return err("El nombre no puede estar vacío");
        me!.name = String(body.name).trim();
      }
      if (body.password) {
        if (String(body.password).length < 6) return err("La contraseña debe tener al menos 6 caracteres");
        me!.password = body.password;
      }
      if (body.avatar !== undefined) me!.avatar = body.avatar || null;
      if (body.notifications !== undefined) me!.notifications = !!body.notifications;
      await save();
      return json({ token: `demo.${me!.id}`, user: publicUser(me!) });
    }
    if (method === "DELETE") {
      db.users = db.users.filter((u) => u.id !== me!.id);
      await save();
      return json({ message: "Cuenta eliminada correctamente" });
    }
  }

  /* ── CONTENIDO ── */
  if (p === "/content" && method === "GET") {
    let list = filterContent(db, q);
    const limit = parseInt(q.get("limit") || "", 10);
    if (limit > 0) list = list.slice(0, limit);
    return json(list);
  }
  if (p === "/content/paginated" && method === "GET") {
    const list = filterContent(db, q);
    const limit = Math.min(parseInt(q.get("limit") || "12", 10) || 12, 50);
    const page = Math.max(parseInt(q.get("page") || "1", 10) || 1, 1);
    return json({
      items: list.slice((page - 1) * limit, page * limit),
      page,
      limit,
      total: list.length,
      hasMore: page * limit < list.length,
    });
  }
  if (p === "/content/admin/all" && method === "GET") {
    const bad = needAdmin();
    if (bad) return bad;
    return json(sortList(db.contents, q.get("sort")));
  }
  let m = p.match(/^\/content\/([^/]+)$/);
  if (p === "/content" && method === "POST") {
    const bad = needAdmin();
    if (bad) return bad;
    if (!body.title || !body.category || !body.type) return err("Título, categoría y tipo son obligatorios");
    db.seq += 1;
    const item: DemoContent = {
      _id: `65f0a1c4e7b2d3a9f8c1${String(db.seq).padStart(4, "0")}`,
      type: body.type,
      category: body.category,
      title: body.title,
      description: body.description || "",
      thumbnail: body.thumbnail || "asset:cambio",
      body: body.body || "",
      duration: Number(body.duration) || 5,
      views: 0,
      isNew: true,
      isFeatured: !!body.isFeatured,
      status: body.status || "published",
      createdAt: new Date().toISOString(),
      quiz: body.quiz,
      youtubeId: body.youtubeId,
      videoUrl: body.videoUrl,
    };
    db.contents.unshift(item);
    await save();
    return json(item, 201);
  }
  if (m && !["paginated"].includes(m[1])) {
    const item = db.contents.find((c) => c._id === m![1]);
    if (method === "GET") {
      if (!item) return err("Contenido no encontrado", 404);
      item.views += 1;
      await save();
      return json(item);
    }
    if (method === "PUT") {
      const bad = needAdmin();
      if (bad) return bad;
      if (!item) return err("No encontrado", 404);
      Object.assign(item, body);
      await save();
      return json(item);
    }
    if (method === "DELETE") {
      const bad = needAdmin();
      if (bad) return bad;
      if (!item) return err("No encontrado", 404);
      db.contents = db.contents.filter((c) => c._id !== item._id);
      await save();
      return json({ ok: true });
    }
  }

  /* ── GUARDADOS ── */
  if (p === "/user/saved" && method === "GET") {
    const bad = needAuth();
    if (bad) return bad;
    return json({ ids: me!.saved });
  }
  m = p.match(/^\/user\/saved\/([^/]+)$/);
  if (m && method === "POST") {
    const bad = needAuth();
    if (bad) return bad;
    const has = me!.saved.includes(m[1]);
    me!.saved = has ? me!.saved.filter((x) => x !== m![1]) : [m[1], ...me!.saved];
    await save();
    return json({ saved: !has, ids: me!.saved });
  }

  /* ── ACTIVIDAD ── */
  if (p === "/activity/me" && method === "GET") {
    const bad = needAuth();
    if (bad) return bad;
    const a = me!.activity;
    const list: any[] = [];
    for (const rt of ["article", "routine", "challenge"] as const) {
      for (const it of a.inProgress[rt]) {
        const c = db.contents.find((x) => x._id === it.refId);
        let percent: number | null = null;
        if (rt === "routine") percent = it.duration > 0 ? Math.min(100, (it.step / it.duration) * 100) : null;
        if (rt === "challenge") percent = it.progress > 1 ? Math.min(100, it.progress) : (it.progress || 0) * 100;
        list.push({
          refType: rt,
          refId: it.refId,
          title: c?.title ?? null,
          thumbnail: c?.thumbnail ?? null,
          contentType: c?.type ?? null,
          category: c?.category ?? null,
          duration: c?.duration ?? null,
          updatedAt: it.updatedAt,
          percent,
          ...(rt === "article" ? { lastSeenIndex: it.lastSeenIndex ?? 0, furthestIndex: it.furthestIndex ?? 0 } : {}),
          ...(rt === "routine" ? { step: it.step ?? 0, durationSeconds: it.duration ?? 0 } : {}),
        });
      }
    }
    list.sort((x, y) => +new Date(y.updatedAt || 0) - +new Date(x.updatedAt || 0));
    return json({ inProgress: {}, inProgressList: list, events: a.events.slice(0, 20) });
  }
  m = p.match(/^\/activity\/(article|routine)\/([^/]+)\/in-progress$/);
  if (m && method === "GET") {
    const bad = needAuth();
    if (bad) return bad;
    const it = me!.activity.inProgress[m[1] as "article" | "routine"].find((x) => x.refId === m![2]);
    if (m[1] === "article")
      return json(it ? { found: true, lastSeenIndex: it.lastSeenIndex ?? 0, furthestIndex: it.furthestIndex ?? 0 } : { found: false, lastSeenIndex: 0, furthestIndex: 0 });
    return json(it ? { found: true, step: it.step ?? 0, duration: it.duration ?? 0 } : { found: false, step: 0, duration: 0 });
  }
  if (p === "/activity/in-progress" && method === "PATCH") {
    const bad = needAuth();
    if (bad) return bad;
    const { refType, refId, payload } = body;
    if (!refType || !refId) return err("refType y refId son obligatorios");
    if (!["article", "routine", "challenge"].includes(refType)) return err("refType inválido para in-progress");
    const list = me!.activity.inProgress[refType as "article"];
    const prev = list.find((x) => x.refId === String(refId));
    let next: any = { refId: String(refId), updatedAt: new Date().toISOString() };
    if (refType === "article") {
      const idx = Number(payload?.slideIndex ?? 0);
      if (!Number.isFinite(idx) || idx < 0) return err("slideIndex inválido");
      next.lastSeenIndex = idx;
      next.furthestIndex = Math.max(Number(prev?.furthestIndex ?? 0), idx);
    } else if (refType === "routine") {
      next.step = Number(payload?.step ?? 0);
      next.duration = Number(payload?.duration ?? 0) || 0;
    } else next.progress = Number(payload?.progress ?? 0);
    me!.activity.inProgress[refType as "article"] = [next, ...list.filter((x) => x.refId !== next.refId)].slice(0, 10);
    await save();
    return json({ ok: true });
  }
  if (p === "/activity/event" && method === "POST") {
    const bad = needAuth();
    if (bad) return bad;
    const { type, refType, refId } = body;
    let meta = body.meta ? { ...body.meta } : {};
    if (!type || !refType || !refId) return err("type, refType, refId son obligatorios");
    if (!["article_started","article_completed","routine_started","routine_completed","challenge_started","challenge_completed","quiz_submitted"].includes(type)) return err("type inválido");
    if (!["article", "routine", "challenge", "quiz"].includes(refType)) return err("refType inválido");

    if (type === "challenge_completed" && refType === "challenge" && body.meta) {
      const src = String(meta.source || "self_report");
      if (src === "gps") {
        const tr: any[] = Array.isArray(meta.track) ? meta.track : [];
        if (tr.length < 2) return err("Rastro GPS insuficiente");
        let km = 0;
        for (let i = 1; i < tr.length; i++) km += haversine(tr[i - 1], tr[i]);
        km = Math.round(km * 100) / 100;
        if (km < MIN_WALK_KM) return err("Distancia insuficiente", 400, { meta: { distanceKm: km, requiredKm: MIN_WALK_KM } });
        meta.distanceKm = km;
        meta.trackPoints = tr.length;
        delete meta.track;
      } else if (src === "manual") {
        const km = Number(meta.distanceKm);
        if (!Number.isFinite(km) || km < MIN_WALK_KM) return err("Distancia insuficiente", 400, { meta: { requiredKm: MIN_WALK_KM, receivedKm: km } });
      }
    }

    const d = today();
    const done = type.endsWith("_completed");
    if (done && me!.activity.events.some((e) => e.type === type && e.refType === refType && e.refId === String(refId) && e.localDate === d))
      return json({ ok: true, deduped: true });

    me!.activity.events = [{ type, refType, refId: String(refId), meta, at: new Date().toISOString(), localDate: d }, ...me!.activity.events].slice(0, 100);
    if (done) {
      const s = me!.activity.stats;
      if (s.lastActiveLocalDate !== d) {
        const yesterday = DateTime.fromISO(d).minus({ days: 1 }).toISODate();
        s.streakCurrent = s.lastActiveLocalDate === yesterday ? s.streakCurrent + 1 : 1;
        s.lastActiveLocalDate = d;
      }
      s.streakBest = Math.max(s.streakBest, s.streakCurrent);
      s.completed[refType as "article"] += 1;
      awardMedals(me!);
      const l = me!.activity.inProgress[refType as "article"];
      if (l) me!.activity.inProgress[refType as "article"] = l.filter((x) => x.refId !== String(refId));
    }
    await save();
    return json({ ok: true });
  }

  /* ── LOGROS ── */
  if (p === "/achievements/summary" && method === "GET") {
    const bad = needAuth();
    if (bad) return bad;
    const a = me!.activity;
    const d = today();
    const isDone = (e: Ev) => e.type.endsWith("_completed");
    const completedIds = Array.from(new Set(a.events.filter(isDone).map((e) => e.refId)));
    const ch = a.events.filter((e) => e.type === "challenge_completed");
    return json({
      streak: { current: a.stats.streakCurrent, best: a.stats.streakBest, lastActiveLocalDate: a.stats.lastActiveLocalDate },
      progress: { completed: a.stats.completed },
      completedIds,
      today: { localDate: a.stats.lastActiveLocalDate, completed: a.events.filter((e) => isDone(e) && e.localDate === d).length },
      challenges: { completedCount: a.stats.completed.challenge, recent: ch.slice(0, 10).map((e) => ({ refId: e.refId, at: e.at, meta: e.meta })) },
      medals: a.medals,
    });
  }

  /* ── ORQ ── */
  if (p === "/orq/chat" && method === "POST") {
    const message = String(body.message || "").trim();
    if (!message) return err("Escribe un mensaje para ORQ.");
    if (message.length > 600) return err("El mensaje es demasiado largo.");
    await new Promise((r) => setTimeout(r, 650));
    return json(orqAnswer(db, me, message));
  }

  /* ── ADMIN ── */
  if (p === "/admin/users" && method === "GET") {
    const bad = needAdmin();
    if (bad) return bad;
    const s = norm(q.get("search") || "");
    const all = db.users.filter((u) => !s || norm(`${u.name} ${u.email}`).includes(s));
    const limit = parseInt(q.get("limit") || "20", 10) || 20;
    const page = parseInt(q.get("page") || "1", 10) || 1;
    return json({
      page, limit, total: all.length,
      users: all.slice((page - 1) * limit, page * limit).map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, blocked: u.blocked, createdAt: u.createdAt })),
    });
  }
  if (p === "/admin/challenges" && method === "GET") {
    const bad = needAdmin();
    if (bad) return bad;
    const rows: any[] = [];
    for (const u of db.users)
      for (const e of u.activity.events)
        if (e.type === "challenge_completed")
          rows.push({ userId: u.id, userName: u.name, userEmail: u.email, refId: e.refId, distanceKm: e.meta?.distanceKm, source: e.meta?.source, steps: e.meta?.steps, at: e.at, localDate: e.localDate });
    rows.sort((a, b) => +new Date(b.at) - +new Date(a.at));
    return json({ page: 1, limit: 100, total: rows.length, completions: rows });
  }
  m = p.match(/^\/admin\/users\/([^/]+)$/);
  if (m) {
    const bad = needAdmin();
    if (bad) return bad;
    const u = db.users.find((x) => x.id === m![1]);
    if (!u) return err("Usuario no encontrado", 404);
    if (method === "GET") {
      const ch = u.activity.events.filter((e) => e.type === "challenge_completed");
      return json({
        user: { id: u.id, name: u.name, email: u.email, role: u.role, blocked: u.blocked, createdAt: u.createdAt },
        stats: { streakCurrent: u.activity.stats.streakCurrent, streakBest: u.activity.stats.streakBest, completed: u.activity.stats.completed },
        medals: u.activity.medals.map((x) => ({ id: x.id, earnedAt: x.earnedAt })),
        challenges: { completedCount: ch.length, recent: ch.slice(0, 10).map((e) => ({ refId: e.refId, at: e.at, meta: e.meta })) },
        recentEvents: u.activity.events.slice(0, 15),
      });
    }
    if (method === "PATCH") {
      if (u.id === me!.id && (body.role !== undefined || body.blocked !== undefined)) return err("No puedes modificar tu propia cuenta.");
      if (body.role !== undefined) {
        if (!["user", "admin"].includes(body.role)) return err("Rol inválido");
        u.role = body.role;
      }
      if (body.blocked !== undefined) u.blocked = !!body.blocked;
      await save();
      return json({ id: u.id, name: u.name, email: u.email, role: u.role, blocked: u.blocked });
    }
  }

  return err(`Ruta demo no disponible: ${method} ${p}`, 404);
}
