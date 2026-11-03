// backend/src/routes/admin.routes.js
const router = require("express").Router();
const User = require("../models/User");
const { requireAuth, requireAdmin } = require("../middleware/auth");

// GET /api/admin/users?search=&page=1&limit=20
router.get("/users", requireAuth, requireAdmin, async (req, res) => {
  try {
    const search = String(req.query.search ?? "").trim();

    const pageRaw = parseInt(String(req.query.page ?? "1"), 10);
    const limitRaw = parseInt(String(req.query.limit ?? "20"), 10);

    const page = Number.isFinite(pageRaw) ? Math.max(1, pageRaw) : 1;
    const limit = Number.isFinite(limitRaw)
      ? Math.min(100, Math.max(1, limitRaw))
      : 20;

    const skip = (page - 1) * limit;

    const q =
      search.length > 0
        ? {
            $or: [
              { name: { $regex: search, $options: "i" } },
              { email: { $regex: search, $options: "i" } },
            ],
          }
        : {};

    const [total, users] = await Promise.all([
      User.countDocuments(q),
      User.find(q)
        .select("_id name email role blocked createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    return res.json({
      page,
      limit,
      total,
      users: users.map((u) => ({
        id: String(u._id),
        name: u.name,
        email: u.email,
        role: u.role,
        blocked: !!u.blocked,
        createdAt: u.createdAt,
      })),
    });
  } catch (err) {
    console.error("Error en GET /api/admin/users:", err?.message || err);
    return res.status(500).json({ error: "Error en el servidor" });
  }
});

// GET /api/admin/users/:id - Detalle de un usuario (con su actividad)
router.get("/users/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("_id name email role blocked createdAt activity")
      .lean();

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const activity = user.activity || {};
    const stats = activity.stats || {};
    const completed = stats.completed || {};
    const events = Array.isArray(activity.events) ? activity.events : [];
    const medals = Array.isArray(activity.medals) ? activity.medals : [];

    const challengeEvents = events
      .filter((e) => e.refType === "challenge" && e.type === "challenge_completed")
      .sort((a, b) => new Date(b.at) - new Date(a.at));

    return res.json({
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
        blocked: !!user.blocked,
        createdAt: user.createdAt,
      },
      stats: {
        streakCurrent: Number(stats.streakCurrent ?? 0),
        streakBest: Number(stats.streakBest ?? 0),
        completed: {
          article: Number(completed.article ?? 0),
          routine: Number(completed.routine ?? 0),
          challenge: Number(completed.challenge ?? 0),
        },
      },
      medals: medals.map((m) => ({ id: m.id, earnedAt: m.earnedAt })),
      challenges: {
        completedCount: challengeEvents.length,
        recent: challengeEvents.slice(0, 10).map((e) => ({
          refId: e.refId,
          at: e.at,
          meta: e.meta || {},
        })),
      },
      recentEvents: events.slice(0, 15).map((e) => ({
        type: e.type,
        refType: e.refType,
        refId: e.refId,
        at: e.at,
        localDate: e.localDate,
        meta: e.meta || {},
      })),
    });
  } catch (err) {
    console.error("Error en GET /api/admin/users/:id:", err?.message || err);
    return res.status(500).json({ error: "Error en el servidor" });
  }
});

// PATCH /api/admin/users/:id - Cambiar rol o bloquear/desbloquear
router.patch("/users/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const targetId = String(req.params.id);
    const isSelf = targetId === String(req.userId);

    const target = await User.findById(targetId)
      .select("_id role blocked")
      .lean();

    if (!target) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const { role, blocked } = req.body || {};
    const updates = {};

    if (role !== undefined) {
      if (role !== "user" && role !== "admin") {
        return res.status(400).json({ error: "Rol inválido" });
      }
      if (isSelf) {
        return res
          .status(400)
          .json({ error: "No puedes cambiar tu propio rol." });
      }
      if (target.role === "admin" && role === "user") {
        const admins = await User.countDocuments({
          role: "admin",
          blocked: { $ne: true },
        });
        if (admins <= 1) {
          return res.status(400).json({
            error: "No puedes quitarle el rol al único administrador.",
          });
        }
      }
      updates.role = role;
    }

    if (blocked !== undefined) {
      const value = blocked === true || blocked === "true";
      if (isSelf && value) {
        return res
          .status(400)
          .json({ error: "No puedes bloquear tu propia cuenta." });
      }
      if (value && target.role === "admin") {
        const admins = await User.countDocuments({
          role: "admin",
          blocked: { $ne: true },
        });
        if (admins <= 1) {
          return res.status(400).json({
            error: "No puedes bloquear al único administrador.",
          });
        }
      }
      updates.blocked = value;
    }

    if (!Object.keys(updates).length) {
      return res.status(400).json({ error: "Nada que actualizar" });
    }

    const user = await User.findByIdAndUpdate(targetId, updates, { new: true })
      .select("_id name email role blocked createdAt")
      .lean();

    return res.json({
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
        blocked: !!user.blocked,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error("Error en PATCH /api/admin/users/:id:", err?.message || err);
    return res.status(500).json({ error: "Error en el servidor" });
  }
});

// GET /api/admin/challenges - Ver retos completados por todos los usuarios
// Query: ?page=1&limit=50&search=
router.get("/challenges", requireAuth, requireAdmin, async (req, res) => {
  try {
    const search = String(req.query.search ?? "").trim();

    const pageRaw = parseInt(String(req.query.page ?? "1"), 10);
    const limitRaw = parseInt(String(req.query.limit ?? "50"), 10);

    const page = Number.isFinite(pageRaw) ? Math.max(1, pageRaw) : 1;
    const limit = Number.isFinite(limitRaw)
      ? Math.min(100, Math.max(1, limitRaw))
      : 50;

    const skip = (page - 1) * limit;

    const q =
      search.length > 0
        ? {
            $or: [
              { name: { $regex: search, $options: "i" } },
              { email: { $regex: search, $options: "i" } },
            ],
          }
        : {};

    const users = await User.find(q)
      .select("_id name email role activity")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const completions = [];

    for (const u of users) {
      const events = Array.isArray(u.activity?.events) ? u.activity.events : [];
      const challengeEvents = events.filter(
        (e) => e.refType === "challenge" && e.type === "challenge_completed"
      );

      for (const ev of challengeEvents) {
        completions.push({
          userId: String(u._id),
          userName: u.name,
          userEmail: u.email,
          refId: ev.refId,
          distanceKm: ev.meta?.distanceKm,
          source: ev.meta?.source,
          steps: ev.meta?.steps,
          at: ev.at,
          localDate: ev.localDate,
        });
      }
    }

    completions.sort((a, b) => new Date(b.at) - new Date(a.at));

    const total = completions.length;
    const paged = completions.slice(skip, skip + limit);

    return res.json({
      page,
      limit,
      total,
      completions: paged,
    });
  } catch (err) {
    console.error("Error en GET /api/admin/challenges:", err?.message || err);
    return res.status(500).json({ error: "Error en el servidor" });
  }
});

module.exports = router;