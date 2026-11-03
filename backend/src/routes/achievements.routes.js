// backend/src/routes/achievements.routes.js
const router = require("express").Router();
const { requireAuth } = require("../middleware/auth");
const User = require("../models/User");

/**
 * GET /api/achievements/summary
 * Devuelve resumen de logros:
 * - racha (current/best)
 * - completados (article/routine/challenge)
 * - medallas
 * - retos completados recientes (de events)
 */
router.get("/summary", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("activity");
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    const stats = user.activity?.stats || {
      lastActiveLocalDate: null,
      streakCurrent: 0,
      streakBest: 0,
      completed: { article: 0, routine: 0, challenge: 0 },
    };

    const medals = Array.isArray(user.activity?.medals) ? user.activity.medals : [];

    const events = Array.isArray(user.activity?.events) ? user.activity.events : [];
    const recentChallenges = events
      .filter((e) => e.type === "challenge_completed")
      .slice()
      .sort((a, b) => new Date(b.at) - new Date(a.at))
      .slice(0, 5)
      .map((e) => ({
        refId: e.refId,
        at: e.at,
        meta: e.meta || {},
      }));

    /**
     * Contenidos ya completados por tipo (ids).
     * Sirve para rotar el "Acción del día" en Inicio sin repetir lo hecho.
     */
    const completedIds = { article: [], routine: [], challenge: [] };
    for (const e of events) {
      if (e.type === "article_completed" && e.refType === "article") {
        completedIds.article.push(String(e.refId));
      }
      if (e.type === "routine_completed" && e.refType === "routine") {
        completedIds.routine.push(String(e.refId));
      }
      if (e.type === "challenge_completed" && e.refType === "challenge") {
        completedIds.challenge.push(String(e.refId));
      }
    }

    /**
     * Acciones completadas hoy (para la "Meta diaria" del Inicio).
     */
    const today = stats.lastActiveLocalDate || null;
    const todayCompleted = today
      ? events.filter(
          (e) =>
            e.localDate === today &&
            (e.type === "article_completed" ||
              e.type === "routine_completed" ||
              e.type === "challenge_completed"),
        ).length
      : 0;

    return res.json({
      streak: {
        current: stats.streakCurrent || 0,
        best: stats.streakBest || 0,
        lastActiveLocalDate: stats.lastActiveLocalDate || null,
      },
      progress: {
        completed: {
          article: stats.completed?.article || 0,
          routine: stats.completed?.routine || 0,
          challenge: stats.completed?.challenge || 0,
        },
      },
      completedIds,
      today: {
        localDate: today,
        completed: todayCompleted,
      },
      challenges: {
        completedCount: stats.completed?.challenge || 0,
        recent: recentChallenges,
      },
      medals,
    });
  } catch (err) {
    console.error("Error en GET /achievements/summary:", err?.message);
    return res.status(500).json({ error: "Error en el servidor" });
  }
});

module.exports = router;