const router = require("express").Router();
const Content = require("../models/Content");
const User = require("../models/User");
const { optionalAuth } = require("../middleware/auth");
const { findSources } = require("../utils/orqSources");

const MAX_MESSAGE_LENGTH = 1_000;

// Groq rota los modelos disponibles. Intentamos el configurado y,
// si no existe o no hay acceso, caemos a estos en orden.
const FALLBACK_MODELS = [
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
  "qwen/qwen3.8-27b",
];

function buildInstructions(content) {
  const catalog = content.length
    ? content
        .map((item) => `- ${item.title}: ${item.description || "Sin descripcion"}`)
        .join("\n")
    : "Aun no hay contenido publicado disponible.";

  return `
Eres ORQ, el asistente de la aplicacion Planta Transformacion.
Responde siempre en espanol, de forma amable, breve y util.
Ayuda al usuario a navegar, comprender y encontrar el contenido de la aplicacion.
No inventes articulos, funciones ni datos. Si no tienes suficiente informacion,
indicalo y sugiere revisar la seccion Descubrir.

Contenido publicado actualmente:
${catalog}
`.trim();
}

/**
 * Normaliza texto para comparar titulos sin acentos, mayusculas ni signos.
 */

/**
 * Contexto de la cuenta del usuario (Fase 3).
 *
 * Se AGREGA al prompt del sistema; las instrucciones de ORQ no se tocan.
 * Si no hay sesion o no hay datos, devuelve "" y ORQ funciona igual que antes.
 */
async function buildAccountContext(userId) {
  if (!userId) return "";

  try {
    const user = await User.findById(userId).select("activity").lean();
    if (!user) return "";

    const activity = user.activity || {};
    const stats = activity.stats || {};
    const completed = stats.completed || {};
    const lines = [];

    const streak = Number(stats.streakCurrent ?? 0);
    if (streak > 0) lines.push(`- Racha actual: ${streak} dias`);

    const articles = Number(completed.article ?? 0);
    const routines = Number(completed.routine ?? 0);
    const challenges = Number(completed.challenge ?? 0);
    if (articles + routines + challenges > 0) {
      lines.push(
        `- Ya completo: ${articles} articulos, ${routines} rutinas, ${challenges} retos`
      );
    }

    const inProgress = activity.inProgress || {};
    for (const [refType, value] of Object.entries(inProgress)) {
      if (!value?.refId) continue;

      const content = await Content.findById(value.refId)
        .select("title")
        .lean();
      if (!content) continue;

      let detail = "";
      if (refType === "routine" && Number(value.step) > 0) {
        detail = ` (va por el segundo ${Number(value.step)})`;
      } else if (refType === "article" && Number(value.lastSeenIndex) > 0) {
        detail = ` (va por la diapositiva ${Number(value.lastSeenIndex) + 1})`;
      }

      lines.push(`- Tiene sin terminar: "${content.title}"${detail}`);
    }

    const medals = Array.isArray(activity.medals) ? activity.medals : [];
    if (medals.length) lines.push(`- Medallas obtenidas: ${medals.length}`);

    if (!lines.length) return "";

    return [
      "Contexto de la cuenta del usuario (usalo solo si es relevante para la pregunta):",
      ...lines,
    ].join("\n");
  } catch (error) {
    console.error("ORQ contexto error:", error?.message);
    return "";
  }
}

/** POST /api/orq/chat */
router.post("/chat", optionalAuth, async (req, res) => {
  const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";

  if (!message) {
    return res.status(400).json({ error: "Escribe un mensaje para ORQ." });
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({ error: "El mensaje es demasiado largo." });
  }

  const apiKey = process.env.GROQ_API_KEY;
  const configuredModel = process.env.GROQ_MODEL || FALLBACK_MODELS[0];
  const modelsToTry = [configuredModel, ...FALLBACK_MODELS].filter(
    (m, i, arr) => arr.indexOf(m) === i
  );

  if (!apiKey) {
    return res.status(503).json({
      error: "ORQ aun no esta configurado. Agrega GROQ_API_KEY al archivo backend/.env.",
    });
  }

  try {
    // El catalogo que ve ORQ (prompt) son los 12 mas recientes, igual que antes.
    // Para detectar fuentes se revisa un poco mas de contenido.
    const allContent = await Content.find({ status: "published" })
      .select("_id title description type category")
      .sort({ createdAt: -1 })
      .lean();

    const content = allContent.slice(0, 12);

    const groqUrl = process.env.GROQ_URL || "https://api.groq.com/openai/v1/chat/completions";

    const accountContext = await buildAccountContext(req.userId);

    const systemPrompt = accountContext
      ? `${buildInstructions(content)}\n\n${accountContext}`
      : buildInstructions(content);

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: message },
    ];

    let answer = null;
    let lastError = null;

    for (const model of modelsToTry) {
      const response = await fetch(groqUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: 500,
          temperature: 0.4,
        }),
      });

      const data = await response.json().catch(() => null);

      if (response.ok) {
        answer = data?.choices?.[0]?.message?.content?.trim() || null;
        if (answer) break;
        lastError = "respuesta vacia";
      } else {
        lastError = data?.error?.message || `HTTP ${response.status}`;
        // Si el error es del modelo (no existe / sin acceso), probamos el siguiente.
        if (!/model/i.test(String(lastError))) break;
      }
    }

    if (!answer) {
      console.error("ORQ Groq error:", lastError);
      return res.status(502).json({ error: "ORQ no pudo responder en este momento." });
    }

    const sources = findSources(answer, allContent);

    return res.json({ answer, sources, authenticated: !!req.userId });
  } catch (error) {
    console.error("ORQ error:", error.message);
    return res.status(500).json({ error: "No se pudo conectar con ORQ." });
  }
});

module.exports = router;