// backend/src/utils/geo.js
/**
 * Utilidades geográficas para validar la evidencia de los retos de caminata.
 *
 * El cliente envía el rastro GPS; el backend recalcula la distancia y
 * descarta los datos imposibles (saltos de kilómetros en un segundo).
 */

/** Distancia en kilómetros entre dos puntos (fórmula de Haversine). */
function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371;

  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const dPhi = toRad(lat2 - lat1);
  const dLambda = toRad(lon2 - lon1);

  const a =
    Math.sin(dPhi / 2) * Math.sin(dPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) * Math.sin(dLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Velocidad máxima plausible en metros por segundo (corre rápida, no teletransporte). */
const MAX_SPEED_MPS = 12;

/** Distancia mínima (km) para validar un reto de caminata. */
const MIN_WALK_KM = 0.8;

/**
 * Normaliza los puntos del rastro enviados por el cliente.
 * Acepta { lat, lon, t } (o latitude/longitude/timestamp).
 */
function normalizeTrack(rawTrack) {
  if (!Array.isArray(rawTrack)) return [];

  return rawTrack
    .map((p) => {
      const lat = Number(p?.lat ?? p?.latitude);
      const lon = Number(p?.lon ?? p?.longitude);
      const tRaw = Number(p?.t ?? p?.timestamp ?? p?.time);
      const t = Number.isFinite(tRaw) ? tRaw : null;

      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
      if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;

      return { lat, lon, t };
    })
    .filter(Boolean);
}

/**
 * Valida el rastro GPS de un reto de caminata.
 *
 * Devuelve:
 *   { ok: true, distanceKm, elapsedSec, points }
 *   { ok: false, error, details }
 */
function validateWalkingTrack(rawTrack, reportedDistanceKm) {
  const points = normalizeTrack(rawTrack);

  if (points.length < 2) {
    return {
      ok: false,
      error: "El reto por GPS necesita un rastro con al menos 2 puntos",
      details: { points: points.length },
    };
  }

  const timed = points.filter((p) => p.t !== null);
  const firstT = timed.length ? Math.min(...timed.map((p) => p.t)) : null;
  const lastT = timed.length ? Math.max(...timed.map((p) => p.t)) : null;

  /**
   * Unidad de los timestamps: el cliente manda epoch en ms (~1.7e12),
   * pero algunos clientes usan segundos (~1.7e9). Se decide una vez.
   */
  const usesSeconds = timed.length > 0 && Math.max(...timed.map((p) => p.t)) < 1e11;
  const toSeconds = (v) => (usesSeconds ? v : v / 1000);

  const elapsedSec =
    firstT !== null && lastT !== null
      ? toSeconds(Math.abs(lastT - firstT))
      : null;

  let distanceKm = 0;
  let discardedJumps = 0;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const cur = points[i];

    const segmentKm = haversineKm(prev.lat, prev.lon, cur.lat, cur.lon);
    if (!Number.isFinite(segmentKm) || segmentKm <= 0) continue;

    // Salto imposible (GPS desfasado o distancia inflada): se descarta.
    if (prev.t !== null && cur.t !== null) {
      const dtSec = toSeconds(Math.abs(cur.t - prev.t));
      if (dtSec > 0 && dtSec < 30) {
        const speedMps = (segmentKm * 1000) / dtSec;
        if (speedMps > MAX_SPEED_MPS * 2) {
          discardedJumps++;
          continue;
        }
      }
    }

    distanceKm += segmentKm;
  }

  const distanceKmRounded = Math.round(distanceKm * 100) / 100;

  if (distanceKmRounded < MIN_WALK_KM) {
    return {
      ok: false,
      error: "La distancia registrada no llega al mínimo del reto",
      details: { distanceKm: distanceKmRounded, requiredKm: MIN_WALK_KM },
    };
  }

  // Velocidad media implausible (caminata/trampa con distancia inflada).
  if (elapsedSec && elapsedSec > 30) {
    const avgSpeedMps = (distanceKmRounded * 1000) / elapsedSec;
    if (avgSpeedMps > MAX_SPEED_MPS) {
      return {
        ok: false,
        error: "El registro de la caminata no es consistente con el tiempo transcurrido",
        details: {
          distanceKm: distanceKmRounded,
          elapsedSec: Math.round(elapsedSec),
          avgSpeedMps: Math.round(avgSpeedMps * 100) / 100,
        },
      };
    }
  }

  // La distancia declarada por el cliente debe cuadrar con la calculada.
  const reported = Number(reportedDistanceKm);
  if (Number.isFinite(reported) && reported > 0) {
    const diff = Math.abs(reported - distanceKmRounded);
    const tolerance = Math.max(0.2, distanceKmRounded * 0.35);
    if (diff > tolerance) {
      return {
        ok: false,
        error: "La distancia declarada no coincide con el rastro GPS",
        details: {
          reportedKm: Math.round(reported * 100) / 100,
          computedKm: distanceKmRounded,
        },
      };
    }
  }

  return {
    ok: true,
    distanceKm: distanceKmRounded,
    elapsedSec: elapsedSec ? Math.round(elapsedSec) : null,
    points: points.length,
    discardedJumps,
  };
}

module.exports = { haversineKm, validateWalkingTrack, MIN_WALK_KM };
