// backend/src/utils/orqSources.js
/**
 * Deteccion de contenidos mencionados por ORQ.
 *
 * Se cruza la respuesta del modelo contra el catalogo de contenido. No depende
 * de que el modelo devuelva JSON: solo de que nombre las cosas como los
 * titulos de la app.
 *
 * El prompt del sistema NO se toca (ver routes/orq.routes.js).
 */

const STOPWORDS = new Set([
  "de", "del", "la", "el", "los", "las", "un", "una", "unos", "unas",
  "y", "o", "u", "para", "con", "por", "en", "al", "se", "su", "sus",
  "que", "como", "mas", "tu", "tus", "es", "son", "este", "esta", "estos",
  "estas", "esto", "lo", "si", "sin", "sobre", "entre", "desde", "hasta",
  "cada", "todo", "toda", "todos", "todas", "muy", "ya", "te", "ti", "hay",
  "puedes", "puede", "quieres", "hablemos", "cuentame", "dime",
]);

/** Normaliza texto: sin acentos, mayusculas ni signos. */
function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text) {
  return normalize(text).split(" ").filter(Boolean);
}

/**
 * Tokens que identifican un titulo. Los numeros se conservan (distinguyen
 * "Rutina de 5 minutos" de "Rutina de 10 minutos").
 */
function significantTokens(title) {
  return tokenize(title).filter((word) => {
    if (STOPWORDS.has(word)) return false;
    if (/^\d+$/.test(word)) return true;
    return word.length >= 4;
  });
}

/**
 * Devuelve los contenidos que ORQ menciona en su respuesta.
 *
 * @param {string} answer  Respuesta del modelo
 * @param {Array}  content Catalogo con { _id, title, description, type, category }
 */
function findSources(answer, content) {
  const haystack = normalize(answer);
  if (!haystack) return [];

  const sources = [];

  for (const item of content || []) {
    const title = normalize(item.title);
    if (!title) continue;

    const tokens = significantTokens(item.title);
    // Un titulo de una sola palabra corta matchearia con cualquier mention.
    if (tokens.length < 2) continue;

    const fullMatch = haystack.includes(title);
    const allTokensPresent = tokens.every((token) => haystack.includes(token));

    if (!fullMatch && !allTokensPresent) continue;

    sources.push({
      id: String(item._id),
      title: item.title,
      type: item.type,
      category: item.category,
      description: item.description || "",
    });
  }

  return sources;
}

module.exports = { findSources, normalize, tokenize, significantTokens };
