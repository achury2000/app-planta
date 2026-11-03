// backend/src/middleware/admin.js
const User = require("../models/User");

/**
 * Middleware que verifica que el usuario autenticado tenga rol "admin".
 * Debe usarse DESPUÉS de auth middleware.
 */
module.exports = async function adminOnly(req, res, next) {
  try {
    const user = await User.findById(req.userId).select("role");
    if (!user || user.role !== "admin") {
      return res
        .status(403)
        .json({ error: "Acceso denegado: se requiere rol admin" });
    }
    req.userRole = user.role;
    next();
  } catch (err) {
    console.error("adminOnly middleware error:", err.message);
    return res.status(500).json({ error: "Error en el servidor" });
  }
};
