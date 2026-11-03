// backend/src/routes/user.routes.js
const router = require("express").Router();
const mongoose = require("mongoose");
const { requireAuth } = require("../middleware/auth");
const User = require("../models/User");
const Content = require("../models/Content");

/**
 * Id de contenido válido (ObjectId de Mongo).
 */
function isValidContentId(id) {
  return mongoose.Types.ObjectId.isValid(String(id));
}

/**
 * GET /api/user/saved
 * Devuelve los ids de contenido guardado por el usuario.
 */
router.get("/saved", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("saved");
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    const ids = Array.isArray(user.saved) ? user.saved : [];
    return res.json({ ids });
  } catch (err) {
    console.error("Error en GET /user/saved:", err?.message);
    return res.status(500).json({ error: "Error en el servidor" });
  }
});

/**
 * POST /api/user/saved/:contentId
 * Alterna el estado "guardado" de un contenido.
 * Responde { saved, ids } con el estado final.
 */
router.post("/saved/:contentId", requireAuth, async (req, res) => {
  try {
    const contentId = String(req.params.contentId || "").trim();

    if (!isValidContentId(contentId)) {
      return res.status(400).json({ error: "Id de contenido inválido" });
    }

    const exists = await Content.exists({ _id: contentId });
    if (!exists) {
      return res.status(404).json({ error: "Contenido no encontrado" });
    }

    const user = await User.findById(req.userId).select("saved");
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    const current = Array.isArray(user.saved) ? user.saved : [];
    const already = current.includes(contentId);

    const next = already
      ? current.filter((id) => id !== contentId)
      : [contentId, ...current];

    user.saved = next;
    await user.save();

    return res.json({ saved: !already, ids: next });
  } catch (err) {
    console.error("Error en POST /user/saved:", err?.message);
    return res.status(500).json({ error: "Error en el servidor" });
  }
});

module.exports = router;
