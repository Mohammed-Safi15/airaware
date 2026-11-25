import type { PollutantConcentration } from "../nqi.js";
import type { StationObservation } from "../../types/aq.js";
import { haversineMetres } from "../haversine.js";

// ---------------------------------------------------------------------------
// CPCB (Central Pollution Control Board) adapter — data.gov.in resource API
// ---------------------------------------------------------------------------
// data.gov.in exposes one ROW PER POLLUTANT per station per reading cycle.
// Each record carries: station, last_update, latitude, longitude, pollutant_id,
// avg_value (string, possibly "NA"). We must group-then-pivot by station before
// building StationObservations.
// ---------------------------------------------------------------------------

export interface CPCBRecord {
  station?: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: string | number;
  longitude?: string | number;
  last_update?: string; // DD-MM-YYYY HH:MM:SS
  pollutant_id?: string; // PM2.5, PM10, NO2, SO2, CO, O3 …
  min_value?: string;
  max_value?: string;
  avg_value?: string; // "NA" means no reading today
  [key: string]: unknown;
}

interface CPCBEnvelope {
  records?: CPCBRecord[];
}

const CPCB_RESOURCE_ID = "3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69";

const POLLUTANT_COLUMNS: Array<[string, string]> = [
  ["pm25", "PM2.5"],
  ["pm10", "PM10"],
  ["no2", "NO2"],
  ["so2", "SO2"],
  ["co", "CO"],
  ["o3", "O3"],
];

/** Parse a floating-point value from a string; returns undefined on "NA"/blank/NaN. */
function parseVal(s?: string): number | undefined {
  if (!s || s.trim() === "" || s.toUpperCase() === "NA") return undefined;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : undefined;
}

/** Parse CPCB's DD-MM-YYYY HH:MM:SS timestamp format.
 * JS Date.parse() does not recognise this format natively.
 * Returns milliseconds-since-unix-epoch or NaN. */
function parseCPCBTimestamp(s?: string): number {
  if (!s || typeof s !== "string") return NaN;
  const trimmed = s.trim();
  if (trimmed.toUpperCase() === "NA") return NaN;
  // Expected format: DD-MM-YYYY HH:MM:SS
  const m = trimmed.match(/^(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2}):(\d{2})$/);
  if (!m) return NaN;
  const [, dd, MM, yyyy, HH, mm, ss] = m;
  // JS months are 0-indexed
  const date = new Date(+yyyy, Number(MM) - 1, +dd, +HH, +mm, +ss);
  // Verify roundtrip: year must not be 1970 (malformed dates give 1970)
  if (date.getFullYear() < 1970) return NaN;
  return date.getTime();
}

/**
 * Group raw CPCB rows (one per pollutant) into per-station objects so we can
 * emit one StationObservation per station. Uses station+city as the dedup key
 * because two records for the same station sharing last_update represent one
 * reading cycle.
 */
export function groupByStation(records: CPCBRecord[]): CPCBRecord[][] {
  const groups = new Map<string, CPCBRecord[]>();
  for (const rec of records) {
    const key = `${String(rec.station ?? "")}|${String(rec.city ?? "")}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(rec);
  }
  return [...groups.values()].filter((g) => g.length > 0);
}

export async function fetchCPCBRecords(apiKey: string, limit: number = 2000): Promise<CPCBRecord[]> {
  const url = new URL(`https://api.data.gov.in/resource/${CPCB_RESOURCE_ID}`);
  url.searchParams.set("api-key", apiKey);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", String(limit));

  const allRecords: CPCBRecord[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    url.searchParams.set("offset", String(offset));

    try {
      const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
      if (!res.ok) {
        console.warn("[cpcb] HTTP", res.status);
        break;
      }
      const data = (await res.json()) as CPCBEnvelope;
      const records = Array.isArray(data.records) ? data.records : [];

      if (records.length === 0) {
        hasMore = false;
      } else {
        allRecords.push(...records);
        offset += records.length;
        // If we got fewer results than we requested, assume we're at the end
        if (records.length < limit) {
          hasMore = false;
        }
      }
    } catch (err) {
      console.warn("[cpcb] fetch failed at offset", offset, ":", err);
      break;
    }
  }

  return allRecords;
}

/**
 * Build a single StationObservation from a bucket of CPCB rows that share a
 * station. Never substitutes zero for a missing pollutant (PRD guardrail).
 */
export function buildCPCBStation(bucket: CPCBRecord[], qLat: number, qLng: number): StationObservation | null {
  if (bucket.length === 0) return null;
  const head = bucket[0];

  const latStr = String(head.latitude ?? "").trim();
  const lngStr = String(head.longitude ?? "").trim();
  const lat = parseFloat(latStr);
  const lng = parseFloat(lngStr);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  // Resolve pollutant concentrations from whichever buckets contain them.
  const concentrations: PollutantConcentration = {};
  for (const [key, pid] of POLLUTANT_COLUMNS) {
    const match = bucket.find((r) => r.pollutant_id?.toUpperCase() === pid.toUpperCase());
    const val = match ? parseVal(match.avg_value) : undefined;
    if (val !== undefined) concentrations[key as keyof PollutantConcentration] = val;
  }
  if (Object.keys(concentrations).length === 0) return null; // nothing to report

  // Parse DD-MM-YYYY HH:MM:SS (Indian national standard format used by CPCB).
  // JS Date.parse does NOT recognise this format — manual parse is required.
  const parsedTs = parseCPCBTimestamp(head.last_update);
  if (!Number.isFinite(parsedTs)) return null; // never fabricate a timestamp

  const name = String(head.station ?? "Unknown CPCB station");
  const distM = haversineMetres(qLat, qLng, lat, lng);
  return {
    station_id: `cpcb:${name}`,
    station_name: name,
    source: "cpcb",
    attribution: [head.city, head.state].filter(Boolean).join(", ") || "CPCB",
    city: head.city || undefined,
    state: head.state || undefined,
    concentrations,
    measurement_timestamp: new Date(parsedTs).toISOString(),
    reliability: "Measured",
    distance_km: Number((distM / 1000).toFixed(3)),
  };
}
