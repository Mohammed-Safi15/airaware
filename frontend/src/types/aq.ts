/** Response shape from /api/aqi — mirrors worker/src/types/aq.ts */
export type Reliability = "Measured" | "Estimated" | "Unavailable";

export interface ConcentrationMetadata {
  /** true when CPCB reported CO as a pre-computed 0–500 NAQI sub-index */
  coIsSubIndex?: boolean;
}

export interface PollutantConcentration {
  [key: string]: number;
}

export interface StationObservation {
  station_id: string;
  station_name: string;
  source: string;
  attribution?: string;
  /** Optional city extracted from upstream. */
  city?: string;
  /** Optional state extracted from upstream. */
  state?: string;
  concentrations: PollutantConcentration;
  /** Source-specific metadata (e.g. CPCB marks CO as pre-sub-indexed). */
  concentrationMeta?: ConcentrationMetadata;
  measurement_timestamp: string;
  reliability: Reliability;
  distance_km: number;
  /** IDW-weighted AQI estimate across nearby stations (populated by dashboard). */
  idw_aqi?: number;
  /** List of station IDs contributing to the IDW estimate. */
  idw_contributors?: string[];
}

export interface AQResponse {
  latitude: number;
  longitude: number;
  fetched_at: string;
  primary: StationObservation | null;
  alternatives: StationObservation[];
  _meta?: {
    naqi: number;
    subIndices: Record<string, number>;
    category: { label: string; color: string };
    locality?: string;
    /** US EPA AQI computed alongside Indian NAQI. */
    usAqi?: number;
    usAqiCategory?: { label: string; color: string };
  };
}
