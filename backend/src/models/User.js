// backend/src/models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

/**
 * Eventos de actividad para "Mi actividad" (timeline).
 * Nota: _id: false para que cada evento no cree ObjectId y sea más liviano.
 */
const ActivityEventSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "article_started",
        "article_completed",
        "routine_started",
        "routine_completed",
        "challenge_started",
        "challenge_completed",
        "quiz_submitted",
      ],
      required: true,
    },
    refType: {
      type: String,
      enum: ["article", "routine", "challenge", "quiz"],
      required: true,
    },
    refId: { type: String, required: true },

    // Metadata libre (ej: score, answersCount, etc.)
    meta: { type: Object, default: {} },

    // Timestamp del evento (server time)
    at: { type: Date, default: Date.now },

    /**
     * Fecha normalizada para racha (streak) diaria.
     * Formato: "YYYY-MM-DD" en zona horaria America/Bogota
     * Se setea en backend al guardar el evento (NO confiar en cliente).
     */
    localDate: { type: String, default: null },
  },
  { _id: false }
);

/**
 * Vista registrada por usuario (para no inflar `Content.views`).
 * Se guarda una entrada por contenido y día (YYYY-MM-DD en America/Bogota).
 */
const ViewedContentSchema = new mongoose.Schema(
  {
    contentId: { type: String, required: true },
    date: { type: String, required: true },
  },
  { _id: false }
);

/**
 * Un pendiente guardado en "Continuar".
 * Ahora puede haber varios del mismo tipo (artículos, rutinas, retos).
 */
const InProgressItemSchema = new mongoose.Schema(
  {
    refId: { type: String, required: true },
    // article
    lastSeenIndex: { type: Number, default: 0 },
    furthestIndex: { type: Number, default: 0 },
    // routine (video)
    step: { type: Number, default: 0 },
    duration: { type: Number, default: 0 },
    // challenge
    progress: { type: Number, default: 0 },
    updatedAt: { type: Date, default: null },
  },
  { _id: false }
);

/**
 * Medallas obtenidas por reglas (determinísticas).
 * _id: false para liviano y evitar ObjectId por elemento.
 */
const MedalSchema = new mongoose.Schema(
  {
    id: { type: String, required: true }, // ej: "FIRST_ARTICLE", "STREAK_7"
    earnedAt: { type: Date, default: Date.now },
    meta: { type: Object, default: {} },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, minlength: 6 },

    /**
     * Foto de perfil (data URL base64 o URL pública).
     * Se guarda en el backend para que la foto viaje con la cuenta.
     */
    avatar: { type: String, default: null },

    /**
     * Contenido guardado (ids de Content).
     * Antes vivía solo en el dispositivo (se perdía al cambiar de teléfono).
     */
    saved: { type: [String], default: [] },

    /**
     * Preferencias de la cuenta (toggle de notificaciones, etc).
     */
    preferences: {
      notifications: { type: Boolean, default: true },
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      index: true,
    },

    /**
     * Cuenta bloqueada por un administrador.
     * Un usuario bloqueado no puede iniciar sesión ni usar la API.
     */
    blocked: { type: Boolean, default: false },

    // Gamificación (legacy / compat)
    level: { type: Number, default: 1 },
    xp: { type: Number, default: 0 },

    /**
     * ⚠️ Legacy:
     * Si lo sigues usando en UI, mantenlo sincronizado desde activity.stats.
     * La fuente de verdad recomendada para Logros es activity.stats.
     */
    streak: { type: Number, default: 0 },

    /**
     * ⚠️ Legacy:
     * Mejor usar activity.stats.lastActiveLocalDate para racha diaria robusta.
     */
    lastActiveDate: { type: Date, default: null },

    /**
     * Actividad: timeline + continuar + stats para Logros.
     */
    activity: {
      // Timeline (para "Mi actividad")
      events: { type: [ActivityEventSchema], default: [] },

      // Continuar donde quedó
      inProgress: {
        /**
         * Pendientes por tipo. Antes solo se guardaba UNO por tipo
         * (al abrir otro artículo se perdía el anterior).
         */
        lists: {
          article: { type: [InProgressItemSchema], default: [] },
          routine: { type: [InProgressItemSchema], default: [] },
          challenge: { type: [InProgressItemSchema], default: [] },
        },

        // Último pendiente de cada tipo (compatibilidad con versiones viejas)
        article: {
          refId: { type: String, default: null },
          lastSeenIndex: { type: Number, default: 0 },
          furthestIndex: { type: Number, default: 0 },
          updatedAt: { type: Date, default: null },
        },
        routine: {
          refId: { type: String, default: null },
          // Segundos reproducidos del video (para "Continuar donde quedaste")
          step: { type: Number, default: 0 },
          // Duracion total del video en segundos
          duration: { type: Number, default: 0 },
          updatedAt: { type: Date, default: null },
        },
        challenge: {
          refId: { type: String, default: null },
          progress: { type: Number, default: 0 },
          updatedAt: { type: Date, default: null },
        },
      },

      /**
       * Contenido ya visto por el usuario (para no sumar vistas de más).
       */
      viewed: { type: [ViewedContentSchema], default: [] },

      /**
       * Stats agregados (fuente de verdad para "Logros")
       * Se actualizan en backend al registrar *_completed.
       */
      stats: {
        // "YYYY-MM-DD" en America/Bogota
        lastActiveLocalDate: { type: String, default: null },

        streakCurrent: { type: Number, default: 0 },
        streakBest: { type: Number, default: 0 },

        completed: {
          article: { type: Number, default: 0 },
          routine: { type: Number, default: 0 },
          challenge: { type: Number, default: 0 },
        },
      },

      /**
       * Medallas obtenidas (por reglas).
       * Se otorgan en backend cuando stats cumplen condiciones.
       */
      medals: { type: [MedalSchema], default: [] },
    },
  },
  { timestamps: true }
);

/* Hash de contraseña antes de guardar */
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

/* Método para comparar contraseña */
userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);