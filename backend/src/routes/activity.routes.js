// backend/src/routes/activity.routes.js
const router = require("express").Router();
const User = require("../models/User");
const Content = require("../models/Content");
const { requireAuth } = require("../middleware/auth");
const { validateWalkingTrack, MIN_WALK_KM } = require("../utils/geo");

// Recomendado: npm i luxon
const { DateTime } = require("luxon");

const allowedTypes = new Set([
  "article_started",
  "article_completed",
  "routine_started",
  "routine_completed",
  "challenge_started",
  "challenge_completed",
  "quiz_submitted",
]);

const allowedRefTypes = new Set(["article", "routine", "challenge", "quiz"]);
const allowedInProgressRefTypes = new Set(["article", "routine", "challenge"]);

/** Máximo de pendientes guardados por tipo (para "Continuar"). */
const MAX_IN_PROGRESS_PER_TYPE = 10;

function bogotaLocalDateNow() {
  return DateTime.now().setZone("America/Bogota").toISODate(); // "YYYY-MM-DD"
}

function isCompletedType(type) {
  return typeof type === "string" && type.endsWith("_completed");
}

/**
 * Limpia inProgress cuando se completa algo
 * (si el inProgress actual coincide con el refId completado)
 */
function clearInProgressIfCompleted(user, type, refId) {
  if (!user.activity) user.activity = {};
  if (!user.activity.inProgress) user.activity.inProgress = {};

  const rid = String(refId);

  if (type === "article_completed") {
    const cur = user.activity.inProgress.article;
    if (cur?.refId && String(cur.refId) === rid) {
      user.activity.inProgress.article = {
        refId: null,
        lastSeenIndex: 0,
        furthestIndex: 0,
        updatedAt: new Date(),
      };
    }
  }

  if (type === "routine_completed") {
    const cur = user.activity.inProgress.routine;
    if (cur?.refId && String(cur.refId) === rid) {
      user.activity.inProgress.routine = {
        refId: null,
        step: 0,
        updatedAt: new Date(),
      };
    }
  }

  if (type === "challenge_completed") {
    const cur = user.activity.inProgress.challenge;
    if (cur?.refId && String(cur.refId) === rid) {
      user.activity.inProgress.challenge = {
        refId: null,
        progress: 0,
        updatedAt: new Date(),
      };
    }
  }

  // Quita el pendiente de la lista (hay varios por tipo).
  const listKey =
    type === "article_completed"
      ? "article"
      : type === "routine_completed"
        ? "routine"
        : type === "challenge_completed"
          ? "challenge"
          : null;

  if (listKey) {
    const lists = user.activity.inProgress.lists;
    if (lists && Array.isArray(lists[listKey])) {
      lists[listKey] = lists[listKey].filter((it) => String(it?.refId) !== rid);
    }
  }
}

/**
 * Guarda (o actualiza) un pendiente en la lista de su tipo.
 * Así se pueden recordar varios artículos/rutinas/retos a la vez.
 */
function upsertInProgressList(user, refType, refId, patch) {
  if (!user.activity) user.activity = {};
  if (!user.activity.inProgress) user.activity.inProgress = {};

  const lists = user.activity.inProgress.lists;
  if (!lists) return;

  const arr = Array.isArray(lists[refType]) ? lists[refType] : [];
  const rid = String(refId);

  const idx = arr.findIndex((it) => String(it?.refId) === rid);

  if (idx >= 0) {
    arr[idx] = { ...arr[idx], ...patch, refId: rid, updatedAt: new Date() };
  } else {
    arr.push({ ...patch, refId: rid, updatedAt: new Date() });
  }

  // Los más antiguos se descartan si se acumulan demasiados.
  arr.sort(
    (a, b) => new Date(b?.updatedAt || 0) - new Date(a?.updatedAt || 0),
  );
  lists[refType] = arr.slice(0, MAX_IN_PROGRESS_PER_TYPE);
}

