import type { PollutantConcentration, ConcentrationMetadata } from "../nqi.js";
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

/**
 * Built-in coordinate fallback for major Indian CPCB/SPCB stations that are
 * missing lat/lng in the data.gov.in feed (e.g. Kasturi Nagar, various Delhi
 * stations). Keys are lowercased station names; values are {lat, lng} tuples.
 */
const STATION_COORDINATE_DICT: Record<string, { lat: number; lng: number }> = {
  // ── Bengaluru ──────────────────────────────────────────────────────────────
  "bapuji nagar":            { lat: 13.0157, lng: 77.5667 },
  "jayanagar 5th block":     { lat: 12.9255, lng: 77.5803 },
  "hombegowda nagar":        { lat: 12.9780, lng: 77.5900 },
  "silk board":              { lat: 12.9167, lng: 77.6133 },
  "btm layout":              { lat: 12.9105, lng: 77.6100 },
  "hebbal":                  { lat: 13.0358, lng: 77.5978 },
  "peenya":                  { lat: 13.0244, lng: 77.4936 },
  "kasturi nagar":           { lat: 12.9492, lng: 77.5988 },
  "bwssb kadabesanahalli":   { lat: 12.9930, lng: 77.6500 },
  "rvce-mailasandra":        { lat: 12.9022, lng: 77.6631 },
  "malleshwaram":            { lat: 13.0030, lng: 77.5750 },
  "ranipur":                 { lat: 12.9680, lng: 77.5850 },
  "basavanagudi":            { lat: 12.9410, lng: 77.5740 },
  // ── Delhi ──────────────────────────────────────────────────────────────────
  "rohini":                  { lat: 28.7320, lng: 77.1200 },
  "dtu":                     { lat: 28.7500, lng: 77.1200 },
  "punjabi bagh":            { lat: 28.6500, lng: 77.1300 },
  "rk puram":                { lat: 28.5650, lng: 77.1900 },
  "dwarka":                  { lat: 28.5900, lng: 77.0400 },
  "jahangirpuri":            { lat: 28.7250, lng: 77.1600 },
  "madhya marg":             { lat: 28.5900, lng: 77.1950 },
  "rani khera":              { lat: 28.6600, lng: 77.0700 },
  "shahdara":                { lat: 28.6680, lng: 77.2980 },
  "ankleshwar":              { lat: 28.6900, lng: 77.1000 },
  // ── Mumbai ─────────────────────────────────────────────────────────────────
  "andheri":                 { lat: 19.1136, lng: 72.8697 },
  "bandra":                  { lat: 19.0596, lng: 72.8464 },
  "bmc":                     { lat: 18.9388, lng: 72.8354 },
  "charkop":                 { lat: 19.1600, lng: 72.8100 },
  "kolhapur":                { lat: 16.7050, lng: 74.2433 },
  "mantor":                  { lat: 19.0000, lng: 72.8300 },
  "nagpada":                 { lat: 18.9500, lng: 72.8400 },
  "ranson":                  { lat: 19.0100, lng: 72.8500 },
  "worli":                   { lat: 19.0176, lng: 72.8150 },
  // ── Chennai ────────────────────────────────────────────────────────────────
  "ambattur":                { lat: 13.1143, lng: 80.2340 },
  "avadi":                   { lat: 13.1144, lng: 80.0997 },
  "chennai central":         { lat: 13.0827, lng: 80.2707 },
  "kodambakkam":             { lat: 13.0480, lng: 80.2200 },
  "madhavaram":              { lat: 13.1200, lng: 80.2650 },
  "medavakkam":              { lat: 12.9370, lng: 80.2440 },
  "mylapore":                { lat: 13.0340, lng: 80.2640 },
  // ── Hyderabad ──────────────────────────────────────────────────────────────
  "aphson high school":      { lat: 17.3850, lng: 78.4867 },
  "bolarum":                 { lat: 17.5300, lng: 78.4200 },
  "chaudry hospital":        { lat: 17.3700, lng: 78.4900 },
  "dilsukhnagar":            { lat: 17.3712, lng: 78.4082 },
  "gb road":                 { lat: 17.3753, lng: 78.4744 },
  "jamai osmania":           { lat: 17.3700, lng: 78.4750 },
  "kuskumpet":               { lat: 17.3800, lng: 78.4800 },
  "lc colon":                { lat: 17.3750, lng: 78.4700 },
  "mehdipatnam":             { lat: 17.3600, lng: 78.4400 },
  "musheerabad":             { lat: 17.3900, lng: 78.4700 },
  "secunderabad":            { lat: 17.4350, lng: 78.5000 },
  "vanasthalipuram":         { lat: 17.3200, lng: 78.5300 },
  // ── Kolkata ────────────────────────────────────────────────────────────────
  "bakshi bazar":            { lat: 22.5670, lng: 88.3700 },
  "bhawanipur":              { lat: 22.5350, lng: 88.3550 },
  "fort william":            { lat: 22.5580, lng: 88.3400 },
  "jadavpur":                { lat: 22.4980, lng: 88.3680 },
  "park street":             { lat: 22.5450, lng: 88.3550 },
  "raja scandia":            { lat: 22.5600, lng: 88.3600 },
};

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
 * CPCB CO values arrive as pre-computed 0–500 NAQI sub-indices, so we flag
 * them via concentrationMeta.coIsSubIndex to skip breakpoint recalculation.
 */
export function buildCPCBStation(bucket: CPCBRecord[], qLat: number, qLng: number): StationObservation | null {
  if (bucket.length === 0) return null;
  const head = bucket[0];

  const latStr = String(head.latitude ?? "").trim();
  const lngStr = String(head.longitude ?? "").trim();
  let lat = parseFloat(latStr);
  let lng = parseFloat(lngStr);

  // Fall back to built-in coordinate dictionary when raw lat/lng are absent.
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    const lookupName = String(head.station ?? "").toLowerCase().trim();
    const fallback = STATION_COORDINATE_DICT[lookupName];
    if (fallback) {
      lat = fallback.lat;
      lng = fallback.lng;
    } else {
      return null;
    }
  }

  // Resolve pollutant concentrations from whichever buckets contain them.
  const concentrations: PollutantConcentration = {};
  let hasCoReading = false;
  for (const [key, pid] of POLLUTANT_COLUMNS) {
    const match = bucket.find((r) => r.pollutant_id?.toUpperCase() === pid.toUpperCase());
    const val = match ? parseVal(match.avg_value) : undefined;
    if (val !== undefined) {
      concentrations[key as keyof PollutantConcentration] = val;
      if (key === "co") hasCoReading = true;
    }
  }
  if (Object.keys(concentrations).length === 0) return null; // nothing to report

  // CPCB reports CO avg_value as a pre-broken-down 0–500 NAQI sub-index.
  // Mark it so toNAQI uses it directly without re-applying breakpoints.
  const concentrationMeta: ConcentrationMetadata | undefined = hasCoReading
    ? { coIsSubIndex: true }
    : undefined;

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
    concentrationMeta,
    measurement_timestamp: new Date(parsedTs).toISOString(),
    reliability: "Measured",
    distance_km: Number((distM / 1000).toFixed(3)),
  };
}
