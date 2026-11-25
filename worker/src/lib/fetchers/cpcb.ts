import type { PollutantConcentration } from "../nqi.js";
import type { StationObservation } from "../../types/aq.js";
import { haversineMetres } from "../haversine.js";

// ---------------------------------------------------------------------------
// CPCB (Central Pollution Control Board) adapter — data.gov.in resource API
// ---------------------------------------------------------------------------
// data.gov.in exposes CPCB station readings as resource records, e.g.:
//   https://api.data.gov.in/resource/<resource-id>?api-key=<key>&format=json&limit=N
// Each record is one station observation with pollutant columns rather than
// one row per parameter. We read both camelCase and lower-case column names
// defensively because the resource schema has changed across revisions.
// ---------------------------------------------------------------------------

/** One record from the CPCB resource feed. Fields are case-insensitive-ish. */
export interface CPCBRecord {
  station?: string;
  station_name?: string;
  city?: string;
  latitude?: number | string;
  longitude?: number | string;
  last_update?: string;
  pm2_5?: number | string;
  pm10?: number | string;
  no2?: number | string;
  so2?: number | string;
  co?: number | string;
  ozone?: number | string;
  [key: string]: unknown;
}

interface CPCBEnvelope {
  records?: CPCBRecord[];
}

/** Default data.gov.in resource id for live CPCB station data. */
const CPCB_RESOURCE_ID = "3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69";

/**
 * Fetch CPCB station records near a coordinate.
 *
 * The data.gov.in resource API has no geo filter, so we pull a bounded page
 * and let the caller's Haversine step select the nearest stations. Returns
 * `[]` on any failure.
 */
export async function fetchCPCBRecords(
  apiKey: string,
  limit = 200,
): Promise<CPCBRecord[]> {
  const url = new URL(`https://api.data.gov.in/resource/${CPCB_RESOURCE_ID}`);
  url.searchParams.set("api-key", apiKey);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", String(limit));

  try {
    const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
    if (!res.ok) {
      console.warn("[cpcb] HTTP", res.status);
      return [];
    }
    const data = (await res.json()) as CPCBEnvelope;
    return Array.isArray(data.records) ? data.records : [];
  } catch (err) {
    console.warn("[cpcb] fetch failed:", err);
    return [];
  }
}

function pickNumber(rec: CPCBRecord, ...keys: string[]): number | undefined {
  for (const key of keys) {
    const raw = rec[key];
    if (raw === null || raw === undefined || raw === "") continue;
    const n = typeof raw === "number" ? raw : parseFloat(String(raw));
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

function toConcentrations(rec: CPCBRecord): PollutantConcentration {
  const out: PollutantConcentration = {};
  const pm25 = pickNumber(rec, "pm2_5", "pm25", "PM2.5", "PM2_5");
  const pm10 = pickNumber(rec, "pm10", "PM10");
  const no2 = pickNumber(rec, "no2", "NO2");
  const so2 = pickNumber(rec, "so2", "SO2");
  const co = pickNumber(rec, "co", "CO");
  const o3 = pickNumber(rec, "ozone", "o3", "OZONE", "O3");
  if (pm25 !== undefined) out.pm25 = pm25;
  if (pm10 !== undefined) out.pm10 = pm10;
  if (no2 !== undefined) out.no2 = no2;
  if (so2 !== undefined) out.so2 = so2;
  if (co !== undefined) out.co = co;
  if (o3 !== undefined) out.o3 = o3;
  return out;
}

/**
 * Build a StationObservation from one CPCB record. Returns null when the
 * record has no coordinates, no pollutant data, or no timestamp.
 */
export function buildCPCBStation(
  rec: CPCBRecord,
  qLat: number,
  qLng: number,
): StationObservation | null {
  const lat = pickNumber(rec, "latitude", "Latitude", "lat");
  const lng = pickNumber(rec, "longitude", "Longitude", "lng", "lon");
  if (lat === undefined || lng === undefined) return null;

  const concentrations = toConcentrations(rec);
  if (Object.keys(concentrations).length === 0) return null;

  const rawTs = rec.last_update ?? rec.lastUpdate ?? rec.last_updated;
  const parsedTs = rawTs ? Date.parse(String(rawTs)) : NaN;
  if (!Number.isFinite(parsedTs)) return null; // never fabricate a timestamp

  const name = String(rec.station ?? rec.station_name ?? "Unknown CPCB station");
  const distM = haversineMetres(qLat, qLng, lat, lng);
  return {
    station_id: `cpcb:${name}`,
    station_name: name,
    source: "cpcb",
    attribution: ["CPCB", rec.city].filter(Boolean).join(" · "),
    concentrations,
    measurement_timestamp: new Date(parsedTs).toISOString(),
    reliability: "Measured",
    distance_km: Number((distM / 1000).toFixed(3)),
  };
}