function ensureStats(user) {
  user.activity = user.activity || {};
  user.activity.stats = user.activity.stats || {};
  user.activity.stats.completed = user.activity.stats.completed || {};

  user.activity.stats.lastActiveLocalDate =
    user.activity.stats.lastActiveLocalDate ?? null;

  user.activity.stats.streakCurrent = Number(user.activity.stats.streakCurrent ?? 0);
  if (!Number.isFinite(user.activity.stats.streakCurrent) || user.activity.stats.streakCurrent < 0) {
    user.activity.stats.streakCurrent = 0;
  }

  user.activity.stats.streakBest = Number(user.activity.stats.streakBest ?? 0);
  if (!Number.isFinite(user.activity.stats.streakBest) || user.activity.stats.streakBest < 0) {
    user.activity.stats.streakBest = 0;
  }

  user.activity.stats.completed.article = Number(user.activity.stats.completed.article ?? 0);
  if (!Number.isFinite(user.activity.stats.completed.article) || user.activity.stats.completed.article < 0) {
    user.activity.stats.completed.article = 0;
  }

  user.activity.stats.completed.routine = Number(user.activity.stats.completed.routine ?? 0);
  if (!Number.isFinite(user.activity.stats.completed.routine) || user.activity.stats.completed.routine < 0) {
    user.activity.stats.completed.routine = 0;
  }

  user.activity.stats.completed.challenge = Number(user.activity.stats.completed.challenge ?? 0);
  if (!Number.isFinite(user.activity.stats.completed.challenge) || user.activity.stats.completed.challenge < 0) {
    user.activity.stats.completed.challenge = 0;
  }
}

function updateStreak(stats, todayLocalDate) {
  const last = stats.lastActiveLocalDate;

  // ya contó hoy
  if (last === todayLocalDate) return;

  const yesterday = DateTime.fromISO(todayLocalDate, { zone: "America/Bogota" })
    .minus({ days: 1 })
    .toISODate();

  if (last === yesterday) {
    stats.streakCurrent += 1;
  } else {
    stats.streakCurrent = 1;
  }

  stats.lastActiveLocalDate = todayLocalDate;
  stats.streakBest = Math.max(stats.streakBest, stats.streakCurrent);
}

function bumpCompleted(stats, type) {
  if (type === "article_completed") stats.completed.article += 1;
  if (type === "routine_completed") stats.completed.routine += 1;
  if (type === "challenge_completed") stats.completed.challenge += 1;
}

function hasMedal(user, id) {
  const medals = Array.isArray(user.activity?.medals) ? user.activity.medals : [];
  return medals.some((m) => m.id === id);
}

function grantMedal(user, id, meta = {}) {
  user.activity.medals = Array.isArray(user.activity.medals) ? user.activity.medals : [];
  if (!hasMedal(user, id)) {
    user.activity.medals.push({ id, earnedAt: new Date(), meta });
  }
}

function awardMedalsFromStats(user) {
  const s = user.activity.stats;

  // primeras veces
  if (s.completed.article >= 1) grantMedal(user, "FIRST_ARTICLE");
  if (s.completed.routine >= 1) grantMedal(user, "FIRST_ROUTINE");
  if (s.completed.challenge >= 1) grantMedal(user, "FIRST_CHALLENGE");

  // rachas (por fases)
  if (s.streakCurrent >= 3) grantMedal(user, "STREAK_3");
  if (s.streakCurrent >= 7) grantMedal(user, "STREAK_7");
  if (s.streakCurrent >= 14) grantMedal(user, "STREAK_14");
  if (s.streakCurrent >= 30) grantMedal(user, "STREAK_30");
  if (s.streakCurrent >= 100) grantMedal(user, "STREAK_100");

  // volumen artículos (por fases)
  if (s.completed.article >= 5) grantMedal(user, "ARTICLES_5");
  if (s.completed.article >= 10) grantMedal(user, "ARTICLES_10");
  if (s.completed.article >= 25) grantMedal(user, "ARTICLES_25");
  if (s.completed.article >= 50) grantMedal(user, "ARTICLES_50");
  if (s.completed.article >= 100) grantMedal(user, "ARTICLES_100");

  // volumen rutinas (por fases)
  if (s.completed.routine >= 5) grantMedal(user, "ROUTINES_5");
  if (s.completed.routine >= 10) grantMedal(user, "ROUTINES_10");
  if (s.completed.routine >= 25) grantMedal(user, "ROUTINES_25");
  if (s.completed.routine >= 50) grantMedal(user, "ROUTINES_50");

  // volumen desafíos (por fases)
  if (s.completed.challenge >= 5) grantMedal(user, "CHALLENGES_5");
  if (s.completed.challenge >= 10) grantMedal(user, "CHALLENGES_10");
  if (s.completed.challenge >= 25) grantMedal(user, "CHALLENGES_25");
  if (s.completed.challenge >= 50) grantMedal(user, "CHALLENGES_50");
  if (s.completed.challenge >= 100) grantMedal(user, "CHALLENGES_100");
}

