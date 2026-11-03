// backend/src/scripts/backfillDescriptions.js
/**
 * Rellena las descripciones vacías de los contenidos publicados.
 *
 * Motivo: ORQ responde "(sin descripción disponible)" cuando el catálogo
 * no tiene descripción (pendiente 5.7 de PENDIENTES.md).
 *
 * Es seguro: solo toca contenidos con descripción vacía y NO borra nada.
 *
 * Uso:  npm run backfill
 */
require("dotenv").config();
const mongoose = require("mongoose");
const Content = require("../models/Content");

/** Texto por defecto según la categoría del contenido. */
function descriptionFor(content) {
  const title = String(content.title || "").trim();

  switch (content.category) {
    case "routine":
      return `${title}: una rutina guiada para avanzar a tu ritmo, paso a paso.`;
    case "challenges":
      return `${title}: un reto para sumar constancia a tu Transformation y ver tu racha crecer.`;
    case "fitness":
      return `${title}: una sesión corta de activación para mover el cuerpo con intención.`;
    case "environment":
    default:
      return `${title}: pequeñas acciones para cuidar tu entorno y transformarte con él.`;
  }
}

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ Conectado a ${mongoose.connection.host}`);

    const sinDescripcion = await Content.find({
      $or: [
        { description: { $exists: false } },
        { description: null },
        { description: "" },
      ],
    });

    if (sinDescripcion.length === 0) {
      console.log("👍 Todos los contenidos tienen descripción.");
      await mongoose.disconnect();
      process.exit(0);
    }

    for (const content of sinDescripcion) {
      content.description = descriptionFor(content);
      await content.save();
      console.log(`  • ${content.title} → ${content.description}`);
    }

    console.log(`✅ ${sinDescripcion.length} descripciones actualizadas.`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("❌ Error en el backfill:", err.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

run();
