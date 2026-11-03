// backend/src/routes/content.routes.js
const router = require("express").Router();
const mongoose = require("mongoose");
const { requireAuth, optionalAuth } = require("../middleware/auth");
const adminOnly = require("../middleware/admin");
const Content = require("../models/Content");
const User = require("../models/User");

// ── Helpers ──────────────────────────────────────────

/** Límite máximo de elementos por página. */
const MAX_LIMIT = 50;

/**
 * Traduce el parámetro `sort` a un sort de Mongo.
 * recent   → más recientes primero (default)
 * views    → más vistos primero
 * duration → más largos primero
 * az       → título A-Z
 */
function sortFor(sort) {
  switch (String(sort || "").toLowerCase()) {
    case "views":
      return { views: -1, createdAt: -1 };
    case "duration":
      return { duration: -1, createdAt: -1 };
    case "az":
      return { title: 1 };
    case "recent":
    default:
      return { createdAt: -1 };
  }
}

/**
 * Construye el filtro de la lista de contenido.
 * Soporta: type, category, featured, search (título o descripción), ids.
 */
function buildFilter({ type, category, featured, search, ids }) {
  const filter = { status: "published" };

  if (type) filter.type = type;
  if (category) filter.category = category;
  if (featured === "true") filter.isFeatured = true;

  if (ids) {
    const list = (Array.isArray(ids) ? ids : String(ids).split(","))
      .map((s) => String(s).trim())
      // Solo ObjectIds válidos: si no, Mongo lanza CastError (500).
      .filter((s) => mongoose.Types.ObjectId.isValid(s));

    if (list.length) {
      filter._id = { $in: list };
    }
  }

  if (search) {
    const rx = new RegExp(escapeRegExp(String(search)), "i");
    filter.$or = [{ title: rx }, { description: rx }];
  }

  return filter;
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** "YYYY-MM-DD" en America/Bogota (para deduplicar vistas por día). */
function bogotaLocalDateNow() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/**
 * Normaliza el array de preguntas de quiz.
 * Devuelve { ok: true, value } o { ok: false, error }.
 */
function normalizeQuiz(raw) {
  if (raw === undefined) return { ok: true, value: undefined };
  if (raw === null) return { ok: true, value: [] };

  if (!Array.isArray(raw)) {
    return { ok: false, error: "El quiz debe ser una lista de preguntas" };
  }

  const value = [];

  for (const q of raw) {
    const question = typeof q?.question === "string" ? q.question.trim() : "";
    const options = Array.isArray(q?.options)
      ? q.options.map((o) => String(o ?? "").trim()).filter(Boolean)
      : [];
    const correctIndex = Number(q?.correctIndex);

    if (!question) {
      return { ok: false, error: "Cada pregunta del quiz necesita un texto" };
    }
    if (options.length < 2) {
      return {
        ok: false,
        error: `La pregunta "${question}" necesita al menos 2 opciones`,
      };
    }
    if (
      !Number.isInteger(correctIndex) ||
      correctIndex < 0 ||
      correctIndex >= options.length
    ) {
      return {
        ok: false,
        error: `La pregunta "${question}" tiene una respuesta inválida`,
      };
    }

    value.push({
      question,
      options,
      correctIndex,
      explanation: typeof q?.explanation === "string" ? q.explanation.trim() : "",
    });
  }

  return { ok: true, value };
}

/**
 * Extrae el ID de YouTube de múltiples formatos:
 *  - URL normal: https://www.youtube.com/watch?v=xUslNLuolLs
 *  - URL corta:  https://youtu.be/xUslNLuolLs
 *  - Embed URL:  https://www.youtube.com/embed/xUslNLuolLs
 *  - Iframe:     <iframe ... src="https://www.youtube.com/embed/xUslNLuolLs" ...>
 *  - Solo ID:    xUslNLuolLs
 */
function extractYoutubeId(input) {
  if (!input) return null;

  // Extraer src del iframe si viene con markup
  const iframeMatch = input.match(/src=["']([^"']+)["']/);
  const url = iframeMatch ? iframeMatch[1] : input.trim();

  let m;

  // youtube.com/embed/ID
  m = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (m) return m[1];

  // youtube.com/watch?v=ID
  m = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (m) return m[1];

  // youtu.be/ID
  m = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (m) return m[1];

  // Solo un ID (11 caracteres)
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;

  return null;
}

// ══════════════════════════════════════════════════════
// RUTAS PÚBLICAS
// ══════════════════════════════════════════════════════

/**
 * GET /api/content
 * Lista contenido publicado con filtros opcionales.
 * Soporta: type, category, featured, search, sort, limit, page.
 */
router.get("/", async (req, res) => {
  try {
    const { type, category, featured, search, limit, sort, ids } = req.query;
    const filter = buildFilter({ type, category, featured, search, ids });

    let q = Content.find(filter).sort(sortFor(sort));
    if (limit) {
      const parsed = parseInt(limit, 10);
      q = q.limit(Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, MAX_LIMIT) : 20);
    }

    const items = await q;
    res.json(items);
  } catch (err) {
    console.error("GET /content error:", err.message);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

/**
 * GET /api/content/paginated
 * Igual que GET /content pero con paginación real.
 * Respuesta: { items, page, limit, total, hasMore }
 */
router.get("/paginated", async (req, res) => {
  try {
    const { type, category, featured, search, sort } = req.query;

    const limitRaw = parseInt(req.query.limit, 10);
    const limit =
      Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, MAX_LIMIT) : 12;

    const pageRaw = parseInt(req.query.page, 10);
    const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;

    const filter = buildFilter({ type, category, featured, search });

    const [items, total] = await Promise.all([
      Content.find(filter)
        .sort(sortFor(sort))
        .skip((page - 1) * limit)
        .limit(limit),
      Content.countDocuments(filter),
    ]);

    res.json({
      items,
      page,
      limit,
      total,
      hasMore: page * limit < total,
    });
  } catch (err) {
    console.error("GET /content/paginated error:", err.message);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// ══════════════════════════════════════════════════════
// RUTAS ADMIN (antes de /:id para evitar colisiones)
// ══════════════════════════════════════════════════════

/**
 * GET /api/content/admin/all
 * Todos los contenidos (incluye borradores). Solo admin.
 */
router.get("/admin/all", requireAuth, adminOnly, async (req, res) => {
  try {
    const items = await Content.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    console.error("GET /content/admin/all error:", err.message);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

/**
 * POST /api/content
 * Crear contenido. Solo admin.
 */
router.post("/", requireAuth, adminOnly, async (req, res) => {
  try {
    const {
      type,
      category,
      title,
      description,
      thumbnail,
      duration,
      videoSource,
      videoUrl,
      youtubeInput,
      body,
      quiz,
      isFeatured,
      status,
    } = req.body;

    const quizResult = normalizeQuiz(quiz);
    if (!quizResult.ok) {
      return res.status(400).json({ error: quizResult.error });
    }

    let youtubeId = null;
    let finalVideoUrl = videoUrl || null;

    if (type === "video" && videoSource === "youtube" && youtubeInput) {
      youtubeId = extractYoutubeId(youtubeInput);
      if (!youtubeId) {
        return res.status(400).json({
          error:
            "No se pudo extraer el ID del video de YouTube. Verifica el link o iframe.",
        });
      }
      finalVideoUrl = `https://www.youtube.com/embed/${youtubeId}`;
    }

    const content = new Content({
      type,
      category,
      title,
      description: description || "",
      thumbnail:
        thumbnail ||
        (youtubeId
          ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
          : ""),
      duration: Math.max(0, Number(duration) || 0),
      videoSource: type === "video" ? videoSource || "youtube" : null,
      videoUrl: finalVideoUrl,
      youtubeId,
      body: type === "article" ? body || "" : "",
      ...(quizResult.value !== undefined ? { quiz: quizResult.value } : {}),
      isFeatured: !!isFeatured,
      status: status || "published",
      createdBy: req.userId,
    });

    await content.save();
    res.status(201).json(content);
  } catch (err) {
    console.error("POST /content error:", err.message);
    res.status(500).json({ error: err.message || "Error en el servidor" });
  }
});

// ══════════════════════════════════════════════════════
// RUTAS CON PARÁMETRO /:id
// ══════════════════════════════════════════════════════

/**
 * GET /api/content/:id
 * Obtener contenido por ID (público). Incrementa vistas.
 *
 * Las vistas solo suman una vez por usuario y día: si no, abrir el mismo
 * contenido 10 veces inflaba el contador.
 */
router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const item = await Content.findById(req.params.id);
    if (!item)
      return res.status(404).json({ error: "Contenido no encontrado" });

    let counted = false;

    if (req.userId) {
      // Con sesión: una vista por usuario y día.
      const today = bogotaLocalDateNow();
      const user = await User.findById(req.userId).select("activity.viewed");
      const viewed = Array.isArray(user?.activity?.viewed) ? user.activity.viewed : [];

      const alreadySeen = viewed.some(
        (v) => String(v.contentId) === String(req.params.id) && v.date === today,
      );

      if (!alreadySeen && user) {
        user.activity = user.activity || {};
        user.activity.viewed = [
          ...viewed.filter(
            (v) =>
              !(String(v.contentId) === String(req.params.id) && v.date === today),
          ),
          { contentId: String(req.params.id), date: today },
        ].slice(-200);
        await user.save();
        counted = true;
      }
    } else {
      counted = true; // sin sesión no hay forma de distinguir usuarios
    }

    if (counted) {
      item.views = (item.views || 0) + 1;
      await item.save();
    }

    res.json(item);
  } catch (err) {
    console.error("GET /content/:id error:", err.message);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

/**
 * PUT /api/content/:id
 * Actualizar contenido. Solo admin.
 */
router.put("/:id", requireAuth, adminOnly, async (req, res) => {
  try {
    const updates = { ...req.body };

    if (updates.duration !== undefined) {
      updates.duration = Math.max(0, Number(updates.duration) || 0);
    }

    if (updates.quiz !== undefined) {
      const quizResult = normalizeQuiz(updates.quiz);
      if (!quizResult.ok) {
        return res.status(400).json({ error: quizResult.error });
      }
      updates.quiz = quizResult.value;
    }

    // Re-procesar YouTube si se cambió
    if (updates.videoSource === "youtube" && updates.youtubeInput) {
      const ytId = extractYoutubeId(updates.youtubeInput);
      if (!ytId) {
        return res
          .status(400)
          .json({ error: "No se pudo extraer el ID de YouTube" });
      }
      updates.youtubeId = ytId;
      updates.videoUrl = `https://www.youtube.com/embed/${ytId}`;
      // Auto-fill thumbnail si está vacío
      if (!updates.thumbnail) {
        updates.thumbnail = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
      }
      delete updates.youtubeInput;
    }

    const item = await Content.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!item) return res.status(404).json({ error: "No encontrado" });
    res.json(item);
  } catch (err) {
    console.error("PUT /content/:id error:", err.message);
    res.status(500).json({ error: err.message || "Error en el servidor" });
  }
});

/**
 * DELETE /api/content/:id
 * Eliminar contenido. Solo admin.
 */
router.delete("/:id", requireAuth, adminOnly, async (req, res) => {
  try {
    const item = await Content.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: "No encontrado" });
    res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /content/:id error:", err.message);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

module.exports = router;