/**
 * GET /api/activity/me
 * Devuelve:
 * - inProgress (para botón "Continuar")
 * - events (últimos 20, ordenados desc por fecha)
 */
router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("activity");
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    const events = (user.activity?.events || [])
      .slice()
      .sort((a, b) => new Date(b.at) - new Date(a.at))
      .slice(0, 20);

    // ── "Continuar": items pendientes con datos del contenido ──
    const inProgressRaw = user.activity?.inProgress || {};
    const lists = inProgressRaw.lists || {};

    /**
     * Hay varios pendientes por tipo (no solo uno).
     * Se lee la lista nueva y, si no existe, el pendiente único antiguo.
     */
    const entries = [];

    for (const refType of ["article", "routine", "challenge"]) {
      const listItems = Array.isArray(lists[refType]) ? lists[refType] : [];

      for (const item of listItems) {
        if (item?.refId) entries.push([refType, item]);
      }

      const legacy = inProgressRaw[refType];
      if (
        legacy?.refId &&
        !listItems.some((it) => String(it?.refId) === String(legacy.refId))
      ) {
        entries.push([refType, legacy]);
      }
    }

    const refIds = entries.map(([, v]) => String(v.refId));

    const contents = refIds.length
      ? await Content.find({ _id: { $in: refIds } })
          .select("_id title thumbnail type category duration")
          .lean()
      : [];

    const contentById = new Map(contents.map((c) => [String(c._id), c]));

    const inProgressList = entries
      .map(([refType, v]) => {
        const c = contentById.get(String(v.refId));
        const updatedAt = v.updatedAt || null;

        let percent = null;

        if (refType === "routine") {
          const dur = Number(v.duration ?? 0);
          const step = Number(v.step ?? 0);
          percent = dur > 0 ? Math.min(100, (step / dur) * 100) : null;
        } else if (refType === "challenge") {
          const p = Number(v.progress ?? 0);
          percent = p > 0 ? Math.min(100, p > 1 ? p : p * 100) : 0;
        }

        return {
          refType,
          refId: String(v.refId),
          title: c?.title || null,
          thumbnail: c?.thumbnail || null,
          contentType: c?.type || null,
          category: c?.category || null,
          duration: Number(c?.duration ?? 0) || null,
          updatedAt,
          percent,
          // datos especificos por tipo
          ...(refType === "routine"
            ? { step: Number(v.step ?? 0), durationSeconds: Number(v.duration ?? 0) }
            : {}),
          ...(refType === "article"
            ? {
                lastSeenIndex: Number(v.lastSeenIndex ?? 0),
                furthestIndex: Number(v.furthestIndex ?? 0),
              }
            : {}),
          ...(refType === "challenge"
            ? { progress: Number(v.progress ?? 0) }
            : {}),
        };
      })
      .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));

    return res.json({
      inProgress: inProgressRaw,
      inProgressList,
      events,
    });
  } catch (err) {
    console.error("Error en GET /activity/me:", err?.message);
    return res.status(500).json({ error: "Error en el servidor" });
  }
});

/**
 * GET /api/activity/article/:id/in-progress
 * Devuelve progreso guardado para un artículo específico
 */
router.get("/article/:id/in-progress", requireAuth, async (req, res) => {
  try {
    const articleId = String(req.params.id || "").trim();
    if (!articleId) return res.status(400).json({ error: "id inválido" });

    const user = await User.findById(req.userId).select("activity");
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    const a = user.activity?.inProgress?.article;
    if (!a || String(a.refId || "").trim() !== articleId) {
      return res.json({ found: false, lastSeenIndex: 0, furthestIndex: 0 });
    }

    const lastSeen = Number(a.lastSeenIndex ?? 0);
    const furthest = Number(a.furthestIndex ?? 0);

    return res.json({
      found: true,
      lastSeenIndex: Number.isFinite(lastSeen) && lastSeen >= 0 ? lastSeen : 0,
      furthestIndex: Number.isFinite(furthest) && furthest >= 0 ? furthest : 0,
    });
  } catch (err) {
    console.error("Error en GET /activity/article/:id/in-progress:", err?.message);
    return res.status(500).json({ error: "Error en el servidor" });
  }
});

