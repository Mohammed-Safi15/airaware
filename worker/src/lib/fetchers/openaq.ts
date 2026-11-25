import type { PollutantConcentration } from "../nqi.js";
import type { StationObservation } from "../../types/aq.js";
import { haversineMetres } from "../haversine.js";

// ---------------------------------------------------------------------------
// OpenAQ v2 adapter
// ---------------------------------------------------------------------------
// OpenAQ exposes "locations" near a point; each location carries a flat list
// of latest measurements (one entry per parameter). We normalise into
// StationObservation and never invent coordinates or readings.
// ---------------------------------------------------------------------------

/** Raw measurement row as returned inside an OpenAQ v2 location result. */
export interface OpenAQMeasurement {
  parameter: string; // 'pm25' | 'pm10' | 'no2' | 'so2' | 'co' | 'o3' | ...
  value: number;
  unit?: string;
  date?: { utc?: string; local?: string };
}

/** Raw location row from `GET /v2/locations`. */
export interface OpenAQLocation {
  location: string;
  city?: string;
  country?: string;
  coordinates: { latitude: number; longitude: number };
  measurements?: OpenAQMeasurement[];
  lastUpdated?: string;
}

interface OpenAQLocationsEnvelope {
  results?: OpenAQLocation[];
}

/**
 * Fetch OpenAQ locations within `radiusMetres` of a coordinate, ordered by
 * distance upstream. Returns `[]` on any failure — callers treat an empty
 * result as "source unavailable" and fall through.
 */
export async function fetchOpenAQLocations(
  apiKey: string,
  lat: number,
  lng: number,
  limit = 10,
  radiusMetres = 25_000,
): Promise<OpenAQLocation[]> {
  const url = new URL("https://api.openaq.org/v2/locations");
  url.searchParams.set("coordinates", `${lat},${lng}`);
  url.searchParams.set("radius", String(radiusMetres));
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("order_by", "distance");

  try {
    const res = await fetch(url.toString(), {
      headers: { "X-API-Key": apiKey, Accept: "application/json" },
    });
    if (!res.ok) {
      console.warn("[openaq] HTTP", res.status);
      return [];
    }
    const data = (await res.json()) as OpenAQLocationsEnvelope;
    return Array.isArray(data.results) ? data.results : [];
  } catch (err) {
    console.warn("[openaq] fetch failed:", err);
    return [];
  }
}

/** Map OpenAQ parameter aliases onto the keys recognised by nqi.ts. */
function toConcentrations(measurements: OpenAQMeasurement[] | undefined): PollutantConcentration {
  const out: PollutantConcentration = {};
  for (const m of measurements ?? []) {
    if (typeof m.value !== "number" || !Number.isFinite(m.value)) continue;
    switch (m.parameter.toLowerCase()) {
      case "pm25":
      case "pm2.5":
        out.pm25 = m.value;
        break;
      case "pm10":
        out.pm10 = m.value;
        break;
      case "no2":
        out.no2 = m.value;
        break;
      case "so2":
        out.so2 = m.value;
        break;
      case "co":
        out.co = m.value;
        break;
      case "o3":
      case "ozone":
        out.o3 = m.value;
        break;
    }
  }
  return out;
}

/** The most recent UTC timestamp across a location's measurements. */
function latestUtc(measurements: OpenAQMeasurement[] | undefined): string | null {
  let newest: number | null = null;
  for (const m of measurements ?? []) {
    const raw = m.date?.utc;
    if (!raw) continue;
    const t = Date.parse(raw);
    if (!Number.isFinite(t)) continue;
    if (newest === null || t > newest) newest = t;
  }
  return newest === null ? null : new Date(newest).toISOString();
}

/**
 * Build a StationObservation from one OpenAQ location. Returns null when the
 * location has no usable pollutant readings — we never emit empty stations.
 */
export function buildOpenAQStation(
  loc: OpenAQLocation,
  qLat: number,
  qLng: number,
): StationObservation | null {
  const concentrations = toConcentrations(loc.measurements);
  if (Object.keys(concentrations).length === 0) return null;

  const measurement_timestamp = latestUtc(loc.measurements) ?? loc.lastUpdated ?? null;
  if (!measurement_timestamp) return null; // no timestamp ⇒ cannot assess freshness

  const distM = haversineMetres(qLat, qLng, loc.coordinates.latitude, loc.coordinates.longitude);
  return {
    station_id: `openaq:${loc.location}`,
    station_name: loc.location,
    source: "openaq",
    attribution: [loc.city, loc.country].filter(Boolean).join(", ") || "OpenAQ",
    concentrations,
    measurement_timestamp,
    reliability: "Measured",
    distance_km: Number((distM / 1000).toFixed(3)),
  };
}
