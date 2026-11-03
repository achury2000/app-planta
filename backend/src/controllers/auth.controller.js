const jwt = require("jsonwebtoken");
const User = require("../models/User");

/* ── Helpers ── */
const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "30d" });

/** Tamaño máximo del avatar (data URL base64): ~350 KB -> ~256 KB de imagen. */
const MAX_AVATAR_LENGTH = 350_000;

/**
 * Valida el avatar recibido.
 * Acepta data URL (base64) o una URL http(s). `null` la borra.
 */
function normalizeAvatar(value) {
  if (value === null) return null;
  if (typeof value !== "string") return undefined;

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (trimmed.length > MAX_AVATAR_LENGTH) return undefined;

  if (trimmed.startsWith("data:image/")) {
    return /^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(trimmed)
      ? trimmed
      : undefined;
  }

  if (/^https?:\/\/\S+$/i.test(trimmed)) return trimmed;

  return undefined;
}

/** Payload de usuario que se devuelve al frontend. */
function publicUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar || null,
    notifications: user.preferences?.notifications !== false,
  };
}

/* ── POST /api/auth/register ── */
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validación de campos obligatorios
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "Todos los campos son obligatorios" });
    }

    // Verificar si el correo ya existe
    const exists = await User.findOne({ email });
    if (exists) {
      return res
        .status(409)
        .json({ error: "El correo ya está registrado" });
    }

    // Crear usuario (el hash de la contraseña se hace en el pre-save del modelo)
    const user = await User.create({ name, email, password });

    const token = signToken(user._id);

    res.status(201).json({
      token,
      user: publicUser(user),
    });
  } catch (err) {
    console.error("Error en register:", err.message);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

/* ── POST /api/auth/login ── */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Correo y contraseña son obligatorios" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    const match = await user.comparePassword(password);
    if (!match) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    if (user.blocked) {
      return res.status(403).json({
        error: "Tu cuenta esta bloqueada. Contacta al administrador.",
      });
    }

    const token = signToken(user._id);

    res.json({
      token,
      user: publicUser(user),
    });
  } catch (err) {
    console.error("Error en login:", err.message);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

/* ── GET /api/auth/me ── */
const getMe = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token no proporcionado" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({
      user: {
        ...publicUser(user),
        preferences: {
          notifications: user.preferences?.notifications !== false,
        },
        saved: Array.isArray(user.saved) ? user.saved : [],
      },
    });
  } catch (err) {
    res.status(401).json({ error: "Token inválido" });
  }
};

/* ── PUT /api/auth/me ── Actualizar datos (nombre, contraseña) — NO el correo ── */
const updateMe = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token no proporcionado" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const { name, password, avatar, notifications } = req.body;

    // Actualizar nombre si se proporcionó
    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({ error: "El nombre no puede estar vacío" });
      }
      user.name = name.trim();
    }

    // Actualizar contraseña si se proporcionó
    if (password !== undefined) {
      if (password.length < 6) {
        return res
          .status(400)
          .json({ error: "La contraseña debe tener al menos 6 caracteres" });
      }
      user.password = password; // el pre-save del modelo la hashea
    }

    // Actualizar foto de perfil (null la quita)
    if (avatar !== undefined) {
      const normalized = normalizeAvatar(avatar);
      if (normalized === undefined) {
        return res.status(400).json({
          error:
            "Formato de foto no válido (usa una imagen JPG/PNG/WebP de menos de 256 KB).",
        });
      }
      user.avatar = normalized;
    }

    // Preferencias (toggle de notificaciones)
    if (notifications !== undefined) {
      user.preferences = user.preferences || {};
      user.preferences.notifications = !!notifications;
    }

    await user.save();

    res.json({
      token,
      user: publicUser(user),
    });

  } catch (err) {
    console.error("Error en updateMe:", err.message);
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token inválido" });
    }
    res.status(500).json({ error: "Error en el servidor" });
  }
};

/* ── DELETE /api/auth/me ── Eliminar cuenta ── */
const deleteMe = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token no proporcionado" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByIdAndDelete(decoded.id);

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({ message: "Cuenta eliminada correctamente" });
  } catch (err) {
    console.error("Error en deleteMe:", err.message);
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token inválido" });
    }
    res.status(500).json({ error: "Error en el servidor" });
  }
};

module.exports = { register, login, getMe, updateMe, deleteMe };
