// backend/src/middleware/auth.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Verifica el token y que la cuenta NO este bloqueada.
 * Deja req.userId y req.userRole.
 */
async function requireAuth(req, res, next) {
  const h = req.headers.authorization;
  if (!h?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token no proporcionado" });
  }

  const token = h.slice("Bearer ".length);

  let userId = null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded?.id) return res.status(401).json({ error: "Token inválido" });
    userId = decoded.id;
  } catch (err) {
    if (err?.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expirado" });
    }
    return res.status(401).json({ error: "Token inválido" });
  }

  // Cuenta bloqueada: se corta el acceso aunque el token siga siendo valido.
  try {
    const user = await User.findById(userId)
      .select("blocked role")
      .lean();

    if (!user) return res.status(401).json({ error: "Usuario no encontrado" });

    if (user.blocked) {
      return res.status(403).json({
        error: "Tu cuenta esta bloqueada. Contacta al administrador.",
      });
    }

    req.userId = userId;
    req.userRole = user.role;
    next();
  } catch (err) {
    console.error("Error en requireAuth:", err?.message || err);
    return res.status(500).json({ error: "Error en el servidor" });
  }
}

/**
 * Igual que requireAuth pero NO bloquea: si hay token valido deja
 * req.userId, si no, sigue normal. Para endpoints que funcionan sin sesion
 * pero aprovechan el contexto si la hay.
 */
function optionalAuth(req, res, next) {
  const h = req.headers.authorization;

  if (!h?.startsWith("Bearer ")) return next();

  const token = h.slice("Bearer ".length);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded?.id) req.userId = decoded.id;
  } catch {
    // token invalido o vencido: se sigue como si no hubiera sesion
  }

  next();
}

async function requireAdmin(req, res, next) {
  try {
    // requireAuth ya cargo el rol: no repetimos la consulta.
    if (req.userRole) {
      if (req.userRole !== "admin") {
        return res.status(403).json({ error: "No autorizado" });
      }
      return next();
    }

    const me = await User.findById(req.userId).select("role");
    if (!me) return res.status(401).json({ error: "Usuario no existe" });
    if (me.role !== "admin") return res.status(403).json({ error: "No autorizado" });
    next();
  } catch (err) {
    console.error("Error en requireAdmin:", err?.message || err);
    return res.status(500).json({ error: "Error en el servidor" });
  }
}

module.exports = { requireAuth, optionalAuth, requireAdmin };