/**
 * GET /api/activity/routine/:id/in-progress
 * Devuelve en que segundo quedo el video (rutinas) para poder retomarlo.
 */
router.get("/routine/:id/in-progress", requireAuth, async (req, res) => {
  try {
    const refId = String(req.params.id || "").trim();
    if (!refId) return res.status(400).json({ error: "id inválido" });

    const user = await User.findById(req.userId).select("activity");
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    const r = user.activity?.inProgress?.routine;
    if (!r || String(r.refId || "").trim() !== refId) {
      return res.json({ found: false, step: 0, duration: 0 });
    }

    const step = Number(r.step ?? 0);
    const duration = Number(r.duration ?? 0);

    return res.json({
      found: true,
      step: Number.isFinite(step) && step >= 0 ? step : 0,
      duration: Number.isFinite(duration) && duration >= 0 ? duration : 0,
    });
  } catch (err) {
    console.error("Error en GET /activity/routine/:id/in-progress:", err?.message);
    return res.status(500).json({ error: "Error en el servidor" });
  }
});

/**
 * POST /api/activity/event
 * Body:
 * { type, refType, refId, meta? }
 *
 * Importante:
 * - Guarda el evento al inicio
 * - Recorta a 100 para que no crezca infinito
 * - Dedupe para *_completed (idempotencia)
 * - Si es *_completed: actualiza stats (racha/contadores) + medallas
 * - Si es *_completed, limpia inProgress correspondiente
 */
router.post("/event", requireAuth, async (req, res) => {
  try {
    const { type, refType, refId, meta } = req.body || {};

    if (!type || !refType || !refId) {
      return res.status(400).json({
        error: "type, refType, refId son obligatorios",
      });
    }

    if (!allowedTypes.has(type)) {
      return res.status(400).json({ error: "type inválido" });
    }
    if (!allowedRefTypes.has(refType)) {
      return res.status(400).json({ error: "refType inválido" });
    }

    // Validación de distancia para retos de caminata (challenge_completed)
    if (type === "challenge_completed" && refType === "challenge" && meta) {
      const source = String(meta.source || "self_report");

      if (source === "gps") {
        /**
         * El cliente envía el rastro: el backend recalcula la distancia
         * y descarta los datos imposibles (distancia inflada a mano).
         */
        const validation = validateWalkingTrack(
          meta.track,
          meta.distanceKm,
        );

        if (!validation.ok) {
          return res.status(400).json({
            error: validation.error,
            meta: validation.details,
          });
        }

        meta.distanceKm = validation.distanceKm;
        meta.elapsedSec = validation.elapsedSec;
        meta.trackPoints = validation.points;
        delete meta.track; // no guardamos el rastro completo
      } else if (source === "manual") {
        /**
         * Fallback sin señal GPS: el usuario declara la distancia.
         * Se exige el mínimo del reto, pero queda marcado como "manual"
         * para que el admin lo vea (no es evidencia verificada).
         */
        const distanceKm = Number(meta.distanceKm);
        if (!Number.isFinite(distanceKm) || distanceKm < MIN_WALK_KM) {
          return res.status(400).json({
            error: "Distancia insuficiente",
            meta: { requiredKm: MIN_WALK_KM, receivedKm: distanceKm },
          });
        }
      }
      // "self_report": retos de hábito (sin distancia): no se valida nada.
    }

    const user = await User.findById(req.userId).select("activity streak lastActiveDate");
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    user.activity = user.activity || {};
    const current = Array.isArray(user.activity.events) ? user.activity.events : [];

    const todayLocalDate = bogotaLocalDateNow();

    // Idempotencia: evita duplicar completados por retries / doble tap.
    // Se compara solo dentro del dia actual: completar el mismo contenido en
    // dias distintos debe contar como una actividad nueva.
    if (isCompletedType(type)) {
      const already = current.some(
        (e) =>
          e.type === type &&
          e.refType === refType &&
          String(e.refId) === String(refId) &&
          e.localDate === todayLocalDate
      );
      if (already) {
        return res.json({ ok: true, deduped: true });
      }
    }

    user.activity.events = [
      {
        type,
        refType,
        refId: String(refId),
        meta: meta || {},
        at: new Date(),
        localDate: todayLocalDate,
      },
      ...current,
    ].slice(0, 100);

    // Si completó algo, actualiza stats/medallas y limpia inProgress
    if (isCompletedType(type)) {
      ensureStats(user);
      updateStreak(user.activity.stats, todayLocalDate);
      bumpCompleted(user.activity.stats, type);
      awardMedalsFromStats(user);

      // compat legacy (si algún UI usa estos campos)
      user.streak = user.activity.stats.streakCurrent;
      user.lastActiveDate = new Date();

      clearInProgressIfCompleted(user, type, refId);
    } else {
      // para started/quiz, igual podrías limpiar inProgress? NO. Solo completados.
      // Deja inProgress como está.
    }

    await user.save();
    return res.json({ ok: true });
  } catch (err) {
    console.error("Error en POST /activity/event:", err?.message);
    return res.status(500).json({ error: "Error en el servidor" });
  }
});

