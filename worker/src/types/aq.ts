import type { PollutantConcentration } from "../lib/nqi.js";

// ---------------------------------------------------------------------------
// Shared response shapes used throughout this phase. Kept lightweight because
// the worker is pure Edge/TS; no heavy DTO libraries.
// ---------------------------------------------------------------------------

export type Reliability = "Measured" | "Estimated" | "Unavailable";

export interface StationObservation {
  /** Stable, canonical id as provided by the upstream provider. */
  station_id: string;
  /** Human-readable name. */
  station_name: string;
  /** Provider origin (openaq | cpcb). */
  source: string;
  /** URL/label pointing back to the original report if available. */
  attribution?: string;
  /** Optional administrative locality (city) when available from upstream. */
  city?: string;
  /** Optional state/union-territory when available from upstream. */
  state?: string;
  /** Pollutant readings. Keys are lowercase aliases recognised by nqi.ts. */
  concentrations: PollutantConcentration;
  /** When the measuring instrument logged the reading (ISO-8601). */
  measurement_timestamp: string;
  /** How fresh / trustworthy the datum is. */
  reliability: Reliability;
  /** Distance from the caller-supplied query lat/lng, in km (rounded to 3 dp). */
  distance_km: number;
}

export interface AQResponse {
  /** Query position echoed back so the client can confirm locality. */
  latitude: number;
  longitude: number;
  /** Fetched-at wall-clock timestamp (UTC ISO-8601). Different from measurement_timestamp. */
  fetched_at: string;
  /** Null only when every source returned nothing usable. */
  primary: StationObservation | null;
  /** Supplementary candidates (sorted ascending by distance). May include stale fallbacks. */
  alternatives: StationObservation[];
  /** NAQI summary computed from the primary station's concentrations. */
  _meta?: {
    naqi: number;
    subIndices: Record<string, number>;
    category: { label: string; color: string };
    /** City/state of the query point (prefilled when primary provides them). */
    locality?: string;
  };
}
