// backend/src/models/Content.js
const mongoose = require("mongoose");

/**
 * Pregunta de quiz para artículos.
 * El lector de slides (QuizSlide) usa estas preguntas; si un artículo no
 * tiene quiz, el lector simplemente lo salta.
 */
const QuizQuestionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: (v) => Array.isArray(v) && v.length >= 2,
        message: "Un quiz necesita al menos 2 opciones",
      },
    },
    correctIndex: { type: Number, required: true, min: 0 },
    explanation: { type: String, default: "" },
  },
  { _id: false }
);

const contentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["video", "article"],
      required: true,
    },
    category: {
      type: String,
      enum: ["environment", "fitness", "routine", "challenges"],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    thumbnail: {
      type: String,
      default: "",
    },

    // Duracion aproximada en minutos (para mostrar "X min" en las tarjetas)
    duration: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ── Video fields ──
    videoSource: {
      type: String,
      enum: ["youtube", "url"],
      default: null,
    },
    videoUrl: {
      type: String,
      default: null,
    },
    youtubeId: {
      type: String,
      default: null,
    },

    // ── Article fields ──
    body: {
      type: String,
      default: "",
    },

    // Preguntas de quiz (solo para artículos)
    quiz: { type: [QuizQuestionSchema], default: [] },

    // ── Meta ──
    views: { type: Number, default: 0 },
    isNew: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "published",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "contents",
  }
);

module.exports = mongoose.model("Content", contentSchema);