/**
 * PATCH /api/activity/in-progress
 * Body:
 * { refType: "article"|"routine"|"challenge", refId, payload? }
 *
 * Guarda el "último punto" para continuar.
 */
router.patch("/in-progress", requireAuth, async (req, res) => {
  try {
    const { refType, refId, payload } = req.body || {};

    if (!refType || !refId) {
      return res.status(400).json({ error: "refType y refId son obligatorios" });
    }

    if (!allowedInProgressRefTypes.has(refType)) {
      return res.status(400).json({ error: "refType inválido para in-progress" });
    }

    const user = await User.findById(req.userId).select("activity");
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    user.activity = user.activity || {};
    user.activity.inProgress = user.activity.inProgress || {};

    const updatedAt = new Date();

    if (refType === "article") {
      const incomingIndex = Number(payload?.slideIndex ?? 0);
      if (!Number.isFinite(incomingIndex) || incomingIndex < 0) {
        return res.status(400).json({ error: "slideIndex inválido" });
      }

      const prev = user.activity.inProgress.article || {};
      const prevFurthest = Number(prev.furthestIndex ?? 0);

      user.activity.inProgress.article = {
        refId: String(refId),
        lastSeenIndex: incomingIndex,
        furthestIndex: Math.max(
          Number.isFinite(prevFurthest) ? prevFurthest : 0,
          incomingIndex
        ),
        updatedAt,
      };

      // Guarda el pendiente en la lista (varios artículos a la vez)
      const listPrev = (
        user.activity.inProgress.lists?.article || []
      ).find((it) => String(it?.refId) === String(refId));

      upsertInProgressList(user, "article", refId, {
        lastSeenIndex: incomingIndex,
        furthestIndex: Math.max(
          Number(listPrev?.furthestIndex ?? 0),
          incomingIndex
        ),
      });
    }

    if (refType === "routine") {
      const step = Number(payload?.step ?? 0);
      if (!Number.isFinite(step) || step < 0) {
        return res.status(400).json({ error: "step inválido" });
      }

      // Segundos totales del video (opcional, permite calcular el %)
      const durationRaw = Number(payload?.duration ?? 0);
      const duration =
        Number.isFinite(durationRaw) && durationRaw > 0 ? durationRaw : 0;

      user.activity.inProgress.routine = {
        refId: String(refId),
        step,
        duration,
        updatedAt,
      };

      upsertInProgressList(user, "routine", refId, { step, duration });
    }

    if (refType === "challenge") {
      const progress = Number(payload?.progress ?? 0);
      if (!Number.isFinite(progress) || progress < 0) {
        return res.status(400).json({ error: "progress inválido" });
      }

      user.activity.inProgress.challenge = {
        refId: String(refId),
        progress,
        updatedAt,
      };

      upsertInProgressList(user, "challenge", refId, { progress });
    }

    await user.save();
    return res.json({ ok: true });
  } catch (err) {
    console.error("❌ Error en PATCH /activity/in-progress:", err?.message);
    return res.status(500).json({ error: "Error en el servidor" });
  }
});

module.exports = router;