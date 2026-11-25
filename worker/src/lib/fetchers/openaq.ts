import type { PollutantConcentration } from "../nqi.js";
import type { StationObservation } from "../../types/aq.js";

// ---------------------------------------------------------------------------
// OpenAQ v3 adapter
// ---------------------------------------------------------------------------
// OpenAQ v2 was retired (GETs return 410 Gone). v3 changed the envelope shape:
//   results[].id          – numeric location id
//   results[].name        – station name
//   results[].coordinates – { latitude, longitude }
//   results[].distance    – metres from query point (supplied upstream)
//   results[].datetimeLast.ut – ISO-ish UTC timestamp string
//   results[].sensors[].parameter.name – pollutant short-name (pm25, pm10, …)
//
// IMPORTANT: v3 locations do NOT carry inline measurement values — those require
// a separate GET /v3/locations/{id}/readings call. For the initial pass we use
// the sensor metadata + datetime to build a stub station that signals *which*
// pollutants the station measures, letting the caller know the source is
// present but the precise value would come from a second request. This avoids
// the silent empty-result problem from the v2 path.
//
// TODO (Phase N): after confirming rate limits, add a readings-fetch step so
// each sensor gets its latest numeric value populated.
// ---------------------------------------------------------------------------

export interface OpenAQv3Location {
  id: number;
  name: string;
  locality?: string | null;
  coordinates: { latitude: number; longitude: number };
  distance?: number; // metres from query point
  datetimeLast?: { utc?: string; local?: string };
  sensors?: Array<{
    id: number;
    name?: string;
    parameter: { id: number; name: string; units?: string };
    latest_measurement?: {
      parameter: { id: number; name: string };
      location: number;
      value: number;
      unit: string;
      lastUpdated: string;
    };
  }>;
}

interface OpenAQv3Envelope {
  meta?: { limit?: number; found?: number | string };
  results?: OpenAQv3Location[];
}

/** Max radius OpenAQ v3 allows (enforced server-side). */
const MAX_RADIUS_METRES = 25_000;

export async function fetchOpenAQLocations(
  apiKey: string,
  lat: number,
  lng: number,
  limit = 10,
): Promise<OpenAQv3Location[]> {
  const url = new URL("https://api.openaq.org/v3/locations");
  url.searchParams.set("coordinates", `${lat},${lng}`);
  url.searchParams.set("radius", String(MAX_RADIUS_METRES));
  url.searchParams.set("limit", String(limit));
  // Note: OpenAQ v3 does NOT support order_by=distance. Distance is returned
  // in each location and we sort client-side after fetching.
  url.searchParams.set("sort", "desc");

  try {
    const res = await fetch(url.toString(), {
      headers: { "X-API-Key": apiKey, Accept: "application/json" },
    });
    if (!res.ok) {
      console.warn("[openaq-v3] HTTP", res.status, await res.text().catch(() => ""));
      return [];
    }
    const data = (await res.json()) as OpenAQv3Envelope;
    return Array.isArray(data.results) ? data.results : [];
  } catch (err) {
    console.warn("[openaq-v3] fetch failed:", err);
    return [];
  }
}

/**
 * Extract the canonical parameter short-name from an OpenAQ v3 sensor entry.
 */
function paramShortName(sensor: NonNullable<OpenAQv3Location["sensors"]>[0]): string | null {
  const name = sensor.parameter?.name ?? sensor.name ?? "";
  const lower = name.toLowerCase().replace(/\s+/g, "");
  // Normalise known aliases onto the keys recognised by nqi.ts.
  if (/^pm2\.?5/.test(lower) || /^pm25$/.test(lower)) return "pm25";
  if (/^pm10$/.test(lower)) return "pm10";
  if (/^no2$/.test(lower)) return "no2";
  if (/^so2$/.test(lower)) return "so2";
  if (/^co$/.test(lower)) return "co";
  if (/^o3$/.test(lower) || /^ozone$/.test(lower)) return "o3";
  return null;
}

/**
 * Attempt to read a numeric value from the sensor's latest_measurement, falling
 * back to deriving it from the sensor display name when absent.
 */
function extractValue(
  sensor: NonNullable<OpenAQv3Location["sensors"]>[0],
): number | undefined {
  if (sensor.latest_measurement?.value != null && Number.isFinite(sensor.latest_measurement.value)) {
    return sensor.latest_measurement.value;
  }
  // Some entries embed the value in the sensor name ("co µg/m³" — unlikely, but defensive).
  const m = /([\d.]+)\s*(µg\/m³|ug\/m³|mg\/m³|ppm|ppb)/i.exec(sensor.name ?? "");
  if (m) {
    const n = parseFloat(m[1]);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

/**
 * Build a StationObservation from an OpenAQ v3 location. Returns null only
 * when there are zero recognisable sensors — partial-sensor stations are still
 * emitted so the client knows the source spoke up.
 */
export function buildOpenAQStation(loc: OpenAQv3Location): StationObservation | null {
  const coords = loc.coordinates;
  if (!coords || !Number.isFinite(coords.latitude) || !Number.isFinite(coords.longitude)) {
    return null;
  }

  const concentrations: PollutantConcentration = {};
  for (const sensor of loc.sensors ?? []) {
    const p = paramShortName(sensor);
    if (!p) continue;
    const v = extractValue(sensor);
    if (v == null || !Number.isFinite(v)) continue;
    concentrations[p as keyof PollutantConcentration] = v;
  }

  // Prefer datetimeLast.utc; fall back to any latest_measurement timestamp.
  let measurementTimestamp = loc.datetimeLast?.utc ?? null;
  if (!measurementTimestamp) {
    const ts: string[] = [];
    for (const s of loc.sensors ?? []) {
      if (s.latest_measurement?.lastUpdated) ts.push(s.latest_measurement.lastUpdated);
    }
    const firstNonEmpty = ts.find(t => t && t.trim());
    if (firstNonEmpty) measurementTimestamp = firstNonEmpty;
  }
  // Must have a timestamp — we never invent one.
  if (!measurementTimestamp) return null;
  const parsed = Date.parse(measurementTimestamp);
  if (!Number.isFinite(parsed)) return null;

  const distKm = loc.distance != null ? Number((loc.distance / 1000).toFixed(3)) : NaN;
  return {
    station_id: `openaq:${loc.id}`,
    station_name: loc.name || `OpenAQ#${loc.id}`,
    source: "openaq",
    attribution: "OpenAQ v3",
    concentrations,
    measurement_timestamp: new Date(parsed).toISOString(),
    reliability: "Measured",
    distance_km: Number.isFinite(distKm) ? distKm : NaN,
  };
}
